<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Route;

Route::middleware(['auth', 'mustCompletedStripeIdentity', 'mustHaveToVerify'])->group(function () {
    Route::get('/debug-wish-creation', function () {
        $user = Auth::user();

        return response()->json([
            'user_authenticated' => Auth::check(),
            'user_id' => $user->id ?? null,
            'email_verified' => $user->email_verified_at !== null,
            'role' => $user->role ?? null,
            'identity_status' => $user->identity_status ?? null,
            'profile_status_lock' => $user->profile_status_lock ?? null,
            'subscription_status' => $user->subscription_status ?? null,
            'account_id' => $user->account_id ?? null,
            'charges_enabled' => $user->charges_enabled ?? null,
            'middleware_should_pass' => true,
            'debug_info' => [
                'has_paid_subscription' => in_array($user->subscription_status, [1, 2]),
                'needs_identity_verification' => $user->role == 1
                    && $user->profile_status_lock == 2
                    && $user->identity_status != 1
                    && in_array($user->subscription_status, [1, 2]),
            ],
        ]);
    });

    Route::post('/debug-wish-creation-test', function (Request $request) {
        return response()->json([
            'success' => true,
            'message' => 'Request reached controller successfully',
            'data' => $request->all(),
            'user_id' => Auth::id(),
        ]);
    });
});

Route::get('/debug-wish-no-middleware', function () {
    return response()->json([
        'success' => true,
        'message' => 'Route accessible without middleware',
        'authenticated' => Auth::check(),
        'user_id' => Auth::id() ?? null,
    ]);
});
