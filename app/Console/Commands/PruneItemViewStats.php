<?php

namespace App\Console\Commands;

use App\Services\ItemViewTracker;
use Illuminate\Console\Command;

/**
 * Deletes item view counters past the retention window.
 *
 * One row per listing per day per source. That grows with the catalogue rather than with
 * traffic, so it is slower than a per-visit table — but it is still unbounded, and
 * nothing else would ever remove a row.
 */
class PruneItemViewStats extends Command
{
    protected $signature = 'item-views:prune
        {--days= : Override the retention window}
        {--dry-run : Report only, delete nothing}';

    protected $description = 'Delete per-listing view counters older than the retention window';

    public function handle(ItemViewTracker $tracker): int
    {
        $dryRun = (bool) $this->option('dry-run');
        $days = $this->option('days') !== null ? (int) $this->option('days') : null;

        $count = $tracker->prune($days, $dryRun);

        $this->info(sprintf(
            '%s%d row(s) older than %d days.',
            $dryRun ? '[dry-run] would delete ' : 'Deleted ',
            $count,
            $days ?? ItemViewTracker::RETENTION_DAYS
        ));

        return self::SUCCESS;
    }
}
