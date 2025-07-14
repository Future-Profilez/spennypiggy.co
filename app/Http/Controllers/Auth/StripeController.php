<?php

namespace App\Http\Controllers\Auth;

use AmrShawky\LaravelCurrency\Facade\Currency as FacadeCurrency;
use App\Helpers;
use App\Http\Controllers\Controller;
use App\Jobs\CheckoutMailToUser;
use App\Jobs\CheckoutUser;
use App\Jobs\MonthlySubscribedJob;
use App\Jobs\MonthlySubscribedJobs;
use App\Jobs\MonthlySubscriptionFailedJobs;
use App\Jobs\NotificationSave;
use App\Jobs\SendMailSubscriptions;
use App\Jobs\SendPaymentSuccessEmail;
use App\Jobs\SendRenewMail;
use App\Jobs\SubscribeAutoTweet;
use App\Jobs\SubscribedMail;
use App\Jobs\SubscriptionCancelAtEnd;
use App\Jobs\SubscriptionFailed;
use App\Jobs\TipJarMailToUser;
use App\Jobs\TipJarPurchased;
use App\Jobs\TipJarTweet;
use App\Jobs\WishSubscriptionMailToUser;
use App\Models\BillPayment;
use App\Models\Bills;
use App\Models\ConnectedAccountCustomer;
use App\Models\Currency;
use App\Models\Membership;
use App\Models\MonthlyCharge;
use App\Models\Post;
use App\Models\StripePaymentDetail;
use App\Models\StripePaymentItems;
use App\Models\StripeWebhookStatus;
use App\Models\Subscription;
use App\Models\TipGoal;
use App\Models\TipGoalsPayment;
use App\Models\User;
use App\Models\UserCart;
use App\Models\UserPayment;
use App\Models\WishItem;
use App\Models\WishItemSubscription;
use App\StripeControl;
use Carbon\Carbon;
use Exception;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;
use League\ISO3166\ISO3166;
use Ramsey\Uuid\Uuid;
use Stripe\Stripe;
use Stripe\Checkout\Session;
use Stripe\StripeClient;
use Stripe\Webhook;
use Stripe\Identity;
use Stripe\Identity\VerificationSession;
use Stripe\Exception\SignatureVerificationException;
use Stripe\Customer;

class StripeController extends Controller
{
    public function __construct()
    {
        Stripe::setApiKey(env('STRIPE_SECRET_KEY'));
    }

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
    public function initConnect(Request $request, $step = "init", $country = null, $currency = null)
    {
        $user = User::find(Auth::id());

        // $sub_post = Post::where('user_id', $user->id)->where('for_module', 'subscription')->first();
        // $mem_post = Post::where('user_id', $user->id)->where('for_module', 'membership')->first();
        // $support_post = Post::where('user_id', $user->id)->where('for_module', 'support')->first();

        // $membership = Membership::where('user_id', $user->id)->where('deleted_at', null)->whereIn('status', [0, 1])->whereIn('approved', [0, 1])->first();
        // $bill = Bills::where('user_id', $user->id)->where('deleted_at', null)->whereIn('status', [0, 1])->whereIn('approved', [0, 1])->first();

        // if (empty($membership) || empty($bill)) {
        //     return redirect(route("user.show", ["username" => $user->username]))->with("error", "Before connecting your Stripe account, you need to add at least one Membership and one Bill for your fans total of at least two items.");
        // }



        if (empty($user->account_id)) {
            $country = strtoupper($country);
            try {
                $payload = [
                    "country" => $country,
                    "type" => "express",
                    'email' => $user->email,
                    'capabilities' => [
                        // 'card_payments' => ['requested' => $country == 'US'],  // Request only in the US
                        'card_payments' => ['requested' => true],  // Allow for all creators
                        'transfers' => ['requested' => true], // Always request transfers
                    ],
                    'tos_acceptance' => ['service_agreement' => $country == 'US' ? 'full' : 'recipient'],
                    'business_type' => 'individual',
                    'business_profile' => [
                        'url'   => "https://spennypiggy.co/{$user->username}",
                        'mcc'   => '7278',
                    ],
                    'default_currency' => $currency,
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
                $user->stripe_details_submitted = 1;
                $user->save();
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


    public function enableCardPayments() {
        $user = User::find(Auth::id());
        StripeControl::getClient()->accounts->update($user->account_id, [
            'capabilities' => [
                'card_payments' => ['requested' => true],
                'transfers' => ['requested' => true],
            ],
        ]);
        $accountLink =  StripeControl::getClient()->accountLinks->create([
            'account' => $user->account_id,
             "refresh_url" => route("stripe.connect", ["step" => "refresh", "country" => $user->country]),
            "return_url"  => route("stripe.return"),
            'type' => 'account_onboarding',
        ]);
        return Inertia::location($accountLink->url);
        // return response()->json(['url' => $accountLink->url]);
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

            $user = User::where('id', Auth::id())
                ->where('is_uk', 0)
                ->firstOrFail();

            $getdata = UserCart::where('user_id', Auth::id())
                ->where('owner_id', $owner_id)
                ->where('status', 1)
                ->with(['wish'])
                ->get();

            $lineItems = [];
            $subtotal = 0;
            $taxNew = 0;
            $adminFee = config('app.administration_fee');
            foreach ($getdata as $dd) {
                $priceId = $dd->priceid != Null ? $dd->priceid : $dd->wish->price_id;
                $totalPrice = $priceId + $adminFee + $dd->tax;

                $lineItems[] = [
                    'price' => $totalPrice ?? '',
                    'quantity' => $dd->quantity,
                ];

                $subtotal += $dd->amount;
                $taxNew += $dd->tax;
                $taxNew += $adminFee;
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
                'guest_email' => request()->query('email') ?? Auth::user()->email,
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


                // if ($dd->wish_item_id == NULL) {
                //     CheckoutUser::dispatch($payment_data, false, $dd, $message, false);
                // } else {
                //     CheckoutUser::dispatch($payment_data, false, false, $message, false);
                // }
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
                // CheckoutUser::dispatch($data, true, false, false, $stripeid->name);
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
        $checkGifterStatus = Helpers::checkGifterCardVerificationStatus();
        if ($checkGifterStatus === true) {
            $user = Auth::user();
            return to_route('user.show', ['username' => $user->username])
                ->with("error", "⚠️ Please complete your card verification payment and wait for admin approval before making further payments.");
        }

        $user = Auth::user();
        $wish = WishItem::whereUuid($uuid)->with('user')->first();
        if (!$wish) return redirect()->back()->with('error', 'Wish item not found!');
        $subtotals = 0;
        $totalAmount = $wish->price;
        $ConvertedToGBpAmount = Helpers::priceFormat($wish->currency, $totalAmount, 'gbp');
        $subtotals += $ConvertedToGBpAmount;


        $currency = strtolower($request->cookie("currency", "usd"));
        $tax = (float) str_replace(',', '', $wish->tax_amount);
        $price = (float) str_replace(',', '', $wish->price);
        $adminFee = (float) config('app.administration_fee');
        $totalTax = $tax + $adminFee;
        $vat_percentage_amount = 0;

        if ($reccure === 'continue' && !empty($wish->user->vat_amount_percentage)) {
            $vat_percentage_amount = ($price + $tax) * $wish->user->vat_amount_percentage / 100;
        }

        if ($request->isMethod("POST")) {
            if (!Auth::check() && $subtotals > 50) {
                return to_route('login', ['message' => 'Larger payments more than £50 need to login']);
            }
            $request->validate([
                'name' => ['nullable', 'sometimes', 'string', 'max:50'],
                'email' => ['required', 'email:dns'],
                'message' => ['sometimes', 'nullable', 'string', 'max:800'],
            ]);

            $sub = WishItemSubscription::create([
                'wish_item_id'   => $wish->id,
                'user_id'        => Auth::id(),
                'guest_name'     => $request->name ?? NULL,
                'guest_email'    => $request->email,
                'currency'       => $wish->currency,
                'amount'         => $wish->price,
                'tax'            => $totalTax,
                'vat_tax_amount' => ceil($vat_percentage_amount),
                'recurring_for'  => $reccure,
                'recurring_type' => $wish->subscription_period,
                'payment_method' => 'stripe',
                'surprise_message' => $request->message ?? NULL,
                'anonymous' => $request->anonymous ?? 0
            ]);

            $connectedAccountId = $wish->user->account_id;

            $storeCustomer = ConnectedAccountCustomer::where([
                'user_id' => $user->id,
                'creator_id' => $wish->user->id,
                'connected_account_id' => $connectedAccountId,
                'product_type' => $reccure != 'onetime' ? 'wish item subscription' : 'wish item subscription onetime',
                'currency' => $currency
            ])->first();

            if (!$storeCustomer) {
                $customer = StripeControl::createCustomer([
                    'email' => $user->email,
                    'name' => $user->name,
                ], $connectedAccountId);
            }

            $basePrice = Helpers::priceFormat($wish->currency, $wish->price, $currency);
            $platformFeePercentage = config('app.subs_tax');
            $adminFeeGBP = config('app.administration_fee');
            $gbpToUsdRate = Helpers::priceFormat('GBP', $adminFeeGBP, $currency);

            $platformFeeAmount = $basePrice * $platformFeePercentage / 100;
            $vatAmount = 0;
            if ($reccure === 'continue' && !empty($wish->user->vat_amount_percentage)) {
                $vat_percentage_amount = Helpers::priceFormat($wish->currency, $vat_percentage_amount, $currency);
                // $vatAmount = ($basePrice + $platformFeeAmount) * $wish->user->vat_amount_percentage / 100;
            }

            $creatorTotal = $basePrice + $vat_percentage_amount;
            $platformTotal = $platformFeeAmount + $gbpToUsdRate;
            $finalTotalAmount = $creatorTotal + $platformTotal;
            $applicationFeePercent = ($platformTotal / $finalTotalAmount) * 100;

            // Look for existing price with same currency
            $existingPrice = ConnectedAccountCustomer::where([
                'user_id' => $user->id,
                'creator_id' => $wish->user->id,
                'connected_account_id' => $connectedAccountId,
                'product_type' => $reccure != 'onetime' ? 'wish item subscription' : 'wish item subscription onetime',
                'product_id' => $wish->stripe_product_id,
                'currency' => $currency
            ])->first();

            $priceId = $existingPrice->price_id ?? null;

            if (!$priceId) {
                $priceParams = [
                    'unit_amount' => round($finalTotalAmount * 100),
                    'currency' => $currency,
                    'product' => $wish->stripe_product_id,
                ];
                if ($reccure !== 'onetime') {
                    $priceParams['recurring'] = [
                        'interval' => StripeControl::$periods[$wish->subscription_period],
                        'interval_count' => 1,
                    ];
                }

                $priceObj = StripeControl::createPrice($priceParams, $connectedAccountId);
                $priceId = $priceObj->id;
            }

            $customer_id = $storeCustomer->stripe_customer_id ?? $customer->id;

            // Handle currency mismatch for customer
            $existingSubscription = StripeControl::getActiveSubscriptionByCustomer($customer_id, $connectedAccountId);
            if ($existingSubscription && $existingSubscription->currency !== $currency) {
                $customer = StripeControl::createCustomer([
                    'email' => $user->email,
                    'name' => $user->name,
                ], $connectedAccountId);

                $customer_id = $customer->id;

                ConnectedAccountCustomer::create([
                    'user_id' => $user->id,
                    'creator_id' => $wish->user->id,
                    'connected_account_id' => $connectedAccountId,
                    'stripe_customer_id' => $customer_id,
                    'product_type' => $reccure != 'onetime' ? 'wish item subscription' : 'wish item subscription onetime',
                    'product_id' => $wish->stripe_product_id,
                    'price_id' => $priceId,
                    'currency' => $currency
                ]);
            }

            if (!$storeCustomer) {
                ConnectedAccountCustomer::create([
                    'user_id' => $user->id,
                    'creator_id' => $wish->user->id,
                    'connected_account_id' => $connectedAccountId,
                    'stripe_customer_id' => $customer_id,
                    'product_type' => $reccure != 'onetime' ? 'wish item subscription' : 'wish item subscription onetime',
                    'product_id' => $wish->stripe_product_id,
                    'price_id' => $priceId,
                    'currency' => $currency
                ]);
            }

            $payload = [
                'mode' => $reccure === 'onetime' ? 'payment' : 'subscription',
                'currency' => $currency,
                'line_items' => [
                    [
                        'price' => $priceId,
                        'quantity' => 1,
                    ],
                ],
                'customer' => $customer_id,
                'success_url' => route('wish.subscribe.handle', ['uuid' => $sub->uuid, 'status' => 'success']),
                'cancel_url' => route('wish.subscribe.handle', ['uuid' => $sub->uuid, 'status' => 'cancel']),
            ];

            if ($reccure === 'onetime') {
                $payload['payment_intent_data'] = [
                    'application_fee_amount' => round($platformTotal * 100),
                ];
            } else {
                $payload['subscription_data'] = [
                    'application_fee_percent' => round($applicationFeePercent, 2),
                    'description' => 'Wish Item Subscription Content Purchase.',
                    'metadata' => [
                        'user_id' => $user->id,
                        'creator_id' => $wish->user->id,
                        'wish_item_id' => $wish->id,
                        'type' => 'wish',
                    ],
                ];
            }

            try {
                $session = StripeControl::createCheckoutSession($payload, $connectedAccountId);
                $sub->update(['session_id' => $session->id]);
                return Inertia::location($session->url);
            } catch (Exception $e) {
                $sub->delete();
                Log::error("Stripe Checkout Error: " . $e->getMessage());
                return back()->with('error', $e->getMessage());
            }
        }

        return Inertia::render('cart/SubCheckout', [
            'wish' => $wish,
            'vat_amount' => $vat_percentage_amount,
            'reccure' => $reccure
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
            $session = StripeControl::getCheckoutSession($sub->session_id, $sub->wish_item->user->account_id);

            $sub->status = $session->payment_status;
            if ($session->payment_status == 'paid') {

                $symbol = Currency::where('iso', strtoupper($sub->currency))->first();
                $creatorAmount = $sub->amount + $sub->vat_tax_amount;
                $creatorFinalAmount = $symbol->symbol . $creatorAmount;
                $amountTotal = $symbol->symbol . $sub->amount;
                $creator_name = $sub->wish_item->user->name;
                $mailToSend = $sub->guest_email;

                // wish subscription mail send to user
                WishSubscriptionMailToUser::dispatch($sub, $mailToSend, $amountTotal, $creator_name);

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
                    SubscribedMail::dispatch($sub, $creatorFinalAmount);
                }

                if ($sub->wish_item->user->auto_tweet == 1) {
                    // MakeAutoTweets::dispatch($user);
                    SubscribeAutoTweet::dispatch($sub);
                }

                if ($sub->anonymous == 1) {
                    $username = "Anonymous user";
                } else {
                    $username = $sub->guest_name ?? "Anonymous user";
                }

                $userPayment = new UserPayment();
                $userPayment->from_user_id = $sub->user_id ?? null;
                $userPayment->to_user_id = $sub->wish_item->user_id;
                $userPayment->product_type = 'wish item subscription';
                $userPayment->amount = $sub->amount;
                $userPayment->currency = $sub->currency;
                $userPayment->payment_method = 'stripe';
                $userPayment->payment_details = json_encode($session, true);
                $userPayment->paid_at = Carbon::now();
                $userPayment->status = $session->payment_status;
                $userPayment->save();

                $message = $username . " just subscribed to your subscription wish " . $sub->wish_item->name;
                NotificationSave::dispatch($message, $sub->wish_item->user, $sub->user, 'Wish Subscription');
                $message = null;
                if ($sub->recurring_for == 'onetime') {
                    $message = 'Subscription Success! If you have paid for onetime subscription, it will be automatically cancelled after 24 hours.';
                } else {
                    $message = 'Subscription Payment Successfully Paid.';
                }
                return to_route('thank-you', ['username' => $sub->wish_item->user->username])->with('success', $message);
            }

            SubscriptionFailed::dispatch($sub);

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

        // $payload = @file_get_contents('php://input');
        $endpoint_secret = env('WISH_SUB_WEBHOOK_SECRET');
        $payload = $request->getContent();
        $sig_header = $request->header('Stripe-Signature');
        $event = null;

        try {
            $event = Webhook::constructEvent(
                $payload,
                $sig_header,
                $endpoint_secret
            );
        } catch (\UnexpectedValueException $e) {
            return response()->json([
                'status' => false,
                'message' => $e->getMessage()
            ]);
            // Invalid payload
            http_response_code(400);
            exit();
        } catch (\Stripe\Exception\SignatureVerificationException $e) {
            return response()->json([
                'status' => false,
                'message' => $e->getMessage(),
            ]);
            // Invalid signature
            http_response_code(400);
            exit();
        }

        $array = [];
        if (!empty($event)) {
            $charge = $event->data->object;

            // Get email from billing_details
            $email = $charge->billing_details->email ?? null;
            $user = User::where('email', $email)->where('is_uk', 0)->first();
            if (!$user) {
                return response()->json([
                    'status' => true,
                    'message' => 'user not found',
                ]);
            }
            $subs = StripePaymentDetail::where('user_id', $user->id)->whereIn('payment_status', ['paid', 'pending'])->latest()->first();
            $ret = StripeControl::getSubscription($event->data->object->subscription);
            if ($charge->object == 'charge') {
                if ($event->type == "customer.subscription.deleted" && !empty($subs)) {
                    $subs->payment_status = 'cancelled';
                    $subs->save();

                    SendRenewMail::dispatch($array, 'cancelled', 'main');
                } elseif ($event->type == "invoice.payment_failed" && !empty($subs)) {
                    $subs->payment_status = 'failed';
                    $subs->save();

                    SendRenewMail::dispatch($array, 'failed', 'main');
                } elseif ($event->type == "charge.updated" && !empty($subs)) {

                    $subs->payment_status = $charge->status ?? 'unknown';
                    $subs->save();

                    $array = [
                        'email' => $email,
                        'name' => $charge->billing_details->name ?? null,
                        'uuid' => $subs->uuid,
                        'notification' => $subs->user->notification_send ?? 0,
                        'trial_end' => $subs->upcoming_payment ?? null,
                        'amount' => $subs->amount ?? null,
                        'currency' => $subs->currency ?? 'GBP',
                    ];

                    SendRenewMail::dispatch($array, $subs->payment_status, 'main');
                }

                if (!empty($subs)) {
                    $stripe = new StripeWebhookStatus;
                    $stripe->subscription_id = $subs->id;
                    $stripe->invoice_type = $event->type;
                    $stripe->data = $event;
                    $stripe->save();
                }
            }

            // if ($event->type == "invoice.updated" && !empty($subs)) {

            //     $array = [
            //         'email' => $event->data->object->customer_email,
            //         'name' => $event->data->object->customer_name,
            //         'invoice_pdf' => $event->data->object->invoice_pdf,
            //         'uuid' => $subs->uuid,
            //         'notification' => $subs->user->notification_send ?? 0
            //     ];

            //     $subs->status = "ended";
            //     $subs->save();

            //     $newSubs = new WishItemSubscription();
            //     $newSubs->stripe_id = $subs->stripe_id;
            //     $newSubs->session_id = $subs->session_id;
            //     $newSubs->wish_item_id = $subs->wish_item_id;
            //     $newSubs->user_id = $subs->user_id;
            //     $newSubs->guest_name = $subs->guest_name;
            //     $newSubs->guest_email = $subs->guest_email;
            //     $newSubs->currency = $subs->currency;
            //     $newSubs->amount = $subs->amount;
            //     $newSubs->tax = $subs->tax;
            //     $newSubs->recurring_for = $subs->recurring_for;
            //     $newSubs->recurring_type = $subs->recurring_type;
            //     $newSubs->payment_method = 'stripe';
            //     $newSubs->surprise_message = $subs->surprise_message;
            //     $newSubs->anonymous = $subs->anonymous;
            //     $newSubs->upcoming_payment = Carbon::createFromTimestamp($ret->current_period_end)->format('Y-m-d H:i:s');
            //     $newSubs->status = "paid";
            //     $newSubs->created_at = $subs->created_at;
            //     $newSubs->updated_at = Carbon::now();
            //     $newSubs->save();

            //     SendRenewMail::dispatch($array, 'renew', 'main');
            // }
            // else

        }

        return response()->json([
            'status' => true,
            'message' => 'success'
        ]);
        // return true;
    }

    public function cancelSubs($uuid)
    {
        $subs = WishItemSubscription::where('uuid', $uuid)->first();
        $subs->status = "cancelled";
        $subs->save();

        StripeControl::cancelSubscription($subs->stripe_id);
        return to_route('user.show', ['username' => $subs->wish_item->user->username])->with('success', "Subscription is cancelled for wish {$subs->wish_item->wishname}.");
    }

    public function tipToJar(Request $request, $creator_uid)
    {
        $currency = !empty(request()->cookie('currency')) ? strtolower(request()->cookie('currency')) : 'gbp';
        $creator = User::where('uuid', $creator_uid)->where('is_uk', 0)->first();

        $checkGifterStatus = Helpers::checkGifterCardVerificationStatus();
        if ($checkGifterStatus == true) {
            $user = Auth::user();
            return response()->json([
                'status' => false,
                'msg' => "⚠️ Please complete your card verification payment and wait for admin approval before making further payments."
            ]);
        }

        $user = Auth::user();
        if ($user) {
            $checkCardVerification = User::where('id', Auth::id())->where('role', 0)
                ->whereHas('gifterCardVerification', function ($q) use ($user) {
                    $q->where('user_id', $user->id ?? null)->where('status', 'success');
                })->first();

            if (empty($checkCardVerification) && $user->role == 0) {
                return response()->json([
                    'status' => false,
                    'msg' => "You must have to activate your account before making any payment."
                ]);
            }
        }


        if (Auth::check()) {
            if ($creator->id == Auth::id()) {
                return response()->json([
                    'status' => false,
                    'msg' => "You can't pay yourself!"
                ]);
            }
        }

        $goal = TipGoal::where('user_id', $creator->id)->where('completed', 0)->latest()->first();

        // if (!$goal) {
        //     return redirect()->back()->with('error', 'No tip jar found!');
        // }

        // if ((!empty($goal->completed_at) && $goal->completed_at <= Carbon::now()) || ($goal->completed == 1)) {
        //     return redirect()->back()->with('error', 'Goal is completed already.');
        // }

        if ($request->isMethod("POST")) {
            $request->validate([
                'name' => 'required|string|min:3|max:50',
                'email' => 'required|email:dns',
                'amount' => 'required|numeric',
                'anonymous' => 'required',
                'message' => 'sometimes|nullable|string|max:800'
            ]);


            $amount = $request->amount;
            $ConvertedAmount = Helpers::priceFormat($creator->default_currency, $amount, 'gbp');

            if (!Auth::check() && $ConvertedAmount > 50) {
                return response()->json([
                    'status' => false,
                    'msg' => "Larger payments more than £50 need to login."
                ]);
            }

            $isZeroDecimalCurrency = in_array(strtolower($currency), ['jpy', 'krw', 'vnd']);
            $amount = $request->amount;
            $adminFeeAmount = config('app.administration_fee', 1);
            $taxPercentage = config('app.jar_tax');
            $price = Helpers::priceFormat($currency, $amount, $creator->default_currency);

            $tax = round(($price * $taxPercentage / 100), 2, PHP_ROUND_HALF_UP);
            $adminFeeForStoreDB = Helpers::priceFormat('GBP', $adminFeeAmount, $creator->default_currency);
            $totalTaxForDB = $tax + $adminFeeForStoreDB;

            $taxAmount = round(($amount * $taxPercentage / 100), 2, PHP_ROUND_HALF_UP);
            $adminFeeForPay = Helpers::priceFormat('GBP', $adminFeeAmount, $currency);
            $totalTaxForPay = $taxAmount + $adminFeeForPay;
            // $totalPrice = round($amount + $totalTaxForPay, 2, PHP_ROUND_HALF_UP);
            $unitAmount = $isZeroDecimalCurrency ? round($amount) : round($amount * 100);

            $pay = TipGoalsPayment::create([
                'tip_goal_id' => $goal->id ?? null,
                'user_id' => Auth::id() ?? null,
                'creator_id' => $creator->id,
                'guest_name' => $request->name,
                'guest_email' => $request->email,
                'currency' => $creator->default_currency,
                'amount' => $price,
                'tax' => $totalTaxForDB,
                'message' => $request->message ?? null,
                'anonymous' => $request->anonymous ?? 0,
            ]);

            $payload = [
                "mode" => 'payment',
                'payment_method_types' => ['card'],
                'line_items' => [
                    [
                        'quantity' => 1,
                        'price_data' => [
                            'currency' => $currency,
                            'product_data' => ['name' => "Support Payment to Creator"],
                            'unit_amount' => $unitAmount,
                        ]
                    ],
                    [
                        'quantity' => 1,
                        'price_data' => [
                            'currency' => $currency,
                            'product_data' => [
                                'name' => 'Platform Fee',
                            ],
                            'unit_amount' => $totalTaxForPay * 100,
                            'tax_behavior' => 'exclusive',
                        ],
                    ],
                ],
                'payment_intent_data' => [
                    'application_fee_amount' => round($totalTaxForPay * 100), // Admin fee + tax
                    'description' => "Platform Fee."
                ],
                'customer_email' =>  $user->email ?? $request->email,
                'success_url' => route('tip-jar.handle', ['uuid' => $pay->uuid, 'status' => "success"]),
                'cancel_url' => route('tip-jar.handle', ['uuid' => $pay->uuid, 'status' => "cancel"]),
            ];

            try {
                $session = StripeControl::createCheckoutSession($payload, $creator->account_id);
                $pay->update(['session_id' => $session->id]);

                return response()->json([
                    'status' => true,
                    'url' => $session->url
                ]);
            } catch (Exception $e) {
                return response()->json([
                    'status' => false,
                    'msg' => $e->getMessage()
                ]);
            }
        }

        // if ($request->isMethod("POST")) {
        //     $request->validate([
        //         'name' => [
        //             'required',
        //             'string',
        //             'min:3',
        //             'max:50'
        //         ],
        //         'email' =>  [
        //             'required',
        //             'email:dns'
        //         ],
        //         'amount' => [
        //             'required',
        //             'numeric'
        //         ],
        //         'anonymous' => [
        //             'required'
        //         ],
        //         'message' =>  [
        //             'sometimes',
        //             'nullable',
        //             'string',
        //             'max:800'
        //         ]
        //     ]);

        //     $isZeroDecimalCurrency = in_array(strtolower($currency), ['jpy', 'krw', 'vnd']);

        //     $amount = $request->amount;
        //     $adminFeeAmount = config('app.administration_fee', 1); // Administration fee percentage

        //     // define variable to store in db
        //     $price = Helpers::priceFormat($currency, $amount, $creator->default_currency);
        //     $tax = round(($price * config('app.jar_tax') / 100), 2, PHP_ROUND_HALF_UP);
        //     $adminFeeForStoreDB = Helpers::priceFormat('GBP', $adminFeeAmount, $creator->default_currency);
        //     $totalTaxForDB = $tax + $adminFeeForStoreDB;
        //     $totalAmountForStoreDB = round($price + $totalTaxForDB);

        //     // define variable to show and pay on payment page
        //     $taxPercentage = config('app.jar_tax'); // Tax percentage
        //     $adminFeeForPay = Helpers::priceFormat('GBP', $adminFeeAmount, $currency);
        //     $taxAmount = round(($amount * $taxPercentage / 100), 2, PHP_ROUND_HALF_UP); // Tax based on combined percentage
        //     $totalTaxForPay = $taxAmount + $adminFeeForPay;
        //     $totalPrice = round($amount + $totalTaxForPay, 2, PHP_ROUND_HALF_UP);
        //     $roundTotalPrice = round($amount + $totalTaxForPay);


        //     $unitAmount = $isZeroDecimalCurrency
        //         ? round($roundTotalPrice) // totalPrice is already in user currency
        //         : round($totalPrice * 100); // e.g. for USD/GBP

        //     $amountToTransfer = $isZeroDecimalCurrency ? intval($amount) : round($amount * 100);

        //     try {
        //         $stripe_client = StripeControl::createProduct([
        //             'name' => $goal->name ?? 'Support-creator',
        //             'images' => ["https://ucarecdn.com/901c0a0e-e5de-4d7a-8ac3-de11a4632542/"],
        //             "default_price_data" => ["currency" => strtolower($creator->default_currency), "unit_amount_decimal" => $totalPrice * 100],
        //         ], $creator->account_id);
        //     } catch (Exception $e) {
        //         return response()->json([
        //             'status' => false,
        //             'msg' => $e->getMessage()
        //         ]);
        //     }

        //     $pay = TipGoalsPayment::create([
        //         'tip_goal_id'  =>  $goal->id ?? null,
        //         'user_id'       =>  Auth::id() ?? NULL,
        //         'creator_id' => $creator->id,
        //         'guest_name'    =>  $request->name,
        //         'guest_email'    =>  $request->email,
        //         'currency'      =>  $creator->default_currency,
        //         'amount'        =>  $price,
        //         'tax'           =>  $totalTaxForDB,
        //         'message'  =>  $request->message ?? NULL,
        //         'anonymous' => $request->anonymous ?? 0,
        //         'product_id' => $stripe_client->id
        //     ]);

        //     $payload = [
        //         "mode"  =>  'payment',
        //         'payment_method_types' => ['card'],
        //         'line_items' =>  [
        //             [
        //                 'quantity' => 1,
        //                 'price_data' => [
        //                     'currency' => $currency,
        //                     'product' => $stripe_client->id,
        //                     'unit_amount_decimal' => $unitAmount,
        //                 ]
        //             ]
        //         ],
        //         'payment_intent_data' => [
        //             // 'transfer_data' => [
        //             //     'destination' => $creator->account_id, // Creator's connected account ID
        //             //     'amount' => $amountToTransfer,
        //             // ],
        //             // 'application_fee_amount' => $totalTaxForPay * 100,
        //             // 'on_behalf_of'  => $creator->account_id,
        //             'description' => "Supporter Membership Payment."
        //         ],
        //         'customer_email' =>  $request->email,
        //         'success_url'       =>  route('tip-jar.handle', ['uuid' => $pay->uuid, 'status' => "success"]),
        //         'cancel_url'       =>  route('tip-jar.handle', ['uuid' => $pay->uuid, 'status' => "cancel"]),
        //     ];

        //     try {
        //         $session = StripeControl::createCheckoutSession($payload, $creator->account_id);
        //         $pay->update([
        //             'session_id' =>  $session->id
        //         ]);

        //         return response()->json([
        //             'status' => true,
        //             'url' => $session->url
        //         ]);
        //     } catch (Exception $e) {
        //         return response()->json([
        //             'status' => false,
        //             'msg' => $e->getMessage()
        //         ]);
        //     }
        // }

        // return Inertia::render('cart/SubCheckout', [
        //     'wish'  => $wish,
        //     'reccure'   => $reccure
        // ]);
    }

    /**
     * Handle Checkout Session
     *
     * @param string $uuid Subscription UUID
     * @param string $status Status of Subscription
     * @return mixed
     */
    public function handleTipJarPayment($uuid, $status)
    {
        $currency = !empty(request()->cookie('currency')) ? strtolower(request()->cookie('currency')) : 'gbp';
        $tip_pay = TipGoalsPayment::whereUuid($uuid)->first();
        if (!$tip_pay) {
            return to_route('home')->with("error", 'Insufficient data!');
        }
        try {
            $session = StripeControl::getCheckoutSession($tip_pay->session_id, $tip_pay->creator->account_id);
            $tip_pay->status = $session->payment_status;
            if ($session->payment_status == 'paid') {
                $ownerCurrency = Currency::where('iso', strtoupper($tip_pay->currency))->first();
                $userCurrency = Currency::where('iso', strtoupper($currency))->first();
                $userAmount = Helpers::priceFormat($tip_pay->currency, $tip_pay->amount, $currency);

                TipJarPurchased::dispatch($tip_pay, $ownerCurrency->symbol);
                TipJarMailToUser::dispatch($tip_pay, $userCurrency->symbol, $userAmount);
                $tip_pay->save();

                /**************************TIP**JAR**PWA**START****************************************************/
                // below is TIP JAR pwa for fans
                $CreatorName = ucfirst($tip_pay->creator->name) ?? 'A Creator';
                $title = "🙌 Tip Sent!";
                $content = "You just tipped $CreatorName. Thanks for supporting them!.";
                $email = $tip_pay->guest_email ?? $tip_pay->user->email;

                Helpers::sendNotification($title, $content, $email);

                // below is membership pwa for creator
                $FanName = ucfirst($tip_pay->user->name) ?? 'A Fan';
                $title = "🎉 You Got a Tip!";
                $content = "$FanName just dropped a tip in your jar!.";
                $email = $tip_pay->creator->email;

                Helpers::sendNotification($title, $content, $email);
                /****************************TIP**JAR**PWA**ENDS****************************************************/

                if (!empty($tip_pay->tipGoal)) {

                    if (!empty($tip_pay->tipGoal)) {
                        $tip_pay->tipGoal->fullfilled += $tip_pay->amount;
                        $tip_pay->tipGoal->save();

                        if ($tip_pay->tipGoal->user->auto_tweet == 1) {
                            TipJarTweet::dispatch($tip_pay);
                        }
                    }

                    if ($tip_pay->tipGoal->user->auto_tweet == 1) {
                        TipJarTweet::dispatch($tip_pay);
                    }
                }

                if ($tip_pay->anonymous == 1) {
                    $username = "Anonymous user";
                } else {
                    $username = $tip_pay->guest_name ?? "Anonymous user";
                }

                $userPayment = new UserPayment();
                $userPayment->from_user_id = $tip_pay->user_id ?? null;
                $userPayment->to_user_id = $tip_pay->creator_id ?? null;
                $userPayment->product_type = 'tip jar';
                $userPayment->amount = $tip_pay->amount;
                $userPayment->currency = $tip_pay->currency;
                $userPayment->payment_method = 'stripe';
                $userPayment->payment_details = json_encode($session, true);
                $userPayment->paid_at = Carbon::now();
                $userPayment->status = $session->payment_status ?? 'paid';
                $userPayment->save();

                $message = $username . " just granted some coins to your piggy bank";
                NotificationSave::dispatch($message, $tip_pay->creator, $tip_pay->user, 'Piggy Bank');

                return to_route('user.show', ['username' => $tip_pay->creator->username])->with('success', "Thank you for your support!");
            }

            $tip_pay->save();
            return to_route('user.show', ['username' => $tip_pay->creator->username])->with('warning', "Payment is in {$session->payment_status} status.");
        } catch (Exception $e) {
            Log::error("Stripe Checkout Error: " . $e->getMessage());
            return to_route('user.show', ['username' => $tip_pay->creator->username])->with('error', $e->getMessage());
        }
        // return response()->json([
        //     'success'   =>  true,
        //     'session'   =>  $session,
        //     'status'    =>  $status
        // ]);
    }

    /**
     * Deleting the stripe account through user.
     *
     * @param string $uuid user UUID
     * @return mixed
     */
    public function deleteStripeAccount()
    {
        $user = User::where('id', Auth::id())->where('is_uk', 0)->first();

        if ($user->account_id) {
            StripeControl::deleteAccount($user->account_id);
            $user->account_id = NULL;
            $user->stripe_details_submitted = 0;
            $user->save();
        }

        return to_route('user.show', ['username' => $user->username])->with('success', 'Stripe account deleted successfully!');
    }

    /**
     * Pay for monthly charge
     *
     * @return mixed
     */
    public function payMonthlyCharge(Request $request)
    {
        $currency = strtolower($request->cookie("currency", "GBP"));
        $price = 4.00;
        $tax = round(($price * 20 / 100), 2, PHP_ROUND_HALF_UP);
        $fee_per = number_format(($tax / ($tax + $price)) * 100, 2);

        $user = User::where('id', Auth::id())->where('is_uk', 0)->first();
        if (!$user->account_id) {
            $customer = StripeControl::createCustomer([
                'email' => $user->email,
                'name' => $user->name,
            ], '');

            $customer_id = $customer->id;
            $user->stripe_id = $customer_id;
            $user->save();
        }

        $sub = MonthlyCharge::create([
            'user_id'   =>  $user->id,
            'name'      =>  $user->name ?? NULL,
            'email'     =>  $user->email,
            'currency'  =>  "GBP",
            'amount'    =>  $price,
            'tax'       =>  $tax,
        ]);

        $amount = $price + $tax;
        $unit_amount = round(Helpers::priceFormat("GBP", $amount, $currency) * 100); // Ensure integer

        $trial_period_days = 3; // 3-day free trial

        $payload = [
            "mode"  =>  'subscription',
            "currency"  =>  $currency,
            'line_items' =>  [[
                'quantity' => 1,
                'price_data' => [
                    'currency' => $currency,
                    'product' => env("SUBSCRIPTION_4_PRODUCT_ID"),
                    'unit_amount' => $unit_amount, // Ensure integer
                    'recurring' => [
                        'interval' => StripeControl::$periods["monthly"],
                        'interval_count' => 1
                    ]
                ]
            ]],
            'subscription_data' =>  [
                'trial_period_days' => $trial_period_days, // 3-day trial (REMOVED billing_cycle_anchor)
                'description' => "Subscription for using site through Stripe."
            ],
            'customer_email' => $user->email,
            'success_url' => route('mandatory.handle', ['uuid' => $sub->uuid, 'status' => "success"]),
            'cancel_url' => route('mandatory.handle', ['uuid' => $sub->uuid, 'status' => "cancel"]),
        ];

        try {
            $session = StripeControl::createCheckoutSession($payload);
            $sub->update([
                'session_id' => $session->id,
                'current_start_trial_date' => now(),
                'current_end_trial_date' => now()->addDays($trial_period_days),
            ]);

            return Inertia::location($session->url);
        } catch (Exception $e) {
            $sub->delete();
            return back()->with('error', $e->getMessage());
        }
    }

    /**
     * Handle Checkout Session for mandatory subscription of 4 pound
     *
     * @param string $uuid Subscription UUID
     * @param string $status Status of Subscription
     * @return mixed
     */
    public function handleMandatorySubscription(Request $request, $uuid, $status)
    {
        $sub = MonthlyCharge::whereUuid($uuid)->first();
        if (!$sub) {
            return to_route('home')->with("error", 'Insufficient data!');
        }
        if ($sub->status !== 'initiated') {
            return to_route('home')->with("error", 'Subscription already processed!');
        }

        $email = isset($sub->user) ? $sub->user->email : $sub->email;
        $user = User::where('id', $sub->user_id)->where('is_uk', 0)->first();

        try {
            $session = StripeControl::getCheckoutSession($sub->session_id);
            $sub->status = $session->payment_status;
            if ($session->payment_status == 'paid') {

                $sub->stripe_id = $session->subscription;

                // $sub->upcoming_payment = Carbon::now()->addMonth();
                $sub->upcoming_payment = Carbon::now()->addDays(3);
                if ($sub->save()) {
                    // update profile status lock 1
                    $user->profile_status_lock = 1;
                    $user->is_subscribed = 1;
                    $user->save();
                }
                $currency = strtolower($request->cookie("currency", "GBP"));
                $convertedAmount = strtoupper(Helpers::priceFormat('gbp', $sub->amount, $currency));
                SendPaymentSuccessEmail::dispatch($sub->user, $convertedAmount, $currency, $sub->upcoming_payment);

                return to_route('user.show', ['username' => $sub->user->username])->with('success', "Subscription Success!");
            }

            MonthlySubscribedJob::dispatch($sub->email, $sub, 'failure');
            // MonthlySubscriptionFailedJobs::dispatch($sub);
            // SubscriptionFailed::dispatch($sub);

            $sub->save();
            return to_route('user.show', ['username' => $sub->user->username])->with('warning', "Subscription is in {$session->payment_status} status.");
        } catch (Exception $e) {
            return to_route('user.show', ['username' => $sub->user->username])->with('error', $e->getMessage());
        }
    }

    // public function mandatorySubscriptionStatus(Request $request)
    // {
    //     // Log::info('Webhook received: mandatorySubscriptionStatus');
    //     $stripe = new \Stripe\StripeClient(env('STRIPE_SECRET_KEY'));
    //     $endpoint_secret = env('MANDATORY_STATUS_WEBHOOK_SECRET');

    //     $payload = $request->getContent();
    //     // $sigHeader = $request->header('Stripe-Signature');
    //     $sig_header = $request->header('Stripe-Signature');
    //     $event = null;

    //     try {
    //         $event = Webhook::constructEvent(
    //             $payload,
    //             $sig_header,
    //             $endpoint_secret
    //         );
    //     } catch (\UnexpectedValueException | \Stripe\Exception\SignatureVerificationException $e) {
    //         Log::error("Webhook signature verification failed: " . $e->getMessage());
    //         return response()->json(['error' => 'Invalid signature'], 400);
    //     }

    //     if (!empty($event)) {
    //         $eventType = $event->type;
    //         $object = $event->data->object;
    //         // $subscription = $event['data']['object'];s

    //         $customer_id = $object->customer ?? null;
    //         $customer = Customer::retrieve($customer_id);

    //         $subscriptionId = data_get($object, 'subscription');
    //         $customerEmail = $customer->email ?? null;
    //         $customerName = data_get($object, 'customer_name');
    //         $invoicePdf = data_get($object, 'invoice_pdf');

    //         $subs = MonthlyCharge::where('stripe_id', $subscriptionId)->orderBy('updated_at', 'desc')->first();

    //         if ($subs) {
    //             $array = [
    //                 'email' => $customerEmail,
    //                 'name' => $customerName,
    //                 'invoice_pdf' => $invoicePdf,
    //                 'uuid' => $subs->uuid,
    //                 'notification' => $subs->user->notification_send ?? 0,
    //             ];

    //             switch ($eventType) {
    //                 case "customer.subscription.trial_will_end":
    //                     Log::info("Trial will end for subscription: {$subscriptionId}");
    //                     // $subs->status = "trial";
    //                     // $subs->save();
    //                     // SendRenewMail::dispatch($array, 'trial', 'site');
    //                     break;
    //                 case "invoice.payment_succeeded":
    //                     Log::info("Payment succeeded for subscription: {$subscriptionId}");
    //                     // if ($subs->status != 'paid') {
    //                     if (
    //                         $subs->current_end_subscription_date &&
    //                         Carbon::parse($subs->current_end_subscription_date)->lte(now())
    //                     ) {
    //                         $periodEnd = data_get($object, 'lines.data.0.period.end');
    //                         $subs->upcoming_payment = $periodEnd ? Carbon::createFromTimestamp($periodEnd)->format('Y-m-d H:i:s') : null;
    //                         $subs->current_start_subscription_date = now();
    //                         $subs->current_end_subscription_date = now()->addMonths(1);
    //                         $subs->status = "paid";
    //                         $subs->save();
    //                     }
    //                     // $planAmount = data_get($object, 'lines.data.0.plan.amount', 0);
    //                     // $planCurrency = strtoupper(data_get($object, 'lines.data.0.plan.currency', 'usd'));
    //                     // $amount = $planAmount / 100;

    //                     // SendRenewMail::dispatch($array, 'renew', 'site');

    //                     // SendPaymentSuccessEmail::dispatch($subs->user, $amount, $planCurrency, $subs->upcoming_payment);
    //                     // }
    //                     break;

    //                 case "invoice.payment_failed":
    //                     $subs->status = "failed";
    //                     $subs->save();
    //                     SendRenewMail::dispatch($array, 'failed', 'site');
    //                     break;

    //                 case "invoice.updated":
    //                     Log::info("Invoice updated for subscription: {$subscriptionId}");
    //                     $subs->status = "ended";
    //                     $subs->save();
    //                     $periodEnd = data_get($object, 'lines.data.0.period.end');

    //                     $newSubs = new MonthlyCharge();
    //                     $newSubs->stripe_id = $subs->stripe_id;
    //                     $newSubs->session_id = $subs->session_id;
    //                     $newSubs->user_id = $subs->user_id;
    //                     $newSubs->name = $subs->name;
    //                     $newSubs->email = $subs->email;
    //                     $newSubs->currency = $subs->currency;
    //                     $newSubs->amount = $subs->amount;
    //                     $newSubs->tax = $subs->tax;
    //                     $subs->current_start_subscription_date = now();
    //                     $subs->current_end_subscription_date = now()->addMonths(1);
    //                     $newSubs->upcoming_payment = Carbon::createFromTimestamp($periodEnd)->format('Y-m-d H:i:s');
    //                     $newSubs->status = "paid";
    //                     $newSubs->created_at = $subs->created_at;
    //                     $newSubs->updated_at = $subs->updated_at;
    //                     $newSubs->save();

    //                     // SendPaymentSuccessEmail::dispatch($subs->user, $amount, $planCurrency, $subs->upcoming_payment);
    //                     SendRenewMail::dispatch($array, 'renew', 'site');
    //                     break;

    //                 default:
    //                     Log::info("Unhandled event type: {$eventType}");
    //                     break;
    //             }
    //         }
    //     }

    //     return response()->json(['status' => 'success']);
    // }

    public function createVerificationSession(Request $request)
    {
        try {
            // Set Stripe secret key
            Stripe::setApiKey(env('STRIPE_SECRET_KEY'));

            $user = Auth::user();

            $appUrl = config('app.url');
            if (!in_array($appUrl, ['https://spennypiggy.co'])) {
                $user->identity_status = 1;
                $user->identity_verified_at = Carbon::now();
                $user->save();

                return response()->json([
                    'status' => 'success',
                    'msg' => 'Identity verification successfully submitted.',
                    'url' => route('user.show', ['username' => $user->username]),
                ]);
                // return redirect()->route('user.show', ['username' => $user->username])->with('success', 'Identity verification successfully submitted.');
            }

            // Create a new verification session
            $session = VerificationSession::create([
                'type' => 'document',
                'metadata' => [
                    'user_id' => $request->user() ? $request->user()->id : null,
                ],
                'provided_details' => ['email' => $request->user() ? $request->user()->email : null],
                'return_url' => route('user.show', [$user->username]), // Redirect here after success or failure
            ]);

            // Retrieve the user
            // $user = User::find($user->id); // Update 228 to dynamic user ID logic if necessary

            if (!$user) {
                return response()->json([
                    'error' => 'User not found.',
                ], 404);
            }

            // Update the user's Stripe session ID
            $user->stripe_user_id = $session->id;
            $user->identity_verification_error = null;

            if ($user->save()) {
                return response()->json([
                    'sessionId' => $session->id,
                    'url' => $session->url,
                ]);
            } else {
                return response()->json([
                    'error' => 'Failed to update user Stripe session ID.',
                ], 500);
            }
        } catch (\Exception $e) {
            // Log the error for debugging purposes
            Log::error('Error creating verification session', ['message' => $e->getMessage()]);

            // Handle any errors
            return response()->json([
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    public function deleteConnectedAccount($accountId)
    {
        try {
            $stripe = new \Stripe\StripeClient(env('STRIPE_SECRET')); // move your secret to .env

            $deleted = $stripe->accounts->delete($accountId, []);

            return response()->json([
                'message' => 'Connected account deleted successfully.',
                'deleted' => $deleted,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to delete connected account.',
                'error' => $e->getMessage(),
            ], 400);
        }
    }

    public function makeProductId($price)
    {
        $product = StripeControl::createProduct([
            'name' => 'Gifter Card Verification',
            'images' => ["https://ucarecdn.com/901c0a0e-e5de-4d7a-8ac3-de11a4632542/"],
            "default_price_data" => ["currency" => 'gbp', "unit_amount_decimal" => $price * 100],
        ], true);

        return response()->json([
            'product_id' => $product->id,
        ]);
    }

    // public function subscriptionUpdateStatus(Request $request)
    // {
    //     Log::info('Webhook received: subscriptionUpdateStatus');
    //     $endpoint_secret = 'whsec_5dgNdG5AVVtgC95nHMDnMJ1V8MxIlXr7';
    //     // $endpoint_secret = env('BILL_SUB_WEBHOOK_SECRET');

    //     $payload = @file_get_contents('php://input');
    //     $sig_header = $request->server('HTTP_STRIPE_SIGNATURE');

    //     // $payload = @file_get_contents('php://input');
    //     // $sig_header = $_SERVER['HTTP_STRIPE_SIGNATURE'];
    //     $event = null;

    //     try {
    //         $event = Webhook::constructEvent(
    //             $payload,
    //             $sig_header,
    //             $endpoint_secret
    //         );
    //     } catch (\UnexpectedValueException $e) {
    //         return response()->json([
    //             'status' => false,
    //             'message' => $e->getMessage()
    //         ]);
    //         // Invalid payload
    //         http_response_code(400);
    //         exit();
    //     } catch (\Stripe\Exception\SignatureVerificationException $e) {
    //         return response()->json([
    //             'status' => false,
    //             'message' => $e->getMessage()
    //         ]);
    //         // Invalid signature
    //         http_response_code(400);
    //         exit();
    //     }

    //     // $array = [];
    //     if (!empty($event)) {
    //         // $subs = BillPayment::where('stripe_id', $event->data->object->subscription)->latest()->first();

    //         $ret = StripeControl::getSubscription($event->data->object->subscription);

    //         if ($event->type == "invoice.updated") {
    //             $metadata = $event->data->object->metadata;

    //             $userId = $metadata->user_id ?? null;
    //             $creatorId = $metadata->creator_id ?? null;
    //             $membership_id = $metadata->membership_id ?? null;

    //             Log::info("Subscription updated for user ID: {$userId}, creator ID: {$creatorId}, bill ID: {$membership_id}");
    //             // switch ($ret->status) {
    //             //     case 'active':
    //             //         $status = 'paid';
    //             //         break;
    //             //     case 'past_due':
    //             //         $status = 'failed';
    //             //         break;
    //             //     case 'canceled':
    //             //         $status = 'cancelled';
    //             //         break;
    //             //     default:
    //             //         $status = 'unknown';
    //             // }

    //             // $array = [
    //             //     'email' => $event->data->object->customer_email,
    //             //     'name' => $event->data->object->customer_name,
    //             //     'invoice_pdf' => $event->data->object->invoice_pdf,
    //             //     'uuid' => $subs->uuid,
    //             //     'notification' => $subs->user->notification_send ?? 0
    //             // ];

    //             // $subs->status = "ended";
    //             // $subs->save();

    //             // $newSubs = new BillPayment();
    //             // $newSubs->stripe_id = $subs->stripe_id;
    //             // $newSubs->session_id = $subs->session_id;
    //             // $newSubs->bills_id = $subs->bills_id;
    //             // $newSubs->user_id = $subs->user_id;
    //             // $newSubs->guest_name = $subs->guest_name;
    //             // $newSubs->guest_email = $subs->guest_email;
    //             // $newSubs->currency = $subs->currency;
    //             // $newSubs->amount = $subs->amount;
    //             // $newSubs->tax = $subs->tax;
    //             // $newSubs->recurring_for = $subs->recurring_for;
    //             // $newSubs->recurring_type = $subs->recurring_type;
    //             // $newSubs->message = $subs->message;
    //             // $newSubs->anonymous = $subs->anonymous;
    //             // $newSubs->upcoming_payment = Carbon::createFromTimestamp($ret->current_period_end)->format('Y-m-d H:i:s');
    //             // $newSubs->status = "paid";
    //             // $newSubs->created_at = $subs->created_at;
    //             // $newSubs->updated_at = Carbon::now();
    //             // $newSubs->save();

    //             // SendRenewMail::dispatch($array, 'renew', 'bill');
    //         }
    //         //  elseif ($event->type == "customer.subscription.deleted" && !empty($subs)) {
    //         //     $subs->status = 'cancelled';
    //         //     $subs->save();

    //         //     SendRenewMail::dispatch($array, 'cancelled', 'bill');
    //         // } elseif ($event->type == "invoice.payment_failed" && !empty($subs)) {
    //         //     $subs->status = 'failed';
    //         //     $subs->save();

    //         //     SendRenewMail::dispatch($array, 'failed', 'bill');
    //         // }
    //     }

    //     return response()->json([
    //         'status' => true,
    //         'message' => 'success',
    //     ]);
    // }
}
