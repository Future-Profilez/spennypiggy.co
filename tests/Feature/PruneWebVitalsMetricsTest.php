<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

/**
 * Covers web-vitals:prune. A command whose whole job is to DELETE rows should not
 * ship without a test that says which rows it takes.
 */
class PruneWebVitalsMetricsTest extends TestCase
{
    use RefreshDatabase;

    private function sample(int $daysAgo): void
    {
        DB::table('web_vitals_metrics')->insert([
            'metric_name' => 'LCP',
            'value' => 1,
            'rating' => 'good',
            'delta' => 0,
            'url' => 'https://spennypiggy.co/',
            'created_at' => now()->subDays($daysAgo),
            'updated_at' => now()->subDays($daysAgo),
        ]);
    }

    public function test_it_deletes_only_samples_past_the_retention_window(): void
    {
        $this->sample(100);
        $this->sample(91);
        $this->sample(10);

        $this->artisan('web-vitals:prune', ['--days' => 90])->assertSuccessful();

        $this->assertSame(1, DB::table('web_vitals_metrics')->count());
    }

    public function test_a_dry_run_deletes_nothing(): void
    {
        $this->sample(100);

        $this->artisan('web-vitals:prune', ['--days' => 90, '--dry-run' => true])->assertSuccessful();

        $this->assertSame(1, DB::table('web_vitals_metrics')->count());
    }

    public function test_it_keeps_deleting_until_the_backlog_is_gone(): void
    {
        // Guards the chunk loop: with a chunk smaller than the backlog it must keep
        // going, and it must terminate.
        foreach (range(1, 7) as $i) {
            $this->sample(100 + $i);
        }

        $this->artisan('web-vitals:prune', ['--days' => 90, '--chunk' => 100])->assertSuccessful();

        $this->assertSame(0, DB::table('web_vitals_metrics')->count());
    }

    public function test_it_reports_an_empty_table_without_failing(): void
    {
        $this->artisan('web-vitals:prune')->assertSuccessful();

        $this->assertSame(0, DB::table('web_vitals_metrics')->count());
    }
}
