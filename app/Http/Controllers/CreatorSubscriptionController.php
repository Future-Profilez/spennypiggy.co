<?php

namespace App\Http\Controllers;

use App\Services\CreatorSubscriptionService;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;

class CreatorSubscriptionController extends Controller
{
    protected $subscriptionService;

    public function __construct(CreatorSubscriptionService $subscriptionService)
    {
        $this->subscriptionService = $subscriptionService;
        $this->middleware('auth');
    }

    /**
     * Get subscription status for the authenticated creator
     */
    public function getSubscriptionStatus(): JsonResponse
    {
        $user = Auth::user();
        
        // Only creators can check subscription status
        if ($user->role !== 1) {
            return response()->json([
                'eligible' => true,
                'status' => 'not_creator',
                'message' => 'Subscription validation only applies to creators'
            ]);
        }

        try {
            $status = $this->subscriptionService->getSubscriptionStatus($user);
            return response()->json($status);
        } catch (\Exception $e) {
            return response()->json([
                'eligible' => true,
                'status' => 'error',
                'message' => 'Unable to check subscription status at this time'
            ], 500);
        }
    }

    /**
     * Validate subscription for payment processing (used by payment controllers)
     */
    public function validatePaymentSubscription(Request $request): JsonResponse
    {
        $user = Auth::user();
        
        if ($user->role !== 1) {
            return response()->json(['eligible' => true]);
        }

        $paymentData = [
            'payer' => Auth::user(),
            'amount' => $request->input('amount'),
            'currency' => $request->input('currency', 'USD'),
            'payment_type' => $request->input('payment_type', 'unknown'),
            'payment_method' => 'stripe',
        ];

        try {
            $validation = $this->subscriptionService->validatePaymentSubscription($user, $paymentData);
            
            if (!$validation['eligible']) {
                return response()->json([
                    'success' => false,
                    'error' => 'subscription_required',
                    'message' => $validation['message'],
                    'details' => [
                        'blocked_reason' => $validation['status'],
                        'subscription_status' => $validation['subscription_status'] ?? 'unknown',
                        'action_required' => $validation['action_required'] ?? null,
                        'suggestions' => $validation['suggestions'] ?? []
                    ]
                ], 402);
            }

            return response()->json(['eligible' => true]);
        } catch (\Exception $e) {
            // Fail safely - allow payment but log error
            return response()->json(['eligible' => true]);
        }
    }

    /**
     * Get detailed subscription information for dashboard
     */
    public function getDashboardInfo(): JsonResponse
    {
        $user = Auth::user();
        
        if ($user->role !== 1) {
            return response()->json([
                'subscription_required' => false,
                'message' => 'Only creators need subscriptions'
            ]);
        }

        try {
            $status = $this->subscriptionService->getSubscriptionStatus($user);
            $needsWarning = $this->subscriptionService->needsSubscriptionWarning($user);
            $subscription = $user->creatorMonthlySubscription;

            return response()->json([
                'subscription_status' => $status,
                'needs_warning' => $needsWarning,
                'subscription_details' => [
                    'has_subscription' => $subscription ? true : false,
                    'status' => $subscription->status ?? 'none',
                    'stripe_id' => $subscription->stripe_id ?? null,
                    'created_at' => $subscription->created_at ?? null,
                ],
                'suggestions' => $status['suggestions'] ?? []
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'subscription_status' => [
                    'eligible' => true,
                    'status' => 'error',
                    'message' => 'Unable to load subscription information'
                ],
                'needs_warning' => false,
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Admin endpoint to get creators needing subscription warnings
     */
    public function getCreatorsNeedingWarnings(): JsonResponse
    {
        // TODO: Add admin middleware
        
        try {
            $creators = $this->subscriptionService->getCreatorsNeedingSubscriptionWarnings();
            
            $creatorsData = $creators->map(function ($creator) {
                $status = $this->subscriptionService->getSubscriptionStatus($creator);
                return [
                    'id' => $creator->id,
                    'username' => $creator->username,
                    'name' => $creator->name,
                    'email' => $creator->email,
                    'subscription_status' => $status,
                    'created_at' => $creator->created_at
                ];
            });

            return response()->json([
                'creators' => $creatorsData,
                'count' => $creatorsData->count()
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'error' => 'Unable to fetch creators needing warnings',
                'message' => $e->getMessage()
            ], 500);
        }
    }
}
