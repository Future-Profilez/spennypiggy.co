<?php

namespace Tests\Feature;

use App\Console\Commands\PruneHelpCentreData;
use App\Models\HelpArticle;
use App\Models\HelpArticleStat;
use App\Models\HelpCategory;
use App\Models\HelpSearchMiss;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class HelpCentrePruneTest extends TestCase
{
    use RefreshDatabase;

    private function article(): HelpArticle
    {
        $category = HelpCategory::create([
            'slug' => 'money', 'title' => 'Money', 'audience' => 'both',
            'sort_order' => 0, 'is_published' => true,
        ]);

        return HelpArticle::create([
            'help_category_id' => $category->id,
            'slug' => 'when-paid', 'title' => 'When paid', 'summary' => 's', 'body' => 'b',
            'audience' => 'both', 'status' => HelpArticle::STATUS_PUBLISHED, 'published_at' => now(),
        ]);
    }

    public function test_it_deletes_stats_past_the_window_and_keeps_recent_ones(): void
    {
        $article = $this->article();

        HelpArticleStat::create([
            'help_article_id' => $article->id,
            'date' => now()->subDays(PruneHelpCentreData::STATS_RETENTION_DAYS + 10)->toDateString(),
            'views' => 5,
        ]);
        HelpArticleStat::create([
            'help_article_id' => $article->id,
            'date' => now()->subDays(10)->toDateString(),
            'views' => 5,
        ]);

        $this->artisan('help:prune')->assertSuccessful();

        $this->assertSame(1, HelpArticleStat::count());
    }

    /**
     * ⚠️ Measured on `last_seen_at`, not `created_at`. A question first asked two
     * years ago and asked again this morning is the most valuable row in the
     * table — deleting it on age of creation throws away the strongest signal
     * the backlog has.
     */
    public function test_a_recently_searched_old_miss_survives(): void
    {
        $old = HelpSearchMiss::create([
            'query_normalised' => 'ancient question',
            'query_sample' => 'ancient question',
            'hits' => 40,
            'last_seen_at' => now()->subDay(),
        ]);
        $old->forceFill(['created_at' => now()->subYears(3)])->saveQuietly();

        HelpSearchMiss::create([
            'query_normalised' => 'genuinely stale',
            'query_sample' => 'genuinely stale',
            'hits' => 1,
            'last_seen_at' => now()->subDays(PruneHelpCentreData::MISS_RETENTION_DAYS + 10),
        ]);

        $this->artisan('help:prune')->assertSuccessful();

        $this->assertDatabaseHas('help_search_misses', ['query_normalised' => 'ancient question']);
        $this->assertDatabaseMissing('help_search_misses', ['query_normalised' => 'genuinely stale']);
    }

    public function test_dry_run_deletes_nothing(): void
    {
        $article = $this->article();

        HelpArticleStat::create([
            'help_article_id' => $article->id,
            'date' => now()->subDays(PruneHelpCentreData::STATS_RETENTION_DAYS + 10)->toDateString(),
            'views' => 1,
        ]);

        $this->artisan('help:prune --dry-run')->assertSuccessful();

        $this->assertSame(1, HelpArticleStat::count());
    }

    /**
     * A bad --days must not be able to empty the tables the "most read" list and
     * the content backlog are built from.
     */
    public function test_the_retention_window_is_floored(): void
    {
        $article = $this->article();

        HelpArticleStat::create([
            'help_article_id' => $article->id,
            'date' => now()->subDays(20)->toDateString(),
            'views' => 1,
        ]);

        $this->artisan('help:prune --days=0')->assertSuccessful();

        $this->assertSame(1, HelpArticleStat::count());
    }
}
