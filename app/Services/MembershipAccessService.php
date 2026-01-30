<?php

namespace App\Services;

use App\Models\Deliverable;
use App\Models\MembershipPayment;
use App\Models\Membership;
use Carbon\Carbon;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Cache;

class MembershipAccessService
{
    protected $profileService;

    public function __construct(UserProfileService $profileService)
    {
        $this->profileService = $profileService;
    }

    /**
     * Check if user has active membership access to a specific creator's content
     *
     * @param int $userId
     * @param int $creatorId
     * @param string $membershipLevel (optional) - specific level to check
     * @return array
     */
    public function hasActiveMembership($userId, $creatorId, $membershipLevel = null)
    {
        try {
            if (!$userId || !$creatorId) {
                return [
                    'has_access' => false,
                    'reason' => 'Invalid user or creator ID',
                    'membership' => null
                ];
            }

            // Direct check - No Caching
            Log::info('MembershipAccessService: Checking membership access', [
                'user_id' => $userId,
                'creator_id' => $creatorId,
                'membership_level' => $membershipLevel
            ]);

            // Method 1: Check via active deliverables (most reliable)
            $accessViaDeliverables = $this->checkAccessViaDeliverables($userId, $creatorId, $membershipLevel);
            if ($accessViaDeliverables['has_access']) {
                return $accessViaDeliverables;
            }

            // Method 2: Check via active subscription payments (fallback)
            $accessViaSubscriptions = $this->checkAccessViaSubscriptions($userId, $creatorId, $membershipLevel);
            if ($accessViaSubscriptions['has_access']) {
                return $accessViaSubscriptions;
            }

            // Method 3: Check for lifetime membership
            $lifetimeAccess = $this->checkLifetimeMembership($userId, $creatorId, $membershipLevel);
            if ($lifetimeAccess['has_access']) {
                return $lifetimeAccess;
            }

            return [
                'has_access' => false,
                'reason' => 'No active membership found',
                'membership' => null,
                'expires_at' => null
            ];

        } catch (\Exception $e) {
            Log::error('MembershipAccessService: Error checking membership access', [
                'user_id' => $userId,
                'creator_id' => $creatorId,
                'error' => $e->getMessage()
            ]);

            return [
                'has_access' => false,
                'reason' => 'System error checking membership access',
                'membership' => null
            ];
        }
    }

    /**
     * Check access via active deliverables (primary method)
     */
    private function checkAccessViaDeliverables($userId, $creatorId, $membershipLevel = null)
    {
        $query = Deliverable::where('gifter_id', $userId)
            ->where('creator_id', $creatorId)
            ->where('product_type', 'membership')
            ->where('status', 'delivered')
            ->whereNotNull('delivered_at');

        $deliverables = $query->get();

        Log::info('MembershipAccessService: Found deliverables', [
            'user_id' => $userId,
            'creator_id' => $creatorId,
            'deliverables_count' => $deliverables->count()
        ]);

        foreach ($deliverables as $deliverable) {
            $metadata = json_decode($deliverable->metadata, true) ?? [];
            
            // Check if this deliverable matches the required membership level
            if ($membershipLevel && 
                isset($metadata['membership_level']) && 
                $metadata['membership_level'] !== $membershipLevel) {
                continue;
            }

            // Check if membership is still active based on subscription status
            if (isset($metadata['subscription_id']) && !empty($metadata['subscription_id'])) {
                $subscriptionActive = $this->isSubscriptionActive($metadata['subscription_id']);
                
                if ($subscriptionActive) {
                    $membership = Membership::find($metadata['membership_id'] ?? null);
                    
                    return [
                        'has_access' => true,
                        'reason' => 'Active subscription membership via deliverable',
                        'membership' => $membership,
                        'membership_level' => $metadata['membership_level'] ?? null,
                        'subscription_id' => $metadata['subscription_id'],
                        'deliverable_id' => $deliverable->id,
                        'access_method' => 'deliverable_subscription'
                    ];
                }
            }
            // Check for lifetime membership
            elseif (isset($metadata['recurring_type']) && $metadata['recurring_type'] === 'lifetime') {
                $membership = Membership::find($metadata['membership_id'] ?? null);
                
                return [
                    'has_access' => true,
                    'reason' => 'Lifetime membership via deliverable',
                    'membership' => $membership,
                    'membership_level' => $metadata['membership_level'] ?? null,
                    'deliverable_id' => $deliverable->id,
                    'access_method' => 'deliverable_lifetime'
                ];
            }
        }

        return ['has_access' => false];
    }

    /**
     * Check access via active subscription payments (fallback)
     */
    private function checkAccessViaSubscriptions($userId, $creatorId, $membershipLevel = null)
    {
        $query = MembershipPayment::where('user_id', $userId)
            ->where('status', 'paid')
            ->whereHas('membership', function ($q) use ($creatorId, $membershipLevel) {
                $q->where('user_id', $creatorId);
                if ($membershipLevel) {
                    $q->where('level', $membershipLevel);
                }
            })
            ->with('membership');

        // For recurring memberships, check if subscription is still active
        $activeSubscriptions = $query->where('recurring_for', '!=', 'onetime')
            ->whereNotNull('stripe_id')
            ->get();

        foreach ($activeSubscriptions as $subscription) {
            if ($this->isSubscriptionActive($subscription->stripe_id)) {
                return [
                    'has_access' => true,
                    'reason' => 'Active recurring subscription',
                    'membership' => $subscription->membership,
                    'membership_level' => $subscription->membership->level,
                    'subscription_id' => $subscription->stripe_id,
                    'membership_payment_id' => $subscription->id,
                    'access_method' => 'subscription_payment'
                ];
            }
        }

        // Check for lifetime memberships
        $lifetimePayments = $query->where('recurring_type', 'lifetime')->get();
        
        foreach ($lifetimePayments as $payment) {
            return [
                'has_access' => true,
                'reason' => 'Lifetime membership',
                'membership' => $payment->membership,
                'membership_level' => $payment->membership->level,
                'membership_payment_id' => $payment->id,
                'access_method' => 'lifetime_payment'
            ];
        }

        return ['has_access' => false];
    }

    /**
     * Check for lifetime membership access
     */
    private function checkLifetimeMembership($userId, $creatorId, $membershipLevel = null)
    {
        $query = MembershipPayment::where('user_id', $userId)
            ->where('status', 'paid')
            ->where('recurring_type', 'lifetime')
            ->whereHas('membership', function ($q) use ($creatorId, $membershipLevel) {
                $q->where('user_id', $creatorId);
                if ($membershipLevel) {
                    $q->where('level', $membershipLevel);
                }
            })
            ->with('membership')
            ->latest()
            ->first();

        if ($query) {
            return [
                'has_access' => true,
                'reason' => 'Lifetime membership',
                'membership' => $query->membership,
                'membership_level' => $query->membership->level,
                'membership_payment_id' => $query->id,
                'access_method' => 'lifetime_membership'
            ];
        }

        return ['has_access' => false];
    }

    /**
     * Check if Stripe subscription is active
     */
    private function isSubscriptionActive($subscriptionId)
    {
        try {
            if (empty($subscriptionId)) {
                return false;
            }

            // Direct check - No Caching
            $stripe = new \Stripe\StripeClient(env('STRIPE_SECRET_KEY'));
            $subscription = $stripe->subscriptions->retrieve($subscriptionId);
            
            $isActive = in_array($subscription->status, ['active', 'trialing', 'past_due']);
            
            Log::info('MembershipAccessService: Checked Stripe subscription status', [
                'subscription_id' => $subscriptionId,
                'status' => $subscription->status,
                'is_active' => $isActive
            ]);

            return $isActive;

        } catch (\Exception $e) {
            Log::warning('MembershipAccessService: Failed to check subscription status', [
                'subscription_id' => $subscriptionId,
                'error' => $e->getMessage()
            ]);
            
            // If we can't check Stripe, assume inactive for safety
            return false;
        }
    }

    /**
     * Get all active memberships for a user
     */
    public function getUserActiveMemberships($userId)
    {
        try {
            $memberships = [];
            
            // Get all creators this user has memberships with
            $creatorIds = MembershipPayment::where('user_id', $userId)
                ->where('status', 'paid')
                ->with('membership')
                ->get()
                ->pluck('membership.user_id')
                ->unique()
                ->filter();

            foreach ($creatorIds as $creatorId) {
                $access = $this->hasActiveMembership($userId, $creatorId);
                if ($access['has_access']) {
                    $memberships[] = $access;
                }
            }

            return $memberships;

        } catch (\Exception $e) {
            Log::error('MembershipAccessService: Error getting user memberships', [
                'user_id' => $userId,
                'error' => $e->getMessage()
            ]);

            return [];
        }
    }

    /**
     * Clear membership access cache for user
     */
    public function clearUserCache($userId, $creatorId = null)
    {
        // Caching removed
    }
}