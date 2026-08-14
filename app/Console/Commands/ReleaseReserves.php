<?php

namespace App\Console\Commands;

use App\Helpers;
use App\Models\Currency;
use App\Models\FinancialTransaction;
use App\Models\PayoutRecord;
use App\Models\ShopPayment;
use App\Models\TaskPurchase;
use App\Models\User;
use App\StripeControl;
use Carbon\Carbon;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Log;

/**
 * Releases held reserves on a rolling, per-transaction window: each transaction's
 * reserve is paid back to the creator 30 days after its OWN transaction_date,
 * regardless of when the base earning was paid out.
 *
 * This replaces the old run-level reserve release that was coupled to the weekly
 * payout, which caused held reserves to vanish from the creator's view as soon as
 * the base payment was paid out.
 */
class ReleaseReserves extends Command
{
    protected $signature = 'reserve:release {--dry-run : Show what would be released without paying out}';

    protected $description = 'Release held reserves 30 days after each transaction date (per-transaction rolling window)';

    /**
     * How long each reserve is held, counted from its OWN transaction date.
     *
     * ⚠️ NOT the same thing as ReservePolicy's onboarding window. That one
     * decides how long a creator is on the new-creator RATE; this one decides
     * how long each individual reserve is held. Two clocks, both around 30 days,
     * and conflating them is exactly what made the help centre say "new creators
     * are on 10% for their first 2 days" — which reads as the money being held
     * for two days, and is wrong on both counts.
     *
     * Public so App\Support\HelpTokens can quote it rather than an article
     * typing "30" by hand.
     */
    public const RESERVE_RELEASE_WINDOW_DAYS = 30;

    private const MINIMUM_PAYOUT_MINOR = 100; // £1.00 / $1.00 — accumulate below this

    public function handle(): int
    {
        $dryRun = (bool) $this->option('dry-run');
        $cutoff = now()->subDays(self::RESERVE_RELEASE_WINDOW_DAYS);

        $this->info('Releasing reserves held before '.$cutoff->toDateString().($dryRun ? ' (DRY RUN)' : ''));

        $rates = Currency::rates();
        $convert = function ($amount, $from, $to) use ($rates) {
            $from = strtoupper($from ?: 'GBP');
            $to = strtoupper($to ?: 'GBP');
            if ($from === $to) {
                return $amount;
            }
            if (! isset($rates[$from]) || ! isset($rates[$to])) {
                return $amount;
            }

            return ($amount / $rates[$from]) * $rates[$to];
        };

        $dueFts = FinancialTransaction::query()
            ->where('type', 'income')
            ->where('status', 'completed')
            ->where('reserve_status', 'held')
            ->where('reserve_amount', '>', 0)
            ->whereNotNull('transaction_date')
            ->where('transaction_date', '<=', $cutoff)
            ->with(['source' => function ($morphTo) {
                $morphTo->morphWith([
                    TaskPurchase::class => ['task'],
                    ShopPayment::class => ['shop', 'deliverable'],
                ]);
            }])
            ->get();

        // Drop reserves for still-unfulfilled physical shop items / timed tasks — same
        // fulfillment gate used by getHeldReserves / calculatePayouts.
        $dueFts = $dueFts->filter(function ($ft) {
            if ($ft->source_type === TaskPurchase::class && $ft->source) {
                $taskType = $ft->source->task->type ?? 'timed';
                if ($taskType === 'timed' && ! in_array($ft->source->status, ['completed', 'completed_accepted', 'paid_out'])) {
                    return false;
                }
            }
            if ($ft->source_type === ShopPayment::class && $ft->source && $ft->source->shop) {
                if ($ft->source->shop->type === 'physical') {
                    if (! $ft->source->deliverable || $ft->source->deliverable->status !== 'delivered') {
                        return false;
                    }
                }
            }

            return true;
        });

        $byCreator = $dueFts->groupBy('user_id');
        $releasedCreators = 0;
        $releasedTotalMinor = 0;

        foreach ($byCreator as $userId => $fts) {
            $creator = User::find($userId);
            if (! $creator) {
                Log::warning("reserve:release — creator (user id {$userId}) not found; skipping ".$fts->count().' reserves.');

                continue;
            }

            // Same gate calculatePayouts() applies (`whereNull('users.payout_paused_at')`).
            // Without it a creator paused mid-investigation still receives, every single day,
            // exactly the reserve the pause exists to withhold.
            if (! empty($creator->payout_paused_at)) {
                Log::info("reserve:release — creator {$creator->uuid} has payouts paused; leaving ".$fts->count().' reserve(s) held.');

                continue;
            }

            if ((int) ($creator->suspended_account ?? 0) === 1) {
                Log::info("reserve:release — creator {$creator->uuid} is suspended; leaving ".$fts->count().' reserve(s) held.');

                continue;
            }

            $currency = strtolower((string) ($creator->default_currency ?? 'gbp'));

            $amountMinor = 0;
            foreach ($fts as $ft) {
                $ftCurrency = strtolower((string) ($ft->currency ?: 'gbp'));
                $converted = $convert((float) $ft->reserve_amount, $ftCurrency, $currency);
                // Zero-decimal currencies (JPY/KRW…) have no minor unit — a blind ×100 would
                // release 100x the reserve.
                $amountMinor += Helpers::toMinorUnits($converted, $currency);
            }

            if ($amountMinor < self::MINIMUM_PAYOUT_MINOR) {
                // Leave held to accumulate; they remain due and will release once above threshold.
                continue;
            }

            $isZeroDecimal = Helpers::isZeroDecimalCurrency($currency);
            $amountMajor = $isZeroDecimal ? (int) $amountMinor : round($amountMinor / 100, 2);

            if ($dryRun) {
                $this->line("  {$creator->name}: would release {$amountMajor} {$currency} ({$fts->count()} reserves)");

                continue;
            }

            if (! $creator->account_id) {
                Log::warning("reserve:release — creator {$creator->uuid} has no connected Stripe account; skipping.");

                continue;
            }

            // Content-derived idempotency key: pinned to the EXACT set of reserves being
            // released, NOT the date. A retry of the same set returns the same Stripe payout
            // (no double pay); a different set always gets its own key (no lost release).
            $ftIds = $fts->pluck('id')->sort()->values();
            $idempotencyKey = 'reserve_release_'.$creator->uuid.'_'.md5($ftIds->implode(','));

            // SELF-HEAL, and the reason this check must exist: a Stripe idempotency key only
            // lives for 24h, and this command runs every 24h. If yesterday's Stripe payout
            // succeeded but the FT marking below failed, the rows are still 'held', the same
            // key is recomputed today, and Stripe — having forgotten the key — issues a SECOND
            // real payout. So: if we already recorded a payout for this exact reserve set,
            // repair the marking instead of paying again.
            $alreadyPaid = PayoutRecord::where('creator_id', $creator->uuid)
                ->where('metadata->idempotency_key', $idempotencyKey)
                ->where('status', '!=', 'failed')
                ->first();

            if ($alreadyPaid) {
                Log::warning("reserve:release — reserve set already paid for creator {$creator->uuid} via payout {$alreadyPaid->stripe_payout_id}; repairing FT marking instead of re-paying.");

                FinancialTransaction::whereIn('id', $ftIds)->update([
                    'reserve_status' => 'released',
                    'reserve_released_at' => now(),
                    'reserve_payout_id' => $alreadyPaid->stripe_payout_id,
                ]);

                continue;
            }

            try {
                StripeControl::ensureManualPayoutSchedule($creator->account_id, $currency);

                $payout = StripeControl::createPayout([
                    'amount' => (int) $amountMinor,
                    'currency' => $currency,
                    'method' => 'standard',
                    'idempotency_key' => $idempotencyKey,
                    'metadata' => [
                        'reason' => 'reserve_release',
                        'payout_type' => 'reserve_release',
                        'creator_id' => (string) $creator->uuid,
                        'creator_username' => (string) ($creator->username ?? ''),
                        'creator_email' => (string) ($creator->email ?? ''),
                        'reserve_count' => (string) $fts->count(),
                        'reserve_amount_minor' => (string) $amountMinor,
                        'currency' => $currency,
                        'reserve_window_days' => '30',
                        'env' => (string) config('app.env'),
                    ],
                ], $creator->account_id);

                // Guard the idempotency REPLAY. If this exact reserve set was paid before,
                // bounced (payout.failed reverted the FTs to 'held' and flipped the PayoutRecord
                // to 'failed'), and reserve:release re-runs inside Stripe's 24h key window, Stripe
                // replays the ORIGINAL payout object — which is 'pending' at creation time, not
                // its later 'failed'. Marking on that replay would tell the creator money was
                // released when it actually bounced. A payout that is already failed/canceled at
                // return must never be treated as a fresh release; leave the FTs 'held' for the
                // next window and let the webhook stay authoritative.
                $payoutStatus = strtolower((string) ($payout->status ?? ''));
                if (in_array($payoutStatus, ['failed', 'canceled'], true)) {
                    Log::warning("reserve:release — Stripe returned status '{$payoutStatus}' for creator {$creator->uuid} (payout {$payout->id}); leaving reserves held, not marking released.");

                    continue;
                }

                // Record FIRST, mark second. The record carries the idempotency key, so it is
                // what stops tomorrow's run from re-paying this set if the marking below fails.
                // Writing it after the marking would leave nothing behind when the marking is
                // the thing that broke.
                try {
                    PayoutRecord::create([
                        'creator_id' => $creator->uuid,
                        'payout_run_id' => null,
                        'stripe_payout_id' => $payout->id,
                        'amount_minor' => (int) $amountMinor,
                        'currency' => $currency,
                        'status' => 'in_transit',
                        'arrival_date' => isset($payout->arrival_date) ? Carbon::createFromTimestamp($payout->arrival_date) : null,
                        'metadata' => [
                            'payout_type' => 'reserve_release',
                            'idempotency_key' => $idempotencyKey,
                            'reserve_count' => $fts->count(),
                            'ft_ids' => $ftIds->all(),
                            'stripe_payout' => $payout->toArray(),
                        ],
                    ]);
                } catch (\Throwable $e) {
                    Log::critical("reserve:release — payout {$payout->id} SENT for creator {$creator->uuid} but PayoutRecord create failed; re-run risk. Error: ".$e->getMessage());
                }

                // Mark every released FinancialTransaction atomically (single mass update —
                // no per-row save that could fail partway after Stripe already paid out).
                // reserve_payout_id links them to the Stripe payout so a later payout.failed
                // webhook can revert them to 'held'.
                $marked = false;
                for ($attempt = 1; $attempt <= 3 && ! $marked; $attempt++) {
                    try {
                        FinancialTransaction::whereIn('id', $ftIds)->update([
                            'reserve_status' => 'released',
                            'reserve_released_at' => now(),
                            'reserve_payout_id' => $payout->id,
                        ]);
                        $marked = true;
                    } catch (\Throwable $e) {
                        Log::error("reserve:release — marking attempt {$attempt} failed for creator {$creator->uuid} (payout {$payout->id}): ".$e->getMessage());
                        usleep(250000 * $attempt);
                    }
                }

                if (! $marked) {
                    Log::critical("reserve:release — reserves PAID for creator {$creator->uuid} (payout {$payout->id}) but could not be marked released. The PayoutRecord idempotency key will block a re-pay; repair the FT rows manually.", [
                        'ft_ids' => $ftIds->all(),
                    ]);
                }

                $currencySymbol = Helpers::getCurrency($currency);
                Helpers::sendNotification(
                    '💰 Reserve Released',
                    "Your held reserve of {$currencySymbol}{$amountMajor} has been released to your account.",
                    $creator->email
                );

                Log::info("reserve:release — released {$amountMinor} {$currency} for creator {$creator->uuid} via payout {$payout->id} ({$fts->count()} reserves).");
                $releasedCreators++;
                $releasedTotalMinor += $amountMinor;
            } catch (\Throwable $e) {
                // Stripe call itself failed → nothing was paid, no PayoutRecord exists, FTs stay
                // 'held' and the set is retried on the next run.
                Log::error("reserve:release — failed for creator {$creator->uuid}: ".$e->getMessage());
            }
        }

        $this->info("Done. Released for {$releasedCreators} creator(s).");

        return self::SUCCESS;
    }
}
