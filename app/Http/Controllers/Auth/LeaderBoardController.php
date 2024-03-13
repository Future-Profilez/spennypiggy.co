<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\BillPayment;
use App\Models\MembershipPayment;
use App\Models\StripePaymentDetail;
use App\Models\StripePaymentItems;
use App\Models\TipGoalsPayment;
use App\Models\User;
use App\Models\WishItemSubscription;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Pagination\Paginator;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class LeaderBoardController extends Controller
{
    public function wishtenderWishers($type = null)
    {
        try {
                $currentMonth = Carbon::now()->month;
                $currentYear = Carbon::now()->year;
                $currentWeekStartDate = Carbon::now()->startOfWeek();
                $currentWeekEndDate = Carbon::now()->endOfWeek();
                $currentDate = Carbon::today();

                $users = User::where(function ($q) {
                    $q->whereNot('country', 'GB')->orWhereNull('country');
                })->with(['paymentitems', 'subscriptions', 'tip_goal_payment'])
                ->withCount([
                    'paymentitems as total_payments' => function ($query) use ($type,$currentMonth,$currentYear,$currentWeekStartDate,$currentWeekEndDate,$currentDate) {
                        $query->select(DB::raw("COALESCE(SUM(amount), 0)"));
                        if($type == 'monthly'){
                            $query->whereYear('stripe_payment_items.created_at', '=', $currentYear)
                            ->whereMonth('stripe_payment_items.created_at',$currentMonth);
                        }
                        elseif($type == 'weekly'){
                            $query->whereBetween('stripe_payment_items.created_at', [$currentWeekStartDate,$currentWeekEndDate]);
                        }
                        elseif($type == 'daily'){
                            $query->where('stripe_payment_items.created_at', $currentDate);
                        }
                    },
                    'subscriptions as total_subscriptions' => function ($query) use ($type,$currentMonth,$currentYear,$currentWeekStartDate,$currentWeekEndDate,$currentDate) {
                        $query->select(DB::raw("COALESCE(SUM(amount), 0)"));

                            if($type == 'monthly'){
                                $query->whereYear('wish_item_subscriptions.created_at', '=', $currentYear)
                                ->whereMonth('wish_item_subscriptions.created_at',$currentMonth);
                            }
                            elseif($type == 'weekly'){
                                $query->whereBetween('wish_item_subscriptions.created_at', [$currentWeekStartDate,$currentWeekEndDate]);
                            }
                            elseif($type == 'daily'){
                                $query->where('wish_item_subscriptions.created_at', $currentDate);
                            }
                    },
                    'tip_goal_payment as total_tips' => function ($query) use ($type,$currentMonth,$currentYear,$currentWeekStartDate,$currentWeekEndDate,$currentDate) {
                        $query->select(DB::raw("COALESCE(SUM(amount), 0)"));

                        if($type == 'monthly'){
                            $query->whereYear('tip_goals_payments.created_at', '=', $currentYear)
                            ->whereMonth('tip_goals_payments.created_at',$currentMonth);
                        }
                        elseif($type == 'weekly'){
                            $query->whereBetween('tip_goals_payments.created_at', [$currentWeekStartDate,$currentWeekEndDate]);
                        }
                        elseif($type == 'daily'){
                            $query->where('tip_goals_payments.created_at', $currentDate);
                        }
                    },
                    'membership_payments as total_member' => function ($query) use ($type,$currentMonth,$currentYear,$currentWeekStartDate,$currentWeekEndDate,$currentDate) {
                        $query->select(DB::raw("COALESCE(SUM(amount), 0)"));

                        if($type == 'monthly'){
                            $query->whereYear('membership_payments.created_at', '=', $currentYear)
                            ->whereMonth('membership_payments.created_at',$currentMonth);
                        }
                        elseif($type == 'weekly'){
                            $query->whereBetween('membership_payments.created_at', [$currentWeekStartDate,$currentWeekEndDate]);
                        }
                        elseif($type == 'daily'){
                            $query->where('membership_payments.created_at', $currentDate);
                        }
                    },
                    'bill_payments as total_bill' => function ($query) use ($type,$currentMonth,$currentYear,$currentWeekStartDate,$currentWeekEndDate,$currentDate) {
                        $query->select(DB::raw("COALESCE(SUM(amount), 0)"));

                        if($type == 'monthly'){
                            $query->whereYear('bill_payments.created_at', '=', $currentYear)
                            ->whereMonth('bill_payments.created_at',$currentMonth);
                        }
                        elseif($type == 'weekly'){
                            $query->whereBetween('bill_payments.created_at', [$currentWeekStartDate,$currentWeekEndDate]);
                        }
                        elseif($type == 'daily'){
                            $query->where('bill_payments.created_at', $currentDate);
                        }
                    },
                    'membership_payments as total_member' => function ($query) use ($type,$currentMonth,$currentYear,$currentWeekStartDate,$currentWeekEndDate,$currentDate) {
                        $query->select(DB::raw("COALESCE(SUM(amount), 0)"));

                        if($type == 'monthly'){
                            $query->whereYear('membership_payments.created_at', '=', $currentYear)
                            ->whereMonth('membership_payments.created_at',$currentMonth);
                        }
                        elseif($type == 'weekly'){
                            $query->whereBetween('membership_payments.created_at', [$currentWeekStartDate,$currentWeekEndDate]);
                        }
                        elseif($type == 'daily'){
                            $query->where('membership_payments.created_at', $currentDate);
                        }
                    },
                    'bill_payments as total_bill' => function ($query) use ($type,$currentMonth,$currentYear,$currentWeekStartDate,$currentWeekEndDate,$currentDate) {
                        $query->select(DB::raw("COALESCE(SUM(amount), 0)"));

                        if($type == 'monthly'){
                            $query->whereYear('bill_payments.created_at', '=', $currentYear)
                            ->whereMonth('bill_payments.created_at',$currentMonth);
                        }
                        elseif($type == 'weekly'){
                            $query->whereBetween('bill_payments.created_at', [$currentWeekStartDate,$currentWeekEndDate]);
                        }
                        elseif($type == 'daily'){
                            $query->where('bill_payments.created_at', $currentDate);
                        }
                    },
                ])
                ->orderByDesc(DB::raw('total_payments + total_subscriptions + total_tips + total_member + total_bill'))
                ->paginate(50);

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

                if(empty($type)){
                    return Inertia::render('leaderboard/Board', [
                        "data" => $data,
                    ]);
                }

                return response()->json([
                    "success" => true,
                    'data' => $data,
                    "message" => 'Wishtender wishes get successfully',
                    "last_page" => $users->lastPage() ?? null,
                    "current_page" => $users->currentPage() ?? null,
                    "total" => $users->total() ?? null,
                    "per_page" => $users->perPage() ?? null,
                ]);
        } catch (\Exception $e) {
            return response()->json([
                "success" => false,
                "message" => 'Something went wrong',
                "error" => $e
            ]);
        }
    }


    public function firstThreeWisher($type = null)
    {
        try {
                $currentMonth = Carbon::now()->month;
                $currentYear = Carbon::now()->year;
                $currentWeekStartDate = Carbon::now()->startOfWeek();
                $currentWeekEndDate = Carbon::now()->endOfWeek();
                $currentDate = Carbon::today();

                $users = User::where(function ($q) {
                    $q->whereNot('country', 'GB')->orWhereNull('country');
                })->with(['paymentitems', 'subscriptions', 'tip_goal_payment'])
                ->withCount([
                    'paymentitems as total_payments' => function ($query) use ($type,$currentMonth,$currentYear,$currentWeekStartDate,$currentWeekEndDate,$currentDate) {
                        $query->select(DB::raw("COALESCE(SUM(amount), 0)"));
                        if($type == 'monthly'){
                            $query->whereYear('stripe_payment_items.created_at', '=', $currentYear)
                            ->whereMonth('stripe_payment_items.created_at',$currentMonth);
                        }
                        elseif($type == 'weekly'){
                            $query->whereBetween('stripe_payment_items.created_at', [$currentWeekStartDate,$currentWeekEndDate]);
                        }
                        elseif($type == 'daily'){
                            $query->where('stripe_payment_items.created_at', $currentDate);
                        }
                    },
                    'subscriptions as total_subscriptions' => function ($query) use ($type,$currentMonth,$currentYear,$currentWeekStartDate,$currentWeekEndDate,$currentDate) {
                        $query->select(DB::raw("COALESCE(SUM(amount), 0)"));

                            if($type == 'monthly'){
                                $query->whereYear('wish_item_subscriptions.created_at', '=', $currentYear)
                                ->whereMonth('wish_item_subscriptions.created_at',$currentMonth);
                            }
                            elseif($type == 'weekly'){
                                $query->whereBetween('wish_item_subscriptions.created_at', [$currentWeekStartDate,$currentWeekEndDate]);
                            }
                            elseif($type == 'daily'){
                                $query->where('wish_item_subscriptions.created_at', $currentDate);
                            }
                        },
                    'tip_goal_payment as total_tips' => function ($query) use ($type,$currentMonth,$currentYear,$currentWeekStartDate,$currentWeekEndDate,$currentDate) {
                        $query->select(DB::raw("COALESCE(SUM(amount), 0)"));

                        if($type == 'monthly'){
                            $query->whereYear('tip_goals_payments.created_at', '=', $currentYear)
                            ->whereMonth('tip_goals_payments.created_at',$currentMonth);
                        }
                        elseif($type == 'weekly'){
                            $query->whereBetween('tip_goals_payments.created_at', [$currentWeekStartDate,$currentWeekEndDate]);
                        }
                        elseif($type == 'daily'){
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

                if(empty($type)){
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

                if($type == 'lasthour'){
                    $lasthour = Carbon::now()->subHour(1);
                    $wishes = StripePaymentItems::whereHas('wish',function($q){
                        $q->whereHas('user',function($query){
                            $query->where(function ($s) {
                                $s->whereNot('country', 'GB')->orWhereNull('country');
                            });
                        });
                    })->orderBy('amount','DESC')->where('created_at','>',$lasthour)->get();
                    $subscriptions = WishItemSubscription::whereHas('wish_item',function($q){
                        $q->whereHas('user',function($query){
                            $query->where(function ($s) {
                                $s->whereNot('country', 'GB')->orWhereNull('country');
                            });
                        });
                    })->orderBy('amount','DESC')->where('created_at','>',$lasthour)->get();
                    $tips = TipGoalsPayment::whereHas('creator',function($q){
                        $q->where(function ($s) {
                            $s->whereNot('country', 'GB')->orWhereNull('country');
                        });
                    })->orderBy('amount','DESC')->where('created_at','>',$lasthour)->get();

                    $members = MembershipPayment::whereHas('membership',function($q){
                        $q->whereHas('user',function($query){
                            $query->where(function ($s) {
                                $s->whereNot('country', 'GB')->orWhereNull('country');
                            });
                        });
                    })->orderBy('amount','DESC')->where('created_at','>',$lasthour)->get();
                    $bills = BillPayment::whereHas('bill',function($q){
                        $q->whereHas('user',function($query){
                            $query->where(function ($s) {
                                $s->whereNot('country', 'GB')->orWhereNull('country');
                            });
                        });
                    })->orderBy('amount','DESC')->where('created_at','>',$lasthour)->get();
                }else{
                    $last24hour = Carbon::now()->subHour(24);
                    $wishes = StripePaymentItems::whereHas('wish',function($q){
                        $q->whereHas('user',function($query){
                            $query->where(function ($s) {
                                $s->whereNot('country', 'GB')->orWhereNull('country');
                            });
                        });
                    })->orderBy('amount','DESC')->where('created_at','>',$last24hour)->get();
                    $subscriptions = WishItemSubscription::whereHas('wish_item',function($q){
                        $q->whereHas('user',function($query){
                            $query->where(function ($s) {
                                $s->whereNot('country', 'GB')->orWhereNull('country');
                            });
                        });
                    })->orderBy('amount','DESC')->where('created_at','>',$last24hour)->get();
                    $tips = TipGoalsPayment::whereHas('creator',function($q){
                        $q->where(function ($s) {
                            $s->whereNot('country', 'GB')->orWhereNull('country');
                        });
                    })->orderBy('amount','DESC')->where('created_at','>',$last24hour)->get();

                    $members = MembershipPayment::whereHas('membership',function($q){
                        $q->whereHas('user',function($query){
                            $query->where(function ($s) {
                                $s->whereNot('country', 'GB')->orWhereNull('country');
                            });
                        });
                    })->orderBy('amount','DESC')->where('created_at','>',$last24hour)->get();
                    $bills = BillPayment::whereHas('bill',function($q){
                        $q->whereHas('user',function($query){
                            $query->where(function ($s) {
                                $s->whereNot('country', 'GB')->orWhereNull('country');
                            });
                        });
                    })->orderBy('amount','DESC')->where('created_at','>',$last24hour)->get();
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



}
