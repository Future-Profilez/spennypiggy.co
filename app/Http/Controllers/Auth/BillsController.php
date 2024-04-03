<?php

namespace App\Http\Controllers\Auth;

use App\Helpers;
use App\Http\Controllers\Controller;
use App\Jobs\BillPayMail;
use App\Jobs\MembershipMail;
use App\Models\BillPayment;
use App\Models\Bills;
use App\Models\Logs;
use App\Models\User;
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

class BillsController extends Controller
{


    public function billSave(Request $request){


        $validator = Validator::make($request->all(), [
            "name" => [
                "required",
                "string",
            ],
            "price" => [
                "required",
                "numeric",
                "min:0"
            ],
            'period' => [
                'required',
                'string'
            ]
        ]);

        if ($validator->fails()) {

            return response()->json([
                "status" => false,
                "msg" => "Validation failed",
                "errors" => $validator->errors(),
            ]);
        }

            $user = User::where('id',Auth::id())->first();

            $media = $request->thumbnail;

            $price = $request->price;
            $taxamount = round(($price * config('app.single_tax') / 100), 2, PHP_ROUND_HALF_UP);
            $createpriceid = $price + $taxamount;

            $bill = new Bills();
            $bill->user_id = Auth::id();
            $bill->name = $request->name;
            $bill->currency = $user->default_currency;
            $bill->price = $price;
            $bill->tax_amount = $taxamount;
            $bill->thumbnail = !empty($media) ? $media : null;
            $bill->period = $request->period;

            $bill->save();

            $productPayload = [
                "name"  => $bill->name,
                "images" => [$bill->perma_link],
                "default_price_data"    =>  [
                    "currency"  =>  $user->default_currency,
                    "unit_amount_decimal"   => round($createpriceid, 2, PHP_ROUND_HALF_UP) * 100,
                    'recurring' => [
                        'interval'  =>  StripeControl::$periods[$bill->period],
                        'interval_count'    =>  1
                    ]
                ],
                "url"   =>  env('APP_URL') . '/' . $user->username,
            ];

            try {
                $product = StripeControl::createProduct($productPayload);
                $bill->product_id = $product->id;
                $bill->price_id = $product->default_price;
                $bill->save();

            } catch (Exception $e) {
                $bill->delete();

                return response()->json([
                    'status' => false,
                    'msg' => "Stripe Error: " . $e->getMessage()
                ]);
            }

            return response()->json([
                'status' => true,
                'msg' => "Bill added successfully, your upload will be approved shortly."
            ]);
    }

    public function billEdit(Request $request,$id){


        $validator = Validator::make($request->all(), [
            "name" => [
                "required",
                "string",
            ],
            "price" => [
                "required",
                "numeric",
                "min:0"
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

        $bill = Bills::where('uuid',$id)->first();
        $old_price = $bill->price;
        $old_period = $bill->period;

        if(!empty($bill)){
            $media = $request->thumbnail;

            $price = $request->price;
            $taxamount = round(($price * config('app.single_tax') / 100), 2, PHP_ROUND_HALF_UP);
            $createpriceid = $price + $taxamount;

            $bill->user_id = Auth::id();
            $bill->name = $request->name;
            $bill->currency = $user->default_currency;
            $bill->price = $price;
            $bill->tax_amount = $taxamount;
            $bill->thumbnail = !empty($media) ? $media : null;
            $bill->period = $request->period;

            $bill->save();

            try {
                $stripe = new StripeClient(env('STRIPE_SECRET_KEY'));

                if($old_price != $bill->price || $old_period != $bill->period)
                {
                    $productPayload = [
                        "name"  => $bill->name,
                        "images" => [$bill->perma_link],
                        "default_price_data"    =>  [
                            "currency"  =>  $user->default_currency,
                            "unit_amount_decimal"   => round($createpriceid, 2, PHP_ROUND_HALF_UP) * 100,
                            'recurring' => [
                                'interval'  =>  StripeControl::$periods[$bill->period],
                                'interval_count'    =>  1
                            ]
                        ],
                        "url"   =>  env('APP_URL') . '/' . $user->username,
                    ];
                    $stripe_client = $stripe->products->create($productPayload);
                    $bill->price_id = $stripe_client->default_price;
                }
                else
                {
                    $stripe_client = $stripe->products->update($bill->product_id,[
                        'name' => $request->name ?? $bill->wishname,
                        'images' => [$bill->perma_link],
                        "default_price" => $bill->price_id,
                        // "url" => $request->item_url ?? null
                    ]);
                }

                $bill->product_id = $stripe_client->id;
                $bill->approved = 0;
                $bill->save();

                $logs = Logs::where('edited_bill_id',$bill->id)->where('status','pending')->first();
                if(!empty($logs)){
                    $logs->status = 'updated';
                    $logs->save();
                }

            } catch (Exception $e) {
                $bill->delete();

                return response()->json([
                    'status' => false,
                    'msg' => "Stripe Error: " . $e->getMessage()
                ]);
            }

            return response()->json([
                'status' => true,
                'msg' => "Bill edited successfully."
            ]);
        }

    }


    public function removeBill($uuid){

        $bill = Bills::whereUuid($uuid)->first();

        if(!empty($bill)){
            BillPayment::where('bills_id',$bill->id)->delete();

            $bill->delete();
            return redirect()->back()->with('success','Bill removed successfully.');
        }

        return redirect()->back()->with('error','Bill not found.');

    }


    /**
     * Buy creator's membership
     *
     * @param Request $request
     * @param string $uuid Membership UUID
     * @param string $reccure Subscription Reccuring - onetime or continue
     * @return mixed
     */
    public function buyBill(Request $request, $uuid ,$reccure = 'continue')
    {
        $bill = Bills::whereUuid($uuid)->with('user')->first();

        if (Auth::check() && ($bill->user_id == Auth::id())) {
            return redirect()->back()->with('error', "You can't buy your own bill!");
        }

        if (!$bill) {
            return redirect()->back()->with('error', 'Bill not found!');
        }

        $vat_percentage_amount = 0;

        $currency   =   strtolower($request->cookie("currency", "GBP"));
        $tax = round($bill->tax_amount, 2, PHP_ROUND_HALF_UP);
        $price = round($bill->price, 2, PHP_ROUND_HALF_UP);

        $fee_per = round(($tax / ($tax + $price)) * 100, 2, PHP_ROUND_HALF_UP);

        if(!empty($bill->user->vat_amount_percentage)){
            $vat_percentage_amount = $price * $bill->user->vat_amount_percentage / 100;
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

            $sub = BillPayment::create([
                'bills_id'  =>  $bill->id,
                'user_id'       =>  Auth::id() ?? null,
                'guest_name'    =>  $request->name ?? NULL,
                'guest_email'   =>  $request->email,
                'currency'      =>  $bill->currency,
                'amount'        =>  $bill->price,
                'tax'           =>  $bill->tax_amount,
                'recurring_for' =>  $reccure,
                'recurring_type' => 'monthly',
                'message'  =>  $request->message ?? NULL,
                'anonymous' => $request->anonymous ?? 0
            ]);

            $price += $vat_percentage_amount;

            $amount = $price + $tax;
            $unit_amount = Helpers::priceFormat($bill->currency, $amount, $currency) * 100;
            $tax =   Helpers::priceFormat($bill->currency, $tax, $currency);

            $items  =   [
                'quantity' =>   1
            ];
            // if($currency == strtolower($bill->currency)) {
            //     $items['price']  =   $bill->price_id;
            // } else {
                $items['price_data']    =   [
                    'currency'  =>  $currency,
                    'product'   =>  $bill->product_id,
                    'unit_amount_decimal'   =>  $unit_amount,
                    'recurring' => [
                        'interval'  =>  StripeControl::$periods[$bill->period],
                        'interval_count'    =>  1
                    ]
                ];
            // }

            $payload    =   [
                "currency"  =>  $currency,
                'line_items' =>  [$items],
                'customer_email'    =>  $request->email,
                'success_url'       =>  route('bill.handle', ['uuid' => $sub->uuid, 'status' => "success"]),
                'cancel_url'       =>  route('bill.handle', ['uuid' => $sub->uuid, 'status' => "cancel"]),
            ];

            $payload['mode']    =   'subscription';
            $payload['subscription_data']     =   [
                'application_fee_percent'   =>  $fee_per,
                'transfer_data' => [
                    'destination' => $bill->user->account_id, // Creator's connected account ID
                ],
                // 'on_behalf_of'  => $bill->user->account_id,
                // 'cancel_at_period_end'  =>  $reccure == 'onetime',
                'description'   => "{$bill->name} of {$bill->user->username}."
            ];

            // try {
                $session = StripeControl::createCheckoutSession($payload);
                $sub->update([
                    'session_id' =>  $session->id
                ]);

                return Inertia::location($session->url);
            // } catch (Exception $e) {
            //     $sub->delete();
            //     return back()->with('error', $e->getMessage());
            // }
            // return response()->json([
            //     'success'   => true,
            //     'session'   => $session
            // ]);


        }

        return Inertia::render('bills/BillCheckout', [
            'bill'  => $bill,
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
        $bill_pay = BillPayment::whereUuid($uuid)->first();
        if (!$bill_pay) {
            return to_route('home')->with("error", 'Insufficient data!');
        }
        if ($bill_pay->status !== 'initiated') {
            return to_route('home')->with("error", 'Subscription already processed!');
        }
        try {
            $session = StripeControl::getCheckoutSession($bill_pay->session_id);
            $bill_pay->status = $session->payment_status;
            if ($session->payment_status == 'paid') {
                $bill_pay->stripe_id = $session->subscription;
                $current = Carbon::now();
                if ($bill_pay->recurring_type == "monthly") {
                    $current->addMonth();
                }
                if ($bill_pay->recurring_type == "weekly") {
                    $current->addWeek();
                }
                if ($bill_pay->recurring_type == "yearly") {
                    $current->addYear();
                }
                $bill_pay->upcoming_payment = $current;
                $bill_pay->save();

                BillPayMail::dispatch($bill_pay);

                // if ($bill_pay->wish_item->user->auto_tweet == 1) {
                //     // MakeAutoTweets::dispatch($user);
                //     SubscribeAutoTweet::dispatch($bill_pay);
                //     bill_paybershipAutoTweet::dispatch($bill_pay);
                // }

                return to_route('user.show', ['username' => $bill_pay->bill->user->username])->with('success', "Payment for subscription of bill is success.");
            }

            // SubscriptionFailed::dispatch($bill_pay);

            $bill_pay->save();
            return to_route('user.show', ['username' => $bill_pay->bill->user->username])->with('warning', "Bill is in {$session->payment_status} status.");
        } catch (Exception $e) {
            return to_route('user.show', ['username' => $bill_pay->bill->user->username])->with('error', $e->getMessage());
        }
        // return response()->json([
        //     'success'   =>  true,
        //     'session'   =>  $session,
        //     'status'    =>  $status
        // ]);
    }

}
