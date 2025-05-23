<?php

namespace App\Http\Controllers\Auth;

use App\Helpers;
use App\Http\Controllers\Controller;
use App\Jobs\MembershipAutoTweet;
use App\Jobs\MembershipMail;
use App\Jobs\MembershipMailToUser;
use App\Jobs\NotificationSave;
use App\Jobs\SendRenewMail;
use App\Jobs\SubscribeAutoTweet;
use App\Jobs\SubscribedMail;
use App\Jobs\SubscriptionCancelAtEnd;
use App\Jobs\SubscriptionFailed;
use App\Models\ConnectedAccountCustomer;
use App\Models\Currency;
use App\Models\Logs;
use App\Models\Membership;
use App\Models\MembershipPayment;
use App\Models\SocialLinks;
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
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Validator;
use Inertia\Inertia;
use Stripe\Stripe;
use Stripe\StripeClient;
use Stripe\Webhook;

class MembershipController extends Controller
{
    public function __construct()
    {
        $stripe = Stripe::setApiKey(env('STRIPE_SECRET_KEY'));
    }

    public function membershipLevelSave(Request $request)
    {
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

        $user = User::where('id', Auth::id())->where('is_uk', 0)->first();
        $exist = Membership::where('user_id', $user->id)->pluck('level')->toArray();



        if (in_array($request->level, $exist)) {
            return response()->json([
                "status" => false,
                "msg" => "You already have a level of " . $request->level,
            ]);
        }

        $rewards = json_encode($request->rewards);

        // Fetch tax and administration fee percentage from the configuration
        $memberTax = config('app.member_tax'); // Membership tax percentage

        $price = $request->month_price;
        $taxAmount = round(($price * $memberTax / 100), 2, PHP_ROUND_HALF_UP); // Tax based on combined percentage
        $totalPrice = $price + $taxAmount; // Total price including tax

        $mem = new Membership();
        $mem->user_id = Auth::id();
        $mem->level = $request->level;
        $mem->currency = $user->default_currency;
        $mem->price = $price;
        $mem->tax_amount = $taxAmount;
        $mem->thumbnail = $request->thumbnail ?? null;
        $mem->rewards = $rewards;

        $mem->save();

        $productPayload = [
            "name"  =>  'Membership_' . $mem->level . '_' . $user->username,
            "images" => [$mem->perma_link],
            "default_price_data"    =>  [
                "currency"  =>  $user->default_currency,
                "unit_amount_decimal"   => round($totalPrice, 2, PHP_ROUND_HALF_UP) * 100,
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
            $connectedAccountId = $user->account_id;
            $product = StripeControl::createProduct($productPayload, $connectedAccountId);

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
            'msg' => "Membership added successfully, your upload will be approved shortly."
        ]);
    }


    public function updateLevel(Request $request, $uuid)
    {
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
            return redirect()->back()->with("error", "Some words and emojis are not allowed. Eg. paypig, findom, worship, unlock, unblock, receive, tax, fee, session, deposit, tribute,dick,goddess,master,mistress,
             😈, 💩, 💬, 👅, 🍆, 🍌, 🌽, 🌶️, 🍑, 💎, 💦");
        } else {

            $user = User::where('id', Auth::id())->where('is_uk', 0)->first();

            $mem = Membership::where('uuid', $uuid)->first();
            $old_price = $mem->price;
            if (empty($mem)) {
                return response()->json([
                    "status" => false,
                    "msg" => "Membership not found."
                ]);
            }

            $rewards = json_encode($request->rewards);


            $price = $request->month_price;
            $taxamount = round(($price * config('app.member_tax') / 100), 2, PHP_ROUND_HALF_UP);
            $adminFee = config('app.administration_fee');
            // $convertedCurrAdminAmount = Helpers::priceFormat('GBP', $adminFee, strtoupper($mem->currency));
            $totalTaxAmount = $taxamount + $adminFee;
            $createpriceid = $price + $taxamount + $adminFee;

            $mem->user_id = Auth::id();
            $mem->level = $request->level;
            $mem->price = $price;
            $mem->tax_amount = $totalTaxAmount;
            if (!empty($request->thumbnail)) {
                $mem->thumbnail = $request->thumbnail;
            }
            $mem->rewards = $rewards;

            $mem->save();

            try {
                $stripe = new StripeClient(env('STRIPE_SECRET_KEY'));

                if ($old_price == $mem->price) {
                    $product = $stripe->products->update($mem->product_id, [
                        "name"  => $user->username . '_' . $mem->level,
                        "images" => [$mem->perma_link],
                        "default_price" => $mem->price_id
                    ]);
                } else {
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
                    $connectedAccountId = $user->account_id;
                    $product = StripeControl::createProduct($productPayload, $connectedAccountId);
                    $mem->price_id = $product->default_price;
                }
                $mem->product_id = $product->id;
                $mem->approved = 0;
                $mem->save();

                $logs = Logs::where('edited_membership_id', $mem->id)->where('status', 'pending')->first();
                if (!empty($logs)) {
                    $logs->status = 'updated';
                    $logs->save();
                }
            } catch (Exception $e) {
                $mem->delete();
                return redirect(route("user.show", ["username" => Auth::user()->username]))->with('error', "Stripe Error: " . $e->getMessage());
            }

            return redirect()->back()->with('success', 'Membership level is added in your profile.');
        }
    }


    public function removeLevel($uuid)
    {

        $mem = Membership::whereUuid($uuid)->first();

        if (empty($mem)) {
            return response()->json([
                "status" => false,
                "msg" => "Membership not found."
            ]);
        }

        MembershipPayment::where('membership_id', $mem->id)->delete();
        $mem->delete();

        return response()->json([
            'status' => true,
            'msg' => "Membership removed successfully."
        ]);
    }


    /**
     * Buy creator's membership
     *
     * @param Request $request
     * @param string $uuid Membership UUID
     * @param string $reccure Subscription Reccuring - onetime or continue
     * @return mixed
     */
    public function buyLevel(Request $request, $uuid, $reccure = 'continue')
    {
        $user = Auth::user(); // or $requestingUser if handling guests

        // $user socila membershipDashboard

        $isSocilAdded = true;
        $socialData = SocialLinks::where('user_id', $user->id)
            ->where(function ($query) {
                $query->whereNotNull('tumblr')
                    ->orWhereNotNull('instagram')
                    ->orWhereNotNull('twitch')
                    ->orWhereNotNull('facebook')
                    ->orWhereNotNull('twitter');
            })->first();


        if (!$socialData) {
            $isSocilAdded = false;
        }
        // if (empty($user->stripe_id)) {
        //     $stripeCustomer = \Stripe\Customer::create([
        //         'email' => $user->email,
        //         'name' => $user->name ?? null,
        //     ]);

        //     $user->stripe_id = $stripeCustomer->id;
        //     $user->save();
        // }

        $membership = Membership::whereUuid($uuid)->with('user')->first();

        if (Auth::check() && ($membership->user_id == Auth::id())) {
            return redirect()->back()->with('error', "You can't buy your own membership!");
        }

        if (!$membership) {
            return redirect()->back()->with('error', 'Membership not found!');
        }

        $vat_percentage_amount = 0;
        $vat_percentage_amounts = 0;
        $currency   =   strtolower($request->cookie("currency", "GBP"));
        $tax = round($membership->tax_amount, 2, PHP_ROUND_HALF_UP);
        $price = round($membership->price, 2, PHP_ROUND_HALF_UP);
        $adminFeeAmount = config('app.administration_fee'); // Admin fee as a percentage
        // $fee_per = round(($tax / ($tax + $price)) * 100, 2, PHP_ROUND_HALF_UP);

        // below are the values which user see can the price according to their selected currency
        $DatabaseAdminFee = Helpers::priceFormat('GBP', $adminFeeAmount, $membership->currency);
        $DatabaseTax = Helpers::priceFormat($currency, $tax, $membership->currency);
        $DatabasePrice = Helpers::priceFormat($currency, $price, $membership->currency);
        $DatabaseTotalTaxAmount = $DatabaseAdminFee + $DatabaseTax;
        if (!empty($membership->user->vat_amount_percentage)) {
            $vat_percentage_amount = ($DatabasePrice + $DatabaseTax) * $membership->user->vat_amount_percentage / 100;
        }

        // below are the value which user can see the price according to their selected currency
        $paymentAdminFee = Helpers::priceFormat($membership->currency, $adminFeeAmount, $currency);
        $paymentTax = Helpers::priceFormat($membership->currency, $tax, $currency);
        $paymentPrice = Helpers::priceFormat($membership->currency, $price, $currency);
        $totalPaymentTaxAmount = $paymentTax + $paymentAdminFee;

        if (!empty($membership->user->vat_amount_percentage)) {
            $vat_percentage_amounts = ($paymentPrice + $paymentTax) * $membership->user->vat_amount_percentage / 100;
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
                'user_id'        =>  Auth::id() ?? null,
                'guest_name'     =>  $request->name ?? NULL,
                'guest_email'    =>  $request->email,
                'currency'       =>  $membership->currency,
                'amount'         =>  $membership->price,
                'tax'            =>  $DatabaseTotalTaxAmount,
                'vat_tax_amount' =>  $vat_percentage_amount,
                'recurring_for'  =>  $reccure,
                'recurring_type' =>  in_array($membership->level, ['bronze', 'silver', 'gold', 'platinum']) ? 'monthly' : 'lifetime',
                'surprise_message'  =>  $request->message ?? NULL,
                'anonymous' => $request->anonymous ?? 0
            ]);

            // $transfering_amount = Helpers::priceFormat($membership->currency, $price, $currency) * 100;
            $price += $vat_percentage_amount;
            $amount_per = round(($price / ($tax + $price)) * 100, 2, PHP_ROUND_HALF_UP);

            $amount = $paymentPrice + $totalPaymentTaxAmount + $vat_percentage_amounts;
            $unit_amount = $amount * 100;
            // Log::info("Unit Amount: $unit_amount");
            // $tax =   Helpers::priceFormat($membership->currency, $tax, $currency);

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

            if ($membership->level != 'lifetime') {
                $items['price_data']['recurring']   =   [
                    'interval'  =>  StripeControl::$periods['monthly'],
                    'interval_count'    =>  1
                ];
            }

            try {
                $connectedAccountId = $membership->user->account_id;

                // Step 1: Check if customer already exists in the connected account table
                $storeCustomer = ConnectedAccountCustomer::where('user_id', Auth::id())
                    ->where('creator_id', $membership->user->id)
                    ->where('connected_account_id', $connectedAccountId)
                    ->first();

                // Step 2: Check if price already exists for this product & user in the connected account
                $existingPriceEntry = ConnectedAccountCustomer::where('user_id', Auth::id())
                    ->where('creator_id', $membership->user->id)
                    ->where('connected_account_id', $connectedAccountId)
                    ->where('product_id', $membership->product_id)
                    ->whereNotNull('price_id')
                    ->first();

                // Step 3: Create customer in the connected account if not exists
                $customer = null;
                if (empty($storeCustomer)) {
                    $customer = StripeControl::createCustomer([
                        'email' => $user->email,
                        'name' => $user->name,
                    ], $connectedAccountId);
                }

                $customer_id = $storeCustomer->stripe_customer_id ?? $customer->id;

                // Step 4: Use existing price or create new one
                if ($existingPriceEntry) {
                    $priceId = $existingPriceEntry->price_id;
                } else {
                    if ($membership->level === 'lifetime') {
                        $price = StripeControl::createPrice([
                            'unit_amount' => round($amount * 100),
                            'currency' => $currency,
                            'product' => $membership->product_id,
                        ], $connectedAccountId);
                    } else {
                        $price = StripeControl::createPrice([
                            'unit_amount' => round($amount * 100),
                            'currency' => $currency,
                            'recurring' => [
                                'interval' => 'month',
                                'interval_count' => 1,
                            ],
                            'product' => $membership->product_id,
                        ], $connectedAccountId);
                    }

                    if (empty($price->id)) {
                        throw new Exception("Failed to create Stripe price.");
                    }

                    $priceId = $price->id;
                }

                // Step 5: Store customer and price if not already stored
                if (empty($storeCustomer)) {
                    ConnectedAccountCustomer::create([
                        'user_id' => Auth::id(),
                        'creator_id' => $membership->user->id,
                        'connected_account_id' => $connectedAccountId,
                        'stripe_customer_id' => $customer_id,
                        'product_type' => 'membership',
                        'product_id' => $membership->product_id,
                        'price_id' => $priceId,
                    ]);
                }

                // Step 6: Build line item
                $items = [
                    'price' => $priceId,
                    'quantity' => 1
                ];

                // Step 7: Setup Checkout Session payload
                $payload = [
                    'currency' => $currency,
                    'line_items' => [$items],
                    'customer' => $customer_id,
                    'success_url' => route('membership.handle', ['uuid' => $sub->uuid, 'status' => "success"]),
                    'cancel_url' => route('membership.handle', ['uuid' => $sub->uuid, 'status' => "cancel"]),
                    'metadata' => [
                        'user_id' => Auth::id(),
                        'creator_id' => $membership->user->id,
                        'membership_id' => $membership->id,
                    ],
                ];

                if ($membership->level === 'lifetime') {
                    $payload['mode'] = 'payment';
                    $payload['payment_intent_data'] = [
                        'on_behalf_of' => $membership->user->account_id,
                        'description' => "Membership [{$membership->level}] for {$membership->user->username}",
                    ];
                } else {
                    $payload['mode'] = 'subscription';
                    $payload['subscription_data'] = [
                        'description' => "Membership [{$membership->level}] for {$membership->user->username}",
                    ];
                }

                // Step 8: Create Checkout Session in the connected account
                $session = StripeControl::createCheckoutSession($payload, $connectedAccountId);

                // Step 9: Save subscription session ID, product & price
                $sub->update([
                    'session_id' => $session->id,
                    'product_id' => $membership->product_id,
                    'price_id' => $priceId,
                    'customer_id' => $customer_id,
                ]);

                return Inertia::location($session->url);
            } catch (Exception $e) {
                $sub->delete();
                Log::error("Stripe Error: " . $e->getMessage());
                return back()->with('error', $e->getMessage());
            }
        }

        return Inertia::render('membership/MemberCheckout', [
            'membership'  => $membership,
            'isSocilAdded' => $isSocilAdded,
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
        $mem = MembershipPayment::with('membership')->whereUuid($uuid)->first();
        if (!$mem) {
            return to_route('home')->with("error", 'Insufficient data!');
        }
        if ($mem->status !== 'initiated') {
            return to_route('home')->with("error", 'Subscription already processed!');
        }
        try {
            $session = StripeControl::getCheckoutSession($mem->session_id, $mem->membership->user->account_id);
            $mem->status = $session->payment_status;
            if ($session->payment_status == 'paid') {
                $mem->stripe_id = $session->subscription;
                $current = Carbon::now();
                if ($mem->recurring_type == "monthly") {
                    $current->addMonth();
                }
                $mem->upcoming_payment = $current;
                $mem->save();

                if ($mem->recurring_for == 'onetime' && $mem->recurring_type == 'monthly') {
                    SubscriptionCancelAtEnd::dispatch($mem);
                } else {
                    $symbol = Currency::where('iso', strtoupper($mem->currency))->first();

                    $total_amount = $mem->membership->price + $mem->vat_tax_amount;
                    $amountWithCurr = $symbol->symbol . $total_amount;
                    MembershipMail::dispatch($mem, $amountWithCurr);
                }

                // this job is for creator
                //  MembershipMail::dispatch($mem, $amountWithCurr);

                $amountWithcurrency = $symbol->symbol . $mem->amount;

                // this job is for fan
                MembershipMailToUser::dispatch($mem, $amountWithcurrency);

                /**************************MEMBERSHIP**PWA**START****************************************************/
                // below is membership pwa for fans
                $CreatorName = $mem->membership->user->email ?? 'A Creator';
                $title = "🏆 Membership Activated!";
                $content = "You've subscribed to {{ $CreatorName }}’s membership. Enjoy the perks!.";
                $email = $mem->guest_email ?? $mem->user->email;

                Helpers::sendNotification($title, $content, $email);

                // below is membership pwa for creator
                $FanName = $mem->user->name ?? 'A Fan';
                $title = "💎 New Member Joined!";
                $content = "{{ $FanName }} just subscribed to your membership!";
                $email = $mem->membership->user->email;

                Helpers::sendNotification($title, $content, $email);
                /****************************MEMBERSHIP**PWA**ENDS****************************************************/

                if ($mem->anonymous == 1) {
                    $username = "Anonymous user";
                } else {
                    $username = $mem->guest_name ?? "Anonymous user";
                }

                $message = $username . " just subscribed to your " . $mem->membership->name . " membership";
                NotificationSave::dispatch($message, $mem->membership->user, $mem->user, 'Membership');
                // if ($mem->wish_item->user->auto_tweet == 1) {
                //     // MakeAutoTweets::dispatch($user);
                //     SubscribeAutoTweet::dispatch($mem);
                //     MembershipAutoTweet::dispatch($mem);
                // }

                return to_route('thank-you', ['username' => $mem->membership->user->username])->with('success', "Payment for subscription of membership is success.");
            }

            // SubscriptionFailed::dispatch($mem);

            $mem->save();
            return to_route('user.show', ['username' => $mem->membership->user->username])->with('warning', "Membership is in {$session->payment_status} status.");
        } catch (Exception $e) {
            Log::error("Stripe Error: " . $e->getMessage());
            return to_route('user.show', ['username' => $mem->membership->user->username])->with('error', $e->getMessage());
        }
        // return response()->json([
        //     'success'   =>  true,
        //     'session'   =>  $session,
        //     'status'    =>  $status
        // ]);
    }


    public function membershipDashboard()
    {
        $user = User::where('id', Auth::id())->where('is_uk', 0)->first();


        $count = MembershipPayment::whereHas('membership', function ($q) use ($user) {
            $q->where('user_id', $user->id);
        })->where('status', 'paid')->count();

        $per_month = MembershipPayment::whereHas('membership', function ($q) use ($user) {
            $q->where('user_id', $user->id);
        })->whereMonth('created_at', Carbon::now()->month)->where('status', 'paid')->sum('amount');

        $all_time = MembershipPayment::whereHas('membership', function ($q) use ($user) {
            $q->where('user_id', $user->id);
        })->where('status', 'paid')->sum('amount');

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


    public function membershipGraph()
    {
        $user = User::where('id', Auth::id())->where('is_uk', 0)->first();


        $currentDate = Carbon::now();


        $result = [];


        for ($i = 0; $i <= 4; $i++) {

            if ($i != 0) {
                $date = Carbon::now()->subMonth($i);
                $format_date = $date->format('F Y');
            } else {
                $date = $currentDate;
                $format_date = $currentDate->format('F Y');
            }


            $data = MembershipPayment::whereHas('membership', function ($q) use ($user) {
                $q->where('user_id', $user->id);
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


    public function membershipStatus(Request $request)
    {

        $stripe = new StripeClient(env('STRIPE_SECRET_KEY'));

        // This is your Stripe CLI webhook secret for testing your endpoint locally.
        // $endpoint_secret = 'whsec_a5n2XAXrZTXHKcRYKGnYoIvMc9do2u6N';

        // $sig_header = $_SERVER['HTTP_STRIPE_SIGNATURE'];
        // $payload = $request->getContent();
        $endpoint_secret = env('MEMBER_SUB_WEBHOOK_SECRET');
        $payload = @file_get_contents('php://input');
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
                'message' => $e->getMessage()
            ]);
            // Invalid signature
            http_response_code(400);
            exit();
        }

        $array = [];
        if (!empty($event)) {
            $subs = MembershipPayment::where('stripe_id', $event->data->object->id)->latest()->first();

            // $ret = StripeControl::getSubscription($event->data->object->id);
            $ret = $event->data->object;


            if ($event->type == "invoice.updated" && !empty($subs)) {

                $array = [
                    'email' => $event->data->object->customer_email ?? $subs->guest_email,
                    'name' => $event->data->object->customer_name ?? $subs->guest_name,
                    'invoice_pdf' => $event->data->object->invoice_pdf ?? null,
                    'uuid' => $subs->uuid,
                    'notification' => $subs->user->notification_send ?? 0
                ];


                $subs->status = "ended";
                $subs->save();

                $newSubs = new MembershipPayment();
                $newSubs->stripe_id = $subs->stripe_id;
                $newSubs->session_id = $subs->session_id;
                $newSubs->membership_id = $subs->membership_id;
                $newSubs->user_id = $subs->user_id;
                $newSubs->guest_name = $subs->guest_name;
                $newSubs->guest_email = $subs->guest_email;
                $newSubs->currency = $subs->currency;
                $newSubs->amount = $subs->amount;
                $newSubs->tax = $subs->tax;
                $newSubs->recurring_for = $subs->recurring_for;
                $newSubs->recurring_type = $subs->recurring_type;
                $newSubs->message = $subs->message;
                $newSubs->anonymous = $subs->anonymous;
                $newSubs->upcoming_payment = Carbon::createFromTimestamp($ret->current_period_end)->format('Y-m-d H:i:s');
                $newSubs->status = "paid";
                $newSubs->created_at = $subs->created_at;
                $newSubs->updated_at = Carbon::now();
                $newSubs->save();

                SendRenewMail::dispatch($array, 'renew', 'membership');
            } elseif ($event->type == "customer.subscription.deleted" && !empty($subs)) {
                $subs->status = 'cancelled';
                $subs->save();

                SendRenewMail::dispatch($array, 'cancelled', 'membership');
            } elseif ($event->type == "invoice.payment_failed" && !empty($subs)) {
                $subs->status = 'failed';
                $subs->save();

                SendRenewMail::dispatch($array, 'failed', 'membership');
            }
        }

        return response()->json([
            'status' => true,
            'message' => 'success',
        ]);
        // return true;
    }
}
