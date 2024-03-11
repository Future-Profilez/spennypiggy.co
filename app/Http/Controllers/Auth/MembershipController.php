<?php

namespace App\Http\Controllers\Auth;

use App\Helpers;
use App\Http\Controllers\Controller;
use App\Jobs\MembershipAutoTweet;
use App\Jobs\MembershipMail;
use App\Jobs\SubscribeAutoTweet;
use App\Jobs\SubscribedMail;
use App\Jobs\SubscriptionCancelAtEnd;
use App\Jobs\SubscriptionFailed;
use App\Models\Membership;
use App\Models\MembershipPayment;
use App\Models\StripePaymentDetail;
use App\Models\StripePaymentItems;
use App\Models\TipGoalsPayment;
use App\Models\User;
use App\Models\WishItemSubscription;
use App\StripeControl;
use Carbon\Carbon;
use Exception;
use Illuminate\Http\Request;
use Illuminate\Pagination\Paginator;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;
use Inertia\Inertia;
use Stripe\StripeClient;

class MembershipController extends Controller
{


    public function membershipLevelSave(Request $request){


        $validator = Validator::make($request->all(), [
            "level" => [
                "required",
                "string",
            ],
            "month_price" => [
                "required",
                "numeric",
                "min:0"
            ],
            "rewards" => [
                "required"
            ],
        ]);

        if ($validator->fails()) {

            return response()->json([
                "status" => false,
                "msg" => "Validation failed",
                "errors" => $validator->errors(),
            ]);
        }

            $user = User::where('id',Auth::id())->first();
            $exist = Membership::where('user_id',$user->id)->pluck('level')->toArray();



            if(in_array($request->level,$exist)){
                return response()->json([
                    "status" => false,
                    "msg" => "You already have a level of " . $request->level,
                ]);
            }

            $media = $request->thumbnail;
            $rewards = json_encode($request->rewards);


            $price = $request->month_price;
            $taxamount = round(($price * config('app.member_tax') / 100), 2, PHP_ROUND_HALF_UP);
            $createpriceid = $price + $taxamount;

            $mem = new Membership();
            $mem->user_id = Auth::id();
            $mem->level = $request->level;
            $mem->currency = $user->default_currency;
            $mem->price = $price;
            $mem->tax_amount = $taxamount;
            $mem->thumbnail = !empty($media) ? $media['uuid'] : null;
            $mem->rewards = $rewards;

            $mem->save();

            $productPayload = [
                "name"  => $user->username . '_' . $mem->level,
                "images" => [$mem->perma_link],
                "default_price_data"    =>  [
                    "currency"  =>  $user->default_currency,
                    "unit_amount_decimal"   => round($createpriceid, 2, PHP_ROUND_HALF_UP) * 100,
                ],
                "url"   =>  env('APP_URL') . '/' . $user->username
            ];

            if ($request->level != 'lifetime') {
                $productPayload['default_price_data']['recurring']  =   [
                    'interval'  =>  StripeControl::$periods["monthly"],
                    'interval_count'    =>  1
                ];
            }

            try {
                $product = StripeControl::createProduct($productPayload);
                $mem->product_id = $product->id;
                $mem->price_id = $product->default_price;
                $mem->save();

            } catch (Exception $e) {
                $mem->delete();

                return response()->json([
                    'status' => false,
                    'msg' => "Stripe Error: " . $e->getMessage()
                ]);
            }

            return response()->json([
                'status' => true,
                'msg' => "Membership added successfully."
            ]);
    }


    public function updateLevel(Request $request,$uuid){
        $request->validate(
            [
                "level" => [
                    "required",
                    "string",
                ],
                "month_price" => [
                    "required",
                    "numeric",
                    "min:0"
                ],
                "rewards" => [
                    "required"
                ],
            ]
        );

        $checkdata = Helpers::checkBlockData($request);
        if ($checkdata == 1) {
            return redirect()->back()->with("error", "Some words and emojis are not allowed. Eg.paypig, findom, worship, unlock, unblock, receive, tax, fee, session, deposit, tribute,
         😈, 💩, 💬, 👅, 🍆, 🍌, 🌽, 🌶️, 🍑, 💎, 💦");
        }
        else
        {

            $user = User::where('id',Auth::id())->first();

            $mem = Membership::where('uuid',$uuid)->first();
            $old_price = $mem->price;
            if(empty($mem)){
                return response()->json([
                    "status" => false,
                    "msg" => "Membership not found."
                ]);
            }

            $media = $request->thumbnail;
            $rewards = json_encode($request->rewards);


            $price = $request->month_price;
            $taxamount = round(($price * config('app.member_tax') / 100), 2, PHP_ROUND_HALF_UP);
            $createpriceid = $price + $taxamount;

            $mem->user_id = Auth::id();
            $mem->level = $request->level;
            $mem->price = $price;
            $mem->tax_amount = $taxamount;
            if(!empty($media)){
                $mem->thumbnail = $media['uuid'];
            }
            $mem->rewards = $rewards;

            $mem->save();

            try {
                $stripe = new StripeClient(env('STRIPE_SECRET_KEY'));

                if($old_price == $mem->price){
                    $product = $stripe->products->update($mem->product_id,[
                        "name"  => $user->username . '_' . $mem->level,
                        "images" => [$mem->perma_link],
                        "default_price" => $mem->price_id
                    ]);
                }
                else{
                    $productPayload = [
                        "name"  => $user->username . '_' . $mem->level,
                        "images" => [$mem->perma_link],
                        "default_price_data"    =>  [
                            "currency"  =>  $user->default_currency,
                            "unit_amount_decimal"   => round($createpriceid, 2, PHP_ROUND_HALF_UP) * 100,
                        ],
                        "url"   =>  env('APP_URL') . '/' . $user->username
                    ];

                    if ($request->level != 'lifetime') {
                        $productPayload['default_price_data']['recurring']  =   [
                            'interval'  =>  StripeControl::$periods["monthly"],
                            'interval_count'    =>  1
                        ];
                    }
                    $product = StripeControl::createProduct($productPayload);
                    $mem->price_id = $product->default_price;
                }
                $mem->product_id = $product->id;
                $mem->save();

            } catch (Exception $e) {
                $mem->delete();
                return redirect(route("user.show", ["username" => Auth::user()->username]))->with('error', "Stripe Error: " . $e->getMessage());
            }

            return redirect()->back()->with('success','Membership level is added in your profile.');
        }
    }


    public function removeLevel($uuid){

        Membership::whereUuid($uuid)->delete();

        return redirect()->back()->with('success','Membership removed successfully.');
    }


    /**
     * Buy creator's membership
     *
     * @param Request $request
     * @param string $uuid Membership UUID
     * @param string $reccure Subscription Reccuring - onetime or continue
     * @return mixed
     */
    public function buyLevel(Request $request, $uuid ,$reccure = 'continue')
    {
        $membership = Membership::whereUuid($uuid)->with('user')->first();

        if (Auth::check() && ($membership->user_id == Auth::id())) {
            return redirect()->back()->with('error', "You can't buy your own membership!");
        }

        if (!$membership) {
            return redirect()->back()->with('error', 'Membership not found!');
        }

        $vat_percentage_amount = 0;

        $currency   =   strtolower($request->cookie("currency", "GBP"));
        $tax = round($membership->tax_amount, 2, PHP_ROUND_HALF_UP);
        $price = round($membership->price, 2, PHP_ROUND_HALF_UP);

        $fee_per = round(($tax / ($tax + $price)) * 100, 2, PHP_ROUND_HALF_UP);

        if(!empty($membership->user->vat_amount_percentage)){
            $vat_percentage_amount = $price * $membership->user->vat_amount_percentage / 100;
        }

        if ($request->isMethod("POST")) {
            $request->validate([
                'name' => [
                    'nullable',
                    'sometimes',
                    'string',
                    'max:50'
                ],
                'email' =>  [
                    'required',
                    'email:dns'
                ],
                'message' =>  [
                    'sometimes',
                    'nullable',
                    'string',
                    'max:800'
                ]
            ]);

            $sub = MembershipPayment::create([
                'membership_id'  =>  $membership->id,
                'user_id'       =>  Auth::id() ?? null,
                'guest_name'    =>  $request->name ?? NULL,
                'guest_email'   =>  $request->email,
                'currency'      =>  $membership->currency,
                'amount'        =>  $membership->price,
                'tax'           =>  $membership->tax_amount,
                'recurring_for' =>  $reccure,
                'recurring_type' =>  in_array($membership->level, ['bronze', 'silver', 'gold', 'platinum']) ? 'monthly' : 'lifetime',
                'surprise_message'  =>  $request->message ?? NULL,
                'anonymous' => $request->anonymous ?? 0
            ]);

            $price += $vat_percentage_amount;

            $amount = $price + $tax;
            $unit_amount = Helpers::priceFormat($membership->currency, $amount, $currency) * 100;
            $tax =   Helpers::priceFormat($membership->currency, $tax, $currency);

            $items  =   [
                'quantity' =>   1
            ];
            // if($currency == strtolower($membership->currency)) {
            //     $items['price']  =   $membership->price_id;
            // } else {
                $items['price_data']    =   [
                    'currency'  =>  $currency,
                    'product'   =>  $membership->product_id,
                    'unit_amount_decimal'   =>  $unit_amount,
                ];
                if($membership->level != 'lifetime') {
                    $items['price_data']['recurring']   =   [
                        'interval'  =>  StripeControl::$periods['monthly'],
                        'interval_count'    =>  1
                    ];
                }
            // }

            $payload    =   [
                "currency"  =>  $currency,
                'line_items' =>  [$items],
                'customer_email'    =>  $request->email,
                'success_url'       =>  route('membership.handle', ['uuid' => $sub->uuid, 'status' => "success"]),
                'cancel_url'       =>  route('membership.handle', ['uuid' => $sub->uuid, 'status' => "cancel"]),
            ];

            if($membership->level == 'lifetime') {
                $payload['mode']    =   'payment';
                $payload['payment_intent_data']     =   [
                    'transfer_data' => [
                        'destination' => $membership->user->account_id, // Creator's connected account ID
                    ],
                    'application_fee_amount' => $tax * 100,
                    // 'on_behalf_of'  => $membership->user->account_id,
                    'description'   => "Membership for {$membership->level} of {$membership->user->username}."
                ];
            } else {
                $payload['mode']    =   'subscription';
                $payload['subscription_data']     =   [
                    'application_fee_percent'   =>  $fee_per,
                    'transfer_data' => [
                        'destination' => $membership->user->account_id, // Creator's connected account ID
                    ],
                    'on_behalf_of'  => $membership->user->account_id,
                    // 'cancel_at_period_end'  =>  $reccure == 'onetime',
                    'description'   => "Membership for {$membership->level} of {$membership->user->username}."
                ];
            }
            // if ($currency == strtolower($membership->currency)) {
            //     $items = [
            //         "price"     =>  $membership->price_id,
            //         'quantity'  =>  1,
            //     ];
            // } else {

            //         $items  =   [
            //             'quantity'      =>  1,
            //             'price_data'    =>   [
            //                 'currency'  =>  $currency,
            //                 'product'   =>  $membership->product_id,
            //                 'unit_amount_decimal'   =>  $unit_amount,
            //                 'recurring' =>  [
            //                     'interval'  =>  StripeControl::$periods['monthly'],
            //                     'interval_count'    =>  1
            //                 ]
            //             ]
            //         ];


            // }
            // $payload = [
            //     "mode"  =>  'subscription',
            //     "currency"  =>  strtolower($request->cookie("currency", "GBP")),
            //     'line_items' =>  [$items],
            //     'subscription_data' =>  [
            //         'application_fee_percent'   =>  $fee_per,
            //         'transfer_data' => [
            //             'destination' => $membership->user->account_id, // Creator's connected account ID
            //         ],
            //         'on_behalf_of'  => $membership->user->account_id,
            //         // 'cancel_at_period_end'  =>  $reccure == 'onetime',
            //         'description'   => "Membership for {$membership->level} of {$membership->user->username}."
            //     ],
            //     'customer_email'    =>  $request->email,
            //     'success_url'       =>  route('membership.handle', ['uuid' => $sub->uuid, 'status' => "success"]),
            //     'cancel_url'       =>  route('membership.handle', ['uuid' => $sub->uuid, 'status' => "cancel"]),
            // ];

            try {
                $session = StripeControl::createCheckoutSession($payload);
                $sub->update([
                    'session_id' =>  $session->id
                ]);

                return Inertia::location($session->url);
            } catch (Exception $e) {
                $sub->delete();
                return back()->with('error', $e->getMessage());
            }
            // return response()->json([
            //     'success'   => true,
            //     'session'   => $session
            // ]);


        }

        return Inertia::render('membership/MemberCheckout', [
            'membership'  => $membership,
            'vat_amount' => $vat_percentage_amount,
            'reccure'   => $reccure
        ]);
    }



    /**
     * Handle Checkout Session
     *
     * @param string $uuid Subscription UUID
     * @param string $status Status of Subscription
     * @return mixed
     */
    public function handlePayment($uuid, $status)
    {
        $mem = MembershipPayment::whereUuid($uuid)->first();
        if (!$mem) {
            return to_route('home')->with("error", 'Insufficient data!');
        }
        if ($mem->status !== 'initiated') {
            return to_route('home')->with("error", 'Subscription already processed!');
        }
        try {
            $session = StripeControl::getCheckoutSession($mem->session_id);
            $mem->status = $session->payment_status;
            if ($session->payment_status == 'paid') {
                $mem->stripe_id = $session->subscription;
                $current = Carbon::now();
                if ($mem->recurring_type == "monthly") {
                    $current->addMonth();
                }
                $mem->upcoming_payment = $current;
                $mem->save();

                if ($mem->recurring_for == 'onetime' AND $mem->recurring_type == 'monthly') {
                    SubscriptionCancelAtEnd::dispatch($mem);
                } else {
                    MembershipMail::dispatch($mem);
                }

                // if ($mem->wish_item->user->auto_tweet == 1) {
                //     // MakeAutoTweets::dispatch($user);
                //     SubscribeAutoTweet::dispatch($mem);
                //     MembershipAutoTweet::dispatch($mem);
                // }

                return to_route('user.show', ['username' => $mem->membership->user->username])->with('success', "Payment for subscription of membership is success.");
            }

            // SubscriptionFailed::dispatch($mem);

            $mem->save();
            return to_route('user.show', ['username' => $mem->membership->user->username])->with('warning', "Membership is in {$session->payment_status} status.");
        } catch (Exception $e) {
            return to_route('user.show', ['username' => $mem->membership->user->username])->with('error', $e->getMessage());
        }
        // return response()->json([
        //     'success'   =>  true,
        //     'session'   =>  $session,
        //     'status'    =>  $status
        // ]);
    }


    public function membershipDashboard(){
        $user = User::where('id',Auth::id())->first();


        $count = MembershipPayment::whereHas('membership',function($q) use($user){
            $q->where('user_id', $user->id);
        })->where('status','paid')->count();

        $per_month = MembershipPayment::whereHas('membership',function($q) use($user){
            $q->where('user_id', $user->id);
        })->whereMonth('created_at',Carbon::now()->month)->where('status','paid')->sum('amount');

        $all_time = MembershipPayment::whereHas('membership',function($q) use($user){
            $q->where('user_id', $user->id);
        })->where('status','paid')->sum('amount');

        $arr = [
            'members' => $count,
            'per_month' => $per_month,
            'all_time' => $all_time
        ];


        return response()->json([
            'status' => true,
            'data' => $arr
        ]);
    }


    public function membershipGraph(){
        $user = User::where('id',Auth::id())->first();


        $currentDate = Carbon::now();


        $result = [];


        for ($i = 0; $i <= 4; $i++) {

            if($i != 0){
                $date = Carbon::now()->subMonth($i);
                $format_date = $date->format('F Y');
            }
            else{
                $date = $currentDate;
                $format_date = $currentDate->format('F Y');
            }


            $data = MembershipPayment::whereHas('membership',function($q) use($user){
                $q->where('user_id',$user->id);
            })->whereMonth('created_at', $date->month)
                            ->whereYear('created_at', $date->year)
                            ->sum('amount');

            $result[] = [
                            'Amount' => $data,
                            'Time' => $format_date
                        ];
        }

        return response()->json([
            'status' => true,
            'data' => $result
        ]);
    }

}
