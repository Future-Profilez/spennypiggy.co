<?php

namespace App\Console\Commands;

use App\Models\FinancialTransaction;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Log;

/**
 * One-off data repair for reserves that an earlier bug flipped to 'released' the moment the
 * base earning was paid out (instead of holding them for the full 30-day window). Those
 * reserves vanished from the creator's held-reserve view and from admin, even though the
 * money was still being withheld.
 *
 * Old-bug releases are identifiable as reserve_status = 'released' with reserve_released_at IS NULL
 * (the new reserve:release command always stamps reserve_released_at). We only revert reserves that
 * are still WITHIN their 30-day window by default — those are unambiguously not yet due, so there is
 * zero double-pay risk. Overdue ones are reported for manual review (pass --include-overdue to also
 * revert them, only after confirming they were not already paid by the legacy run-level release).
 *
 * Dry-run by default; pass --apply to write.
 */
class RepairReserveStatus extends Command
{
    protected $signature = 'reserve:repair-status {--apply : Actually write changes (default is dry-run)} {--include-overdue : Also revert reserves already past their 30-day window}';

    protected $description = 'Restore reserves wrongly flipped to released by the old premature-release bug';

    private const RESERVE_RELEASE_WINDOW_DAYS = 30;

    public function handle(): int
    {
        $apply = (bool) $this->option('apply');
        $includeOverdue = (bool) $this->option('include-overdue');
        $windowStart = now()->subDays(self::RESERVE_RELEASE_WINDOW_DAYS);

        // Reserves flipped to 'released' by the OLD bug (reserve_released_at never stamped).
        $base = FinancialTransaction::query()
            ->where('type', 'income')
            ->where('reserve_status', 'released')
            ->whereNull('reserve_released_at')
            ->where('reserve_amount', '>', 0);

        $withinWindow = (clone $base)->where('transaction_date', '>', $windowStart);
        $overdue = (clone $base)->where('transaction_date', '<=', $windowStart);

        $withinCount = (clone $withinWindow)->count();
        $overdueCount = (clone $overdue)->count();

        $this->info("Found {$withinCount} prematurely-released reserve(s) still within the 30-day window.");
        $this->info("Found {$overdueCount} prematurely-released reserve(s) already past the window (need review).");

        if (! $apply) {
            $this->warn('DRY RUN — no changes written. Re-run with --apply to revert the within-window reserves to held'
                .($includeOverdue ? ' (and overdue too).' : '.'));

            return self::SUCCESS;
        }

        // Mass update intentionally bypasses the FinancialTransaction never-un-release model
        // guard — this repair is the one legitimate released → held transition for these rows.
        $reverted = (clone $withinWindow)->update(['reserve_status' => 'held']);
        $this->info("Reverted {$reverted} within-window reserve(s) to 'held'.");

        if ($includeOverdue) {
            $revertedOverdue = (clone $overdue)->update(['reserve_status' => 'held']);
            $this->info("Reverted {$revertedOverdue} overdue reserve(s) to 'held' — reserve:release will pay them on its next run.");
        }

        Log::warning("reserve:repair-status applied — within-window reverted: {$reverted}, overdue included: ".($includeOverdue ? 'yes' : 'no').'.');

        return self::SUCCESS;
    }
}
