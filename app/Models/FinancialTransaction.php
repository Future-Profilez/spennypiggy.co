<?php

namespace App\Models;

use App\Jobs\EvaluateGrowthBonusForCreator;
use App\Models\Concerns\FreezesLedgerFx;
use App\Services\Discovery\AttributionService;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

class FinancialTransaction extends Model
{
    use FreezesLedgerFx, HasFactory, SoftDeletes;

    protected $fillable = [
        'platform_fee_rate',
        'compliance_fee_rate',
        /*
         * 🚨 THESE TWO WERE EMITTED BY `Helpers::feeRateColumns()` AND DROPPED
         * SILENTLY ON EVERY WRITE until 12 Sep 2026, because they were never in
         * this list. Measured then: 0 of 225 rows populated across all four
         * payment tables.
         *
         * What it cost: `Helpers::storedFeeRates()` reads `stripe_fee_rate`,
         * finds null and falls back to `LEGACY_CARD_STRIPE_RATE` (2.9%) — while
         * the configured card estimate has been 3.4% since 11 Aug 2026. So every
         * card sale since then is RE-COST 0.5pp cheap, understating Stripe's cost
         * and overstating the platform's margin on the screens the platform reads
         * its own margin from. Nothing errors.
         *
         * ⚠️ SAFE TO MAKE FILLABLE ONLY BECAUSE THE RECOMPUTE RE-COSTS FROM THE
         * ROW'S OWN FROZEN RATES. `finance:sync-transactions` builds its
         * breakdown from `Helpers::storedFeeRates($payment)` — the SOURCE row's
         * stored values — so a historic row is written back with what it already
         * had, never with today's configured rate. If a recompute is ever changed
         * to read config directly, this becomes the way history gets restated.
         *
         * ⚠️ FORWARD ONLY, DELIBERATELY. Rows charged between 11 Aug and 12 Sep
         * 2026 keep the 2.9% fallback and stay 0.5pp understated. Backfilling
         * them would write recorded economics from an inference, which is the one
         * thing the fee columns exist to avoid; making them TRUE means reading
         * Stripe's own balance transactions, and that is a separate decision.
         */
        'stripe_fee_rate',
        'stripe_fixed_fee',
        'fee_source',
        'fee_override_id',
        'compliance_fee',
        'admin_fee',
        'fee_profile',
        'discovery_source',
        'discovery_class',
        'uuid',
        'user_id',
        'supporter_id',
        'source_type',
        'source_id',
        'type',
        'gross_amount',
        'platform_fee',
        'stripe_fee',
        'vat_amount',
        'net_amount',
        'reserve_amount',
        'reserve_status',
        'payout_run_id',
        'reserve_released_at',
        'reserve_payout_id',
        'currency',
        'gbp_amount',
        'gbp_rate',
        'refunded_amount',
        'status',
        'description',
        'transaction_date',
    ];

    protected $casts = [
        'transaction_date' => 'datetime',
        'reserve_released_at' => 'datetime',
        'gross_amount' => 'decimal:2',
        'platform_fee' => 'decimal:2',
        'stripe_fee' => 'decimal:2',
        'compliance_fee' => 'decimal:2',
        'admin_fee' => 'decimal:2',
        'vat_amount' => 'decimal:2',
        'net_amount' => 'decimal:2',
        'gbp_amount' => 'decimal:2',
        'refunded_amount' => 'decimal:2',
        /*
         * 🚨 `processor_cost*` ARE CAST BUT NOT FILLABLE, in either app.
         *
         * They are what Stripe reported it actually cost to take the money —
         * a fact read off a balance transaction, not something a form, a back
         * office or a re-sync may assert. `finance:record-processor-cost`
         * writes them through the query builder; anything that can
         * mass-assign a processor cost can restate the platform's own margin.
         */
        'processor_cost' => 'decimal:2',
        'processor_cost_recorded_at' => 'datetime',
    ];

    protected static function boot()
    {
        parent::boot();

        static::creating(function ($model) {
            if (empty($model->uuid)) {
                $model->uuid = (string) Str::uuid();
            }
        });

        /*
         * Discovery Phase 1 — stamp the ledger row with the source that earned it.
         *
         * 🚨 WRAPPED, AND NEVER ALLOWED TO THROW. This runs inside the checkout
         * path; a supporter must never lose a purchase because attribution
         * failed. `AttributionService` wraps its own body too — this is the
         * second belt.
         *
         * ⚠️ TWO SOURCES, IN THIS ORDER, AND THIS IS THE ONLY PLACE EITHER IS
         * READ — a dozen call sites write ledger rows and none of them should
         * have to remember analytics:
         *
         *   1. The visitor's `sp_disc` cookie, where a browser is present. That
         *      is a redirect-completed purchase.
         *   2. The payment's own Stripe metadata, where one is not. A row
         *      written by a Stripe WEBHOOK or by `finance:sync-transactions` has
         *      no browser attached, and bank payments (SEPA/ACH) settle
         *      asynchronously — so they are ALWAYS case 2. The webhook remembers
         *      the event's metadata for the request
         *      (`AttributionService::rememberPaymentMetadata()`) and this hook
         *      reads it back.
         *
         * ⚠️ Attribution is claimed atomically inside `AttributionService`, so
         * whichever path gets there first wins and a retried webhook or a resync
         * neither overwrites the source nor duplicates the purchase event.
         */
        static::created(function ($model) {
            try {
                if ($model->type !== 'income') {
                    return;
                }

                $service = app(AttributionService::class);

                // 1. A browser with the visitor's cookie.
                if (! app()->runningInConsole() && app()->bound('request') && request()->cookies !== null) {
                    if ($service->attributeTransaction($model, request()) !== null) {
                        return;
                    }
                }

                // 2. No browser — the source rode in on the payment.
                $metadata = AttributionService::ambientMetadata();

                if ($metadata !== []) {
                    $service->attributeTransactionFromMetadata($model, $metadata);
                }
            } catch (\Throwable $e) {
                Log::warning('Discovery: ledger attribution hook failed', [
                    'transaction' => $model->getKey(),
                    'error' => $e->getMessage(),
                ]);
            }
        });

        /*
         * Growth Bonus — re-evaluate the creator as soon as a sale lands.
         *
         * 🚨 A SEPARATE HOOK, NOT FOLDED INTO THE ATTRIBUTION ONE ABOVE. That
         * block `return`s early at three points once it has attributed the row,
         * so anything appended to it would be skipped for most transactions —
         * the majority, in fact, since an attributed row is the normal case.
         *
         * ⚠️ Queued, never inline. This runs inside a Stripe webhook and inside
         * `finance:sync-transactions`; a full per-creator ledger recompute there
         * would add seconds to a payment path on a 60-second Lambda. The job is
         * unique per creator for two minutes, so a basket writing five rows
         * queues one evaluation.
         *
         * ⚠️ `created` only. A resync uses `updateOrCreate`, so an existing row
         * fires `updated` instead — deliberately not hooked, or every sync pass
         * would re-queue the whole platform. The daily command covers that.
         *
         * 🚨 Nothing here may throw: a bonus that fails to refresh must never
         * fail the ledger write that pays the creator.
         */
        static::created(function ($model) {
            try {
                if ($model->type !== 'income' || ! config('growth_bonus.enabled', false)) {
                    return;
                }

                EvaluateGrowthBonusForCreator::dispatch((int) $model->user_id)
                    ->delay(now()->addSeconds(20));
            } catch (\Throwable $e) {
                Log::warning('Growth Bonus: could not queue instant evaluation', [
                    'transaction' => $model->getKey(),
                    'error' => $e->getMessage(),
                ]);
            }
        });

        // Money-ledger invariant: once a reserve is 'released' (paid back to the creator),
        // it can never be reverted to 'held'. This protects against SyncFinancialTransactions
        // (updateOrCreate) clobbering an already-released reserve, which would otherwise let the
        // reserve:release command pay the same reserve a second time.
        static::updating(function ($model) {
            if (
                $model->isDirty('reserve_status')
                && $model->getOriginal('reserve_status') === 'released'
                && $model->reserve_status !== 'released'
            ) {
                $model->reserve_status = 'released';
                $model->reserve_released_at = $model->getOriginal('reserve_released_at');
                // Without this, a resync that nulls reserve_payout_id leaves the row 'released'
                // with no link to its Stripe payout — and the payout.failed revert, which matches
                // on reserve_payout_id, can then never re-hold it.
                $model->reserve_payout_id = $model->getOriginal('reserve_payout_id');
            }

            // Reserve MONEY is equally immutable once the row has been paid out or released.
            // determineReserve() in SyncFinancialTransactions recomputes reserve_amount from the
            // creator's CURRENT risk percent, so raising a creator to 20% today would otherwise
            // rewrite historical rows and hand reserve:release a reserve that was never withheld.
            $isSettled = $model->getOriginal('reserve_status') === 'released'
                || ! empty($model->getOriginal('payout_run_id'));

            if ($isSettled && $model->isDirty('reserve_amount')) {
                $model->reserve_amount = $model->getOriginal('reserve_amount');
            }
        });
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function supporter()
    {
        return $this->belongsTo(User::class, 'supporter_id');
    }

    public function source()
    {
        return $this->morphTo();
    }
}
