<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\StripePaymentDetail;
use App\Models\User;
use App\Models\WishItemSubscription;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Pagination\Paginator;
use Illuminate\Pagination\LengthAwarePaginator;
use Inertia\Inertia;

class LeaderBoardController extends Controller
{
    public function wishtenderWishers($type = null)
    {
        try {
            if (!empty($type) || $type != null) {
                if ($type == 'monthly' || $type == 'weekly' || $type == 'daily') {

                    $currentMonth = Carbon::now()->month;
                    $currentYear = Carbon::now()->year;
                    $currentWeekStartDate = Carbon::now()->startOfWeek();
                    $currentWeekEndDate = Carbon::now()->endOfWeek();
                    $currentDate = Carbon::today();

                    $querydata = User::whereNot('country', 'GB')->whereHas('paymentitems', function ($q) use ($type, $currentMonth, $currentYear, $currentWeekStartDate, $currentWeekEndDate, $currentDate) {
                        $q->selectRaw('owner_id, SUM(amount) as total_amount')
                            ->groupBy('owner_id')
                            ->orderByRaw('total_amount DESC');
                        if ($type == 'monthly') {
                            $q->where('stripe_payment_details.payment_status', 'paid')
                                ->whereMonth('stripe_payment_items.created_at', $currentMonth)
                                ->whereYear('stripe_payment_items.created_at', $currentYear);
                        } elseif ($type == 'weekly') {
                            $q->where('stripe_payment_details.payment_status', 'paid')
                                ->whereBetween('stripe_payment_items.created_at', [$currentWeekStartDate, $currentWeekEndDate]);
                        } else {
                            $q->where('stripe_payment_details.payment_status', 'paid')
                                ->whereDate('stripe_payment_items.created_at', $currentDate);
                        }
                    })->orWhereHas(
                        'subscriptions',
                        function ($q) use ($type, $currentMonth, $currentYear, $currentWeekStartDate, $currentWeekEndDate, $currentDate) {
                            $q->selectRaw('wish_item_subscriptions.user_id, SUM(amount) as total_amount')
                                ->groupBy('wish_item_subscriptions.user_id')
                                ->orderByRaw('total_amount DESC');
                            if ($type == 'monthly') {
                                $q->where('wish_item_subscriptions.status', 'paid')
                                    ->whereMonth('wish_item_subscriptions.created_at', $currentMonth)
                                    ->whereYear('wish_item_subscriptions.created_at', $currentYear);
                            } elseif ($type == 'weekly') {
                                $q->where('wish_item_subscriptions.status', 'paid')
                                    ->whereBetween('wish_item_subscriptions.created_at', [$currentWeekStartDate, $currentWeekEndDate]);
                            } else {
                                $q->where('wish_item_subscriptions.status', 'paid')
                                    ->whereDate('wish_item_subscriptions.created_at', $currentDate);
                            }
                        }
                    )->get();

                    $data = [];
                    $rank = 1;
                    foreach ($querydata as $query) {
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
                    return response()->json([
                        "success" => true,
                        'data' => $data,
                        "message" => 'Wishtender wishes get successfully',
                    ]);
                } else {
                    return response()->json([
                        "success" => false,
                        "message" => 'Please enter valid type',
                    ]);
                }
            } else {
                $currentMonth = Carbon::now()->month;
                $currentYear = Carbon::now()->year;

                $querydata = User::whereHas('paymentitems', function ($q) use ($type, $currentMonth, $currentYear) {
                    $q->selectRaw('owner_id, SUM(amount) as total_amount')
                        ->groupBy('owner_id')
                        ->orderByRaw('total_amount DESC')->where('stripe_payment_details.payment_status', 'paid')
                        ->whereMonth('stripe_payment_items.created_at', $currentMonth)
                        ->whereYear('stripe_payment_items.created_at', $currentYear);
                })->orWhereHas(
                    'subscriptions',
                    function ($q) use ($type, $currentMonth, $currentYear) {
                        $q->selectRaw('wish_item_subscriptions.user_id, SUM(amount) as total_amount')
                            ->groupBy('wish_item_subscriptions.user_id')
                            ->orderByRaw('total_amount DESC')->where('wish_item_subscriptions.status', 'paid')
                            ->whereMonth('wish_item_subscriptions.created_at', $currentMonth)
                            ->whereYear('wish_item_subscriptions.created_at', $currentYear);
                    }
                )->get();

                $data = [];
                $rank = 1;
                foreach ($querydata as $query) {
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
                return Inertia::render('leaderboard/Board', [
                    "data" => $data,
                ]);
            }
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
            if (!empty($type) || $type != null) {
                if ($type == 'lasthour' || $type == 'last24hour') {
                    $lasthour = Carbon::now()->subHour(1);
                    $last24hour = Carbon::now()->subHour(24);

                    // $querydata = User::whereHas('paymentitems', function ($q) use ($type, $lasthour, $last24hour) {
                    //     $q->selectRaw('owner_id, SUM(amount) as total_amount')
                    //         ->groupBy('owner_id')
                    //         ->orderByRaw('total_amount DESC');
                    //     if ($type == 'lasthour') {
                    //         $q->where('stripe_payment_details.payment_status', 'paid')
                    //             ->where('stripe_payment_items.created_at', '>=', $lasthour);
                    //     } else {
                    //         $q->where('stripe_payment_details.payment_status', 'paid')
                    //             ->where('stripe_payment_items.created_at', '>=', $last24hour);
                    //     }
                    // })->orWhereHas(
                    //     'subscriptions',
                    //     function ($q) use ($type, $lasthour, $last24hour) {
                    //         $q->selectRaw('wish_item_subscriptions.user_id, SUM(amount) as total_amount')
                    //             ->groupBy('wish_item_subscriptions.user_id')
                    //             ->orderByRaw('total_amount DESC');
                    //         if ($type == 'lasthour') {
                    //             $q->where('wish_item_subscriptions.status', 'paid')
                    //                 ->where('wish_item_subscriptions.created_at', '>=', $lasthour);
                    //         } else {
                    //             $q->where('wish_item_subscriptions.status', 'paid')
                    //                 ->where('wish_item_subscriptions.created_at', '>=', $last24hour);
                    //         }
                    //     }
                    // )->get();
                    // $querydata = User::whereHas('paymentitems', function ($q) use ($type, $lasthour, $last24hour) {
                    //     $q->select('owner_id')
                    //         ->selectRaw('SUM(amount) as total_amount')
                    //         ->groupBy('owner_id')
                    //         ->orderByRaw('total_amount DESC');
                    //     if ($type == 'lasthour') {
                    //         $q->where('stripe_payment_details.payment_status', 'paid')
                    //             ->where('stripe_payment_items.created_at', '>=', $lasthour);
                    //     } else {
                    //         $q->where('stripe_payment_details.payment_status', 'paid')
                    //             ->where('stripe_payment_items.created_at', '>=', $last24hour);
                    //     }
                    // })->orWhereHas('subscriptions', function ($q) use ($type, $lasthour, $last24hour) {
                    //     $q->select('wish_item_subscriptions.user_id')
                    //         ->selectRaw('SUM(amount) as total_amount')
                    //         ->groupBy('wish_item_subscriptions.user_id')
                    //         ->orderByRaw('total_amount DESC');
                    //     if ($type == 'lasthour') {
                    //         $q->where('wish_item_subscriptions.status', 'paid')
                    //             ->where('wish_item_subscriptions.created_at', '>=', $lasthour);
                    //     } else {
                    //         $q->where('wish_item_subscriptions.status', 'paid')
                    //             ->where('wish_item_subscriptions.created_at', '>=', $last24hour);
                    //     }
                    // })->get();
                    $querydata = User::whereHas('paymentitems', function ($q) use ($type, $lasthour, $last24hour) {
                        $q->select('owner_id')
                            ->selectRaw('SUM(amount) as total_amount')
                            ->groupBy('owner_id')
                            ->orderByRaw('total_amount DESC');
                        if ($type == 'lasthour') {
                            $q->where('stripe_payment_details.payment_status', 'paid')
                                ->where('stripe_payment_items.created_at', '>=', $lasthour);
                        } else {
                            $q->where('stripe_payment_details.payment_status', 'paid')
                                ->where('stripe_payment_items.created_at', '>=', $last24hour);
                        }
                    })->orWhereHas('subscriptions', function ($q) use ($type, $lasthour, $last24hour) {
                        $q->select('wish_item_subscriptions.user_id')
                            ->selectRaw('SUM(amount) as total_amount')
                            ->groupBy('wish_item_subscriptions.user_id')
                            ->orderByRaw('total_amount DESC');
                        if ($type == 'lasthour') {
                            $q->where('wish_item_subscriptions.status', 'paid')
                                ->where('wish_item_subscriptions.created_at', '>=', $lasthour);
                        } else {
                            $q->where('wish_item_subscriptions.status', 'paid')
                                ->where('wish_item_subscriptions.created_at', '>=', $last24hour);
                        }
                    })->with('paymentitems', 'subscriptions')->get();

                    // echo "<pre>";
                    // print_r($querydata);
                    // die;


                    // echo "<pre>";
                    // print_r($querydata);
                    // die;


                    // $data = [];
                    // $rank = 1;
                    // foreach ($querydata as $query) {
                    //     $data[] = [
                    //         'rank' => $rank,
                    //         'name' => $query->name ?? '',
                    //         'username' => $query->username ?? '',
                    //         'avatar' => $query->avatar_url,
                    //         'coverimg' =>  $query->cover_url,
                    //         'top' => $rank / 100,
                    //     ];
                    //     $rank++;
                    // }
                    // return response()->json([
                    //     "success" => true,
                    //     'data' => $data,
                    //     "message" => 'Wishtender wishes get successfully',
                    // ]);
                } else {
                    return response()->json([
                        "success" => false,
                        "message" => 'Please enter valid type',
                    ]);
                }
            } else {

                // return Inertia::render('leaderboard/Board', [
                //     "data" => $data,
                // ]);
            }
        } catch (\Exception $e) {
            return response()->json([
                "success" => false,
                "message" => 'Something went wrong',
                "error" => $e
            ]);
        }
    }
}
