<?php

namespace App\Console\Commands;

use App\Models\Currency;
use App\Models\FinancialTransaction;
use App\Models\User;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
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

    private const RESERVE_RELEASE_WINDOW_DAYS = 30;
    private const MINIMUM_PAYOUT_MINOR = 100; // £1.00 / $1.00 — accumulate below this

    public function handle(): int
    {
        $dryRun = (bool) $this->option('dry-run');
        $cutoff = now()->subDays(self::RESERVE_RELEASE_WINDOW_DAYS);

        $this->info('Releasing reserves held before ' . $cutoff->toDateString() . ($dryRun ? ' (DRY RUN)' : ''));

        $rates = Currency::rates();
        $convert = function ($amount, $from, $to) use ($rates) {
            $from = strtoupper($from ?: 'GBP');
            $to = strtoupper($to ?: 'GBP');
            if ($from === $to) return $amount;
            if (!isset($rates[$from]) || !isset($rates[$to])) return $amount;
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
                    \App\Models\TaskPurchase::class => ['task'],
                    \App\Models\ShopPayment::class  => ['shop', 'deliverable'],
                ]);
            }])
            ->get();

        // Drop reserves for still-unfulfilled physical shop items / timed tasks — same
        // fulfillment gate used by getHeldReserves / calculatePayouts.
        $dueFts = $dueFts->filter(function ($ft) {
            if ($ft->source_type === \App\Models\TaskPurchase::class && $ft->source) {
                $taskType = $ft->source->task->type ?? 'timed';
                if ($taskType === 'timed' && !in_array($ft->source->status, ['completed', 'completed_accepted', 'paid_out'])) {
                    return false;
                }
            }
            if ($ft->source_type === \App\Models\ShopPayment::class && $ft->source && $ft->source->shop) {
                if ($ft->source->shop->type === 'physical') {
                    if (!$ft->source->deliverable || $ft->source->deliverable->status !== 'delivered') {
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
            if (!$creator) {
                Log::warning("reserve:release — creator (user id {$userId}) not found; skipping " . $fts->count() . ' reserves.');
                continue;
            }

            $currency = strtolower((string) ($creator->default_currency ?? 'gbp'));

            $amountMinor = 0;
            foreach ($fts as $ft) {
                $ftCurrency = strtolower((string) ($ft->currency ?: 'gbp'));
                $converted = $convert((float) $ft->reserve_amount, $ftCurrency, $currency);
                $amountMinor += (int) round($converted * 100);
            }

            if ($amountMinor < self::MINIMUM_PAYOUT_MINOR) {
                // Leave held to accumulate; they remain due and will release once above threshold.
                continue;
            }

            $isZeroDecimal = \App\Helpers::isZeroDecimalCurrency($currency);
            $amountMajor = $isZeroDecimal ? (int) $amountMinor : round($amountMinor / 100, 2);

            if ($dryRun) {
                $this->line("  {$creator->name}: would release {$amountMajor} {$currency} ({$fts->count()} reserves)");
                continue;
            }

            if (!$creator->account_id) {
                Log::warning("reserve:release — creator {$creator->uuid} has no connected Stripe account; skipping.");
                continue;
            }

            // Content-derived idempotency key: pinned to the EXACT set of reserves being
            // released, NOT the date. A retry of the same set returns the same Stripe payout
            // (no double pay); a different set always gets its own key (no lost release).
            $ftIds = $fts->pluck('id')->sort()->values();
            $idempotencyKey = 'reserve_release_' . $creator->uuid . '_' . md5($ftIds->implode(','));

            try {
                \App\StripeControl::ensureManualPayoutSchedule($creator->account_id, $currency);

                $payout = \App\StripeControl::createPayout([
                    'amount' => (int) $amountMinor,
                    'currency' => $currency,
                    'method' => 'standard',
                    'idempotency_key' => $idempotencyKey,
                    'metadata' => [
                        'reason' => 'reserve_release',
                        'creator_id' => (string) $creator->uuid,
                        'reserve_count' => (string) $fts->count(),
                    ],
                ], $creator->account_id);

                // Mark every released FinancialTransaction atomically (single mass update —
                // no per-row save that could fail partway after Stripe already paid out).
                // reserve_payout_id links them to the Stripe payout so a later payout.failed
                // webhook can revert them to 'held'.
                FinancialTransaction::whereIn('id', $ftIds)->update([
                    'reserve_status' => 'released',
                    'reserve_released_at' => now(),
                    'reserve_payout_id' => $payout->id,
                ]);

                $currencySymbol = \App\Helpers::getCurrency($currency);
                \App\Helpers::sendNotification(
                    '💰 Reserve Released',
                    "Your held reserve of {$currencySymbol}{$amountMajor} has been released to your account.",
                    $creator->email
                );

                Log::info("reserve:release — released {$amountMinor} {$currency} for creator {$creator->uuid} via payout {$payout->id} ({$fts->count()} reserves).");
                $releasedCreators++;
                $releasedTotalMinor += $amountMinor;
            } catch (\Throwable $e) {
                // FTs stay 'held' → retried next run with the same idempotency key (no double pay).
                Log::error("reserve:release — failed for creator {$creator->uuid}: " . $e->getMessage());
            }
        }

        $this->info("Done. Released for {$releasedCreators} creator(s).");
        return self::SUCCESS;
    }
}
