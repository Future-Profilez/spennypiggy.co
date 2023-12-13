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
    public function wishtenderWishers( $type)
    {
        try {
            
            // $perPage = $request->input('per_page', 10);
            if (!empty($type)) {
                if (
                    $type == 'monthly' || $type == 'weekly' ||
                    $type == 'daily'
                ) {
                    $details = User::with(['stripePaymentDetails' => function ($query) {
                        $query->with(['stripePaymentItems' => function ($q) {
                        //   $q->;
                        }]);
                    }])->get();
                    //  $details = WishItemSubscription::where('status', 'paid')
                    //         ->where('recurring_type', $request->type)
                    //         ->with(['user'])
                    //         ->groupBy('user_id')
                    //         ->selectRaw('user_id, COUNT(*) as payment_count')
                    //         ->orderByDesc('payment_count')
                    //         ->get();

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
