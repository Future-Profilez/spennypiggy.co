<?php

namespace App\Services;

use App\Models\User;
use Carbon\Carbon;
use Illuminate\Support\Facades\Log;
use Stripe\Stripe;
use Stripe\Subscription;

class CreatorSubscriptionService
{
    /**
     * Main method to validate creator's subscription status for payment eligibility
     */
    public function validateCreatorSubscription(User $creator): array
    {
        try {
            // Only applies to creators
            if ($creator->role !== 1) {
                return [
                    'eligible' => true,
                    'status' => 'not_creator',
                    'message' => 'Subscription validation only applies to creators'
                ];
            }

            // Check subscription status using the user accessor
            $subscriptionStatus = $creator->subscription_status;
            
            Log::info('Subscription validation check', [
                'creator_id' => $creator->id,
                'creator_username' => $creator->username,
                'subscription_status' => $subscriptionStatus,
                'is_subscribed' => $creator->is_subscribed
            ]);

            // Status 0 = No subscription or inactive
            if ($subscriptionStatus === 0) {
                return [
                    'eligible' => false,
                    'status' => 'no_subscription',
                    'message' => '💳 Active subscription required to receive payments',
                    'subscription_status' => $subscriptionStatus,
                    'action_required' => 'subscribe',
                    'suggestions' => $this->getSubscriptionSuggestions()
                ];
            }

            // Status 1 = Active subscription
            if ($subscriptionStatus === 1) {
                return [
                    'eligible' => true,
                    'status' => 'active_subscription',
                    'message' => '✅ Subscription active',
                    'subscription_status' => $subscriptionStatus
                ];
            }

            // Status 2 = Trial or trial ending
            if ($subscriptionStatus === 2) {
                $subscription = $creator->creatorMonthlySubscription;
                $trialMessage = '🌟 Trial period active';
                
                if ($subscription && $subscription->status === 'trial_ending') {
                    $trialMessage = '⏰ Trial ending soon - please update payment method';
                }

                return [
                    'eligible' => true,
                    'status' => 'trial_active',
                    'message' => $trialMessage,
                    'subscription_status' => $subscriptionStatus,
                    'action_required' => $subscription && $subscription->status === 'trial_ending' ? 'update_payment' : null
                ];
            }

            // Unknown status
            return [
                'eligible' => false,
                'status' => 'unknown_subscription_status',
                'message' => '⚠️ Unable to verify subscription status - please contact support',
                'subscription_status' => $subscriptionStatus
            ];

        } catch (\Exception $e) {
            Log::error('CreatorSubscriptionService validation error: ' . $e->getMessage());
            
            // Fail safely - allow payment but log error
            return [
                'eligible' => true,
                'status' => 'error',
                'message' => 'Subscription validation temporarily unavailable'
            ];
        }
    }

    /**
     * Get subscription suggestions for creators without active subscriptions
     */
    public function getSubscriptionSuggestions(): array
    {
        return [
            [
                'type' => 'subscribe',
                'title' => 'Activate Subscription',
                'description' => 'Get your mandatory creator subscription to start receiving payments',
                'action_url' => '/activate-subscription',
                'estimated_time' => '5 minutes',
                'priority' => 'high'
            ],
            [
                'type' => 'contact_support',
                'title' => 'Need Help?',
                'description' => 'Contact our support team for assistance with subscription setup',
                'action_url' => 'https://spennypiggy.co',
                'estimated_time' => 'Immediate',
                'priority' => 'medium'
            ]
        ];
    }

    /**
     * Check if creator needs subscription warning
     */
    public function needsSubscriptionWarning(User $creator): bool
    {
        $validation = $this->validateCreatorSubscription($creator);
        
        return !$validation['eligible'] || 
               ($validation['status'] === 'trial_active' && isset($validation['action_required']));
    }

    /**
     * Get subscription status for dashboard display
     */
    public function getSubscriptionStatus(User $creator): array
    {
        $validation = $this->validateCreatorSubscription($creator);
        
        return [
            'status' => $validation['status'],
            'message' => $validation['message'],
            'eligible' => $validation['eligible'],
            'subscription_status' => $validation['subscription_status'] ?? 'unknown',
            'action_required' => $validation['action_required'] ?? null,
            'suggestions' => $validation['suggestions'] ?? []
        ];
    }

    /**
     * Validate payment and ensure subscription is active
     */
    public function validatePaymentSubscription(User $creator, array $paymentData): array
    {
        $validation = $this->validateCreatorSubscription($creator);
        
        // If payment is not eligible due to subscription, log it
        if (!$validation['eligible']) {
            Log::warning('Payment blocked due to subscription issue', [
                'creator_id' => $creator->id,
                'creator_username' => $creator->username,
                'amount' => $paymentData['amount'] ?? 0,
                'payment_type' => $paymentData['payment_type'] ?? 'unknown',
                'blocked_reason' => $validation['status'],
                'subscription_status' => $validation['subscription_status'] ?? 'unknown'
            ]);
        }
        
        return $validation;
    }

    /**
     * Get creators who need subscription warnings
     */
    public function getCreatorsNeedingSubscriptionWarnings(): \Illuminate\Database\Eloquent\Collection
    {
        return User::where('role', 1)
            ->where('stripe_details_submitted', 1) // Only verified creators
            ->get()
            ->filter(function ($creator) {
                return $this->needsSubscriptionWarning($creator);
            });
    }

    /**
     * Clear subscription cache for a creator (if caching is added later)
     */
    public function clearSubscriptionCache(User $creator): void
    {
        // For future caching implementation
        // Cache::forget("creator_subscription_status_{$creator->id}");
    }

    /**
     * Check if subscription is about to expire
     */
    public function isSubscriptionExpiringsoon(User $creator, int $daysThreshold = 7): bool
    {
        $subscription = $creator->creatorMonthlySubscription;
        
        if (!$subscription || !$subscription->stripe_id) {
            return false;
        }

        try {
            Stripe::setApiKey(env('STRIPE_SECRET_KEY'));
            $stripeSubscription = Subscription::retrieve($subscription->stripe_id);
            
            if ($stripeSubscription->status === 'trialing' && $stripeSubscription->trial_end) {
                $trialEndDate = Carbon::createFromTimestamp($stripeSubscription->trial_end);
                return Carbon::now()->diffInDays($trialEndDate, false) <= $daysThreshold;
            }

            return false;
        } catch (\Exception $e) {
            Log::error('Error checking subscription expiration: ' . $e->getMessage());
            return false;
        }
    }
}
