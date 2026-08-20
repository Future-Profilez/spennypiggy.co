<?php

namespace App\Models;

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
