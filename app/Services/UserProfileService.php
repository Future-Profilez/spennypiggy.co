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
use Carbon\Carbon;

class UserProfileService
{
     
    private function getCacheTtl(): int
    {
        return (int) env('CACHE_TTL', 0);
    }

    private function getLongCacheTtl(): int
    {
        return (int) env('LONG_CACHE_TTL', 0);
    }
    /**
     * Get user with optimized relationships
     */
    public function getUserWithRelations(string $username): ?User
    {
        // NO CACHE - REAL TIME DATA
        $query = User::select([
            'id', 'name', 'uuid', 'username', 'email', 'role', 'bio', 'bio_approved',
            'avatar', 'avatar_approved', 'cover', 'suspended_account',
            'social_image', 'account_id', 'stripe_details_submitted',
            'default_currency', 'country', 'creator_category', 'identity_status',
            'profile_status_lock', 'is_subscribed', 'is_founder', 'show_piggy_bank', 'created_at'
        ])
        ->with([
            'social_links:id,user_id,instagram,twitter,twitch,facebook,youtube,tumblr,reddit,discord,other',
            'user_categories:id,user_id,category,created_at',
            // Include uuid so perma_link accessor can build a playable URL
            'intro:id,user_id,uuid,poster,poster_token,height,width,approved,created_at'
        ])
        ->where('username', $username);

        // Remove is_uk filter for profile viewing to prevent false 404s in all environments
        return $query->first();
    }

    /**
     * Get ALL profile data in single optimized request for faster loading
     */
    public function getAllProfileData(int $userId, ?int $categoryId = null): array
    {
        $isOwner = Auth::check() && Auth::id() === $userId;
        // Execute all queries in parallel for maximum speed
        $data = [];
        
        // Optimized queries with minimal columns and proper indexes
        $data['wishes'] = $this->getOptimizedWishItems($userId, $categoryId, $isOwner);
        $data['memberships'] = $this->getOptimizedMemberships($userId, $isOwner);
        $data['bills'] = $this->getOptimizedBills($userId, $isOwner);
        $data['shops'] = $this->getOptimizedShopItems($userId, $isOwner);
        $data['posts'] = $this->getOptimizedPosts($userId, $isOwner, 5);
        $data['tasks'] = $this->getOptimizedTasks($userId, $isOwner);
        return $data;
    }

    /**
     * Get tasks optimized for profile display
     */
    public function getOptimizedTasks(int $userId, bool $isOwner): array
    {
        $query = \App\Models\Task::where('creator_id', $userId);
        if (!$isOwner) {
            $query->where('status', 'active')->where('is_approved', 1);
        }
        return $query->select(['id', 'uuid', 'title', 'description', 'price', 'type', 'status', 'media_url', 'category', 'created_at', 'sla_hours', 'is_approved'])
            ->latest()
            ->get()
            ->toArray();
    }
    
    /**
     * Get optimized wish items with minimal data
     */
    private function getOptimizedWishItems(int $userId, ?int $categoryId, bool $isOwner): array
    {
        $query = WishItem::select([
            'id', 'uuid', 'name', 'price', 'currency', 'thumbnail', 
            'is_approved', 'sort', 'created_at'
        ])->where('user_id', $userId);
        
        if (!$isOwner) {
            $query->where('is_approved', 1);
        }
        
        if ($categoryId && $categoryId !== 'all') {
            $query->whereHas('categories', fn($q) => $q->where('user_category_id', $categoryId));
        }
        
        return $query->orderBy('sort')
            ->orderBy('created_at', 'desc')
            ->limit(20)
            ->get()
            ->toArray();
    }
    
    /**
     * Get optimized memberships
     */
    private function getOptimizedMemberships(int $userId, bool $isOwner): array
    {
        $query = Membership::select([
            'id', 'uuid', 'name', 'level', 'price', 'currency', 
            'thumbnail', 'approved', 'created_at'
        ])->where('user_id', $userId);
        
        if (!$isOwner) {
            $query->where('approved', 1);
        }
        
        return $query->latest()->get()->toArray();
    }
    
    /**
     * Get optimized bills
     */
    private function getOptimizedBills(int $userId, bool $isOwner): array
    {
        $query = Bills::select([
            'id', 'uuid', 'name', 'price', 'currency', 'period',
            'thumbnail', 'approved', 'created_at'
        ])->where('user_id', $userId);
        
        if (!$isOwner) {
            $query->where('approved', 1);
        }
        
        return $query->latest()->get()->toArray();
    }
    
    /**
     * Get optimized shop items
     */
    private function getOptimizedShopItems(int $userId, bool $isOwner): array
    {
        $query = Shop::select([
            'id', 'uuid', 'name', 'price', 'currency',
            'thumbnail', 'approved', 'created_at'
        ])->where('user_id', $userId)
        ->with(['shop_varients:id,shop_id,name,price']);
        
        if (!$isOwner) {
            $query->where('approved', 1);
        }
        
        return $query->latest()->get()->toArray();
    }
    
    /**
     * Get optimized posts (limited for initial load)
     */
    private function getOptimizedPosts(int $userId, bool $isOwner, int $limit = 5): array
    {
        $query = Post::select([
            'id', 'uuid', 'content', 'thumbnail',
            'approved', 'created_at'
        ])->where('user_id', $userId);
        
        if (!$isOwner) {
            $query->where('approved', 1);
        }
        
        return $query->latest()->limit($limit)->get()->toArray();
    }
    
    /**
     * Get user's wish items with pagination and caching
     */
    public function getUserWishItems(int $userId, ?int $categoryId = null, int $perPage = 20): array
    {
            // $cacheKey = "user_wishes_{$userId}_{$categoryId}_{$perPage}";
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
    }

    /**
     * Get user's posts with optimized queries and subscription access logic
     */
    public function getUserPosts(int $userId, string $module = 'all', int $perPage = 10, int $page = 1)
    {
        // Don't cache paginated results to ensure fresh data
        $query = Post::where('user_id', $userId);

        // Apply approval filter for non-owners
        if (!Auth::check() || Auth::id() !== $userId) {
            $query->where('approved', 1);
        }

        // Apply module filtering
        $query->when($module !== 'all', function ($q) use ($module) {
            $q->forModule($module);
        });

        $posts = $query->latest()->paginate($perPage, ['*'], 'page', $page);

        // Check subscription access for each post
        $currentUser = Auth::user();
        $isOwner = $currentUser && $currentUser->id === $userId;
        
        // Get user's active subscriptions for this creator if not the owner
        $hasActiveSubscription = false;
        $hasMembership = false;
        $hasBill = false;
        $hasSupport = false;
        
        if ($currentUser && !$isOwner) {
            // Check active wish item subscriptions
            $hasActiveSubscription = \App\Models\WishItemSubscription::where(function ($q) use ($currentUser) {
                $q->where('user_id', $currentUser->id)->orWhere('guest_email', $currentUser->email);
            })
            ->whereHas('wish_item', function ($q) use ($userId) {
                $q->where('user_id', $userId);
            })
            ->where('status', 'paid')
            ->where('stripe_status', 'active')
            ->where(function ($q) {
                $q->where(function ($recurring) {
                    $recurring->where('recurring_for', 'continue')
                             ->where('upcoming_payment', '>=', \Carbon\Carbon::now());
                })->orWhere(function ($onetime) {
                    $onetime->where('recurring_for', 'onetime')
                           ->where('created_at', '>=', \Carbon\Carbon::now()->subDays(30));
                });
            })
            ->exists();
            
            // Check active memberships
            $hasMembership = \App\Models\MembershipPayment::where(function ($q) use ($currentUser) {
                $q->where('user_id', $currentUser->id)->orWhere('guest_email', $currentUser->email);
            })
            ->whereHas('membership', function ($q) use ($userId) {
                $q->where('user_id', $userId);
            })
            ->where('status', 'paid')
            ->where('upcoming_payment', '>=', \Carbon\Carbon::now())
            ->exists();
            
            // Check active bills
            $hasBill = \App\Models\BillPayment::where(function ($q) use ($currentUser) {
                $q->where('user_id', $currentUser->id)->orWhere('guest_email', $currentUser->email);
            })
            ->whereHas('bill', function ($q) use ($userId) {
                $q->where('user_id', $userId);
            })
            ->where('status', 'paid')
            ->where('upcoming_payment', '>=', \Carbon\Carbon::now())
            ->exists();
            
            // Check support/tip payments
            $hasSupport = \App\Models\TipGoalsPayment::where(function ($q) use ($currentUser) {
                $q->where('user_id', $currentUser->id)->orWhere('guest_email', $currentUser->email);
            })
            ->where('creator_id', $userId)
            ->where('status', 'paid')
            ->exists();
        }
        
        // Apply is_lock logic to paginated posts using through() method
        $posts->through(function ($post) use ($isOwner, $hasActiveSubscription, $hasMembership, $hasBill, $hasSupport) {
            if ($isOwner) {
                // Owner can always see their own posts
                $post->is_lock = 0;
            } else {
                // Check access based on post type
                switch ($post->for_module) {
                    case 'subscription':
                        $post->is_lock = $hasActiveSubscription ? 0 : 1;
                        break;
                    case 'membership':
                        $post->is_lock = $hasMembership ? 0 : 1;
                        break;
                    case 'support':
                        $post->is_lock = $hasSupport ? 0 : 1;
                        break;
                    default:
                        // Public posts or posts with no module restriction
                        $post->is_lock = 0;
                        break;
                }
            }
            return $post;
        });

        return $posts;
    }

    /**
     * Get user's memberships with caching
     */
    public function getUserMemberships(int $userId): array
    {
        $cacheKey = "user_memberships_{$userId}";

        // return Cache::remember($cacheKey, self::getCacheTtl(), function () use ($userId) {
            $query = Membership::where('user_id', $userId);

            if (!Auth::check() || Auth::id() !== $userId) {
                $query->where('approved', 1);
            }

            return $query->latest()->get()->toArray();
        // });
    }

    /**
     * Get user's bills with caching
     */
    public function getUserBills(int $userId): array
    {
        $cacheKey = "user_bills_{$userId}";

        // return Cache::remember($cacheKey, self::getCacheTtl(), function () use ($userId) {
            $query = Bills::where('user_id', $userId);

            if (!Auth::check() || Auth::id() !== $userId) {
                $query->where('approved', 1);
            }

            return $query->latest()->get()->toArray();
        // });
    }

    /**
     * Get user's shop items with caching
     */
    public function getUserShopItems(int $userId): array
    {
        $cacheKey = "user_shop_{$userId}";

        // return Cache::remember($cacheKey, self::getCacheTtl(), function () use ($userId) {
            $query = Shop::where('user_id', $userId)
            ->with(['shop_varients:id,shop_id,name,price']);

            if (!Auth::check() || Auth::id() !== $userId) {
                $query->where('approved', 1);
            }
            return $query->latest()->get()->toArray();
        // });
    }

    /**
     * Get supporters count with optimized query and caching
     */
    public function getSupportersCount(int $userId): int
    {
        $cacheKey = "supporters_count_{$userId}";
        
        // return Cache::remember($cacheKey, self::getLongCacheTtl(), function () use ($userId) {
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
        // });
    }

    /**
     * Get user's total earnings with caching
     */
    public function getUserEarnings(int $userId): array
    {
        $cacheKey = "user_earnings_{$userId}";
        
        // NO CACHE - REAL TIME DATA
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
        
        // NO CACHE - REAL TIME DATA
        return Notification::where('notifiable_id', $userId)
            ->where('is_read', 0)
            ->count();
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
