<?php

use App\Models\User;
use App\Models\MonthlyCharge;
use Carbon\Carbon;
use Illuminate\Support\Facades\Route;

Route::middleware('auth')->prefix('test-date')->group(function () {
    
    // Test subscription status for a specific date
    Route::get('/subscription/{date}', function ($date) {
        $user = auth()->user();
        
        // Parse the test date
        $testDate = Carbon::parse($date);
        
        // Find active subscription for the test date
        $subscription = MonthlyCharge::where('user_id', $user->id)
            ->where(function($query) use ($testDate) {
                $query->where(function($q) use ($testDate) {
                    $q->whereDate('current_start_subscription_date', '<=', $testDate)
                      ->whereDate('current_end_subscription_date', '>=', $testDate);
                });
            })
            ->orderByDesc('current_start_subscription_date')
            ->first();
        
        $site_subscription = [
            'status' => 'INACTIVE',
            'subscription_start' => null,
            'subscription_end' => null,
            'next_payment_date' => null,
        ];
        
        if ($subscription) {
            $startDate = Carbon::parse($subscription->current_start_subscription_date);
            $endDate = Carbon::parse($subscription->current_end_subscription_date);
            
            $isSubscriptionActive = $user->is_subscribed == 1 && $testDate->lessThan($endDate);
            
            $site_subscription = [
                'status' => $isSubscriptionActive ? 'ACTIVE' : 'EXPIRED',
                'subscription_start' => $startDate->format('d F Y'),
                'subscription_renew_in' => $endDate->format('d F Y'),
                'next_payment_date' => $endDate->format('d F Y'),
                'subscription_period' => $startDate->format('d M Y') . ' - ' . $endDate->format('d M Y'),
                'amount' => $subscription->currency . $subscription->amount,
                'days_until_renewal' => $testDate->diffInDays($endDate, false)
            ];
        }
        
        return response()->json([
            'test_date' => $testDate->format('Y-m-d H:i:s'),
            'user_id' => $user->id,
            'username' => $user->username,
            'subscription_info' => $site_subscription,
            'subscription_record_id' => $subscription ? $subscription->id : null
        ]);
    });
    
    // Quick links for common test dates
    Route::get('/current', function () {
        return redirect("/test-date/subscription/" . now()->format('Y-m-d'));
    });
    
    Route::get('/october-3', function () {
        return redirect("/test-date/subscription/2025-10-03");
    });
    
    Route::get('/october-4', function () {
        return redirect("/test-date/subscription/2025-10-04");
    });
});