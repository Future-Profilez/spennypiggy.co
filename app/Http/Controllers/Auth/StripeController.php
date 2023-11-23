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
use App\Models\WishItem;
use App\StripeControl;
use Carbon\Carbon;
use Exception;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Ramsey\Uuid\Uuid;
use Stripe\Stripe;
use Stripe\Checkout\Session;
use Stripe\StripeClient;

class StripeController extends Controller
{

    /**
     * Landing Page for Stripe Connect
     *
     * @return Inertia
     */
    public function index()
    {
        $user = User::find(Auth::id());
        if (!empty($user->account_id)) {

            try {
                $account = StripeControl::getAccount($user->account_id);
                if ($account->charges_enabled) {
                    return redirect(route("user.show"))->with("success", "Already Connected!");
                }
            } catch (Exception $e) {
                return redirect(route("user.show"))->with("error", $e->getMessage());
            }
        }

        // return Inertia::render("Stripe/Index");

        return Inertia::render("stripe/Stripe");
    }



    /**
     * Init Connect Account Start
     *
     * @param Request $request
     * @param string $step Connection Current Step
     * @return mixed
     */
    public function initConnect(Request $request, $step = "init", $country)
    {

        $user = User::find(Auth::id());
        if (empty($user->account_id)) {
            // if (!$request->isMethod("POST")) {
            //     return redirect()->back()->with("error", "Invalid request!");
            // }

            try {
                $payload = [
                    "country" => strtoupper($country),
                    "type" => "express",
                    'email' => $user->email,
                    'capabilities' => [
                        'card_payments' => ['requested' => true],
                        'transfers' => ['requested' => true],
                    ],
                    'business_type' => 'individual',
                    // 'business_profile' => ['url' => route("user.show", ["username" => $user->username])],
                ];


                $account = StripeControl::createAccount($payload);
                $user->account_id = $account->id;
                $user->country = $country;
                $user->save();
            } catch (Exception $e) {
                return redirect(route("stripe.index"))->with("error", "First invalid error");
            }
        }

        try {
            $account = StripeControl::getAccount($user->account_id);
            if ($account->charges_enabled) {
                return redirect(route("user.show", ["username" => $user->username]))->with("success", "Stripe already connected.");
            }

            $link = StripeControl::createAccountLink([
                "account" => $account->id,
                "refresh_url" => route("stripe.connect", ["step" => "refresh", "country" => $user->country]),
                "return_url"  => route("stripe.return"),
                "type"        => "account_onboarding"
            ]);

            return Inertia::location($link->url);
            // return redirect()->away($link->url);
        } catch (Exception $e) {
            return redirect(route("stripe.index"))->with("error", "Internal server error:" . $e->getMessage());
        }
    }




    /**
     * Return URL After Success
     *
     * @param Request $request
     * @return mixed
     */
    public function connectReturn(Request $request)
    {

        $data = $request->all();
        $user = User::find(Auth::id());
        if (empty($user->account_id)) {
            return redirect(route("user.show", ["username" => $user->username]))->with("error", "Stripe did not initiated properly.");
        }

        try {
            $account = StripeControl::getAccount($user->account_id);
            if (empty($user->stripe_details_submitted)) {
                $user->stripe_details_submitted = $account->details_submitted ?? NULL;
                $user->save();
            }
            return redirect(route("user.show", ["username" => $user->username]))->with("success", "Stripe connected.");
        } catch (Exception $e) {
            return redirect(route("user.show", ["username" => $user->username]))->with("error", $e->getMessage());
        }
    }

    /**
     * Login To Stripe Express Account Dashboard
     *
     * @param Request $request
     * @return Response
     */
    public function loginToStripe(Request $request)
    {
        try {
            $stripe = StripeControl::getLoginLink(Auth::user()->account_id);
            return Inertia::location($stripe->url);
        } catch (Exception $e) {
            return back()->with("error", $e->getMessage());
        }
    }

    /* create checkout */
    public function createCheckout($owner_id)
    {
        try {
            $user = User::where('id', Auth::id())->first();
            $getdata = UserCart::where('user_id', Auth::id())->where('owner_id', $owner_id)->where('status', 1)->with(['wish'])->get();

            $lineItems = [];
            foreach ($getdata as $dd) {
                if ($dd->wish->subscription == 2) {
                    $lineItems[] = [
                        'price' => $dd->priceid ?? '',
                        'quantity' => 1,
                    ];
                    $amountadd = $dd->wish->fullfill_amount + $dd->amount;
                    $dd->wish->fullfill_amount = $amountadd;
                    $dd->wish->save();
                } else {
                    $lineItems[] = [
                        'price' => $dd->wish->price_id ?? '',
                        'quantity' => 1,
                    ];
                }
            }

            $stripe = new \Stripe\StripeClient(env('STRIPE_SECRET_KEY'));
            $sessioncreate = $stripe->checkout->sessions->create([
                'success_url' => route('checkout.success', [$owner_id]),
                'cancel_url' => route('checkout.cancel', [$owner_id]),
                'line_items' => $lineItems,
                'mode' => 'payment',
            ]);

            $callbackData = $sessioncreate;
            \Log::info("callback data amount: " . $callbackData->amount_total);
            $subtotal = ($callbackData->amount_total / 100) / (1 + (env('TAX_PERCENTAGE') / 100));
            \Log::info("subtotal: " . $subtotal);
            $taxnew = ($callbackData->amount_total / 100) - ($subtotal);

            session()->forget('session_id');
            session(['session_id' => $callbackData->id]);
            $stripeid = StripePaymentDetail::create([
                'session_id' => $callbackData->id,
                'amount_subtotal' => $subtotal,
                'amount_total' => $callbackData->amount_total / 100,
                'tax' => $taxnew,
                'currency' => $callbackData->currency,
                'payment_method_config_detail_id' => optional($callbackData->payment_method_configuration_details)->id,
                'payment_method_type' => optional($callbackData->payment_method_types)[0],
                'user_id' => Auth::id(),
                'owner_id' => $owner_id,
                'session_created' => $callbackData->created,
                'session_expires_at' => $callbackData->expires_at,
                'created_at' => Carbon::now(),
                'updated_at' => Carbon::now(),
            ]);
            $stripeid->refresh();

            return Inertia::location($sessioncreate->url);
        } catch (\Throwable $th) {
            \Log::error("Error in createCheckout: " . $th->getMessage());
            throw $th;
        }
    }

    public function retrive($id)
    {
        $stripe = new \Stripe\StripeClient(env('STRIPE_SECRET_KEY'));
        $data = $stripe->checkout->sessions->retrieve(
            $id,
            []
        );
    }

    public function successCheckout($owner_id)
    {
        $user = User::where('id', Auth::id())->first();

        $getdata = UserCart::where('user_id', Auth::id())->where('owner_id', $owner_id)->where('status', 1)->with(['wish'])->get();
        foreach ($getdata as $dd) {
            $dd->status = 0;
            $dd->save();

            if ($dd->wish->subscription == 1) {

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
                'wish_item_id' => $dd->wish_id,
                'user_cart_id' => $dd->id,
                'amount' => $dd->amount,
                'tax' => $dd->tax,
            ]);
            $payment_data->refresh();

            CheckoutUser::dispatch($payment_data, false);
        }

        //send email
        CheckoutMailToUser::dispatch($stripeid);


        return redirect(route('user.show', [$getdata[0]->owner->username]))->with('success', 'Payment Successfull.');
    }

    public function cancelCheckout($owner_id)
    {
        $getdata = UserCart::where('user_id', Auth::id())->where('owner_id', $owner_id)->where('status', 1)->with(['wish'])->get();
        $sessionId = session('session_id');
        StripePaymentDetail::where('session_id', $sessionId)->update([
            'payment_status' => 'unpaid',
            'updated_at' => Carbon::now(),
        ]);
        return redirect(route('user.show', [$getdata[0]->owner->username]))->with('error', 'Payment Cancel.');
        // return view('cancel');
    }

    /* Anonymous checkout */
    public function createAnonymousCheckout($wishid = null, $amount = null)
    {
        try {
            $wishdata = WishItem::whereId($wishid)->first();
            $lineItems = [];
            if ($wishdata->subscription == 2) {
                if (!empty($amount)) {
                    session()->forget('user_fullfill_amount');
                    session(['user_fullfill_amount' => $amount]);

                    $totalamount = $amount + ($amount * env('TAX_PERCENTAGE') / 100);

                    try {
                        $stripe = new StripeClient(env('STRIPE_SECRET_KEY'));
                        $stripe_client = $stripe->products->create([
                            'name' => $wishdata->wishdata,
                            'images' => [$wishdata->perma_link],
                            "default_price_data" => ["currency" => "gbp", "unit_amount_decimal" => $totalamount * 100],
                        ]);
                    } catch (\Throwable $th) {
                        echo $th;
                        die;
                        return back()->with('error', $th);
                    }

                    $lineItems[] = [
                        'price' => $stripe_client->default_price ?? '',
                        'quantity' => 1,
                    ];
                } else {
                    return back()->with('error', 'Please enter a valid amount.');
                }
            } else {
                $lineItems[] = [
                    'price' => $wishdata->price_id ?? '',
                    'quantity' => 1,
                ];
            }

            $stripe = new \Stripe\StripeClient(env('STRIPE_SECRET_KEY'));
            $sessioncreate = $stripe->checkout->sessions->create([
                'success_url' => route('checkout.anonymous.success', [$wishdata->id]),
                'cancel_url' => route('checkout.anonymous.cancel', [$wishdata->id]),
                'line_items' => $lineItems,
                'mode' => 'payment',
            ]);

            $callbackData = $sessioncreate;
            $subtotal = ($callbackData->amount_total / 100) / (1 + (env('TAX_PERCENTAGE') / 100));
            $taxnew = ($callbackData->amount_total / 100) - ($subtotal);

            session()->forget('anonymous_session_id');
            session(['anonymous_session_id' => $callbackData->id]);
            $stripeid = StripePaymentDetail::create([
                'session_id' => $callbackData->id,
                'amount_subtotal' => $subtotal,
                'amount_total' => $callbackData->amount_total / 100,
                'tax' => $taxnew,
                'currency' => $callbackData->currency,
                'owner_id' => $wishdata->user_id,
                'payment_method_config_detail_id' => optional($callbackData->payment_method_configuration_details)->id,
                'payment_method_type' => optional($callbackData->payment_method_types)[0],
                'session_created' => $callbackData->created,
                'session_expires_at' => $callbackData->expires_at,
                'created_at' => Carbon::now(),
                'updated_at' => Carbon::now(),
            ]);
            $stripeid->refresh();

            return Inertia::location($sessioncreate->url);
        } catch (\Throwable $th) {
            throw $th;
        }
    }

    public function anonymousSuccessCheckout($id)
    {
        try {
            $sessionId = session('anonymous_session_id');
            StripePaymentDetail::where('session_id', $sessionId)->update([
                'payment_status' => 'paid',
                'updated_at' => Carbon::now(),
            ]);
            $stripeid = StripePaymentDetail::where('session_id', $sessionId)->first();
            $getdata = WishItem::whereId($id)->first();

            if ($getdata->subscription == 2) {
                $amount = session('user_fullfill_amount');
                $tax = $amount * env('TAX_PERCENTAGE') / 100;
                $getdata->fullfill_amount += $amount;
                $getdata->save();
            } else {
                $amount = $getdata->price;
                $tax = $getdata->tax_amount;
            }
            $data = StripePaymentItems::create([
                'uuid' => Uuid::uuid4(),
                'stripe_payment_id' => $stripeid->id,
                'wish_item_id' => $getdata->id,
                'amount' => $amount,
                'tax' => $tax,
            ]);
            $data->refresh();

            CheckoutUser::dispatch($data, true);

            return redirect(route('user.show', [$getdata->user->username]))->with('success', 'Payment Successfull.');
        } catch (\Throwable $th) {
            //throw $th;
        }
    }

    public function anonymousCancelCheckout($id)
    {
        $sessionId = session('anonymous_session_id');
        StripePaymentDetail::where('session_id', $sessionId)->update([
            'payment_status' => 'unpaid',
            'updated_at' => Carbon::now(),
        ]);

        return back()->with('error', 'Payment unsuccessfull.');
    }
}
