<?php

namespace App\Helpers;

use App\Models\User;
use App\Services\CreatorActivityService;
use App\Services\CreatorSubscriptionService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class PaymentValidationHelper
{
    protected $activityService;
    protected $subscriptionService;

    public function __construct(CreatorActivityService $activityService, CreatorSubscriptionService $subscriptionService)
    {
        $this->activityService = $activityService;
        $this->subscriptionService = $subscriptionService;
    }

    /**
     * Validate payment eligibility before processing
     * Returns null if payment is allowed, or error response if blocked
     */
    public function validatePaymentEligibility(User $creator, array $paymentData): ?JsonResponse
    {
        // First check subscription status
        $subscriptionValidation = $this->subscriptionService->validatePaymentSubscription($creator, $paymentData);
        
        // If subscription is not valid, block payment
        if (!$subscriptionValidation['eligible']) {
            return response()->json([
                'success' => false,
                'error' => 'payment_blocked',
                'message' => $subscriptionValidation['message'],
                'details' => [
                    'blocked_reason' => $subscriptionValidation['status'],
                    'subscription_status' => $subscriptionValidation['subscription_status'] ?? 'unknown',
                    'action_required' => $subscriptionValidation['action_required'] ?? null,
                    'suggestions' => $subscriptionValidation['suggestions'] ?? [],
                ]
            ], 402); // Payment Required
        }

        // Then validate creator activity and log if blocked
        $activityValidation = $this->activityService->validatePaymentAndLog($creator, $paymentData);

        // If activity is not sufficient, block payment
        if (!$activityValidation['eligible']) {
            return response()->json([
                'success' => false,
                'error' => 'payment_blocked',
                'message' => $activityValidation['message'],
                'details' => [
                    'blocked_reason' => $activityValidation['status'],
                    'content_count' => $activityValidation['content_count'] ?? 0,
                    'needed_content' => $activityValidation['needed'] ?? 0,
                    'suggestions' => $activityValidation['suggestions'] ?? [],
                ]
            ], 402); // Payment Required
        }

        return null; // Payment is allowed
    }

    /**
     * Example integration for tip payments
     */
    public function processTipPayment(Request $request, User $creator)
    {
        $paymentData = [
            'payer' => auth()->user(),
            'amount' => $request->input('amount'),
            'currency' => $request->input('currency', 'USD'),
            'payment_type' => 'tip',
            'payment_method' => 'stripe',
            'metadata' => [
                'tip_message' => $request->input('message'),
                'is_anonymous' => $request->boolean('is_anonymous'),
            ]
        ];

        // Check if payment is allowed
        $blockResponse = $this->validatePaymentEligibility($creator, $paymentData);
        if ($blockResponse) {
            return $blockResponse; // Return error response
        }

        // Continue with normal payment processing...
        // Your existing tip payment logic here
        
        return response()->json([
            'success' => true,
            'message' => 'Tip payment processed successfully'
        ]);
    }

    /**
     * Example integration for bill payments
     */
    public function processBillPayment(Request $request, User $creator, $billId)
    {
        $paymentData = [
            'payer' => auth()->user(),
            'amount' => $request->input('amount'),
            'currency' => $request->input('currency', 'USD'),
            'payment_type' => 'bill',
            'payment_method' => 'stripe',
            'metadata' => [
                'bill_id' => $billId,
                'custom_fields' => $request->input('custom_fields', []),
            ]
        ];

        // Check if payment is allowed
        $blockResponse = $this->validatePaymentEligibility($creator, $paymentData);
        if ($blockResponse) {
            return $blockResponse; // Return error response
        }

        // Continue with normal payment processing...
        // Your existing bill payment logic here
        
        return response()->json([
            'success' => true,
            'message' => 'Bill payment processed successfully'
        ]);
    }

    /**
     * Example integration for membership payments
     */
    public function processMembershipPayment(Request $request, User $creator, $membershipId)
    {
        $paymentData = [
            'payer' => auth()->user(),
            'amount' => $request->input('amount'),
            'currency' => $request->input('currency', 'USD'),
            'payment_type' => 'membership',
            'payment_method' => 'stripe',
            'metadata' => [
                'membership_id' => $membershipId,
                'subscription_period' => $request->input('period'),
            ]
        ];

        // Check if payment is allowed
        $blockResponse = $this->validatePaymentEligibility($creator, $paymentData);
        if ($blockResponse) {
            return $blockResponse; // Return error response
        }

        // Continue with normal payment processing...
        // Your existing membership payment logic here
        
        return response()->json([
            'success' => true,
            'message' => 'Membership payment processed successfully'
        ]);
    }

    /**
     * Example integration for wish item payments
     */
    public function processWishPayment(Request $request, User $creator, $wishId)
    {
        $paymentData = [
            'payer' => auth()->user(),
            'amount' => $request->input('amount'),
            'currency' => $request->input('currency', 'USD'),
            'payment_type' => 'wish',
            'payment_method' => 'stripe',
            'metadata' => [
                'wish_id' => $wishId,
                'quantity' => $request->input('quantity', 1),
            ]
        ];

        // Check if payment is allowed
        $blockResponse = $this->validatePaymentEligibility($creator, $paymentData);
        if ($blockResponse) {
            return $blockResponse; // Return error response
        }

        // Continue with normal payment processing...
        // Your existing wish payment logic here
        
        return response()->json([
            'success' => true,
            'message' => 'Wish item payment processed successfully'
        ]);
    }

    /**
     * Example integration for shop item payments
     */
    public function processShopPayment(Request $request, User $creator, $shopItemId)
    {
        $paymentData = [
            'payer' => auth()->user(),
            'amount' => $request->input('amount'),
            'currency' => $request->input('currency', 'USD'),
            'payment_type' => 'shop',
            'payment_method' => 'stripe',
            'metadata' => [
                'shop_item_id' => $shopItemId,
                'quantity' => $request->input('quantity', 1),
                'shipping_address' => $request->input('shipping_address'),
            ]
        ];

        // Check if payment is allowed
        $blockResponse = $this->validatePaymentEligibility($creator, $paymentData);
        if ($blockResponse) {
            return $blockResponse; // Return error response
        }

        // Continue with normal payment processing...
        // Your existing shop payment logic here
        
        return response()->json([
            'success' => true,
            'message' => 'Shop item payment processed successfully'
        ]);
    }
}
