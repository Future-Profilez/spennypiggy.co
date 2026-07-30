<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

/**
 * Drop Web Vitals samples past the retention window.
 *
 * `web_vitals_metrics` takes a row per metric per page view — six rows per visit —
 * and nothing ever removed one. The dashboard only ever reads the last 30 days, so
 * everything older is cost without a reader: it slows every percentile sort, and it
 * is a per-visitor record (IP, session id, user agent) that we have no reason to
 * keep indefinitely.
 */
class PruneWebVitalsMetrics extends Command
{
    protected $signature = 'web-vitals:prune
                            {--days=90 : Delete samples older than this many days}
                            {--chunk=5000 : Rows deleted per statement}
                            {--dry-run : Report what would be deleted without deleting it}';

    protected $description = 'Delete Web Vitals samples older than the retention window';

    public function handle(): int
    {
        $days = max(1, (int) $this->option('days'));
        $chunk = max(100, (int) $this->option('chunk'));
        $cutoff = now()->subDays($days);

        $query = DB::table('web_vitals_metrics')->where('created_at', '<', $cutoff);
        $total = (clone $query)->count();

        if ($total === 0) {
            $this->info("Nothing to prune before {$cutoff->toDateTimeString()}.");

            return self::SUCCESS;
        }

        if ($this->option('dry-run')) {
            $this->info("Would delete {$total} samples older than {$cutoff->toDateTimeString()}.");

            return self::SUCCESS;
        }

        // Deleted in chunks so a long-retained table cannot hold a single lock over
        // millions of rows while the collection endpoint is still writing.
        $deleted = 0;

        do {
            $affected = (clone $query)->limit($chunk)->delete();
            $deleted += $affected;
        } while ($affected > 0);

        $this->info("Deleted {$deleted} Web Vitals samples older than {$cutoff->toDateTimeString()}.");

        return self::SUCCESS;
    }
}
