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

class LeaderBoardController extends Controller
{
    public function wishtenderWishers(Request $request)
    {
        try {
            $request->validate([
                "type" => ["required", "string"],
            ]);
            $perPage = $request->input('per_page', 10);
            if (!empty($request->type)) {
                if (
                    $request->type == 'monthly' || $request->type == 'weekly' ||
                    $request->type == 'daily'
                ) {
                    $items = User::with(['stripePaymentDetails' => function ($query) {
                        $query->with(['stripePaymentItems' => function ($q, $request) {
                            if ($request->type == 'monthly') {
                                $q->whereMonth('created_at', Carbon::now()->month)->whereYear('created_at', Carbon::now()->year);
                            } elseif ($request->type == 'weekly') {
                                $q->whereBetween('created_at', [Carbon::now()->startOfWeek(), Carbon::now()->endOfWeek()])->with(['owner']);
                            } else {
                                $q->whereDate('created_at', Carbon::today())->with(['owner']);
                            }
                            $q->groupBy('owner_id')->selectRaw('owner_id, COUNT(*) as payment_count')->orderByDesc('payment_count');
                        }]);
                    }])->get();

                    $subscriptions = WishItemSubscription::where('status', 'paid')
                        ->where('recurring_type', $request->type)
                        ->with(['wish_item.user'])
                        ->groupBy('wish_item_id')
                        ->selectRaw('wish_item_id, COUNT(*) as payment_count')
                        ->orderByDesc('payment_count')
                        ->get();

                    $datafirst = [];
                    $rankfirst = 1;
                    foreach ($items as $item) {
                        $datafirst[] = [
                            'rank' => $rankfirst,
                            'name' => $item->name ?? '',
                            'username' => $item->username ?? '',
                            'profile' => $item->avatar_url ?? '',
                            'top' => $rankfirst / 100 . '%',
                        ];
                        $rankfirst++;
                    }


                    $datasecond = [];
                    $ranksecond = 1;
                    foreach ($subscriptions as $subscription) {
                        $datasecond[] = [
                            'rank' => $ranksecond,
                            'name' => $subscription->wish_item->user->name ?? '',
                            'username' => $subscription->wish_item->user->username ?? '',
                            'profile' => $subscription->wish_item->user->avatar_url ?? '',
                            'top' => $ranksecond / 100 . '%',
                        ];
                        $ranksecond++;
                    }
                } else {
                    return response()->json([
                        "success" => false,
                        "message" => 'Please enter valid type',
                    ]);
                }
            } else {
                return response()->json([
                    "success" => false,
                    "message" => 'Please enter type',
                ]);
            }
        } catch (\Exception $e) {
            return response()->json([
                "success" => false,
                "message" => 'Something went wrong',
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
