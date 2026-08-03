<?php

namespace App\Console\Commands;

use App\Support\BlockedPaymentAlert;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

/**
 * One row per refused purchase, kept only as long as it can still be counted.
 *
 * This table grows with traffic against blocked creators and nothing else would
 * ever remove a row. The creator-facing count only reaches back
 * BlockedPaymentAlert::WINDOW_DAYS, so anything far past that is dead weight —
 * kept a while longer than the window so the history is there if the number is
 * ever questioned.
 */
class PruneBlockedPaymentAttempts extends Command
{
    protected $signature = 'blocked-payments:prune {--days=90} {--dry-run}';

    protected $description = 'Delete blocked-payment attempts past the retention window';

    public function handle(): int
    {
        $days = max((int) BlockedPaymentAlert::WINDOW_DAYS, (int) $this->option('days'));
        $cutoff = now()->subDays($days);

        $query = DB::table('blocked_payment_attempts')->where('created_at', '<', $cutoff);

        if ($this->option('dry-run')) {
            $this->info("[dry-run] {$query->count()} attempt(s) older than {$days} days would be deleted.");

            return self::SUCCESS;
        }

        // Batched: this can be a large table on a busy platform, and one huge
        // DELETE would hold locks far longer than the work is worth.
        $deleted = 0;
        do {
            $batch = $query->clone()->limit(1000)->delete();
            $deleted += $batch;
        } while ($batch > 0);

        $this->info("Deleted {$deleted} attempt(s) older than {$days} days.");

        return self::SUCCESS;
    }
}
