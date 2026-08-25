<?php

namespace App\Services;

use App\Helpers;
use App\Models\Bills;
use App\Models\Membership;
use App\Models\Shop;
use App\Models\Task;
use App\Models\User;
use App\Models\WishItem;
use App\Support\Badges;
use App\Support\MediaUrl;
use App\Support\VerifiedBadge;
use Carbon\Carbon;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
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

    /**
     * The trending rail.
     *
     * ⚠️ This used to be `orderByDesc('id')` with a comment calling itself a
     * placeholder, and every card left with `clicks_24h => 0` hardcoded — so the
     * "Trending Creators" rail was the newest creators, in registration order,
     * and the flame badge could never render. Ranking now runs on real signals
     * (see rankedCreatorIds / creatorScore).
     */
    public function getTrendingCreators($limit = 12)
    {
        return Cache::remember('trending_creators_v5_limit_'.$limit, 900, function () use ($limit) {
            $ranked = $this->rankedCreatorIds(['sortBy' => 'Trending']);

            return $this->creatorCardsByIds(array_slice($ranked['ids'], 0, $limit));
        });
    }

    public function getNewVerifiedCreators($limit = 12)
    {
        return Cache::remember('new_verified_creators_limit_'.$limit, 300, function () use ($limit) {
            $nowUtc = Carbon::now('UTC');

            $creators = User::query()
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
                ->get(['id', 'name', 'username', 'avatar', 'avatar_approved', 'avatar_cdn_modifier', 'cover', 'cover_approved', 'cover_cdn_modifier', 'profile_status_lock', 'identity_status', 'identity_admin_status', 'stripe_details_submitted', 'suspended_account', 'is_founder', 'role', 'bio', 'bio_approved', 'vat_amount_percentage'])
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
                        // The card shows a fee-inclusive "from" price to a
                        // logged-out visitor, exactly as the item cards do —
                        // which needs the creator's VAT rate, not just the price.
                        'vat_amount_percentage' => $u->vat_amount_percentage ?? 0,
                        'top_wishes' => $u->wishes->map(fn ($w) => $w->thumbnail),
                        // Card thumbnails of what this creator actually sells.
                        // `perma_link` is the PUBLIC card image — never
                        // `content_file_url`/`reward_url`, which are the paid
                        // content itself and are signed for a buyer.
                        'top_wish_images' => $u->wishes->map(fn ($w) => $w->perma_link)->filter()->values(),
                        'intro' => $u->intro ? [
                            'poster_url' => $u->intro->posterUrlNonBlocking(),
                            'perma_link' => $u->intro->perma_link,
                            'approved' => (int) $u->intro->approved,
                        ] : null,
                    ];
                });

            return $this->withCreatorMeta($creators);
        });
    }

    /**
     * Creator results for the grid.
     *
     * Order, price band and unlock type are all decided by rankedCreatorIds, so
     * the count in the heading, the filter chips and the rows on the page can
     * never disagree. Paging slices the ranked ids rather than re-sorting a SQL
     * page, which is what made "Trending" mean "highest id" before.
     */
    public function getSearchCreators($filters, $limit = 24)
    {
        $page = isset($filters['page']) ? max(1, (int) $filters['page']) : 1;
        $offset = ($page - 1) * $limit;

        $ranked = $this->rankedCreatorIds($filters);

        return $this->creatorCardsByIds(array_slice($ranked['ids'], $offset, $limit));
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

        if (! $this->applySharedListingFilters($query, $filters, 'wish_items')) {
            return collect();
        }

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

        $cacheKey = 'top_earners_v5_'.($period ?: 'all_time').'_limit_'.$limit;

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
            /*
             * 🚨 THIS WAS NOT A LEADERBOARD. The query took the first N public
             * creators with `limit($limit)` BEFORE any ordering, never looked at
             * a single payment, and stamped `total_amount => 0` on each — so
             * "Top Earners This Week" was an arbitrary handful of accounts, on
             * Discover AND on the homepage, which still calls this.
             *
             * Ranking now comes from the canonical ledger: completed income,
             * summed in GBP over the window. ⚠️ `gbp_amount` is the converted
             * figure stored at transaction time — never re-converted here, so a
             * later rate move cannot rewrite last week's table.
             *
             * ⚠️ `total_amount` STAYS 0. What a creator earned is not public;
             * only the ORDER is. Do not "finish" this by exposing the sum.
             */
            $ledger = DB::table('financial_transactions')
                ->where('type', 'income')
                ->where('status', 'completed')
                ->whereNull('deleted_at');

            if ($startUtc && $endUtc) {
                $ledger->whereBetween('transaction_date', [$startUtc, $endUtc]);
            }

            $ranked = $ledger->groupBy('user_id')
                ->orderByDesc(DB::raw('SUM(gbp_amount)'))
                ->limit($limit)
                ->pluck('user_id')
                ->map(fn ($id) => (int) $id)
                ->all();

            if (empty($ranked)) {
                return ['data' => collect(), 'label' => $label];
            }

            $position = array_flip($ranked);

            $earners = User::query()
                ->whereIn('id', $ranked)
                ->where('stripe_details_submitted', 1)
                ->where('suspended_account', 0)
                ->where('role', 1)
                ->where('profile_status_lock', 2)
                ->with(['wishes' => function ($q) {
                    $q->where('is_approved', 1)->limit(3)->select('id', 'user_id', 'thumbnail');
                }])
                ->get(['id', 'name', 'username', 'avatar', 'avatar_approved', 'avatar_cdn_modifier', 'cover', 'cover_approved', 'cover_cdn_modifier', 'profile_status_lock', 'identity_status', 'identity_admin_status', 'stripe_details_submitted', 'suspended_account', 'is_founder', 'role', 'bio', 'bio_approved', 'default_currency', 'vat_amount_percentage'])
                ->sortBy(fn ($u) => $position[(int) $u->id] ?? PHP_INT_MAX)
                ->values()
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
                        'vat_amount_percentage' => $u->vat_amount_percentage ?? 0,
                        'top_wishes' => $u->wishes->map(fn ($w) => $w->thumbnail),
                        'top_wish_images' => $u->wishes->map(fn ($w) => $w->perma_link)->filter()->values(),
                        'total_amount' => 0, // Deliberately never public — see above.
                        'currency' => strtoupper($u->default_currency ?? 'GBP'),
                    ];
                });

            $earners = $this->withCreatorMeta($earners);

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

    /**
     * Search-box suggestions: people, and things to buy.
     *
     * ⚠️ The wish half was written and left COMMENTED OUT, so the dropdown could
     * only ever answer "which creator" — while half the searches on a shop front
     * are for a THING. An item suggestion goes straight to that item's own
     * checkout on the creator's profile (`?item={uuid}`), not to a search.
     *
     * ⚠️ Only public creators and approved, unsuspended, published listings —
     * this is a public, unauthenticated endpoint.
     */
    public function getSuggestions($term)
    {
        $term = trim((string) $term);
        if ($term === '' || mb_strlen($term) < 2) {
            return ['creators' => [], 'items' => []];
        }

        $like = '%'.$term.'%';

        $users = User::query()
            ->where('suspended_account', 0)
            ->where(function ($q) {
                $q->where(function ($q2) {
                    $q2->where('role', 1)->where('profile_status_lock', 2);
                })->orWhere('role', 0);
            })
            ->where(function ($q) use ($like) {
                $q->where('name', 'like', $like)
                    ->orWhere('username', 'like', $like);
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
            })
            ->values();

        $source = collect($this->listingSources())->firstWhere('table', 'wish_items');
        $owners = [];

        // ⚠️ listingQuery()'s guards are written unqualified (`deleted_at`,
        // `is_suspended`, `publish_at`), so joining users makes every one of them
        // ambiguous — 1052, a 500 on a public endpoint. The owner filter is a
        // subquery instead of a join.
        $items = $this->listingQuery($source)
            ->whereIn('wish_items.user_id', User::query()
                ->where('suspended_account', 0)
                ->where('profile_status_lock', 2)
                ->select('id'))
            ->where('wish_items.wishname', 'like', $like)
            ->orderBy('wish_items.price')
            ->limit(5)
            ->get([
                'wish_items.id',
                'wish_items.uuid',
                'wish_items.wishname',
                'wish_items.thumbnail',
                'wish_items.price',
                'wish_items.currency',
                'wish_items.user_id',
            ])
            ->pipe(function ($rows) use (&$owners) {
                $owners = User::query()
                    ->whereIn('id', $rows->pluck('user_id')->unique()->all())
                    ->pluck('username', 'id')
                    ->toArray();

                return $rows;
            })
            ->map(function ($row) use (&$owners) {
                $username = $owners[$row->user_id] ?? null;
                if (! $username) {
                    return null;
                }

                return [
                    'id' => $row->id,
                    'text' => $row->wishname,
                    'subtext' => '@'.$username,
                    'image' => $this->publicThumbUrl($row->thumbnail),
                    // Straight to the item's own checkout, never back into a search.
                    'href' => '/'.$username.'/wishes?item='.$row->uuid,
                    'type' => 'wish',
                ];
            })
            ->filter()
            ->values();

        return ['creators' => $users, 'items' => $items, 'wishes' => []];
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

        $page = isset($filters['page']) ? max(1, (int) $filters['page']) : 1;
        $offset = ($page - 1) * $limit;

        if (! $this->applySharedListingFilters($query, $filters, 'bills')) {
            return collect();
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

        return $query->offset($offset)->limit($limit)
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

        $page = isset($filters['page']) ? max(1, (int) $filters['page']) : 1;
        $offset = ($page - 1) * $limit;

        if (! $this->applySharedListingFilters($query, $filters, 'memberships')) {
            return collect();
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

        return $query->offset($offset)->limit($limit)
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

        $page = isset($filters['page']) ? max(1, (int) $filters['page']) : 1;
        $offset = ($page - 1) * $limit;

        if (! $this->applySharedListingFilters($query, $filters, 'tasks')) {
            return collect();
        }

        $sort = $filters['sortBy'] ?? 'Trending';
        if ($sort === 'New') {
            $query->orderByDesc('created_at');
        } elseif ($sort === 'Trending') {
            $query->orderByDesc('id'); // Can enhance with task-specific trending metrics later
        } else {
            $query->orderByDesc('id');
        }

        return $query->offset($offset)->limit($limit)
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
            ->whereHas('user', function ($q) {
                $q->where('suspended_account', 0)
                    ->where('profile_status_lock', 2);
            });

        /*
         * 🚨 `shops.status` IS ABSENT FROM A DATABASE BUILT FROM THIS REPO'S
         * MIGRATIONS — every deployed database has it, none of the migrations
         * declare it, and the rest of the app guards on Schema::hasColumn for
         * exactly that reason. This call site did not, so shop discovery threw
         * "table shops has no column named status" on any fresh database, which
         * is why the shop paths had no feature test: they could not run.
         */
        if (Schema::hasColumn('shops', 'status')) {
            $query->where('status', 1);
        }

        if (! empty($filters['search'])) {
            $query->where(function ($q) use ($filters) {
                $q->where('name', 'like', '%'.$filters['search'].'%')
                    ->orWhere('description', 'like', '%'.$filters['search'].'%');
            });
        }

        $page = isset($filters['page']) ? max(1, (int) $filters['page']) : 1;
        $offset = ($page - 1) * $limit;

        if (! $this->applySharedListingFilters($query, $filters, 'shops')) {
            return collect();
        }

        $sort = $filters['sortBy'] ?? 'Trending';
        if ($sort === 'New') {
            $query->orderByDesc('created_at');
        } elseif ($sort === 'Trending') {
            $query->orderByDesc('id'); // Can enhance with shop-specific trending metrics later
        } else {
            $query->orderByDesc('id');
        }

        return $query->offset($offset)->limit($limit)
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
     * The four price bands a supporter actually shops in, in GBP-equivalent.
     * Kept here (not in the page) so the chip label, the filter query and the
     * count that predicts it can never drift apart.
     */
    public const PRICE_BANDS = [
        'under10' => ['label' => 'Under £10', 'min' => 0.0, 'max' => 10.0],
        '10to25' => ['label' => '£10 – £25', 'min' => 10.0, 'max' => 25.0],
        '25to50' => ['label' => '£25 – £50', 'min' => 25.0, 'max' => 50.0],
        'over50' => ['label' => '£50+', 'min' => 50.0, 'max' => null],
    ];

    /**
     * What a purchase gives you, in the supporter's terms rather than ours.
     * `instant` = buy once, unlocks now · `monthly` = a recurring content
     * subscription · `custom` = the creator makes something for you.
     */
    public const UNLOCK_TYPES = [
        'instant' => 'Instant unlock',
        'monthly' => 'Monthly',
        'custom' => 'Made for you',
    ];

    /**
     * Every sellable listing table, with the columns that differ between them.
     * 🚨 `tasks` keys its owner on `creator_id`, not `user_id` — the same trap
     * the moderation job hit. Read the owner column from here, never assume.
     */
    private function listingSources(): array
    {
        return [
            ['table' => 'wish_items', 'owner' => 'user_id', 'approval' => 'is_approved', 'unlock' => 'instant'],
            ['table' => 'shops', 'owner' => 'user_id', 'approval' => 'approved', 'unlock' => 'instant'],
            ['table' => 'bills', 'owner' => 'user_id', 'approval' => 'approved', 'unlock' => 'monthly'],
            ['table' => 'memberships', 'owner' => 'user_id', 'approval' => 'approved', 'unlock' => 'monthly'],
            ['table' => 'tasks', 'owner' => 'creator_id', 'approval' => 'is_approved', 'unlock' => 'custom'],
        ];
    }

    /**
     * A published, approved, unsuspended listing — the same definition on every
     * table, so a creator's cheapest listing and the grid they appear in agree.
     */
    private function listingQuery(array $source)
    {
        $q = DB::table($source['table'])->where($source['approval'], 1);

        if (Schema::hasColumn($source['table'], 'deleted_at')) {
            $q->whereNull('deleted_at');
        }
        if (Schema::hasColumn($source['table'], 'is_suspended')) {
            $q->where(function ($w) {
                $w->where('is_suspended', 0)->orWhereNull('is_suspended');
            });
        }
        if (Schema::hasColumn($source['table'], 'publish_at')) {
            $q->where(function ($w) {
                $w->whereNull('publish_at')->orWhere('publish_at', '<=', Carbon::now('UTC'));
            });
        }

        return $q;
    }

    /**
     * The interests worth offering as filters — the badges creators here
     * actually wear, most-used first.
     *
     * 🚨 THE TAXONOMY ALREADY EXISTED. `App\Support\Badges` defines it,
     * `users.creator_category` stores it, and the profile editor writes it — so
     * Discover reads that rather than growing a second, competing list of
     * categories nobody would keep in step. (`user_categories` is NOT this: that
     * table is a creator's own free-text grouping of their wishes.)
     */
    public function interestFacets(int $limit = 12): array
    {
        return Cache::remember('discover_interest_facets_v1_'.$limit, 900, function () use ($limit) {
            $rows = User::query()
                ->where('role', 1)
                ->where('suspended_account', 0)
                ->where('profile_status_lock', 2)
                ->whereNotNull('creator_category')
                ->pluck('creator_category');

            $counts = [];
            foreach ($rows as $value) {
                // ⚠️ sanitiseInterests takes the column in EITHER shape — older
                // rows hold labels ("Video Creator"), newer ones slugs — and
                // drops anything no longer on the list.
                foreach (Badges::sanitiseInterests($value) as $slug) {
                    $counts[$slug] = ($counts[$slug] ?? 0) + 1;
                }
            }

            arsort($counts);
            $all = Badges::interests();

            $out = [];
            foreach (array_slice($counts, 0, $limit, true) as $slug => $count) {
                if (! isset($all[$slug])) {
                    continue;
                }
                $out[] = [
                    'slug' => $slug,
                    'label' => $all[$slug]['label'] ?? $slug,
                    'emoji' => $all[$slug]['emoji'] ?? null,
                    'count' => $count,
                ];
            }

            return $out;
        });
    }

    /**
     * Ids of listings whose price falls inside a GBP-equivalent band.
     *
     * ⚠️ The band is stated in pounds but a listing carries its own currency, so
     * a raw `BETWEEN` on the price column would put a €12 listing in the "under
     * £10" chip. Conversion happens per row, then the band becomes an id set —
     * which keeps paging correct AND keeps the grid identical to the count that
     * predicted it.
     */
    private function listingIdsInBand(array $source, array $bandConf, int $cap = 2000): array
    {
        $cacheKey = 'discover_band_ids_v1_'.$source['table'].'_'.md5(json_encode($bandConf));

        return Cache::remember($cacheKey, 300, function () use ($source, $bandConf, $cap) {
            return $this->listingQuery($source)
                ->limit($cap)
                ->get(['id', 'price', 'currency'])
                ->filter(function ($r) use ($bandConf) {
                    $gbp = (float) Helpers::priceFormat(strtoupper($r->currency ?: 'GBP'), (float) $r->price, 'GBP');
                    if ($gbp < $bandConf['min']) {
                        return false;
                    }

                    return $bandConf['max'] === null || $gbp <= $bandConf['max'];
                })
                ->pluck('id')
                ->map(fn ($i) => (int) $i)
                ->all();
        });
    }

    /**
     * Apply the shared Discover filters (price band, unlock type) to one listing
     * query. Returns false when the unlock filter rules this table out entirely,
     * so the caller skips the query instead of running a doomed one.
     */
    private function applySharedListingFilters($query, array $filters, string $table): bool
    {
        $source = collect($this->listingSources())->firstWhere('table', $table);
        if (! $source) {
            return true;
        }

        $unlock = $filters['unlock'] ?? null;
        if ($unlock && $unlock !== $source['unlock']) {
            return false;
        }

        $band = $filters['priceBand'] ?? null;
        if ($band && isset(self::PRICE_BANDS[$band])) {
            $ids = $this->listingIdsInBand($source, self::PRICE_BANDS[$band]);
            if (empty($ids)) {
                return false;
            }
            $query->whereIn($table.'.id', $ids);
        }

        return true;
    }

    /**
     * Per-creator sales meta for a Discover card: the cheapest thing they sell,
     * how many listings they have, how many purchases those listings have taken,
     * and which unlock shapes they offer.
     *
     * 🚨 `price_from` is the LISTED price in the listing's own currency — NOT
     * what a supporter pays. The card grosses it up with the same PriceFormat
     * helper every other price on the site uses. Never render this value raw:
     * a logged-out visitor is shown the fee-inclusive price everywhere else,
     * and a cheaper number on Discover than at checkout is the one price bug
     * that costs trust.
     *
     * @param  array<int>  $creatorIds
     * @return array<int, array>
     */
    public function creatorMeta(array $creatorIds): array
    {
        $creatorIds = array_values(array_unique(array_filter(array_map('intval', $creatorIds))));
        if (empty($creatorIds)) {
            return [];
        }

        sort($creatorIds);

        /*
         * ⚠️ CACHED PER CREATOR, NOT PER SET. The first version keyed on
         * md5(id list), so every distinct page, filter combination and rail
         * minted its own entry holding the SAME creators — a cache that grows
         * with the number of QUESTIONS asked rather than with the number of
         * creators, and misses on the next page of the same list. One key per
         * creator is reused by every surface that mentions them.
         */
        $cached = [];
        $missing = [];
        foreach ($creatorIds as $id) {
            $hit = Cache::get('discover_creator_meta_v2_'.$id);
            if ($hit !== null) {
                $cached[$id] = $hit;
            } else {
                $missing[] = $id;
            }
        }

        if (empty($missing)) {
            return $cached;
        }

        $computed = (function () use ($missing) {
            $creatorIds = $missing;
            $meta = [];
            foreach ($creatorIds as $id) {
                $meta[$id] = [
                    'price_from' => null,
                    'price_from_currency' => null,
                    'price_from_gbp' => null,
                    'items_count' => 0,
                    'supporter_count' => 0,
                    'unlock_types' => [],
                    'rising' => 0.0,
                ];
            }

            foreach ($this->listingSources() as $source) {
                // ⚠️ `tasks` carries neither `supporter_count` nor `rising_score`
                // — the four other listing tables do. Selecting them blindly is
                // a 1054 that takes the whole page down, so the columns are
                // probed rather than assumed (same reason as the owner column).
                $columns = [$source['owner'].' as owner_id', 'price', 'currency'];
                $hasSupporters = Schema::hasColumn($source['table'], 'supporter_count');
                $hasRising = Schema::hasColumn($source['table'], 'rising_score');
                if ($hasSupporters) {
                    $columns[] = 'supporter_count';
                }
                if ($hasRising) {
                    $columns[] = 'rising_score';
                }

                $rows = $this->listingQuery($source)
                    ->whereIn($source['owner'], $creatorIds)
                    ->get($columns);

                foreach ($rows as $row) {
                    $id = (int) $row->owner_id;
                    if (! isset($meta[$id])) {
                        continue;
                    }

                    $currency = strtoupper($row->currency ?: 'GBP');
                    $gbp = (float) Helpers::priceFormat($currency, (float) $row->price, 'GBP');

                    $meta[$id]['items_count']++;
                    $meta[$id]['supporter_count'] += $hasSupporters ? (int) ($row->supporter_count ?? 0) : 0;
                    $meta[$id]['rising'] += $hasRising ? (float) ($row->rising_score ?? 0) : 0.0;

                    if (! in_array($source['unlock'], $meta[$id]['unlock_types'], true)) {
                        $meta[$id]['unlock_types'][] = $source['unlock'];
                    }

                    // Cheapest is decided in GBP so a €/$ listing can't win the
                    // "from" slot just by being a bigger number in its own currency.
                    if ($meta[$id]['price_from_gbp'] === null || $gbp < $meta[$id]['price_from_gbp']) {
                        $meta[$id]['price_from_gbp'] = $gbp;
                        $meta[$id]['price_from'] = (float) $row->price;
                        $meta[$id]['price_from_currency'] = $currency;
                    }
                }
            }

            return $meta;
        })();

        foreach ($computed as $id => $row) {
            Cache::put('discover_creator_meta_v2_'.$id, $row, 900);
        }

        return $cached + $computed;
    }

    /**
     * Real 24-hour interest per creator, from the clicks Discover itself records
     * (`search_clicks`, written by trackSearchClick on every result card).
     *
     * ⚠️ This replaced a hardcoded `'clicks_24h' => 0` — the flame badge on the
     * trending rail could never appear, and "trending" was ordered by `id`.
     *
     * @param  array<int>  $creatorIds
     * @return array<int, int>
     */
    public function creatorClicks24h(array $creatorIds): array
    {
        $creatorIds = array_values(array_unique(array_filter(array_map('intval', $creatorIds))));
        if (empty($creatorIds)) {
            return [];
        }

        if (! Schema::hasTable('search_clicks')) {
            return [];
        }

        sort($creatorIds);

        return Cache::remember('discover_clicks24h_v1_'.md5(implode(',', $creatorIds)), 300, function () use ($creatorIds) {
            return DB::table('search_clicks')
                ->whereIn('creator_id', $creatorIds)
                ->where('created_at', '>=', Carbon::now('UTC')->subDay())
                ->groupBy('creator_id')
                ->pluck(DB::raw('count(*)'), 'creator_id')
                ->map(fn ($c) => (int) $c)
                ->toArray();
        });
    }

    /**
     * Views of a creator's LISTINGS in the last day, from `item_view_stats`.
     *
     * ⚠️ Why not profile visits: `site_visit_stats` aggregates by page TYPE, not
     * by creator, so "who was looked at" is not a question it can answer. Item
     * views can be attributed, and they are the better signal anyway — someone
     * opening a listing is closer to buying than someone landing on a profile.
     *
     * @param  array<int>  $creatorIds
     * @return array<int, int>
     */
    private function creatorItemViews(array $creatorIds, int $days = 1): array
    {
        if (empty($creatorIds) || ! Schema::hasTable('item_view_stats')) {
            return [];
        }

        sort($creatorIds);

        return Cache::remember('discover_item_views_v1_'.$days.'_'.md5(implode(',', $creatorIds)), 300, function () use ($creatorIds, $days) {
            // item_view_stats names the type in its own vocabulary; map it back
            // to the listing table so the row can be attributed to an owner.
            $tables = [
                'wish' => ['wish_items', 'user_id'],
                'shop' => ['shops', 'user_id'],
                'bill' => ['bills', 'user_id'],
                'membership' => ['memberships', 'user_id'],
                'task' => ['tasks', 'creator_id'],
            ];

            $rows = DB::table('item_view_stats')
                ->where('date', '>=', Carbon::now('UTC')->subDays($days)->toDateString())
                ->whereIn('item_type', array_keys($tables))
                ->get(['item_type', 'item_id', 'views']);

            $out = [];
            foreach ($rows->groupBy('item_type') as $type => $group) {
                [$table, $owner] = $tables[$type];
                $owners = DB::table($table)
                    ->whereIn('id', $group->pluck('item_id')->unique()->all())
                    ->whereIn($owner, $creatorIds)
                    ->pluck($owner, 'id')
                    ->toArray();

                foreach ($group as $row) {
                    $ownerId = $owners[$row->item_id] ?? null;
                    if (! $ownerId) {
                        continue;
                    }
                    $out[(int) $ownerId] = ($out[(int) $ownerId] ?? 0) + (int) $row->views;
                }
            }

            return $out;
        });
    }

    /**
     * How hot a creator is right now, from signals we already store.
     *
     * Clicks are weighted hardest because they are the freshest and the hardest
     * to fake with an old listing; purchases next, because a purchase is worth
     * more than a look; listing views count singly (a view is the cheapest thing
     * a person can do); the items' own `rising_score` last, since it is already
     * a smoothed number. Listing count only breaks ties — a creator with more
     * things for sale is more likely to have something a visitor wants.
     */
    private function creatorScore(array $meta, int $clicks, int $views = 0): float
    {
        return ($clicks * 4)
            + $views
            + (($meta['supporter_count'] ?? 0) * 3)
            + (float) ($meta['rising'] ?? 0)
            + min(($meta['items_count'] ?? 0), 10) * 0.5;
    }

    /**
     * Merge sales meta + live clicks onto an already-mapped creator payload.
     * Takes whatever shape the caller built and returns it with the card fields
     * added, so every creator card on Discover carries the same facts.
     */
    private function withCreatorMeta($creators)
    {
        $items = collect($creators);
        if ($items->isEmpty()) {
            return $items->values();
        }

        $ids = $items->pluck('id')->filter()->map(fn ($i) => (int) $i)->all();
        $meta = $this->creatorMeta($ids);
        $clicks = $this->creatorClicks24h($ids);

        return $items->map(function ($c) use ($meta, $clicks) {
            $id = (int) ($c['id'] ?? 0);
            $m = $meta[$id] ?? null;

            $c['price_from'] = $m['price_from'] ?? null;
            $c['price_from_currency'] = $m['price_from_currency'] ?? null;
            $c['items_count'] = $m['items_count'] ?? 0;
            $c['supporter_count'] = $m['supporter_count'] ?? 0;
            $c['unlock_types'] = $m['unlock_types'] ?? [];
            $c['clicks_24h'] = $clicks[$id] ?? 0;

            return $c;
        })->values();
    }

    /**
     * The public creator pool, ranked and filtered — the single place that
     * decides WHICH creators a Discover request is about and in WHAT order.
     *
     * Returns ids only, so the caller can page them and still know the real
     * total (the grid used to report "Showing N results" where N was the page
     * size, which is not a total by any reading).
     *
     * ⚠️ Ranking happens in PHP over a capped pool because the score mixes four
     * tables and a click log; the pool cap is what keeps that honest. On a
     * catalogue this size it is one cached pass, not a per-request sort.
     *
     * @return array{ids: array<int>, total: int}
     */
    public function rankedCreatorIds(array $filters, int $poolCap = 500): array
    {
        $search = trim((string) ($filters['search'] ?? ''));
        $sort = $filters['sortBy'] ?? 'Trending';
        $band = $filters['priceBand'] ?? null;
        $unlock = $filters['unlock'] ?? null;
        $interest = $filters['interest'] ?? null;

        $cacheKey = 'discover_ranked_creators_v2_'.md5(json_encode([$search, $sort, $band, $unlock, $interest, $poolCap]));

        return Cache::remember($cacheKey, 300, function () use ($search, $sort, $band, $unlock, $interest, $poolCap) {
            $query = User::query()->where('suspended_account', 0);

            if ($search === '') {
                $query->where('role', 1)->where('profile_status_lock', 2);
            } else {
                // A keyword search is someone looking for a person by name, so a
                // fan account still answers it — but a creator profile that is not
                // public must not, which is what this pairing protects.
                $query->where(function ($q) {
                    $q->where(function ($q2) {
                        $q2->where('role', 1)->where('profile_status_lock', 2);
                    })->orWhere('role', 0);
                });
            }

            if ($search !== '') {
                $term = '%'.$search.'%';
                $query->where(function ($q) use ($term) {
                    $q->where('name', 'like', $term)
                        ->orWhere('username', 'like', $term)
                        ->orWhere('bio', 'like', $term);
                });
            }

            /*
             * A keyword search needs the matched TEXT, not just the id: "nav"
             * has to put @naveen above someone whose bio happens to contain the
             * letters, and a plain LIKE cannot tell those apart. Browsing needs
             * no such thing, so it stays a pluck.
             */
            if ($interest) {
                /*
                 * ⚠️ Filtered in PHP, not with whereJsonContains: the column has
                 * held BOTH labels and slugs, so a JSON match on the slug would
                 * silently drop every creator who picked their badges before the
                 * slug migration. sanitiseInterests reads both.
                 */
                $withInterest = User::query()
                    ->whereIn('id', (clone $query)->limit($poolCap)->pluck('id'))
                    ->whereNotNull('creator_category')
                    ->pluck('creator_category', 'id')
                    ->filter(fn ($value) => in_array($interest, Badges::sanitiseInterests($value), true))
                    ->keys()
                    ->all();

                if (empty($withInterest)) {
                    return ['ids' => [], 'total' => 0];
                }

                $query->whereIn('id', $withInterest);
            }

            if ($search !== '') {
                $rows = $query->orderByDesc('id')->limit($poolCap)->get(['id', 'name', 'username', 'bio']);
                $relevance = [];
                foreach ($rows as $row) {
                    $relevance[(int) $row->id] = $this->searchRelevance($search, $row);
                }
                $ids = array_keys($relevance);
            } else {
                $relevance = [];
                $ids = $query->orderByDesc('id')->limit($poolCap)->pluck('id')->map(fn ($i) => (int) $i)->all();
            }

            if (empty($ids)) {
                return ['ids' => [], 'total' => 0];
            }

            $meta = $this->creatorMeta($ids);
            $clicks = $this->creatorClicks24h($ids);
            $views = $this->creatorItemViews($ids);

            // A price band or an unlock type is a question about what the creator
            // SELLS, so a creator with nothing matching drops out entirely rather
            // than showing up with a price the filter excluded.
            $bandConf = $band && isset(self::PRICE_BANDS[$band]) ? self::PRICE_BANDS[$band] : null;
            $ids = array_values(array_filter($ids, function ($id) use ($meta, $bandConf, $unlock, $search) {
                $m = $meta[$id] ?? null;
                if (! $m) {
                    return false;
                }
                // Browsing is shopping: a profile with nothing for sale is a dead
                // end, so it stays out of the grid. A NAMED search is different —
                // that visitor asked for a person, and answering "no results" for
                // an account that exists is the worse failure.
                if ($search === '' && ($m['items_count'] ?? 0) < 1) {
                    return false;
                }
                if ($unlock && ! in_array($unlock, $m['unlock_types'] ?? [], true)) {
                    return false;
                }
                if ($bandConf) {
                    $price = $m['price_from_gbp'];
                    if ($price === null || $price < $bandConf['min']) {
                        return false;
                    }
                    if ($bandConf['max'] !== null && $price > $bandConf['max']) {
                        return false;
                    }
                }

                return true;
            }));

            usort($ids, function ($a, $b) use ($meta, $clicks, $views, $sort, $relevance, $search) {
                /*
                 * 🚨 RELEVANCE WINS OVER EVERY OTHER SORT WHEN SOMEBODY TYPED
                 * SOMETHING. A person searching a name is not browsing: putting
                 * the trending creator above the account they actually named is
                 * the fastest way to look broken. Explicit price/new sorts still
                 * apply INSIDE equal relevance.
                 */
                if ($search !== '' && ($relevance[$a] ?? 0) !== ($relevance[$b] ?? 0)) {
                    return ($relevance[$b] ?? 0) <=> ($relevance[$a] ?? 0);
                }

                switch ($sort) {
                    case 'New':
                        return $b <=> $a; // id order is creation order
                    case 'Price: Low to High':
                        return ($meta[$a]['price_from_gbp'] ?? PHP_FLOAT_MAX) <=> ($meta[$b]['price_from_gbp'] ?? PHP_FLOAT_MAX);
                    case 'Price: High to Low':
                        return ($meta[$b]['price_from_gbp'] ?? -1) <=> ($meta[$a]['price_from_gbp'] ?? -1);
                    case 'Most Supported':
                        return ($meta[$b]['supporter_count'] ?? 0) <=> ($meta[$a]['supporter_count'] ?? 0);
                    default:
                        $sa = $this->creatorScore($meta[$a] ?? [], $clicks[$a] ?? 0, $views[$a] ?? 0);
                        $sb = $this->creatorScore($meta[$b] ?? [], $clicks[$b] ?? 0, $views[$b] ?? 0);

                        return $sb <=> $sa ?: $b <=> $a;
                }
            });

            return ['ids' => $ids, 'total' => count($ids)];
        });
    }

    /**
     * How well one account answers a typed search.
     *
     * ⚠️ Ordered by how sure the match is, not by which column it came from: an
     * exact handle is the only certainty there is, a prefix is a strong guess,
     * and a bio hit is barely evidence at all — it is the difference between
     * "this is who I meant" and "these letters appear on the page".
     */
    private function searchRelevance(string $term, $row): int
    {
        $term = mb_strtolower(trim($term));
        $username = mb_strtolower((string) ($row->username ?? ''));
        $name = mb_strtolower((string) ($row->name ?? ''));
        $bio = mb_strtolower((string) ($row->bio ?? ''));

        if ($username === $term || $name === $term) {
            return 100;
        }
        if (str_starts_with($username, $term)) {
            return 80;
        }
        if (str_starts_with($name, $term)) {
            return 70;
        }
        // A word boundary inside the name ("test" in "Creator Test 2") beats a
        // match that lands mid-word.
        if (preg_match('/\b'.preg_quote($term, '/').'/u', $name)) {
            return 60;
        }
        if (str_contains($username, $term) || str_contains($name, $term)) {
            return 40;
        }
        if (str_contains($bio, $term)) {
            return 10;
        }

        return 0;
    }

    /**
     * Hydrate creator cards for an ordered id list, preserving that order.
     * MySQL returns rows in its own order, so the ranking is re-applied after
     * the fetch — without this the "trending" sort silently becomes id order.
     */
    private function creatorCardsByIds(array $ids)
    {
        if (empty($ids)) {
            return collect();
        }

        $position = array_flip($ids);

        $creators = User::query()
            ->whereIn('id', $ids)
            ->with(['wishes' => function ($q) {
                $q->where('is_approved', 1)->limit(3)->select('id', 'user_id', 'thumbnail');
            }, 'intro'])
            ->get(['id', 'name', 'username', 'avatar', 'avatar_approved', 'avatar_cdn_modifier', 'cover', 'cover_approved', 'cover_cdn_modifier', 'profile_status_lock', 'identity_status', 'identity_admin_status', 'stripe_details_submitted', 'suspended_account', 'is_founder', 'role', 'bio', 'bio_approved', 'vat_amount_percentage'])
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
                    // Card thumbnails of what this creator actually sells — the
                    // grid tile shows the goods, not a cover photo. `perma_link`
                    // is the PUBLIC image; never the signed reward/content file.
                    'top_wish_images' => $u->wishes->map(fn ($w) => $w->perma_link)->filter()->values(),
                    'intro' => $u->intro ? [
                        'poster_url' => $u->intro->posterUrlNonBlocking(),
                        'perma_link' => $u->intro->perma_link,
                        'approved' => (int) $u->intro->approved,
                    ] : null,
                ];
            })
            ->sortBy(fn ($c) => $position[(int) $c['id']] ?? PHP_INT_MAX)
            ->values();

        return $this->withCreatorMeta($creators);
    }

    /**
     * Real result totals for the current filters, per content type.
     *
     * 🚨 The grid's "Showing N results" heading used to count the rows on the
     * page, so page 2 of 40 wishes read "Showing 24 results" twice. A supporter
     * cannot tell how much is left to look at from a number that never grows.
     */
    public function getSearchCounts(array $filters): array
    {
        $cacheKey = 'discover_counts_v1_'.md5(json_encode(array_intersect_key($filters, array_flip([
            'search', 'contentType', 'sortBy', 'type', 'priceBand', 'unlock', 'categories',
        ]))));

        return Cache::remember($cacheKey, 300, function () use ($filters) {
            $search = trim((string) ($filters['search'] ?? ''));
            $band = $filters['priceBand'] ?? null;
            $bandConf = $band && isset(self::PRICE_BANDS[$band]) ? self::PRICE_BANDS[$band] : null;
            $unlock = $filters['unlock'] ?? null;

            $counts = ['creators' => $this->rankedCreatorIds($filters)['total']];

            $nameColumns = [
                'wish_items' => 'wishname',
                'shops' => 'name',
                'bills' => 'name',
                'memberships' => 'level',
                'tasks' => 'title',
            ];
            $keys = [
                'wish_items' => 'wishes',
                'shops' => 'shops',
                'bills' => 'bills',
                'memberships' => 'memberships',
                'tasks' => 'tasks',
            ];

            foreach ($this->listingSources() as $source) {
                $key = $keys[$source['table']];

                if ($unlock && $unlock !== $source['unlock']) {
                    $counts[$key] = 0;

                    continue;
                }

                $q = $this->listingQuery($source);

                if ($search !== '') {
                    $q->where($nameColumns[$source['table']], 'like', '%'.$search.'%');
                }

                // Bands are GBP-equivalent, and a listing carries its own
                // currency, so the band is applied after conversion rather than
                // as a raw SQL BETWEEN on mixed currencies.
                if ($bandConf) {
                    $rows = $q->get(['price', 'currency']);
                    $counts[$key] = $rows->filter(function ($r) use ($bandConf) {
                        $gbp = (float) Helpers::priceFormat(strtoupper($r->currency ?: 'GBP'), (float) $r->price, 'GBP');
                        if ($gbp < $bandConf['min']) {
                            return false;
                        }

                        return $bandConf['max'] === null || $gbp <= $bandConf['max'];
                    })->count();
                } else {
                    $counts[$key] = $q->count();
                }
            }

            return $counts;
        });
    }

    /**
     * What people have actually bought here lately — the page's only piece of
     * proof that does not need the visitor to do anything first.
     *
     * 🚨 THE BUYER IS NEVER IN THE OUTPUT. Not their name, not their initials,
     * not their id, not the amount they paid. A supporter's purchase is between
     * them and the creator; the only public facts here are the creator (whose
     * profile is public anyway) and what was bought.
     *
     * ⚠️ Reads `deliverables`, not the seven payment tables — every paid feature
     * creates exactly one, which is the only place where "a purchase happened"
     * is written once per purchase rather than once per payment row.
     *
     * ⚠️ 30-day window, and an empty result renders NOTHING. A ticker padded out
     * with month-old activity reads as a dead site to anyone who checks the
     * timestamps, which is worse than no ticker.
     */
    public function recentUnlocks(int $limit = 12): array
    {
        if (! Schema::hasTable('deliverables')) {
            return [];
        }

        return Cache::remember('discover_recent_unlocks_v1_'.$limit, 60, function () use ($limit) {
            /*
             * product_type → where the title lives, and what the buyer got.
             * `mandatory_platform_access` is deliberately absent: it is a
             * platform charge, not something a creator sold.
             */
            $sources = [
                'wish' => ['table' => 'wish_items', 'title' => 'wishname', 'owner' => 'user_id', 'unlock' => 'instant'],
                'wish_one_off' => ['table' => 'wish_items', 'title' => 'wishname', 'owner' => 'user_id', 'unlock' => 'instant'],
                'shop_item' => ['table' => 'shops', 'title' => 'name', 'owner' => 'user_id', 'unlock' => 'instant'],
                'piggy_pot' => ['table' => 'piggy_pots', 'title' => 'title', 'owner' => 'user_id', 'unlock' => 'instant'],
                'bill' => ['table' => 'bills', 'title' => 'name', 'owner' => 'user_id', 'unlock' => 'monthly'],
                'membership' => ['table' => 'memberships', 'title' => 'level', 'owner' => 'user_id', 'unlock' => 'monthly'],
                'task' => ['table' => 'tasks', 'title' => 'title', 'owner' => 'creator_id', 'unlock' => 'custom'],
            ];

            $rows = DB::table('deliverables')
                ->whereIn('product_type', array_keys($sources))
                ->where('created_at', '>=', Carbon::now('UTC')->subDays(30))
                ->orderByDesc('created_at')
                ->limit($limit * 6)
                ->get(['product_type', 'item_id', 'creator_id', 'created_at']);

            if ($rows->isEmpty()) {
                return [];
            }

            // Titles, one query per table rather than one per row.
            $titles = [];
            foreach ($rows->groupBy('product_type') as $type => $group) {
                $source = $sources[$type];
                $titles[$type] = DB::table($source['table'])
                    ->whereIn('id', $group->pluck('item_id')->unique()->all())
                    ->pluck($source['title'], 'id')
                    ->toArray();
            }

            // Only public creators — a ticker must never advertise a profile a
            // visitor cannot open.
            $creators = User::query()
                ->whereIn('id', $rows->pluck('creator_id')->filter()->unique()->all())
                ->where('suspended_account', 0)
                ->where('profile_status_lock', 2)
                ->pluck('username', 'id')
                ->toArray();

            $out = [];
            $lastKey = null;
            foreach ($rows as $row) {
                $username = $creators[$row->creator_id] ?? null;
                $title = $titles[$row->product_type][$row->item_id] ?? null;
                if (! $username || ! $title) {
                    continue;
                }

                // The same item bought three times in a minute is one line, not
                // three — a repeated row reads as a bug, not as popularity.
                $key = $row->product_type.':'.$row->item_id;
                if ($key === $lastKey) {
                    continue;
                }
                $lastKey = $key;

                $out[] = [
                    'title' => mb_strimwidth((string) $title, 0, 42, '…'),
                    'username' => $username,
                    'unlock' => $sources[$row->product_type]['unlock'],
                    'at' => Carbon::parse($row->created_at, 'UTC')->toIso8601String(),
                ];

                if (count($out) >= $limit) {
                    break;
                }
            }

            return $out;
        });
    }

    /**
     * Everything one creator sells, cheapest first — the payload behind the
     * card's quick view.
     *
     * 🚨 IT LINKS TO THE EXISTING BUY PATH, IT DOES NOT BUILD ONE. Each row
     * carries a deep link that opens the item's own checkout on the profile
     * (`?item={uuid}`, the parameter the profile controller already reads) or,
     * for a task, its own page. Nothing here computes a charge, a fee or a
     * total — those live in the payment flow and must keep living there.
     *
     * 🚨 Prices are LISTED prices. The modal grosses them up with the same
     * PriceFormat helper as every other price a buyer sees.
     */
    public function creatorPreview(string $username, int $limit = 8): array
    {
        $creator = User::query()
            ->where('username', $username)
            ->where('suspended_account', 0)
            ->where('profile_status_lock', 2)
            ->first(['id', 'name', 'username', 'vat_amount_percentage']);

        if (! $creator) {
            return [];
        }

        return Cache::remember('discover_creator_preview_v1_'.$creator->id.'_'.$limit, 300, function () use ($creator, $limit) {
            $titleColumns = [
                'wish_items' => 'wishname',
                'shops' => 'name',
                'bills' => 'name',
                'memberships' => 'level',
                'tasks' => 'title',
            ];
            $imageColumns = [
                'wish_items' => 'thumbnail',
                'shops' => 'image',
                'bills' => 'thumbnail',
                'memberships' => 'thumbnail',
                'tasks' => 'media_url',
            ];
            // Where a buyer completes this purchase today. ⚠️ `?item=` is read by
            // the profile controller and opens that item's own checkout modal.
            $hrefs = [
                'wish_items' => fn ($row) => '/'.$creator->username.'/wishes?item='.$row->uuid,
                'shops' => fn ($row) => '/'.$creator->username.'/shop?item='.$row->uuid,
                'bills' => fn ($row) => '/'.$creator->username.'/bills?item='.$row->uuid,
                'memberships' => fn ($row) => '/'.$creator->username.'/memberships?item='.$row->uuid,
                'tasks' => fn ($row) => '/task/'.$row->uuid,
            ];
            $labels = [
                'wish_items' => 'Instant unlock',
                'shops' => 'Buy direct',
                'bills' => 'Monthly content',
                'memberships' => 'Membership tier',
                'tasks' => 'Made for you',
            ];

            $items = [];
            foreach ($this->listingSources() as $source) {
                $table = $source['table'];

                $rows = $this->listingQuery($source)
                    ->where($source['owner'], $creator->id)
                    ->orderBy('price')
                    ->limit($limit)
                    ->get(['id', 'uuid', 'price', 'currency', $titleColumns[$table].' as title', $imageColumns[$table].' as image']);

                foreach ($rows as $row) {
                    $currency = strtoupper($row->currency ?: 'GBP');

                    $items[] = [
                        'id' => $table.'-'.$row->id,
                        'title' => (string) $row->title,
                        'label' => $labels[$table],
                        'unlock' => $source['unlock'],
                        'price' => (float) $row->price,
                        'currency' => $currency,
                        'price_gbp' => (float) Helpers::priceFormat($currency, (float) $row->price, 'GBP'),
                        'image' => $this->publicThumbUrl($row->image),
                        'href' => $hrefs[$table]($row),
                    ];
                }
            }

            usort($items, fn ($a, $b) => $a['price_gbp'] <=> $b['price_gbp']);

            return [
                'creator' => [
                    'id' => $creator->id,
                    'name' => $creator->name,
                    'username' => $creator->username,
                    'vat_amount_percentage' => $creator->vat_amount_percentage ?? 0,
                ],
                'items' => array_slice($items, 0, $limit),
            ];
        });
    }

    /**
     * A listing's PUBLIC card image.
     *
     * ⚠️ Uploadcare stores a bare uuid in some columns and a full URL in others,
     * so both shapes are handled. Never used for reward/content files — those
     * are the paid content and are signed per buyer.
     */
    private function publicThumbUrl(?string $value): ?string
    {
        if (empty($value)) {
            return null;
        }

        if (str_starts_with($value, 'http')) {
            return $value;
        }

        // ⚠️ Some columns hold a bare uuid, others hold a uuid WITH Uploadcare
        // modifiers already attached ("uuid/-/preview/"). Appending a second
        // set produced "/-/preview//-/preview/400x400/", which Uploadcare
        // serves at the wrong size. A value carrying a slash is passed through.
        if (str_contains($value, '/')) {
            return 'https://ucarecdn.com/'.ltrim($value, '/');
        }

        return 'https://ucarecdn.com/'.$value.'/-/preview/400x400/-/format/jpeg/-/quality/smart/';
    }

    /**
     * Creators this supporter already follows.
     *
     * 🚨 PERSONAL ROWS MUST NEVER ENTER THE SHARED PAGE CACHE. Discover's page
     * payload is cached per filter set and served to everyone; these are built
     * outside it, per request, for the signed-in user only.
     */
    public function followedCreators(int $userId, int $limit = 10)
    {
        if (! Schema::hasTable('follows')) {
            return collect();
        }

        $ids = DB::table('follows')
            ->where('follower_id', $userId)
            ->orderByDesc('created_at')
            ->limit($limit * 3)
            ->pluck('followed_id')
            ->map(fn ($i) => (int) $i)
            ->all();

        return $this->publicCreatorCards($ids, $limit);
    }

    /**
     * Creators this supporter has bought from before.
     *
     * ⚠️ Reads `deliverables` (one row per purchase) rather than the payment
     * tables, and only ever for the CURRENT user's own purchases.
     */
    public function supportedCreators(int $userId, int $limit = 10)
    {
        if (! Schema::hasTable('deliverables')) {
            return collect();
        }

        $ids = DB::table('deliverables')
            ->where('gifter_id', $userId)
            ->orderByDesc('created_at')
            ->limit($limit * 5)
            ->pluck('creator_id')
            ->map(fn ($i) => (int) $i)
            ->unique()
            ->values()
            ->all();

        return $this->publicCreatorCards($ids, $limit);
    }

    /**
     * Hydrate cards for an id list, dropping anyone who is not a public creator.
     *
     * ⚠️ `creatorCardsByIds` does not filter on visibility — it is fed by
     * `rankedCreatorIds`, which already did. A follow list has not, and a
     * supporter can easily follow an account that has since been suspended or
     * gone private.
     */
    private function publicCreatorCards(array $ids, int $limit)
    {
        $ids = array_values(array_unique(array_filter($ids)));
        if (empty($ids)) {
            return collect();
        }

        $position = array_flip($ids);

        $visible = User::query()
            ->whereIn('id', $ids)
            ->where('role', 1)
            ->where('suspended_account', 0)
            ->where('profile_status_lock', 2)
            ->pluck('id')
            ->map(fn ($i) => (int) $i)
            ->sortBy(fn ($id) => $position[$id] ?? PHP_INT_MAX)
            ->take($limit)
            ->values()
            ->all();

        return $this->creatorCardsByIds($visible);
    }

    /**
     * One feed of THINGS TO BUY, across every module.
     *
     * 🚨 DISCOVER WAS A DIRECTORY OF PEOPLE. Both the board and two of the three
     * rails listed creators, and a supporter does not buy a person — they buy a
     * thing a person made. The board leads with the goods now; creators are one
     * rail and the "People" chip.
     *
     * ⚠️ Each row carries the payload ITS OWN CARD already expects (the existing
     * getSearch* maps, untouched) plus a `mode`, so nothing here re-describes a
     * listing and no card had to be rewritten.
     *
     * ⚠️ Rows are ROUND-ROBINED across the modules, not concatenated. Ordering by
     * type would give the board six wishes and then six bills — a shop front
     * where the first screen is one department. Price sorts still sort globally,
     * because "cheapest first" that is only cheapest-within-type is a lie.
     */
    public function mixedFeed(array $filters, int $perType = 6)
    {
        $sort = $filters['sortBy'] ?? null;

        $groups = [
            'wish' => $this->getSearchWishes($filters, $perType),
            'shop' => $this->getSearchShops($filters, $perType),
            'bill' => $this->getSearchBills($filters, $perType),
            'membership' => $this->getSearchMemberships($filters, $perType),
            'task' => $this->getSearchTasks($filters, $perType),
        ];

        $rows = [];
        foreach ($groups as $mode => $items) {
            foreach (collect($items)->values() as $i => $item) {
                $rows[] = [
                    'mode' => $mode,
                    'slot' => $i,
                    'price_gbp' => $this->rowPriceGbp($item),
                    'item' => $item,
                ];
            }
        }

        if ($sort === 'Price: Low to High') {
            usort($rows, fn ($a, $b) => ($a['price_gbp'] ?? PHP_FLOAT_MAX) <=> ($b['price_gbp'] ?? PHP_FLOAT_MAX));
        } elseif ($sort === 'Price: High to Low') {
            usort($rows, fn ($a, $b) => ($b['price_gbp'] ?? -1) <=> ($a['price_gbp'] ?? -1));
        } else {
            /*
             * Round robin: one from each module, then the next from each.
             *
             * ⚠️ TASKS SORT LAST WHATEVER THE ROUND SAYS (client direction,
             * 24 Aug 2026). A task card is a full-width row — it is a brief, not
             * a product tile — so one landing mid-grid splits the board in half
             * and leaves the cards above it ragged. At the foot it reads as its
             * own section.
             */
            usort($rows, function ($a, $b) {
                $aLast = $a['mode'] === 'task' ? 1 : 0;
                $bLast = $b['mode'] === 'task' ? 1 : 0;

                return [$aLast, $a['slot'], $a['mode']] <=> [$bLast, $b['slot'], $b['mode']];
            });
        }

        return collect($rows)->map(fn ($r) => ['mode' => $r['mode'], 'item' => $r['item']])->values();
    }

    /**
     * A listing's price in GBP, whatever shape its card payload uses.
     * ⚠️ Returns null rather than 0 for a priceless row — 0 would sort a missing
     * price to the top of "cheapest first".
     */
    private function rowPriceGbp($item): ?float
    {
        $row = is_array($item) ? $item : (array) $item;
        $price = $row['price'] ?? $row['amount'] ?? null;
        if ($price === null || $price === '') {
            return null;
        }

        $currency = strtoupper($row['currency'] ?? 'GBP');

        return (float) Helpers::priceFormat($currency, (float) $price, 'GBP');
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
