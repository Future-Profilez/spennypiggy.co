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

                    $querydata = User::whereHas('paymentitems', function ($q) use ($type, $currentMonth, $currentYear, $currentWeekStartDate, $currentWeekEndDate, $currentDate) {
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
                // return response()->json([
                //     "success" => true,
                //     'data' => $data,
                //     "message" => 'Wishtender wishes get successfully',
                // ]);
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


    // public function largestGifts(Request $request)
    // {
    //     try {
    //         $request->validate([
    //             "type" => ["required", "string"],
    //         ]);
    //         $perPage = $request->input('per_page', 10);

    //         if (!empty($request->type)) {
    //             if ($request->type == 'lasthour') {
    //                 $details = StripePaymentDetail::where('payment_status', 'paid')
    //                     ->whereMonth('created_at', Carbon::now()->month)
    //                     ->whereYear('created_at', Carbon::now()->year)
    //                     ->with(['owner'])
    //                     ->groupBy('owner_id')
    //                     ->selectRaw('owner_id, COUNT(*) as payment_count')
    //                     ->orderByDesc('payment_count')
    //                     ->get();

    //                 $details = $details->paginate($perPage);
    //                 $data = [];
    //                 $rank = ($details->currentPage() - 1) * $perPage + 1;

    //                 foreach ($details as $detail) {
    //                     $data[] = [
    //                         'rank' => $rank,
    //                         'name' => $detail->owner->name ?? '',
    //                         'username' => $detail->owner->username ?? '',
    //                         'profile' => $detail->owner->avatar_url ?? '',
    //                         'top' => $rank / 100 . '%',
    //                         'payment_count' => $detail->payment_count,
    //                     ];
    //                     $rank++;
    //                 }

    //                 return response()->json([
    //                     "success" => true,
    //                     "data" => $data,
    //                     "message" => 'monthly data get successfully',
    //                     "pagination" => [
    //                         "current_page" => $details->currentPage(),
    //                         "per_page" => $details->perPage(),
    //                         "total" => $details->total(),
    //                     ],
    //                 ]);
    //             } elseif ($request->type == 'weekly') {
    //                 $details = StripePaymentDetail::where('payment_status', 'paid')
    //                     ->whereBetween('created_at', [Carbon::now()->startOfWeek(), Carbon::now()->endOfWeek()])->with(['owner'])
    //                     ->groupBy('owner_id')
    //                     ->selectRaw('owner_id, COUNT(*) as payment_count')
    //                     ->orderByDesc('payment_count')
    //                     ->get();

    //                 $details = $details->paginate($perPage);
    //                 $data = [];
    //                 $rank = ($details->currentPage() - 1) * $perPage + 1;

    //                 foreach ($details as $detail) {
    //                     $data[] = [
    //                         'rank' => $rank,
    //                         'name' => $detail->owner->name ?? '',
    //                         'username' => $detail->owner->username ?? '',
    //                         'profile' => $detail->owner->avatar_url ?? '',
    //                         'top' => $rank / 100 . '%',
    //                         'payment_count' => $detail->payment_count,
    //                     ];
    //                     $rank++;
    //                 }

    //                 return response()->json([
    //                     "success" => true,
    //                     "data" => $data,
    //                     "message" => 'weekly data get successfully',
    //                     "pagination" => [
    //                         "current_page" => $details->currentPage(),
    //                         "per_page" => $details->perPage(),
    //                         "total" => $details->total(),
    //                     ],
    //                 ]);
    //             } else {
    //                 return response()->json([
    //                     "success" => false,
    //                     "message" => 'Please enter valid type',
    //                 ]);
    //             }
    //         } else {
    //             return response()->json([
    //                 "success" => false,
    //                 "message" => 'Please enter type',
    //             ]);
    //         }
    //     } catch (\Exception $e) {
    //         return response()->json([
    //             "success" => false,
    //             "message" => 'Something went wrong',
    //         ]);
    //     }
    // }
}
