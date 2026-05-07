<?php

namespace App\Services;

use App\Models\User;
use App\Models\WishItem;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;

class DiscoveryService
{
    public function getTrendingCreators($limit = 12) {
        return \Illuminate\Support\Facades\Cache::remember('trending_creators_v4_limit_' . $limit, 3600, function() use ($limit) {
            // Simplified trending query: Just get recent active creators with some basic ranking
            return User::query()
                ->where('role', 1)
                ->where('suspended_account', 0)
                ->where('profile_status_lock', 2)
                ->orderByDesc('id') // Placeholder for real trending, but much faster
                ->limit($limit)
                ->with(['wishes' => function($q) {
                    $q->where('is_approved', 1)->limit(3)->select('id', 'user_id', 'thumbnail');
                }, 'intro'])
                ->get(['users.id', 'users.name', 'users.username', 'users.avatar', 'users.cover', 'users.cover_cdn_modifier', 'users.profile_status_lock', 'users.role', 'users.bio'])
                ->map(function ($u) {
                    return [
                        'id' => $u->id,
                        'name' => $u->name,
                        'username' => $u->username,
                        'avatar_url' => $u->avatar_url,
                        'cover_url' => $u->cover_url,
                        'bio' => $u->bio,
                        'profile_status_lock' => $u->profile_status_lock,
                        'role' => $u->role,
                        'clicks_24h' => 0,
                        'top_wishes' => $u->wishes->map(fn($w) => $w->thumbnail),
                        'intro' => $u->intro ? [
                            'poster_url' => $u->intro->poster_url,
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
        return \Illuminate\Support\Facades\Cache::remember('new_verified_creators_limit_' . $limit, 300, function() use ($limit) {
            $nowUtc = Carbon::now('UTC');
            return User::query()
                ->where('role', 1)
                ->where('suspended_account', 0)
                ->where('profile_status_lock', 2)
                ->where('identity_status', 1)
                ->where('created_at', '>=', $nowUtc->copy()->subDays(30))
                ->orderByDesc('created_at') // Faster than inRandomOrder()
                ->limit($limit)
                ->with(['wishes' => function($q) {
                    $q->where('is_approved', 1)->limit(3)->select('id', 'user_id', 'thumbnail');
                }, 'intro'])
                ->get(['id', 'name', 'username', 'avatar', 'cover', 'cover_cdn_modifier', 'profile_status_lock', 'role', 'bio'])
                ->map(function ($u) {
                    return [
                        'id' => $u->id,
                        'name' => $u->name,
                        'username' => $u->username,
                        'avatar_url' => $u->avatar_url,
                        'cover_url' => $u->cover_url,
                        'bio' => $u->bio,
                        'profile_status_lock' => $u->profile_status_lock,
                        'role' => $u->role,
                        'top_wishes' => $u->wishes->map(fn($w) => $w->thumbnail),
                        'intro' => $u->intro ? [
                            'poster_url' => $u->intro->poster_url,
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
            // When searching, include both creators and gifters (role 0 and 1)
            $query->whereIn('role', [0, 1]);
        }
        
        $page = isset($filters['page']) ? max(1, (int)$filters['page']) : 1;
        $offset = ($page - 1) * $limit;
        
        if (!empty($filters['categories'])) {
            // If it's a comma-separated string, explode it
            $categories = is_array($filters['categories']) ? $filters['categories'] : explode(',', $filters['categories']);
            // Filter out empty strings
            $categories = array_filter($categories);
            
            if (!empty($categories)) {
                // Assuming user_categories relationship or column
                // $query->whereIn('creator_category', $categories);
                
                // Better approach if using related table:
                    $query->whereHas('user_categories', function($q) use ($categories) {
                        $q->whereIn('category', $categories);
                    });
            }
        }

        if (!empty($filters['search'])) {
            $term = '%' . $filters['search'] . '%';
            $query->where(function($q) use ($term) {
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
                'wishes' => function($q) {
                $q->where('is_approved', 1)->limit(3)->select('id', 'user_id', 'thumbnail');
                },
                'intro'
            ])
            ->get(['id', 'name', 'username', 'avatar', 'cover', 'cover_cdn_modifier', 'profile_status_lock', 'role', 'bio'])
            ->map(function ($u) {
                return [
                    'id' => $u->id,
                    'name' => $u->name,
                    'username' => $u->username,
                    'avatar_url' => $u->avatar_url,
                    'cover_url' => $u->cover_url,
                    'bio' => $u->bio,
                    'profile_status_lock' => $u->profile_status_lock,
                    'role' => $u->role,
                    'top_wishes' => $u->wishes->map(fn($w) => $w->thumbnail),
                    'intro' => $u->intro ? [
                        'poster_url' => $u->intro->poster_url,
                        'perma_link' => $u->intro->perma_link,
                        'approved' => (int) $u->intro->approved,
                    ] : null,
                ];
            });
    }

    public function getSearchWishes($filters, $limit = 24)
    {
        $query = WishItem::query()
            ->where('is_approved', 1)
            ->whereHas('user', function($q) {
                $q->where('suspended_account', 0)
                    ->where('profile_status_lock', 2);
            })
            ->with('wishCategories.category');

        $page = isset($filters['page']) ? max(1, (int)$filters['page']) : 1;
        $offset = ($page - 1) * $limit;
        
        if (!empty($filters['minPrice'])) {
            $query->where('price', '>=', $filters['minPrice']);
        }
        if (!empty($filters['maxPrice'])) {
            $query->where('price', '<=', $filters['maxPrice']);
        }

        if (!empty($filters['search'])) {
                $query->where('wishname', 'like', '%' . $filters['search'] . '%');
        }
        
        if (!empty($filters['categories'])) {
                $categories = is_array($filters['categories']) ? $filters['categories'] : explode(',', $filters['categories']);
                $categories = array_filter($categories);
                if (!empty($categories)) {
                    $query->whereHas('wishCategories.category', function($q) use ($categories) {
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
            ->with('user:id,name,username,avatar,cover,cover_cdn_modifier')
            ->get()
            ->map(function ($w) {
                return [
                    'id' => $w->id,
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
        if ($limit < 1) { $limit = 9; }
        if ($limit > 50) { $limit = 50; }

        $cacheKey = 'top_earners_v4_' . ($period ?: 'all_time') . '_limit_' . $limit;
        
        return \Illuminate\Support\Facades\Cache::remember($cacheKey, 3600, function() use ($period, $limit) {
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
                    ->get(['id','name','username','avatar','cover','cover_cdn_modifier','profile_status_lock','role','default_currency'])
                    ->map(function ($u) {
                        return [
                            'id' => $u->id,
                            'name' => $u->name,
                            'username' => $u->username,
                            'avatar_url' => $u->avatar_url,
                            'cover_url' => $u->cover_url,
                            'profile_status_lock' => $u->profile_status_lock,
                            'role' => $u->role,
                            'total_amount' => 0, // Hidden for privacy anyway
                            'currency' => strtoupper($u->default_currency ?? 'GBP'),
                        ];
                    });
        
                return ['data' => $earners, 'label' => $label];
        });
    }

    public function getFeaturedWishes($limit = 12)
    {
        return \Illuminate\Support\Facades\Cache::remember('featured_wishes_limit_' . $limit, 300, function() use ($limit) {
            return WishItem::where('is_approved', 1)
                ->whereHas('user', function($q) {
                    $q->where('suspended_account', 0)
                      ->where('profile_status_lock', 2);
                })
                ->orderByDesc('supporter_count')
                ->orderByDesc('id')
                ->limit($limit)
                ->with('user:id,name,username,avatar,cover,cover_cdn_modifier')
                ->get()
                ->map(function ($w) {
                    return [
                        'id' => $w->id,
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

        $term = '%' . $term . '%';

        $users = User::query()
            ->where('suspended_account', 0)
            ->where(function($q) use ($term) {
                $q->where('name', 'like', $term)
                  ->orWhere('username', 'like', $term);
            })
            ->limit(5)
            ->get(['id', 'name', 'username', 'avatar', 'role']);
            // ->map(function ($u) {
            //     return [
            //         'type' => 'creator',
            //         'text' => $u->name,
            //         'subtext' => '@' . $u->username,
            //         'image' => $u->avatar_url,
            //         'url' => route('user.show', $u->username),
            //         'verified' => $u->role === 1
            //     ];
            // });

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
            'wishes' => []
            // 'wishes' => $wishes
        ];
    }

    public function getFeaturedBills($limit = 12)
    {
        return \Illuminate\Support\Facades\Cache::remember('featured_bills_limit_' . $limit, 300, function() use ($limit) {
            return \App\Models\Bills::where(function ($q) {
                    $q->where('status', 'active')
                      ->orWhere('status', 1)
                      ->orWhereNull('status');
                })
                ->whereHas('user', function($q) {
                    $q->where('suspended_account', 0)
                      ->where('profile_status_lock', 2);
                })
                ->orderByDesc('supporter_count')
                ->orderByDesc('id')
                ->limit($limit)
                ->with('user:id,name,username,avatar,cover,cover_cdn_modifier')
                ->get()
                ->map(function ($b) {
                    return [
                        'id' => $b->id,
                        'uuid' => $b->uuid,
                        'name' => $b->name,
                        'title' => $b->name,
                        'amount' => null, 
                        'image_url' => $b->thumbnail,
                        'perma_link' => $b->perma_link,
                        'period' => $b->period,
                        'price' => $b->price ?? null,
                        'currency' => $b->currency ?? null,
                        'approved' => $b->approved ?? null,
                        'created_at' => $b->created_at,
                        'type' => 'Bill',
                        'user' => $b->user ? [
                            'name' => $b->user->name,
                            'username' => $b->user->username,
                            'avatar_url' => $b->user->avatar_url,
                            'cover_url' => $b->user->cover_url,
                        ] : null,
                    ];
                });
        });
    }

    public function getFeaturedMemberships($limit = 12)
    {
        return \Illuminate\Support\Facades\Cache::remember('featured_memberships_limit_' . $limit, 300, function() use ($limit) {
            return \App\Models\Membership::where(function ($q) {
                    $q->where('status', 'active')
                      ->orWhere('status', 1)
                      ->orWhereNull('status');
                })
                ->whereHas('user', function($q) {
                    $q->where('suspended_account', 0)
                      ->where('profile_status_lock', 2);
                })
                ->orderByDesc('supporter_count')
                ->orderByDesc('id')
                ->limit($limit)
                ->with('user:id,name,username,avatar,cover,cover_cdn_modifier')
                ->get()
                ->map(function ($m) {
                    return [
                        'id' => $m->id,
                        'uuid' => $m->uuid,
                        'name' => $m->level,
                        'level' => $m->level,
                        'title' => $m->level . ' Membership',
                        'amount' => null,
                        'image_url' => $m->thumbnail,
                        'perma_link' => $m->perma_link,
                        'price' => $m->price ?? null,
                        'currency' => $m->currency ?? null,
                        'rewards' => $m->rewards ?? null,
                        'benefits' => !empty($m->rewards) ? json_decode($m->rewards, true) : [],
                        'approved' => $m->approved ?? null,
                        'created_at' => $m->created_at,
                        'type' => 'Membership',
                        'user' => $m->user ? [
                            'name' => $m->user->name,
                            'username' => $m->user->username,
                            'avatar_url' => $m->user->avatar_url,
                            'cover_url' => $m->user->cover_url,
                        ] : null,
                    ];
                });
        });
    }

    public function getSearchBills($filters, $limit = 24)
    {
        $query = \App\Models\Bills::query()
            ->where(function ($q) {
                $q->where('status', 'active')
                  ->orWhere('status', 1)
                  ->orWhereNull('status');
            })
            ->whereHas('user', function($q) {
                $q->where('suspended_account', 0)
                  ->where('profile_status_lock', 2);
            });

        if (!empty($filters['search'])) {
             $query->where('name', 'like', '%' . $filters['search'] . '%');
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
            ->with('user:id,name,username,avatar')
            ->get()
            ->map(function ($b) {
                return [
                    'id' => $b->id,
                    'uuid' => $b->uuid,
                    'name' => $b->name,
                    'title' => $b->name,
                    'amount' => null,
                    'image_url' => $b->thumbnail,
                    'perma_link' => $b->perma_link,
                    'period' => $b->period,
                    'price' => $b->price ?? null,
                    'currency' => $b->currency ?? null,
                    'approved' => $b->approved ?? null,
                    'created_at' => $b->created_at,
                    'type' => 'Bill',
                    'user' => $b->user ? [
                        'name' => $b->user->name,
                        'username' => $b->user->username,
                        'avatar_url' => $b->user->avatar_url,
                        'cover_url' => $b->user->cover_url,
                    ] : null,
                ];
            });
    }

    public function getSearchMemberships($filters, $limit = 24)
    {
        $query = \App\Models\Membership::query()
            ->where(function ($q) {
                $q->where('status', 'active')
                  ->orWhere('status', 1)
                  ->orWhereNull('status');
            })
            ->whereHas('user', function($q) {
                $q->where('suspended_account', 0)
                  ->where('profile_status_lock', 2);
            });

        if (!empty($filters['search'])) {
             $query->where('level', 'like', '%' . $filters['search'] . '%');
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
            ->with('user:id,name,username,avatar')
            ->get()
            ->map(function ($m) {
                return [
                    'id' => $m->id,
                    'uuid' => $m->uuid,
                    'name' => $m->level,
                    'level' => $m->level,
                    'title' => $m->level . ' Membership',
                    'amount' => null,
                    'image_url' => $m->thumbnail,
                    'perma_link' => $m->perma_link,
                    'price' => $m->price ?? null,
                    'currency' => $m->currency ?? null,
                    'rewards' => $m->rewards ?? null,
                    'benefits' => !empty($m->rewards) ? json_decode($m->rewards, true) : [],
                    'approved' => $m->approved ?? null,
                    'created_at' => $m->created_at,
                    'type' => 'Membership',
                    'user' => $m->user ? [
                        'name' => $m->user->name,
                        'username' => $m->user->username,
                        'avatar_url' => $m->user->avatar_url,
                        'cover_url' => $m->user->cover_url,
                    ] : null,
                ];
            });
    }

    public function getSearchTasks($filters, $limit = 24)
    {
        $query = \App\Models\Task::query()
            ->where('status', 'active')
            ->where('is_approved', 1)
            ->whereHas('creator', function($q) {
                $q->where('suspended_account', 0)
                  ->where('profile_status_lock', 2);
            });

        if (!empty($filters['search'])) {
             $query->where('title', 'like', '%' . $filters['search'] . '%')
                   ->orWhere('description', 'like', '%' . $filters['search'] . '%');
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
            ->with('creator:id,name,username,avatar')
            ->get()
            ->map(function ($t) {
                return [
                    'id' => $t->id,
                    'uuid' => $t->uuid,
                    'title' => $t->title,
                    'price' => $t->price,
                    'currency' => $t->currency,
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
        return \Illuminate\Support\Facades\Cache::remember('featured_tasks_limit_' . $limit, 1800, function() use ($limit) {
            return \App\Models\Task::where('status', 'active')
                ->where('is_approved', 1)
                ->whereHas('creator', function($q) {
                    $q->where('suspended_account', 0)
                      ->where('profile_status_lock', 2);
                })
                ->orderByDesc('id')
                ->limit($limit)
                ->with('creator:id,name,username,avatar,cover,cover_cdn_modifier')
                ->get()
                ->map(function ($t) {
                    return [
                        'id' => $t->id,
                        'uuid' => $t->uuid,
                        'title' => $t->title,
                        'price' => $t->price,
                        'currency' => $t->currency,
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
        $query = \App\Models\Shop::query()
            ->where('status', 1)
            ->where('approved', 1)
            ->whereHas('user', function($q) {
                $q->where('suspended_account', 0)
                  ->where('profile_status_lock', 2);
            });

        if (!empty($filters['search'])) {
             $query->where('name', 'like', '%' . $filters['search'] . '%')
                   ->orWhere('description', 'like', '%' . $filters['search'] . '%');
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
            ->with('user:id,name,username,avatar')
            ->get()
            ->map(function ($s) {
                return [
                    'id' => $s->id,
                    'uuid' => $s->uuid,
                    'name' => $s->name,
                    'title' => $s->name,
                    'price' => $s->price,
                    'currency' => $s->currency,
                    'image_url' => $s->perma_link,
                    'type' => 'Shop',
                    'user' => $s->user ? [
                        'name' => $s->user->name,
                        'username' => $s->user->username,
                        'avatar_url' => $s->user->avatar_url,
                        'cover_url' => $s->user->cover_url,
                    ] : null,
                ];
            });
    }

    public function getFeaturedShops($limit = 12)
    {
        return \Illuminate\Support\Facades\Cache::remember('featured_shops_limit_' . $limit, 1800, function() use ($limit) {
            return \App\Models\Shop::where('status', 1)
                ->where('approved', 1)
                ->whereHas('user', function($q) {
                    $q->where('suspended_account', 0)
                      ->where('profile_status_lock', 2);
                })
                ->orderByDesc('id')
                ->limit($limit)
                ->with('user:id,name,username,avatar,cover,cover_cdn_modifier')
                ->get()
                ->map(function ($s) {
                    return [
                        'id' => $s->id,
                        'uuid' => $s->uuid,
                        'name' => $s->name,
                        'title' => $s->name,
                        'price' => $s->price,
                        'currency' => $s->currency,
                        'image_url' => $s->perma_link,
                        'type' => 'Shop',
                        'user' => $s->user ? [
                            'name' => $s->user->name,
                            'username' => $s->user->username,
                            'avatar_url' => $s->user->avatar_url,
                            'cover_url' => $s->user->cover_url,
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
        \Illuminate\Support\Facades\Cache::forget('trending_creators_limit_12');
        \Illuminate\Support\Facades\Cache::forget('trending_creators_limit_10');
        \Illuminate\Support\Facades\Cache::forget('new_verified_creators_limit_12');
        \Illuminate\Support\Facades\Cache::forget('new_verified_creators_limit_10');
        \Illuminate\Support\Facades\Cache::forget('featured_wishes_limit_12');
        \Illuminate\Support\Facades\Cache::forget('featured_wishes_limit_10');
        \Illuminate\Support\Facades\Cache::forget('featured_bills_limit_12');
        \Illuminate\Support\Facades\Cache::forget('featured_bills_limit_10');
        \Illuminate\Support\Facades\Cache::forget('featured_memberships_limit_12');
        \Illuminate\Support\Facades\Cache::forget('featured_memberships_limit_10');
        
        // Clear top earners
        \Illuminate\Support\Facades\Cache::forget('top_earners_weekly_limit_10');
        \Illuminate\Support\Facades\Cache::forget('top_earners_all_time_limit_9');
        \Illuminate\Support\Facades\Cache::forget('top_earners_daily_limit_9');
        \Illuminate\Support\Facades\Cache::forget('top_earners_monthly_limit_9');

        // Note: discover_v2_* keys are harder to clear without tags because they use md5(request).
        // However, with 5 min TTL they will refresh soon enough, or we can use a cache tag if supported.
    }
}
