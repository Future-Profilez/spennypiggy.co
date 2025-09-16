<?php

namespace App\Services;

use App\Models\{User, Post, WishItem, Membership, Shop, Bills, BlockedPayment};
use Carbon\Carbon;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;

class CreatorActivityService
{
    const REQUIRED_CONTENT_COUNT = 3;
    const ACTIVITY_PERIOD_DAYS = 28;
    const GRACE_PERIOD_DAYS = 0;

    /**
     * Main method to validate creator's payment eligibility
     */
    public function validateCreatorActivity(User $creator): array
    {
        try {
            // Only applies to creators
            if ($creator->role !== 1) {
                return [
                    'eligible' => true,
                    'status' => 'not_creator',
                    'message' => 'Activity validation only applies to creators'
                ];
            }

            // Check if creator is fully verified
            if (!$this->isFullyVerified($creator)) {
                return [
                    'eligible' => true,
                    'status' => 'not_fully_verified',
                    'message' => 'Complete verification to enable activity requirements'
                ];
            }

            // Check if in grace period using virtual accessor
            if ($creator->is_in_grace_period) {
                return [
                    'eligible' => true,
                    'status' => 'grace_period',
                    'message' => "🌟 Onboarding period active - {$creator->grace_period_days_remaining} days remaining",
                    'days_remaining' => $creator->grace_period_days_remaining,
                    'grace_period_ends' => $creator->grace_period_ends_at,
                    'current_content' => $this->getRecentContentCount($creator)
                ];
            }

            // After grace period - check content requirements
            $contentActivity = $this->getRecentContentCount($creator);
            $contentBreakdown = $this->getContentBreakdown($creator);
            
            // Debug logging to help troubleshoot
            Log::info("Creator Activity Check Debug", [
                'creator_id' => $creator->id,
                'creator_username' => $creator->username,
                'content_activity' => $contentActivity,
                'content_breakdown' => $contentBreakdown,
                'required_count' => self::REQUIRED_CONTENT_COUNT,
                'is_in_grace_period' => $creator->is_in_grace_period,
                'grace_period_days_remaining' => $creator->grace_period_days_remaining ?? 'N/A'
            ]);

            if ($contentActivity >= self::REQUIRED_CONTENT_COUNT) {
                return [
                    'eligible' => true,
                    'status' => 'active',
                    'content_count' => $contentActivity,
                    'breakdown' => $contentBreakdown,
                    'message' => "✅ Active creator with {$contentActivity} recent items"
                ];
            }

            // Not enough content - block payment
            return [
                'eligible' => false,
                'status' => 'insufficient_content',
                'content_count' => $contentActivity,
                'breakdown' => $contentBreakdown,
                'needed' => self::REQUIRED_CONTENT_COUNT - $contentActivity,
                'message' => "📝 Add " . (self::REQUIRED_CONTENT_COUNT - $contentActivity) . " more content items to continue receiving payments",
                'suggestions' => $this->getContentSuggestions($contentBreakdown)
            ];

        } catch (\Exception $e) {
            Log::error('CreatorActivityService validation error: ' . $e->getMessage());
            
            // Fail safely - allow payment but log error
            return [
                'eligible' => true,
                'status' => 'error',
                'message' => 'Activity validation temporarily unavailable'
            ];
        }
    }

    /**
     * Get total count of recent content items (approved only)
     */
    public function getRecentContentCount(User $creator): int
    {
        $cacheKey = "creator_content_count_{$creator->id}";
        
        return Cache::remember($cacheKey, 300, function () use ($creator) { // 5 minute cache
            $since = Carbon::now()->subDays(self::ACTIVITY_PERIOD_DAYS);
            
            $posts = Post::where('user_id', $creator->id)
                ->where('approved', 1)
                ->where('created_at', '>=', $since)
                ->count();
                
            $wishes = WishItem::where('user_id', $creator->id)
                ->where('is_approved', 1)
                ->where('created_at', '>=', $since)
                ->count();
                
            $memberships = Membership::where('user_id', $creator->id)
                ->where('approved', 1)
                ->where('created_at', '>=', $since)
                ->count();
                
            $shops = Shop::where('user_id', $creator->id)
                ->where('approved', 1)
                ->where('created_at', '>=', $since)
                ->count();
                
            return $posts + $wishes + $memberships + $shops;
        });
    }

    /**
     * Get detailed breakdown of content types
     */
    public function getContentBreakdown(User $creator): array
    {
        $cacheKey = "creator_content_breakdown_{$creator->id}";
        
        return Cache::remember($cacheKey, 300, function () use ($creator) {
            $since = Carbon::now()->subDays(self::ACTIVITY_PERIOD_DAYS);
            
            return [
                'posts' => Post::where('user_id', $creator->id)
                    ->where('approved', 1)
                    ->where('created_at', '>=', $since)
                    ->count(),
                    
                'wishes' => WishItem::where('user_id', $creator->id)
                    ->where('is_approved', 1)
                    ->where('created_at', '>=', $since)
                    ->count(),
                    
                'memberships' => Membership::where('user_id', $creator->id)
                    ->where('approved', 1)
                    ->where('created_at', '>=', $since)
                    ->count(),
                    
                'shops' => Shop::where('user_id', $creator->id)
                    ->where('approved', 1)
                    ->where('created_at', '>=', $since)
                    ->count(),
            ];
        });
    }

    /**
     * Get content suggestions based on what they're missing
     */
    public function getContentSuggestions(array $breakdown): array
    {
        $suggestions = [];
        
        if ($breakdown['posts'] === 0) {
            $suggestions[] = [
                'type' => 'posts',
                'title' => 'Add a Post',
                'description' => 'Share updates, photos, or thoughts with your supporters',
                'action_url' => '/posts/create',
                'estimated_time' => '2 minutes'
            ];
        }
        
        if ($breakdown['wishes'] === 0) {
            $suggestions[] = [
                'type' => 'wishes',
                'title' => 'Create Wish Item',
                'description' => 'Add something your fans can buy for you',
                'action_url' => '/wishes/create',
                'estimated_time' => '5 minutes'
            ];
        }
        
        if ($breakdown['memberships'] === 0) {
            $suggestions[] = [
                'type' => 'memberships',
                'title' => 'Set Up Membership',
                'description' => 'Create recurring revenue with subscription tiers',
                'action_url' => '/memberships/create',
                'estimated_time' => '10 minutes'
            ];
        }
        
        if ($breakdown['shops'] === 0) {
            $suggestions[] = [
                'type' => 'shops',
                'title' => 'Add Shop Item',
                'description' => 'Sell physical or digital products directly',
                'action_url' => '/shop/create',
                'estimated_time' => '7 minutes'
            ];
        }
        
        return $suggestions;
    }

    /**
     * Check if creator is fully verified and ready to receive payments
     */
    private function isFullyVerified(User $creator): bool
    {
        // Skip verification check - always return true for creators
        return $creator->role == 1;
        
        // Original verification logic (commented out):
        // return $creator->role == 1 && // Is creator
        //        $creator->is_subscribed == 1 && // Has subscription
        //        $creator->profile_status_lock == 2 && // Profile approved
        //        $creator->identity_status == 1 && // Identity verified
        //        $creator->stripe_details_submitted == 1; // Stripe connected
    }

    /**
     * Clear activity cache for a creator (call when new content is approved)
     */
    public function clearActivityCache(User $creator): void
    {
        Cache::forget("creator_content_count_{$creator->id}");
        Cache::forget("creator_content_breakdown_{$creator->id}");
    }

    /**
     * Get activity status for dashboard display
     */
    public function getActivityStatus(User $creator): array
    {
        $validation = $this->validateCreatorActivity($creator);
        
        return [
            'status' => $validation['status'],
            'message' => $validation['message'],
            'eligible' => $validation['eligible'],
            'content_count' => $validation['content_count'] ?? 0,
            'breakdown' => $validation['breakdown'] ?? [],
            'suggestions' => $validation['suggestions'] ?? [],
            'grace_period' => [
                'active' => $creator->is_in_grace_period,
                'days_remaining' => $creator->grace_period_days_remaining,
                'ends_at' => $creator->grace_period_ends_at
            ]
        ];
    }

    /**
     * Get creators who need activity warnings
     */
    public function getCreatorsNeedingWarnings(): \Illuminate\Database\Eloquent\Collection
    {
        return User::where('role', 1)
            ->where('is_subscribed', 1)
            ->where('profile_status_lock', 2)
            ->where('identity_status', 1)
            ->where('stripe_details_submitted', 1)
            ->get()
            ->filter(function ($creator) {
                $validation = $this->validateCreatorActivity($creator);
                
                // Send warnings to creators who are:
                // 1. Out of grace period and have insufficient content
                // 2. In grace period but ending soon with insufficient content
                return ($validation['status'] === 'insufficient_content') ||
                       ($validation['status'] === 'grace_period' && 
                        $validation['days_remaining'] <= 7 && 
                        $validation['current_content'] < self::REQUIRED_CONTENT_COUNT);
            });
    }

    /**
     * Get inactive creators (for admin monitoring)
     */
    public function getInactiveCreators(): \Illuminate\Database\Eloquent\Collection
    {
        return User::where('role', 1)
            ->where('is_subscribed', 1)
            ->where('profile_status_lock', 2)
            ->where('identity_status', 1)
            ->where('stripe_details_submitted', 1)
            ->get()
            ->filter(function ($creator) {
                $validation = $this->validateCreatorActivity($creator);
                return $validation['status'] === 'insufficient_content';
            });
    }

    /**
     * Validate payment and log if blocked
     */
    public function validatePaymentAndLog(User $creator, array $paymentData): array
    {
        $validation = $this->validateCreatorActivity($creator);
        
        // If payment is not eligible, log the blocked payment
        if (!$validation['eligible']) {
            $this->logBlockedPayment($creator, $paymentData, $validation);
        }
        
        return $validation;
    }

    /**
     * Log blocked payment attempt
     */
    public function logBlockedPayment(User $creator, array $paymentData, array $activityValidation = null): BlockedPayment
    {
        // Get payer information if available
        $payer = $paymentData['payer'] ?? auth()->user();
        $payerInfo = null;
        
        if ($payer) {
            $payerInfo = [
                'id' => $payer->id,
                'name' => $payer->name,
                'username' => $payer->username ?? null,
                'email' => $payer->email ?? null,
            ];
        }

        // Prepare blocked payment data
        $blockedData = [
            'creator_id' => $creator->id,
            'payer_id' => $payer->id ?? null,
            'amount' => $paymentData['amount'] ?? 0,
            'currency' => $paymentData['currency'] ?? 'USD',
            'payment_type' => $paymentData['payment_type'] ?? 'unknown',
            'payment_method' => $paymentData['payment_method'] ?? 'stripe',
            'blocked_reason' => $activityValidation['status'] ?? 'insufficient_content',
            'activity_data' => $activityValidation,
            'payer_info' => $payerInfo,
            'payment_metadata' => $paymentData['metadata'] ?? null,
        ];

        // Log the blocked payment
        $blockedPayment = BlockedPayment::logBlockedPayment($blockedData);

        // Log to Laravel log as well
        Log::warning('Payment blocked due to creator inactivity', [
            'blocked_payment_id' => $blockedPayment->id,
            'creator_id' => $creator->id,
            'creator_username' => $creator->username,
            'amount' => $paymentData['amount'] ?? 0,
            'payment_type' => $paymentData['payment_type'] ?? 'unknown',
            'blocked_reason' => $activityValidation['status'] ?? 'insufficient_content',
            'content_count' => $activityValidation['content_count'] ?? 0,
        ]);

        return $blockedPayment;
    }

    /**
     * Get recent blocked payments for a creator
     */
    public function getRecentBlockedPayments(User $creator, int $days = 30): array
    {
        $blockedPayments = BlockedPayment::forCreator($creator->id)
            ->recent($days)
            ->with(['payer'])
            ->orderBy('blocked_at', 'desc')
            ->get();

        $totalBlocked = $blockedPayments->sum('amount');
        $lastBlockedAt = $blockedPayments->first()?->blocked_at;

        return [
            'count' => $blockedPayments->count(),
            'last_blocked_at' => $lastBlockedAt ? $lastBlockedAt->toISOString() : null,
            'last_blocked_at_human' => $lastBlockedAt ? $lastBlockedAt->diffForHumans() : null,
            'total_amount_blocked' => number_format((float)$totalBlocked, 2, '.', ''),
            'currency' => $blockedPayments->first()?->currency ?? 'USD',
            'recent_attempts' => $blockedPayments->take(10)->map(function ($blocked) {
                return [
                    'id' => $blocked->uuid,
                    'amount' => $blocked->formatted_amount,
                    'payment_type' => $blocked->payment_type,
                    'blocked_reason' => $blocked->blocked_reason,
                    'blocked_at' => $blocked->time_ago,
                    'blocked_at_iso' => $blocked->blocked_at->toISOString(),
                    'payer_name' => $blocked->payer?->name ?? 'Unknown',
                ];
            })->toArray()
        ];
    }

    /**
     * Get blocked payment statistics for a creator
     */
    public function getBlockedPaymentStats(User $creator, int $days = 30): array
    {
        $query = BlockedPayment::forCreator($creator->id)->recent($days);
        
        return [
            'total_blocked' => $query->count(),
            'total_amount' => $query->sum('amount'),
            'by_payment_type' => $query->selectRaw('payment_type, COUNT(*) as count, SUM(amount) as total_amount')
                ->groupBy('payment_type')
                ->get()
                ->keyBy('payment_type')
                ->toArray(),
            'by_blocked_reason' => $query->selectRaw('blocked_reason, COUNT(*) as count, SUM(amount) as total_amount')
                ->groupBy('blocked_reason')
                ->get()
                ->keyBy('blocked_reason')
                ->toArray(),
            'daily_stats' => $query->selectRaw('DATE(blocked_at) as date, COUNT(*) as count, SUM(amount) as total_amount')
                ->groupByRaw('DATE(blocked_at)')
                ->orderByRaw('DATE(blocked_at) DESC')
                ->get()
                ->toArray()
        ];
    }
}
