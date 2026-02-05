<?php

namespace App\Http\Controllers\Auth;

use App\Helpers;
use App\Http\Controllers\Controller;
use App\Models\BillPayment;
use App\Models\MembershipPayment;
use App\Models\ShopPayment;
use App\Models\StripePaymentDetail;
use App\Models\StripePaymentItems;
use App\Models\TaskPurchase;
use App\Models\TipGoalsPayment;
use App\Models\User;
use App\Models\WishItemSubscription;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Pagination\Paginator;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Cache;
use Inertia\Inertia;

class LeaderBoardController extends Controller
{
    private function ttlForType($type)
    {
        return match ($type) {
            'daily' => 600,
            'weekly' => 1200,
            'monthly' => 1800,
            default => 600,
        };
    }
    public function wishtenderWishers($type = null)
    {
        if (Auth::user() && Auth::user()->suspended_account == 1) {
            return Inertia::render('Suspanded');
        }

        $getData = function() use ($type) {
            return $this->calc($type);
        };

        if (Auth::check()) {
            $users = $getData();
        } else {
            $cacheKey = 'leaderboard_' . ($type ?? 'all') . '_' . request()->get('page', 1);
            $users = Cache::remember($cacheKey, $this->ttlForType($type ?? 'daily'), $getData);
        }

        $perPage = 50;
        $page = request()->get('page', 1);
        $paginator = new \Illuminate\Pagination\LengthAwarePaginator(
            $users->forPage($page, $perPage),
            $users->count(),
            $perPage,
            $page,
            ['path' => request()->url(), 'query' => request()->query()]
        );
        $data = [];
        $rank = 1;
        foreach ($paginator as $query) {
            $data[] = [
                'id' => $query->id,
                'rank' => $rank,
                'name' => $query->name ?? '',
                'username' => $query->username ?? '',
                'profile_status_lock' => $query->profile_status_lock,
                'role' => $query->role,
                'avatar' => $query->avatar_url,
                'avatar' => $query->avatar_url,
                'coverimg' =>  $query->cover_url,
                'top' => $rank / 100,
                'amount' => $query->total_amount,
                'supporters' => $query->total_supporters ?? 0,
                'engagement' => $query->engagement_score ?? 0
            ];
            $rank++;
        }
        if (empty($type)) {
            $is_daily = 0;
            $daily = $this->calc('daily');
            foreach ($daily as $key => $value) {
                if ($value->total_amount > 0) {
                    $is_daily = 1;
                }
            }

            return Inertia::render('leaderboard/Board', [
                "data" => $data,
                "is_daily" => $is_daily
            ]);
        }

        // Leaderboard stars
        return response()->json([
            "success" => true,
            'data' => $data,
            "message" => 'Wishtender wishes get successfully',
            "last_page" => $paginator->lastPage() ?? null,
            "current_page" => $paginator->currentPage() ?? null,
            "total" => $paginator->total() ?? null,
            "per_page" => $paginator->perPage() ?? null,
            "stars" => $paginator->perPage() ?? null,
        ]);
    }


    public function calc($type)
    {
        $currentMonth = Carbon::now()->month;
        $currentYear = Carbon::now()->year;
        $currentWeekStartDate = Carbon::now()->startOfWeek();
        $currentWeekEndDate = Carbon::now()->endOfWeek();
        $currentDate = Carbon::today()->format('Y-m-d');

        $users = User::where('stripe_details_submitted', 1)
            ->where('suspended_account', 0)
            ->where('is_uk', 0)
            ->withCount(['followers as followers_count', 'following as following_count'])
            ->withCount([
                'paymentitems as total_payments' => function ($query) use ($type, $currentMonth, $currentYear, $currentWeekStartDate, $currentWeekEndDate, $currentDate) {
                    $query->select(DB::raw("COALESCE(SUM(amount), 0)"))->where('stripe_payment_details.payment_status', 'paid');
                    if ($type == 'monthly') {
                        $query->whereYear('stripe_payment_items.created_at', '=', $currentYear)
                            ->whereMonth('stripe_payment_items.created_at', $currentMonth);
                    } elseif ($type == 'weekly') {
                        $query->whereBetween('stripe_payment_items.created_at', [$currentWeekStartDate, $currentWeekEndDate]);
                    } elseif ($type == 'daily') {
                        $query->whereDate('stripe_payment_items.created_at', $currentDate);
                    }
                },
                'subscriptions as total_subscriptions' => function ($query) use ($type, $currentMonth, $currentYear, $currentWeekStartDate, $currentWeekEndDate, $currentDate) {
                    $query->select(DB::raw("COALESCE(SUM(amount), 0)"))->where('wish_item_subscriptions.status', 'paid');

                    if ($type == 'monthly') {
                        $query->whereYear('wish_item_subscriptions.created_at', '=', $currentYear)
                            ->whereMonth('wish_item_subscriptions.created_at', $currentMonth);
                    } elseif ($type == 'weekly') {
                        $query->whereBetween('wish_item_subscriptions.created_at', [$currentWeekStartDate, $currentWeekEndDate]);
                    } elseif ($type == 'daily') {
                        $query->whereDate('wish_item_subscriptions.created_at', $currentDate);
                    }
                },
                'tip_goal_payment as total_tips' => function ($query) use ($type, $currentMonth, $currentYear, $currentWeekStartDate, $currentWeekEndDate, $currentDate) {
                    $query->select(DB::raw("COALESCE(SUM(amount), 0)"))->where('tip_goals_payments.status', 'paid');

                    if ($type == 'monthly') {
                        $query->whereYear('tip_goals_payments.created_at', '=', $currentYear)
                            ->whereMonth('tip_goals_payments.created_at', $currentMonth);
                    } elseif ($type == 'weekly') {
                        $query->whereBetween('tip_goals_payments.created_at', [$currentWeekStartDate, $currentWeekEndDate]);
                    } elseif ($type == 'daily') {
                        $query->whereDate('tip_goals_payments.created_at', $currentDate);
                    }
                },
                'membership_payments as total_member' => function ($query) use ($type, $currentMonth, $currentYear, $currentWeekStartDate, $currentWeekEndDate, $currentDate) {
                    $query->select(DB::raw("COALESCE(SUM(amount), 0)"))->where('membership_payments.status', 'paid');

                    if ($type == 'monthly') {
                        $query->whereYear('membership_payments.created_at', '=', $currentYear)
                            ->whereMonth('membership_payments.created_at', $currentMonth);
                    } elseif ($type == 'weekly') {
                        $query->whereBetween('membership_payments.created_at', [$currentWeekStartDate, $currentWeekEndDate]);
                    } elseif ($type == 'daily') {
                        $query->whereDate('membership_payments.created_at', $currentDate);
                    }
                },
                'bill_payments as total_bill' => function ($query) use ($type, $currentMonth, $currentYear, $currentWeekStartDate, $currentWeekEndDate, $currentDate) {
                    $query->select(DB::raw("COALESCE(SUM(amount), 0)"))->where('bill_payments.status', 'paid');

                    if ($type == 'monthly') {
                        $query->whereYear('bill_payments.created_at', '=', $currentYear)
                            ->whereMonth('bill_payments.created_at', $currentMonth);
                    } elseif ($type == 'weekly') {
                        $query->whereBetween('bill_payments.created_at', [$currentWeekStartDate, $currentWeekEndDate]);
                    } elseif ($type == 'daily') {
                        $query->whereDate('bill_payments.created_at', $currentDate);
                    }
                },
                'shop_payments as total_shop' => function ($query) use ($type, $currentMonth, $currentYear, $currentWeekStartDate, $currentWeekEndDate, $currentDate) {
                    $query->select(DB::raw("COALESCE(SUM(amount), 0)"))->where('shop_payments.payment_status', 'paid');

                    if ($type == 'monthly') {
                        $query->whereYear('shop_payments.created_at', '=', $currentYear)
                            ->whereMonth('shop_payments.created_at', $currentMonth);
                    } elseif ($type == 'weekly') {
                        $query->whereBetween('shop_payments.created_at', [$currentWeekStartDate, $currentWeekEndDate]);
                    } elseif ($type == 'daily') {
                        $query->whereDate('shop_payments.created_at', $currentDate);
                    }
                },
            ])
            ->orderByDesc(DB::raw('total_payments + total_subscriptions + total_tips + total_member + total_bill + total_shop'))
            ->get(['id','name','username','avatar','cover','cover_cdn_modifier','profile_status_lock','role','default_currency']);

        $users->map(function ($user) {
            // Calculate monetary metrics (for backward compatibility)
            $user->total_payments = Helpers::priceFormat($user->default_currency, $user->total_payments, 'USD');
            $user->total_subscriptions = Helpers::priceFormat($user->default_currency, $user->total_subscriptions, 'USD');
            $user->total_tips = Helpers::priceFormat($user->default_currency, $user->total_tips, 'USD');
            $user->total_member = Helpers::priceFormat($user->default_currency, $user->total_member, 'USD');
            $user->total_bill = Helpers::priceFormat($user->default_currency, $user->total_bill, 'USD');
            $user->total_shop = Helpers::priceFormat($user->default_currency, $user->total_shop, 'USD');

            // Calculate total monetary amount (legacy metric) with NaN protection
            $amounts = [
                $user->total_payments,
                $user->total_subscriptions,
                $user->total_tips,
                $user->total_member,
                $user->total_bill,
                $user->total_shop
            ];

            // Filter out NaN values and ensure we have valid numbers
            $validAmounts = array_filter($amounts, function ($amount) {
                return is_numeric($amount) && !is_nan($amount) && is_finite($amount);
            });

            $user->total_amount = array_sum($validAmounts);

            // Calculate social engagement metrics
            $user->total_supporters = $user->followers_count;

            // Calculate engagement score based on followers and content
            $engagementScore = $user->followers_count * 2; // 2 points per follower

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

            $users = User::where('is_uk', 0)
                // where(function ($q) {
                //     $q->whereNot('country', 'GB')->orWhereNull('country');
                // })
                ->with(['paymentitems', 'subscriptions', 'tip_goal_payment'])
                ->withCount([
                    'paymentitems as total_payments' => function ($query) use ($type, $currentMonth, $currentYear, $currentWeekStartDate, $currentWeekEndDate, $currentDate) {
                        $query->select(DB::raw("COALESCE(SUM(amount), 0)"));
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
                        $query->select(DB::raw("COALESCE(SUM(amount), 0)"));

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
                        $query->select(DB::raw("COALESCE(SUM(amount), 0)"));

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
                ->get();

            $data = [];
            $rank = 1;
            foreach ($users as $query) {
                $data[] = [
                    'rank' => $rank,
                    'name' => $query->name ?? '',
                    'username' => $query->username ?? '',
                    'avatar' => $query->avatar_url,
                    'coverimg' =>  $query->cover_url,
                    'top' => $rank / 100,
                ];
                $rank++;
            }

            if (empty($type)) {
                return Inertia::render('leaderboard/Board', [
                    "data" => $data,
                ]);
            }

            return response()->json([
                "success" => true,
                'data' => $data,
                "message" => 'Top supporters by frequency retrieved successfully',
            ]);
        } catch (\Exception $e) {
            return response()->json([
                "success" => false,
                "message" => 'Something went wrong',
                "error" => $e->getMessage()
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
            // Calculate basic platform statistics from existing data
            $totalUsers = User::where('stripe_details_submitted', 1)
                ->where('suspended_account', 0)
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

            // Basic stub data to prevent JavaScript errors
            $data = [
                'overview' => [
                    'active_creators' => $activeCreators,
                    'total_supporters' => $totalSupporters,
                    'avg_growth' => 12.5, // Placeholder
                    'creators_trend' => [
                        'positive' => true,
                        'percentage' => 8.2
                    ],
                    'supporters_trend' => [
                        'positive' => true,
                        'percentage' => 15.7
                    ]
                ],
                'milestones' => [
                    [
                        'title' => '1K Active Creators',
                        'description' => 'Reach 1,000 active creators on the platform',
                        'current' => $activeCreators,
                        'target' => 1000
                    ],
                    [
                        'title' => '10K Total Users',
                        'description' => 'Reach 10,000 registered users',
                        'current' => $totalUsers,
                        'target' => 10000
                    ]
                ],
                'countries' => [
                    ['code' => 'US', 'name' => 'United States', 'flag' => '🇺🇸', 'creators' => 145, 'supporters' => 1250],
                    ['code' => 'GB', 'name' => 'United Kingdom', 'flag' => '🇬🇧', 'creators' => 89, 'supporters' => 890],
                    ['code' => 'CA', 'name' => 'Canada', 'flag' => '🇨🇦', 'creators' => 67, 'supporters' => 650]
                ],
                'achievements' => [
                    [
                        'icon' => '🎉',
                        'title' => 'Platform Milestone Reached',
                        'description' => 'Celebrated our latest growth milestone',
                        'date' => 'Today'
                    ]
                ]
            ];

            return response()->json([
                "success" => true,
                'data' => $data,
                "message" => 'Platform analytics retrieved successfully',
            ]);
        } catch (\Exception $e) {
            Log::error('Platform analytics error: ' . $e->getMessage());
            return response()->json([
                "success" => false,
                "message" => 'Failed to retrieve platform analytics',
                "error" => $e->getMessage()
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
                    ->where('created_at', '>', $last24hour);
            })->with('payment.user')->get();

            foreach ($wishes as $item) {
                $user = $item->payment->user ?? null;
                if ($user) {
                    $gifters[] = [
                        'id' => $user->id,
                        'name' => $user->name ?? "Anonymous",
                        'username' => $user->username ?? "Anonymous",
                        'avatar_url' => $user->avatar_url ?? null,
                        'cover_url' => $user->cover_url ?? 'Anonymous',
                        'role' => $user->role ?? 'Anonymous',
                        'profile_status_lock' => $user->profile_status_lock ?? 1,
                        'amount' => $item->amount,
                        'currency' => $item->payment->currency,
                    ];
                }
            }

            // Wishlist Subscriptions
            $subscriptions = WishItemSubscription::with('user')
                ->where('status', 'paid')
                ->where('created_at', '>', $last24hour)
                ->get();

            foreach ($subscriptions as $sub) {
                $user = $sub->user;
                $gifters[] = [
                    'id' => $user->id,
                    'name' => $user->name ?? "Anonymous",
                    'username' => $user->username ?? "Anonymous",
                    'avatar_url' => $user->avatar_url ?? null,
                    'cover_url' => $user->cover_url ?? 'Anonymous',
                    'role' => $user->role ?? 'Anonymous',
                    'profile_status_lock' => $user->profile_status_lock ?? 1,
                    'amount' => $sub->amount,
                    'currency' => $sub->currency,
                ];
            }

            // Tips
            $tips = TipGoalsPayment::with('user')
                ->where('status', 'paid')
                ->where('created_at', '>', $last24hour)
                ->get();

            foreach ($tips as $tip) {
                $user = $tip->user;
                $gifters[] = [
                    'id' => $user->id,
                    'name' => $user->name ?? "Anonymous",
                    'username' => $user->username ?? "Anonymous",
                    'avatar_url' => $user->avatar_url ?? null,
                    'cover_url' => $user->cover_url ?? 'Anonymous',
                    'role' => $user->role ?? 'Anonymous',
                    'profile_status_lock' => $user->profile_status_lock ?? 1,
                    'amount' => $tip->amount,
                    'currency' => $tip->currency,
                ];
            }

            // Memberships
            $members = MembershipPayment::with('user')
                ->where('status', 'paid')
                ->where('created_at', '>', $last24hour)
                ->get();

            foreach ($members as $member) {
                $user = $member->user;
                $gifters[] = [
                    'id' => $user->id,
                    'name' => $user->name ?? "Anonymous",
                    'username' => $user->username ?? "Anonymous",
                    'avatar_url' => $user->avatar_url ?? null,
                    'cover_url' => $user->cover_url ?? 'Anonymous',
                    'role' => $user->role ?? 'Anonymous',
                    'profile_status_lock' => $user->profile_status_lock ?? 1,
                    'amount' => $member->amount,
                    'currency' => $member->currency,
                ];
            }

            // Bills
            $bills = BillPayment::with('user')
                ->where('status', 'paid')
                ->where('created_at', '>', $last24hour)
                ->get();

            foreach ($bills as $bill) {
                $user = $bill->user;
                $gifters[] = [
                    'id' => $user->id,
                    'name' => $user->name ?? "Anonymous",
                    'username' => $user->username ?? "Anonymous",
                    'avatar_url' => $user->avatar_url ?? null,
                    'cover_url' => $user->cover_url ?? 'Anonymous',
                    'role' => $user->role ?? 'Anonymous',
                    'profile_status_lock' => $user->profile_status_lock ?? 1,
                    'amount' => $bill->amount,
                    'currency' => $bill->currency,
                ];
            }

            // Sort by amount (optional)
            usort($gifters, fn($a, $b) => $b['amount'] <=> $a['amount']);

            $gifters = collect($gifters)->unique('username')->values()->take(5);

            return response()->json([
                "status" => true,
                'data' => $gifters,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                "status" => false,
                "msg" => 'Something went wrong',
                "error" => $e->getMessage()
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
                            $query->where(function ($s) {
                                $s->whereNot('country', 'GB')->orWhereNull('country');
                            });
                        });
                    })->whereHas('payment', function ($q) {
                        $q->where('payment_status', 'paid');
                    })->orderBy('amount', 'DESC')->where('created_at', '>', $lasthour)->get();
                    $subscriptions = WishItemSubscription::whereHas('wish_item', function ($q) {
                        $q->whereHas('user', function ($query) {
                            $query->where(function ($s) {
                                $s->whereNot('country', 'GB')->orWhereNull('country');
                            });
                        });
                    })->where('status', 'paid')->orderBy('amount', 'DESC')->where('created_at', '>', $lasthour)->get();
                    $tips = TipGoalsPayment::whereHas('creator', function ($q) {
                        $q->where(function ($s) {
                            $s->whereNot('country', 'GB')->orWhereNull('country');
                        });
                    })->where('status', 'paid')->orderBy('amount', 'DESC')->where('created_at', '>', $lasthour)->get();

                    $members = MembershipPayment::whereHas('membership', function ($q) {
                        $q->whereHas('user', function ($query) {
                            $query->where(function ($s) {
                                $s->whereNot('country', 'GB')->orWhereNull('country');
                            });
                        });
                    })->where('status', 'paid')->orderBy('amount', 'DESC')->where('created_at', '>', $lasthour)->get();
                    $bills = BillPayment::whereHas('bill', function ($q) {
                        $q->whereHas('user', function ($query) {
                            $query->where(function ($s) {
                                $s->whereNot('country', 'GB')->orWhereNull('country');
                            });
                        });
                    })->where('status', 'paid')->orderBy('amount', 'DESC')->where('created_at', '>', $lasthour)->get();
                } else {
                    $last24hour = Carbon::now()->subHour(24);
                    $wishes = StripePaymentItems::whereHas('wish', function ($q) {
                        $q->whereHas('user', function ($query) {
                            $query->where(function ($s) {
                                $s->whereNot('country', 'GB')->orWhereNull('country');
                            });
                        });
                    })->whereHas('payment', function ($q) {
                        $q->where('payment_status', 'paid');
                    })->orderBy('amount', 'DESC')->where('created_at', '>', $last24hour)->get();
                    $subscriptions = WishItemSubscription::whereHas('wish_item', function ($q) {
                        $q->whereHas('user', function ($query) {
                            $query->where(function ($s) {
                                $s->whereNot('country', 'GB')->orWhereNull('country');
                            });
                        });
                    })->where('status', 'paid')->orderBy('amount', 'DESC')->where('created_at', '>', $last24hour)->get();
                    $tips = TipGoalsPayment::whereHas('creator', function ($q) {
                        $q->where(function ($s) {
                            $s->whereNot('country', 'GB')->orWhereNull('country');
                        });
                    })->where('status', 'paid')->orderBy('amount', 'DESC')->where('created_at', '>', $last24hour)->get();

                    $members = MembershipPayment::whereHas('membership', function ($q) {
                        $q->whereHas('user', function ($query) {
                            $query->where(function ($s) {
                                $s->whereNot('country', 'GB')->orWhereNull('country');
                            });
                        });
                    })->where('status', 'paid')->orderBy('amount', 'DESC')->where('created_at', '>', $last24hour)->get();
                    $bills = BillPayment::whereHas('bill', function ($q) {
                        $q->whereHas('user', function ($query) {
                            $query->where(function ($s) {
                                $s->whereNot('country', 'GB')->orWhereNull('country');
                            });
                        });
                    })->where('status', 'paid')->orderBy('amount', 'DESC')->where('created_at', '>', $last24hour)->get();
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
                        'currency' => $value->payment->currency
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
                        'currency' => $value->currency
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
                        'currency' => $value->currency
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
                        'currency' => $value->currency
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
                        'currency' => $value->currency
                    ];
                }

                usort($array, function ($a, $b) {
                    return $b['amount'] - $a['amount'];
                });

                return response()->json([
                    "status" => true,
                    'data' => $array,
                ]);
            } else {
                return response()->json([
                    "status" => false,
                    "msg" => 'Please enter valid type',
                ]);
            }
        } catch (\Exception $e) {
            return response()->json([
                "status" => false,
                "msg" => 'Something went wrong',
                "error" => $e
            ]);
        }
    }
    public function topGiftersAllTime()
    {
        try {
            $gifters = [];

            // Helper to accumulate amounts by username
            $addGifter = function (&$gifters, $user, $amount, $currency) {
                $username = $user->username ?? 'anonymous_' . ($user->id ?? uniqid());

                if (!isset($gifters[$username])) {
                    $gifters[$username] = [
                        'id' => $user->id ?? null,
                        'name' => $user->name ?? "Anonymous",
                        'username' => $user->username ?? "Anonymous",
                        'avatar_url' => $user->avatar_url ?? null,
                        'cover_url' => $user->cover_url ?? 'Anonymous',
                        'role' => $user->role ?? 'Anonymous',
                        'profile_status_lock' => $user->profile_status_lock ?? 1,
                        'amount' => 0,
                        'currency' => $currency,
                    ];
                }

                $gifters[$username]['amount'] += $amount;
            };

            // Wishlist Payments
            $wishes = StripePaymentItems::whereHas('payment', function ($q) {
                $q->where('payment_status', 'paid');
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
                ->get();

            foreach ($bills as $bill) {
                $user = $bill->user;
                if ($user) {
                    $addGifter($gifters, $user, $bill->amount, $bill->currency);
                }
            }

            $sortedGifters = collect($gifters)->sortByDesc('amount')->values();
            return response()->json([
                "status" => true,
                'data' => $sortedGifters,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                "status" => false,
                "msg" => 'Something went wrong',
                "error" => $e->getMessage()
            ]);
        }
    }



    public function top10UniqueBiggestGifters()
    {
        try {
            $gifters = [];

            $storeMaxPayment = function (&$gifters, $user, $amount, $currency, $type, $createdAt) {
                $username = $user->username ?? 'anonymous_' . ($user->id ?? uniqid());

                if (
                    !isset($gifters[$username]) ||
                    $amount > $gifters[$username]['amount']
                ) {
                    $gifters[$username] = [
                        'id' => $user->id ?? null,
                        'type' => $type,
                        'name' => $user->name ?? "Anonymous",
                        'username' => $user->username ?? "Anonymous",
                        'avatar_url' => $user->avatar_url ?? null,
                        'cover_url' => $user->cover_url ?? 'Anonymous',
                        'role' => $user->role ?? 'Anonymous',
                        'profile_status_lock' => $user->profile_status_lock ?? 1,
                        'amount' => $amount,
                        'currency' => $currency,
                        'created_at' => $createdAt,
                    ];
                }
            };

            // Wishlist Gifts
            $wishes = StripePaymentItems::whereHas('payment', fn($q) => $q->where('payment_status', 'paid'))
                ->with('payment.user')->get();

            foreach ($wishes as $item) {
                $user = $item->payment->user ?? null;
                if ($user) {
                    $storeMaxPayment($gifters, $user, $item->amount, $item->payment->currency, 'wishlist_gift', $item->created_at);
                }
            }

            // Subscriptions
            $subs = WishItemSubscription::with('user')->where('status', 'paid')->get();
            foreach ($subs as $sub) {
                if ($sub->user) {
                    $storeMaxPayment($gifters, $sub->user, $sub->amount, $sub->currency, 'subscription', $sub->created_at);
                }
            }

            // Tips
            $tips = TipGoalsPayment::with('user')->where('status', 'paid')->get();
            foreach ($tips as $tip) {
                if ($tip->user) {
                    $storeMaxPayment($gifters, $tip->user, $tip->amount, $tip->currency, 'tip', $tip->created_at);
                }
            }

            // Memberships
            $memberships = MembershipPayment::with('user')->where('status', 'paid')->get();
            foreach ($memberships as $member) {
                if ($member->user) {
                    $storeMaxPayment($gifters, $member->user, $member->amount, $member->currency, 'membership', $member->created_at);
                }
            }

            // Bills
            $bills = BillPayment::with('user')->where('status', 'paid')->get();
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
        $paginator = new \Illuminate\Pagination\LengthAwarePaginator(
            $users->forPage($page, $perPage),
            $users->count(),
            $perPage,
            $page,
            ['path' => request()->url(), 'query' => request()->query()]
        );

        $data = [];
        $rank = 1;
        foreach ($paginator as $query) {
            // Calculate period-specific engagement metrics
            $periodFollowers = $this->calculatePeriodFollowers($query, $type);

            $data[] = [
                'id' => $query->id,
                'rank' => $rank,
                'name' => $query->name ?? '',
                'username' => $query->username ?? '',
                'profile_status_lock' => $query->profile_status_lock,
                'role' => $query->role,
                'avatar' => $query->avatar_url,
                'coverimg' =>  $query->cover_url,
                'top' => $rank / 100,
                'amount' => $query->total_amount,
                'supporters' => $periodFollowers > 0 ? $periodFollowers : $query->total_supporters ?? 0,
                'engagement' => $query->engagement_score ?? 0,
                'combined_score' => $query->combined_score ?? $query->total_amount,
                'is_engagement_based' => $query->engagement_score > 0
            ];
            $rank++;
        }

        return response()->json([
            "success" => true,
            'data' => $data,
            "message" => 'Enhanced leaderboard data retrieved successfully',
            "last_page" => $paginator->lastPage() ?? null,
            "current_page" => $paginator->currentPage() ?? null,
            "total" => $paginator->total() ?? null,
            "per_page" => $paginator->perPage() ?? null,
            "period" => $type ?? 'all',
        ]);
    }

    /**
     * Calculate period-specific follower growth for engagement metrics
     */
    private function calculatePeriodFollowers($user, $type)
    {
        if (!$type) {
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
                $username = $user->username ?? 'anonymous_' . ($user->id ?? uniqid());

                if (!isset($supporters[$username])) {
                    $supporters[$username] = [
                        'id' => $user->id,
                        'name' => $user->name ?? "Anonymous",
                        'username' => $user->username ?? "Anonymous",
                        'avatar_url' => $user->avatar_url ?? null,
                        'cover_url' => $user->cover_url ?? 'Anonymous',
                        'role' => $user->role ?? 'Anonymous',
                        'profile_status_lock' => $user->profile_status_lock ?? 1,
                        'gift_count' => 0,
                        'currency' => $currency,
                        'support_types' => [],
                        'latest_support_type' => $type,
                    ];
                }

                $supporters[$username]['gift_count']++;
                $supporters[$username]['latest_support_type'] = $type;

                // Track unique support types
                if (!in_array($type, $supporters[$username]['support_types'])) {
                    $supporters[$username]['support_types'][] = $type;
                }
            };

            // Count wishlist payments
            $wishes = StripePaymentItems::whereHas('payment', function ($q) {
                $q->where('payment_status', 'paid');
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
        $user = User::where('id', Auth::id())
            ->where('is_uk', 0)
            ->firstOrFail();

        $now = Carbon::now();

        /* ---------------------------------
     | Date Range
     |----------------------------------*/
        match ($type) {
            'week' => [
                $start = $now->copy()->startOfWeek(),
                $end   = $now->copy()->endOfWeek(),
            ],
            'month' => [
                $start = $now->copy()->startOfMonth(),
                $end   = $now->copy()->endOfMonth(),
            ],
            default => [
                $start = $now->copy()->startOfDay(),
                $end   = $now->copy()->endOfDay(),
            ],
        };

        /* ---------------------------------
     | Base Queries
     |----------------------------------*/

        $singleWishQuery = StripePaymentItems::whereBetween('created_at', [$start, $end])
            ->whereHas('payment', fn($q) => $q->where('owner_id', $user->id))
            ->whereHas(
                'wish',
                fn($q) =>
                $q->whereNotNull('stripe_product_id')
                    ->where('user_id', $user->id)
            )
            ->groupBy('wish_item_id');

        // $subscriptionsQuery = WishItemSubscription::whereBetween('created_at', [$start, $end])
        //     ->where('status', 'paid') // ✅ paidTask condition
        //     // OR ->where('payment_status', 'paid')
        //     // OR ->where('paid_task', 1)
        //     ->whereHas(
        //         'wish_item',
        //         fn($q) =>
        //         $q->where('user_id', $user->id)
        //     );

        $taskQuery = TaskPurchase::whereBetween('created_at', [$start, $end])
            ->where('creator_id', $user->id)
            ->where('status', 'completed');

        $tipGoalQuery = TipGoalsPayment::whereBetween('created_at', [$start, $end])
            ->where('creator_id', $user->id)
            ->where('status', 'paid');

        $membershipQuery = MembershipPayment::whereBetween('created_at', [$start, $end])
            ->whereHas(
                'membership',
                fn($q) =>
                $q->where('user_id', $user->id)
            );

        $billQuery = BillPayment::whereBetween('created_at', [$start, $end])
            ->whereHas(
                'bill',
                fn($q) =>
                $q->where('user_id', $user->id)
            );

        $shopQuery = ShopPayment::whereBetween('created_at', [$start, $end])
            ->whereHas(
                'shop',
                fn($q) =>
                $q->where('user_id', $user->id)
            );

        /* ---------------------------------
     | Sums (CALCULATED ONCE)
     |----------------------------------*/
        $singleWishAmount = (float) $singleWishQuery->sum('amount');
        // $subscriptionAmount = (float) $subscriptionsQuery->sum('amount');
        $paidTaskAmount = (float) $taskQuery->sum('amount');
        $tipGoalAmount = (float) $tipGoalQuery->sum('amount');
        $membershipAmount = (float) $membershipQuery->sum('amount');
        $billAmount = (float) $billQuery->sum('amount');
        $shopAmount = (float) $shopQuery->sum('amount');

        $gross = round(
            $singleWishAmount +
                // $subscriptionAmount +
                $paidTaskAmount +
                $tipGoalAmount +
                $membershipAmount +
                $billAmount +
                $shopAmount,
            2,
            PHP_ROUND_HALF_UP
        );

        $percent = fn($amount) =>
        $gross > 0 ? round(($amount * 100) / $gross, 2, PHP_ROUND_HALF_UP) : 0;

        /* ---------------------------------
     | Response
     |----------------------------------*/
        $resp = [
            'gross' => $gross,
            'earnings' => [
                [
                    'amount' => $singleWishAmount,
                    'percent' => $percent($singleWishAmount),
                    'title' => 'single wish',
                    'tag' => 'single_wish',
                ],
                [
                    'amount' => $tipGoalAmount,
                    'percent' => $percent($tipGoalAmount),
                    'title' => 'piggy bank',
                    'tag' => 'tip_goal',
                ],
                [
                    'amount' => $billAmount,
                    'percent' => $percent($billAmount),
                    'title' => 'bills',
                    'tag' => 'bills',
                ],
                // [
                //     'amount' => $subscriptionAmount,
                //     'percent' => $percent($subscriptionAmount),
                //     'title' => 'subscriptions',
                //     'tag' => 'subscriptions',
                // ],
                [
                    'amount' => $paidTaskAmount,
                    'percent' => $percent($paidTaskAmount),
                    'title' => 'paid task',
                    'tag' => 'task',
                ],
                [
                    'amount' => $membershipAmount,
                    'percent' => $percent($membershipAmount),
                    'title' => 'memberships',
                    'tag' => 'memberships',
                ],
                [
                    'amount' => $shopAmount,
                    'percent' => $percent($shopAmount),
                    'title' => 'shop items',
                    'tag' => 'shops',
                ],
            ],
        ];

        return response()->json($resp, 200);
    }

    // public function earnings($type = 'today')
    // {
    //     $user = User::where('id', Auth::id())->where('is_uk', 0)->first();

    //     $currentMonth = Carbon::now()->month;
    //     $currentYear = Carbon::now()->year;
    //     $currentWeekStartDate = Carbon::now()->startOfWeek();
    //     $currentWeekEndDate = Carbon::now()->endOfWeek();
    //     $currentDate = Carbon::today();

    //     $single_wish = StripePaymentItems::whereHas('payment', function ($q) use ($user) {
    //         $q->where('owner_id', $user->id);
    //     })->whereHas('wish', function ($q) use ($user) {
    //         $q->whereNotNull('stripe_product_id')->where('user_id', $user->id);
    //     })->groupBy('wish_item_id');

    //     // $crowd_wish = StripePaymentItems::whereHas('wish',function($q){
    //     //     $q->whereNull('stripe_product_id');
    //     // })->whereHas('payment',function($query) use($user){
    //     //     $query->where('owner_id',$user->id);
    //     // });

    //     // $surprise = StripePaymentItems::whereNull('wish_item_id')
    //     // ->whereHas('payment',function($query) use($user){
    //     //     $query->where('owner_id',$user->id);
    //     // });

    //     $subscriptions = WishItemSubscription::whereHas('wish_item', function ($q) use ($user) {
    //         $q->where('user_id', $user->id);
    //     });

    //     $tip_goal = TipGoalsPayment::with('tipGoal', function ($q) use ($user) {
    //         $q->where('user_id', $user->id);
    //     })->where('creator_id', $user->id)->where('status', 'paid');

    //     $membership = MembershipPayment::whereHas('membership', function ($q) use ($user) {
    //         $q->where('user_id', $user->id);
    //     });

    //     $bill = BillPayment::whereHas('bill', function ($q) use ($user) {
    //         $q->where('user_id', $user->id);
    //     });

    //     $shop = ShopPayment::whereHas('shop', function ($q) use ($user) {
    //         $q->where('user_id', $user->id);
    //     });

    //     if ($type == 'today') {

    //         $single_wish->whereDate('created_at', $currentDate);
    //         // $crowd_wish->where('created_at', $currentDate);
    //         // $surprise->where('created_at', $currentDate);
    //         $subscriptions->whereDate('created_at', $currentDate);
    //         $tip_goal->whereDate('created_at', $currentDate);
    //         $membership->whereDate('created_at', $currentDate);
    //         $bill->whereDate('created_at', $currentDate);
    //         $shop->whereDate('created_at', $currentDate);
    //     } else if ($type == 'week') {

    //         $single_wish->whereBetween('created_at', [
    //             $currentWeekStartDate,
    //             $currentWeekEndDate,
    //         ]);
    //         // $crowd_wish->whereBetween('created_at', [
    //         //     $currentWeekStartDate,
    //         //     $currentWeekEndDate,
    //         // ]);
    //         // $surprise->whereBetween('created_at', [
    //         //     $currentWeekStartDate,
    //         //     $currentWeekEndDate,
    //         // ]);
    //         $subscriptions->whereBetween('created_at', [
    //             $currentWeekStartDate,
    //             $currentWeekEndDate,
    //         ]);
    //         $tip_goal->whereBetween('created_at', [
    //             $currentWeekStartDate,
    //             $currentWeekEndDate,
    //         ]);

    //         $membership->whereBetween('created_at', [
    //             $currentWeekStartDate,
    //             $currentWeekEndDate,
    //         ]);
    //         $bill->whereBetween('created_at', [
    //             $currentWeekStartDate,
    //             $currentWeekEndDate,
    //         ]);
    //         $shop->whereBetween('created_at', [
    //             $currentWeekStartDate,
    //             $currentWeekEndDate,
    //         ]);
    //     } else if ($type == 'month') {

    //         $single_wish->whereYear('created_at', '=', $currentYear)
    //             ->whereMonth('created_at', $currentMonth);

    //         // $crowd_wish->whereYear('created_at', '=', $currentYear)
    //         // ->whereMonth('created_at',$currentMonth);

    //         // $surprise->whereYear('created_at', '=', $currentYear)
    //         // ->whereMonth('created_at',$currentMonth);

    //         $subscriptions->whereYear('created_at', '=', $currentYear)
    //             ->whereMonth('created_at', $currentMonth);

    //         $tip_goal->whereYear('created_at', '=', $currentYear)
    //             ->whereMonth('created_at', $currentMonth);

    //         $membership->whereYear('created_at', '=', $currentYear)
    //             ->whereMonth('created_at', $currentMonth);

    //         $bill->whereYear('created_at', '=', $currentYear)
    //             ->whereMonth('created_at', $currentMonth);

    //         $shop->whereYear('created_at', '=', $currentYear)
    //             ->whereMonth('created_at', $currentMonth);
    //     }

    //     // $performance = Earning::performance($type);

    //     $resp['gross'] = round($single_wish->sum('amount') + $subscriptions->sum('amount') + $tip_goal->sum('amount') + $membership->sum('amount') + $bill->sum('amount') + $shop->sum('amount'), 2, PHP_ROUND_HALF_UP);

    //     // if ($performance['tip_goal'] == 0 && $tip_goal->sum('amount') == 0) {
    //     //     $per = 0;
    //     // } elseif ($performance['tip_goal'] == 0) {
    //     //     $per = 100;
    //     // } else {
    //     //     $per = (($tip_goal->sum('amount') - $performance['tip_goal']) / $performance['tip_goal']) * 100;
    //     // }

    //     $resp['earnings'][0] = [
    //         'amount' => $single_wish->sum('amount'),
    //         // 'performance' => $per,
    //         // 'increase' => $single_wish->sum('amount') > $performance['single_wish'] ? true : false,
    //         'percent' => $single_wish->sum('amount') != 0 ?  round(($single_wish->sum('amount') * 100) / $resp['gross'], 2, PHP_ROUND_HALF_UP) : 0,
    //         'title' => 'single wish',
    //         'tag' => 'single_wish'
    //     ];

    //     $resp['earnings'][1] = [
    //         'amount' => $tip_goal->sum('amount'),
    //         // 'performance' => $per,
    //         // 'increase' => $tip_goal->sum('amount') > $performance['tip_goal'] ? true : false,
    //         'percent' => $tip_goal->sum('amount') != 0 ? round(($tip_goal->sum('amount') * 100) / $resp['gross'], 2, PHP_ROUND_HALF_UP) : 0,
    //         'title' => 'piggy bank',
    //         'tag' => 'tip_goal'
    //     ];


    //     // if ($performance['bill'] == 0 && $bill->sum('amount') == 0) {
    //     //     $per = 0;
    //     // } elseif ($performance['bill'] == 0) {
    //     //     $per = 100;
    //     // } else {
    //     //     $per = (($bill->sum('amount') - $performance['bill']) / $performance['bill']) * 100;
    //     // }
    //     $resp['earnings'][2] = [
    //         'amount' => $bill->sum('amount'),
    //         // 'performance' => $per,
    //         // 'increase' => $bill->sum('amount') > $performance['bill'] ? true : false,
    //         'percent' => $bill->sum('amount') != 0 ? round(($bill->sum('amount') * 100) / $resp['gross'], 2, PHP_ROUND_HALF_UP) : 0,
    //         'title' => 'bills',
    //         'tag' => 'bills'
    //     ];

    //     // if ($performance['subscriptions'] == 0 && $subscriptions->sum('amount') == 0) {
    //     //     $per = 0;
    //     // } elseif ($performance['subscriptions'] == 0) {
    //     //     $per = 100;
    //     // } else {
    //     //     $per = (($subscriptions->sum('amount') - $performance['subscriptions']) / $performance['subscriptions']) * 100;
    //     // }
    //     $resp['earnings'][3] = [
    //         'amount' => $subscriptions->sum('amount'),
    //         // 'performance' => $per,
    //         // 'increase' => $subscriptions->sum('amount') > $performance['subscriptions'] ? true : false,
    //         'percent' => $subscriptions->sum('amount') != 0 ?  round(($subscriptions->sum('amount') * 100) / $resp['gross'], 2, PHP_ROUND_HALF_UP) : 0,
    //         'title' => 'subscriptions',
    //         'tag' => 'subscriptions'
    //     ];



    //     // if ($performance['membership'] == 0 && $membership->sum('amount') == 0) {
    //     //     $per = 0;
    //     // } elseif ($performance['membership'] == 0) {
    //     //     $per = 100;
    //     // } else {
    //     //     $per = (($membership->sum('amount') - $performance['membership']) / $performance['membership']) * 100;
    //     // }
    //     $resp['earnings'][4] = [
    //         'amount' => $membership->sum('amount'),
    //         // 'performance' => $per,
    //         // 'increase' => $membership->sum('amount') > $performance['membership'] ? true : false,
    //         'percent' => $membership->sum('amount') != 0 ?  round(($membership->sum('amount') * 100) / $resp['gross'], 2, PHP_ROUND_HALF_UP) : 0,
    //         'title' => 'memberships',
    //         'tag' => 'memberships'
    //     ];


    //     $resp['earnings'][5] = [
    //         'amount' => $shop->sum('amount'),
    //         // 'performance' => $per,
    //         // 'increase' => $shop->sum('amount') > $performance['shop'] ? true : false,
    //         'percent' => $shop->sum('amount') != 0 ?  round(($shop->sum('amount') * 100) / $resp['gross'], 2, PHP_ROUND_HALF_UP) : 0,
    //         'title' => 'shop items',
    //         'tag' => 'shops'
    //     ];

    //     return response()->json($resp, 200);
    // }

    public function graphData()
    {
        $user = User::where('id', Auth::id())->where('is_uk', 0)->first();
        $currentYear = Carbon::now()->year;

        $data = [];

        for ($month = 1; $month <= 12; $month++) {
            $date = Carbon::create($currentYear, $month, 1);

            // Clone initial queries
            $single_wish_query = clone $this->initialQuery($user, "wish");
            // $subscriptions_query = clone $this->initialQuery($user, "subs");
            $paid_task_query = clone $this->initialQuery($user, "task");
            $tip_goal_query = clone $this->initialQuery($user, "tip");
            $membership_query = clone $this->initialQuery($user, "mem");
            $bill_query = clone $this->initialQuery($user, "bill");
            $shop_query = clone $this->initialQuery($user, "shop");

            // Apply additional conditions for each query
            $single_wish_query->whereYear('created_at', $currentYear)
                ->whereMonth('created_at', $month);
            // $subscriptions_query->whereYear('created_at', '=', $currentYear)
            //     ->whereMonth('created_at', $month);
            $paid_task_query->whereYear('created_at', '=', $currentYear)
                ->whereMonth('created_at', $month);
            $tip_goal_query->whereYear('created_at', '=', $currentYear)
                ->whereMonth('created_at', $month);
            $membership_query->whereYear('created_at', '=', $currentYear)
                ->whereMonth('created_at', $month);
            $bill_query->whereYear('created_at', '=', $currentYear)
                ->whereMonth('created_at', $month);
            $shop_query->whereYear('created_at', '=', $currentYear)
                ->whereMonth('created_at', $month);

            // Fetch sums for each category
            $data[$month - 1] = [
                'Wishes' => $single_wish_query->sum('amount'),
                // 'Subscriptions' => $subscriptions_query->sum('amount'),
                'PaidTask' => $paid_task_query->sum('amount'),
                'PiggyBank' => $tip_goal_query->sum('amount'),
                'Memberships' => $membership_query->sum('amount'),
                'Bills' => $bill_query->sum('amount'),
                'Shops' => $shop_query->sum('amount'),
                'month' => $date->format('F')
            ];
        }

        return response()->json([
            'status' => true,
            'data' => $data
        ]);
    }

    public function initialQuery($user, $type)
    {

        if ($type == 'wish') {
            return StripePaymentItems::whereHas('wish', function ($q) {
                $q->whereNotNull('stripe_product_id');
            })->whereHas('payment', function ($query) use ($user) {
                $query->where('owner_id', $user->id);
            });
        }

        // if ($type = 'subs') {
        //     return WishItemSubscription::whereHas('wish_item', function ($q) use ($user) {
        //         $q->where('user_id', $user->id);
        //     });
        // }

        if ($type == 'task') {
            return TaskPurchase::whereHas('task', function ($q) use ($user) {
                $q->where('creator_id', $user->id);
            });
        }

        if ($type == 'tip') {
            return TipGoalsPayment::whereHas('tipGoal', function ($q) use ($user) {
                $q->where('user_id', $user->id);
            });
        }

        if ($type == 'mem') {
            return MembershipPayment::whereHas('membership', function ($q) use ($user) {
                $q->where('user_id', $user->id);
            });
        }

        if ($type == 'bill') {
            return BillPayment::whereHas('bill', function ($q) use ($user) {
                $q->where('user_id', $user->id);
            });
        }


        if ($type == 'shop') {
            return ShopPayment::whereHas('shop', function ($q) use ($user) {
                $q->where('user_id', $user->id);
            });
        }
    }

    public function topWishes()
    {
        $user = User::where('id', Auth::id())->where('is_uk', 0)->first();

        $pay = StripePaymentItems::whereHas('payment', function ($q) use ($user) {
            $q->where('owner_id', $user->id);
        })->whereHas('wish', function ($q) use ($user) {
            $q->whereNotNull('stripe_product_id')->where('user_id', $user->id);
        })->groupBy('wish_item_id')
            ->selectRaw('wish_item_id, sum(amount) as total_amount')
            ->orderBy('total_amount', 'DESC')->take(5)->get();

        $resp = [];

        foreach ($pay as $p) {
            $resp[] = [
                'uuid' => $p->wish->uuid,
                'title' => $p->wish->wishname,
                'amount' => $p->total_amount,
                'media' => $p->wish->perma_link
            ];
        }

        return response()->json([
            'status' => true,
            'data' => $resp,
            'auth' => $user
        ]);
    }

    // public function topSubscription()
    // {
    //     $user = User::where('id', Auth::id())->where('is_uk', 0)->first();

    //     $pay = WishItemSubscription::whereHas('wish_item', function ($q) use ($user) {
    //         $q->whereNotNull('stripe_product_id')->where('user_id', $user->id);
    //     })->groupBy('wish_item_id')
    //         ->selectRaw('wish_item_id, sum(amount) as total_amount')
    //         ->orderBy('total_amount', 'DESC')->take(5)->get();

    //     $resp = [];

    //     foreach ($pay as $p) {
    //         $resp[] = [
    //             'uuid' => $p->wish_item->uuid,
    //             'title' => $p->wish_item->wishname,
    //             'amount' => $p->total_amount,
    //             'media' => $p->wish_item->perma_link
    //         ];
    //     }

    //     return response()->json([
    //         'status' => true,
    //         'data' => $resp
    //     ]);
    // }

    public function topPaidTask()
    {
        $user = User::where('id', Auth::id())->where('is_uk', 0)->first();

        $taskPurchase = TaskPurchase::whereHas('task', function ($q) use ($user) {
            $q->where('creator_id', $user->id);
            // $q->whereNotNull('stripe_product_id')->where('user_id', $user->id);
        })->groupBy('task_id')
            ->selectRaw('task_id, sum(amount) as total_amount')
            ->orderBy('total_amount', 'DESC')->take(5)->get();

        $resp = [];
        $default_currency = $user->default_currency ?? 'usd';
        $task_currency = $taskPurchase->pluck('currency')->first();

        foreach ($taskPurchase as $p) {
            $resp[] = [
                'uuid' => $p->task->uuid,
                'title' => $p->task->title,
                'amount' => $p->total_amount,
                'media' => $p->task->media_url
            ];
        }

        return response()->json([
            'status' => true,
            'data' => $resp
        ]);
    }

    public function topBill()
    {
        $user = User::where('id', Auth::id())->where('is_uk', 0)->first();

        $pay = BillPayment::whereHas('bill', function ($q) use ($user) {
            $q->where('user_id', $user->id);
        })->groupBy('bills_id')
            ->selectRaw('bills_id, sum(amount) as total_amount')
            ->orderBy('total_amount', 'DESC')->take(5)->get();

        $resp = [];

        foreach ($pay as $p) {
            $resp[] = [
                'uuid' => $p->bill->uuid,
                'title' => $p->bill->name,
                'amount' => $p->total_amount,
                'media' => $p->bill->perma_link
            ];
        }

        return response()->json([
            'status' => true,
            'data' => $resp
        ]);
    }

    public function topShop()
    {
        $user = User::where('id', Auth::id())->where('is_uk', 0)->first();

        $pay = ShopPayment::whereHas('shop', function ($q) use ($user) {
            $q->where('user_id', $user->id);
        })->groupBy('shop_id')
            ->selectRaw('shop_id, sum(amount) as total_amount')
            ->orderBy('total_amount', 'DESC')->take(5)->get();

        $resp = [];

        foreach ($pay as $p) {
            $resp[] = [
                'uuid' => $p->shop->uuid,
                'title' => $p->shop->name,
                'amount' => $p->total_amount,
                'media' => $p->shop->perma_link
            ];
        }

        return response()->json([
            'status' => true,
            'data' => $resp
        ]);
    }


    public function topPiggyBank()
    {
        $user = User::where('id', Auth::id())->where('is_uk', 0)->first();

        $pay = TipGoalsPayment::where('creator_id', $user->id)->whereNotNull('user_id')->with('user')->groupBy('user_id')
            ->selectRaw('user_id,sum(amount) as total_amount')
            ->orderBy('total_amount', 'DESC')->take(5)->get();

        $resp = [];

        foreach ($pay as $p) {
            $resp[] = [
                'uuid' => $p->user->uuid,
                'name' => $p->user->name,
                'username' => $p->user->username,
                'amount' => $p->total_amount,
                'media' => $p->user->avatar_url
            ];
        }

        return response()->json([
            'status' => true,
            'data' => $resp
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
                ->where('is_uk', 0)
                ->whereHas('paymentitems', function ($query) use ($threeMonthsAgo, $currentDate) {
                    $query->whereHas('payment', function ($q) {
                        $q->where('payment_status', 'paid');
                    })
                        ->whereBetween('stripe_payment_items.created_at', [$threeMonthsAgo, $currentDate]);
                })
                ->withCount([
                    'paymentitems as total_payments' => function ($query) use ($threeMonthsAgo, $currentDate) {
                        $query->select(DB::raw("COALESCE(SUM(amount), 0)"))
                            ->whereHas('payment', function ($q) {
                                $q->where('payment_status', 'paid');
                            })
                            ->whereBetween('stripe_payment_items.created_at', [$threeMonthsAgo, $currentDate]);
                    },
                    'paymentitems as total_count' => function ($query) use ($threeMonthsAgo, $currentDate) {
                        $query->whereHas('payment', function ($q) {
                            $q->where('payment_status', 'paid');
                        })
                            ->whereBetween('stripe_payment_items.created_at', [$threeMonthsAgo, $currentDate]);
                    },
                    'followers as supporters_count'
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
                        'profile_status_lock' => $user->profile_status_lock,
                        'role' => $user->role,
                        'total_amount' => $user->total_payments,
                        'total_count' => $user->total_count,
                        'supporters_count' => $user->supporters_count,
                        'currency' => 'USD'
                    ];
                });

            // Get subscriptions leaders - query creators who have received subscription payments
            $subscriptionsLeaders = User::where('stripe_details_submitted', 1)
                ->where('suspended_account', 0)
                ->where('is_uk', 0)
                ->whereHas('subscriptions', function ($query) use ($threeMonthsAgo, $currentDate) {
                    $query->where('wish_item_subscriptions.status', 'paid')
                        ->whereBetween('wish_item_subscriptions.created_at', [$threeMonthsAgo, $currentDate]);
                })
                ->withCount([
                    'subscriptions as total_subscriptions' => function ($query) use ($threeMonthsAgo, $currentDate) {
                        $query->select(DB::raw("COALESCE(SUM(amount), 0)"))
                            ->where('wish_item_subscriptions.status', 'paid')
                            ->whereBetween('wish_item_subscriptions.created_at', [$threeMonthsAgo, $currentDate]);
                    },
                    'subscriptions as total_count' => function ($query) use ($threeMonthsAgo, $currentDate) {
                        $query->where('wish_item_subscriptions.status', 'paid')
                            ->whereBetween('wish_item_subscriptions.created_at', [$threeMonthsAgo, $currentDate]);
                    },
                    'followers as supporters_count'
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
                        'profile_status_lock' => $user->profile_status_lock,
                        'role' => $user->role,
                        'total_amount' => $user->total_subscriptions,
                        'total_count' => $user->total_count,
                        'supporters_count' => $user->supporters_count,
                        'currency' => 'USD'
                    ];
                });

            // Get tips/piggy bank leaders - Query creators who received tips, not who paid them
            $tipsLeaders = User::where('stripe_details_submitted', 1)
                ->where('suspended_account', 0)
                ->where('is_uk', 0)
                ->whereHas('tip_goal_payment', function ($query) use ($threeMonthsAgo, $currentDate) {
                    $query->where('status', 'paid')
                        ->whereBetween('created_at', [$threeMonthsAgo, $currentDate]);
                })
                ->withCount([
                    'tip_goal_payment as total_tips' => function ($query) use ($threeMonthsAgo, $currentDate) {
                        $query->select(DB::raw("COALESCE(SUM(amount), 0)"))
                            ->where('status', 'paid')
                            ->whereBetween('created_at', [$threeMonthsAgo, $currentDate]);
                    },
                    'tip_goal_payment as total_count' => function ($query) use ($threeMonthsAgo, $currentDate) {
                        $query->where('status', 'paid')
                            ->whereBetween('created_at', [$threeMonthsAgo, $currentDate]);
                    },
                    'followers as supporters_count'
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
                        'profile_status_lock' => $user->profile_status_lock,
                        'role' => $user->role,
                        'total_amount' => $user->total_tips,
                        'total_count' => $user->total_count,
                        'supporters_count' => $user->supporters_count,
                        'currency' => 'USD'
                    ];
                });

            // Get memberships leaders
            $membershipsLeaders = User::where('stripe_details_submitted', 1)
                ->where('suspended_account', 0)
                ->where('is_uk', 0)
                ->whereHas('membership_payments', function ($query) use ($threeMonthsAgo, $currentDate) {
                    $query->where('membership_payments.status', 'paid')
                        ->whereBetween('membership_payments.created_at', [$threeMonthsAgo, $currentDate]);
                })
                ->withCount([
                    'membership_payments as total_memberships' => function ($query) use ($threeMonthsAgo, $currentDate) {
                        $query->select(DB::raw("COALESCE(SUM(amount), 0)"))
                            ->where('membership_payments.status', 'paid')
                            ->whereBetween('membership_payments.created_at', [$threeMonthsAgo, $currentDate]);
                    },
                    'membership_payments as total_count' => function ($query) use ($threeMonthsAgo, $currentDate) {
                        $query->where('membership_payments.status', 'paid')
                            ->whereBetween('membership_payments.created_at', [$threeMonthsAgo, $currentDate]);
                    },
                    'followers as supporters_count'
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
                        'profile_status_lock' => $user->profile_status_lock,
                        'role' => $user->role,
                        'total_amount' => $user->total_memberships,
                        'total_count' => $user->total_count,
                        'supporters_count' => $user->supporters_count,
                        'currency' => 'USD'
                    ];
                });

            // Get bills leaders
            $billsLeaders = User::where('stripe_details_submitted', 1)
                ->where('suspended_account', 0)
                ->where('is_uk', 0)
                ->whereHas('bill_payments', function ($query) use ($threeMonthsAgo, $currentDate) {
                    $query->where('bill_payments.status', 'paid')
                        ->whereBetween('bill_payments.created_at', [$threeMonthsAgo, $currentDate]);
                })
                ->withCount([
                    'bill_payments as total_bills' => function ($query) use ($threeMonthsAgo, $currentDate) {
                        $query->select(DB::raw("COALESCE(SUM(amount), 0)"))
                            ->where('bill_payments.status', 'paid')
                            ->whereBetween('bill_payments.created_at', [$threeMonthsAgo, $currentDate]);
                    },
                    'bill_payments as total_count' => function ($query) use ($threeMonthsAgo, $currentDate) {
                        $query->where('bill_payments.status', 'paid')
                            ->whereBetween('bill_payments.created_at', [$threeMonthsAgo, $currentDate]);
                    },
                    'followers as supporters_count'
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
                        'profile_status_lock' => $user->profile_status_lock,
                        'role' => $user->role,
                        'total_amount' => $user->total_bills,
                        'total_count' => $user->total_count,
                        'supporters_count' => $user->supporters_count,
                        'currency' => 'USD'
                    ];
                });

            // Get shop leaders
            $shopLeaders = User::where('stripe_details_submitted', 1)
                ->where('suspended_account', 0)
                ->where('is_uk', 0)
                ->whereHas('shop_payments', function ($query) use ($threeMonthsAgo, $currentDate) {
                    $query->where('shop_payments.payment_status', 'paid')
                        ->whereBetween('shop_payments.created_at', [$threeMonthsAgo, $currentDate]);
                })
                ->withCount([
                    'shop_payments as total_shop' => function ($query) use ($threeMonthsAgo, $currentDate) {
                        $query->select(DB::raw("COALESCE(SUM(amount), 0)"))
                            ->where('shop_payments.payment_status', 'paid')
                            ->whereBetween('shop_payments.created_at', [$threeMonthsAgo, $currentDate]);
                    },
                    'shop_payments as total_count' => function ($query) use ($threeMonthsAgo, $currentDate) {
                        $query->where('shop_payments.payment_status', 'paid')
                            ->whereBetween('shop_payments.created_at', [$threeMonthsAgo, $currentDate]);
                    },
                    'followers as supporters_count'
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
                        'profile_status_lock' => $user->profile_status_lock,
                        'role' => $user->role,
                        'total_amount' => $user->total_shop,
                        'total_count' => $user->total_count,
                        'supporters_count' => $user->supporters_count,
                        'currency' => 'USD'
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
            Log::error('Category leaders error: ' . $e->getMessage());

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

            $supporters = [];

            // Helper function to accumulate supporter data
            $addSupporterData = function (&$supporters, $user, $amount, $currency, $type, $createdAt) {
                $username = $user->username ?? 'anonymous_' . ($user->id ?? uniqid());

                if (!isset($supporters[$username])) {
                    $supporters[$username] = [
                        'id' => $user->id,
                        'name' => $user->name ?? "Anonymous",
                        'username' => $user->username ?? "Anonymous",
                        'avatar_url' => $user->avatar_url ?? null,
                        'cover_url' => $user->cover_url ?? null,
                        'role' => $user->role ?? 0,
                        'profile_status_lock' => $user->profile_status_lock ?? 1,
                        'total_amount' => 0,
                        'total_gifts' => 0,
                        'creators_supported' => [],
                        'support_types' => [],
                        'currency' => $currency,
                        'latest_support_date' => $createdAt,
                        'vip_score' => 0,
                    ];
                }

                $supporters[$username]['total_amount'] += $amount;
                $supporters[$username]['total_gifts']++;

                // Track unique support types
                if (!in_array($type, $supporters[$username]['support_types'])) {
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
                    ->whereBetween('stripe_payment_details.created_at', [$threeMonthsAgo, $currentDate]);
            })->with(['payment.user', 'wish.user'])->get();

            foreach ($wishes as $item) {
                $user = $item->payment->user ?? null;
                $creator = $item->wish->user ?? null;
                if ($user && $creator) {
                    $addSupporterData($supporters, $user, $item->amount, $item->payment->currency, 'wish', $item->created_at);
                    // Track creators supported
                    if (!in_array($creator->id, $supporters[$user->username]['creators_supported'] ?? [])) {
                        $supporters[$user->username]['creators_supported'][] = $creator->id;
                    }
                }
            }

            // Wishlist Subscriptions
            $subscriptions = WishItemSubscription::with(['user', 'wish_item.user'])
                ->where('status', 'paid')
                ->whereBetween('created_at', [$threeMonthsAgo, $currentDate])
                ->get();

            foreach ($subscriptions as $sub) {
                $user = $sub->user;
                $creator = $sub->wish_item->user ?? null;
                if ($user && $creator) {
                    $addSupporterData($supporters, $user, $sub->amount, $sub->currency, 'subscription', $sub->created_at);
                    if (!in_array($creator->id, $supporters[$user->username]['creators_supported'] ?? [])) {
                        $supporters[$user->username]['creators_supported'][] = $creator->id;
                    }
                }
            }

            // Tips
            $tips = TipGoalsPayment::with(['user', 'creator'])
                ->where('status', 'paid')
                ->whereBetween('created_at', [$threeMonthsAgo, $currentDate])
                ->get();

            foreach ($tips as $tip) {
                $user = $tip->user;
                $creator = $tip->creator ?? null;
                if ($user && $creator) {
                    $addSupporterData($supporters, $user, $tip->amount, $tip->currency, 'tip', $tip->created_at);
                    if (!in_array($creator->id, $supporters[$user->username]['creators_supported'] ?? [])) {
                        $supporters[$user->username]['creators_supported'][] = $creator->id;
                    }
                }
            }

            // Memberships
            $members = MembershipPayment::with(['user', 'membership.user'])
                ->where('status', 'paid')
                ->whereBetween('created_at', [$threeMonthsAgo, $currentDate])
                ->get();

            foreach ($members as $member) {
                $user = $member->user;
                $creator = $member->membership->user ?? null;
                if ($user && $creator) {
                    $addSupporterData($supporters, $user, $member->amount, $member->currency, 'membership', $member->created_at);
                    if (!in_array($creator->id, $supporters[$user->username]['creators_supported'] ?? [])) {
                        $supporters[$user->username]['creators_supported'][] = $creator->id;
                    }
                }
            }

            // Bills
            $bills = BillPayment::with(['user', 'bill.user'])
                ->where('status', 'paid')
                ->whereBetween('created_at', [$threeMonthsAgo, $currentDate])
                ->get();

            foreach ($bills as $bill) {
                $user = $bill->user;
                $creator = $bill->bill->user ?? null;
                if ($user && $creator) {
                    $addSupporterData($supporters, $user, $bill->amount, $bill->currency, 'bill', $bill->created_at);
                    if (!in_array($creator->id, $supporters[$user->username]['creators_supported'] ?? [])) {
                        $supporters[$user->username]['creators_supported'][] = $creator->id;
                    }
                }
            }

            // Shop purchases
            $shopPurchases = ShopPayment::with(['user', 'shop.user'])
                ->where('payment_status', 'paid')
                ->whereBetween('created_at', [$threeMonthsAgo, $currentDate])
                ->get();

            foreach ($shopPurchases as $purchase) {
                $user = $purchase->user;
                $creator = $purchase->shop->user ?? null;
                if ($user && $creator) {
                    $addSupporterData($supporters, $user, $purchase->amount, $purchase->currency ?? 'USD', 'shop', $purchase->created_at);
                    if (!in_array($creator->id, $supporters[$user->username]['creators_supported'] ?? [])) {
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
                $supporter['vip_score'] = min(40, $supporter['total_amount']) +
                    min(30, $supporter['total_gifts'] * 2) +
                    min(20, $supporter['creators_supported_count'] * 4) +
                    min(10, $supporter['support_types_count'] * 2);

                // Add recency bonus (up to 10 points for recent activity)
                $daysSinceLastSupport = Carbon::parse($supporter['latest_support_date'])->diffInDays($currentDate);
                $recencyBonus = max(0, 10 - ($daysSinceLastSupport / 3));
                $supporter['vip_score'] += $recencyBonus;

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
            Log::error('VIP Supporters error: ' . $e->getMessage());

            return response()->json([
                'success' => false,
                'error' => 'Unable to fetch VIP supporters',
                'data' => [],
                'message' => 'Failed to load VIP supporters data',
            ]);
        }
    }

    /**
     * Determine VIP level based on VIP score
     */
    private function getVipLevel($score)
    {
        if ($score >= 90) return ['level' => 'Diamond', 'icon' => '💎', 'color' => '#e879f9'];
        if ($score >= 70) return ['level' => 'Platinum', 'icon' => '🏆', 'color' => '#a855f7'];
        if ($score >= 50) return ['level' => 'Gold', 'icon' => '🥇', 'color' => '#f59e0b'];
        if ($score >= 30) return ['level' => 'Silver', 'icon' => '🥈', 'color' => '#6b7280'];
        return ['level' => 'Bronze', 'icon' => '🥉', 'color' => '#92400e'];
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
                ->where('is_uk', 0)
                ->count();

            // Get creators with recent growth in followers
            $fastestGrowingCreators = User::where('stripe_details_submitted', 1)
                ->where('suspended_account', 0)
                ->where('is_uk', 0)
                ->withCount(['followers as followers_count'])
                ->having('followers_count', '>', 0)
                ->orderBy('followers_count', 'desc')
                ->take(10)
                ->get()
                ->map(function ($user) {
                    return [
                        'id' => $user->id,
                        'name' => $user->name,
                        'username' => $user->username,
                        'avatar_url' => $user->avatar_url,
                        'profile_status_lock' => $user->profile_status_lock,
                        'role' => $user->role,
                        'supporters' => $user->followers_count,
                        'growth_percentage' => rand(5, 50), // Mock growth percentage
                        'current_amount' => 0,
                        'currency' => 'USD'
                    ];
                });

            // Get momentum leaders (weekly active creators)
            $momentumLeaders = User::where('stripe_details_submitted', 1)
                ->where('suspended_account', 0)
                ->where('is_uk', 0)
                ->where('updated_at', '>=', $currentWeekStartDate)
                ->withCount(['followers as followers_count'])
                ->orderBy('updated_at', 'desc')
                ->take(10)
                ->get()
                ->map(function ($user) {
                    return [
                        'id' => $user->id,
                        'name' => $user->name,
                        'username' => $user->username,
                        'avatar_url' => $user->avatar_url,
                        'profile_status_lock' => $user->profile_status_lock,
                        'role' => $user->role,
                        'supporters' => $user->followers_count,
                        'growth_percentage' => rand(10, 35), // Mock growth percentage
                        'current_amount' => 0,
                        'currency' => 'USD'
                    ];
                });

            // Get total interactions (followers)
            $totalInteractions = DB::table('user_followers')->count();

            // Get new supporters this month
            $newSupporters = DB::table('user_followers')
                ->whereYear('created_at', $currentYear)
                ->whereMonth('created_at', $currentMonth)
                ->count();

            $platformStats = [
                'total_creators' => $totalCreators,
                'creators_growth' => 15, // Mock growth percentage
                'total_interactions' => $totalInteractions,
                'engagement_growth' => 12, // Mock growth percentage
                'new_supporters' => $newSupporters,
                'supporters_growth' => 23, // Mock growth percentage
                'avg_community_score' => 85, // Mock community score
                'community_growth' => 8, // Mock growth percentage
                'monthly_revenue' => 0, // Deprecated for non-monetary focus
                'revenue_growth' => 0, // Deprecated for non-monetary focus
                'avg_support' => 0, // Deprecated for non-monetary focus
                'avg_growth' => 0, // Deprecated for non-monetary focus
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
            Log::error('Growth trends error: ' . $e->getMessage());

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
