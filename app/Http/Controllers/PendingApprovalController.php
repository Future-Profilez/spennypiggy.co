<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Services\PendingApprovalService;
use Exception;

class PendingApprovalController extends Controller
{
    /**
     * Manually trigger the pending approval job
     * 
     * This endpoint runs the same logic as the scheduled job that runs every 30 minutes:
     * - Collects all unapproved items (wish items, memberships, bills, shops, user intros, posts, user avatars, user profiles)
     * - Sends the actual summary email to configured recipients
     * - Returns the summary data as JSON
     *
     * @param PendingApprovalService $service
     * @return \Illuminate\Http\JsonResponse
     */
    public function manualTrigger(PendingApprovalService $service)
    {
        try {
            $summary = $service->buildAndSend();

            if (!empty($summary)) {
                return response()->json([
                    'status' => 'success',
                    'message' => 'Pending approval email sent successfully.',
                    'email_sent' => true,
                    'summary' => $summary,
                    'timestamp' => now()->toISOString()
                ]);
            } else {
                return response()->json([
                    'status' => 'success',
                    'message' => 'No pending items found to send.',
                    'email_sent' => false,
                    'summary' => [],
                    'timestamp' => now()->toISOString()
                ]);
            }
        } catch (Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Failed to process pending approval summary: ' . $e->getMessage(),
                'email_sent' => false,
                'summary' => [],
                'timestamp' => now()->toISOString()
            ], 500);
        }
    }
}
