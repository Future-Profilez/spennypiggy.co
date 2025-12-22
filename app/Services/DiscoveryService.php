<?php

namespace App\Services;

use App\Models\User;
use App\Models\WishItem;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;

class DiscoveryService
{
    public function getTrendingCreators($limit = 12)
    {
        $nowUtc = Carbon::now('UTC');
        $clicks24hStart = $nowUtc->copy()->subHours(24);
        $clicks7dStart = $nowUtc->copy()->subDays(7);

        return User::query()
            ->where('role', 1)
            ->where('suspended_account', 0)
            ->where('profile_status_lock', 2)
            // ->where('identity_status', 1)
            ->join('search_clicks', 'search_clicks.creator_id', '=', 'users.id')
            ->select('users.id', 'users.name', 'users.username', 'users.avatar', 'users.profile_status_lock', 'users.role', 'users.bio')
            ->selectRaw('SUM(CASE WHEN search_clicks.created_at >= ? THEN 1 ELSE 0 END) as clicks_24h', [$clicks24hStart])
            ->selectRaw('SUM(CASE WHEN search_clicks.created_at >= ? THEN 1 ELSE 0 END) as clicks_7d', [$clicks7dStart])
            ->groupBy('users.id', 'users.name', 'users.username', 'users.avatar', 'users.profile_status_lock', 'users.role', 'users.bio')
            ->orderByDesc('clicks_24h')
            ->orderByDesc('clicks_7d')
            ->limit($limit)
            ->with(['wishes' => function($q) {
                $q->where('is_approved', 1)->limit(3)->select('id', 'user_id', 'thumbnail');
            }])
            ->get()
            ->map(function ($u) {
                return [
                    'id' => $u->id,
                    'name' => $u->name,
                    'username' => $u->username,
                    'avatar_url' => $u->avatar_url,
                    'bio' => $u->bio,
                    'profile_status_lock' => $u->profile_status_lock,
                    'role' => $u->role,
                    'clicks_24h' => (int) $u->clicks_24h,
                    'clicks_7d' => (int) $u->clicks_7d,
                    'top_wishes' => $u->wishes->map(fn($w) => $w->thumbnail),
                ];
            })
            ->values();
    }

    public function getNewVerifiedCreators($limit = 12)
    {
        $nowUtc = Carbon::now('UTC');
        return User::query()
            ->where('role', 1)
            ->where('suspended_account', 0)
            ->where('profile_status_lock', 2)
            ->where('identity_status', 1)
            ->where('created_at', '>=', $nowUtc->copy()->subDays(30))
            ->inRandomOrder()
            ->limit($limit)
            ->with(['wishes' => function($q) {
                $q->where('is_approved', 1)->limit(3)->select('id', 'user_id', 'thumbnail');
            }])
            ->get(['id', 'name', 'username', 'avatar', 'profile_status_lock', 'role', 'bio'])
            ->map(function ($u) {
                return [
                    'id' => $u->id,
                    'name' => $u->name,
                    'username' => $u->username,
                    'avatar_url' => $u->avatar_url,
                    'bio' => $u->bio,
                    'profile_status_lock' => $u->profile_status_lock,
                    'role' => $u->role,
                    'top_wishes' => $u->wishes->map(fn($w) => $w->thumbnail),
                ];
            });
    }

    public function getSearchCreators($filters, $limit = 24)
    {
        $query = User::query()
            ->where('suspended_account', 0);
            // ->where('profile_status_lock', 2); // Relaxed for testing/debugging
        
        if (!empty($filters['verified']) && filter_var($filters['verified'], FILTER_VALIDATE_BOOLEAN)) {
            $query->where('role', 1); 
        }
        
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
        
        // Default sort
        $sort = $filters['sortBy'] ?? 'Trending';
        if ($sort === 'New') {
            $query->orderByDesc('created_at');
        } elseif ($sort === 'Top Earners') {
            // Complex sort, maybe skip for now or join with payments
             $query->withCount('wishItems')->orderByDesc('wish_items_count');
        } else {
             // Default to trending logic (simplified for search results)
             // We could reuse the search_clicks logic if we want
            $query->orderByDesc('id'); 
        }

        return $query->limit($limit)
            ->with(['wishes' => function($q) {
                $q->where('is_approved', 1)->limit(3)->select('id', 'user_id', 'thumbnail');
            }])
            ->get(['id', 'name', 'username', 'avatar', 'profile_status_lock', 'role', 'bio'])
            ->map(function ($u) {
                return [
                    'id' => $u->id,
                    'name' => $u->name,
                    'username' => $u->username,
                    'avatar_url' => $u->avatar_url,
                    'bio' => $u->bio,
                    'profile_status_lock' => $u->profile_status_lock,
                    'role' => $u->role,
                    'top_wishes' => $u->wishes->map(fn($w) => $w->thumbnail),
                ];
            });
    }

    public function getSearchWishes($filters, $limit = 24)
    {
        $query = WishItem::query()
            ->where('is_approved', 1)
            ->with('wishCategories.category');

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

        return $query->limit($limit)
            ->with('user:id,name,username,avatar')
            ->get()
            ->map(function ($w) {
                return [
                    'id' => $w->id,
                    'uuid' => $w->uuid, // Needed for cart
                    'title' => $w->wishname,
                    'amount' => $w->price,
                    'funded_percent' => $w->fullfill_amount > 0 ? round(($w->fullfill_amount / $w->price) * 100) : 0,
                    'image_url' => $w->thumbnail,
                    'type' => $w->category,
                    'user' => $w->user ? [
                        'name' => $w->user->name,
                        'username' => $w->user->username,
                        'avatar_url' => $w->user->avatar_url,
                    ] : null,
                ];
            });
    }

    public function getTopEarners($period = '', $limit = 9)
    {
        if ($limit < 1) { $limit = 9; }
        if ($limit > 50) { $limit = 50; }

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

        $earners = User::where('stripe_details_submitted', 1)
            ->where('suspended_account', 0)
            ->withCount([
                'paymentitems as total_payments' => function ($query) use ($startUtc, $endUtc, $period) {
                    $query->select(DB::raw('COALESCE(SUM(amount), 0)'))
                        ->whereHas('payment', function($q) use ($startUtc, $endUtc, $period) { 
                            $q->where('payment_status', 'paid');
                            if ($period !== 'all_time' && $startUtc && $endUtc) {
                                $q->whereBetween('stripe_payment_details.created_at', [$startUtc, $endUtc]);
                            }
                        });
                },
                'subscriptions as total_subscriptions' => function ($query) use ($startUtc, $endUtc, $period) {
                    $query->select(DB::raw('COALESCE(SUM(amount), 0)'))
                        ->where('wish_item_subscriptions.status', 'paid');
                    if ($period !== 'all_time' && $startUtc && $endUtc) {
                        $query->whereBetween('wish_item_subscriptions.created_at', [$startUtc, $endUtc]);
                    }
                },
                'tip_goal_payment as total_tips' => function ($query) use ($startUtc, $endUtc, $period) {
                    $query->select(DB::raw('COALESCE(SUM(amount), 0)'))
                        ->where('tip_goals_payments.status', 'paid');
                    if ($period !== 'all_time' && $startUtc && $endUtc) {
                        $query->whereBetween('tip_goals_payments.created_at', [$startUtc, $endUtc]);
                    }
                },
                'membership_payments as total_member' => function ($query) use ($startUtc, $endUtc, $period) {
                    $query->select(DB::raw('COALESCE(SUM(amount), 0)'))
                        ->where('membership_payments.status', 'paid');
                    if ($period !== 'all_time' && $startUtc && $endUtc) {
                        $query->whereBetween('membership_payments.created_at', [$startUtc, $endUtc]);
                    }
                },
                'bill_payments as total_bill' => function ($query) use ($startUtc, $endUtc, $period) {
                    $query->select(DB::raw('COALESCE(SUM(amount), 0)'))
                        ->where('bill_payments.status', 'paid');
                    if ($period !== 'all_time' && $startUtc && $endUtc) {
                        $query->whereBetween('bill_payments.created_at', [$startUtc, $endUtc]);
                    }
                },
                'shop_payments as total_shop' => function ($query) use ($startUtc, $endUtc, $period) {
                    $query->select(DB::raw('COALESCE(SUM(amount), 0)'))
                        ->where('shop_payments.payment_status', 'paid');
                    if ($period !== 'all_time' && $startUtc && $endUtc) {
                        $query->whereBetween('shop_payments.created_at', [$startUtc, $endUtc]);
                    }
                },
            ])
            ->havingRaw('(total_payments + total_subscriptions + total_tips + total_member + total_bill + total_shop) > 0')
            ->orderByDesc(DB::raw('total_payments + total_subscriptions + total_tips + total_member + total_bill + total_shop'))
            ->take($limit)
            ->get(['id','name','username','avatar','profile_status_lock','role','default_currency'])
            ->map(function ($u, $index) {
                $sum = ($u->total_payments ?? 0) + ($u->total_subscriptions ?? 0) + ($u->total_tips ?? 0) + ($u->total_member ?? 0) + ($u->total_bill ?? 0) + ($u->total_shop ?? 0);
                return [
                    'id' => $u->id,
                    'name' => $u->name,
                    'username' => $u->username,
                    'avatar_url' => $u->avatar_url,
                    'profile_status_lock' => $u->profile_status_lock,
                    'role' => $u->role,
                    'total_amount' => \App\Helpers::priceFormat($u->default_currency, $sum, 'USD'),
                    'currency' => 'USD',
                    'is_number_one' => $index === 0,
                ];
            });

        return ['data' => $earners, 'label' => $label];
    }

    public function getFeaturedWishes($limit = 12)
    {
        return WishItem::where('is_approved', 1)
            ->orderByDesc('supporter_count')
            ->orderByDesc('id')
            ->limit($limit)
            ->with('user:id,name,username,avatar')
            ->get()
            ->map(function ($w) {
                return [
                    'id' => $w->id,
                    'uuid' => $w->uuid,
                    'title' => $w->wishname,
                    'amount' => $w->price,
                    'funded_percent' => $w->fullfill_amount > 0 ? round(($w->fullfill_amount / $w->price) * 100) : 0,
                    'image_url' => $w->thumbnail,
                    'type' => $w->category,
                    'user' => $w->user ? [
                        'name' => $w->user->name,
                        'username' => $w->user->username,
                        'avatar_url' => $w->user->avatar_url,
                    ] : null,
                ];
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
            ->get(['id', 'name', 'username', 'avatar', 'role'])
            ->map(function ($u) {
                return [
                    'type' => 'creator',
                    'text' => $u->name,
                    'subtext' => '@' . $u->username,
                    'image' => $u->avatar_url,
                    'url' => route('user.show', $u->username),
                    'verified' => $u->role === 1
                ];
            });

        $wishes = WishItem::query()
            ->where('is_approved', 1)
            ->where('wishname', 'like', $term)
            ->limit(5)
            ->get(['id', 'wishname', 'thumbnail', 'uuid'])
            ->map(function ($w) {
                return [
                    'type' => 'wish',
                    'text' => $w->wishname,
                    'subtext' => 'Wish',
                    'image' => $w->thumbnail ? (str_starts_with($w->thumbnail, 'http') ? $w->thumbnail : "https://ucarecdn.com/{$w->thumbnail}/-/preview/") : null,
                    'url' => null, // Wishes might just trigger a search or open a modal, for now let's just use the title for search
                    'search_term' => $w->wishname
                ];
            });

        return [
            'creators' => $users,
            'wishes' => $wishes
        ];
    }
}
