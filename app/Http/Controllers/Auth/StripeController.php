<?php

namespace App\Http\Controllers\Auth;

use App\Helpers;
use App\Http\Controllers\Controller;
use App\Jobs\CheckoutMailToUser;
use App\Jobs\CheckoutUser;
use App\Jobs\SendRenewMail;
use App\Jobs\SubscribedMail;
use App\Jobs\SubscriptionCancelAtEnd;
use App\Models\StripePaymentDetail;
use App\Models\StripePaymentItems;
use App\Models\StripeWebhookStatus;
use App\Models\Subscription;
use App\Models\TipGoal;
use App\Models\TipGoalsPayment;
use App\Models\User;
use App\Models\UserCart;
use App\Models\WishItem;
use App\Models\WishItemSubscription;
use App\StripeControl;
use Carbon\Carbon;
use Exception;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;
use Ramsey\Uuid\Uuid;
use Stripe\Stripe;
use Stripe\Checkout\Session;
use Stripe\StripeClient;
use Stripe\Webhook;

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
    public function initConnect(Request $request, $step = "init", $country = null)
    {

        $user = User::find(Auth::id());
        if (empty($user->account_id)) {
            // if (!$request->isMethod("POST")) {
            //     return redirect()->back()->with("error", "Invalid request!");
            // }
            $country = strtoupper($country);
            try {
                $payload = [
                    "country" => $country,
                    "type" => "express",
                    'email' => $user->email,
                    'capabilities' => [
                        'card_payments' => ['requested' => true],
                        'transfers' => ['requested' => true],
                    ],
                    'business_type' => 'individual',
                    'business_profile' => [
                        'url'   =>  "https://spennypiggy.co/{$user->username}",
                        'mcc'   => '7278' //marketplaces - older - 5262
                    ],
                    'default_currency' => 'GBP',
                    'individual' => [
                        'address' => [
                            'city' => 'Birmingham',
                            'country' => 'GB',
                            'line1' => '55 Colmore Row',
                            'postal_code' => 'B3 2AA'
                        ],
                        'phone' => "2045873148"
                    ]
                ];
                $account = StripeControl::createAccount($payload);
                $user->account_id = $account->id;
                $user->country = $country;
                $user->save();
            } catch (Exception $e) {
                return redirect(route("stripe.index"))->with("error", "Account creation error:" . $e->getMessage());
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
                "type"        => "account_onboarding",
                "collect"   => 'currently_due'
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
                $user->default_currency = $account->default_currency;
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
            if (!empty(request()->query('message'))) {
                $wordLimit = 100;
                $message = request()->query('message');

                if (str_word_count($message) > $wordLimit) {
                    return redirect()->back()->with("error", "Max limit for message is 100 words");
                }
            }

            $user = User::findOrFail(Auth::id());
            $getdata = UserCart::where('user_id', Auth::id())
                ->where('owner_id', $owner_id)
                ->where('status', 1)
                ->with(['wish'])
                ->get();

            $lineItems = [];
            $subtotal = 0;
            $taxNew = 0;
            foreach ($getdata as $dd) {
                $priceId = $dd->priceid != Null ? $dd->priceid : $dd->wish->price_id;

                $lineItems[] = [
                    'price' => $priceId ?? '',
                    'quantity' => $dd->quantity,
                ];

                $subtotal += $dd->amount;
                $taxNew += $dd->tax;
            }

            $stripe = new \Stripe\StripeClient(env('STRIPE_SECRET_KEY'));

            $sessionCreate = $stripe->checkout->sessions->create([
                'success_url' => route('checkout.success', [$owner_id]),
                'cancel_url' => route('checkout.cancel', [$owner_id]),
                'line_items' => $lineItems,
                'mode' => 'payment',
                'payment_intent_data' => [
                    'transfer_data' => [
                        'destination' => $getdata[0]->owner->account_id, // Creator's connected account ID
                    ],
                    'application_fee_amount' => $taxNew,
                    'receipt_email' => $user->email,
                ],
                'customer_email' => $user->email,
            ]);

            $stripePaymentDetail = StripePaymentDetail::create([
                'amount_subtotal' => $subtotal,
                'amount_total' => $sessionCreate->amount_total / 100,
                'tax' => $taxNew,
                'currency' => $sessionCreate->currency,
                'payment_method_config_detail_id' => optional($sessionCreate->payment_method_configuration_details)->id,
                'payment_method_type' => optional($sessionCreate->payment_method_types)[0],
                'user_id' => Auth::id(),
                'owner_id' => $owner_id,
                'name' => request()->query('from') ?? '',
                'message' => $message ?? '',
                'session_created' => $sessionCreate->created,
                'session_expires_at' => $sessionCreate->expires_at,
                'created_at' => now(),
                'updated_at' => now(),
            ]);

            $stripePaymentDetail->refresh();

            return Inertia::location($sessionCreate->url);
        } catch (Exception $e) {
            return back()->with('error', 'Something went wrong. Error: ' . $e->getMessage());
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
        try {
            $getdata = UserCart::where('user_id', Auth::id())->where('owner_id', $owner_id)->where('status', 1)->get();

            foreach ($getdata as $dd) {
                $dd->status = 0;
                $dd->save();

                if (!empty($dd->wish->subscription)) {
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
                        $subscription->wish_id = $dd->wish_item_id;
                        $subscription->start_at = Carbon::now();
                        $subscription->end_at = $end;
                        $subscription->status = 1;
                        $subscription->save();
                    } elseif ($dd->wish->subscription == 2) {
                        $dd->wish->fullfill_amount += $dd->amount;
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
                    'tax' => $dd->tax,
                ]);
                $payment_data->refresh();
                $message = $stripeid->message;
                if ($dd->wish_item_id == NULL) {
                    CheckoutUser::dispatch($payment_data, false, $dd, $message, false);
                } else {
                    CheckoutUser::dispatch($payment_data, false, false, $message, false);
                }
            }

            CheckoutMailToUser::dispatch($stripeid);

            if (!empty($getdata[0]->owner->username)) {
                return redirect(route('user.show', [$getdata[0]->owner->username]))->with('success', 'Payment Successfull.');
            } else {
                return redirect(route('user.show', [Auth::user()->username]))->with('success', 'Payment Successfull.');
            }
        } catch (\Throwable $th) {
            Log::info('error:' . $th);
        }
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
    // public function createAnonymousCheckout($wishid = null, $amount = null)
    // {
    //     try {
    //         $wishdata = WishItem::whereId($wishid)->first();
    //         $lineItems = [];
    //         if ($wishdata->subscription == 2) {
    //             if (!empty($amount)) {
    //                 session()->forget('user_fullfill_amount');
    //                 session(['user_fullfill_amount' => $amount]);

    //                 $totalamount = $amount + ($amount * env('TAX_PERCENTAGE') / 100);

    //                 try {
    //                     $stripe = new StripeClient(env('STRIPE_SECRET_KEY'));
    //                     $stripe_client = $stripe->products->create([
    //                         'name' => $wishdata->wishname,
    //                         'images' => [$wishdata->perma_link],
    //                         "default_price_data" => ["currency" => "gbp", "unit_amount_decimal" => $totalamount * 100],
    //                     ]);
    //                 } catch (\Throwable $th) {
    //                     echo $th;
    //                     die;
    //                     return back()->with('error', $th);
    //                 }

    //                 $lineItems[] = [
    //                     'price' => $stripe_client->default_price ?? '',
    //                     'quantity' => 1,
    //                 ];
    //             } else {
    //                 return back()->with('error', 'Please enter a valid amount.');
    //             }
    //         } else {
    //             $lineItems[] = [
    //                 'price' => $wishdata->price_id ?? '',
    //                 'quantity' => 1,
    //             ];
    //         }

    //         $stripe = new \Stripe\StripeClient(env('STRIPE_SECRET_KEY'));
    //         $sessioncreate = $stripe->checkout->sessions->create([
    //             'success_url' => route('checkout.anonymous.success', [$wishdata->id]),
    //             'cancel_url' => route('checkout.anonymous.cancel', [$wishdata->id]),
    //             'line_items' => $lineItems,
    //             'mode' => 'payment',
    //         ]);

    //         $callbackData = $sessioncreate;
    //         $subtotal = ($callbackData->amount_total / 100) / (1 + (env('TAX_PERCENTAGE') / 100));
    //         $taxnew = ($callbackData->amount_total / 100) - ($subtotal);

    //         session()->forget('anonymous_session_id');
    //         session(['anonymous_session_id' => $callbackData->id]);
    //         $stripeid = StripePaymentDetail::create([
    //             'session_id' => $callbackData->id,
    //             'amount_subtotal' => $subtotal,
    //             'amount_total' => $callbackData->amount_total / 100,
    //             'tax' => $taxnew,
    //             'currency' => $callbackData->currency,
    //             'owner_id' => $wishdata->user_id,
    //             'payment_method_config_detail_id' => optional($callbackData->payment_method_configuration_details)->id,
    //             'payment_method_type' => optional($callbackData->payment_method_types)[0],
    //             'session_created' => $callbackData->created,
    //             'session_expires_at' => $callbackData->expires_at,
    //             'created_at' => Carbon::now(),
    //             'updated_at' => Carbon::now(),
    //         ]);
    //         $stripeid->refresh();

    //         return Inertia::location($sessioncreate->url);
    //     } catch (\Throwable $th) {
    //         throw $th;
    //     }
    // }

    public function createAnonymousCheckout($device_id)
    {
        try {
            // \Log::info(request()->query('name'));
            $cart = UserCart::where('device_id', $device_id)->where('status', 1)->get();

            if (!empty($cart)) {

                $lineItems = [];
                foreach ($cart as $key => $value) {

                    $lineItems[] = [
                        'price' => !empty($value->priceid) ? $value->priceid : $value->wish->price_id,
                        'quantity' => $value->quantity,
                    ];
                }

                $stripe = new \Stripe\StripeClient(env('STRIPE_SECRET_KEY'));
                $sessioncreate = $stripe->checkout->sessions->create([
                    'success_url' => route('checkout.anonymous.success', [$device_id]),
                    'cancel_url' => route('checkout.anonymous.cancel', [$device_id]),
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
                    'owner_id' => $cart[0]->owner_id,
                    'payment_method_config_detail_id' => optional($callbackData->payment_method_configuration_details)->id,
                    'payment_method_type' => optional($callbackData->payment_method_types)[0],
                    'session_created' => $callbackData->created,
                    'name' => request()->query('from') ?? null,
                    'message' => request()->query('message') ?? null,
                    'session_expires_at' => $callbackData->expires_at,
                    'created_at' => Carbon::now(),
                    'updated_at' => Carbon::now(),
                ]);
                $stripeid->refresh();

                return Inertia::location($sessioncreate->url);
            }
        } catch (\Throwable $th) {
            //throw $th;
        }
    }

    public function anonymousSuccessCheckout($device_id)
    {
        try {
            $sessionId = session('anonymous_session_id');
            StripePaymentDetail::where('session_id', $sessionId)->update([
                'payment_status' => 'paid',
                'updated_at' => Carbon::now(),
            ]);
            $stripeid = StripePaymentDetail::where('session_id', $sessionId)->first();

            $cart = UserCart::where('device_id', $device_id)->where('status', 1)->get();

            foreach ($cart as $key => $value) {
                $amount = $value->amount;
                $tax = $value->tax;
                if ($value->wish_item_id != null) {
                    if ($value->wish->subscription == 2) {
                        $value->wish->fullfill_amount += $amount;
                        $value->wish->save();
                    }
                }

                $data = StripePaymentItems::create([
                    'uuid' => Uuid::uuid4(),
                    'stripe_payment_detail_id' => $stripeid->id,
                    'wish_item_id' => $value->wish_item_id ?? null,
                    'amount' => $amount,
                    'tax' => $tax,
                ]);
                $data->refresh();
                $value->status = 0;
                $value->save();
                // $dd->wish_id == NULL
                CheckoutUser::dispatch($data, true, false, false, $stripeid->name);
            }


            return redirect(route('user.show', [$stripeid->owner->username]))->with('success', 'Payment Successfull.');
        } catch (\Throwable $th) {
            //throw $th;
        }
    }

    public function anonymousCancelCheckout($id = null)
    {
        $sessionId = session('anonymous_session_id');
        StripePaymentDetail::where('session_id', $sessionId)->update([
            'payment_status' => 'unpaid',
            'updated_at' => Carbon::now(),
        ]);

        return back()->with('error', 'Payment unsuccessfull.');
    }

    /**
     * Create Subscription
     *
     * @param Request $request
     * @param string $uuid WishItem UUID
     * @param string $reccure Subscription Reccurning - onetime or Continue
     * @return mixed
     */
    public function wishItemSubscribe(Request $request, $uuid, $reccure = 'continue')
    {
        $wish = WishItem::whereUuid($uuid)->with('user')->first();

        if (!$wish) {
            return redirect()->back()->with('error', 'Wish item not found!');
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
                'message'   =>  [
                    'sometimes',
                    'nullable',
                    'string',
                    'max:800'
                ]
            ]);

            $sub = WishItemSubscription::create([
                'wish_item_id'  =>  $wish->id,
                'user_id'       =>  Auth::id(),
                'guest_name'    =>  $request->name ?? NULL,
                'guest_email'   =>  $request->email,
                'currency'      =>  $wish->currency,
                'amount'        =>  $wish->price,
                'tax'           =>  $wish->tax_amount,
                'recurring_for' =>  $reccure,
                'recurring_type' =>  $wish->subscription_period,
                'surprise_message'  =>  $request->message ?? NULL
            ]);

            $currency   =   strtolower($request->cookie("currency", "GBP"));
            $tax = number_format($wish->tax_amount, 2);
            $price = number_format($wish->price, 2);

            $fee_per = number_format(($tax / ($tax + $price)) * 100, 2);
            if ($currency == strtolower($wish->currency)) {
                $items = [
                    "price" =>  $wish->price_id,
                    'quantity'      =>  1,
                ];
            } else {

                $amount = $price + $tax;
                $unit_amount = Helpers::priceFormat($wish->currency, $amount, $currency) * 100;
                $tax =   Helpers::priceFormat($wish->currency, $tax, $currency);
                $items  =   [
                    'quantity'      =>  1,
                    'price_data'    =>   [
                        'currency'  =>  $currency,
                        'product'   =>  $wish->stripe_product_id,
                        'unit_amount_decimal'   =>  $unit_amount,
                        'recurring' =>  [
                            'interval'  =>  StripeControl::$periods[$wish->subscription_period],
                            'interval_count'    =>  1
                        ]
                    ]
                ];
            }
            $payload = [
                "mode"  =>  'subscription',
                "currency"  =>  strtolower($request->cookie("currency", "GBP")),
                'line_items' =>  [$items],
                'subscription_data' =>  [
                    'application_fee_percent'   =>  $fee_per,
                    'transfer_data' => [
                        'destination' => $wish->user->account_id, // Creator's connected account ID
                    ],
                    'on_behalf_of'  => $wish->user->account_id,
                    // 'cancel_at_period_end'  =>  $reccure == 'onetime',
                    'description'   => "Subscription for {$wish->wishname} of {$wish->user->username}."
                ],
                'customer_email'    =>  $request->email,
                'success_url'       =>  route('wish.subscribe.handle', ['uuid' => $sub->uuid, 'status' => "success"]),
                'cancel_url'       =>  route('wish.subscribe.handle', ['uuid' => $sub->uuid, 'status' => "cancel"]),
            ];

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

        return Inertia::render('cart/SubCheckout', [
            'wish'  => $wish,
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
    public function handleSubscription($uuid, $status)
    {
        $sub = WishItemSubscription::whereUuid($uuid)->first();
        if (!$sub) {
            return to_route('home')->with("error", 'Insufficient data!');
        }
        if ($sub->status !== 'initiated') {
            return to_route('home')->with("error", 'Subscription already processed!');
        }
        try {
            $session = StripeControl::getCheckoutSession($sub->session_id);
            $sub->status = $session->payment_status;
            if ($session->payment_status == 'paid') {
                $sub->stripe_id = $session->subscription;
                $current = Carbon::now();
                if ($sub->recurring_type == 'daily') {
                    $current->addDay();
                } else if ($sub->recurring_type == 'weekly') {
                    $current->addWeek();
                } else if ($sub->recurring_type == "monthly") {
                    $current->addMonth();
                } else {
                    $current->addYear();
                }
                $sub->upcoming_payment = $current;
                $sub->save();




                if ($sub->recurring_for == 'onetime') {
                    SubscriptionCancelAtEnd::dispatch($sub);
                } else {
                    SubscribedMail::dispatch($sub);
                }

                return to_route('user.show', ['username' => $sub->wish_item->user->username])->with('success', "Subscription Success. If you have paid for one time, subscription will be autocanceled on period end.");
            }

            $sub->save();
            return to_route('user.show', ['username' => $sub->wish_item->user->username])->with('warning', "Subscription is in {$session->payment_status} status.");
        } catch (Exception $e) {
            return to_route('user.show', ['username' => $sub->wish_item->user->username])->with('error', $e->getMessage());
        }
        // return response()->json([
        //     'success'   =>  true,
        //     'session'   =>  $session,
        //     'status'    =>  $status
        // ]);
    }


    public function subscriptionStatus(Request $request)
    {

        $stripe = new StripeClient(env('STRIPE_SECRET_KEY'));

        // This is your Stripe CLI webhook secret for testing your endpoint locally.
        $endpoint_secret = 'whsec_qNWOiTkgFFtKhrjRNWKfwWXUyWdSSIyo';

        $payload = @file_get_contents('php://input');
        $sig_header = $_SERVER['HTTP_STRIPE_SIGNATURE'];
        $event = null;

        try {
            $event = Webhook::constructEvent(
                $payload,
                $sig_header,
                $endpoint_secret
            );
        } catch (\UnexpectedValueException $e) {
            // Invalid payload
            http_response_code(400);
            exit();
        } catch (\Stripe\Exception\SignatureVerificationException $e) {
            // Invalid signature
            http_response_code(400);
            exit();
        }

        // $invoice = null;
        // // Handle the event
        // switch ($event->type) {
        //     case 'invoice.created':
        //         $invoice = $event;
        //     case 'invoice.deleted':
        //         $invoice = $event;
        //     case 'invoice.finalization_failed':
        //         $invoice = $event;
        //     case 'invoice.finalized':
        //         $invoice = $event;
        //     case 'invoice.marked_uncollectible':
        //         $invoice = $event;
        //     case 'invoice.paid':
        //         $invoice = $event;
        //     case 'invoice.payment_action_required':
        //         $invoice = $event;
        //     case 'invoice.payment_failed':
        //         $invoice = $event;
        //     case 'invoice.payment_succeeded':
        //         $invoice = $event;
        //     case 'invoice.sent':
        //         $invoice = $event;
        //     case 'invoice.upcoming':
        //         $invoice = $event;
        //     case 'invoice.updated':
        //         $invoice = $event;
        //     case 'invoice.voided':
        //         $invoice = $event;
        //         // ... handle other event types
        //     default:
        //         echo 'Received unknown event type ' . $event->type;
        // }
        $array = [];
        if (!empty($event)) {
            $subs = WishItemSubscription::where('stripe_id', $event->data->object->subscription)->first();

            $ret = StripeControl::getSubscription($event->data->object->subscription);

            if ($event->type == "invoice.updated" && !empty($subs)) {

                $array = [
                    'email' => $event->data->object->customer_email,
                    'name' => $event->data->object->customer_name,
                    'invoice_pdf' => $event->data->object->invoice_pdf,
                    'uuid' => $subs->uuid
                ];

                $subs->upcoming_payment = Carbon::createFromTimestamp($ret->current_period_end)->format('Y-m-d H:i:s');
                $subs->save();

                SendRenewMail::dispatch($array);
            }

            if (!empty($subs)) {
                $stripe = new StripeWebhookStatus;
                $stripe->subscription_id = $subs->id;
                $stripe->invoice_type = $event->type;
                $stripe->data = $event;
                $stripe->save();
            }
        }

        return true;
    }


    public function cancelSubs($uuid)
    {
        $subs = WishItemSubscription::where('uuid', $uuid)->first();
        $subs->status = "cancelled";
        $subs->save();

        StripeControl::cancelSubscription($subs->stripe_id);
        return to_route('user.show', ['username' => $subs->wish_item->user->username])->with('success', "Subscription is cancelled for wish {$subs->wish_item->wishname}.");
    }


    // public function tipToJar(Request $request, $uuid)
    // {
    //     $goal = TipGoal::where('uuid', $uuid)->first();


    //     $currency = !empty(request()->cookie('currency')) ? strtolower(request()->cookie('currency')) : 'gbp';
    //     if (!$goal) {
    //         return redirect()->back()->with('error', 'No tip jar found!');
    //     }

    //     if ($request->isMethod("POST")) {
    //         $request->validate([
    //             'name' => [
    //                 'required',
    //                 'string',
    //                 'min:3',
    //                 'max:50'
    //             ],
    //             'message'   =>  [
    //                 'sometimes',
    //                 'nullable',
    //                 'string',
    //                 'max:800'
    //             ]
    //         ]);

    //         $sub = TipGoalsPayment::create([
    //             'tip_goal_id'  =>  $goal->id,
    //             'user_id'       =>  Auth::id(),
    //             'guest_name'    =>  $request->name,
    //             'currency'      =>  $goal->currency,
    //             'amount'        =>  $goal->default_price,
    //             'tax'           =>  $goal->tax_amount,
    //             'message'  =>  $request->message ?? NULL
    //         ]);

    //         $price = round($goal->default_price, 2, PHP_ROUND_HALF_UP);
    //         $tax = round($goal->tax_amount, 2, PHP_ROUND_HALF_UP);

    //         $payload = [
    //             'success_url' => route('checkout.success', [$id]),
    //             'cancel_url' => route('checkout.cancel', [$id]),
    //             'line_items' => $lineItems,
    //             'mode' => 'payment',
    //             'payment_intent_data' => [
    //                 'transfer_data' => [
    //                     'destination' => $getdata[0]->owner->account_id, // Creator's connected account ID
    //                 ],
    //                 'application_fee_amount' => $taxNew * 100,
    //                 'on_behalf_of'  => $getdata[0]->owner->account_id,
    //             ],
    //             'customer_email' =>  request()->query('email') ?? $getdata[0]->user->email,
    //         ];

    //         try {
    //             $session = StripeControl::createCheckoutSession($payload);
    //             $sub->update([
    //                 'session_id' =>  $session->id
    //             ]);

    //             return Inertia::location($session->url);
    //         } catch (Exception $e) {
    //             return back()->with('error', $e->getMessage());
    //         }
    //         // return response()->json([
    //         //     'success'   => true,
    //         //     'session'   => $session
    //         // ]);


    //     }

    //     return Inertia::render('cart/SubCheckout', [
    //         'wish'  => $wish,
    //         'reccure'   => $reccure
    //     ]);
    // }
}
