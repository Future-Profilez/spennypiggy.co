<?php

namespace App\Http\Controllers;

use App\Support\Release;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;

class HealthController extends Controller
{
    /**
     * Application health check endpoint
     * Used by CI/CD pipeline to validate deployments
     */
    public function index(Request $request)
    {
        $checks = [
            'status' => 'healthy',
            'timestamp' => now()->toISOString(),
            'environment' => app()->environment(),
            // 🚨 This used to be `config('app.version', '1.0.0')` against a config
            // key that existed in NO config file, so every deploy of every
            // environment answered "1.0.0". CI curls this endpoint to validate a
            // deploy — a constant here cannot tell the release it just shipped
            // from the one it replaced. See App\Support\Release for where the
            // value now comes from; `null` with a source of "unset" is a
            // legitimate answer and is deliberately preferred to a made-up one.
            'version' => Release::version(),
            'version_source' => Release::source(),
            'checks' => [],
        ];

        try {
            // Database connectivity check
            $checks['checks']['database'] = $this->checkDatabase();

            // Cache connectivity check
            $checks['checks']['cache'] = $this->checkCache();

            // Disk space check
            $checks['checks']['disk'] = $this->checkDiskSpace();

            // Performance metrics check
            $checks['checks']['performance'] = $this->checkPerformance();

            // Overall health determination
            $allHealthy = collect($checks['checks'])->every(function ($check) {
                return $check['status'] === 'healthy';
            });

            $checks['status'] = $allHealthy ? 'healthy' : 'degraded';
            $httpStatus = $allHealthy ? 200 : 503;

            return response()->json($checks, $httpStatus);

        } catch (\Exception $e) {
            return response()->json([
                'status' => 'unhealthy',
                'timestamp' => now()->toISOString(),
                'error' => $e->getMessage(),
                'checks' => $checks['checks'],
            ], 503);
        }
    }

    /**
     * Check database connectivity and performance
     */
    private function checkDatabase(): array
    {
        try {
            $start = microtime(true);

            // Simple query to check connectivity
            DB::select('SELECT 1 as health_check');

            $duration = (microtime(true) - $start) * 1000; // Convert to milliseconds

            return [
                'status' => 'healthy',
                'response_time_ms' => round($duration, 2),
                'message' => 'Database connection successful',
            ];

        } catch (\Exception $e) {
            return [
                'status' => 'unhealthy',
                'error' => $e->getMessage(),
                'message' => 'Database connection failed',
            ];
        }
    }

    /**
     * Check cache connectivity
     */
    private function checkCache(): array
    {
        // Cache check disabled as requested
        return [
            'status' => 'healthy',
            'response_time_ms' => 0,
            'message' => 'Cache check skipped',
        ];
    }

    /**
     * Check available disk space
     */
    private function checkDiskSpace(): array
    {
        try {
            $path = storage_path();
            $freeBytes = disk_free_space($path);
            $totalBytes = disk_total_space($path);

            $freeGb = round($freeBytes / (1024 * 1024 * 1024), 2);
            $totalGb = round($totalBytes / (1024 * 1024 * 1024), 2);
            $usedPercent = round((($totalBytes - $freeBytes) / $totalBytes) * 100, 1);

            $status = $usedPercent < 80 ? 'healthy' : ($usedPercent < 90 ? 'warning' : 'critical');

            return [
                'status' => $status,
                'free_gb' => $freeGb,
                'total_gb' => $totalGb,
                'used_percent' => $usedPercent,
                'message' => "Disk usage: {$usedPercent}%",
            ];

        } catch (\Exception $e) {
            return [
                'status' => 'unknown',
                'error' => $e->getMessage(),
                'message' => 'Unable to check disk space',
            ];
        }
    }

    /**
     * Check recent performance metrics
     */
    private function checkPerformance(): array
    {
        try {
            // Get recent Web Vitals metrics if available
            $recentMetrics = DB::table('web_vitals_metrics')
                ->where('created_at', '>=', now()->subMinutes(5))
                ->select('metric_name', 'rating')
                ->get()
                ->groupBy('metric_name');

            $performanceScore = 100;
            $issues = [];

            foreach (['LCP', 'FID', 'CLS'] as $metric) {
                if ($recentMetrics->has($metric)) {
                    $metricData = $recentMetrics[$metric];
                    $poorCount = $metricData->where('rating', 'poor')->count();
                    $totalCount = $metricData->count();

                    if ($totalCount > 0) {
                        $poorPercentage = ($poorCount / $totalCount) * 100;
                        if ($poorPercentage > 25) { // More than 25% poor ratings
                            $performanceScore -= 20;
                            $issues[] = "{$metric} degraded ({$poorPercentage}% poor)";
                        }
                    }
                }
            }

            $status = $performanceScore >= 80 ? 'healthy' : ($performanceScore >= 60 ? 'warning' : 'degraded');

            return [
                'status' => $status,
                'performance_score' => $performanceScore,
                'issues' => $issues,
                'message' => empty($issues) ? 'Performance metrics healthy' : 'Performance issues detected',
            ];

        } catch (\Exception $e) {
            return [
                'status' => 'unknown',
                'error' => $e->getMessage(),
                'message' => 'Unable to check performance metrics',
            ];
        }
    }

    /**
     * Detailed health check for monitoring dashboards
     */
    public function detailed(Request $request)
    {
        $checks = $this->index($request)->getData(true);

        // Add additional detailed metrics
        $checks['system'] = [
            'php_version' => PHP_VERSION,
            'memory_usage' => [
                'current_mb' => round(memory_get_usage(true) / (1024 * 1024), 2),
                'peak_mb' => round(memory_get_peak_usage(true) / (1024 * 1024), 2),
                'limit' => ini_get('memory_limit'),
            ],
            'load_average' => function_exists('sys_getloadavg') ? sys_getloadavg() : null,
        ];

        // Add recent error rates
        try {
            $errorRate = DB::table('telescope_entries')
                ->where('type', 'exception')
                ->where('created_at', '>=', now()->subHour())
                ->count();

            $checks['error_rate_last_hour'] = $errorRate;
        } catch (\Exception $e) {
            $checks['error_rate_last_hour'] = 'unavailable';
        }

        return response()->json($checks);
    }
}
