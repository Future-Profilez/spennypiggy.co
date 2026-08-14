<?php

namespace App\Console\Commands;

use App\Models\SignupLead;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Schema;

/**
 * Remove sign-up leads past their retention window.
 *
 * 🚨 Every row here is a contact detail for somebody with NO account, who agreed
 * to exactly one thing: being told when sign-ups reopened. Nothing else deletes
 * one, so without this the table becomes a permanent shadow mailing list of
 * people who never joined the platform.
 *
 * ⚠️ It prunes on AGE, not on state. A lead still `pending` after the retention
 * window is not live work — it is an address that has been sitting unusable for
 * half a year, and keeping it is the thing this command exists to stop.
 */
class PruneSignupLeads extends Command
{
    protected $signature = 'signup-leads:prune
                            {--days=180 : Retention window; floored at MIN_RETENTION_DAYS}
                            {--dry-run : Report what would be deleted and delete nothing}';

    protected $description = 'Delete sign-up leads older than the retention window';

    /**
     * ⚠️ A floor, so a mistyped `--days=0` cannot empty the table. Deliberately
     * short rather than generous: these rows have no value once stale, and the
     * floor exists to stop an accident, not to preserve data.
     */
    public const MIN_RETENTION_DAYS = 7;

    public function handle(): int
    {
        if (! Schema::hasTable('signup_leads')) {
            $this->info('signup_leads table not present — nothing to do.');

            return self::SUCCESS;
        }

        $days = max(self::MIN_RETENTION_DAYS, (int) $this->option('days'));
        $cutoff = now()->subDays($days);
        $dryRun = (bool) $this->option('dry-run');

        $query = SignupLead::query()->where('created_at', '<', $cutoff);

        if ($dryRun) {
            $this->info("DRY RUN: {$query->count()} lead(s) older than {$days} days would be deleted.");

            return self::SUCCESS;
        }

        // Batched — this table is unbounded by design and a single DELETE over a
        // large backlog holds locks for as long as it takes.
        $deleted = 0;
        do {
            $chunk = SignupLead::query()
                ->where('created_at', '<', $cutoff)
                ->limit(1000)
                ->delete();

            $deleted += $chunk;
        } while ($chunk > 0);

        $this->info("Deleted {$deleted} lead(s) older than {$days} days.");

        return self::SUCCESS;
    }
}
