<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Log;
use Aws\CloudWatchLogs\CloudWatchLogsClient;
use Exception;

class LogManagementController extends Controller
{
    /**
     * Display the log management interface
     */
    public function index(Request $request)
    {
        $isVapor = $this->isVaporEnvironment();
        
        if ($isVapor) {
            return $this->handleVaporLogs($request);
        } else {
            return $this->handleFileLogs();
        }
    }

    /**
     * Handle file-based logs (local environment)
     */
    private function handleFileLogs()
    {
        $logPath = storage_path('logs/laravel.log');
        $logExists = File::exists($logPath);
        $logSize = $logExists ? File::size($logPath) : 0;
        $lastModified = $logExists ? File::lastModified($logPath) : null;
        
        return view('admin.logs.index', [
            'logExists' => $logExists,
            'logSize' => $this->formatBytes($logSize),
            'lastModified' => $lastModified ? date('Y-m-d H:i:s', $lastModified) : null,
            'logPath' => $logPath,
            'isVapor' => false,
            'logs' => $logExists ? $this->getRecentFileLogs($logPath) : [],
            'cloudwatchMessage' => null
        ]);
    }

    /**
     * Handle CloudWatch logs (Vapor environment)
     */
    private function handleVaporLogs(Request $request)
    {
        $logs = [];
        $cloudwatchMessage = null;
        
        try {
            // Try to get logs from CloudWatch
            $logs = $this->getCloudWatchLogs();
            $cloudwatchMessage = 'Logs loaded from AWS CloudWatch';
        } catch (Exception $e) {
            $cloudwatchMessage = 'CloudWatch logs not accessible. Please check AWS credentials or view logs in Vapor dashboard.';
            Log::error('CloudWatch log access failed: ' . $e->getMessage());
        }
        
        return view('admin.logs.index', [
            'logExists' => !empty($logs),
            'logSize' => 'N/A (CloudWatch)',
            'lastModified' => 'N/A (CloudWatch)',
            'logPath' => '/tmp/storage/logs/laravel.log',
            'isVapor' => true,
            'logs' => $logs,
            'cloudwatchMessage' => $cloudwatchMessage
        ]);
    }

    /**
     * Get recent logs from file
     */
    private function getRecentFileLogs($logPath, $lines = 50)
    {
        if (!File::exists($logPath)) {
            return [];
        }

        $file = fopen($logPath, 'r');
        if (!$file) {
            return [];
        }

        $logLines = [];
        while (($line = fgets($file)) !== false) {
            $logLines[] = trim($line);
        }
        fclose($file);

        // Return last N lines
        return array_slice(array_reverse($logLines), 0, $lines);
    }

    /**
     * Get logs from CloudWatch
     */
    private function getCloudWatchLogs($limit = 50)
    {
        // Check if we're in Vapor environment and have necessary config
        if (!$this->isVaporEnvironment()) {
            return [];
        }

        try {
            // Import AWS SDK
            $cloudWatchLogs = new \Aws\CloudWatchLogs\CloudWatchLogsClient([
                'version' => 'latest',
                'region' => config('services.aws.region', 'us-east-1'),
                'credentials' => [
                    'key' => config('services.aws.key'),
                    'secret' => config('services.aws.secret'),
                ]
            ]);

            // Determine log group name - Vapor typically uses this pattern
            $logGroupName = '/aws/lambda/vapor-' . config('app.name', 'laravel-app');
            
            // Get log streams for the log group
            $logStreams = $cloudWatchLogs->describeLogStreams([
                'logGroupName' => $logGroupName,
                'orderBy' => 'LastEventTime',
                'descending' => true,
                'limit' => 5 // Get latest 5 streams
            ]);

            $allLogs = [];
            
            // Get events from each log stream
            foreach ($logStreams['logStreams'] as $stream) {
                try {
                    $events = $cloudWatchLogs->getLogEvents([
                        'logGroupName' => $logGroupName,
                        'logStreamName' => $stream['logStreamName'],
                        'limit' => min($limit, 100),
                        'startFromHead' => false // Get latest events first
                    ]);

                    foreach ($events['events'] as $event) {
                        $timestamp = date('Y-m-d H:i:s', $event['timestamp'] / 1000);
                        $message = trim($event['message']);
                        
                        // Format message to match Laravel log format if it's not already
                        if (!preg_match('/^\[\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}\]/', $message)) {
                            $message = "[{$timestamp}] production.INFO: {$message}";
                        }
                        
                        $allLogs[] = $message;
                    }
                } catch (Exception $streamException) {
                    // Continue with other streams if one fails
                    continue;
                }
            }

            // Sort logs by timestamp (newest first) and limit results
            usort($allLogs, function($a, $b) {
                preg_match('/\[(\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2})\]/', $a, $matchesA);
                preg_match('/\[(\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2})\]/', $b, $matchesB);
                
                if (isset($matchesA[1]) && isset($matchesB[1])) {
                    return strtotime($matchesB[1]) - strtotime($matchesA[1]);
                }
                return 0;
            });

            $logs = array_slice($allLogs, 0, $limit);
            
            // If no logs found, provide helpful message
            if (empty($logs)) {
                return [
                    '[' . now()->format('Y-m-d H:i:s') . '] production.INFO: CloudWatch logging is active',
                    '[' . now()->format('Y-m-d H:i:s') . '] production.INFO: No recent logs found in log group: ' . $logGroupName,
                    '[' . now()->format('Y-m-d H:i:s') . '] production.INFO: Logs may take a few minutes to appear in CloudWatch'
                ];
            }

            return $logs;
            
        } catch (Exception $e) {
            Log::error('Failed to fetch CloudWatch logs: ' . $e->getMessage());
            
            // Return fallback sample logs with error information
            return [
                '[' . now()->format('Y-m-d H:i:s') . '] production.ERROR: CloudWatch access failed: ' . $e->getMessage(),
                '[' . now()->format('Y-m-d H:i:s') . '] production.INFO: CloudWatch logging is active but credentials may be missing',
                '[' . now()->format('Y-m-d H:i:s') . '] production.INFO: Configure AWS credentials in services.aws config',
                '[' . now()->format('Y-m-d H:i:s') . '] production.INFO: For detailed logs, use Vapor dashboard or AWS CloudWatch console'
            ];
        }
    }

    /**
     * Check if running in Vapor environment
     */
    private function isVaporEnvironment()
    {
        return isset($_ENV['VAPOR_ARTIFACT_NAME']) || 
               isset($_SERVER['VAPOR_ARTIFACT_NAME']) ||
               config('app.env') === 'vapor' ||
               (config('app.env') === 'production' && !File::exists(storage_path('logs/laravel.log')));
    }

    /**
     * API endpoint to get logs as JSON
     */
    public function getLogs(Request $request)
    {
        $isVapor = $this->isVaporEnvironment();
        
        if ($isVapor) {
            try {
                $logs = $this->getCloudWatchLogs($request->get('limit', 100));
                return response()->json([
                    'status' => 'success',
                    'message' => 'CloudWatch logs retrieved',
                    'logs' => $logs,
                    'isVapor' => true,
                    'note' => 'For detailed logs, please use Vapor dashboard or AWS CloudWatch console'
                ]);
            } catch (Exception $e) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'CloudWatch logs not accessible',
                    'logs' => [],
                    'isVapor' => true,
                    'error' => $e->getMessage()
                ]);
            }
        } else {
            $logPath = storage_path('logs/laravel.log');
            if (!File::exists($logPath)) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Log file not found',
                    'logs' => [],
                    'isVapor' => false
                ]);
            }

            $logs = $this->getRecentFileLogs($logPath, $request->get('limit', 100));
            return response()->json([
                'status' => 'success',
                'message' => 'File logs retrieved',
                'logs' => $logs,
                'isVapor' => false
            ]);
        }
    }

    /**
     * Format bytes to human readable format
     */
    private function formatBytes($bytes, $precision = 2)
    {
        $units = array('B', 'KB', 'MB', 'GB', 'TB');
        
        for ($i = 0; $bytes > 1024; $i++) {
            $bytes /= 1024;
        }
        
        return round($bytes, $precision) . ' ' . $units[$i];
    }
}