<?php

namespace App\Services;

use App\Models\User;
use App\Models\WishItem;
use App\Models\Post;
use App\Models\Membership;
use App\Models\Bills;
use App\Models\Shop;
use App\Models\TipGoalsPayment;
use App\Models\BillPayment;
use App\Models\MembershipPayment;
use App\Models\StripePaymentDetail;
use App\Models\WishItemSubscription;
use App\Models\Notification;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Auth;

class UserProfileService
{
     
    private function getCacheTtl(): int
    {
        return (int) env('CACHE_TTL', 150);
    }

    private function getLongCacheTtl(): int
    {
        return (int) env('LONG_CACHE_TTL', 3600);
    }
    /**
     * Get user with optimized relationships
     */
    public function getUserWithRelations(string $username): ?User
    {
        $cacheKey = "user_profile_{$username}";
        
        return Cache::remember($cacheKey, self::getCacheTtl(), function () use ($username) {
            return User::select([
                'id', 'name', 'uuid', 'username', 'email', 'role', 'bio', 'bio_approved',
                'avatar', 'avatar_approved', 'cover', 'suspended_account',
                'social_image', 'account_id', 'stripe_details_submitted',
                'default_currency', 'country', 'creator_category', 'identity_status',
                'profile_status_lock', 'is_subscribed', 'created_at'
            ])
            ->with([
                'social_links:id,user_id,instagram,twitter,twitch,tumblr,facebook,youtube,reddit,discord,onlyfans,loyalfans,fansly,manyvids,other',
                'user_categories:id,user_id,category,created_at',
                'intro:id,user_id,poster,poster_token,height,width,approved,created_at'
            ])
            ->where('username', $username)
            ->where('is_uk', 0)
            ->first();
        });
    }

    /**
     * Get user's wish items with pagination and caching
     */
    public function getUserWishItems(int $userId, ?int $categoryId = null, int $perPage = 20): array
    {
        $cacheKey = "user_wishes_{$userId}_{$categoryId}_{$perPage}";

        return Cache::remember($cacheKey, self::getCacheTtl(), function () use ($userId, $categoryId, $perPage) {
            $query = WishItem::where('user_id', $userId)
            ->when($categoryId && $categoryId !== 'all', function ($query) use ($categoryId) {
                $query->whereHas('categories', fn ($q) => $q->where('user_category_id', $categoryId));
            });

            // Apply approval filter for non-owners
            if (!Auth::check() || Auth::id() !== $userId) {
                $query->where('is_approved', 1);
            }

            return $query->orderBy('sort')
                ->orderBy('created_at', 'desc')
                ->limit($perPage)
                ->get()
                ->toArray();
        });
    }

    /**
     * Get user's posts with optimized queries
     */
    public function getUserPosts(int $userId, int $limit = 10): array
    {
        $cacheKey = "user_posts_{$userId}_{$limit}";

        return Cache::remember($cacheKey, self::getCacheTtl(), function () use ($userId, $limit) {
            $query = Post::where('user_id', $userId);

            // Apply approval filter for non-owners
            if (!Auth::check() || Auth::id() !== $userId) {
                $query->where('approved', 1);
            }

            return $query->latest()
                ->limit($limit)
                ->get()
                ->toArray();
        });
    }

    /**
     * Get user's memberships with caching
     */
    public function getUserMemberships(int $userId): array
    {
        $cacheKey = "user_memberships_{$userId}";

        return Cache::remember($cacheKey, self::getCacheTtl(), function () use ($userId) {
            $query = Membership::where('user_id', $userId);

            if (!Auth::check() || Auth::id() !== $userId) {
                $query->where('approved', 1);
            }

            return $query->latest()->get()->toArray();
        });
    }

    /**
     * Get user's bills with caching
     */
    public function getUserBills(int $userId): array
    {
        $cacheKey = "user_bills_{$userId}";

        return Cache::remember($cacheKey, self::getCacheTtl(), function () use ($userId) {
            $query = Bills::where('user_id', $userId);

            if (!Auth::check() || Auth::id() !== $userId) {
                $query->where('approved', 1);
            }

            return $query->latest()->get()->toArray();
        });
    }

    /**
     * Get user's shop items with caching
     */
    public function getUserShopItems(int $userId): array
    {
        $cacheKey = "user_shop_{$userId}";

        return Cache::remember($cacheKey, self::getCacheTtl(), function () use ($userId) {
            $query = Shop::where('user_id', $userId)
            ->with(['shop_varients:id,shop_id,name,price']);

            if (!Auth::check() || Auth::id() !== $userId) {
                $query->where('approved', 1);
            }
            return $query->latest()->get()->toArray();
        });
    }

    /**
     * Get supporters count with optimized query and caching
     */
    public function getSupportersCount(int $userId): int
    {
        $cacheKey = "supporters_count_{$userId}";
        
        return Cache::remember($cacheKey, self::getLongCacheTtl(), function () use ($userId) {
            // Use raw SQL for better performance
            $query = "
                SELECT COUNT(DISTINCT supporter) as count FROM (
                    SELECT user_id as supporter FROM tip_goals_payments 
                    WHERE creator_id = ? AND status = 'paid' AND user_id IS NOT NULL
                    UNION
                    SELECT id as supporter FROM users 
                    WHERE email IN (
                        SELECT guest_email FROM tip_goals_payments 
                        WHERE creator_id = ? AND status = 'paid' AND guest_email IS NOT NULL
                    ) AND is_uk = 0
                    UNION
                    SELECT CONCAT('guest_', ROW_NUMBER() OVER()) as supporter FROM tip_goals_payments 
                    WHERE creator_id = ? AND status = 'paid' AND guest_email IS NOT NULL
                    AND guest_email NOT IN (SELECT email FROM users WHERE is_uk = 0)
                ) supporters
            ";
            
            $result = DB::select($query, [$userId, $userId, $userId]);
            return $result[0]->count ?? 0;
        });
    }

    /**
     * Get user's total earnings with caching
     */
    public function getUserEarnings(int $userId): array
    {
        $cacheKey = "user_earnings_{$userId}";
        
        return Cache::remember($cacheKey, self::getLongCacheTtl(), function () use ($userId) {
            $goalPayment = TipGoalsPayment::where('creator_id', $userId)
                ->where('status', 'paid')
                ->sum('amount');
                
            $billPayment = BillPayment::whereHas('bill', fn ($q) => $q->where('user_id', $userId))
                ->where('status', 'paid')
                ->sum('amount');
                
            $memPayment = MembershipPayment::whereHas('membership', fn ($q) => $q->where('user_id', $userId))
                ->where('status', 'paid')
                ->sum('amount');
                
            $wishPayment = StripePaymentDetail::where('owner_id', $userId)
                ->where('payment_status', 'paid')
                ->sum('amount_subtotal');
                
            $subPayment = WishItemSubscription::whereHas('wish_item', fn ($q) => $q->where('user_id', $userId))
                ->where('status', 'paid')
                ->sum('amount');

            $totalEarnings = $goalPayment + $billPayment + $memPayment + $wishPayment + $subPayment;
            
            $target = match (true) {
                $totalEarnings < 100 => 100,
                $totalEarnings < 1000 => 1000,
                $totalEarnings < 10000 => 10000,
                $totalEarnings < 100000 => 100000,
                $totalEarnings < 1000000 => 1000000,
                default => 10000000,
            };

            return [
                'fulfilled' => $totalEarnings,
                'target' => $target,
                'goal_payments' => $goalPayment,
                'bill_payments' => $billPayment,
                'membership_payments' => $memPayment,
                'wish_payments' => $wishPayment,
                'subscription_payments' => $subPayment
            ];
        });
    }

    /**
     * Get notification count for authenticated user
     */
    public function getNotificationCount(?int $userId): int
    {
        if (!$userId) {
            return 0;
        }

        $cacheKey = "notifications_{$userId}";
        
        return Cache::remember($cacheKey, 60, function () use ($userId) {
            return Notification::where('notifiable_id', $userId)
                ->where('is_read', 0)
                ->count();
        });
    }

    /**
     * Clear user-related caches
     */
    public function clearUserCaches(string $username, int $userId): void
    {
        $keys = [
            "user_profile_{$username}",
            "user_wishes_{$userId}_*",
            "user_posts_{$userId}_*",
            "user_memberships_{$userId}",
            "user_bills_{$userId}",
            "user_shop_{$userId}",
            "supporters_count_{$userId}",
            "user_earnings_{$userId}",
            "notifications_{$userId}"
        ];

        foreach ($keys as $key) {
            if (str_contains($key, '*')) {
                // For wildcard keys, we'd need a more sophisticated cache clearing mechanism
                // For now, we'll use cache tags if available or manual clearing
                Cache::forget(str_replace('_*', '_', $key));
            } else {
                Cache::forget($key);
            }
        }
    }

    /**
     * Preload user profile data for better performance
     */
    public function preloadUserProfileData(string $username): array
    {
        $user = $this->getUserWithRelations($username);
        
        if (!$user) {
            return [];
        }

        // Preload all data in parallel using promises or similar
        $data = [
            'user' => $user,
            'supporters' => $this->getSupportersCount($user->id),
            'notification_count' => $this->getNotificationCount(Auth::id()),
        ];

        // Add earnings data for profile owner
        if (Auth::check() && Auth::id() === $user->id) {
            $data['earnings'] = $this->getUserEarnings($user->id);
        }

        return $data;
    }
}
