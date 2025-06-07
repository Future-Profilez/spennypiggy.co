<?php

namespace App\Http\Controllers\Auth;

use App\Helpers;
use App\Http\Controllers\Controller;
use App\Models\BillPayment;
use App\Models\MembershipPayment;
use App\Models\ShopPayment;
use App\Models\StripePaymentDetail;
use App\Models\StripePaymentItems;
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
use Inertia\Inertia;

class LeaderBoardController extends Controller
{
    public function wishtenderWishers($type = null)
    {
        // try {

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
            $data[] = [
                'rank' => $rank,
                'name' => $query->name ?? '',
                'username' => $query->username ?? '',
                'avatar' => $query->avatar_url,
                'coverimg' =>  $query->cover_url,
                'top' => $rank / 100,
                'amount' => $query->total_amount
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

        return response()->json([
            "success" => true,
            'data' => $data,
            "message" => 'Wishtender wishes get successfully',
            "last_page" => $paginator->lastPage() ?? null,
            "current_page" => $paginator->currentPage() ?? null,
            "total" => $paginator->total() ?? null,
            "per_page" => $paginator->perPage() ?? null,
        ]);
        // } catch (\Exception $e) {
        //     return response()->json([
        //         "success" => false,
        //         "message" => 'Something went wrong',
        //         "error" => $e
        //     ]);
        // }
    }


    public function calc($type)
    {
        $currentMonth = Carbon::now()->month;
        $currentYear = Carbon::now()->year;
        $currentWeekStartDate = Carbon::now()->startOfWeek();
        $currentWeekEndDate = Carbon::now()->endOfWeek();
        $currentDate = Carbon::today()->format('Y-m-d');

        // $query->where(function ($q) {
        //     $q->where('country', '!=', 'GB')
        //         ->orWhere('country', '')
        //         ->orWhereNull('country');
        // });
        $users = User::where('stripe_details_submitted', 1)->where('suspended_account', 0)->where('is_uk', 0)->with(['paymentitems', 'subscriptions', 'tip_goal_payment', 'membership_payments', 'bill_payments', 'shop_payments'])
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
            // ->havingRaw('total_payments + total_subscriptions + total_tips + total_member + total_bill > 0')
            ->orderByDesc(DB::raw('total_payments + total_subscriptions + total_tips + total_member + total_bill + total_shop'))
            ->get();

        $users->map(function ($user) {
            $user->total_payments = Helpers::priceFormat($user->default_currency, $user->total_payments, 'USD');
            $user->total_subscriptions = Helpers::priceFormat($user->default_currency, $user->total_subscriptions, 'USD');
            $user->total_tips = Helpers::priceFormat($user->default_currency, $user->total_tips, 'USD');
            $user->total_member = Helpers::priceFormat($user->default_currency, $user->total_member, 'USD');
            $user->total_bill = Helpers::priceFormat($user->default_currency, $user->total_bill, 'USD');
            $user->total_shop = Helpers::priceFormat($user->default_currency, $user->total_shop, 'USD');

            $user->total_amount = $user->total_payments + $user->total_subscriptions + $user->total_tips + $user->total_member + $user->total_bill + $user->total_shop;
        });

        $users = $users->sortByDesc('total_amount');

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
                "message" => 'Wishtender wishes get successfully',
            ]);
        } catch (\Exception $e) {
            return response()->json([
                "success" => false,
                "message" => 'Something went wrong',
                "error" => $e
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
                        'currency' => $value->payment->currency
                    ];
                }

                foreach ($subscriptions as $key => $value) {
                    $array[] = [
                        'name' => $value->wish_item->user->name,
                        'username' => $value->wish_item->user->username,
                        'avatar_url' => $value->wish_item->user->avatar_url,
                        'cover_url' => $value->wish_item->user->cover_url,
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
                        'amount' => $value->amount,
                        'currency' => $value->currency
                    ];
                }

                foreach ($members as $key => $value) {
                    $array[] = [
                        'name' => $value->membership->user->name,
                        'username' => $value->membership->user->username,
                        'avatar_url' => $value->membership->user->avatar_url,
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


    /**
     * Earnings
     *
     * @return JSON
     */
    public function earnings($type = 'today')
    {
        $user = User::where('id', Auth::id())->where('is_uk', 0)->first();

        $currentMonth = Carbon::now()->month;
        $currentYear = Carbon::now()->year;
        $currentWeekStartDate = Carbon::now()->startOfWeek();
        $currentWeekEndDate = Carbon::now()->endOfWeek();
        $currentDate = Carbon::today();

        $single_wish = StripePaymentItems::whereHas('payment', function ($q) use ($user) {
            $q->where('owner_id', $user->id);
        })->whereHas('wish', function ($q) use ($user) {
            $q->whereNotNull('stripe_product_id')->where('user_id', $user->id);
        })->groupBy('wish_item_id');

        // $crowd_wish = StripePaymentItems::whereHas('wish',function($q){
        //     $q->whereNull('stripe_product_id');
        // })->whereHas('payment',function($query) use($user){
        //     $query->where('owner_id',$user->id);
        // });

        // $surprise = StripePaymentItems::whereNull('wish_item_id')
        // ->whereHas('payment',function($query) use($user){
        //     $query->where('owner_id',$user->id);
        // });

        $subscriptions = WishItemSubscription::whereHas('wish_item', function ($q) use ($user) {
            $q->where('user_id', $user->id);
        });

        $tip_goal = TipGoalsPayment::whereHas('tipGoal', function ($q) use ($user) {
            $q->where('user_id', $user->id);
        });

        $membership = MembershipPayment::whereHas('membership', function ($q) use ($user) {
            $q->where('user_id', $user->id);
        });

        $bill = BillPayment::whereHas('bill', function ($q) use ($user) {
            $q->where('user_id', $user->id);
        });

        $shop = ShopPayment::whereHas('shop', function ($q) use ($user) {
            $q->where('user_id', $user->id);
        });

        if ($type == 'today') {

            $single_wish->whereDate('created_at', $currentDate);
            // $crowd_wish->where('created_at', $currentDate);
            // $surprise->where('created_at', $currentDate);
            $subscriptions->whereDate('created_at', $currentDate);
            $tip_goal->whereDate('created_at', $currentDate);
            $membership->whereDate('created_at', $currentDate);
            $bill->whereDate('created_at', $currentDate);
            $shop->whereDate('created_at', $currentDate);
        } else if ($type == 'week') {

            $single_wish->whereBetween('created_at', [
                $currentWeekStartDate,
                $currentWeekEndDate,
            ]);
            // $crowd_wish->whereBetween('created_at', [
            //     $currentWeekStartDate,
            //     $currentWeekEndDate,
            // ]);
            // $surprise->whereBetween('created_at', [
            //     $currentWeekStartDate,
            //     $currentWeekEndDate,
            // ]);
            $subscriptions->whereBetween('created_at', [
                $currentWeekStartDate,
                $currentWeekEndDate,
            ]);
            $tip_goal->whereBetween('created_at', [
                $currentWeekStartDate,
                $currentWeekEndDate,
            ]);

            $membership->whereBetween('created_at', [
                $currentWeekStartDate,
                $currentWeekEndDate,
            ]);
            $bill->whereBetween('created_at', [
                $currentWeekStartDate,
                $currentWeekEndDate,
            ]);
            $shop->whereBetween('created_at', [
                $currentWeekStartDate,
                $currentWeekEndDate,
            ]);
        } else if ($type == 'month') {

            $single_wish->whereYear('created_at', '=', $currentYear)
                ->whereMonth('created_at', $currentMonth);

            // $crowd_wish->whereYear('created_at', '=', $currentYear)
            // ->whereMonth('created_at',$currentMonth);

            // $surprise->whereYear('created_at', '=', $currentYear)
            // ->whereMonth('created_at',$currentMonth);

            $subscriptions->whereYear('created_at', '=', $currentYear)
                ->whereMonth('created_at', $currentMonth);

            $tip_goal->whereYear('created_at', '=', $currentYear)
                ->whereMonth('created_at', $currentMonth);

            $membership->whereYear('created_at', '=', $currentYear)
                ->whereMonth('created_at', $currentMonth);

            $bill->whereYear('created_at', '=', $currentYear)
                ->whereMonth('created_at', $currentMonth);

            $shop->whereYear('created_at', '=', $currentYear)
                ->whereMonth('created_at', $currentMonth);
        }

        // $performance = Earning::performance($type);

        $resp['gross'] = round($single_wish->sum('amount') + $subscriptions->sum('amount') + $tip_goal->sum('amount') + $membership->sum('amount') + $bill->sum('amount') + $shop->sum('amount'), 2, PHP_ROUND_HALF_UP);

        // if ($performance['tip_goal'] == 0 && $tip_goal->sum('amount') == 0) {
        //     $per = 0;
        // } elseif ($performance['tip_goal'] == 0) {
        //     $per = 100;
        // } else {
        //     $per = (($tip_goal->sum('amount') - $performance['tip_goal']) / $performance['tip_goal']) * 100;
        // }

        $resp['earnings'][0] = [
            'amount' => $single_wish->sum('amount'),
            // 'performance' => $per,
            // 'increase' => $single_wish->sum('amount') > $performance['single_wish'] ? true : false,
            'percent' => $single_wish->sum('amount') != 0 ?  round(($single_wish->sum('amount') * 100) / $resp['gross'], 2, PHP_ROUND_HALF_UP) : 0,
            'title' => 'single wish',
            'tag' => 'single_wish'
        ];


        $resp['earnings'][1] = [
            'amount' => $tip_goal->sum('amount'),
            // 'performance' => $per,
            // 'increase' => $tip_goal->sum('amount') > $performance['tip_goal'] ? true : false,
            'percent' => $tip_goal->sum('amount') != 0 ? round(($tip_goal->sum('amount') * 100) / $resp['gross'], 2, PHP_ROUND_HALF_UP) : 0,
            'title' => 'piggy bank',
            'tag' => 'tip_goal'
        ];


        // if ($performance['bill'] == 0 && $bill->sum('amount') == 0) {
        //     $per = 0;
        // } elseif ($performance['bill'] == 0) {
        //     $per = 100;
        // } else {
        //     $per = (($bill->sum('amount') - $performance['bill']) / $performance['bill']) * 100;
        // }
        $resp['earnings'][2] = [
            'amount' => $bill->sum('amount'),
            // 'performance' => $per,
            // 'increase' => $bill->sum('amount') > $performance['bill'] ? true : false,
            'percent' => $bill->sum('amount') != 0 ? round(($bill->sum('amount') * 100) / $resp['gross'], 2, PHP_ROUND_HALF_UP) : 0,
            'title' => 'bills',
            'tag' => 'bills'
        ];

        // if ($performance['subscriptions'] == 0 && $subscriptions->sum('amount') == 0) {
        //     $per = 0;
        // } elseif ($performance['subscriptions'] == 0) {
        //     $per = 100;
        // } else {
        //     $per = (($subscriptions->sum('amount') - $performance['subscriptions']) / $performance['subscriptions']) * 100;
        // }
        $resp['earnings'][3] = [
            'amount' => $subscriptions->sum('amount'),
            // 'performance' => $per,
            // 'increase' => $subscriptions->sum('amount') > $performance['subscriptions'] ? true : false,
            'percent' => $subscriptions->sum('amount') != 0 ?  round(($subscriptions->sum('amount') * 100) / $resp['gross'], 2, PHP_ROUND_HALF_UP) : 0,
            'title' => 'subscriptions',
            'tag' => 'subscriptions'
        ];



        // if ($performance['membership'] == 0 && $membership->sum('amount') == 0) {
        //     $per = 0;
        // } elseif ($performance['membership'] == 0) {
        //     $per = 100;
        // } else {
        //     $per = (($membership->sum('amount') - $performance['membership']) / $performance['membership']) * 100;
        // }
        $resp['earnings'][4] = [
            'amount' => $membership->sum('amount'),
            // 'performance' => $per,
            // 'increase' => $membership->sum('amount') > $performance['membership'] ? true : false,
            'percent' => $membership->sum('amount') != 0 ?  round(($membership->sum('amount') * 100) / $resp['gross'], 2, PHP_ROUND_HALF_UP) : 0,
            'title' => 'memberships',
            'tag' => 'memberships'
        ];


        $resp['earnings'][5] = [
            'amount' => $shop->sum('amount'),
            // 'performance' => $per,
            // 'increase' => $shop->sum('amount') > $performance['shop'] ? true : false,
            'percent' => $shop->sum('amount') != 0 ?  round(($shop->sum('amount') * 100) / $resp['gross'], 2, PHP_ROUND_HALF_UP) : 0,
            'title' => 'shop items',
            'tag' => 'shops'
        ];

        return response()->json($resp, 200);
    }

    public function graphData()
    {
        $user = User::where('id', Auth::id())->where('is_uk', 0)->first();
        $currentYear = Carbon::now()->year;

        $data = [];

        for ($month = 1; $month <= 12; $month++) {
            $date = Carbon::create($currentYear, $month, 1);

            // Clone initial queries
            $single_wish_query = clone $this->initialQuery($user, "wish");
            $subscriptions_query = clone $this->initialQuery($user, "subs");
            $tip_goal_query = clone $this->initialQuery($user, "tip");
            $membership_query = clone $this->initialQuery($user, "mem");
            $bill_query = clone $this->initialQuery($user, "bill");
            $shop_query = clone $this->initialQuery($user, "shop");

            // Apply additional conditions for each query
            $single_wish_query->whereYear('created_at', $currentYear)
                ->whereMonth('created_at', $month);
            $subscriptions_query->whereYear('created_at', '=', $currentYear)
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
                'Subscriptions' => $subscriptions_query->sum('amount'),
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

        if ($type = 'subs') {
            return WishItemSubscription::whereHas('wish_item', function ($q) use ($user) {
                $q->where('user_id', $user->id);
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

    public function topSubscription()
    {
        $user = User::where('id', Auth::id())->where('is_uk', 0)->first();

        $pay = WishItemSubscription::whereHas('wish_item', function ($q) use ($user) {
            $q->whereNotNull('stripe_product_id')->where('user_id', $user->id);
        })->groupBy('wish_item_id')
            ->selectRaw('wish_item_id, sum(amount) as total_amount')
            ->orderBy('total_amount', 'DESC')->take(5)->get();

        $resp = [];

        foreach ($pay as $p) {
            $resp[] = [
                'uuid' => $p->wish_item->uuid,
                'title' => $p->wish_item->wishname,
                'amount' => $p->total_amount,
                'media' => $p->wish_item->perma_link
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
}
