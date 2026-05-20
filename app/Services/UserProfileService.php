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
use App\Models\MonthlyCharge;
use App\Models\Task;
use App\StripeControl;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;
use Carbon\Carbon;

class UserProfileService
{
    /**
     * Get user with optimized relationships
     */
    public function getUserWithRelations(string $username): ?User
    {
        $callback = function () use ($username) {
            // Direct DB query
            $userId = User::where('username', $username)->value('id');

            if (!$userId) {
                return null;
            }

            return User::select([
                'id',
                'name',
                'uuid',
                'username',
                'email',
                'role',
                'bio',
                'bio_approved',
                'avatar',
                'avatar_approved',
                'avatar_cdn_modifier',
                'cover',
                'cover_approved',
                'cover_cdn_modifier',
                'suspended_account',
                'social_image',
                'account_id',
                'stripe_details_submitted',
                'default_currency',
                'country',
                'creator_category',
                'identity_status',
                'edit_bio_reason',
                'profile_status_lock',
                'is_subscribed',
                'is_founder',
                'show_piggy_bank',
                'created_at',
                'vat_amount_percentage'
            ])
                ->with([
                    'social_links:id,user_id,instagram,twitter,twitch,facebook,youtube,tumblr,reddit,discord,other,status,reason',
                    'user_categories:id,user_id,category,created_at',
                    // Include uuid so perma_link accessor can build a playable URL
                    'intro:id,user_id,uuid,poster,poster_token,height,width,approved,created_at'
                ])
                ->where('username', $username)
                ->first();
        };

        if (Auth::check()) {
            return $callback();
        }

        return Cache::remember('user_profile_basic_' . $username, 600, $callback);
    }

    /**
     * Get ALL profile data in single optimized request for faster loading
     */
    public function getAllProfileData(int $userId, ?int $categoryId = null): array
    {
        $page = request()->route() ? (request()->route()->parameter('page') ?? 'about') : 'about';
        
        $cacheKey = 'profile_all_data_' . $userId . '_' . ($categoryId ?? 'all') . '_page_' . $page . '_' . $this->getProfileCacheVersion($userId);
        $isOwner = Auth::check() && Auth::id() === $userId;

        // If not owner, we can cache this whole block for a few minutes
        if (!$isOwner) {
            return Cache::remember($cacheKey, 300, function () use ($userId, $categoryId) {
                return $this->fetchRawProfileData($userId, $categoryId, false);
            });
        }

        return $this->fetchRawProfileData($userId, $categoryId, true);
    }

    /**
     * Internal helper to fetch all profile sections
     * We limit the number of items fetched here to keep initial load fast
     */
    private function fetchRawProfileData(int $userId, ?int $categoryId, bool $isOwner): array
    {
        $data = [];
        // Only load the first few items for initial dashboard load
        // But if we are on 'about' page, we shouldn't even fetch these
        $page = request()->route() ? (request()->route()->parameter('page') ?? 'about') : 'about';
        
        if ($page !== 'about') {
            $data['wishes'] = $this->getOptimizedWishItems($userId, $categoryId, $isOwner, 8);
            $data['memberships'] = $this->getOptimizedMemberships($userId, $isOwner, 4);
            $data['bills'] = $this->getOptimizedBills($userId, $isOwner, 4);
            $data['shops'] = $this->getOptimizedShopItems($userId, $isOwner, 8);
            $data['tasks'] = $this->getOptimizedTasks($userId, $isOwner, 6);
        } else {
            $data['wishes'] = [];
            $data['memberships'] = [];
            $data['bills'] = [];
            $data['shops'] = [];
            $data['tasks'] = [];
        }
        
        $data['posts'] = $this->getOptimizedPosts($userId, $isOwner, 5);
        return $data;
    }

    /**
     * Get tasks optimized for profile display
     */
    public function getOptimizedTasks(int $userId, bool $isOwner, int $limit = null): array
    {
        $query = \App\Models\Task::where('creator_id', $userId);
        if (!$isOwner) {
            $query->where('status', 'active')->where('is_approved', 1)->where('is_suspended', 0);
        }
        $query = $query->select(['id', 'uuid', 'title', 'description', 'price', 'currency', 'type', 'status', 'media_url', 'category', 'created_at', 'sla_hours', 'is_approved', 'reason', 'is_suspended', 'suspend_reason'])
            ->latest();
            
        $cacheKey = 'user_tasks_optimized_' . $userId . '_' . ($limit ?? 'all') . '_' . ($isOwner ? 'owner' : 'public') . '_' . $this->getProfileCacheVersion($userId);
        
        return Cache::remember($cacheKey, 600, function() use ($query, $limit) {
            if ($limit) {
                $query->limit($limit);
            }
            return $query->get()->toArray();
        });
    }

    /**
     * Get optimized wish items with minimal data
     */
    private function getOptimizedWishItems(int $userId, ?int $categoryId, bool $isOwner, int $limit = 20): array
    {
        $query = WishItem::select([
            'id',
            'user_id',
            'uuid',
            'wishname',
            'price',
            'currency',
            'thumbnail',
            'is_approved',
            'sort',
            'created_at',
            'subscription',
            'fullfill_amount',
            'edited_reason',
            'tax_amount',
            'is_suspended',
            'suspend_reason'
        ])->with('user:id,name,username,suspended_account,vat_amount_percentage')
            ->where('user_id', $userId);

        if (!$isOwner) {
            $query->where('is_approved', 1)->where('is_suspended', 0);
        }

        if ($categoryId && $categoryId !== 'all') {
            $query->whereHas('categories', fn($q) => $q->where('user_category_id', $categoryId));
        }

        $cacheKey = 'user_wishes_optimized_' . $userId . '_' . ($categoryId ?? 'all') . '_' . $limit . '_' . ($isOwner ? 'owner' : 'public') . '_' . $this->getProfileCacheVersion($userId);
        
        return Cache::remember($cacheKey, 600, function() use ($query, $limit) {
            return $query->orderBy('sort')
                ->orderBy('created_at', 'desc')
                ->limit($limit)
                ->get()
                ->toArray();
        });
    }

    /**
     * Get optimized memberships
     */
    private function getOptimizedMemberships(int $userId, bool $isOwner, int $limit = null): array
    {
        $query = Membership::select([
            'id',
            'user_id',
            'uuid',
            'name',
            'level',
            'price',
            'currency',
            'thumbnail',
            'approved',
            'created_at',
            'is_suspended',
            'suspend_reason'
        ])->with('user:id,name,username,suspended_account,vat_amount_percentage')
            ->where('user_id', $userId);

        if (!$isOwner) {
            $query->where('approved', 1)->where('is_suspended', 0);
        }

        $cacheKey = 'user_memberships_optimized_' . $userId . '_' . ($limit ?? 'all') . '_' . ($isOwner ? 'owner' : 'public') . '_' . $this->getProfileCacheVersion($userId);
        
        return Cache::remember($cacheKey, 600, function() use ($query, $limit) {
            $query = $query->latest();
            if ($limit) $query->limit($limit);
            return $query->get()->toArray();
        });
    }

    /**
     * Get optimized bills
     */
    private function getOptimizedBills(int $userId, bool $isOwner, int $limit = null): array
    {
        $query = Bills::select([
            'id',
            'user_id',
            'uuid',
            'name',
            'price',
            'currency',
            'period',
            'thumbnail',
            'approved',
            'created_at',
            'is_suspended',
            'suspend_reason'
        ])->with('user:id,name,username,suspended_account,vat_amount_percentage')
            ->where('user_id', $userId);

        if (!$isOwner) {
            $query->where('approved', 1)->where('is_suspended', 0);
        }

        $cacheKey = 'user_bills_optimized_' . $userId . '_' . ($limit ?? 'all') . '_' . ($isOwner ? 'owner' : 'public') . '_' . $this->getProfileCacheVersion($userId);
        
        return Cache::remember($cacheKey, 600, function() use ($query, $limit) {
            $query = $query->latest();
            if ($limit) $query->limit($limit);
            return $query->get()->toArray();
        });
    }

    /**
     * Get optimized shop items
     */
    private function getOptimizedShopItems(int $userId, bool $isOwner, int $limit = null): array
    {
        $query = Shop::where('user_id', $userId)->where('status', 1);

        if ($isOwner) {
            $query->with(['shop_shipping_info', 'user:id,name,username,suspended_account,vat_amount_percentage']);
        } else {
            $query->select([
                'id',
                'user_id',
                'uuid',
                'name',
                'price',
                'currency',
                'image',
                'approved',
                'created_at',
                'type',
                'description',
                'ai_generated',
                'is_suspended',
                'suspend_reason'
            ])
                ->with(['shop_shipping_info', 'user:id,name,username,suspended_account,vat_amount_percentage'])
                ->where('approved', 1)->where('is_suspended', 0);
        }

        $cacheKey = 'user_shop_optimized_' . $userId . '_' . ($limit ?? 'all') . '_' . ($isOwner ? 'owner' : 'public') . '_' . $this->getProfileCacheVersion($userId);
        
        return Cache::remember($cacheKey, 600, function() use ($query, $limit) {
            $query = $query->latest();
            if ($limit) $query->limit($limit);
            return $query->get()->toArray();
        });
    }

    /**
     * Get optimized posts (limited for initial load)
     */
    private function getOptimizedPosts(int $userId, bool $isOwner, int $limit = 5): array
    {
        $query = Post::select([
            'id',
            'uuid',
            'user_id',
            'content',
            'image',
            'approved',
            'created_at'
        ])->where('user_id', $userId);

        if (!$isOwner) {
            $query->where('approved', 1);
        }
        
        $viewerId = Auth::id() ?: 0;
        
        // Eager load counts to avoid N+1 queries during toArray()
        $query->withCount([
            'likes' => fn($q) => $q->where('status', 1),
            'comments' => fn($q) => $q->where('is_approved', 1)->orWhere('user_id', $viewerId)
        ]);
        
        // Check if current user liked
        if ($viewerId) {
            $query->withExists([
                'likes as liked_exists' => fn($q) => $q->where('user_id', $viewerId)->where('status', 1)
            ]);
        }

        // We DO NOT cache this because the 'liked_exists' is specific to the viewer
        return $query->latest()->limit($limit)->get()->toArray();
    }

    /**
     * Get user's wish items with pagination and caching
     */
    public function getUserWishItems(int $userId, ?int $categoryId = null, int $perPage = 20): array
    {
        $callback = function () use ($userId, $categoryId, $perPage) {
            $isOwner = Auth::check() && Auth::id() === $userId;

            $query = WishItem::where('user_id', $userId)->with('user:id,name,username,suspended_account,vat_amount_percentage')
                ->when($categoryId && $categoryId !== 'all', function ($query) use ($categoryId) {
                    $query->whereHas('categories', fn($q) => $q->where('user_category_id', $categoryId));
                });

            // Apply approval filter for non-owners
            if (!$isOwner) {
                $query->where('is_approved', 1)->where('is_suspended', 0);
            }

            return $query->orderBy('sort')
                ->orderBy('created_at', 'desc')
                ->limit($perPage)
                ->get()
                ->toArray();
        };

        if (Auth::check()) {
            return $callback();
        }

        $cacheKey = 'user_wishes_' . $userId . '_' . ($categoryId ?? 'all') . '_' . $perPage . '_' . $this->getProfileCacheVersion($userId);
        return Cache::remember($cacheKey, 600, $callback);
    }

    /**
     * Get user's posts with optimized queries and subscription access logic
     */
    public function getUserPosts(int $userId, string $module = 'all', int $perPage = 5, int $page = 1)
    {
        return $this->executePostsQuery($userId, $module, $perPage, $page);
    }

    private function executePostsQuery($userId, $module, $perPage, $page)
    {
        // Don't cache paginated results to ensure fresh data
        $query = Post::where('user_id', $userId);

        $viewerId = Auth::id() ?: 0;

        // Apply approval filter for non-owners
        if (!Auth::check() || Auth::id() !== $userId) {
            $query->where('approved', 1);
        }

        // Apply module filtering
        $query->when($module !== 'all', function ($q) use ($module) {
            $q->forModule($module);
        });
        
        // Eager load counts to avoid N+1 queries during toArray()
        $query->withCount([
            'likes' => fn($q) => $q->where('status', 1),
            'comments' => fn($q) => $q->where('is_approved', 1)->orWhere('user_id', $viewerId)
        ]);
        
        // Check if current user liked
        if ($viewerId) {
            $query->withExists([
                'likes as liked_exists' => fn($q) => $q->where('user_id', $viewerId)->where('status', 1)
            ]);
        }

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
        $callback = function () use ($userId) {
            $isOwner = Auth::check() && Auth::id() === $userId;
            $query = Membership::where('user_id', $userId)->with('user:id,name,username,suspended_account,vat_amount_percentage');
            if (!$isOwner) {
                $query->where('approved', 1)->where('is_suspended', 0);
            }
            return $query->latest()->get()->toArray();
        };

        if (Auth::check()) {
            return $callback();
        }

        return Cache::remember('user_memberships_' . $userId . '_' . $this->getProfileCacheVersion($userId), 600, $callback);
    }

    /**
     * Get user's bills with caching
     */
    public function getUserBills(int $userId): array
    {
        $callback = function () use ($userId) {
            $isOwner = Auth::check() && Auth::id() === $userId;

            $query = Bills::where('user_id', $userId)->with('user:id,name,username,suspended_account,vat_amount_percentage');

            if (!$isOwner) {
                $query->where('approved', 1)->where('is_suspended', 0);
            }

            return $query->latest()->get()->toArray();
        };

        if (Auth::check()) {
            return $callback();
        }

        return Cache::remember('user_bills_' . $userId . '_' . $this->getProfileCacheVersion($userId), 600, $callback);
    }

    /**
     * Get user's shop items with caching
     */
    public function getUserShopItems(int $userId): array
    {
        $callback = function () use ($userId) {
            $isOwner = Auth::check() && Auth::id() === $userId;

            $query = Shop::where('user_id', $userId)->where('status', 1);

            if ($isOwner) {
                $query->with(['shop_shipping_info', 'user:id,name,username,suspended_account,vat_amount_percentage']);
            } else {
                $query->with(['shop_shipping_info', 'user:id,name,username,suspended_account,vat_amount_percentage'])
                    ->where('approved', 1)->where('is_suspended', 0);
            }

            return $query->latest()->get()->toArray();
        };

        if (Auth::check()) {
            return $callback();
        }

        return Cache::remember('user_shop_' . $userId . '_' . $this->getProfileCacheVersion($userId), 600, $callback);
    }

    private function getProfileCacheVersion(int $userId): string
    {
        $timestamps = [
            User::where('id', $userId)->value('updated_at'),
            WishItem::where('user_id', $userId)->max('updated_at'),
            Membership::where('user_id', $userId)->max('updated_at'),
            Bills::where('user_id', $userId)->max('updated_at'),
            Shop::where('user_id', $userId)->max('updated_at'),
            Task::where('creator_id', $userId)->max('updated_at'),
        ];

        $latestUnix = 0;
        foreach ($timestamps as $timestamp) {
            if (! $timestamp) {
                continue;
            }

            $parsed = strtotime((string) $timestamp);
            if ($parsed > $latestUnix) {
                $latestUnix = $parsed;
            }
        }

        return (string) $latestUnix;
    }

    /**
     * Get supporters count with optimized query and caching
     */
    public function getSupportersCount(int $userId): int
    {
        $cacheKey = 'user_supporters_count_v2_' . $userId;
        $ttl = (Auth::check() && Auth::id() === $userId) ? 300 : 3600; // 5 mins for owner, 1 hour for others

        return Cache::remember($cacheKey, $ttl, function () use ($userId) {
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
                    )
                    UNION
                    SELECT CONCAT('guest_', ROW_NUMBER() OVER()) as supporter FROM tip_goals_payments 
                    WHERE creator_id = ? AND status = 'paid' AND guest_email IS NOT NULL
                    AND guest_email NOT IN (SELECT email FROM users)
                ) supporters
            ";

            $result = DB::select($query, [$userId, $userId, $userId]);
            return (int)($result[0]->count ?? 0);
        });
    }

    /**
     * Get user's total earnings with caching
     */
    public function getUserEarnings(int $userId): array
    {
        $cacheKey = 'user_earnings_v2_' . $userId;

        return Cache::remember($cacheKey, 600, function () use ($userId) {
            $goalPayment = TipGoalsPayment::where('creator_id', $userId)
                ->where('status', 'paid')
                ->sum('amount');

            $billPayment = BillPayment::whereHas('bill', fn($q) => $q->where('user_id', $userId))
                ->where('status', 'paid')
                ->sum('amount');

            $memPayment = MembershipPayment::whereHas('membership', fn($q) => $q->where('user_id', $userId))
                ->where('status', 'paid')
                ->sum('amount');

            $wishPayment = StripePaymentDetail::where('owner_id', $userId)
                ->where('payment_status', 'paid')
                ->sum('amount_subtotal');

            $subPayment = WishItemSubscription::whereHas('wish_item', fn($q) => $q->where('user_id', $userId))
                ->where('status', 'paid')
                ->sum('amount');

            $shopPayment = \App\Models\ShopPayment::whereHas('shop', fn($q) => $q->where('user_id', $userId))
                ->where('payment_status', 'paid')
                ->sum('amount');

            $totalEarnings = $goalPayment + $billPayment + $memPayment + $wishPayment + $subPayment + $shopPayment;

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
                'subscription_payments' => $subPayment,
                'shop_payments' => $shopPayment
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

        // NO CACHE - REAL TIME DATA
        return Notification::where('notifiable_id', $userId)
            ->where('is_read', 0)
            ->count();
    }

    /**
     * Clear ALL profile related caches for a user
     */
    public function clearUserCaches(string $username, int $userId): void
    {
        // Clear basic profile cache
        Cache::forget('user_profile_basic_' . $username);

        // Clear all data cache variations (common ones)
        Cache::forget('profile_all_data_' . $userId . '_all_page_about');
        Cache::forget('profile_all_data_' . $userId . '_all_page_feed');
        Cache::forget('profile_all_data_' . $userId . '_all_page_wishes');
        Cache::forget('profile_all_data_' . $userId . '_all_page_shop');
        Cache::forget('profile_all_data_' . $userId . '_all_page_tasks');
        Cache::forget('profile_all_data_' . $userId . '_all_page_memberships');
        Cache::forget('profile_all_data_' . $userId . '_all_page_bills');

        // Clear category variations if any exist
        $categories = \App\Models\UserCategory::where('user_id', $userId)->pluck('id');
        foreach ($categories as $catId) {
            Cache::forget('profile_all_data_' . $userId . '_' . $catId . '_page_about');
            Cache::forget('profile_all_data_' . $userId . '_' . $catId . '_page_wishes');
        }

        // Clear other related caches
        Cache::forget('user_categories_with_items_' . $userId);
        Cache::forget('user_wishes_' . $userId . '_all_20');
        Cache::forget('user_memberships_' . $userId);
        Cache::forget('user_bills_' . $userId);
        Cache::forget('user_shop_' . $userId);
        Cache::forget("user_sub_posts_count_{$userId}");
        Cache::forget("user_mem_posts_count_{$userId}");
        
        Log::info("Caches cleared for user: {$username} ({$userId})");
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

        // 🛡️ Sync mandatory subscription if user is viewing their own profile and status is not active
        if (Auth::check() && Auth::id() === $user->id && $user->stripe_id) {
            // Rate limit sync to once every 6 hours per user to avoid blocking page loads
            $syncCacheKey = 'last_stripe_sync_' . $user->id;
            $needsSync = !Cache::has($syncCacheKey);

            if ($needsSync && $user->subscription_status == 0) { // 0 = EXPIRED/NONE
                $this->syncUserSubscription($user);
                Cache::put($syncCacheKey, true, 21600); // 6 hours
                // Refresh user model after sync
                $user = $user->fresh();
                $user->load([
                    'social_links',
                    'user_categories',
                    'intro'
                ]);
            }
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

    /**
     * Unified sync for mandatory platform subscriptions (MonthlyCharge)
     * Used by both StripeWebhookController and StripeController for consistency.
     */
    public function syncMandatorySubscriptionStatus(\Stripe\Subscription $subscription, string $eventType, ?\Stripe\Invoice $invoice = null, ?User $user = null)
    {
        $subscriptionId = $subscription->id;
        $stripeStart = Carbon::createFromTimestamp($subscription->current_period_start);
        $stripeEnd   = Carbon::createFromTimestamp($subscription->current_period_end);
        $normalizedStatus = $subscription->status === 'active' ? 'paid' : $subscription->status;
        $updateIfDirty = static function ($model, array $attributes): bool {
            $model->fill($attributes);
            if (!$model->isDirty()) {
                return false;
            }
            $model->save();
            return true;
        };
        $syncUserSubscribed = static function (?User $targetUser, int $nextValue): bool {
            if (!$targetUser || (int) $targetUser->is_subscribed === $nextValue) {
                return false;
            }
            $targetUser->is_subscribed = $nextValue;
            return $targetUser->save();
        };

        // If this is an invoice sync, use the period dates from the invoice line item if available
        if ($invoice && isset($invoice->lines->data[0]->period)) {
            $stripeStart = Carbon::createFromTimestamp($invoice->lines->data[0]->period->start);
            $stripeEnd   = Carbon::createFromTimestamp($invoice->lines->data[0]->period->end);
        }

        // Fetch customer if not already expanded
        $customer = $subscription->customer;
        if (is_string($customer)) {
            $customer = StripeControl::getClient()->customers->retrieve($customer);
        }

        // Resolve User if not provided
        if (!$user) {
            $userId = $subscription->metadata->user_id ?? $customer->metadata->user_id ?? null;
            if ($userId) {
                $user = User::find($userId);
            }
        }

        $resolvedUserId = $user->id ?? $subscription->metadata->user_id ?? $customer->metadata->user_id ?? null;

        // Fetch the most relevant existing record for this subscription ID to use as a fallback
        $subs = MonthlyCharge::where('stripe_id', $subscriptionId)
            ->when($resolvedUserId, fn($q) => $q->where('user_id', $resolvedUserId))
            ->latest('id')
            ->first();

        /* ================= Handle different event types ================= */

        // TRIAL STARTED / WILL END
        if (
            $eventType === 'customer.subscription.trial_will_end' ||
            ($eventType === 'customer.subscription.created' && $subscription->status === 'trialing')
        ) {
            $trialStartAt = $subscription->trial_start ? Carbon::createFromTimestamp($subscription->trial_start) : $stripeStart;
            $trialEndAt = $subscription->trial_end ? Carbon::createFromTimestamp($subscription->trial_end) : $stripeEnd;

            // Check if we already have a record for this specific trial period for this user
            $trialExists = MonthlyCharge::where('stripe_id', $subscriptionId)
                ->where('user_id', $resolvedUserId ?? $subs->user_id ?? null)
                ->whereDate('current_start_trial_date', $trialStartAt->toDateString())
                ->whereDate('current_end_trial_date', $trialEndAt->toDateString())
                ->exists();

            if ($trialExists) {
                return $subs;
            }

            $newSub = MonthlyCharge::create([
                'user_id' => $resolvedUserId,
                'name' => $customer->name ?? 'Creator',
                'email' => $customer->email,
                'stripe_id' => $subscriptionId,
                'current_start_trial_date' => $trialStartAt->toDateString(),
                'current_end_trial_date' => $trialEndAt->toDateString(),
                'status' => 'trialing',
                'upcoming_payment' => $trialEndAt,
            ]);

            if ($newSub->user) {
                $syncUserSubscribed($newSub->user, 1);
            }

            Log::info("MonthlyCharge Sync: Trial processed", ['sub_id' => $subscriptionId]);
            return $newSub;
        }

        // PAYMENT SUCCEEDED (First Payment or Renewal)
        if ($eventType === 'invoice.payment_succeeded' && $subscription->status === 'active') {
            // ONLY process paid invoices to avoid duplicates from drafts/open invoices
            if ($invoice && $invoice->status !== 'paid') {
                return $subs;
            }

            $amount = $invoice ? ($invoice->amount_paid / 100) : ($subscription->plan->amount / 100);
            $currency = strtoupper($invoice ? $invoice->currency : $subscription->currency);
            $tax = 0;
            if ($invoice && !empty($invoice->total_tax_amounts)) {
                foreach ($invoice->total_tax_amounts as $t) {
                    $tax += ($t->amount ?? 0) / 100;
                }
            }

            // Check if this specific payment period already exists for this user.
            // We use whereDate to ensure we match the day regardless of time components.
            $existing = MonthlyCharge::where('stripe_id', $subscriptionId)
                ->where('user_id', $resolvedUserId ?? $subs->user_id ?? null)
                ->where(function ($q) use ($stripeStart, $stripeEnd) {
                    $q->where(function ($sq) use ($stripeStart, $stripeEnd) {
                        $sq->whereDate('current_start_subscription_date', $stripeStart->toDateString())
                            ->whereDate('current_end_subscription_date', $stripeEnd->toDateString());
                    })->orWhere(function ($sq) use ($stripeStart, $stripeEnd) {
                        $sq->whereDate('current_start_trial_date', $stripeStart->toDateString())
                            ->whereDate('current_end_trial_date', $stripeEnd->toDateString());
                    });
                })
                ->latest('id')
                ->first();

            if ($existing) {
                $updateData = [
                    'status' => $normalizedStatus,
                    'amount' => max((float) ($existing->amount ?? 0), (float) $amount),
                    'currency' => $currency,
                    'tax' => $tax,
                    'upcoming_payment' => ($subscription->cancel_at_period_end) ? null : $stripeEnd,
                    'cancelled_at' => ($subscription->cancel_at_period_end)
                        ? ($subscription->canceled_at ? Carbon::createFromTimestamp($subscription->canceled_at) : ($existing->cancelled_at ?? now()))
                        : null,
                ];

                // Only update dates if they were null or if we are explicitly in a subscription period
                if (!$existing->current_start_subscription_date) {
                    $updateData['current_start_subscription_date'] = $stripeStart->toDateString();
                    $updateData['current_end_subscription_date'] = $stripeEnd->toDateString();
                }

                $updateIfDirty($existing, $updateData);

                if ($existing->user) {
                    $syncUserSubscribed($existing->user, 1);
                }

                return $existing;
            }

            // Check for trial conversion: If we have an active trial record, we mark it as ended
            // and create the first paid record.
            $trial = MonthlyCharge::where('stripe_id', $subscriptionId)
                ->when($resolvedUserId, fn($q) => $q->where('user_id', $resolvedUserId))
                ->where('status', 'trialing')
                ->latest('id')
                ->first();

            if ($trial) {
                $updateIfDirty($trial, ['status' => 'ended']);
            }

            $newSub = MonthlyCharge::create([
                'user_id' => $resolvedUserId ?? $subs->user_id ?? null,
                'name' => $subs->name ?? $customer->name ?? 'Creator',
                'email' => $subs->email ?? $customer->email,
                'stripe_id' => $subscriptionId,
                'current_start_subscription_date' => $stripeStart->toDateString(),
                'current_end_subscription_date' => $stripeEnd->toDateString(),
                'amount' => $amount,
                'currency' => $currency,
                'tax' => $tax,
                'status' => $normalizedStatus,
                'upcoming_payment' => ($subscription->cancel_at_period_end) ? null : $stripeEnd,
                'cancelled_at' => ($subscription->cancel_at_period_end) ? ($subscription->canceled_at ? Carbon::createFromTimestamp($subscription->canceled_at) : now()) : null,
            ]);

            if ($newSub->user) {
                $syncUserSubscribed($newSub->user, 1);
            }

            Log::info("MonthlyCharge Sync: Payment processed", ['sub_id' => $subscriptionId, 'period' => $stripeStart->toDateString()]);
            return $newSub;
        }

        // PAYMENT FAILED
        if ($eventType === 'invoice.payment_failed') {
            if ($subs) {
                $updateIfDirty($subs, ['status' => 'failed', 'upcoming_payment' => null]);
                // Access is only removed if the period has actually expired (handled in User model)
            }
            Log::info("MonthlyCharge Sync: Payment Failed processed", ['sub_id' => $subscriptionId]);
            return $subs;
        }

        // DELETED
        if ($eventType === 'customer.subscription.deleted') {
            if ($subs) {
                $updateIfDirty($subs, ['status' => 'canceled', 'upcoming_payment' => null, 'cancelled_at' => now()]);
            }
            Log::info("MonthlyCharge Sync: Subscription Deleted processed", ['sub_id' => $subscriptionId]);
            return $subs;
        }

        // UPDATED (Generic) or missing local record sync
        if ($eventType === 'customer.subscription.updated' || $eventType === 'manual_sync') {
            $target = MonthlyCharge::where('stripe_id', $subscriptionId)
                ->when($resolvedUserId, fn($q) => $q->where('user_id', $resolvedUserId))
                ->where(function ($q) use ($stripeStart, $stripeEnd) {
                    $q->where(function ($sq) use ($stripeStart, $stripeEnd) {
                        $sq->whereDate('current_start_subscription_date', $stripeStart->toDateString())
                            ->whereDate('current_end_subscription_date', $stripeEnd->toDateString());
                    })->orWhere(function ($sq) use ($stripeStart, $stripeEnd) {
                        $sq->whereDate('current_start_trial_date', $stripeStart->toDateString())
                            ->whereDate('current_end_trial_date', $stripeEnd->toDateString());
                    });
                })
                ->latest('id')
                ->first();

            // If no record found for this specific period, but we have a general record for this subscription,
            // we should still be careful not to overwrite history.
            if (!$target) {
                // If the subscription is trialing, look for any trialing record
                if ($subscription->status === 'trialing') {
                    $target = MonthlyCharge::where('stripe_id', $subscriptionId)
                        ->when($resolvedUserId, fn($q) => $q->where('user_id', $resolvedUserId))
                        ->where('status', 'trialing')
                        ->latest('id')
                        ->first();
                } else {
                    // If active, look for the most recent active/paid record
                    $target = MonthlyCharge::where('stripe_id', $subscriptionId)
                        ->when($resolvedUserId, fn($q) => $q->where('user_id', $resolvedUserId))
                        ->whereIn('status', ['paid', 'active', 'renew'])
                        ->latest('id')
                        ->first();
                }
            }

            if ($target) {
                $newStatus = $normalizedStatus;

                // Determine if we should update dates or if this is a different period
                $isSamePeriod = false;
                if ($subscription->status === 'trialing') {
                    $isSamePeriod = $target->current_start_trial_date && $target->current_start_trial_date->toDateString() === $stripeStart->toDateString();
                } else {
                    $isSamePeriod = $target->current_start_subscription_date && $target->current_start_subscription_date->toDateString() === $stripeStart->toDateString();
                }

                $updateData = [
                    'status' => $newStatus,
                    'upcoming_payment' => ($subscription->cancel_at_period_end || in_array($subscription->status, ['canceled', 'unpaid'])) ? null : $stripeEnd,
                    'cancelled_at' => ($subscription->cancel_at_period_end || $subscription->status === 'canceled')
                        ? ($subscription->canceled_at ? Carbon::createFromTimestamp($subscription->canceled_at) : ($target->cancelled_at ?? now()))
                        : null,
                ];

                Log::info("MonthlyCharge Sync: Updating record", [
                    'sub_id' => $subscriptionId,
                    'cancel_at_period_end' => $subscription->cancel_at_period_end,
                    'new_upcoming' => $updateData['upcoming_payment'],
                    'new_cancelled_at' => $updateData['cancelled_at']
                ]);

                // Only update dates if it's the same period or if dates were missing
                if ($isSamePeriod || (!$target->current_start_subscription_date && !$target->current_start_trial_date)) {
                    if ($subscription->status === 'trialing') {
                        $updateData['current_start_trial_date'] = $stripeStart->toDateString();
                        $updateData['current_end_trial_date'] = $stripeEnd->toDateString();
                    } else {
                        $updateData['current_start_subscription_date'] = $stripeStart->toDateString();
                        $updateData['current_end_subscription_date'] = $stripeEnd->toDateString();
                    }
                } else {
                    // Different period! We should NOT update this record's dates.
                    // Instead, we fall through to the creation logic below if we don't find a record for the NEW period.
                    $target = null;
                }

                if ($target) {
                    $updateIfDirty($target, $updateData);

                    if (in_array($subscription->status, ['active', 'trialing'])) {
                        if ($target->user) $syncUserSubscribed($target->user, 1);
                    } else {
                        // Only set is_subscribed to 0 if the paid period has actually passed
                        $periodEnded = now()->greaterThanOrEqualTo($stripeEnd);
                        if ($periodEnded && $target->user) {
                            $syncUserSubscribed($target->user, 0);
                        }
                    }
                    return $target;
                }
            }

            // If we reach here, it means we didn't find a record to update (or it was a different period)
            // Check one last time by period dates to prevent duplicates
            $existingForPeriod = MonthlyCharge::where('stripe_id', $subscriptionId)
                ->when($resolvedUserId, fn($q) => $q->where('user_id', $resolvedUserId))
                ->where(function ($q) use ($stripeStart, $stripeEnd) {
                    $q->where(function ($sq) use ($stripeStart, $stripeEnd) {
                        $sq->whereDate('current_start_subscription_date', $stripeStart->toDateString())
                            ->whereDate('current_end_subscription_date', $stripeEnd->toDateString());
                    })->orWhere(function ($sq) use ($stripeStart, $stripeEnd) {
                        $sq->whereDate('current_start_trial_date', $stripeStart->toDateString())
                            ->whereDate('current_end_trial_date', $stripeEnd->toDateString());
                    });
                })
                ->latest('id')
                ->first();

            if ($existingForPeriod) {
                $updateIfDirty($existingForPeriod, [
                    'status' => $normalizedStatus,
                    'upcoming_payment' => ($subscription->cancel_at_period_end || in_array($subscription->status, ['canceled', 'unpaid'])) ? null : $stripeEnd,
                    'cancelled_at' => ($subscription->cancel_at_period_end || $subscription->status === 'canceled') ? ($subscription->canceled_at ? Carbon::createFromTimestamp($subscription->canceled_at) : now()) : $existingForPeriod->cancelled_at,
                ]);

                return $existingForPeriod;
            }

            // MISSING LOCAL RECORD: Create it now
            $amount = $invoice ? ($invoice->amount_paid / 100) : ($subscription->plan->amount / 100);
            $currency = strtoupper($invoice ? $invoice->currency : $subscription->currency);

            $createData = [
                'user_id' => $resolvedUserId,
                'name' => $customer->name ?? 'Creator',
                'email' => $customer->email,
                'stripe_id' => $subscriptionId,
                'status' => $normalizedStatus,
                'currency' => $currency,
                'amount' => $amount,
                'upcoming_payment' => ($subscription->cancel_at_period_end || in_array($subscription->status, ['canceled', 'unpaid'])) ? null : $stripeEnd,
                'cancelled_at' => ($subscription->cancel_at_period_end || $subscription->status === 'canceled') ? ($subscription->canceled_at ? Carbon::createFromTimestamp($subscription->canceled_at) : now()) : null,
                'current_start_subscription_date' => $stripeStart->toDateString(),
                'current_end_subscription_date' => $stripeEnd->toDateString(),
            ];

            if ($subscription->status === 'trialing' && !$invoice) {
                $createData['current_start_trial_date'] = $stripeStart->toDateString();
                $createData['current_end_trial_date'] = $stripeEnd->toDateString();
                $createData['status'] = 'trialing';
                unset($createData['current_start_subscription_date'], $createData['current_end_subscription_date']);
            }

            $subs = MonthlyCharge::create($createData);

            if ($subs->user) {
                $syncUserSubscribed($subs->user, in_array($subscription->status, ['active', 'trialing']) ? 1 : 0);
            }

            Log::info("MonthlyCharge Sync: Created missing local record for sub", ['sub_id' => $subscriptionId, 'status' => $subscription->status]);
            return $subs;
        }

        return $subs;
    }

    /**
     * Deep sync for all subscription records (history) from Stripe invoices
     */
    public function syncSubscriptionHistory(\Stripe\Subscription $subscription, User $user)
    {
        try {
            $stripe = StripeControl::getClient();

            // 1. Fetch all invoices for this subscription (including $0 trial invoices)
            $invoices = $stripe->invoices->all([
                'subscription' => $subscription->id,
                'limit' => 50
            ]);

            Log::info("UserProfileService: Syncing history for sub {$subscription->id} (Found " . count($invoices->data) . " invoices)");

            $invoiceList = $invoices->data;
            $invoiceList = array_reverse($invoiceList);

            foreach ($invoiceList as $invoice) {
                // Sync each paid invoice as a separate MonthlyCharge record
                $this->syncMandatorySubscriptionStatus($subscription, 'invoice.payment_succeeded', $invoice, $user);
            }

            // 2. If the subscription has a trial, ensure we have a record for it
            if ($subscription->trial_start && $subscription->trial_end) {
                $this->syncMandatorySubscriptionStatus($subscription, 'customer.subscription.created', null, $user);
            }

            // 3. Final sync for the current subscription state (handles trial, cancellations, etc.)
            $this->syncMandatorySubscriptionStatus($subscription, 'manual_sync', null, $user);
        } catch (\Exception $e) {
            Log::error("UserProfileService: History sync failed: " . $e->getMessage());
        }
    }

    public function syncUserSubscription(User $user)
    {
        // 1. If we have a stripe_id, try to fetch it directly
        if ($user->stripe_id) {
            try {
                // We check both UK and US via getActiveSubscriptionByCustomer
                $stripeSubscription = StripeControl::getActiveSubscriptionByCustomer($user->stripe_id);
                if ($stripeSubscription) {
                    $this->syncSubscriptionHistory($stripeSubscription, $user);
                    return $stripeSubscription;
                }
            } catch (\Exception $e) {
                Log::warning("UserProfileService: Direct ID sync failed for user {$user->id}: " . $e->getMessage());
            }
        }

        // 2. If direct ID didn't yield a subscription, search by email across ALL accounts
        Log::info("UserProfileService: Searching for subscriptions by email for user {$user->id} ({$user->email})");
        $stripeCustomers = StripeControl::searchCustomerAcrossAccounts($user->email);

        foreach ($stripeCustomers as $customer) {
            try {
                $stripeSubscription = StripeControl::getActiveSubscriptionByCustomer($customer->id);
                if ($stripeSubscription) {
                    // Found an active subscription! Link this customer ID and sync.
                    if ($user->stripe_id !== $customer->id) {
                        $user->stripe_id = $customer->id;
                        $user->save();
                        Log::info("UserProfileService: Re-linked user {$user->id} to Stripe customer {$customer->id} ({$customer->account_region})");
                    }

                    $this->syncSubscriptionHistory($stripeSubscription, $user);
                    return $stripeSubscription;
                }
            } catch (\Exception $e) {
                Log::warning("UserProfileService: Error syncing customer {$customer->id}: " . $e->getMessage());
            }
        }

        // 3. If we still have nothing, handle the un-subscribed state
        if ($user->is_subscribed) {
            $user->is_subscribed = 0;
            $user->save();
        }

        // Also update any local MonthlyCharge record that thinks it's active
        $now = now()->toDateString();

        MonthlyCharge::where(function ($q) use ($now) {

            // Expired subscription
            $q->where(function ($sq) use ($now) {
                $sq->whereNotNull('current_end_subscription_date')
                    ->whereDate('current_end_subscription_date', '<', $now);
            })

                // Expired trial
                ->orWhere(function ($sq) use ($now) {
                    $sq->whereNotNull('current_end_trial_date')
                        ->whereDate('current_end_trial_date', '<', $now);
                });
        })
            ->whereIn('status', ['paid', 'active', 'trialing', 'renew'])
            ->update([
                'status' => 'expired',
                'upcoming_payment' => null,
                'updated_at' => now(),
            ]);

        return null;
    }
}
