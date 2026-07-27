<?php

namespace App\Console\Commands;

use App\Models\FinancialTransaction;
use App\Models\PayoutRecord;
use App\Models\User;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Log;

/**
 * One-off backfill: reserve releases issued BEFORE ReleaseReserves started writing a PayoutRecord
 * left the creator's Payout History blank for money that actually left to their bank. This recreates
 * a PayoutRecord per distinct reserve-release Stripe payout (grouped by reserve_payout_id) so those
 * historical releases show up with their amount, release date, and a 'paid' status.
 *
 * Idempotent: skips any reserve_payout_id that already has a PayoutRecord (so it never double-creates,
 * and never collides with records the live command now writes).
 */
class BackfillReserveReleasePayoutRecords extends Command
{
    protected $signature = 'reserve:backfill-payout-records {--dry-run : List what would be created without writing}';

    protected $description = 'Create PayoutRecords for historical reserve-release payouts that predate record-keeping';

    public function handle(): int
    {
        $dryRun = (bool) $this->option('dry-run');

        // Released reserves linked to a real Stripe payout. Group by the payout that paid them.
        $groups = FinancialTransaction::query()
            ->where('reserve_status', 'released')
            ->whereNotNull('reserve_payout_id')
            ->get(['id', 'user_id', 'reserve_amount', 'currency', 'reserve_payout_id', 'reserve_released_at'])
            ->groupBy('reserve_payout_id');

        if ($groups->isEmpty()) {
            $this->info('No released reserves with a linked payout found. Nothing to backfill.');

            return self::SUCCESS;
        }

        // Which payouts already have a record? Skip those.
        $existing = PayoutRecord::whereIn('stripe_payout_id', $groups->keys()->all())
            ->pluck('stripe_payout_id')
            ->flip();

        $userCache = [];
        $created = 0;
        $skipped = 0;

        foreach ($groups as $stripePayoutId => $fts) {
            if ($existing->has($stripePayoutId)) {
                $skipped++;

                continue;
            }

            $userId = $fts->first()->user_id;
            $creator = $userCache[$userId] ??= User::find($userId);
            if (! $creator) {
                $skipped++;

                continue;
            }

            // Reserve amounts for a single payout are in one currency (the creator's payout currency).
            $currency = strtoupper((string) ($fts->first()->currency ?: ($creator->default_currency ?? 'GBP')));
            $amountMinor = (int) round($fts->sum(fn ($ft) => (float) ($ft->reserve_amount ?? 0)) * 100);
            $releasedAt = $fts->max('reserve_released_at');

            if ($amountMinor <= 0) {
                $skipped++;

                continue;
            }

            $this->line("  {$creator->name}: {$stripePayoutId} → ".number_format($amountMinor / 100, 2)." {$currency} ({$fts->count()} reserves)");

            if ($dryRun) {
                $created++;

                continue;
            }

            try {
                $record = PayoutRecord::create([
                    'creator_id' => $creator->uuid,
                    'payout_run_id' => null,
                    'stripe_payout_id' => $stripePayoutId,
                    'amount_minor' => $amountMinor,
                    'currency' => $currency,
                    'status' => 'paid', // historical release already completed
                    'arrival_date' => $releasedAt,
                    'metadata' => [
                        'payout_type' => 'reserve_release',
                        'backfilled' => true,
                        'reserve_count' => $fts->count(),
                        'ft_ids' => $fts->pluck('id')->all(),
                    ],
                ]);

                // Stamp the record's created_at to the release date so history is chronologically correct.
                if ($releasedAt) {
                    $record->forceFill(['created_at' => $releasedAt])->save();
                }

                $created++;
            } catch (\Throwable $e) {
                Log::error("reserve:backfill-payout-records — failed for {$stripePayoutId}: ".$e->getMessage());
                $skipped++;
            }
        }

        $verb = $dryRun ? 'Would create' : 'Created';
        $this->info("{$verb} {$created} reserve-release record(s). Skipped {$skipped} (already recorded or empty).");

        return self::SUCCESS;
    }
}
