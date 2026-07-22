<?php

namespace App\Console\Commands;

use App\Services\VisitTracker;
use Illuminate\Console\Command;

/**
 * Moves buffered visit counters from the cache into site_visit_stats.
 *
 * Visits are counted in the cache so a page view never waits on a database
 * write. This is the other half: without it running, the funnels show no visit
 * data at all and the counters expire in the cache. Needs `schedule:work`.
 */
class FlushVisitStats extends Command
{
    protected $signature = 'visits:flush {--date= : Flush one specific date (Y-m-d)}';

    protected $description = 'Write buffered anonymous visit counters into site_visit_stats.';

    public function handle(VisitTracker $tracker): int
    {
        $written = $tracker->flush($this->option('date'));

        $this->info($written === 0
            ? 'No visit counters were pending.'
            : "Visit counters written: {$written}.");

        return self::SUCCESS;
    }
}
