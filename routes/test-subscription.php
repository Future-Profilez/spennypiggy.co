<?php

use App\Models\User;
use App\Services\CreatorSubscriptionService;
use Illuminate\Support\Facades\Route;

Route::middleware('auth')->prefix('test-subscription')->group(function () {

    // Test current user's subscription status
    Route::get('/my-status', function () {
        $user = auth()->user();
        $service = app(CreatorSubscriptionService::class);

        return response()->json([
            'user_id' => $user->id,
            'username' => $user->username,
            'role' => $user->role,
            'subscription_validation' => $service->validateCreatorSubscription($user),
            'subscription_accessor' => $user->subscription_status,
            'monthly_subscription' => $user->creatorMonthlySubscription,
            'needs_warning' => $service->needsSubscriptionWarning($user),
        ]);
    });

    // Test specific user's subscription status
    Route::get('/user/{userId}', function ($userId) {
        $user = User::findOrFail($userId);
        $service = app(CreatorSubscriptionService::class);

        return response()->json([
            'user_id' => $user->id,
            'username' => $user->username,
            'role' => $user->role,
            'subscription_validation' => $service->validateCreatorSubscription($user),
            'subscription_accessor' => $user->subscription_status,
            'monthly_subscription' => $user->creatorMonthlySubscription,
            'needs_warning' => $service->needsSubscriptionWarning($user),
        ]);
    });

    // Test payment validation for current user
    Route::post('/validate-payment', function () {
        $user = auth()->user();
        $service = app(CreatorSubscriptionService::class);

        $paymentData = [
            'payer' => auth()->user(),
            'amount' => request()->input('amount', 100),
            'currency' => request()->input('currency', 'USD'),
            'payment_type' => request()->input('payment_type', 'test'),
            'payment_method' => 'stripe',
        ];

        $validation = $service->validatePaymentSubscription($user, $paymentData);

        return response()->json([
            'user_id' => $user->id,
            'username' => $user->username,
            'payment_data' => $paymentData,
            'validation_result' => $validation,
            'blocked' => ! $validation['eligible'],
        ]);
    });

    // Get all creators needing warnings
    Route::get('/creators-needing-warnings', function () {
        $service = app(CreatorSubscriptionService::class);
        $creators = $service->getCreatorsNeedingSubscriptionWarnings();

        return response()->json([
            'count' => $creators->count(),
            'creators' => $creators->map(function ($creator) use ($service) {
                return [
                    'id' => $creator->id,
                    'username' => $creator->username,
                    'subscription_status' => $creator->subscription_status,
                    'validation' => $service->validateCreatorSubscription($creator),
                    'needs_warning' => $service->needsSubscriptionWarning($creator),
                ];
            }),
        ]);
    });
});
