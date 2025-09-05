<?php

namespace App\Helpers;

use App\Models\User;
use App\Services\CreatorActivityService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class PaymentValidationHelper
{
    protected $activityService;

    public function __construct(CreatorActivityService $activityService)
    {
        $this->activityService = $activityService;
    }

    /**
     * Validate payment eligibility before processing
     * Returns null if payment is allowed, or error response if blocked
     */
    public function validatePaymentEligibility(User $creator, array $paymentData): ?JsonResponse
    {
        // Validate creator activity and log if blocked
        $validation = $this->activityService->validatePaymentAndLog($creator, $paymentData);

        // If not eligible, return error response
        if (!$validation['eligible']) {
            return response()->json([
                'success' => false,
                'error' => 'payment_blocked',
                'message' => $validation['message'],
                'details' => [
                    'blocked_reason' => $validation['status'],
                    'content_count' => $validation['content_count'] ?? 0,
                    'needed_content' => $validation['needed'] ?? 0,
                    'suggestions' => $validation['suggestions'] ?? [],
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
