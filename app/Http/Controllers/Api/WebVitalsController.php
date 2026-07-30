<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class WebVitalsController extends Controller
{
    /**
     * Store Web Vitals metrics
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|in:LCP,FID,CLS,FCP,TTFB,INP',
            'value' => 'required|numeric',
            'rating' => 'required|string|in:good,needs-improvement,poor',
            'delta' => 'numeric',
            'id' => 'string',
            'timestamp' => 'required|integer',
            'url' => 'required|url',
            'userAgent' => 'string',
            'connection' => 'array',
            'viewport' => 'array',
            'deviceMemory' => 'numeric|nullable',
            'hardwareConcurrency' => 'numeric|nullable',
        ]);

        try {
            // Store in database for analysis
            DB::table('web_vitals_metrics')->insert([
                'metric_name' => $validated['name'],
                'value' => $validated['value'],
                'rating' => $validated['rating'],
                'delta' => $validated['delta'] ?? 0,
                'metric_id' => $validated['id'] ?? null,
                'url' => $validated['url'],
                'user_agent' => $validated['userAgent'] ?? null,
                'connection_type' => $validated['connection']['effectiveType'] ?? null,
                'connection_downlink' => $validated['connection']['downlink'] ?? null,
                'connection_rtt' => $validated['connection']['rtt'] ?? null,
                'viewport_width' => $validated['viewport']['width'] ?? null,
                'viewport_height' => $validated['viewport']['height'] ?? null,
                'device_memory' => $validated['deviceMemory'],
                'hardware_concurrency' => $validated['hardwareConcurrency'],
                'ip_address' => $request->ip(),
                'session_id' => session()->getId(),
                'created_at' => now(),
                'updated_at' => now(),
            ]);

            // Update real-time cache for dashboard
            $this->updateRealtimeMetrics($validated);

            // Check for performance alerts
            $this->checkPerformanceAlerts($validated);

            return response()->json(['status' => 'success'], 200);

        } catch (\Exception $e) {
            Log::error('Failed to store web vitals metric', [
                'error' => $e->getMessage(),
                'metric' => $validated,
            ]);

            return response()->json(['status' => 'error'], 500);
        }
    }

    /**
     * Get aggregated Web Vitals metrics for dashboard
     */
    public function index(Request $request)
    {
        $timeframe = $request->get('timeframe', '24h');
        $url = $request->get('url');

        $query = DB::table('web_vitals_metrics');

        // Apply time filter
        switch ($timeframe) {
            case '1h':
                $query->where('created_at', '>=', now()->subHour());
                break;
            case '24h':
                $query->where('created_at', '>=', now()->subDay());
                break;
            case '7d':
                $query->where('created_at', '>=', now()->subWeek());
                break;
            case '30d':
                $query->where('created_at', '>=', now()->subMonth());
                break;
        }

        // Apply URL filter
        if ($url) {
            $query->where('url', 'like', "%{$url}%");
        }

        // Get aggregated data.
        $metrics = (clone $query)->select([
            'metric_name',
            DB::raw('AVG(value) as avg_value'),
            DB::raw('COUNT(*) as sample_count'),
            DB::raw("SUM(CASE WHEN rating = 'good' THEN 1 ELSE 0 END) as good_count"),
            DB::raw("SUM(CASE WHEN rating = 'needs-improvement' THEN 1 ELSE 0 END) as needs_improvement_count"),
            DB::raw("SUM(CASE WHEN rating = 'poor' THEN 1 ELSE 0 END) as poor_count"),
        ])
            ->groupBy('metric_name')
            ->get();

        $percentiles = $this->percentilesByMetric($query);

        // Calculate performance scores
        $performanceScores = $metrics->mapWithKeys(function ($metric) use ($percentiles) {
            $total = (int) $metric->sample_count;

            if ($total === 0) {
                return [];
            }

            $goodPercent = ($metric->good_count / $total) * 100;
            $needsImprovementPercent = ($metric->needs_improvement_count / $total) * 100;
            $poorPercent = ($metric->poor_count / $total) * 100;
            $p = $percentiles[$metric->metric_name] ?? null;

            return [$metric->metric_name => [
                'avg_value' => round($metric->avg_value, 2),
                'p50' => round((float) ($p->p50 ?? 0), 2),
                'p75' => round((float) ($p->p75 ?? 0), 2),
                'p90' => round((float) ($p->p90 ?? 0), 2),
                'p95' => round((float) ($p->p95 ?? 0), 2),
                'sample_count' => $metric->sample_count,
                'distribution' => [
                    'good' => round($goodPercent, 1),
                    'needs_improvement' => round($needsImprovementPercent, 1),
                    'poor' => round($poorPercent, 1),
                ],
                'score' => $this->calculatePerformanceScore($goodPercent, $needsImprovementPercent),
            ]];
        });

        return response()->json([
            'timeframe' => $timeframe,
            'metrics' => $performanceScores,
            'last_updated' => now()->toISOString(),
        ]);
    }

    /**
     * Get performance trends over time
     */
    public function trends(Request $request)
    {
        $metric = $request->get('metric', 'LCP');
        $timeframe = $request->get('timeframe', '7d');

        $bucket = $this->trendBucketExpression($timeframe);

        $since = match ($timeframe) {
            '24h' => now()->subDay(),
            '30d' => now()->subMonth(),
            default => now()->subWeek(),
        };

        $rows = DB::table('web_vitals_metrics')
            ->selectRaw("{$bucket} as time_bucket")
            ->addSelect('value')
            ->selectRaw("CUME_DIST() OVER (PARTITION BY {$bucket} ORDER BY value) as cd")
            ->where('metric_name', $metric)
            ->where('created_at', '>=', $since);

        $trends = DB::query()
            ->fromSub($rows, 't')
            ->select('time_bucket')
            ->selectRaw('AVG(value) as avg_value')
            ->selectRaw('COUNT(*) as sample_count')
            ->selectRaw('COALESCE(MIN(CASE WHEN cd >= 0.95 THEN value END), MAX(value)) as p95')
            ->groupBy('time_bucket')
            ->orderBy('time_bucket')
            ->get()
            ->map(fn ($row) => [
                'time_bucket' => $row->time_bucket,
                'avg_value' => round((float) $row->avg_value, 2),
                'p95' => round((float) $row->p95, 2),
                'sample_count' => (int) $row->sample_count,
            ])
            ->values();

        return response()->json([
            'metric' => $metric,
            'timeframe' => $timeframe,
            'trends' => $trends,
        ]);
    }

    /**
     * Exact percentiles per metric, computed by the database.
     *
     * `PERCENTILE_CONT ... WITHIN GROUP` is Postgres-only syntax — MySQL rejects it
     * with SQLSTATE[42000] 1064, which is what threw on every call to this endpoint.
     * The replacement must not be "pull the values and do it in PHP" either: an
     * `ORDER BY value LIMIT n` takes the SMALLEST n rows, so any capped sample
     * silently reports a p95 drawn from the bottom of the distribution.
     *
     * CUME_DIST() is supported by both MySQL 8 and SQLite 3.28+, reads the whole
     * filtered set, and never lands the raw rows in PHP memory. It gives the
     * fraction of rows at or below each value, so the smallest value whose CUME_DIST
     * reaches p IS the nearest-rank pth percentile. (PERCENT_RANK is the wrong
     * function here: it is (rank-1)/(n-1), which reports 96 as the p95 of 1..100.)
     * The result is an observed measurement rather than an interpolated one.
     */
    private function percentilesByMetric($query)
    {
        $ranked = (clone $query)
            ->select('metric_name', 'value')
            ->selectRaw('CUME_DIST() OVER (PARTITION BY metric_name ORDER BY value) as cd');

        return DB::query()
            ->fromSub($ranked, 't')
            ->select('metric_name')
            ->selectRaw('COALESCE(MIN(CASE WHEN cd >= 0.50 THEN value END), MAX(value)) as p50')
            ->selectRaw('COALESCE(MIN(CASE WHEN cd >= 0.75 THEN value END), MAX(value)) as p75')
            ->selectRaw('COALESCE(MIN(CASE WHEN cd >= 0.90 THEN value END), MAX(value)) as p90')
            ->selectRaw('COALESCE(MIN(CASE WHEN cd >= 0.95 THEN value END), MAX(value)) as p95')
            ->groupBy('metric_name')
            ->get()
            ->keyBy('metric_name');
    }

    /**
     * The SQL expression that buckets a row into its trend interval.
     *
     * MySQL has no DATE_TRUNC, and the test suite runs on SQLite, so the expression
     * is per-driver. It is built from a fixed match — never from request input.
     */
    private function trendBucketExpression(string $timeframe): string
    {
        if (DB::connection()->getDriverName() === 'sqlite') {
            return match ($timeframe) {
                '24h' => "strftime('%Y-%m-%d %H:00:00', created_at)",
                '30d' => "strftime('%Y-%m-%d 00:00:00', created_at)",
                default => "strftime('%Y-%m-%d ', created_at) || printf('%02d', (CAST(strftime('%H', created_at) AS INTEGER) / 4) * 4) || ':00:00'",
            };
        }

        return match ($timeframe) {
            '24h' => "DATE_FORMAT(created_at, '%Y-%m-%d %H:00:00')",
            '30d' => "DATE_FORMAT(created_at, '%Y-%m-%d 00:00:00')",
            default => "DATE_FORMAT(DATE_SUB(created_at, INTERVAL MOD(HOUR(created_at), 4) HOUR), '%Y-%m-%d %H:00:00')",
        };
    }

    /**
     * Update real-time metrics cache
     */
    private function updateRealtimeMetrics(array $metric)
    {
        $key = "web_vitals_realtime_{$metric['name']}";
        $ttl = 300; // 5 minutes

        // Caching disabled
        // Cache::put($key, [
        //    'value' => $metric['value'],
        //    'rating' => $metric['rating'],
        //    'timestamp' => now()->toISOString(),
        //    'url' => $metric['url']
        // ], $ttl);
    }

    /**
     * Check for performance alerts
     */
    private function checkPerformanceAlerts(array $metric)
    {
        $thresholds = [
            'LCP' => 2500,
            'FID' => 100,
            'CLS' => 0.1,
            'FCP' => 1800,
            'TTFB' => 600,
            'INP' => 200,
        ];

        $threshold = $thresholds[$metric['name']] ?? null;
        if (! $threshold || $metric['value'] <= $threshold) {
            return;
        }

        // Calculate severity
        $severity = $metric['value'] > ($threshold * 2) ? 'critical' : 'warning';

        // Log alert
        Log::channel('performance')->warning('Performance threshold exceeded', [
            'metric' => $metric['name'],
            'value' => $metric['value'],
            'threshold' => $threshold,
            'severity' => $severity,
            'url' => $metric['url'],
            'rating' => $metric['rating'],
        ]);

        // Send to external monitoring (implement based on your monitoring stack)
        $this->sendExternalAlert($metric, $threshold, $severity);
    }

    /**
     * Send alert to external monitoring service
     */
    private function sendExternalAlert(array $metric, float $threshold, string $severity)
    {
        // Example: Send to Slack, Discord, or monitoring service
        try {
            // Implement your alerting logic here
            // This could send to Slack, PagerDuty, Datadog, etc.

            Log::info('Performance alert sent to external service', [
                'metric' => $metric['name'],
                'severity' => $severity,
            ]);
        } catch (\Exception $e) {
            Log::error('Failed to send external performance alert', [
                'error' => $e->getMessage(),
                'metric' => $metric,
            ]);
        }
    }

    /**
     * Calculate performance score based on Core Web Vitals methodology
     */
    private function calculatePerformanceScore(float $goodPercent, float $needsImprovementPercent): int
    {
        // Core Web Vitals scoring methodology
        // Good: 90-100, Needs Improvement: 50-89, Poor: 0-49

        if ($goodPercent >= 75) {
            return 90 + (int) (($goodPercent - 75) / 25 * 10);
        } elseif ($goodPercent >= 50) {
            return 50 + (int) (($goodPercent - 50) / 25 * 40);
        } else {
            return (int) ($goodPercent / 50 * 50);
        }
    }
}
