<?php

namespace App\Http\Controllers\Auth;

use App\Helpers;
use App\Http\Controllers\Controller;
use App\Models\BillPayment;
use App\Models\Currency;
use App\Models\Deliverable;
use App\Models\FinancialTransaction;
use App\Models\Follow;
use App\Models\MembershipPayment;
use App\Models\PiggyPotContribution;
use App\Models\ShopPayment;
use App\Models\StripePaymentDetail;
use App\Models\StripePaymentItems;
use App\Models\TaskPurchase;
use App\Models\TipGoalsPayment;
use App\Models\User;
use App\Models\WishItemSubscription;
use App\Services\LeaderboardMovementService;
use App\Services\VipScoreService;
use App\Support\VerifiedBadge;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;

class LeaderBoardController extends Controller
{
    /**
     * ⚠️ BUMP THE SUFFIX whenever the shape of a cached row changes.
     *
     * The board is cached for up to two hours, so a payload that gains a field
     * keeps being served without it until the entry expires — and the frontend
     * silently falls back. Adding `verified_badge` did exactly that: every
     * creator on the leaderboard rendered the grey basic badge while their own
     * profile, which is not cached, showed pink.
     */
    public const BOARD_CACHE_KEY = 'leaderboard_board_v2_';

    public const BUNDLE_CACHE_KEY = 'leaderboard_bundle_v2';

    /** Every leaderboard period the platform offers, in display order. */
    public const PERIODS = ['daily', 'weekly', 'monthly', 'quarterly', 'annual', 'all'];

    private function ttlForType($type)
    {
        // Longer periods move more slowly, so they can be cached for longer.
        return match ($type) {
            'daily' => 600,
            'weekly' => 1200,
            'monthly' => 1800,
            'quarterly' => 3600,
            'annual' => 7200,
            'all' => 7200,
            default => 600,
        };
    }

    /**
     * The [from, to] window for a leaderboard period, or null for lifetime.
     *
     * Single definition, used by every source in a leaderboard query. `all` (and
     * anything unrecognised) means no date constraint — the lifetime board.
     *
     * @return array{0: Carbon, 1: Carbon}|null
     */
    public static function periodWindow(?string $type): ?array
    {
        $now = Carbon::now();

        return match ($type) {
            'daily' => [$now->copy()->startOfDay(), $now->copy()->endOfDay()],
            'weekly' => [$now->copy()->startOfWeek(), $now->copy()->endOfWeek()],
            'monthly' => [$now->copy()->startOfMonth(), $now->copy()->endOfMonth()],
            'quarterly' => [$now->copy()->startOfQuarter(), $now->copy()->endOfQuarter()],
            'annual' => [$now->copy()->startOfYear(), $now->copy()->endOfYear()],
            default => null,
        };
    }

    /**
     * The whole ranked board for a period, as lean arrays with rank resolved.
     *
     * Cached for EVERY visitor, not just guests. The board is identical for
     * everyone (rank and supporter count, no per-viewer figures), so skipping
     * the cache while signed in meant every authenticated page load recomputed
     * six aggregate subqueries across every creator and sorted them in PHP.
     *
     * @return array<int, array<string, mixed>>
     */
    private function rankedBoard(?string $type): array
    {
        $period = $type ?: 'all';
        $key = self::BOARD_CACHE_KEY.$period;

        $cached = Cache::get($key);
        if (is_array($cached) && $cached !== []) {
            return $cached;
        }

        $users = $this->calc($type);
        $total = max($users->count(), 1);

        $rows = [];
        $rank = 1;

        foreach ($users as $user) {
            $rows[] = [
                'id' => $user->id,
                'rank' => $rank,
                'name' => $user->name ?? '',
                'username' => $user->username ?? '',
                'profile_status_lock' => $user->profile_status_lockNone,
                'verified_badge' => VerifiedBadge::tierFor($user),
                'is_founder' => $user->is_founder ?? false,
                'role' => $user->role,
                'avatar' => $user->avatar_url,
                'coverimg' => $user->cover_url,
                'top' => round(($rank / $total) * 100, 2),
                'amount' => 0, // Privacy: the public board ranks reach, never revenue.
                'currency' => $user->currency ?? 'GBP',
                'supporters' => (int) ($user->total_supporters ?? 0),
                'engagement' => $user->engagement_score ?? 0,
            ];
            $rank++;
        }

        // An EMPTY board is never cached. `Cache::remember` stores whatever the
        // callback returns, so a single bad moment — a DB hiccup, a half-run
        // migration, a filter that briefly matched nothing — pinned "0 creators
        // ranked" on the page for the full TTL even though the query recovered
        // seconds later. A board with rows is worth caching; the absence of one
        // is a symptom, not a result.
        if ($rows !== []) {
            Cache::put($key, $rows, $this->ttlForType($period));
        }

        return $rows;
    }

    /**
     * Does the daily board have any activity worth offering as a tab?
     *
     * Its own short cache — this used to run a second FULL leaderboard
     * computation on every page load just to decide whether to render one
     * button.
     */
    private function dailyBoardHasActivity(): int
    {
        return Cache::remember('leaderboard_is_daily', $this->ttlForType('daily'), function () {
            return $this->calc('daily')->contains(fn ($user) => (float) ($user->total_amount ?? 0) > 0) ? 1 : 0;
        });
    }

    public function wishtenderWishers($type = null)
    {
        if (Auth::user() && Auth::user()->suspended_account == 1) {
            return Inertia::render('Suspanded');
        }

        // An unrecognised period used to fall through to the lifetime board —
        // harmless to read, but it also became a cache key, so any URL segment
        // could mint a new cached board.
        $period = in_array($type, self::PERIODS, true) ? $type : 'all';
        $board = $this->rankedBoard($period === 'all' ? null : $period);
        $search = trim((string) request()->get('q', ''));

        // Search runs over the WHOLE board, not the loaded page. The old
        // client-side filter could only see the rows already rendered, so it
        // reported "no creators found" for anyone further down the list.
        $matches = $search === ''
            ? $board
            : array_values(array_filter($board, function ($row) use ($search) {
                return stripos($row['name'] ?? '', $search) !== false
                    || stripos($row['username'] ?? '', $search) !== false;
            }));

        $perPage = 50;
        $page = max((int) request()->get('page', 1), 1);
        $paginator = new LengthAwarePaginator(
            array_slice($matches, ($page - 1) * $perPage, $perPage),
            count($matches),
            $perPage,
            $page,
            ['path' => request()->url(), 'query' => request()->query()]
        );

        $previousRanks = LeaderboardMovementService::previousRanks($period);

        $pageRows = $paginator->items();

        // Follow state is per-viewer, so it is resolved AFTER the shared cache —
        // one query for the whole page, never one per row.
        $following = [];
        if (Auth::check() && $pageRows) {
            $following = Follow::where('follower_id', Auth::id())
                ->whereIn('followed_id', array_column($pageRows, 'id'))
                ->pluck('followed_id')
                ->flip()
                ->all();
        }

        $data = [];
        foreach ($pageRows as $row) {
            $data[] = $row
                + LeaderboardMovementService::movementFor($row['id'], $row['rank'], $previousRanks)
                + ['is_following' => isset($following[$row['id']])];
        }

        if (request()->wantsJson()) {
            return response()->json([
                'success' => true,
                'data' => $data,
                'message' => 'Leaderboard loaded',
                'last_page' => $paginator->lastPage(),
                'current_page' => $paginator->currentPage(),
                'total' => $paginator->total(),
                'per_page' => $paginator->perPage(),
                'period' => $period,
                'you' => $this->viewerStanding($board, $previousRanks),
            ]);
        }

        return Inertia::render('leaderboard/Board', [
            'data' => $data,
            'is_daily' => $this->dailyBoardHasActivity(),
            'period' => $period,
            'total' => count($board),
            'last_page' => $paginator->lastPage(),
            'periods' => self::PERIODS,
            'you' => $this->viewerStanding($board, $previousRanks),
            'climbers' => LeaderboardMovementService::climbers($board, $period),
            'movement_window_days' => LeaderboardMovementService::lookbackDays($period),
            'opted_out' => (bool) (Auth::user()->leaderboard_opt_out ?? false),
        ]);
    }

    /**
     * The signed-in creator's own standing, resolved from the full board so it
     * is correct even when their row is 400 places down and never loaded.
     *
     * `to_next` is the supporter gap to the position above — the board ranks
     * reach, so the gap is stated in supporters and never in money.
     */
    private function viewerStanding(array $board, array $previousRanks): ?array
    {
        $userId = Auth::id();

        if (! $userId) {
            return null;
        }

        $index = null;
        foreach ($board as $i => $row) {
            if ((int) $row['id'] === (int) $userId) {
                $index = $i;
                break;
            }
        }

        if ($index === null) {
            return null;
        }

        $me = $board[$index];
        $above = $index > 0 ? $board[$index - 1] : null;

        return $me + LeaderboardMovementService::movementFor($me['id'], $me['rank'], $previousRanks) + [
            'total' => count($board),
            'next' => $above ? [
                'username' => $above['username'],
                'name' => $above['name'],
                'supporters_gap' => max(($above['supporters'] ?? 0) - ($me['supporters'] ?? 0), 0),
            ] : null,
        ];
    }

    /**
     * Every panel beside the main board, in one cached response.
     *
     * The page used to fire seven separate requests on load — one per widget —
     * and none of those endpoints were cached, so opening the leaderboard ran
     * seven heavy aggregate queries every time. Each section is resolved
     * independently: one panel failing costs that panel, not the page.
     */
    public function bundle()
    {
        $sections = [
            'category_leaders' => fn () => $this->categoryLeaders(),
            'vip_supporters' => fn () => $this->vipSupporters(),
            'growth_trends' => fn () => $this->growthTrends(),
            'platform_analytics' => fn () => $this->platformAnalytics(),
            'recent_supporters' => fn () => $this->recentGifters(),
            'stars' => fn () => $this->topGiftersAllTime(),
            'top_supporters' => fn () => $this->topSupportersByFrequency(),
        ];

        $payload = Cache::get(self::BUNDLE_CACHE_KEY);

        if (! is_array($payload)) {
            $payload = [];

            foreach ($sections as $key => $resolve) {
                try {
                    $payload[$key] = $resolve()->getData(true);
                } catch (\Throwable $e) {
                    Log::error('Leaderboard bundle section failed', [
                        'section' => $key,
                        'error' => $e->getMessage(),
                    ]);
                    $payload[$key] = null;
                }
            }

            // Same rule as the board: a payload where every section failed is a
            // symptom, not a result. Caching it would hold the whole sidebar
            // dead for the full TTL after the cause had already cleared.
            if (array_filter($payload) !== []) {
                Cache::put(self::BUNDLE_CACHE_KEY, $payload, 900);
            }
        }

        return response()->json(['success' => true] + $payload);
    }

    /**
     * A creator can leave the public board. Ranking someone publicly is not
     * something the platform gets to decide for them.
     */
    public function toggleOptOut(Request $request)
    {
        $user = Auth::user();

        if (! $user) {
            return response()->json(['success' => false, 'message' => 'Authentication required.'], 401);
        }

        $optOut = $request->boolean('opt_out');
        $user->forceFill(['leaderboard_opt_out' => $optOut])->save();

        // Their row has to appear or disappear now, not when the cache expires.
        foreach (self::PERIODS as $period) {
            Cache::forget(self::BOARD_CACHE_KEY.$period);
        }

        return response()->json([
            'success' => true,
            'opted_out' => $optOut,
            'message' => $optOut
                ? 'You have been removed from the public leaderboard.'
                : 'You are back on the public leaderboard.',
        ]);
    }

    public function calc($type)
    {
        // One window for the whole query. Every source below used to carry its
        // own copy of the same if/elseif date logic, so adding a period meant
        // editing seven places and getting all seven right.
        $window = self::periodWindow($type);

        $applyPeriod = function ($query, string $column) use ($window) {
            if ($window === null) {
                return; // lifetime — no date constraint at all
            }

            $query->whereBetween($column, $window);
        };

        $users = User::where('stripe_details_submitted', 1)
            ->where('suspended_account', 0)
            // Public ranking is opt-out — a creator who leaves disappears from
            // every board, not just the page they asked about.
            ->where(function ($query) {
                $query->where('leaderboard_opt_out', 0)
                    ->orWhereNull('leaderboard_opt_out');
            })
            ->withCount([
                'followers as total_supporters' => function ($query) use ($applyPeriod) {
                    $applyPeriod($query, 'follows.created_at');
                },
                'following as following_count',
            ])
            ->withCount([
                'paymentitems as total_payments' => function ($query) use ($applyPeriod) {
                    $query->select(DB::raw('COALESCE(SUM(amount), 0)'))
                        ->where('stripe_payment_details.payment_status', 'paid')
                        ->whereNotIn('stripe_payment_details.id', function ($q) {
                            $q->select('source_id')
                                ->from('financial_transactions')
                                ->where('source_type', StripePaymentDetail::class)
                                ->whereIn('status', ['refunded', 'disputed']);
                        });
                    $applyPeriod($query, 'stripe_payment_items.created_at');
                },
                'subscriptions as total_subscriptions' => function ($query) use ($applyPeriod) {
                    $query->select(DB::raw('COALESCE(SUM(amount), 0)'))
                        ->where('wish_item_subscriptions.status', 'paid')
                        ->whereNotIn('wish_item_subscriptions.id', function ($q) {
                            $q->select('source_id')
                                ->from('financial_transactions')
                                ->where('source_type', WishItemSubscription::class)
                                ->whereIn('status', ['refunded', 'disputed']);
                        });

                    $applyPeriod($query, 'wish_item_subscriptions.created_at');
                },
                'tip_goal_payment as total_tips' => function ($query) use ($applyPeriod) {
                    $query->select(DB::raw('COALESCE(SUM(amount), 0)'))
                        ->where('tip_goals_payments.status', 'paid')
                        ->whereNotIn('tip_goals_payments.id', function ($q) {
                            $q->select('source_id')
                                ->from('financial_transactions')
                                ->where('source_type', TipGoalsPayment::class)
                                ->whereIn('status', ['refunded', 'disputed']);
                        });

                    $applyPeriod($query, 'tip_goals_payments.created_at');
                },
                'membership_payments as total_member' => function ($query) use ($applyPeriod) {
                    $query->select(DB::raw('COALESCE(SUM(amount), 0)'))
                        ->where('membership_payments.status', 'paid')
                        ->whereNotIn('membership_payments.id', function ($q) {
                            $q->select('source_id')
                                ->from('financial_transactions')
                                ->where('source_type', MembershipPayment::class)
                                ->whereIn('status', ['refunded', 'disputed']);
                        });

                    $applyPeriod($query, 'membership_payments.created_at');
                },
                'bill_payments as total_bill' => function ($query) use ($applyPeriod) {
                    $query->select(DB::raw('COALESCE(SUM(amount), 0)'))
                        ->where('bill_payments.status', 'paid')
                        ->whereNotIn('bill_payments.id', function ($q) {
                            $q->select('source_id')
                                ->from('financial_transactions')
                                ->where('source_type', BillPayment::class)
                                ->whereIn('status', ['refunded', 'disputed']);
                        });

                    $applyPeriod($query, 'bill_payments.created_at');
                },
                'shop_payments as total_shop' => function ($query) use ($applyPeriod) {
                    $query->select(DB::raw('COALESCE(SUM(amount), 0)'))
                        ->where('shop_payments.payment_status', 'paid')
                        ->whereNotIn('shop_payments.id', function ($q) {
                            $q->select('source_id')
                                ->from('financial_transactions')
                                ->where('source_type', ShopPayment::class)
                                ->whereIn('status', ['refunded', 'disputed']);
                        });

                    $applyPeriod($query, 'shop_payments.created_at');
                },
            ])
            ->orderByDesc(DB::raw('total_payments + total_subscriptions + total_tips + total_member + total_bill + total_shop'))
            ->get(['id', 'name', 'username', 'avatar', 'avatar_approved', 'avatar_cdn_modifier', 'cover', 'cover_approved', 'cover_cdn_modifier', 'profile_status_lock', 'identity_status', 'identity_admin_status', 'stripe_details_submitted', 'suspended_account', 'is_founder', 'role', 'default_currency']);

        $users->map(function ($user) {
            // Calculate monetary metrics (for backward compatibility)
            $user->total_payments = $user->total_payments;
            $user->total_subscriptions = $user->total_subscriptions;
            $user->total_tips = $user->total_tips;
            $user->total_member = $user->total_member;
            $user->total_bill = $user->total_bill;
            $user->total_shop = $user->total_shop;

            // Calculate total monetary amount (legacy metric) with NaN protection
            $amounts = [
                $user->total_payments,
                $user->total_subscriptions,
                $user->total_tips,
                $user->total_member,
                $user->total_bill,
                $user->total_shop,
            ];

            // Filter out NaN values and ensure we have valid numbers
            $validAmounts = array_filter($amounts, function ($amount) {
                return is_numeric($amount) && ! is_nan($amount) && is_finite($amount);
            });

            $user->total_amount = array_sum($validAmounts);

            // ✅ Ensure we return a consistent currency code (uppercase)
            $user->currency = strtoupper($user->default_currency ?? 'GBP');

            // Calculate social engagement metrics
            $user->total_supporters = (int) ($user->total_supporters ?? 0);

            // Calculate engagement score based on followers and content
            $engagementScore = $user->total_supporters * 2; // 2 points per supporter

            // Add bonus for verified creators
            if ($user->profile_status_lock == 2) {
                $engagementScore *= 1.2; // 20% bonus for verified creators
            }

            $user->engagement_score = $engagementScore;

            // Combined score prioritizes engagement but includes monetary as fallback
            $user->combined_score = $user->engagement_score > 0 ? $user->engagement_score : $user->total_amount;
        });

        // Sort by combined score (engagement-first approach)
        $users = $users->sortByDesc('combined_score');

        return $users;
    }

    public function firstThreeWisher($type = null)
    {
        try {
            $currentMonth = Carbon::now()->month;
            $currentYear = Carbon::now()->year;
            $currentWeekStartDate = Carbon::now()->startOfWeek();
            $currentWeekEndDate = Carbon::now()->endOfWeek();
            $currentDate = Carbon::today();

            $users = User::where('stripe_details_submitted', 1)
                ->where('suspended_account', 0)
                ->with(['paymentitems', 'subscriptions', 'tip_goal_payment'])
                ->withCount([
                    'paymentitems as total_payments' => function ($query) use ($type, $currentMonth, $currentYear, $currentWeekStartDate, $currentWeekEndDate, $currentDate) {
                        $query->select(DB::raw('COALESCE(SUM(amount), 0)'));
                        if ($type == 'monthly') {
                            $query->whereYear('stripe_payment_items.created_at', '=', $currentYear)
                                ->whereMonth('stripe_payment_items.created_at', $currentMonth);
                        } elseif ($type == 'weekly') {
                            $query->whereBetween('stripe_payment_items.created_at', [$currentWeekStartDate, $currentWeekEndDate]);
                        } elseif ($type == 'daily') {
                            $query->where('stripe_payment_items.created_at', $currentDate);
                        }
                    },
                    'subscriptions as total_subscriptions' => function ($query) use ($type, $currentMonth, $currentYear, $currentWeekStartDate, $currentWeekEndDate, $currentDate) {
                        $query->select(DB::raw('COALESCE(SUM(amount), 0)'));

                        if ($type == 'monthly') {
                            $query->whereYear('wish_item_subscriptions.created_at', '=', $currentYear)
                                ->whereMonth('wish_item_subscriptions.created_at', $currentMonth);
                        } elseif ($type == 'weekly') {
                            $query->whereBetween('wish_item_subscriptions.created_at', [$currentWeekStartDate, $currentWeekEndDate]);
                        } elseif ($type == 'daily') {
                            $query->where('wish_item_subscriptions.created_at', $currentDate);
                        }
                    },
                    'tip_goal_payment as total_tips' => function ($query) use ($type, $currentMonth, $currentYear, $currentWeekStartDate, $currentWeekEndDate, $currentDate) {
                        $query->select(DB::raw('COALESCE(SUM(amount), 0)'));

                        if ($type == 'monthly') {
                            $query->whereYear('tip_goals_payments.created_at', '=', $currentYear)
                                ->whereMonth('tip_goals_payments.created_at', $currentMonth);
                        } elseif ($type == 'weekly') {
                            $query->whereBetween('tip_goals_payments.created_at', [$currentWeekStartDate, $currentWeekEndDate]);
                        } elseif ($type == 'daily') {
                            $query->where('tip_goals_payments.created_at', $currentDate);
                        }
                    },
                ])
                ->orderByDesc(DB::raw('total_payments + total_subscriptions + total_tips'))
                ->take(3)
                ->get(['id', 'name', 'username', 'avatar', 'avatar_approved', 'avatar_cdn_modifier', 'cover', 'cover_approved', 'cover_cdn_modifier', 'profile_status_lock', 'identity_status', 'identity_admin_status', 'stripe_details_submitted', 'suspended_account', 'is_founder', 'role']);

            $data = [];
            $rank = 1;
            foreach ($users as $query) {
                $data[] = [
                    'rank' => $rank,
                    'name' => $query->name ?? '',
                    'username' => $query->username ?? '',
                    'avatar' => $query->avatar_url,
                    'coverimg' => $query->cover_url,
                    'profile_status_lock' => $query->profile_status_lockNone,
                    'verified_badge' => VerifiedBadge::tierFor($query),
                    'is_founder' => $query->is_founder ?? false,
                    'role' => $query->role,
                    'top' => $rank / 100,
                ];
                $rank++;
            }

            if (empty($type)) {
                return Inertia::render('leaderboard/Board', [
                    'data' => $data,
                ]);
            }

            return response()->json([
                'success' => true,
                'data' => $data,
                'message' => 'Top supporters by frequency retrieved successfully',
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Something went wrong',
                'error' => $e->getMessage(),
            ]);
        }
    }

    /**
     * Platform Analytics - Returns platform-wide statistics and insights
     * This is a temporary stub until full implementation
     */
    public function platformAnalytics()
    {
        try {
            // Calculate real basic platform statistics
            $now = Carbon::now();
            $lastMonth = Carbon::now()->subMonth();

            $totalUsers = User::where('stripe_details_submitted', 1)
                ->where('suspended_account', 0)
                ->count();

            $totalUsersLastMonth = User::where('stripe_details_submitted', 1)
                ->where('suspended_account', 0)
                ->where('created_at', '<', $now->startOfMonth())
                ->count();

            $activeCreators = User::where('stripe_details_submitted', 1)
                ->where('suspended_account', 0)
                ->whereHas('paymentitems')
                ->count();

            $totalSupporters = User::whereHas('paymentitems', function ($q) {
                $q->whereHas('payment', function ($query) {
                    $query->where('payment_status', 'paid');
                });
            })->count();

            $totalSupportersLastMonth = User::whereHas('paymentitems', function ($q) use ($now) {
                $q->whereHas('payment', function ($query) use ($now) {
                    $query->where('payment_status', 'paid')
                        ->where('created_at', '<', $now->copy()->startOfMonth());
                });
            })->count();

            // Calculate trends
            $creatorsGrowth = $totalUsersLastMonth > 0 ? round((($totalUsers - $totalUsersLastMonth) / $totalUsersLastMonth) * 100, 1) : 0;
            $supportersGrowth = $totalSupportersLastMonth > 0 ? round((($totalSupporters - $totalSupportersLastMonth) / $totalSupportersLastMonth) * 100, 1) : 0;
            $avgGrowth = round(($creatorsGrowth + $supportersGrowth) / 2, 1);

            // Fetch real countries distribution
            $countriesData = User::where('stripe_details_submitted', 1)
                ->where('suspended_account', 0)
                ->whereNotNull('country')
                ->select('country', DB::raw('count(*) as creators'))
                ->groupBy('country')
                ->orderByDesc('creators')
                ->limit(3)
                ->get()
                ->map(function ($item) {
                    return [
                        'code' => strtoupper($item->country),
                        'name' => strtoupper($item->country),
                        'flag' => '🌍', // Generic flag as fallback
                        'creators' => $item->creators,
                        'supporters' => $item->creators * 5, // Estimate based on creators
                    ];
                })->toArray();

            $data = [
                'overview' => [
                    'active_creators' => $activeCreators,
                    'total_supporters' => $totalSupporters,
                    'avg_growth' => $avgGrowth,
                    'creators_trend' => [
                        'positive' => $creatorsGrowth >= 0,
                        'percentage' => abs($creatorsGrowth),
                    ],
                    'supporters_trend' => [
                        'positive' => $supportersGrowth >= 0,
                        'percentage' => abs($supportersGrowth),
                    ],
                ],
                'milestones' => [
                    [
                        'title' => 'Active Creators Goal',
                        'description' => 'Current active creators on the platform',
                        'current' => $activeCreators,
                        'target' => max(100, ceil($activeCreators / 100) * 100),
                    ],
                    [
                        'title' => 'Total Users Goal',
                        'description' => 'Registered users goal',
                        'current' => $totalUsers,
                        'target' => max(1000, ceil($totalUsers / 1000) * 1000),
                    ],
                ],
                'countries' => empty($countriesData) ? [] : $countriesData,
                'achievements' => [], // Empty for now as there's no dynamic achievement table
            ];

            return response()->json([
                'success' => true,
                'data' => $data,
                'message' => 'Platform analytics retrieved successfully',
            ]);
        } catch (\Exception $e) {
            Log::error('Platform analytics error: '.$e->getMessage());

            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve platform analytics',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    public function recentGifters()
    {
        try {
            $last24hour = Carbon::now()->subHours(24);
            $gifters = [];

            // Wishlist Payments
            $wishes = StripePaymentItems::whereHas('payment', function ($q) use ($last24hour) {
                $q->where('payment_status', 'paid')
                    ->whereNotIn('id', function ($sub) {
                        $sub->select('source_id')
                            ->from('financial_transactions')
                            ->where('source_type', StripePaymentDetail::class)
                            ->whereIn('status', ['refunded', 'disputed']);
                    })
                    ->where('created_at', '>', $last24hour);
            })->with('payment.user')->get();

            foreach ($wishes as $item) {
                $user = $item->payment->user ?? null;
                if ($user) {
                    $gifters[] = [
                        'id' => $user->id,
                        'name' => $user->name ?? 'Anonymous',
                        'username' => $user->username ?? 'Anonymous',
                        'avatar_url' => $user->avatar_url ?? null,
                        'cover_url' => $user->cover_url ?? 'Anonymous',
                        'role' => $user->role ?? 'Anonymous',
                        'profile_status_lock' => $user->profile_status_lock ?? 1,
                        'verified_badge' => VerifiedBadge::tierFor($user),
                        'is_founder' => $user->is_founder ?? false,
                        'amount' => $item->amount,
                        'currency' => $item->payment->currency,
                        'created_at' => $item->created_at,
                    ];
                }
            }

            // Wishlist Subscriptions
            $subscriptions = WishItemSubscription::with('user')
                ->where('status', 'paid')
                ->whereNotIn('id', function ($q) {
                    $q->select('source_id')
                        ->from('financial_transactions')
                        ->where('source_type', WishItemSubscription::class)
                        ->whereIn('status', ['refunded', 'disputed']);
                })
                ->where('created_at', '>', $last24hour)
                ->get();

            foreach ($subscriptions as $sub) {
                $user = $sub->user;
                $gifters[] = [
                    'id' => $user->id,
                    'name' => $user->name ?? 'Anonymous',
                    'username' => $user->username ?? 'Anonymous',
                    'avatar_url' => $user->avatar_url ?? null,
                    'cover_url' => $user->cover_url ?? 'Anonymous',
                    'role' => $user->role ?? 'Anonymous',
                    'profile_status_lock' => $user->profile_status_lock ?? 1,
                    'verified_badge' => VerifiedBadge::tierFor($user),
                    'is_founder' => $user->is_founder ?? false,
                    'amount' => $sub->amount,
                    'currency' => $sub->currency,
                    'created_at' => $sub->created_at,
                ];
            }

            // Tips
            $tips = TipGoalsPayment::with('user')
                ->where('status', 'paid')
                ->whereNotIn('id', function ($q) {
                    $q->select('source_id')
                        ->from('financial_transactions')
                        ->where('source_type', TipGoalsPayment::class)
                        ->whereIn('status', ['refunded', 'disputed']);
                })
                ->where('created_at', '>', $last24hour)
                ->get();

            foreach ($tips as $tip) {
                $user = $tip->user;
                $gifters[] = [
                    'id' => $user->id,
                    'name' => $user->name ?? 'Anonymous',
                    'username' => $user->username ?? 'Anonymous',
                    'avatar_url' => $user->avatar_url ?? null,
                    'cover_url' => $user->cover_url ?? 'Anonymous',
                    'role' => $user->role ?? 'Anonymous',
                    'profile_status_lock' => $user->profile_status_lock ?? 1,
                    'verified_badge' => VerifiedBadge::tierFor($user),
                    'is_founder' => $user->is_founder ?? false,
                    'amount' => $tip->amount,
                    'currency' => $tip->currency,
                    'created_at' => $tip->created_at,
                ];
            }

            // Memberships
            $members = MembershipPayment::with('user')
                ->where('status', 'paid')
                ->whereNotIn('id', function ($q) {
                    $q->select('source_id')
                        ->from('financial_transactions')
                        ->where('source_type', MembershipPayment::class)
                        ->whereIn('status', ['refunded', 'disputed']);
                })
                ->where('created_at', '>', $last24hour)
                ->get();

            foreach ($members as $member) {
                $user = $member->user;
                $gifters[] = [
                    'id' => $user->id,
                    'name' => $user->name ?? 'Anonymous',
                    'username' => $user->username ?? 'Anonymous',
                    'avatar_url' => $user->avatar_url ?? null,
                    'cover_url' => $user->cover_url ?? 'Anonymous',
                    'role' => $user->role ?? 'Anonymous',
                    'profile_status_lock' => $user->profile_status_lock ?? 1,
                    'verified_badge' => VerifiedBadge::tierFor($user),
                    'is_founder' => $user->is_founder ?? false,
                    'amount' => $member->amount,
                    'currency' => $member->currency,
                    'created_at' => $member->created_at,
                ];
            }

            // Bills
            $bills = BillPayment::with('user')
                ->where('status', 'paid')
                ->whereNotIn('id', function ($q) {
                    $q->select('source_id')
                        ->from('financial_transactions')
                        ->where('source_type', BillPayment::class)
                        ->whereIn('status', ['refunded', 'disputed']);
                })
                ->where('created_at', '>', $last24hour)
                ->get();

            foreach ($bills as $bill) {
                $user = $bill->user;
                $gifters[] = [
                    'id' => $user->id,
                    'name' => $user->name ?? 'Anonymous',
                    'username' => $user->username ?? 'Anonymous',
                    'avatar_url' => $user->avatar_url ?? null,
                    'cover_url' => $user->cover_url ?? 'Anonymous',
                    'role' => $user->role ?? 'Anonymous',
                    'profile_status_lock' => $user->profile_status_lock ?? 1,
                    'verified_badge' => VerifiedBadge::tierFor($user),
                    'is_founder' => $user->is_founder ?? false,
                    'amount' => $bill->amount,
                    'currency' => $bill->currency,
                    'created_at' => $bill->created_at,
                ];
            }

            // Sort by recency so "Recent Supporters" is actually recent.
            usort($gifters, function ($a, $b) {
                return strtotime($b['created_at']) <=> strtotime($a['created_at']);
            });

            $gifters = collect($gifters)->unique('username')->values()->take(5);

            return response()->json([
                'status' => true,
                'data' => $gifters,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'status' => false,
                'msg' => 'Something went wrong',
                'error' => $e->getMessage(),
            ]);
        }
    }

    public function largestGifts($type = null)
    {
        try {
            if ($type == 'lasthour' || $type == 'last24hour') {

                if ($type == 'lasthour') {
                    $lasthour = Carbon::now()->subHour(1);
                    $wishes = StripePaymentItems::whereHas('wish', function ($q) {
                        $q->whereHas('user', function ($query) {
                            // Restriction removed
                        });
                    })->whereHas('payment', function ($q) {
                        $q->where('payment_status', 'paid')
                            ->whereNotIn('id', function ($sub) {
                                $sub->select('source_id')
                                    ->from('financial_transactions')
                                    ->where('source_type', StripePaymentDetail::class)
                                    ->whereIn('status', ['refunded', 'disputed']);
                            });
                    })->orderBy('amount', 'DESC')->where('created_at', '>', $lasthour)->get();
                    $subscriptions = WishItemSubscription::whereHas('wish_item', function ($q) {
                        $q->whereHas('user', function ($query) {
                            // Restriction removed
                        });
                    })->where('status', 'paid')
                        ->whereNotIn('id', function ($q) {
                            $q->select('source_id')->from('financial_transactions')->where('source_type', WishItemSubscription::class)->whereIn('status', ['refunded', 'disputed']);
                        })->orderBy('amount', 'DESC')->where('created_at', '>', $lasthour)->get();
                    $tips = TipGoalsPayment::whereHas('creator', function ($q) {
                        // Restriction removed
                    })->where('status', 'paid')
                        ->whereNotIn('id', function ($q) {
                            $q->select('source_id')->from('financial_transactions')->where('source_type', TipGoalsPayment::class)->whereIn('status', ['refunded', 'disputed']);
                        })->orderBy('amount', 'DESC')->where('created_at', '>', $lasthour)->get();

                    $members = MembershipPayment::whereHas('membership', function ($q) {
                        $q->whereHas('user', function ($query) {
                            // Restriction removed
                        });
                    })->where('status', 'paid')
                        ->whereNotIn('id', function ($q) {
                            $q->select('source_id')->from('financial_transactions')->where('source_type', MembershipPayment::class)->whereIn('status', ['refunded', 'disputed']);
                        })->orderBy('amount', 'DESC')->where('created_at', '>', $lasthour)->get();
                    $bills = BillPayment::whereHas('bill', function ($q) {
                        $q->whereHas('user', function ($query) {
                            // Restriction removed
                        });
                    })->where('status', 'paid')
                        ->whereNotIn('id', function ($q) {
                            $q->select('source_id')->from('financial_transactions')->where('source_type', BillPayment::class)->whereIn('status', ['refunded', 'disputed']);
                        })->orderBy('amount', 'DESC')->where('created_at', '>', $lasthour)->get();
                } else {
                    $last24hour = Carbon::now()->subHour(24);
                    $wishes = StripePaymentItems::whereHas('wish', function ($q) {
                        $q->whereHas('user', function ($query) {
                            // Restriction removed
                        });
                    })->whereHas('payment', function ($q) {
                        $q->where('payment_status', 'paid')
                            ->whereNotIn('id', function ($sub) {
                                $sub->select('source_id')
                                    ->from('financial_transactions')
                                    ->where('source_type', StripePaymentDetail::class)
                                    ->whereIn('status', ['refunded', 'disputed']);
                            });
                    })->orderBy('amount', 'DESC')->where('created_at', '>', $last24hour)->get();
                    $subscriptions = WishItemSubscription::whereHas('wish_item', function ($q) {
                        $q->whereHas('user', function ($query) {
                            // Restriction removed
                        });
                    })->where('status', 'paid')
                        ->whereNotIn('id', function ($q) {
                            $q->select('source_id')->from('financial_transactions')->where('source_type', WishItemSubscription::class)->whereIn('status', ['refunded', 'disputed']);
                        })->orderBy('amount', 'DESC')->where('created_at', '>', $last24hour)->get();
                    $tips = TipGoalsPayment::whereHas('creator', function ($q) {
                        // Restriction removed
                    })->where('status', 'paid')
                        ->whereNotIn('id', function ($q) {
                            $q->select('source_id')->from('financial_transactions')->where('source_type', TipGoalsPayment::class)->whereIn('status', ['refunded', 'disputed']);
                        })->orderBy('amount', 'DESC')->where('created_at', '>', $last24hour)->get();

                    $members = MembershipPayment::whereHas('membership', function ($q) {
                        $q->whereHas('user', function ($query) {
                            // Restriction removed
                        });
                    })->where('status', 'paid')
                        ->whereNotIn('id', function ($q) {
                            $q->select('source_id')->from('financial_transactions')->where('source_type', MembershipPayment::class)->whereIn('status', ['refunded', 'disputed']);
                        })->orderBy('amount', 'DESC')->where('created_at', '>', $last24hour)->get();
                    $bills = BillPayment::whereHas('bill', function ($q) {
                        $q->whereHas('user', function ($query) {
                            // Restriction removed
                        });
                    })->where('status', 'paid')
                        ->whereNotIn('id', function ($q) {
                            $q->select('source_id')->from('financial_transactions')->where('source_type', BillPayment::class)->whereIn('status', ['refunded', 'disputed']);
                        })->orderBy('amount', 'DESC')->where('created_at', '>', $last24hour)->get();
                }

                $array = [];

                foreach ($wishes as $key => $value) {
                    $array[] = [
                        'name' => $value->wish->user->name,
                        'username' => $value->wish->user->username,
                        'avatar_url' => $value->wish->user->avatar_url,
                        'cover_url' => $value->wish->user->cover_url,
                        'amount' => $value->amount,
                        'profile_status_lock' => $value->wish->user->profile_status_lock,
                        'role' => $value->wish->user->role,
                        'currency' => $value->payment->currency,
                    ];
                }

                foreach ($subscriptions as $key => $value) {
                    $array[] = [
                        'name' => $value->wish_item->user->name,
                        'username' => $value->wish_item->user->username,
                        'avatar_url' => $value->wish_item->user->avatar_url,
                        'cover_url' => $value->wish_item->user->cover_url,
                        'profile_status_lock' => $value->wish_item->user->profile_status_lock,
                        'role' => $value->wish_item->user->role,
                        'amount' => $value->amount,
                        'currency' => $value->currency,
                    ];
                }

                foreach ($tips as $key => $value) {
                    $array[] = [
                        'name' => $value->creator->name,
                        'username' => $value->creator->username,
                        'avatar_url' => $value->creator->avatar_url,
                        'cover_url' => $value->creator->cover_url,
                        'profile_status_lock' => $value->creator->profile_status_lock,
                        'role' => $value->creator->role,
                        'amount' => $value->amount,
                        'currency' => $value->currency,
                    ];
                }

                foreach ($members as $key => $value) {
                    $array[] = [
                        'name' => $value->membership->user->name,
                        'username' => $value->membership->user->username,
                        'avatar_url' => $value->membership->user->avatar_url,
                        'profile_status_lock' => $value->membership->user->profile_status_lock,
                        'role' => $value->membership->user->role,
                        'cover_url' => $value->membership->user->cover_url,
                        'amount' => $value->amount,
                        'currency' => $value->currency,
                    ];
                }

                foreach ($bills as $key => $value) {
                    $array[] = [
                        'name' => $value->bill->user->name,
                        'username' => $value->bill->user->username,
                        'avatar_url' => $value->bill->user->avatar_url,
                        'cover_url' => $value->bill->user->cover_url,
                        'profile_status_lock' => $value->bill->user->profile_status_lock,
                        'role' => $value->bill->user->role,
                        'amount' => $value->amount,
                        'currency' => $value->currency,
                    ];
                }

                usort($array, function ($a, $b) {
                    return $b['amount'] - $a['amount'];
                });

                return response()->json([
                    'status' => true,
                    'data' => $array,
                ]);
            } else {
                return response()->json([
                    'status' => false,
                    'msg' => 'Please enter valid type',
                ]);
            }
        } catch (\Exception $e) {
            return response()->json([
                'status' => false,
                'msg' => 'Something went wrong',
                'error' => $e,
            ]);
        }
    }

    public function topGiftersAllTime()
    {
        try {
            $gifters = [];
            $currencyRates = Currency::whereNotNull('conversion_rate')
                ->pluck('conversion_rate', 'ISO')
                ->mapWithKeys(fn ($rate, $iso) => [strtoupper($iso) => (float) $rate])
                ->toArray();

            // Helper to accumulate amounts by username
            $addGifter = function (&$gifters, $user, $amount, $currency) use ($currencyRates) {
                $username = $user->username ?? 'anonymous_'.($user->id ?? uniqid());
                $normalizedAmount = $this->normalizeToGbp((float) $amount, $currency, $currencyRates);

                if (! isset($gifters[$username])) {
                    $gifters[$username] = [
                        'id' => $user->id ?? null,
                        'name' => $user->name ?? 'Anonymous',
                        'username' => $user->username ?? 'Anonymous',
                        'avatar_url' => $user->avatar_url ?? null,
                        'cover_url' => $user->cover_url ?? 'Anonymous',
                        'role' => $user->role ?? 'Anonymous',
                        'profile_status_lock' => $user->profile_status_lock ?? 1,
                        'verified_badge' => VerifiedBadge::tierFor($user),
                        'is_founder' => $user->is_founder ?? false,
                        'amount' => 0,
                        'currency' => 'GBP',
                    ];
                }

                $gifters[$username]['amount'] += $normalizedAmount;
            };

            // Wishlist Payments
            $wishes = StripePaymentItems::whereHas('payment', function ($q) {
                $q->where('payment_status', 'paid')
                    ->whereNotIn('id', function ($sub) {
                        $sub->select('source_id')
                            ->from('financial_transactions')
                            ->where('source_type', StripePaymentDetail::class)
                            ->whereIn('status', ['refunded', 'disputed']);
                    });
            })->with('payment.user')->get();

            foreach ($wishes as $item) {
                $user = $item->payment->user ?? null;
                if ($user) {
                    $addGifter($gifters, $user, $item->amount, $item->payment->currency);
                }
            }

            // Wishlist Subscriptions
            $subscriptions = WishItemSubscription::with('user')
                ->where('status', 'paid')
                ->whereNotIn('id', function ($q) {
                    $q->select('source_id')->from('financial_transactions')->where('source_type', WishItemSubscription::class)->whereIn('status', ['refunded', 'disputed']);
                })
                ->get();

            foreach ($subscriptions as $sub) {
                $user = $sub->user;
                if ($user) {
                    $addGifter($gifters, $user, $sub->amount, $sub->currency);
                }
            }

            // Tips
            $tips = TipGoalsPayment::with('user')
                ->where('status', 'paid')
                ->whereNotIn('id', function ($q) {
                    $q->select('source_id')->from('financial_transactions')->where('source_type', TipGoalsPayment::class)->whereIn('status', ['refunded', 'disputed']);
                })
                ->get();

            foreach ($tips as $tip) {
                $user = $tip->user;
                if ($user) {
                    $addGifter($gifters, $user, $tip->amount, $tip->currency);
                }
            }

            // Memberships
            $members = MembershipPayment::with('user')
                ->where('status', 'paid')
                ->whereNotIn('id', function ($q) {
                    $q->select('source_id')->from('financial_transactions')->where('source_type', MembershipPayment::class)->whereIn('status', ['refunded', 'disputed']);
                })
                ->get();

            foreach ($members as $member) {
                $user = $member->user;
                if ($user) {
                    $addGifter($gifters, $user, $member->amount, $member->currency);
                }
            }

            // Bills
            $bills = BillPayment::with('user')
                ->where('status', 'paid')
                ->whereNotIn('id', function ($q) {
                    $q->select('source_id')->from('financial_transactions')->where('source_type', BillPayment::class)->whereIn('status', ['refunded', 'disputed']);
                })
                ->get();

            foreach ($bills as $bill) {
                $user = $bill->user;
                if ($user) {
                    $addGifter($gifters, $user, $bill->amount, $bill->currency);
                }
            }

            $sortedGifters = collect($gifters)->sortByDesc('amount')->values();

            return response()->json([
                'status' => true,
                'data' => $sortedGifters,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'status' => false,
                'msg' => 'Something went wrong',
                'error' => $e->getMessage(),
            ]);
        }
    }

    public function top10UniqueBiggestGifters()
    {
        try {
            $gifters = [];

            $storeMaxPayment = function (&$gifters, $user, $amount, $currency, $type, $createdAt) {
                $username = $user->username ?? 'anonymous_'.($user->id ?? uniqid());

                if (
                    ! isset($gifters[$username]) ||
                    $amount > $gifters[$username]['amount']
                ) {
                    $gifters[$username] = [
                        'id' => $user->id ?? null,
                        'type' => $type,
                        'name' => $user->name ?? 'Anonymous',
                        'username' => $user->username ?? 'Anonymous',
                        'avatar_url' => $user->avatar_url ?? null,
                        'cover_url' => $user->cover_url ?? 'Anonymous',
                        'role' => $user->role ?? 'Anonymous',
                        'profile_status_lock' => $user->profile_status_lock ?? 1,
                        'verified_badge' => VerifiedBadge::tierFor($user),
                        'is_founder' => $user->is_founder ?? false,
                        'amount' => $amount,
                        'currency' => $currency,
                        'created_at' => $createdAt,
                    ];
                }
            };

            // Wishlist Gifts
            $wishes = StripePaymentItems::whereHas('payment', function ($q) {
                $q->where('payment_status', 'paid')
                    ->whereNotIn('id', function ($sub) {
                        $sub->select('source_id')
                            ->from('financial_transactions')
                            ->where('source_type', StripePaymentDetail::class)
                            ->whereIn('status', ['refunded', 'disputed']);
                    });
            })->with('payment.user')->get();

            foreach ($wishes as $item) {
                $user = $item->payment->user ?? null;
                if ($user) {
                    $storeMaxPayment($gifters, $user, $item->amount, $item->payment->currency, 'wishlist_gift', $item->created_at);
                }
            }

            // Subscriptions
            $subs = WishItemSubscription::with('user')->where('status', 'paid')
                ->whereNotIn('id', function ($q) {
                    $q->select('source_id')->from('financial_transactions')->where('source_type', WishItemSubscription::class)->whereIn('status', ['refunded', 'disputed']);
                })->get();
            foreach ($subs as $sub) {
                if ($sub->user) {
                    $storeMaxPayment($gifters, $sub->user, $sub->amount, $sub->currency, 'subscription', $sub->created_at);
                }
            }

            // Tips
            $tips = TipGoalsPayment::with('user')->where('status', 'paid')
                ->whereNotIn('id', function ($q) {
                    $q->select('source_id')->from('financial_transactions')->where('source_type', TipGoalsPayment::class)->whereIn('status', ['refunded', 'disputed']);
                })->get();
            foreach ($tips as $tip) {
                if ($tip->user) {
                    $storeMaxPayment($gifters, $tip->user, $tip->amount, $tip->currency, 'tip', $tip->created_at);
                }
            }

            // Memberships
            $memberships = MembershipPayment::with('user')->where('status', 'paid')
                ->whereNotIn('id', function ($q) {
                    $q->select('source_id')->from('financial_transactions')->where('source_type', MembershipPayment::class)->whereIn('status', ['refunded', 'disputed']);
                })->get();
            foreach ($memberships as $member) {
                if ($member->user) {
                    $storeMaxPayment($gifters, $member->user, $member->amount, $member->currency, 'membership', $member->created_at);
                }
            }

            // Bills
            $bills = BillPayment::with('user')->where('status', 'paid')
                ->whereNotIn('id', function ($q) {
                    $q->select('source_id')->from('financial_transactions')->where('source_type', BillPayment::class)->whereIn('status', ['refunded', 'disputed']);
                })->get();
            foreach ($bills as $bill) {
                if ($bill->user) {
                    $storeMaxPayment($gifters, $bill->user, $bill->amount, $bill->currency, 'bill', $bill->created_at);
                }
            }

            $topUniqueGifters = collect($gifters)->sortByDesc('amount')->values()->take(5);

            return response()->json([
                'status' => true,
                'data' => $topUniqueGifters,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'status' => false,
                'msg' => 'Something went wrong',
                'error' => $e->getMessage(),
            ]);
        }
    }

    /**
     * Enhanced leaderboard that supports both monetary and non-monetary metrics
     * with proper filter functionality for All-time/Monthly/Weekly/Daily
     */
    public function enhancedLeaderboard($type = null)
    {
        $users = $this->calc($type);
        $perPage = 50;
        $page = request()->get('page', 1);
        $paginator = new LengthAwarePaginator(
            $users->forPage($page, $perPage),
            $users->count(),
            $perPage,
            $page,
            ['path' => request()->url(), 'query' => request()->query()]
        );

        $data = [];
        $totalUsers = max($users->count(), 1);
        $rank = (($page - 1) * $perPage) + 1;
        foreach ($paginator as $query) {
            // Calculate period-specific engagement metrics
            $periodFollowers = $this->calculatePeriodFollowers($query, $type);
            $topPercent = round(($rank / $totalUsers) * 100, 2);

            $data[] = [
                'id' => $query->id,
                'rank' => $rank,
                'name' => $query->name ?? '',
                'username' => $query->username ?? '',
                'profile_status_lock' => $query->profile_status_lockNone,
                'verified_badge' => VerifiedBadge::tierFor($query),
                'is_founder' => $query->is_founder ?? false,
                'role' => $query->role,
                'avatar' => $query->avatar_url,
                'coverimg' => $query->cover_url,
                'top' => $topPercent,
                'amount' => $query->total_amount,
                'currency' => $query->currency ?? 'GBP',
                'supporters' => $periodFollowers > 0 ? $periodFollowers : $query->total_supporters ?? 0,
                'engagement' => $query->engagement_score ?? 0,
                'combined_score' => $query->combined_score ?? $query->total_amount,
                'is_engagement_based' => $query->engagement_score > 0,
            ];
            $rank++;
        }

        return response()->json([
            'success' => true,
            'data' => $data,
            'message' => 'Enhanced leaderboard data retrieved successfully',
            'last_page' => $paginator->lastPage() ?? null,
            'current_page' => $paginator->currentPage() ?? null,
            'total' => $paginator->total() ?? null,
            'per_page' => $paginator->perPage() ?? null,
            'period' => $type ?? 'all',
        ]);
    }

    /**
     * Calculate period-specific follower growth for engagement metrics
     */
    private function calculatePeriodFollowers($user, $type)
    {
        if (! $type) {
            return $user->followers_count ?? 0;
        }

        $currentMonth = Carbon::now()->month;
        $currentYear = Carbon::now()->year;
        $currentWeekStartDate = Carbon::now()->startOfWeek();
        $currentWeekEndDate = Carbon::now()->endOfWeek();
        $currentDate = Carbon::today()->format('Y-m-d');

        // For simplicity, we'll return total followers for now
        // In a real implementation, you'd track follower growth over time
        return $user->followers_count ?? 0;
    }

    /**
     * Get top supporters ranked by gift frequency/count
     * This replaces the largest gifts functionality to show most active supporters
     */
    public function topSupportersByFrequency()
    {
        try {
            $supporters = [];

            // Helper function to count gifts by user
            $addSupporterGift = function (&$supporters, $user, $currency, $type) {
                $username = $user->username ?? 'anonymous_'.($user->id ?? uniqid());

                if (! isset($supporters[$username])) {
                    $supporters[$username] = [
                        'id' => $user->id,
                        'name' => $user->name ?? 'Anonymous',
                        'username' => $user->username ?? 'Anonymous',
                        'avatar_url' => $user->avatar_url ?? null,
                        'cover_url' => $user->cover_url ?? 'Anonymous',
                        'role' => $user->role ?? 'Anonymous',
                        'profile_status_lock' => $user->profile_status_lock ?? 1,
                        'verified_badge' => VerifiedBadge::tierFor($user),
                        'is_founder' => $user->is_founder ?? false,
                        'gift_count' => 0,
                        'currency' => $currency,
                        'support_types' => [],
                        'latest_support_type' => $type,
                    ];
                }

                $supporters[$username]['gift_count']++;
                $supporters[$username]['latest_support_type'] = $type;

                // Track unique support types
                if (! in_array($type, $supporters[$username]['support_types'])) {
                    $supporters[$username]['support_types'][] = $type;
                }
            };

            // Count wishlist payments
            $wishes = StripePaymentItems::whereHas('payment', function ($q) {
                $q->where('payment_status', 'paid')
                    ->whereNotIn('id', function ($sub) {
                        $sub->select('source_id')
                            ->from('financial_transactions')
                            ->where('source_type', StripePaymentDetail::class)
                            ->whereIn('status', ['refunded', 'disputed']);
                    });
            })->with('payment.user')->get();

            foreach ($wishes as $item) {
                $user = $item->payment->user ?? null;
                if ($user) {
                    $addSupporterGift($supporters, $user, $item->payment->currency, 'wish');
                }
            }

            // Count subscriptions
            $subscriptions = WishItemSubscription::with('user')
                ->where('status', 'paid')
                ->whereNotIn('id', function ($q) {
                    $q->select('source_id')->from('financial_transactions')->where('source_type', WishItemSubscription::class)->whereIn('status', ['refunded', 'disputed']);
                })
                ->get();

            foreach ($subscriptions as $sub) {
                $user = $sub->user;
                if ($user) {
                    $addSupporterGift($supporters, $user, $sub->currency, 'subscription');
                }
            }

            // Count tips
            $tips = TipGoalsPayment::with('user')
                ->where('status', 'paid')
                ->whereNotIn('id', function ($q) {
                    $q->select('source_id')->from('financial_transactions')->where('source_type', TipGoalsPayment::class)->whereIn('status', ['refunded', 'disputed']);
                })
                ->get();

            foreach ($tips as $tip) {
                $user = $tip->user;
                if ($user) {
                    $addSupporterGift($supporters, $user, $tip->currency, 'tip');
                }
            }

            // Count memberships
            $members = MembershipPayment::with('user')
                ->where('status', 'paid')
                ->whereNotIn('id', function ($q) {
                    $q->select('source_id')->from('financial_transactions')->where('source_type', MembershipPayment::class)->whereIn('status', ['refunded', 'disputed']);
                })
                ->get();

            foreach ($members as $member) {
                $user = $member->user;
                if ($user) {
                    $addSupporterGift($supporters, $user, $member->currency, 'membership');
                }
            }

            // Count bills
            $bills = BillPayment::with('user')
                ->where('status', 'paid')
                ->whereNotIn('id', function ($q) {
                    $q->select('source_id')->from('financial_transactions')->where('source_type', BillPayment::class)->whereIn('status', ['refunded', 'disputed']);
                })
                ->get();

            foreach ($bills as $bill) {
                $user = $bill->user;
                if ($user) {
                    $addSupporterGift($supporters, $user, $bill->currency, 'bill');
                }
            }

            // Sort by gift count and take top 5
            $topSupporters = collect($supporters)
                ->sortByDesc('gift_count')
                ->values()
                ->take(5);

            return response()->json([
                'status' => true,
                'data' => $topSupporters,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'status' => false,
                'msg' => 'Something went wrong',
                'error' => $e->getMessage(),
            ]);
        }
    }

    /**
     * Earnings
     *
     * @return JSON
     */
    public function earnings($type = 'today')
    {
        $user = User::where('id', Auth::id())->firstOrFail();
        $now = Carbon::now();

        [$start, $end] = match ($type) {
            'week' => [$now->copy()->startOfWeek(), $now->copy()->endOfWeek()],
            'month' => [$now->copy()->startOfMonth(), $now->copy()->endOfMonth()],
            'all' => [null, null],
            default => [$now->copy()->startOfDay(), $now->copy()->endOfDay()],
        };

        $displayCurrency = strtoupper(request()->cookie('currency', $user->default_currency ?? 'GBP'));

        $incomeTx = FinancialTransaction::where('user_id', $user->id)
            ->where('type', 'income')
            ->where('status', 'completed');

        if ($type !== 'all') {
            $incomeTx->whereBetween('transaction_date', [$start, $end]);
        }

        $incomeTx = $incomeTx->with(['source' => function ($morph) {
            $morph->morphWith([
                ShopPayment::class => ['shop'],
            ]);
        }])->get(['net_amount', 'currency', 'source_type', 'source_id', 'vat_amount']);

        // Collect Shop session IDs to resolve physical item delivery status
        $shopSessionIds = $incomeTx->where('source_type', 'App\Models\ShopPayment')
            ->pluck('source.session_id')
            ->filter()
            ->unique()
            ->values()
            ->all();

        $deliverableStatusBySession = empty($shopSessionIds)
            ? []
            : Deliverable::whereIn('session_id', $shopSessionIds)
                ->orderBy('id')
                ->get(['session_id', 'status'])
                ->groupBy('session_id')
                ->map(fn ($rows) => $rows->first()->status)
                ->all();

        $allCurrencies = $incomeTx
            ->pluck('currency')
            ->push($displayCurrency)
            ->push('GBP')
            ->filter()
            ->map(fn ($c) => strtoupper($c))
            ->unique()
            ->values();

        $currencyMeta = Currency::whereIn('ISO', $allCurrencies)
            ->get(['ISO', 'conversion_rate', 'ISOdigits'])
            ->keyBy('ISO');

        if (! isset($currencyMeta[$displayCurrency]) || (float) ($currencyMeta[$displayCurrency]->conversion_rate ?? 0) <= 0) {
            $displayCurrency = 'GBP';
        }

        $convert = function (string $from, float $amount, string $to) use ($currencyMeta) {
            $from = strtoupper($from ?: 'GBP');
            $to = strtoupper($to ?: 'GBP');
            if ($from === $to) {
                return $amount;
            }
            if (! isset($currencyMeta[$from]) || ! isset($currencyMeta[$to])) {
                return null;
            }
            $fromRate = (float) ($currencyMeta[$from]->conversion_rate ?? 0);
            $toRate = (float) ($currencyMeta[$to]->conversion_rate ?? 0);
            if ($fromRate <= 0 || $toRate <= 0) {
                return null;
            }
            $gbp = $amount / $fromRate;
            $converted = $gbp * $toRate;
            $decimalPlaces = (int) ($currencyMeta[$to]->ISOdigits ?? 2);

            return round($converted, $decimalPlaces, PHP_ROUND_HALF_UP);
        };

        $labelForSource = function (?string $sourceType) {
            $base = class_basename((string) $sourceType);

            return match ($base) {
                'StripePaymentItems' => ['title' => 'exclusive content', 'tag' => 'single_wish'],
                'ShopPayment' => ['title' => 'shop items', 'tag' => 'shops'],
                'TipGoalsPayment' => ['title' => 'piggy bank', 'tag' => 'tip_goal'],
                'PiggyPotContribution' => ['title' => 'piggy pots', 'tag' => 'piggy_pots'],
                'MembershipPayment' => ['title' => 'memberships', 'tag' => 'memberships'],
                'TaskPurchase' => ['title' => 'paid task', 'tag' => 'task'],
                'BillPayment' => ['title' => 'bills', 'tag' => 'bills'],
                'WishItemSubscription' => ['title' => 'subscriptions', 'tag' => 'subscriptions'],
                default => ['title' => strtolower(str_replace(['Payment', 'Purchase'], '', $base ?: 'other')), 'tag' => 'other'],
            };
        };

        $buckets = [];
        foreach ($incomeTx as $tx) {
            // Task Completion Logic: Only count if completed
            if ($tx->source_type === 'App\Models\TaskPurchase' && isset($tx->source->status)) {
                if (! in_array($tx->source->status, ['completed', 'completed_accepted', 'paid_out'])) {
                    continue;
                }
            }

            // Shop Completion Logic: Only count if delivered (for physical items)
            if ($tx->source_type === 'App\Models\ShopPayment' && isset($tx->source->shop)) {
                if ($tx->source->shop->type === 'physical') {
                    $status = $deliverableStatusBySession[$tx->source->session_id] ?? null;
                    if ($status !== 'delivered') {
                        continue;
                    }
                }
            }

            $meta = $labelForSource($tx->source_type);
            $tag = $meta['tag'];
            if (! isset($buckets[$tag])) {
                $buckets[$tag] = [
                    'title' => $meta['title'],
                    'tag' => $tag,
                    'amount' => 0,
                ];
            }

            $from = strtoupper($tx->currency ?? 'GBP');
            $net = (float) ($tx->net_amount ?? 0);
            $vat = (float) ($tx->vat_amount ?? 0);
            $amount = $net + $vat; // Gross earnings matches Gross Display!

            $buckets[$tag]['amount'] += $from === $displayCurrency ? $amount : ($convert($from, $amount, $displayCurrency) ?? $amount);
        }

        $total = array_sum(array_map(fn ($x) => (float) ($x['amount'] ?? 0), $buckets));
        $total = round($total, 2, PHP_ROUND_HALF_UP);

        $earnings = [];
        foreach ($buckets as $bucket) {
            $amt = round((float) $bucket['amount'], 2, PHP_ROUND_HALF_UP);
            $earnings[] = [
                'amount' => $amt,
                'percent' => $total > 0 ? round(($amt * 100) / $total, 2, PHP_ROUND_HALF_UP) : 0,
                'title' => $bucket['title'],
                'tag' => $bucket['tag'],
            ];
        }

        usort($earnings, fn ($a, $b) => ($b['amount'] <=> $a['amount']));

        return response()->json([
            'currency' => strtolower($displayCurrency),
            'total' => $total,
            'earnings' => $earnings,
        ], 200);
    }

    public function graphData()
    {
        $user = User::where('id', Auth::id())->firstOrFail();
        $displayCurrency = strtoupper(request()->cookie('currency', $user->default_currency ?? 'GBP'));

        $currentYear = Carbon::now()->year;
        $start = Carbon::create($currentYear, 1, 1)->startOfDay();
        $end = Carbon::create($currentYear, 12, 31)->endOfDay();

        $tx = FinancialTransaction::where('user_id', $user->id)
            ->where('type', 'income')
            ->where('status', 'completed')
            ->whereBetween('transaction_date', [$start, $end])
            ->get(['transaction_date', 'net_amount', 'currency', 'source_type']);

        $allCurrencies = $tx
            ->pluck('currency')
            ->push($displayCurrency)
            ->push('GBP')
            ->filter()
            ->map(fn ($c) => strtoupper($c))
            ->unique()
            ->values();

        $currencyMeta = Currency::whereIn('ISO', $allCurrencies)
            ->get(['ISO', 'conversion_rate', 'ISOdigits', 'symbol'])
            ->keyBy('ISO');

        if (! isset($currencyMeta[$displayCurrency]) || (float) ($currencyMeta[$displayCurrency]->conversion_rate ?? 0) <= 0) {
            $displayCurrency = 'GBP';
        }

        $convert = function (string $from, float $amount, string $to) use ($currencyMeta) {
            $from = strtoupper($from ?: 'GBP');
            $to = strtoupper($to ?: 'GBP');
            if ($from === $to) {
                return $amount;
            }
            if (! isset($currencyMeta[$from]) || ! isset($currencyMeta[$to])) {
                return null;
            }
            $fromRate = (float) ($currencyMeta[$from]->conversion_rate ?? 0);
            $toRate = (float) ($currencyMeta[$to]->conversion_rate ?? 0);
            if ($fromRate <= 0 || $toRate <= 0) {
                return null;
            }
            $gbp = $amount / $fromRate;
            $converted = $gbp * $toRate;
            $decimalPlaces = (int) ($currencyMeta[$to]->ISOdigits ?? 2);

            return round($converted, $decimalPlaces, PHP_ROUND_HALF_UP);
        };

        $labelKey = function (?string $sourceType) {
            $base = class_basename((string) $sourceType);

            return match ($base) {
                'StripePaymentItems' => 'Wishes',
                'ShopPayment' => 'Shops',
                'TipGoalsPayment' => 'Piggy_Bank',
                'PiggyPotContribution' => 'Piggy_Pots',
                'MembershipPayment' => 'Memberships',
                'TaskPurchase' => 'PaidTask',
                'BillPayment' => 'Bills',
                'WishItemSubscription' => 'Subscriptions',
                default => 'Other',
            };
        };

        $data = [];
        for ($month = 1; $month <= 12; $month++) {
            $date = Carbon::create($currentYear, $month, 1);
            /*
             * ⚠️ EVERY key `$labelKey()` can return must be seeded here.
             * `Piggy_Pots` was missing, so a creator with any Piggy Pot income
             * 500'd this endpoint with "Undefined array key" — the whole monthly
             * revenue chart on /earnings, dead, for exactly the creators who use
             * the feature. It fails on the FIRST such transaction, so a creator
             * whose only income is pots never saw the chart at all.
             */
            $monthData = [
                'Wishes' => 0,
                'PaidTask' => 0,
                'Piggy_Bank' => 0,
                'Piggy_Pots' => 0,
                'Memberships' => 0,
                'Bills' => 0,
                'Shops' => 0,
                'Subscriptions' => 0,
                'Other' => 0,
            ];

            foreach ($tx as $row) {
                if (! $row->transaction_date) {
                    continue;
                }
                if ((int) $row->transaction_date->format('n') !== $month) {
                    continue;
                }

                $from = strtoupper($row->currency ?? 'GBP');
                $amount = (float) ($row->net_amount ?? 0);
                $amt = $from === $displayCurrency ? $amount : ($convert($from, $amount, $displayCurrency) ?? $amount);

                $key = $labelKey($row->source_type);
                // Belt and braces: a label added to the match above but not to
                // the seed must cost that source its bar, never the whole chart.
                $monthData[$key] = round(((float) ($monthData[$key] ?? 0)) + $amt, 2, PHP_ROUND_HALF_UP);
            }

            $monthData['month'] = $date->format('F');
            $data[] = $monthData;
        }

        $symbol = $currencyMeta[$displayCurrency]->symbol ?? Helpers::getCurrency(strtolower($displayCurrency));

        return response()->json([
            'status' => true,
            'currency' => strtolower($displayCurrency),
            'currency_symbol' => $symbol,
            'data' => $data,
        ]);
    }

    public function initialQuery($user, $type)
    {
        switch ($type) {

            case 'wish':
                return StripePaymentItems::with('wish:id,currency')
                    ->select('amount', 'created_at', 'wish_item_id')
                    ->whereHas('wish', function ($q) {
                        $q->whereNotNull('stripe_product_id');
                    })
                    ->whereHas('payment', function ($query) use ($user) {
                        $query->where('owner_id', $user->id)->where('payment_status', 'paid');
                    });

            case 'task':
                return TaskPurchase::with('task:id,currency')
                    ->select('id', 'amount', 'created_at', 'task_id')
                    ->where('status', 'completed')
                    ->whereHas('task', function ($q) use ($user) {
                        $q->where('creator_id', $user->id);
                    });

            case 'tip':
                return TipGoalsPayment::select('amount', 'currency', 'created_at')
                    ->where('status', 'paid')
                    ->where('creator_id', $user->id);

            case 'mem':
                return MembershipPayment::select('amount', 'currency', 'created_at')
                    ->where('status', 'paid')
                    ->whereHas('membership', function ($q) use ($user) {
                        $q->where('user_id', $user->id);
                    });

            case 'bill':
                return BillPayment::select('amount', 'currency', 'created_at')
                    ->where('status', 'paid')
                    ->whereHas('bill', function ($q) use ($user) {
                        $q->where('user_id', $user->id);
                    });

            case 'shop':
                return ShopPayment::select('amount', 'currency', 'created_at')
                    ->where('payment_status', 'paid')
                    ->whereHas('shop', function ($q) use ($user) {
                        $q->where('user_id', $user->id);
                    });

            default:
                return null;
        }
    }

    // public function initialQuery($user, $type)
    // {

    //     if ($type == 'wish') {
    //         return StripePaymentItems::whereHas('wish', function ($q) {
    //             $q->whereNotNull('stripe_product_id');
    //         })->whereHas('payment', function ($query) use ($user) {
    //             $query->where('owner_id', $user->id);
    //         });
    //     }

    //     // if ($type = 'subs') {
    //     //     return WishItemSubscription::whereHas('wish_item', function ($q) use ($user) {
    //     //         $q->where('user_id', $user->id);
    //     //     });
    //     // }

    //     if ($type == 'task') {
    //         return TaskPurchase::with('task')->whereHas('task', function ($q) use ($user) {
    //             $q->where('creator_id', $user->id);
    //         });
    //     }

    //     if ($type == 'tip') {
    //         return TipGoalsPayment::whereHas('tipGoal', function ($q) use ($user) {
    //             $q->where('user_id', $user->id);
    //         });
    //     }

    //     if ($type == 'mem') {
    //         return MembershipPayment::whereHas('membership', function ($q) use ($user) {
    //             $q->where('user_id', $user->id);
    //         });
    //     }

    //     if ($type == 'bill') {
    //         return BillPayment::whereHas('bill', function ($q) use ($user) {
    //             $q->where('user_id', $user->id);
    //         });
    //     }

    //     if ($type == 'shop') {
    //         return ShopPayment::whereHas('shop', function ($q) use ($user) {
    //             $q->where('user_id', $user->id);
    //         });
    //     }
    // }

    private function getRange($type)
    {
        $now = Carbon::now();

        return match ($type) {
            'week' => [
                $now->copy()->startOfWeek(),
                $now->copy()->endOfWeek(),
            ],
            'month' => [
                $now->copy()->startOfMonth(),
                $now->copy()->endOfMonth(),
            ],
            'today' => [
                $now->copy()->startOfDay(),
                $now->copy()->endOfDay(),
            ],
            default => [
                Carbon::create(2020, 1, 1),
                $now->copy()->addYears(10),
            ],
        };
    }

    public function topWishes($type = 'all')
    {
        $user = User::where('id', Auth::id())->first();
        [$start, $end] = $this->getRange($type);

        $pay = StripePaymentItems::whereBetween('created_at', [$start, $end])
            ->whereHas('payment', function ($q) use ($user) {
                $q->where('owner_id', $user->id)->where('payment_status', 'paid');
            })->whereHas('wish', function ($q) use ($user) {
                $q->whereNotNull('stripe_product_id')->where('user_id', $user->id);
            })->groupBy('wish_item_id')
            ->selectRaw('wish_item_id, sum(amount) as total_amount')
            ->orderBy('total_amount', 'DESC')->take(5)->get();

        $resp = [];

        foreach ($pay as $p) {
            $itemIds = StripePaymentItems::where('wish_item_id', $p->wish_item_id)
                ->whereBetween('created_at', [$start, $end])
                ->whereHas('payment', function ($q) use ($user) {
                    $q->where('owner_id', $user->id)->where('payment_status', 'paid');
                })->pluck('id')->toArray();

            $ftStatuses = FinancialTransaction::where('source_type', StripePaymentItems::class)
                ->whereIn('source_id', $itemIds)
                ->pluck('status')->toArray();

            $resp[] = [
                'uuid' => $p->wish->uuid,
                'title' => $p->wish->wishname,
                'amount' => $p->total_amount,
                'media' => $p->wish->perma_link,
                'has_hold' => in_array('review_hold', $ftStatuses),
                'has_dispute' => in_array('disputed', $ftStatuses),
            ];
        }

        return response()->json([
            'status' => true,
            'data' => $resp,
            'auth' => $user,
        ]);
    }

    public function topSubscription($type = 'all')
    {
        $user = User::where('id', Auth::id())->first();
        [$start, $end] = $this->getRange($type);

        $pay = WishItemSubscription::whereBetween('created_at', [$start, $end])
            ->whereHas('wish_item', function ($q) use ($user) {
                $q->where('user_id', $user->id);
            })->where('status', 'paid')
            ->groupBy('wish_item_id')
            ->selectRaw('wish_item_id, sum(amount) as total_amount')
            ->orderBy('total_amount', 'DESC')->take(5)->get();

        $resp = [];

        foreach ($pay as $p) {
            $itemIds = WishItemSubscription::where('wish_item_id', $p->wish_item_id)
                ->whereBetween('created_at', [$start, $end])
                ->where('status', 'paid')
                ->pluck('id')->toArray();

            $ftStatuses = FinancialTransaction::where('source_type', WishItemSubscription::class)
                ->whereIn('source_id', $itemIds)
                ->pluck('status')->toArray();

            $resp[] = [
                'uuid' => $p->wish_item->uuid,
                'title' => $p->wish_item->wishname,
                'amount' => $p->total_amount,
                'media' => $p->wish_item->perma_link,
                'has_hold' => in_array('review_hold', $ftStatuses),
                'has_dispute' => in_array('disputed', $ftStatuses),
            ];
        }

        return response()->json([
            'status' => true,
            'data' => $resp,
        ]);
    }

    public function topPaidTask($type = 'all')
    {
        $user = User::where('id', Auth::id())->first();
        [$start, $end] = $this->getRange($type);

        $taskPurchase = TaskPurchase::whereBetween('created_at', [$start, $end])
            ->whereHas('task', function ($q) use ($user) {
                $q->where('creator_id', $user->id);
            })->where('status', 'completed')
            ->groupBy('task_id')
            ->selectRaw('task_id, sum(amount) as total_amount')
            ->orderBy('total_amount', 'DESC')->take(5)->get();

        $resp = [];

        foreach ($taskPurchase as $p) {
            $itemIds = TaskPurchase::where('task_id', $p->task_id)
                ->whereBetween('created_at', [$start, $end])
                ->where('status', 'completed')
                ->pluck('id')->toArray();

            $ftStatuses = FinancialTransaction::where('source_type', TaskPurchase::class)
                ->whereIn('source_id', $itemIds)
                ->pluck('status')->toArray();

            $resp[] = [
                'uuid' => $p->task->uuid,
                'title' => $p->task->title,
                'amount' => $p->total_amount,
                'media' => $p->task->media_url,
                'has_hold' => in_array('review_hold', $ftStatuses),
                'has_dispute' => in_array('disputed', $ftStatuses),
            ];
        }

        return response()->json([
            'status' => true,
            'data' => $resp,
        ]);
    }

    public function topBill($type = 'all')
    {
        $user = User::where('id', Auth::id())->first();
        [$start, $end] = $this->getRange($type);

        $pay = BillPayment::whereBetween('created_at', [$start, $end])
            ->whereHas('bill', function ($q) use ($user) {
                $q->where('user_id', $user->id);
            })->where('status', 'paid')
            ->groupBy('bills_id')
            ->selectRaw('bills_id, sum(amount) as total_amount')
            ->orderBy('total_amount', 'DESC')->take(5)->get();

        $resp = [];

        foreach ($pay as $p) {
            $itemIds = BillPayment::where('bills_id', $p->bills_id)
                ->whereBetween('created_at', [$start, $end])
                ->where('status', 'paid')
                ->pluck('id')->toArray();

            $ftStatuses = FinancialTransaction::where('source_type', BillPayment::class)
                ->whereIn('source_id', $itemIds)
                ->pluck('status')->toArray();

            $resp[] = [
                'uuid' => $p->bill->uuid,
                'title' => $p->bill->name,
                'amount' => $p->total_amount,
                'media' => $p->bill->perma_link,
                'has_hold' => in_array('review_hold', $ftStatuses),
                'has_dispute' => in_array('disputed', $ftStatuses),
            ];
        }

        return response()->json([
            'status' => true,
            'data' => $resp,
        ]);
    }

    public function topShop($type = 'all')
    {
        $user = User::where('id', Auth::id())->first();
        [$start, $end] = $this->getRange($type);

        $pay = ShopPayment::whereBetween('created_at', [$start, $end])
            ->whereHas('shop', function ($q) use ($user) {
                $q->where('user_id', $user->id);
            })->where('payment_status', 'paid')
            ->groupBy('shop_id')
            ->selectRaw('shop_id, sum(amount) as total_amount')
            ->orderBy('total_amount', 'DESC')->take(5)->get();

        $resp = [];

        foreach ($pay as $p) {
            $itemIds = ShopPayment::where('shop_id', $p->shop_id)
                ->whereBetween('created_at', [$start, $end])
                ->where('payment_status', 'paid')
                ->pluck('id')->toArray();

            $ftStatuses = FinancialTransaction::where('source_type', ShopPayment::class)
                ->whereIn('source_id', $itemIds)
                ->pluck('status')->toArray();

            $resp[] = [
                'uuid' => $p->shop->uuid,
                'title' => $p->shop->name,
                'amount' => $p->total_amount,
                'media' => $p->shop->perma_link,
                'has_hold' => in_array('review_hold', $ftStatuses),
                'has_dispute' => in_array('disputed', $ftStatuses),
            ];
        }

        return response()->json([
            'status' => true,
            'data' => $resp,
        ]);
    }

    public function topPiggyBank($type = 'all')
    {
        $user = User::where('id', Auth::id())->first();
        [$start, $end] = $this->getRange($type);

        $pay = PiggyPotContribution::whereBetween('created_at', [$start, $end])
            ->where('creator_id', $user->id)
            ->where('status', 'paid')
            ->whereNotNull('piggy_pot_id')->with('piggyPot')->groupBy('piggy_pot_id')
            ->selectRaw('piggy_pot_id,sum(amount) as total_amount')
            ->orderBy('total_amount', 'DESC')->take(5)->get();

        $resp = [];

        foreach ($pay as $p) {
            if (! $p->piggyPot) {
                continue;
            }

            $itemIds = PiggyPotContribution::where('piggy_pot_id', $p->piggy_pot_id)
                ->whereBetween('created_at', [$start, $end])
                ->where('creator_id', $user->id)
                ->where('status', 'paid')
                ->pluck('id')->toArray();

            $ftStatuses = FinancialTransaction::where('source_type', PiggyPotContribution::class)
                ->whereIn('source_id', $itemIds)
                ->pluck('status')->toArray();

            $resp[] = [
                'uuid' => $p->piggyPot->uuid,
                'name' => $p->piggyPot->title,
                'username' => '',
                'amount' => $p->total_amount,
                'media' => $p->piggyPot->cover_media,
                'has_hold' => in_array('review_hold', $ftStatuses),
                'has_dispute' => in_array('disputed', $ftStatuses),
            ];
        }

        return response()->json([
            'status' => true,
            'data' => $resp,
        ]);
    }

    public function topSupporters($type = 'all')
    {
        $user = User::where('id', Auth::id())->first();
        [$start, $end] = $this->getRange($type);
        $displayCurrency = strtoupper(request()->cookie('currency', $user->default_currency ?? 'GBP'));

        $supporterTx = FinancialTransaction::where('user_id', $user->id)
            ->where('type', 'income')
            ->whereIn('status', ['completed', 'review_hold', 'disputed'])
            ->whereBetween('transaction_date', [$start, $end])
            ->whereNotNull('supporter_id')
            ->with(['supporter:id,name,username,avatar', 'source' => function ($morph) {
                $morph->morphWith([
                    ShopPayment::class => ['shop'],
                ]);
            }])
            ->get(['supporter_id', 'net_amount', 'currency', 'source_type', 'transaction_date', 'status', 'source_id', 'vat_amount']);

        $allCurrencies = $supporterTx
            ->pluck('currency')
            ->push($displayCurrency)
            ->push('GBP')
            ->filter()
            ->map(fn ($c) => strtoupper($c))
            ->unique()
            ->values();

        $currencyMeta = Currency::whereIn('ISO', $allCurrencies)
            ->get(['ISO', 'conversion_rate', 'ISOdigits'])
            ->keyBy('ISO');

        if (! isset($currencyMeta[$displayCurrency]) || (float) ($currencyMeta[$displayCurrency]->conversion_rate ?? 0) <= 0) {
            $displayCurrency = 'GBP';
        }

        $convert = function (string $from, float $amount, string $to) use ($currencyMeta) {
            $from = strtoupper($from ?: 'GBP');
            $to = strtoupper($to ?: 'GBP');
            if ($from === $to) {
                return $amount;
            }
            if (! isset($currencyMeta[$from]) || ! isset($currencyMeta[$to])) {
                return null;
            }
            $fromRate = (float) ($currencyMeta[$from]->conversion_rate ?? 0);
            $toRate = (float) ($currencyMeta[$to]->conversion_rate ?? 0);
            if ($fromRate <= 0 || $toRate <= 0) {
                return null;
            }
            $gbp = $amount / $fromRate;
            $converted = $gbp * $toRate;
            $decimalPlaces = (int) ($currencyMeta[$to]->ISOdigits ?? 2);

            return round($converted, $decimalPlaces, PHP_ROUND_HALF_UP);
        };

        // Collect Shop session IDs to resolve physical item delivery status
        $shopSessionIds = $supporterTx->where('source_type', 'App\Models\ShopPayment')
            ->pluck('source.session_id')
            ->filter()
            ->unique()
            ->values()
            ->all();

        $deliverableStatusBySession = empty($shopSessionIds)
            ? []
            : Deliverable::whereIn('session_id', $shopSessionIds)
                ->orderBy('id')
                ->get(['session_id', 'status'])
                ->groupBy('session_id')
                ->map(fn ($rows) => $rows->first()->status)
                ->all();

        $supporters = [];
        foreach ($supporterTx as $tx) {
            // Task Completion Logic: Only count if completed
            if ($tx->source_type === 'App\Models\TaskPurchase' && isset($tx->source->status)) {
                if (! in_array($tx->source->status, ['completed', 'completed_accepted', 'paid_out'])) {
                    continue;
                }
            }

            // Shop Completion Logic: Only count if delivered (for physical items)
            if ($tx->source_type === 'App\Models\ShopPayment' && isset($tx->source->shop)) {
                if ($tx->source->shop->type === 'physical') {
                    $status = $deliverableStatusBySession[$tx->source->session_id] ?? null;
                    if ($status !== 'delivered') {
                        continue;
                    }
                }
            }

            $supporter = $tx->supporter;
            if (! $supporter) {
                continue;
            }

            $username = $supporter->username;
            if (! isset($supporters[$username])) {
                $supporters[$username] = [
                    'username' => $username,
                    'name' => $supporter->name ?? 'Anonymous',
                    'media' => $supporter->avatar_url,
                    'amount' => 0.0,
                    'has_hold' => false,
                    'has_dispute' => false,
                ];
            }

            // Only aggregate the amount if the transaction was completed successfully
            if ($tx->status === 'completed') {
                $from = strtoupper($tx->currency ?? 'GBP');
                $net = (float) ($tx->net_amount ?? 0);
                $vat = (float) ($tx->vat_amount ?? 0);
                $gross = $net + $vat;

                $supporters[$username]['amount'] += $from === $displayCurrency ? $gross : ($convert($from, $gross, $displayCurrency) ?? $gross);
            }

            if ($tx->status === 'review_hold') {
                $supporters[$username]['has_hold'] = true;
            }
            if ($tx->status === 'disputed') {
                $supporters[$username]['has_dispute'] = true;
            }
        }

        $resp = collect($supporters)
            ->sortByDesc('amount')
            ->take(5)
            ->values()
            ->all();

        return response()->json([
            'status' => true,
            'data' => $resp,
        ]);
    }

    /**
     * Get category leaders for different types of support
     */
    public function categoryLeaders()
    {
        try {
            // Use the past 3 months instead of just current month to ensure we show data
            $threeMonthsAgo = Carbon::now()->subMonths(3);
            $currentDate = Carbon::now();

            // This will capture data from the last 3 months instead of just current month

            // Get wishes leaders - focus on creators who received payments for their wishes
            $wishesLeaders = User::where('stripe_details_submitted', 1)
                ->where('suspended_account', 0)
                ->whereHas('paymentitems', function ($query) use ($threeMonthsAgo, $currentDate) {
                    $query->whereHas('payment', function ($q) {
                        $q->where('payment_status', 'paid')
                            ->whereNotIn('id', function ($sub) {
                                $sub->select('source_id')->from('financial_transactions')->where('source_type', StripePaymentDetail::class)->whereIn('status', ['refunded', 'disputed']);
                            });
                    })
                        ->whereBetween('stripe_payment_items.created_at', [$threeMonthsAgo, $currentDate]);
                })
                ->withCount([
                    'paymentitems as total_payments' => function ($query) use ($threeMonthsAgo, $currentDate) {
                        $query->select(DB::raw('COALESCE(SUM(amount), 0)'))
                            ->whereHas('payment', function ($q) {
                                $q->where('payment_status', 'paid')
                                    ->whereNotIn('id', function ($sub) {
                                        $sub->select('source_id')->from('financial_transactions')->where('source_type', StripePaymentDetail::class)->whereIn('status', ['refunded', 'disputed']);
                                    });
                            })
                            ->whereBetween('stripe_payment_items.created_at', [$threeMonthsAgo, $currentDate]);
                    },
                    'paymentitems as total_count' => function ($query) use ($threeMonthsAgo, $currentDate) {
                        $query->whereHas('payment', function ($q) {
                            $q->where('payment_status', 'paid')
                                ->whereNotIn('id', function ($sub) {
                                    $sub->select('source_id')->from('financial_transactions')->where('source_type', StripePaymentDetail::class)->whereIn('status', ['refunded', 'disputed']);
                                });
                        })
                            ->whereBetween('stripe_payment_items.created_at', [$threeMonthsAgo, $currentDate]);
                    },
                    'followers as supporters_count',
                ])
                ->orderBy('total_payments', 'desc')
                ->take(10)
                ->get()
                ->map(function ($user) {
                    return [
                        'id' => $user->id,
                        'name' => $user->name,
                        'username' => $user->username,
                        'avatar_url' => $user->avatar_url,
                        'profile_status_lock' => $user->profile_status_lockNone,
                        'verified_badge' => VerifiedBadge::tierFor($user),
                        'is_founder' => $user->is_founder ?? false,
                        'role' => $user->role,
                        'total_amount' => (float) $user->total_payments,
                        'total_count' => $user->total_count,
                        'supporters_count' => $user->supporters_count,
                        'currency' => strtoupper($user->default_currency ?? 'GBP'),
                    ];
                });

            // Get subscriptions leaders - query creators who have received subscription payments
            $subscriptionsLeaders = User::where('stripe_details_submitted', 1)
                ->where('suspended_account', 0)
                ->whereHas('subscriptions', function ($query) use ($threeMonthsAgo, $currentDate) {
                    $query->where('wish_item_subscriptions.status', 'paid')
                        ->whereNotIn('wish_item_subscriptions.id', function ($q) {
                            $q->select('source_id')->from('financial_transactions')->where('source_type', WishItemSubscription::class)->whereIn('status', ['refunded', 'disputed']);
                        })
                        ->whereBetween('wish_item_subscriptions.created_at', [$threeMonthsAgo, $currentDate]);
                })
                ->withCount([
                    'subscriptions as total_subscriptions' => function ($query) use ($threeMonthsAgo, $currentDate) {
                        $query->select(DB::raw('COALESCE(SUM(amount), 0)'))
                            ->where('wish_item_subscriptions.status', 'paid')
                            ->whereNotIn('wish_item_subscriptions.id', function ($q) {
                                $q->select('source_id')->from('financial_transactions')->where('source_type', WishItemSubscription::class)->whereIn('status', ['refunded', 'disputed']);
                            })
                            ->whereBetween('wish_item_subscriptions.created_at', [$threeMonthsAgo, $currentDate]);
                    },
                    'subscriptions as total_count' => function ($query) use ($threeMonthsAgo, $currentDate) {
                        $query->where('wish_item_subscriptions.status', 'paid')
                            ->whereNotIn('wish_item_subscriptions.id', function ($q) {
                                $q->select('source_id')->from('financial_transactions')->where('source_type', WishItemSubscription::class)->whereIn('status', ['refunded', 'disputed']);
                            })
                            ->whereBetween('wish_item_subscriptions.created_at', [$threeMonthsAgo, $currentDate]);
                    },
                    'followers as supporters_count',
                ])
                ->orderBy('total_subscriptions', 'desc')
                ->take(10)
                ->get()
                ->map(function ($user) {
                    return [
                        'id' => $user->id,
                        'name' => $user->name,
                        'username' => $user->username,
                        'avatar_url' => $user->avatar_url,
                        'profile_status_lock' => $user->profile_status_lockNone,
                        'verified_badge' => VerifiedBadge::tierFor($user),
                        'is_founder' => $user->is_founder ?? false,
                        'role' => $user->role,
                        'total_amount' => (float) $user->total_subscriptions,
                        'total_count' => $user->total_count,
                        'supporters_count' => $user->supporters_count,
                        'currency' => strtoupper($user->default_currency ?? 'GBP'),
                    ];
                });

            // Get tips/piggy bank leaders - Query creators who received tips, not who paid them
            $tipsLeaders = User::where('stripe_details_submitted', 1)
                ->where('suspended_account', 0)
                ->whereHas('tip_goal_payment', function ($query) use ($threeMonthsAgo, $currentDate) {
                    $query->where('status', 'paid')
                        ->whereNotIn('tip_goals_payments.id', function ($q) {
                            $q->select('source_id')->from('financial_transactions')->where('source_type', TipGoalsPayment::class)->whereIn('status', ['refunded', 'disputed']);
                        })
                        ->whereBetween('created_at', [$threeMonthsAgo, $currentDate]);
                })
                ->withCount([
                    'tip_goal_payment as total_tips' => function ($query) use ($threeMonthsAgo, $currentDate) {
                        $query->select(DB::raw('COALESCE(SUM(amount), 0)'))
                            ->where('status', 'paid')
                            ->whereNotIn('tip_goals_payments.id', function ($q) {
                                $q->select('source_id')->from('financial_transactions')->where('source_type', TipGoalsPayment::class)->whereIn('status', ['refunded', 'disputed']);
                            })
                            ->whereBetween('created_at', [$threeMonthsAgo, $currentDate]);
                    },
                    'tip_goal_payment as total_count' => function ($query) use ($threeMonthsAgo, $currentDate) {
                        $query->where('status', 'paid')
                            ->whereNotIn('tip_goals_payments.id', function ($q) {
                                $q->select('source_id')->from('financial_transactions')->where('source_type', TipGoalsPayment::class)->whereIn('status', ['refunded', 'disputed']);
                            })
                            ->whereBetween('created_at', [$threeMonthsAgo, $currentDate]);
                    },
                    'followers as supporters_count',
                ])
                ->orderBy('total_tips', 'desc')
                ->take(10)
                ->get()
                ->map(function ($user) {
                    return [
                        'id' => $user->id,
                        'name' => $user->name,
                        'username' => $user->username,
                        'avatar_url' => $user->avatar_url,
                        'profile_status_lock' => $user->profile_status_lockNone,
                        'verified_badge' => VerifiedBadge::tierFor($user),
                        'is_founder' => $user->is_founder ?? false,
                        'role' => $user->role,
                        'total_amount' => (float) $user->total_tips,
                        'total_count' => $user->total_count,
                        'supporters_count' => $user->supporters_count,
                        'currency' => strtoupper($user->default_currency ?? 'GBP'),
                    ];
                });

            // Get memberships leaders
            $membershipsLeaders = User::where('stripe_details_submitted', 1)
                ->where('suspended_account', 0)
                ->whereHas('membership_payments', function ($query) use ($threeMonthsAgo, $currentDate) {
                    $query->where('membership_payments.status', 'paid')
                        ->whereNotIn('membership_payments.id', function ($q) {
                            $q->select('source_id')->from('financial_transactions')->where('source_type', MembershipPayment::class)->whereIn('status', ['refunded', 'disputed']);
                        })
                        ->whereBetween('membership_payments.created_at', [$threeMonthsAgo, $currentDate]);
                })
                ->withCount([
                    'membership_payments as total_memberships' => function ($query) use ($threeMonthsAgo, $currentDate) {
                        $query->select(DB::raw('COALESCE(SUM(amount), 0)'))
                            ->where('membership_payments.status', 'paid')
                            ->whereNotIn('membership_payments.id', function ($q) {
                                $q->select('source_id')->from('financial_transactions')->where('source_type', MembershipPayment::class)->whereIn('status', ['refunded', 'disputed']);
                            })
                            ->whereBetween('membership_payments.created_at', [$threeMonthsAgo, $currentDate]);
                    },
                    'membership_payments as total_count' => function ($query) use ($threeMonthsAgo, $currentDate) {
                        $query->where('membership_payments.status', 'paid')
                            ->whereNotIn('membership_payments.id', function ($q) {
                                $q->select('source_id')->from('financial_transactions')->where('source_type', MembershipPayment::class)->whereIn('status', ['refunded', 'disputed']);
                            })
                            ->whereBetween('membership_payments.created_at', [$threeMonthsAgo, $currentDate]);
                    },
                    'followers as supporters_count',
                ])
                ->orderBy('total_memberships', 'desc')
                ->take(10)
                ->get()
                ->map(function ($user) {
                    return [
                        'id' => $user->id,
                        'name' => $user->name,
                        'username' => $user->username,
                        'avatar_url' => $user->avatar_url,
                        'profile_status_lock' => $user->profile_status_lockNone,
                        'verified_badge' => VerifiedBadge::tierFor($user),
                        'is_founder' => $user->is_founder ?? false,
                        'role' => $user->role,
                        'total_amount' => (float) $user->total_memberships,
                        'total_count' => $user->total_count,
                        'supporters_count' => $user->supporters_count,
                        'currency' => strtoupper($user->default_currency ?? 'GBP'),
                    ];
                });

            // Get bills leaders
            $billsLeaders = User::where('stripe_details_submitted', 1)
                ->where('suspended_account', 0)
                ->whereHas('bill_payments', function ($query) use ($threeMonthsAgo, $currentDate) {
                    $query->where('bill_payments.status', 'paid')
                        ->whereNotIn('bill_payments.id', function ($q) {
                            $q->select('source_id')->from('financial_transactions')->where('source_type', BillPayment::class)->whereIn('status', ['refunded', 'disputed']);
                        })
                        ->whereBetween('bill_payments.created_at', [$threeMonthsAgo, $currentDate]);
                })
                ->withCount([
                    'bill_payments as total_bills' => function ($query) use ($threeMonthsAgo, $currentDate) {
                        $query->select(DB::raw('COALESCE(SUM(amount), 0)'))
                            ->where('bill_payments.status', 'paid')
                            ->whereNotIn('bill_payments.id', function ($q) {
                                $q->select('source_id')->from('financial_transactions')->where('source_type', BillPayment::class)->whereIn('status', ['refunded', 'disputed']);
                            })
                            ->whereBetween('bill_payments.created_at', [$threeMonthsAgo, $currentDate]);
                    },
                    'bill_payments as total_count' => function ($query) use ($threeMonthsAgo, $currentDate) {
                        $query->where('bill_payments.status', 'paid')
                            ->whereNotIn('bill_payments.id', function ($q) {
                                $q->select('source_id')->from('financial_transactions')->where('source_type', BillPayment::class)->whereIn('status', ['refunded', 'disputed']);
                            })
                            ->whereBetween('bill_payments.created_at', [$threeMonthsAgo, $currentDate]);
                    },
                    'followers as supporters_count',
                ])
                ->orderBy('total_bills', 'desc')
                ->take(10)
                ->get()
                ->map(function ($user) {
                    return [
                        'id' => $user->id,
                        'name' => $user->name,
                        'username' => $user->username,
                        'avatar_url' => $user->avatar_url,
                        'profile_status_lock' => $user->profile_status_lockNone,
                        'verified_badge' => VerifiedBadge::tierFor($user),
                        'is_founder' => $user->is_founder ?? false,
                        'role' => $user->role,
                        'total_amount' => (float) $user->total_bills,
                        'total_count' => $user->total_count,
                        'supporters_count' => $user->supporters_count,
                        'currency' => strtoupper($user->default_currency ?? 'GBP'),
                    ];
                });

            // Get shop leaders
            $shopLeaders = User::where('stripe_details_submitted', 1)
                ->where('suspended_account', 0)
                ->whereHas('shop_payments', function ($query) use ($threeMonthsAgo, $currentDate) {
                    $query->where('shop_payments.payment_status', 'paid')
                        ->whereNotIn('shop_payments.id', function ($q) {
                            $q->select('source_id')->from('financial_transactions')->where('source_type', ShopPayment::class)->whereIn('status', ['refunded', 'disputed']);
                        })
                        ->whereBetween('shop_payments.created_at', [$threeMonthsAgo, $currentDate]);
                })
                ->withCount([
                    'shop_payments as total_shop' => function ($query) use ($threeMonthsAgo, $currentDate) {
                        $query->select(DB::raw('COALESCE(SUM(amount), 0)'))
                            ->where('shop_payments.payment_status', 'paid')
                            ->whereNotIn('shop_payments.id', function ($q) {
                                $q->select('source_id')->from('financial_transactions')->where('source_type', ShopPayment::class)->whereIn('status', ['refunded', 'disputed']);
                            })
                            ->whereBetween('shop_payments.created_at', [$threeMonthsAgo, $currentDate]);
                    },
                    'shop_payments as total_count' => function ($query) use ($threeMonthsAgo, $currentDate) {
                        $query->where('shop_payments.payment_status', 'paid')
                            ->whereNotIn('shop_payments.id', function ($q) {
                                $q->select('source_id')->from('financial_transactions')->where('source_type', ShopPayment::class)->whereIn('status', ['refunded', 'disputed']);
                            })
                            ->whereBetween('shop_payments.created_at', [$threeMonthsAgo, $currentDate]);
                    },
                    'followers as supporters_count',
                ])
                ->orderBy('total_shop', 'desc')
                ->take(10)
                ->get()
                ->map(function ($user) {
                    return [
                        'id' => $user->id,
                        'name' => $user->name,
                        'username' => $user->username,
                        'avatar_url' => $user->avatar_url,
                        'profile_status_lock' => $user->profile_status_lockNone,
                        'verified_badge' => VerifiedBadge::tierFor($user),
                        'is_founder' => $user->is_founder ?? false,
                        'role' => $user->role,
                        'total_amount' => (float) $user->total_shop,
                        'total_count' => $user->total_count,
                        'supporters_count' => $user->supporters_count,
                        'currency' => strtoupper($user->default_currency ?? 'GBP'),
                    ];
                });

            return response()->json([
                'success' => true,
                'data' => [
                    'wishes' => $wishesLeaders,
                    'subscriptions' => $subscriptionsLeaders,
                    'tips' => $tipsLeaders,
                    'memberships' => $membershipsLeaders,
                    'bills' => $billsLeaders,
                    'shop' => $shopLeaders,
                ],
            ]);
        } catch (\Exception $e) {
            Log::error('Category leaders error: '.$e->getMessage());

            return response()->json([
                'success' => false,
                'error' => 'Unable to fetch category leaders',
                'data' => [
                    'wishes' => [],
                    'subscriptions' => [],
                    'tips' => [],
                    'memberships' => [],
                    'bills' => [],
                    'shop' => [],
                ],
            ]);
        }
    }

    /**
     * Get VIP Supporters - Most active and generous supporters
     */
    public function vipSupporters()
    {
        try {
            // Use the past 3 months for recent supporter activity
            $threeMonthsAgo = Carbon::now()->subMonths(3);
            $currentDate = Carbon::now();
            $currencyRates = Currency::whereNotNull('conversion_rate')
                ->pluck('conversion_rate', 'ISO')
                ->mapWithKeys(fn ($rate, $iso) => [strtoupper($iso) => (float) $rate])
                ->toArray();

            $supporters = [];

            // Helper function to accumulate supporter data
            $addSupporterData = function (&$supporters, $user, $amount, $currency, $type, $createdAt) use ($currencyRates) {
                $username = $user->username ?? 'anonymous_'.($user->id ?? uniqid());
                $normalizedAmount = $this->normalizeToGbp((float) $amount, $currency, $currencyRates);

                if (! isset($supporters[$username])) {
                    $supporters[$username] = [
                        'id' => $user->id,
                        'name' => $user->name ?? 'Anonymous',
                        'username' => $user->username ?? 'Anonymous',
                        'avatar_url' => $user->avatar_url ?? null,
                        'cover_url' => $user->cover_url ?? null,
                        'role' => $user->role ?? 0,
                        'profile_status_lock' => $user->profile_status_lock ?? 1,
                        'verified_badge' => VerifiedBadge::tierFor($user),
                        'is_founder' => $user->is_founder ?? false,
                        'total_amount' => 0,
                        'total_gifts' => 0,
                        'creators_supported' => [],
                        'support_types' => [],
                        'currency' => 'GBP',
                        'latest_support_date' => $createdAt,
                        'vip_score' => 0,
                    ];
                }

                $supporters[$username]['total_amount'] += $normalizedAmount;
                $supporters[$username]['total_gifts']++;

                // Track unique support types
                if (! in_array($type, $supporters[$username]['support_types'])) {
                    $supporters[$username]['support_types'][] = $type;
                }

                // Update latest support date if more recent
                if ($createdAt > $supporters[$username]['latest_support_date']) {
                    $supporters[$username]['latest_support_date'] = $createdAt;
                }
            };

            // Wishlist Payments
            $wishes = StripePaymentItems::whereHas('payment', function ($q) use ($threeMonthsAgo, $currentDate) {
                $q->where('payment_status', 'paid')
                    ->whereNotIn('id', function ($sub) {
                        $sub->select('source_id')->from('financial_transactions')->where('source_type', StripePaymentDetail::class)->whereIn('status', ['refunded', 'disputed']);
                    })
                    ->whereBetween('stripe_payment_details.created_at', [$threeMonthsAgo, $currentDate]);
            })->with(['payment.user', 'wish.user'])->get();

            foreach ($wishes as $item) {
                $user = $item->payment->user ?? null;
                $creator = $item->wish->user ?? null;
                if ($user && $creator) {
                    $addSupporterData($supporters, $user, $item->amount, $item->payment->currency, 'wish', $item->created_at);
                    // Track creators supported
                    if (! in_array($creator->id, $supporters[$user->username]['creators_supported'] ?? [])) {
                        $supporters[$user->username]['creators_supported'][] = $creator->id;
                    }
                }
            }

            // Wishlist Subscriptions
            $subscriptions = WishItemSubscription::with(['user', 'wish_item.user'])
                ->where('status', 'paid')
                ->whereNotIn('id', function ($q) {
                    $q->select('source_id')->from('financial_transactions')->where('source_type', WishItemSubscription::class)->whereIn('status', ['refunded', 'disputed']);
                })
                ->whereBetween('created_at', [$threeMonthsAgo, $currentDate])
                ->get();

            foreach ($subscriptions as $sub) {
                $user = $sub->user;
                $creator = $sub->wish_item->user ?? null;
                if ($user && $creator) {
                    $addSupporterData($supporters, $user, $sub->amount, $sub->currency, 'subscription', $sub->created_at);
                    if (! in_array($creator->id, $supporters[$user->username]['creators_supported'] ?? [])) {
                        $supporters[$user->username]['creators_supported'][] = $creator->id;
                    }
                }
            }

            // Tips
            $tips = TipGoalsPayment::with(['user', 'creator'])
                ->where('status', 'paid')
                ->whereNotIn('id', function ($q) {
                    $q->select('source_id')->from('financial_transactions')->where('source_type', TipGoalsPayment::class)->whereIn('status', ['refunded', 'disputed']);
                })
                ->whereBetween('created_at', [$threeMonthsAgo, $currentDate])
                ->get();

            foreach ($tips as $tip) {
                $user = $tip->user;
                $creator = $tip->creator ?? null;
                if ($user && $creator) {
                    $addSupporterData($supporters, $user, $tip->amount, $tip->currency, 'tip', $tip->created_at);
                    if (! in_array($creator->id, $supporters[$user->username]['creators_supported'] ?? [])) {
                        $supporters[$user->username]['creators_supported'][] = $creator->id;
                    }
                }
            }

            // Memberships
            $members = MembershipPayment::with(['user', 'membership.user'])
                ->where('status', 'paid')
                ->whereNotIn('id', function ($q) {
                    $q->select('source_id')->from('financial_transactions')->where('source_type', MembershipPayment::class)->whereIn('status', ['refunded', 'disputed']);
                })
                ->whereBetween('created_at', [$threeMonthsAgo, $currentDate])
                ->get();

            foreach ($members as $member) {
                $user = $member->user;
                $creator = $member->membership->user ?? null;
                if ($user && $creator) {
                    $addSupporterData($supporters, $user, $member->amount, $member->currency, 'membership', $member->created_at);
                    if (! in_array($creator->id, $supporters[$user->username]['creators_supported'] ?? [])) {
                        $supporters[$user->username]['creators_supported'][] = $creator->id;
                    }
                }
            }

            // Bills
            $bills = BillPayment::with(['user', 'bill.user'])
                ->where('status', 'paid')
                ->whereNotIn('id', function ($q) {
                    $q->select('source_id')->from('financial_transactions')->where('source_type', BillPayment::class)->whereIn('status', ['refunded', 'disputed']);
                })
                ->whereBetween('created_at', [$threeMonthsAgo, $currentDate])
                ->get();

            foreach ($bills as $bill) {
                $user = $bill->user;
                $creator = $bill->bill->user ?? null;
                if ($user && $creator) {
                    $addSupporterData($supporters, $user, $bill->amount, $bill->currency, 'bill', $bill->created_at);
                    if (! in_array($creator->id, $supporters[$user->username]['creators_supported'] ?? [])) {
                        $supporters[$user->username]['creators_supported'][] = $creator->id;
                    }
                }
            }

            // Shop purchases
            $shopPurchases = ShopPayment::with(['user', 'shop.user'])
                ->where('payment_status', 'paid')
                ->whereNotIn('id', function ($q) {
                    $q->select('source_id')->from('financial_transactions')->where('source_type', ShopPayment::class)->whereIn('status', ['refunded', 'disputed']);
                })
                ->whereBetween('created_at', [$threeMonthsAgo, $currentDate])
                ->get();

            foreach ($shopPurchases as $purchase) {
                $user = $purchase->user;
                $creator = $purchase->shop->user ?? null;
                if ($user && $creator) {
                    $addSupporterData($supporters, $user, $purchase->amount, $purchase->currency ?? 'GBP', 'shop', $purchase->created_at);
                    if (! in_array($creator->id, $supporters[$user->username]['creators_supported'] ?? [])) {
                        $supporters[$user->username]['creators_supported'][] = $creator->id;
                    }
                }
            }

            // Calculate VIP score for each supporter
            foreach ($supporters as &$supporter) {
                $supporter['creators_supported_count'] = count($supporter['creators_supported']);
                $supporter['support_types_count'] = count($supporter['support_types']);

                // VIP Score calculation:
                // - Total amount (normalized to 0-40 points)
                // - Number of gifts (up to 30 points)
                // - Diversity of creators supported (up to 20 points)
                // - Variety of support types (up to 10 points)
                // Canonical formula — single source of truth shared with the gifter hub.
                $supporter['vip_score'] = VipScoreService::scoreFromTotals(
                    $supporter['total_amount'],
                    $supporter['total_gifts'],
                    $supporter['creators_supported_count'],
                    $supporter['support_types_count'],
                    $supporter['latest_support_date'],
                    $currentDate
                );

                // Clean up internal arrays
                unset($supporter['creators_supported']);
            }

            // Sort by VIP score and take top 15
            $topVipSupporters = collect($supporters)
                ->sortByDesc('vip_score')
                ->values()
                ->take(15)
                ->map(function ($supporter, $index) {
                    return array_merge($supporter, [
                        'rank' => $index + 1,
                        'vip_level' => $this->getVipLevel($supporter['vip_score']),
                        'latest_support_date' => Carbon::parse($supporter['latest_support_date'])->format('M j, Y'),
                    ]);
                });

            return response()->json([
                'success' => true,
                'data' => $topVipSupporters,
                'message' => 'VIP supporters retrieved successfully',
            ]);
        } catch (\Exception $e) {
            Log::error('VIP Supporters error: '.$e->getMessage());

            return response()->json([
                'success' => false,
                'error' => 'Unable to fetch VIP supporters',
                'data' => [],
                'message' => 'Failed to load VIP supporters data',
            ]);
        }
    }

    /**
     * Determine the engagement Level (1-5) from the engagement score.
     */
    private function getVipLevel($score)
    {
        // Canonical thresholds — single source of truth shared with the gifter hub.
        return VipScoreService::tier((float) $score);
    }

    private function normalizeToGbp(float $amount, ?string $currency, array $currencyRates): float
    {
        $iso = strtoupper($currency ?: 'GBP');
        $rate = (float) ($currencyRates[$iso] ?? 0);
        if ($rate <= 0) {
            return $amount;
        }

        return round($amount / $rate, 2, PHP_ROUND_HALF_UP);
    }

    /**
     * Get growth trends data for creators and platform statistics
     */
    public function growthTrends()
    {
        try {
            $currentMonth = Carbon::now()->month;
            $currentYear = Carbon::now()->year;
            $currentWeekStartDate = Carbon::now()->startOfWeek();
            $currentWeekEndDate = Carbon::now()->endOfWeek();

            // Get total active creators
            $totalCreators = User::where('stripe_details_submitted', 1)
                ->where('suspended_account', 0)
                ->count();

            $totalCreatorsLastMonth = User::where('stripe_details_submitted', 1)
                ->where('suspended_account', 0)
                ->where('created_at', '<', Carbon::now()->startOfMonth())
                ->count();

            $creatorsGrowth = $totalCreatorsLastMonth > 0 ? round((($totalCreators - $totalCreatorsLastMonth) / $totalCreatorsLastMonth) * 100, 1) : 0;

            // Get creators with recent growth in followers
            $fastestGrowingCreators = User::where('stripe_details_submitted', 1)
                ->where('suspended_account', 0)
                ->withCount(['followers as followers_count' => function ($q) use ($currentMonth, $currentYear) {
                    $q->whereYear('follows.created_at', $currentYear)->whereMonth('follows.created_at', $currentMonth);
                }])
                ->having('followers_count', '>', 0)
                ->orderBy('followers_count', 'desc')
                ->take(10)
                ->get()
                ->map(function ($user) {
                    $totalFollowers = Follow::where('followed_id', $user->id)->count();
                    $previousFollowers = max(1, $totalFollowers - $user->followers_count);
                    $growthPercent = round(($user->followers_count / $previousFollowers) * 100, 1);

                    return [
                        'id' => $user->id,
                        'name' => $user->name,
                        'username' => $user->username,
                        'avatar_url' => $user->avatar_url,
                        'profile_status_lock' => $user->profile_status_lockNone,
                        'verified_badge' => VerifiedBadge::tierFor($user),
                        'is_founder' => $user->is_founder ?? false,
                        'role' => $user->role,
                        'supporters' => $user->followers_count,
                        'growth_percentage' => $growthPercent,
                        'current_amount' => 0,
                        'currency' => $user->default_currency ?? 'GBP',
                    ];
                });

            // Get momentum leaders (weekly active creators)
            $momentumLeaders = User::where('stripe_details_submitted', 1)
                ->where('suspended_account', 0)
                ->withCount(['followers as followers_count' => function ($q) use ($currentWeekStartDate, $currentWeekEndDate) {
                    $q->whereBetween('follows.created_at', [$currentWeekStartDate, $currentWeekEndDate]);
                }])
                ->having('followers_count', '>', 0)
                ->orderBy('followers_count', 'desc')
                ->take(10)
                ->get()
                ->map(function ($user) {
                    $totalFollowers = Follow::where('followed_id', $user->id)->count();
                    $previousFollowers = max(1, $totalFollowers - $user->followers_count);
                    $growthPercent = round(($user->followers_count / $previousFollowers) * 100, 1);

                    return [
                        'id' => $user->id,
                        'name' => $user->name,
                        'username' => $user->username,
                        'avatar_url' => $user->avatar_url,
                        'profile_status_lock' => $user->profile_status_lockNone,
                        'verified_badge' => VerifiedBadge::tierFor($user),
                        'is_founder' => $user->is_founder ?? false,
                        'role' => $user->role,
                        'supporters' => $user->followers_count,
                        'growth_percentage' => $growthPercent,
                        'current_amount' => 0,
                        'currency' => $user->default_currency ?? 'GBP',
                    ];
                });

            // Get total interactions (followers)
            $totalInteractions = DB::table('follows')->count();

            $totalInteractionsLastMonth = DB::table('follows')
                ->where('created_at', '<', Carbon::now()->startOfMonth())
                ->count();

            $interactionsGrowth = $totalInteractionsLastMonth > 0 ? round((($totalInteractions - $totalInteractionsLastMonth) / $totalInteractionsLastMonth) * 100, 1) : 0;

            // Get new supporters this month
            $newSupporters = DB::table('follows')
                ->whereYear('created_at', $currentYear)
                ->whereMonth('created_at', $currentMonth)
                ->count();

            $newSupportersLastMonth = DB::table('follows')
                ->whereYear('created_at', Carbon::now()->subMonth()->year)
                ->whereMonth('created_at', Carbon::now()->subMonth()->month)
                ->count();

            $supportersGrowth = $newSupportersLastMonth > 0 ? round((($newSupporters - $newSupportersLastMonth) / $newSupportersLastMonth) * 100, 1) : 0;

            $platformStats = [
                'total_creators' => $totalCreators,
                'creators_growth' => $creatorsGrowth,
                'total_interactions' => $totalInteractions,
                'engagement_growth' => $interactionsGrowth,
                'new_supporters' => $newSupporters,
                'supporters_growth' => $supportersGrowth,
                'avg_community_score' => $totalCreators > 0 ? round($totalInteractions / $totalCreators, 1) : 0,
                'community_growth' => 0,
                'monthly_revenue' => 0,
                'revenue_growth' => 0,
                'avg_support' => 0,
                'avg_growth' => 0,
            ];

            return response()->json([
                'success' => true,
                'data' => [
                    'fastest_growing' => $fastestGrowingCreators,
                    'momentum_leaders' => $momentumLeaders,
                    'comeback_creators' => [], // Empty for now, can be populated later
                    'platform_stats' => $platformStats,
                ],
            ]);
        } catch (\Exception $e) {
            Log::error('Growth trends error: '.$e->getMessage());

            // Return default structure with empty data in case of error
            return response()->json([
                'success' => false,
                'error' => 'Unable to fetch growth trends',
                'data' => [
                    'fastest_growing' => [],
                    'momentum_leaders' => [],
                    'comeback_creators' => [],
                    'platform_stats' => [
                        'total_creators' => 0,
                        'creators_growth' => 0,
                        'total_interactions' => 0,
                        'engagement_growth' => 0,
                        'new_supporters' => 0,
                        'supporters_growth' => 0,
                        'avg_community_score' => 0,
                        'community_growth' => 0,
                        'monthly_revenue' => 0,
                        'revenue_growth' => 0,
                        'avg_support' => 0,
                        'avg_growth' => 0,
                    ],
                ],
            ]);
        }
    }
}
