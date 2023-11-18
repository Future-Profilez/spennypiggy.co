<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
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
    public function initConnect(Request $request, $step = "init")
    {

        $user = User::find(Auth::id());
        if (empty($user->account_id)) {
            // if (!$request->isMethod("POST")) {
            //     return redirect()->back()->with("error", "Invalid request!");
            // }

            try {
                $payload = [
                    "country" => "US",
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
                "refresh_url" => route("stripe.connect", ["step" => "refresh"]),
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
                'cancel_url' => route('checkout.cancel'),
                'line_items' => $lineItems,
                'mode' => 'payment',
            ]);

            $callbackData = $sessioncreate;
            session()->forget('session_id');
            session(['session_id' => $callbackData->id]);
            $stripeid = StripePaymentDetail::create([
                'session_id' => $callbackData->id,
                'amount_subtotal' => $callbackData->amount_subtotal,
                'amount_total' => $callbackData->amount_total,
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

            foreach ($getdata as $dd) {
                StripePaymentItems::create([
                    'uuid' => Uuid::uuid4(),
                    'stripe_payment_id' => $stripeid->id,
                    'wish_item_id' => $dd->wish_id,
                    'user_cart_id' => $dd->id,
                    'amount' => $dd->amount,
                ]);
            }

        

            $owner = User::where('id', $owner_id)->first();

            //send email
            CheckoutUser::dispatch($user);
            CheckoutUser::dispatch($owner);
            

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
        return redirect(route('user.show', [$getdata[0]->owner->username]))->with('success', 'Payment Successfull.');
    }

    public function cancelCheckout()
    {
        $sessionId = session('session_id');
        StripePaymentDetail::where('session_id', $sessionId)->update([
            'payment_status' => 'unpaid',
            'updated_at' => Carbon::now(),
        ]);
        return view('cancel');
    }

    /* Anonymous checkout */
    public function createAnonymousCheckout($priceid = null, $quantity = null)
    {
        try {
            $lineItems = [
                [
                    'price' => $priceid ?? '',
                    'quantity' => $quantity ?? 1,
                ],
            ];

            $stripe = new \Stripe\StripeClient(env('STRIPE_SECRET_KEY'));
            $sessioncreate = $stripe->checkout->sessions->create([
                'success_url' => route('checkout.anonymous.success'),
                'cancel_url' => route('checkout.anonymous.cancel'),
                'line_items' => $lineItems,
                'mode' => 'payment',
            ]);

            $callbackData = $sessioncreate;
            session()->forget('anonymous_session_id');
            session(['anonymous_session_id' => $callbackData->id]);
            StripePaymentDetail::create([
                'session_id' => $callbackData->id,
                'amount_subtotal' => $callbackData->amount_subtotal,
                'amount_total' => $callbackData->amount_total,
                'currency' => $callbackData->currency,
                'payment_method_config_detail_id' => optional($callbackData->payment_method_configuration_details)->id,
                'payment_method_type' => optional($callbackData->payment_method_types)[0],
                'session_created' => $callbackData->created,
                'session_expires_at' => $callbackData->expires_at,
                'created_at' => Carbon::now(),
                'updated_at' => Carbon::now(),
            ]);


            return Inertia::location("https://checkout.stripe.com/c/pay/cs_test_a1jgKGZXBgUInXbv2q4Ik3o4TjQMBZHMPkQEDWVs1i08XpqTx4Bw8ABEIg#fidkdWxOYHwnPyd1blpxYHZxWjA0SjZoZEZCMn12S1ZmSWhdQmZQb0xrVEZLb1xLXTBqaGhJS2BKcHFUVk8zQVNndWNzSFI3SnB1UEcwZ1FObm5%2FR3xsRk9VdEJ8NkxTPDdvQUZAM1xMbFFTNTVMX3ZvY2IzVicpJ2N3amhWYHdzYHcnP3F3cGApJ2lkfGpwcVF8dWAnPyd2bGtiaWBabHFgaCcpJ2BrZGdpYFVpZGZgbWppYWB3dic%2FcXdwYHgl");
        } catch (\Throwable $th) {
            \Log::error("Error in createAnonymousCheckout: " . $th->getMessage());
            throw $th;
        }
    }

    public function anonymousSuccessCheckout()
    {
        try {
            $sessionId = session('anonymous_session_id');
            StripePaymentDetail::where('session_id', $sessionId)->update([
                'payment_status' => 'paid',
                'updated_at' => Carbon::now(),
            ]);
            print_r("success");
            die;
            // return redirect()->back()->with('success', 'Payment Successfull.');
        } catch (\Throwable $th) {
            //throw $th;
        }
    }

    public function anonymousCancelCheckout()
    {
        $sessionId = session('anonymous_session_id');
        StripePaymentDetail::where('session_id', $sessionId)->update([
            'payment_status' => 'unpaid',
            'updated_at' => Carbon::now(),
        ]);
        return view('cancel');
    }
}
