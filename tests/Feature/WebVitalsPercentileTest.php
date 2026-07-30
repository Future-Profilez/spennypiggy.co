<?php

namespace Tests\Feature;

use App\Http\Controllers\Api\WebVitalsController;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

class WebVitalsPercentileTest extends TestCase
{
    use RefreshDatabase;

    private function seedSamples(string $metric, array $values, ?string $createdAt = null): void
    {
        $rows = [];

        foreach ($values as $value) {
            $rows[] = [
                'metric_name' => $metric,
                'value' => $value,
                'rating' => 'good',
                'delta' => 0,
                'url' => 'https://spennypiggy.co/',
                'created_at' => $createdAt ?? now()->subMinutes(5),
                'updated_at' => $createdAt ?? now()->subMinutes(5),
            ];
        }

        DB::table('web_vitals_metrics')->insert($rows);
    }

    private function metrics(string $timeframe = '24h'): array
    {
        $response = (new WebVitalsController)->index(Request::create('/', 'GET', ['timeframe' => $timeframe]));

        return $response->getData(true)['metrics'];
    }

    public function test_percentiles_are_computed_over_the_whole_window(): void
    {
        // 1..100, so the nearest-rank percentiles are exactly predictable.
        $this->seedSamples('LCP', range(1, 100));

        $lcp = $this->metrics()['LCP'];

        $this->assertEquals(100, $lcp['sample_count']);
        $this->assertEquals(50.0, $lcp['p50']);
        $this->assertEquals(75.0, $lcp['p75']);
        $this->assertEquals(90.0, $lcp['p90']);
        $this->assertEquals(95.0, $lcp['p95']);
    }

    public function test_a_high_outlier_tail_is_not_lost(): void
    {
        // The regression this guards: an earlier version ordered by value and took
        // the first N rows, so every percentile was drawn from the bottom of the
        // distribution and the slow tail — the only part anyone cares about in RUM —
        // vanished from the report.
        // 94 fast samples + 6 slow ones: the top 6% is above the p95 boundary, so a
        // correct p95 must land in the slow tail.
        $this->seedSamples('LCP', array_merge(range(1, 94), array_fill(0, 6, 9000)));

        $lcp = $this->metrics()['LCP'];

        $this->assertEquals(9000.0, $lcp['p95']);
        $this->assertGreaterThan($lcp['p50'], $lcp['p95']);
    }

    public function test_metrics_are_ranked_independently_of_each_other(): void
    {
        $this->seedSamples('LCP', range(1, 100));
        $this->seedSamples('CLS', range(201, 300));

        $metrics = $this->metrics();

        $this->assertEquals(50.0, $metrics['LCP']['p50']);
        $this->assertEquals(250.0, $metrics['CLS']['p50']);
    }

    public function test_a_single_sample_reports_its_own_value_rather_than_nothing(): void
    {
        // PERCENT_RANK is 0 for every row in a one-row group, so without the
        // COALESCE fallback every percentile would come back null.
        $this->seedSamples('TTFB', [42]);

        $ttfb = $this->metrics()['TTFB'];

        $this->assertEquals(1, $ttfb['sample_count']);
        $this->assertEquals(42.0, $ttfb['p95']);
    }

    public function test_samples_outside_the_timeframe_are_excluded(): void
    {
        $this->seedSamples('LCP', range(1, 100));
        $this->seedSamples('LCP', array_fill(0, 50, 9999), now()->subDays(10)->toDateTimeString());

        $lcp = $this->metrics('24h')['LCP'];

        $this->assertEquals(100, $lcp['sample_count']);
        $this->assertEquals(95.0, $lcp['p95']);
    }

    public function test_trends_bucket_and_rank_without_loading_rows_into_php(): void
    {
        $this->seedSamples('LCP', range(1, 100), now()->subHours(2)->startOfHour()->toDateTimeString());

        $response = (new WebVitalsController)->trends(
            Request::create('/', 'GET', ['metric' => 'LCP', 'timeframe' => '24h'])
        );

        $trends = $response->getData(true)['trends'];

        $this->assertCount(1, $trends);
        $this->assertEquals(100, $trends[0]['sample_count']);
        $this->assertEquals(95.0, $trends[0]['p95']);
    }
}
