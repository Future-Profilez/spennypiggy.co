<?php

namespace App\Services;

use App\Models\Bills;
use App\Models\Membership;
use App\Models\Shop;
use App\Models\Task;
use App\Models\User;
use App\Models\WishItem;
use App\Support\MediaUrl;
use App\Support\VerifiedBadge;
use Carbon\Carbon;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Schema;

class DiscoveryService
{
    private function applyApprovalFilter($query, string $table)
    {
        if (Schema::hasColumn($table, 'is_approved')) {
            return $query->where('is_approved', 1);
        }

        if (Schema::hasColumn($table, 'approved')) {
            return $query->where('approved', 1);
        }

        return $query;
    }

    private function applyUnsuspendedFilter($query, string $table)
    {
        if (Schema::hasColumn($table, 'is_suspended')) {
            $query->where(function ($q) {
                $q->where('is_suspended', 0)->orWhereNull('is_suspended');
            });
        }

        return $query;
    }

    public function getTrendingCreators($limit = 12)
    {
        return Cache::remember('trending_creators_v4_limit_'.$limit, 3600, function () use ($limit) {
            // Simplified trending query: Just get recent active creators with some basic ranking
            return User::query()
                ->where('role', 1)
                ->where('suspended_account', 0)
                ->where('profile_status_lock', 2)
                ->orderByDesc('id') // Placeholder for real trending, but much faster
                ->limit($limit)
                ->with(['wishes' => function ($q) {
                    $q->where('is_approved', 1)->limit(3)->select('id', 'user_id', 'thumbnail');
                }, 'intro'])
                ->get(['users.id', 'users.name', 'users.username', 'users.avatar', 'users.avatar_approved', 'users.avatar_cdn_modifier', 'users.cover', 'users.cover_approved', 'users.cover_cdn_modifier', 'users.profile_status_lock', 'users.identity_status', 'users.identity_admin_status', 'users.stripe_details_submitted', 'users.suspended_account', 'users.is_founder', 'users.role', 'users.bio', 'users.bio_approved'])
                ->map(function ($u) {
                    return [
                        'id' => $u->id,
                        'name' => $u->name,
                        'username' => $u->username,
                        'avatar_url' => $u->avatar_url,
                        'cover_url' => $u->cover_url,
                        'bio' => $u->bio,
                        'profile_status_lock' => $u->profile_status_lock,
                        'verified_badge' => VerifiedBadge::tierFor($u),
                        'is_founder' => $u->is_founder,
                        'role' => $u->role,
                        'clicks_24h' => 0,
                        'top_wishes' => $u->wishes->map(fn ($w) => $w->thumbnail),
                        'intro' => $u->intro ? [
                            'poster_url' => $u->intro->posterUrlNonBlocking(),
                            'perma_link' => $u->intro->perma_link,
                            'approved' => (int) $u->intro->approved,
                        ] : null,
                    ];
                })
                ->values();
        });
    }

    public function getNewVerifiedCreators($limit = 12)
    {
        return Cache::remember('new_verified_creators_limit_'.$limit, 300, function () use ($limit) {
            $nowUtc = Carbon::now('UTC');

            return User::query()
                ->where('role', 1)
                ->where('suspended_account', 0)
                ->where('profile_status_lock', 2)
                ->where('identity_status', 1)
                ->where('created_at', '>=', $nowUtc->copy()->subDays(30))
                ->orderByDesc('created_at') // Faster than inRandomOrder()
                ->limit($limit)
                ->with(['wishes' => function ($q) {
                    $q->where('is_approved', 1)->limit(3)->select('id', 'user_id', 'thumbnail');
                }, 'intro'])
                ->get(['id', 'name', 'username', 'avatar', 'avatar_approved', 'avatar_cdn_modifier', 'cover', 'cover_approved', 'cover_cdn_modifier', 'profile_status_lock', 'identity_status', 'identity_admin_status', 'stripe_details_submitted', 'suspended_account', 'is_founder', 'role', 'bio', 'bio_approved'])
                ->map(function ($u) {
                    return [
                        'id' => $u->id,
                        'name' => $u->name,
                        'username' => $u->username,
                        'avatar_url' => $u->avatar_url,
                        'cover_url' => $u->cover_url,
                        'bio' => $u->bio,
                        'profile_status_lock' => $u->profile_status_lock,
                        'verified_badge' => VerifiedBadge::tierFor($u),
                        'is_founder' => $u->is_founder,
                        'role' => $u->role,
                        'top_wishes' => $u->wishes->map(fn ($w) => $w->thumbnail),
                        'intro' => $u->intro ? [
                            'poster_url' => $u->intro->posterUrlNonBlocking(),
                            'perma_link' => $u->intro->perma_link,
                            'approved' => (int) $u->intro->approved,
                        ] : null,
                    ];
                });
        });
    }

    public function getSearchCreators($filters, $limit = 24)
    {
        $query = User::query()
            ->where('suspended_account', 0);

        // Only restrict to role 1 if not explicitly searching
        if (empty($filters['search'])) {
            $query->where('role', 1)
                ->where('profile_status_lock', 2);
        } else {
            // When searching, creators (role 1) must still be publicly visible
            // (profile_status_lock = 2) — previously search exposed unverified/private
            // creator profiles. Fans (role 0) remain searchable.
            $query->where(function ($q) {
                $q->where(function ($q2) {
                    $q2->where('role', 1)->where('profile_status_lock', 2);
                })->orWhere('role', 0);
            });
        }

        $page = isset($filters['page']) ? max(1, (int) $filters['page']) : 1;
        $offset = ($page - 1) * $limit;

        if (! empty($filters['categories'])) {
            // If it's a comma-separated string, explode it
            $categories = is_array($filters['categories']) ? $filters['categories'] : explode(',', $filters['categories']);
            // Filter out empty strings
            $categories = array_filter($categories);

            if (! empty($categories)) {
                // Assuming user_categories relationship or column
                // $query->whereIn('creator_category', $categories);

                // Better approach if using related table:
                $query->whereHas('user_categories', function ($q) use ($categories) {
                    $q->whereIn('category', $categories);
                });
            }
        }

        if (! empty($filters['search'])) {
            $term = '%'.$filters['search'].'%';
            $query->where(function ($q) use ($term) {
                $q->where('name', 'like', $term)
                    ->orWhere('username', 'like', $term)
                    ->orWhere('bio', 'like', $term);
            });
        }

        $sort = $filters['sortBy'] ?? 'Trending';
        if ($sort === 'New') {
            $query->orderByDesc('created_at');
        } elseif ($sort === 'Trending') {
            // Default to trending logic (simplified for search results)
            $query->orderByDesc('id');
        } else {
            $query->orderByDesc('id');
        }

        return $query->offset($offset)->limit($limit)
            ->with([
                'wishes' => function ($q) {
                    $q->where('is_approved', 1)->limit(3)->select('id', 'user_id', 'thumbnail');
                },
                'intro',
            ])
            ->get(['id', 'name', 'username', 'avatar', 'avatar_approved', 'avatar_cdn_modifier', 'cover', 'cover_approved', 'cover_cdn_modifier', 'profile_status_lock', 'identity_status', 'identity_admin_status', 'stripe_details_submitted', 'suspended_account', 'is_founder', 'role', 'bio', 'bio_approved'])
            ->map(function ($u) {
                return [
                    'id' => $u->id,
                    'name' => $u->name,
                    'username' => $u->username,
                    // Only send avatar_url if avatar is approved (status 1)
                    'avatar_url' => ($u->avatar_approved == 1) ? $u->avatar_url : null,
                    // Only send cover_url if cover is approved (status 1)
                    'cover_url' => ($u->cover_approved == 1) ? $u->cover_url : null,
                    'bio' => $u->bio,
                    'profile_status_lock' => $u->profile_status_lock,
                    'verified_badge' => VerifiedBadge::tierFor($u),
                    'is_founder' => $u->is_founder,
                    'role' => $u->role,
                    'top_wishes' => $u->wishes->map(fn ($w) => $w->thumbnail),
                    // ⚠️ Search is the ONE discovery query that returns fans (role 0)
                    // as well as creators, so the intro has to be gated per row here
                    // rather than by the query's own role filter. Intro uploads were
                    // ungated until 21 Aug 2026 and those gifter rows still exist.
                    'intro' => ($u->intro && (int) $u->role === 1) ? [
                        'poster_url' => $u->intro->posterUrlNonBlocking(),
                        'perma_link' => $u->intro->perma_link,
                        'approved' => (int) $u->intro->approved,
                    ] : null,
                ];
            });
    }

    public function getSearchWishes($filters, $limit = 24)
    {
        $query = $this->applyUnsuspendedFilter(
            $this->applyApprovalFilter(WishItem::query(), 'wish_items'),
            'wish_items'
        )
            ->whereHas('user', function ($q) {
                $q->where('suspended_account', 0)
                    ->where('profile_status_lock', 2);
            })
            ->with('wishCategories.category');

        $page = isset($filters['page']) ? max(1, (int) $filters['page']) : 1;
        $offset = ($page - 1) * $limit;

        if (! empty($filters['minPrice'])) {
            $query->where('price', '>=', $filters['minPrice']);
        }
        if (! empty($filters['maxPrice'])) {
            $query->where('price', '<=', $filters['maxPrice']);
        }

        if (! empty($filters['search'])) {
            $query->where('wishname', 'like', '%'.$filters['search'].'%');
        }

        if (! empty($filters['categories'])) {
            $categories = is_array($filters['categories']) ? $filters['categories'] : explode(',', $filters['categories']);
            $categories = array_filter($categories);
            if (! empty($categories)) {
                $query->whereHas('wishCategories.category', function ($q) use ($categories) {
                    $q->whereIn('category', $categories);
                });
            }
        }

        $sort = $filters['sortBy'] ?? 'Trending';
        switch ($sort) {
            case 'New':
                $query->orderByDesc('created_at');
                break;
            case 'Most Supported':
                $query->orderByDesc('supporter_count');
                break;
            case 'Price: Low to High':
                $query->orderBy('price');
                break;
            case 'Price: High to Low':
                $query->orderByDesc('price');
                break;
            default:
                $query->orderByRaw("CASE WHEN trending_status='hot' THEN 1 ELSE 0 END DESC")
                    ->orderByDesc('rising_score')
                    ->orderByDesc('supporter_count');
                break;
        }

        return $query->offset($offset)->limit($limit)
            ->with('user:id,name,username,avatar,avatar_approved,avatar_cdn_modifier,cover,cover_approved,cover_cdn_modifier'.MediaUrl::ownerColumn())
            ->get()
            ->map(function ($w) {
                return [
                    'id' => $w->id,
                    ...$this->rewardFields($w),
                    'uuid' => $w->uuid, // Needed for cart
                    'wishname' => $w->wishname,
                    'title' => $w->wishname,
                    'price' => $w->price,
                    'perma_link' => $w->perma_link,
                    'funded_percent' => $w->fullfill_amount > 0 ? round(($w->fullfill_amount / $w->price) * 100) : 0,
                    'image_url' => $w->thumbnail,
                    'type' => $w->category,
                    'user' => $w->user ? [
                        'id' => $w->user->id,
                        'name' => $w->user->name,
                        'username' => $w->user->username,
                        'avatar_url' => $w->user->avatar_url,
                        'cover_url' => $w->user->cover_url,
                    ] : null,
                ];
            });
    }

    public function getTopEarners($period = '', $limit = 9)
    {
        if ($limit < 1) {
            $limit = 9;
        }
        if ($limit > 50) {
            $limit = 50;
        }

        $cacheKey = 'top_earners_v4_'.($period ?: 'all_time').'_limit_'.$limit;

        return Cache::remember($cacheKey, 3600, function () use ($period, $limit) {
            $nowLondon = Carbon::now('Europe/London');
            $label = 'All Time';

            if ($period === 'weekly') {
                $startLondon = $nowLondon->copy()->startOfWeek(Carbon::MONDAY)->startOfDay();
                $endLondon = $nowLondon->copy()->endOfWeek(Carbon::SUNDAY)->endOfDay();
                $label = 'Week';
            } elseif ($period === 'monthly') {
                $startLondon = $nowLondon->copy()->startOfMonth()->startOfDay();
                $endLondon = $nowLondon->copy()->endOfMonth()->endOfDay();
                $label = 'Month';
            } elseif ($period === 'daily') {
                $startLondon = $nowLondon->copy()->startOfDay();
                $endLondon = $nowLondon->copy()->endOfDay();
                $label = 'Today';
            } else {
                $startLondon = null;
                $endLondon = null;
            }

            $startUtc = $startLondon ? $startLondon->copy()->setTimezone('UTC') : null;
            $endUtc = $endLondon ? $endLondon->copy()->setTimezone('UTC') : null;

            // Use a simpler query for top earners - join with a subquery of total payments
            // This is MUCH faster than 6 withCount subqueries
            $earners = User::query()
                ->where('stripe_details_submitted', 1)
                ->where('suspended_account', 0)
                ->where('role', 1)
                ->where('profile_status_lock', 2)
                ->limit($limit)
                ->with(['wishes' => function ($q) {
                    $q->where('is_approved', 1)->limit(3)->select('id', 'user_id', 'thumbnail');
                }])
                ->get(['id', 'name', 'username', 'avatar', 'avatar_approved', 'avatar_cdn_modifier', 'cover', 'cover_approved', 'cover_cdn_modifier', 'profile_status_lock', 'identity_status', 'identity_admin_status', 'stripe_details_submitted', 'suspended_account', 'is_founder', 'role', 'bio', 'bio_approved', 'default_currency'])
                ->map(function ($u) {
                    return [
                        'id' => $u->id,
                        'name' => $u->name,
                        'username' => $u->username,
                        'avatar_url' => $u->avatar_url,
                        'cover_url' => $u->cover_url,
                        'profile_status_lock' => $u->profile_status_lock,
                        'verified_badge' => VerifiedBadge::tierFor($u),
                        'is_founder' => $u->is_founder,
                        'role' => $u->role,
                        'bio' => $u->bio,
                        'top_wishes' => $u->wishes->map(fn ($w) => $w->thumbnail),
                        'total_amount' => 0, // Hidden for privacy anyway
                        'currency' => strtoupper($u->default_currency ?? 'GBP'),
                    ];
                });

            return ['data' => $earners, 'label' => $label];
        });
    }

    /**
     * Reward hint for a sellable item — the "what you get" a buyer sees while
     * browsing Discover. Reads the shared reward-contract columns only; never
     * exposes reward_body (that IS the paid content). Fails soft so an odd/missing
     * reward can never break discovery.
     */
    private function rewardFields($item): array
    {
        try {
            return [
                'reward_title' => $item->reward_title ?: null,
                'reward_type' => $item->reward_type ?: null,
                'reward_description' => $item->reward_description ?: null,
            ];
        } catch (\Throwable $e) {
            return ['reward_title' => null, 'reward_type' => null, 'reward_description' => null];
        }
    }

    public function getFeaturedWishes($limit = 12)
    {
        return Cache::remember('featured_wishes_limit_'.$limit, 300, function () use ($limit) {
            return $this->applyUnsuspendedFilter(
                $this->applyApprovalFilter(WishItem::query(), 'wish_items'),
                'wish_items'
            )
                ->whereHas('user', function ($q) {
                    $q->where('suspended_account', 0)
                        ->where('profile_status_lock', 2);
                })
                ->orderByDesc('supporter_count')
                ->orderByDesc('id')
                ->limit($limit)
                ->with('user:id,name,username,avatar,avatar_approved,avatar_cdn_modifier,cover,cover_approved,cover_cdn_modifier'.MediaUrl::ownerColumn())
                ->get()
                ->map(function ($w) {
                    return [
                        'id' => $w->id,
                        ...$this->rewardFields($w),
                        'uuid' => $w->uuid,
                        'wishname' => $w->wishname,
                        'price' => $w->price,
                        'perma_link' => $w->perma_link,
                        'funded_percent' => $w->fullfill_amount > 0 ? round(($w->fullfill_amount / $w->price) * 100) : 0,
                        'image_url' => $w->thumbnail,
                        'type' => $w->category,
                        'user' => $w->user ?? null,
                    ];
                });
        });
    }

    public function getSuggestions($term)
    {
        if (empty($term) || strlen($term) < 2) {
            return [];
        }

        $term = '%'.$term.'%';

        $users = User::query()
            ->where('suspended_account', 0)
            ->where(function ($q) use ($term) {
                $q->where('name', 'like', $term)
                    ->orWhere('username', 'like', $term);
            })
            ->limit(5)
            ->get(['id', 'name', 'username', 'avatar', 'avatar_approved', 'avatar_cdn_modifier', 'cover', 'cover_approved', 'cover_cdn_modifier', 'role'])
            ->map(function ($u) {
                return [
                    'id' => $u->id,
                    'text' => $u->name,
                    'subtext' => '@'.$u->username,
                    'search_term' => $u->username,
                    'image' => $u->avatar_url,
                    'type' => 'creator',
                ];
            });

        // $wishes = WishItem::query()
        //     ->where('is_approved', 1)
        //     ->where('wishname', 'like', $term)
        //     ->limit(5)
        //     ->get(['id', 'wishname', 'thumbnail', 'uuid'])
        //     ->map(function ($w) {
        //         return [
        //             'type' => 'wish',
        //             'text' => $w->wishname,
        //             'subtext' => 'Wish',
        //             'image' => $w->thumbnail ? (str_starts_with($w->thumbnail, 'http') ? $w->thumbnail : "https://ucarecdn.com/{$w->thumbnail}/-/preview/") : null,
        //             'url' => null, // Wishes might just trigger a search or open a modal, for now let's just use the title for search
        //             'search_term' => $w->wishname
        //         ];
        //     });

        return [
            'creators' => $users,
            'wishes' => [],
            // 'wishes' => $wishes
        ];
    }

    public function getFeaturedBills($limit = 12)
    {
        return Cache::remember('featured_bills_limit_'.$limit, 300, function () use ($limit) {
            return $this->applyUnsuspendedFilter(
                $this->applyApprovalFilter(Bills::query(), 'bills'),
                'bills'
            )
                ->where(function ($q) {
                    $q->where('status', 'active')
                        ->orWhere('status', 1)
                        ->orWhereNull('status');
                })
                ->whereHas('user', function ($q) {
                    $q->where('suspended_account', 0)
                        ->where('profile_status_lock', 2);
                })
                ->orderByDesc('supporter_count')
                ->orderByDesc('id')
                ->limit($limit)
                ->with('user:id,name,username,avatar,avatar_approved,avatar_cdn_modifier,cover,cover_approved,cover_cdn_modifier,vat_amount_percentage'.MediaUrl::ownerColumn())
                ->get()
                ->map(function ($b) {
                    return [
                        'id' => $b->id,
                        ...$this->rewardFields($b),
                        'uuid' => $b->uuid,
                        'user_id' => $b->user_id,
                        'name' => $b->name,
                        'title' => $b->name,
                        'amount' => null,
                        'image_url' => $b->thumbnail,
                        'perma_link' => $b->perma_link,
                        'period' => $b->period,
                        'price' => $b->price ?? null,
                        'currency' => $b->currency ?? null,
                        'approved' => $b->approved ?? null,
                        'is_approved' => $b->is_approved ?? null,
                        'status' => $b->status ?? null,
                        'is_suspended' => $b->is_suspended ?? null,
                        'suspend_reason' => $b->suspend_reason ?? null,
                        'created_at' => $b->created_at,
                        'type' => 'Bill',
                        'user' => $b->user ? [
                            'name' => $b->user->name,
                            'username' => $b->user->username,
                            'avatar_url' => $b->user->avatar_url,
                            'cover_url' => $b->user->cover_url,
                            'vat_amount_percentage' => $b->user->vat_amount_percentage ?? 0,
                        ] : null,
                    ];
                });
        });
    }

    public function getFeaturedMemberships($limit = 12)
    {
        return Cache::remember('featured_memberships_limit_'.$limit, 300, function () use ($limit) {
            return $this->applyUnsuspendedFilter(
                $this->applyApprovalFilter(Membership::query(), 'memberships'),
                'memberships'
            )
                ->where(function ($q) {
                    $q->where('status', 'active')
                        ->orWhere('status', 1)
                        ->orWhereNull('status');
                })
                ->whereHas('user', function ($q) {
                    $q->where('suspended_account', 0)
                        ->where('profile_status_lock', 2);
                })
                ->orderByDesc('supporter_count')
                ->orderByDesc('id')
                ->limit($limit)
                ->with('user:id,name,username,avatar,avatar_approved,avatar_cdn_modifier,cover,cover_approved,cover_cdn_modifier,vat_amount_percentage'.MediaUrl::ownerColumn())
                ->get()
                ->map(function ($m) {
                    return [
                        'id' => $m->id,
                        ...$this->rewardFields($m),
                        'uuid' => $m->uuid,
                        'user_id' => $m->user_id,
                        'name' => $m->level,
                        'level' => $m->level,
                        'title' => $m->level.' Membership',
                        'amount' => null,
                        'image_url' => $m->thumbnail,
                        'perma_link' => $m->perma_link,
                        'price' => $m->price ?? null,
                        'currency' => $m->currency ?? null,
                        'rewards' => $m->rewards ?? null,
                        'benefits' => ! empty($m->rewards) ? json_decode($m->rewards, true) : [],
                        'approved' => $m->approved ?? null,
                        'is_approved' => $m->is_approved ?? null,
                        'status' => $m->status ?? null,
                        'is_suspended' => $m->is_suspended ?? null,
                        'suspend_reason' => $m->suspend_reason ?? null,
                        'created_at' => $m->created_at,
                        'type' => 'Membership',
                        'user' => $m->user ? [
                            'name' => $m->user->name,
                            'username' => $m->user->username,
                            'avatar_url' => $m->user->avatar_url,
                            'cover_url' => $m->user->cover_url,
                            'vat_amount_percentage' => $m->user->vat_amount_percentage ?? 0,
                        ] : null,
                    ];
                });
        });
    }

    public function getSearchBills($filters, $limit = 24)
    {
        $query = $this->applyUnsuspendedFilter(
            $this->applyApprovalFilter(Bills::query(), 'bills'),
            'bills'
        )
            ->where(function ($q) {
                $q->where('status', 'active')
                    ->orWhere('status', 1)
                    ->orWhereNull('status');
            })
            ->whereHas('user', function ($q) {
                $q->where('suspended_account', 0)
                    ->where('profile_status_lock', 2);
            });

        if (! empty($filters['search'])) {
            $query->where('name', 'like', '%'.$filters['search'].'%');
        }

        // Bills specific filtering if needed

        $sort = $filters['sortBy'] ?? 'Trending';
        switch ($sort) {
            case 'New':
                $query->orderByDesc('created_at');
                break;
            case 'Most Supported':
                $query->orderByDesc('supporter_count');
                break;
            case 'Trending':
                $query->orderByRaw("CASE WHEN trending_status='hot' THEN 1 ELSE 0 END DESC")
                    ->orderByDesc('rising_score')
                    ->orderByDesc('supporter_count');
                break;
            default:
                $query->orderByRaw("CASE WHEN trending_status='hot' THEN 1 ELSE 0 END DESC")
                    ->orderByDesc('rising_score')
                    ->orderByDesc('supporter_count');
        }

        return $query->limit($limit)
            ->with('user:id,name,username,avatar,avatar_approved,avatar_cdn_modifier,cover,cover_approved,cover_cdn_modifier,vat_amount_percentage'.MediaUrl::ownerColumn())
            ->get()
            ->map(function ($b) {
                return [
                    'id' => $b->id,
                    ...$this->rewardFields($b),
                    'uuid' => $b->uuid,
                    'user_id' => $b->user_id,
                    'name' => $b->name,
                    'title' => $b->name,
                    'amount' => null,
                    'image_url' => $b->thumbnail,
                    'perma_link' => $b->perma_link,
                    'period' => $b->period,
                    'price' => $b->price ?? null,
                    'currency' => $b->currency ?? null,
                    'approved' => $b->approved ?? null,
                    'is_approved' => $b->is_approved ?? null,
                    'status' => $b->status ?? null,
                    'is_suspended' => $b->is_suspended ?? null,
                    'suspend_reason' => $b->suspend_reason ?? null,
                    'created_at' => $b->created_at,
                    'type' => 'Bill',
                    'user' => $b->user ? [
                        'name' => $b->user->name,
                        'username' => $b->user->username,
                        'avatar_url' => $b->user->avatar_url,
                        'cover_url' => $b->user->cover_url,
                        'vat_amount_percentage' => $b->user->vat_amount_percentage ?? 0,
                    ] : null,
                ];
            });
    }

    public function getSearchMemberships($filters, $limit = 24)
    {
        $query = $this->applyUnsuspendedFilter(
            $this->applyApprovalFilter(Membership::query(), 'memberships'),
            'memberships'
        )
            ->where(function ($q) {
                $q->where('status', 'active')
                    ->orWhere('status', 1)
                    ->orWhereNull('status');
            })
            ->whereHas('user', function ($q) {
                $q->where('suspended_account', 0)
                    ->where('profile_status_lock', 2);
            });

        if (! empty($filters['search'])) {
            $query->where('level', 'like', '%'.$filters['search'].'%');
        }

        $sort = $filters['sortBy'] ?? 'Trending';
        switch ($sort) {
            case 'New':
                $query->orderByDesc('created_at');
                break;
            case 'Most Supported':
                $query->orderByDesc('supporter_count');
                break;
            case 'Trending':
                $query->orderByRaw("CASE WHEN trending_status='hot' THEN 1 ELSE 0 END DESC")
                    ->orderByDesc('rising_score')
                    ->orderByDesc('supporter_count');
                break;
            default:
                $query->orderByRaw("CASE WHEN trending_status='hot' THEN 1 ELSE 0 END DESC")
                    ->orderByDesc('rising_score')
                    ->orderByDesc('supporter_count');
        }

        return $query->limit($limit)
            ->with('user:id,name,username,avatar,avatar_approved,avatar_cdn_modifier,cover,cover_approved,cover_cdn_modifier,vat_amount_percentage'.MediaUrl::ownerColumn())
            ->get()
            ->map(function ($m) {
                return [
                    'id' => $m->id,
                    ...$this->rewardFields($m),
                    'uuid' => $m->uuid,
                    'user_id' => $m->user_id,
                    'name' => $m->level,
                    'level' => $m->level,
                    'title' => $m->level.' Membership',
                    'amount' => null,
                    'image_url' => $m->thumbnail,
                    'perma_link' => $m->perma_link,
                    'price' => $m->price ?? null,
                    'currency' => $m->currency ?? null,
                    'rewards' => $m->rewards ?? null,
                    'benefits' => ! empty($m->rewards) ? json_decode($m->rewards, true) : [],
                    'approved' => $m->approved ?? null,
                    'is_approved' => $m->is_approved ?? null,
                    'status' => $m->status ?? null,
                    'is_suspended' => $m->is_suspended ?? null,
                    'suspend_reason' => $m->suspend_reason ?? null,
                    'created_at' => $m->created_at,
                    'type' => 'Membership',
                    'user' => $m->user ? [
                        'name' => $m->user->name,
                        'username' => $m->user->username,
                        'avatar_url' => $m->user->avatar_url,
                        'cover_url' => $m->user->cover_url,
                        'vat_amount_percentage' => $m->user->vat_amount_percentage ?? 0,
                    ] : null,
                ];
            });
    }

    public function getSearchTasks($filters, $limit = 24)
    {
        $query = $this->applyUnsuspendedFilter(
            $this->applyApprovalFilter(Task::query(), 'tasks'),
            'tasks'
        )
            ->where('status', 'active')
            ->whereHas('creator', function ($q) {
                $q->where('suspended_account', 0)
                    ->where('profile_status_lock', 2);
            });

        if (! empty($filters['search'])) {
            $query->where(function ($q) use ($filters) {
                $q->where('title', 'like', '%'.$filters['search'].'%')
                    ->orWhere('description', 'like', '%'.$filters['search'].'%');
            });
        }

        $sort = $filters['sortBy'] ?? 'Trending';
        if ($sort === 'New') {
            $query->orderByDesc('created_at');
        } elseif ($sort === 'Trending') {
            $query->orderByDesc('id'); // Can enhance with task-specific trending metrics later
        } else {
            $query->orderByDesc('id');
        }

        return $query->limit($limit)
            ->with('creator:id,name,username,avatar,avatar_approved,avatar_cdn_modifier,cover,cover_approved,cover_cdn_modifier')
            ->get()
            ->map(function ($t) {
                return [
                    'id' => $t->id,
                    ...$this->rewardFields($t),
                    'uuid' => $t->uuid,
                    'title' => $t->title,
                    'description' => $t->description,
                    'price' => $t->price,
                    'currency' => $t->currency,
                    'status' => $t->status,
                    'category' => $t->category,
                    'is_approved' => $t->is_approved,
                    'is_suspended' => $t->is_suspended,
                    'reason' => $t->reason ?? null,
                    'suspend_reason' => $t->suspend_reason ?? null,
                    'media_url' => $t->media_url,
                    'type' => 'Task',
                    'user' => $t->creator ? [
                        'name' => $t->creator->name,
                        'username' => $t->creator->username,
                        'avatar_url' => $t->creator->avatar_url,
                        'cover_url' => $t->creator->cover_url,
                    ] : null,
                ];
            });
    }

    public function getFeaturedTasks($limit = 12)
    {
        return Cache::remember('featured_tasks_limit_'.$limit, 1800, function () use ($limit) {
            return $this->applyUnsuspendedFilter(
                $this->applyApprovalFilter(Task::query(), 'tasks'),
                'tasks'
            )
                ->where('status', 'active')
                ->whereHas('creator', function ($q) {
                    $q->where('suspended_account', 0)
                        ->where('profile_status_lock', 2);
                })
                ->orderByDesc('id')
                ->limit($limit)
                ->with('creator:id,name,username,avatar,avatar_approved,avatar_cdn_modifier,cover,cover_approved,cover_cdn_modifier')
                ->get()
                ->map(function ($t) {
                    return [
                        'id' => $t->id,
                        ...$this->rewardFields($t),
                        'uuid' => $t->uuid,
                        'title' => $t->title,
                        'description' => $t->description,
                        'price' => $t->price,
                        'currency' => $t->currency,
                        'status' => $t->status,
                        'category' => $t->category,
                        'is_approved' => $t->is_approved,
                        'is_suspended' => $t->is_suspended,
                        'reason' => $t->reason ?? null,
                        'suspend_reason' => $t->suspend_reason ?? null,
                        'media_url' => $t->media_url,
                        'type' => 'Task',
                        'user' => $t->creator ? [
                            'name' => $t->creator->name,
                            'username' => $t->creator->username,
                            'avatar_url' => $t->creator->avatar_url,
                            'cover_url' => $t->creator->cover_url,
                        ] : null,
                    ];
                });
        });
    }

    public function getSearchShops($filters, $limit = 24)
    {
        $query = $this->applyUnsuspendedFilter(
            $this->applyApprovalFilter(Shop::query(), 'shops'),
            'shops'
        )
            ->where('status', 1)
            ->whereHas('user', function ($q) {
                $q->where('suspended_account', 0)
                    ->where('profile_status_lock', 2);
            });

        if (! empty($filters['search'])) {
            $query->where(function ($q) use ($filters) {
                $q->where('name', 'like', '%'.$filters['search'].'%')
                    ->orWhere('description', 'like', '%'.$filters['search'].'%');
            });
        }

        $sort = $filters['sortBy'] ?? 'Trending';
        if ($sort === 'New') {
            $query->orderByDesc('created_at');
        } elseif ($sort === 'Trending') {
            $query->orderByDesc('id'); // Can enhance with shop-specific trending metrics later
        } else {
            $query->orderByDesc('id');
        }

        return $query->limit($limit)
            ->with([
                'user:id,name,username,avatar,avatar_approved,avatar_cdn_modifier,cover,cover_approved,cover_cdn_modifier,vat_amount_percentage,default_currency'.MediaUrl::ownerColumn(),
                'shop_shipping_info:id,shop_id,country,shipping_price',
            ])
            ->get()
            ->map(function ($s) {
                return [
                    'id' => $s->id,
                    ...$this->rewardFields($s),
                    'uuid' => $s->uuid,
                    'user_id' => $s->user_id,
                    'name' => $s->name,
                    'title' => $s->name,
                    'description' => $s->description,
                    'price' => $s->price,
                    'currency' => $s->currency,
                    'status' => $s->status,
                    'approved' => $s->approved ?? null,
                    'is_approved' => $s->is_approved ?? null,
                    'edited_status' => $s->edited_status ?? null,
                    'edited_reason' => $s->edited_reason ?? null,
                    'is_suspended' => $s->is_suspended ?? null,
                    'suspend_reason' => $s->suspend_reason ?? null,
                    'ai_generated' => $s->ai_generated ?? null,
                    'perma_link' => $s->perma_link,
                    'image_url' => $s->perma_link,
                    'type' => $s->type,
                    'content_type' => 'Shop',
                    'shop_shipping_info' => $s->shop_shipping_info ?? [],
                    'user' => $s->user ? [
                        'id' => $s->user->id,
                        'name' => $s->user->name,
                        'username' => $s->user->username,
                        'avatar_url' => $s->user->avatar_url,
                        'cover_url' => $s->user->cover_url,
                        'vat_amount_percentage' => $s->user->vat_amount_percentage ?? 0,
                        'default_currency' => $s->user->default_currency ?? null,
                    ] : null,
                ];
            });
    }

    public function getFeaturedShops($limit = 12)
    {
        return Cache::remember('featured_shops_limit_'.$limit, 1800, function () use ($limit) {
            return $this->applyUnsuspendedFilter(
                $this->applyApprovalFilter(Shop::query(), 'shops'),
                'shops'
            )
                ->where('status', 1)
                ->whereHas('user', function ($q) {
                    $q->where('suspended_account', 0)
                        ->where('profile_status_lock', 2);
                })
                ->orderByDesc('id')
                ->limit($limit)
                ->with([
                    'user:id,name,username,avatar,avatar_approved,avatar_cdn_modifier,cover,cover_approved,cover_cdn_modifier,vat_amount_percentage,default_currency'.MediaUrl::ownerColumn(),
                    'shop_shipping_info:id,shop_id,country,shipping_price',
                ])
                ->get()
                ->map(function ($s) {
                    return [
                        'id' => $s->id,
                        ...$this->rewardFields($s),
                        'uuid' => $s->uuid,
                        'user_id' => $s->user_id,
                        'name' => $s->name,
                        'title' => $s->name,
                        'description' => $s->description,
                        'price' => $s->price,
                        'currency' => $s->currency,
                        'status' => $s->status,
                        'approved' => $s->approved ?? null,
                        'is_approved' => $s->is_approved ?? null,
                        'edited_status' => $s->edited_status ?? null,
                        'edited_reason' => $s->edited_reason ?? null,
                        'is_suspended' => $s->is_suspended ?? null,
                        'suspend_reason' => $s->suspend_reason ?? null,
                        'ai_generated' => $s->ai_generated ?? null,
                        'perma_link' => $s->perma_link,
                        'image_url' => $s->perma_link,
                        'type' => $s->type,
                        'content_type' => 'Shop',
                        'shop_shipping_info' => $s->shop_shipping_info ?? [],
                        'user' => $s->user ? [
                            'id' => $s->user->id,
                            'name' => $s->user->name,
                            'username' => $s->user->username,
                            'avatar_url' => $s->user->avatar_url,
                            'cover_url' => $s->user->cover_url,
                            'vat_amount_percentage' => $s->user->vat_amount_percentage ?? 0,
                            'default_currency' => $s->user->default_currency ?? null,
                        ] : null,
                    ];
                });
        });
    }

    /**
     * Clear all discovery related caches to ensure real-time updates
     * when important events occur (e.g. payment, approval)
     */
    public function clearDiscoveryCache()
    {
        // Clear section caches
        Cache::forget('trending_creators_limit_12');
        Cache::forget('trending_creators_limit_10');
        Cache::forget('new_verified_creators_limit_12');
        Cache::forget('new_verified_creators_limit_10');
        Cache::forget('featured_wishes_limit_12');
        Cache::forget('featured_wishes_limit_10');
        Cache::forget('featured_bills_limit_12');
        Cache::forget('featured_bills_limit_10');
        Cache::forget('featured_memberships_limit_12');
        Cache::forget('featured_memberships_limit_10');

        // Clear top earners
        Cache::forget('top_earners_weekly_limit_10');
        Cache::forget('top_earners_all_time_limit_9');
        Cache::forget('top_earners_daily_limit_9');
        Cache::forget('top_earners_monthly_limit_9');

        // Note: discover_v2_* keys are harder to clear without tags because they use md5(request).
        // However, with 5 min TTL they will refresh soon enough, or we can use a cache tag if supported.
    }
}
