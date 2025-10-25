<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Auth;

class SubscriptionSyncController extends Controller
{
    public function __construct()
    {
        $this->middleware('auth');
    }

    /**
     * Sync current user's subscription status
     */
    public function syncCurrentUser()
    {
        $user = Auth::user();
        
        if ($user->role !== 1) {
            return response()->json([
                'success' => false,
                'message' => 'Only creators can sync subscription status'
            ], 403);
        }

        try {
            // Run sync command for current user
            Artisan::call('subscription:sync', [
                '--user_id' => $user->id
            ]);
            
            $output = Artisan::output();
            
            // Refresh user data
            $user->refresh();
            
            return response()->json([
                'success' => true,
                'message' => 'Subscription status synchronized successfully',
                'subscription_status' => $user->subscription_status,
                'is_subscribed' => $user->is_subscribed,
                'output' => $output
            ]);
            
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to sync subscription status: ' . $e->getMessage()
            ], 500);
        }
    }
}