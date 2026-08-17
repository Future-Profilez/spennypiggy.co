<?php

namespace App\Console\Commands;

use App\Models\HelpArticleStat;
use App\Models\HelpSearchMiss;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Schema;

/**
 * Keeps the help centre's two counter tables bounded.
 *
 * `help_article_stats` gains a row per article per day and `help_search_misses`
 * gains one per distinct unanswered question — both grow forever and nothing
 * else removes a row.
 */
class PruneHelpCentreData extends Command
{
    /** A year plus slack, so a year-on-year comparison is still possible. */
    public const STATS_RETENTION_DAYS = 400;

    /**
     * A question nobody has asked in a year is not a backlog item.
     *
     * ⚠️ Deliberately measured on `last_seen_at`, not `created_at`. A query first
     * seen two years ago and searched again this morning is the most valuable row
     * in the table; deleting it on age of creation would throw away the strongest
     * signal there is.
     */
    public const MISS_RETENTION_DAYS = 365;

    protected $signature = 'help:prune
        {--days= : Override the stats retention window}
        {--miss-days= : Override the search-miss retention window}
        {--chunk=1000 : Rows deleted per batch}
        {--dry-run : Report what would be deleted and delete nothing}';

    protected $description = 'Prune help centre article stats and stale search misses';

    public function handle(): int
    {
        // Scheduled daily. On an environment where the migration has not landed
        // yet, an unguarded run would throw into the logs and Sentry every day
        // for a condition that is not a fault.
        if (! Schema::hasTable('help_article_stats') || ! Schema::hasTable('help_search_misses')) {
            $this->warn('Help centre tables not present — nothing to prune.');

            return self::SUCCESS;
        }

        $dryRun = (bool) $this->option('dry-run');
        $chunk = max(100, (int) $this->option('chunk'));

        // Floored: a bad --days must not be able to empty the tables the
        // "most read" list and the content backlog are built from.
        $statsDays = max(30, (int) ($this->option('days') ?: self::STATS_RETENTION_DAYS));
        $missDays = max(30, (int) ($this->option('miss-days') ?: self::MISS_RETENTION_DAYS));

        $statsCutoff = now()->subDays($statsDays)->toDateString();
        $missCutoff = now()->subDays($missDays);

        $statsCount = HelpArticleStat::query()->where('date', '<', $statsCutoff)->count();
        $missCount = HelpSearchMiss::query()->where('last_seen_at', '<', $missCutoff)->count();

        $this->line("Stats older than {$statsCutoff}: {$statsCount}");
        $this->line("Search misses last seen before {$missCutoff->toDateString()}: {$missCount}");

        if ($dryRun) {
            $this->info('Dry run — nothing deleted.');

            return self::SUCCESS;
        }

        $deletedStats = $this->deleteInBatches(
            fn () => HelpArticleStat::query()->where('date', '<', $statsCutoff)->limit($chunk),
            $chunk
        );

        $deletedMisses = $this->deleteInBatches(
            fn () => HelpSearchMiss::query()->where('last_seen_at', '<', $missCutoff)->limit($chunk),
            $chunk
        );

        $this->info("Deleted {$deletedStats} stat row(s) and {$deletedMisses} search miss(es).");

        return self::SUCCESS;
    }

    /** Batched so a large backlog cannot lock the table in one statement. */
    private function deleteInBatches(callable $query, int $chunk): int
    {
        $total = 0;

        do {
            $deleted = $query()->delete();
            $total += $deleted;
        } while ($deleted >= $chunk);

        return $total;
    }
}
