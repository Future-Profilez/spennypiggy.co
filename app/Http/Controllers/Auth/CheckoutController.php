<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Jobs\CheckoutMailToUser;
use App\Jobs\CheckoutUser;
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
                // $priceId = $dd->wish->subscription == 2 ? $dd->priceid : $dd->wish->price_id;
                $priceId = $dd->priceid != Null ? $dd->priceid : $dd->wish->price_id;

                $lineItems[] = [
                    'price' => $priceId ?? '',
                    'quantity' => $dd->quantity,
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
                    'application_fee_amount' => $taxNew * 100,
                    'on_behalf_of'  => $getdata[0]->owner->account_id,
                ],
                // 'customer' => $getdata[0]->user->account_id ?? '',
                'customer_email' =>  request()->query('email') ?? $getdata[0]->user->email
            ]);

            // $subtotal = ($sessionCreate->amount_total / 100) / (1 + (env('TAX_PERCENTAGE') / 100));

            // $taxNew = ($sessionCreate->amount_total / 100) - $subtotal;

            session()->forget('session_id');
            session(['session_id' => $sessionCreate->id]);
            $stripePaymentDetail = StripePaymentDetail::create([
                'session_id' => $sessionCreate->id,
                'amount_subtotal' => $subtotal,
                'amount_total' => $sessionCreate->amount_total / 100,
                'tax' => $taxNew,
                'currency' => $sessionCreate->currency,
                'payment_method_config_detail_id' => optional($sessionCreate->payment_method_configuration_details)->id,
                'payment_method_type' => optional($sessionCreate->payment_method_types)[0],
                'user_id' => Auth::id() ?? null,
                'owner_id' => $getdata[0]->owner->id,
                'name' => request()->query('from') ?? '',
                'message' => $message ?? '',
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
                            $subscription->wish_id = $dd->wish_id;
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
                $dd->status = 0;
                $dd->quantity = 0;
                $dd->save();
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
                    'stripe_payment_id' => $stripeid->id,
                    'wish_item_id' => $dd->wish_id ?? Null,
                    'user_cart_id' => $dd->id,
                    'amount' => $dd->amount,
                    'tax' => $dd->tax,
                ]);
                $payment_data->refresh();
                $message = $stripeid->message;
                if (Auth::check()) {
                    if ($dd->wish_id == NULL) {
                        CheckoutUser::dispatch($payment_data, false, $dd, $message);
                    } else {
                        CheckoutUser::dispatch($payment_data, false, false, $message);
                    }
                } else {
                    CheckoutUser::dispatch($payment_data, true, false, false, $stripeid->name);
                }
            }
            if (Auth::check()) {
                CheckoutMailToUser::dispatch($stripeid);
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
