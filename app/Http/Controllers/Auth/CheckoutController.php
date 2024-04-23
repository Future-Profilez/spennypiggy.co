<?php

namespace App\Http\Controllers\Auth;

use App\Helpers;
use App\Http\Controllers\Controller;
use App\Jobs\CheckoutMailToUser;
use App\Jobs\CheckoutTweet;
use App\Jobs\CheckoutUser;
use App\Jobs\CrowdfundTweet;
use App\Jobs\SurpriseTweet;
use App\Models\Currency;
use App\Models\StripePaymentDetail;
use App\Models\StripePaymentItems;
use App\Models\Subscription;
use App\Models\User;
use App\Models\UserCart;
use App\StripeControl;
use Carbon\Carbon;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Session;
use Inertia\Inertia;
use Ramsey\Uuid\Uuid;

class CheckoutController extends Controller
{

    /* create checkout */
    public function createCheckout($id)
    {
        $currency = !empty(request()->cookie('currency')) ? strtolower(request()->cookie('currency')) : 'gbp';
        try {
            if (!empty(request()->query('message'))) {
                $wordLimit = 100;
                $message = request()->query('message');

                if (str_word_count($message) > $wordLimit) {
                    return redirect()->back()->with("error", "Max limit for message is 100 words");
                }
            }

            if (Auth::check()) {
                $getdata = UserCart::where('user_id', Auth::id())
                    ->where('owner_id', $id)
                    ->where('status', 1)
                    ->with(['wish'])
                    ->get();
            } else {
                $getdata = UserCart::where('device_id', $id)
                    ->where('status', 1)
                    ->with(['wish'])
                    ->get();
            }

            $lineItems = [];
            $subtotal = 0;
            $taxNew = 0;
            foreach ($getdata as $dd) {

                $amount = $dd->amount + $dd->tax;

                $lineItems[] = [
                    // 'price' => $dd->stripe_product_id ?? '',
                    'quantity' => $dd->quantity,
                    'price_data' => [
                        'currency' => $currency,
                        'product' => $dd->wish_item_id == null || (isset($dd->wish->subscription) && ($dd->wish->subscription == 2)) ? $dd->priceid : $dd->wish->stripe_product_id,
                        'unit_amount_decimal' => Helpers::priceFormat($dd->owner->default_currency, $amount, $currency) * 100
                    ]
                ];

                $subtotal += $dd->amount * $dd->quantity;
                $taxNew += $dd->tax * $dd->quantity;
            }

            $stripe = new \Stripe\StripeClient(env('STRIPE_SECRET_KEY'));

            $sessionCreate = $stripe->checkout->sessions->create([
                'success_url' => route('checkout.success', [$id]),
                'cancel_url' => route('checkout.cancel', [$id]),
                'line_items' => $lineItems,
                'mode' => 'payment',
                'payment_intent_data' => [
                    'transfer_data' => [
                        'destination' => $getdata[0]->owner->account_id, // Creator's connected account ID
                    ],
                    'application_fee_amount' => Helpers::priceFormat($dd->owner->default_currency, $taxNew, 'USD') * 100,
                ],
                'customer_email' =>  request()->query('email') ?? $getdata[0]->user->email,
                // 'currency' => 'usd',
            ]);

            session()->forget('session_id');
            session(['session_id' => $sessionCreate->id]);
            $stripePaymentDetail = StripePaymentDetail::create([
                'session_id' => $sessionCreate->id,
                'amount_subtotal' => $subtotal,
                'amount_total' => $sessionCreate->amount_total / 100,
                'tax' => $taxNew,
                'currency' => $getdata[0]->owner->default_currency,
                'payment_method_config_detail_id' => optional($sessionCreate->payment_method_configuration_details)->id,
                'payment_method_type' => optional($sessionCreate->payment_method_types)[0],
                'user_id' => Auth::id() ?? null,
                'owner_id' => $getdata[0]->owner->id,
                'name' => request()->query('from') ?? '',
                'message' => $message ?? '',
                'anonymous' => request()->query('anonymous') ?? 0,
                'session_created' => $sessionCreate->created,
                'session_expires_at' => $sessionCreate->expires_at,
                'created_at' => now(),
                'updated_at' => now(),
            ]);

            $stripePaymentDetail->refresh();

            return Inertia::location($sessionCreate->url);
        } catch (\Throwable $th) {
            // Log::error("Error in createCheckout: " . $th->getMessage());
            throw $th;
        }
    }

    public function successCheckout($id)
    {
        $currency = !empty(request()->cookie('currency')) ? strtolower(request()->cookie('currency')) : 'gbp';
        try {
            if (Auth::check()) {
                $getdata = UserCart::where('user_id', Auth::id())->where('owner_id', $id)->where('status', 1)->get();
            } else {
                $getdata = UserCart::where('device_id', $id)->where('status', 1)->get();
            }

            foreach ($getdata as $dd) {

                if (!empty($dd->wish->subscription)) {

                    if ($dd->wish->subscription == 1 && $dd->is_subscribed == 1) {
                        if (Auth::check()) {
                            if ($dd->wish->subscription_period == 'daily') {
                                $end = Carbon::now()->addDay(1);
                            } elseif ($dd->wish->subscription_period == 'weekly') {
                                $end = Carbon::now()->addWeek(1);
                            } elseif ($dd->wish->subscription_period == 'monthly') {
                                $end = Carbon::now()->addMonth(1);
                            }


                            $subscription = new Subscription();
                            $subscription->user_id = $dd->user_id;
                            $subscription->owner_id = $dd->owner_id;
                            $subscription->wish_id = $dd->wish_item_id;
                            $subscription->start_at = Carbon::now();
                            $subscription->end_at = $end;
                            $subscription->status = 1;
                            $subscription->save();
                        }
                    } elseif ($dd->wish->subscription == 2) {
                        $dd->wish->fullfill_amount += $dd->amount * $dd->quantity;
                        $dd->wish->save();
                    }
                }
            }

            $sessionId = session('session_id');
            StripePaymentDetail::where('session_id', $sessionId)->update([
                'payment_status' => 'paid',
                'updated_at' => Carbon::now(),
            ]);
            $stripeid = StripePaymentDetail::where('session_id', $sessionId)->first();
            foreach ($getdata as $dd) {
                $payment_data = StripePaymentItems::create([
                    'uuid' => Uuid::uuid4(),
                    'stripe_payment_detail_id' => $stripeid->id,
                    'wish_item_id' => $dd->wish_item_id ?? Null,
                    'user_cart_id' => $dd->id,
                    'amount' => $dd->amount,
                    'message_media' => $dd->wish->reward ?? null,
                    'media_type' => !empty($dd->wish->reward) ? 'image' : null,
                    'thank_you_approved' => !empty($dd->wish->reward) ? 1 : 0,
                    'tax' => $dd->tax,
                    'quantity' => $dd->quantity
                ]);
                $payment_data->refresh();

                $symbol = Currency::where('iso',strtoupper($payment_data->payment->currency))->first();

                $message = $stripeid->message;
                if (Auth::check()) {
                    if ($dd->wish_item_id == NULL) {
                        CheckoutUser::dispatch($payment_data, false, $dd, $message,null,$symbol->symbol);
                    } else {
                        CheckoutUser::dispatch($payment_data, false, false, $message,null,$symbol->symbol);
                    }
                } else {
                    CheckoutUser::dispatch($payment_data, true, false, false, $stripeid->name,$symbol->symbol);
                }
                $dd->status = 0;
                $dd->quantity = 0;
                $dd->save();

                if($dd->owner->auto_tweet == 1){
                    if(empty($dd->wish_item_id)){
                        SurpriseTweet::dispatch($payment_data);
                    }
                    elseif($dd->wish->subscription == 2){
                        CrowdfundTweet::dispatch($payment_data);
                    }
                    else{
                        CheckoutTweet::dispatch($payment_data);
                    }
                }
            }
            if (Auth::check()) {
                $curr = Currency::where('iso',strtoupper($currency))->first();
                CheckoutMailToUser::dispatch($stripeid,$curr->symbol);
            }

            return redirect(route('user.show', [$stripeid->owner->username]))->with('success', 'Payment Successfull.');
        } catch (\Throwable $th) {
            return redirect(route('user.show', [$stripeid->owner->username]))->with('error', 'Something went wrong!');
        }
    }

    public function cancelCheckout($id)
    {
        if (Auth::check()) {
            $getdata = UserCart::where('user_id', Auth::id())->where('owner_id', $id)->where('status', 1)->with(['wish'])->get();
        } else {
            $getdata = UserCart::where('device_id', $id)->where('status', 1)->with(['wish'])->get();
        }
        $sessionId = session('session_id');
        StripePaymentDetail::where('session_id', $sessionId)->update([
            'payment_status' => 'unpaid',
            'updated_at' => Carbon::now(),
        ]);
        return redirect(route('user.show', [$getdata[0]->owner->username]))->with('error', 'Payment Cancel.');
        // return view('cancel');
    }

    /**
     * Test Checkout
     *
     * @return mixed
     */
    public function testCheckout()
    {
        $carts = UserCart::whereOwnerId(1)->get();
        $owner = User::findOrFail(1);

        $items = [];
        $tax = 0;
        foreach ($carts as $c) {
            $items[] = [
                'price'     => $c->priceid ?? $c->wish->price_id,
                'quantity'  => $c->quantity
            ];
            $tax += ($c->tax * $c->quantity);
        }

        $payload = [
            "mode"  =>  "payment",
            "line_items"    => $items,
            "payment_intent_data"   =>  [
                'application_fee_amount'    => $tax * 100,
                'transfer_data' => [
                    'destination'   => $owner->account_id
                ],
                'on_behalf_of'  => $owner->account_id
            ],
            'success_url'   => route("test.stripe.callback"),
            'cancel_url'    => route("test.stripe.callback", ["status" => "cancel"])
        ];

        $session = StripeControl::createCheckoutSession($payload);
        Session::put("checkout_session", $session->id);
        return response()->json($session);
    }

    /**
     * Handle Test Checkout
     *
     * @param string $session Checkout Session Id
     * @param string $status Checkout Status
     */
    public function testCallback($status = "success")
    {
        $sessionId = Session::get("checkout_session");

        $session = StripeControl::getCheckoutSession($sessionId);
        return response()->json([
            'status'    => $status,
            'session'   => $session
        ]);
    }
}
