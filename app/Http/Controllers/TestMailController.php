<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Notification;
use App\Notifications\PendingApprovalNotification;

class TestMailController extends Controller
{
    /**
     * Manually trigger the pending approval notification mail
     */
    public function sendPendingApprovalMail()
    {
        try {
            // Call the artisan command that sends pending approval notifications
            $exitCode = Artisan::call('app:notifications-pending-approval');
            
            if ($exitCode === 0) {
                return response()->json([
                    'status' => 'success',
                    'message' => 'Pending approval notification command executed successfully.',
                    'output' => Artisan::output()
                ]);
            } else {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Command failed to execute.',
                    'output' => Artisan::output()
                ], 500);
            }
        } catch (\Exception $e) {
            Log::error('Failed to send pending approval notification: ' . $e->getMessage());
            
            return response()->json([
                'status' => 'error',
                'message' => 'Failed to send notification: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Send a test pending approval notification with mock data
     */
    public function sendTestPendingApprovalMail()
    {
        try {
            // Mock data for testing
            $pendingSummary = [
                [
                    'label' => 'Wish Items',
                    'count' => 5,
                    'items' => collect([]),
                    'icon' => '🎁'
                ],
                [
                    'label' => 'User Avatars',
                    'count' => 3,
                    'items' => collect([]),
                    'icon' => '👤'
                ],
                [
                    'label' => 'Posts',
                    'count' => 2,
                    'items' => collect([]),
                    'icon' => '📝'
                ],
                [
                    'label' => 'Memberships',
                    'count' => 1,
                    'items' => collect([]),
                    'icon' => '👑'
                ]
            ];

            // Get application URL and find matching email recipients from config
            $appUrl = env('APP_URL');
            $allConfigs = collect(config('pending-approval'));
            $environmentConfig = $allConfigs->first(fn($config) => in_array($appUrl, $config['domains'])); 
            $emails = $environmentConfig['emails'] ?? [];

            if (!empty($emails)) {
                // Send notification to all configured recipients
                Notification::route('mail', $emails)
                    ->notify(new PendingApprovalNotification($pendingSummary));
                
                return response()->json([
                    'status' => 'success',
                    'message' => 'Test pending approval notification sent successfully to: ' . implode(', ', $emails),
                    'data' => $pendingSummary
                ]);
            } else {
                return response()->json([
                    'status' => 'error',
                    'message' => 'No email recipients configured for URL: ' . $appUrl
                ], 400);
            }
        } catch (\Exception $e) {
            Log::error('Failed to send test pending approval notification: ' . $e->getMessage());
            
            return response()->json([
                'status' => 'error',
                'message' => 'Failed to send test notification: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get current pending approval configuration
     */
    public function getPendingApprovalConfig()
    {
        $appUrl = env('APP_URL');
        $allConfigs = collect(config('pending-approval'));
        $environmentConfig = $allConfigs->first(fn($config) => in_array($appUrl, $config['domains'])); 
        
        return response()->json([
            'app_url' => $appUrl,
            'config' => $environmentConfig,
            'all_configs' => config('pending-approval')
        ]);
    }
}
