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
use App\Services\CreatorActivityService;
use App\Services\UserProfileService;
use App\Notifications\PaymentBlockedNotification;
use App\Notifications\SubscriptionBlockedNotification;
use App\Services\CreatorSubscriptionService;
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
use App\Models\UserPayment;
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
    protected $userProfileService;

    public function __construct(UserProfileService $userProfileService)
    {
        $this->userProfileService = $userProfileService;
        Stripe::setApiKey(env('STRIPE_SECRET_KEY'));
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
        $exist = Membership::where('user_id', $user->id)->pluck('level')->whereNull('deleted_at')->toArray();



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
        $mem->status = 1;
        $mem->save();

        // Get currency metadata to handle zero-decimal currencies properly
        $currencyModel = Currency::where('ISO', strtoupper($user->default_currency))->first();
        $multiplier = ($currencyModel && $currencyModel->ISOdigits == 0) ? 1 : 100;

        $productPayload = [
            "name"  =>  'Membership_' . $mem->level . '_' . $user->username,
            "images" => [$mem->perma_link],
            "default_price_data"    =>  [
                "currency"  => $user->default_currency,
                "unit_amount_decimal"   => round($totalPrice * $multiplier, 2, PHP_ROUND_HALF_UP),
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
            if (empty($connectedAccountId)) {
                return response()->json([
                    'status' => false,
                    'msg' => "You need to connect your Stripe account first."
                ]);
            }
            $product = StripeControl::createProduct($productPayload, $connectedAccountId);

            $mem->product_id = $product->id;
            $mem->price_id = $product->default_price;
            $mem->save();

            // Clear user caches
            $this->userProfileService->clearUserCaches($user->username, $user->id);
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
            return redirect()->back()->with("error", "Some words and emojis are not allowed. Eg. paypig, findom, worship, unlock, unblock, receive, tax, fee, session, deposit, tribute,dick,goddess,master,mistress, 😈, 💩, 💬, 👅, 🍆, 🍌, 🌽, 🌶️, 🍑, 💎, 💦");
        } else {
            try {
                $user = User::where('id', Auth::id())->where('is_uk', 0)->first();
                $mem = Membership::where('uuid', $uuid)->first();

                if (empty($mem)) {
                    return redirect()->back()->with("error", "Membership not found.");
                }

                $oldPriceId = $mem->price_id;
                $old_price = $mem->price;
                $old_level = $mem->level;
                $newLevel = $request->level;

                $price = $request->month_price;
                $taxamount = round(($price * config('app.member_tax') / 100), 2, PHP_ROUND_HALF_UP);
                $adminFee = config('app.administration_fee');
                $totalTaxAmount = $taxamount + $adminFee;
                $createpriceid = $price + $taxamount + $adminFee;

                $mem->level = $newLevel;
                $mem->price = $price;
                $mem->tax_amount = $totalTaxAmount;
                $mem->rewards = json_encode($request->rewards);
                if (!empty($request->thumbnail)) {
                    $mem->thumbnail = $request->thumbnail;
                }
                $mem->save();

                $stripe = new StripeClient(env('STRIPE_SECRET_KEY'));
                $connectedAccountId = $user->account_id;

                $priceChanged = $old_price != $price || $old_level != $newLevel;

                if ($priceChanged) {
                    // Get currency metadata to handle zero-decimal currencies properly
                    $currencyModel = Currency::where('ISO', strtoupper($user->default_currency))->first();
                    $multiplier = ($currencyModel && $currencyModel->ISOdigits == 0) ? 1 : 100;

                    $pricePayload = [
                        'unit_amount_decimal' => (string) round($createpriceid * $multiplier),
                        'currency' => $user->default_currency,
                        'product' => $mem->product_id,
                    ];

                    if ($newLevel !== 'lifetime') {
                        $pricePayload['recurring'] = [
                            'interval' => StripeControl::$periods['monthly'],
                            'interval_count' => 1,
                        ];
                    }

                    $newPrice = $stripe->prices->create($pricePayload, [
                        'stripe_account' => $connectedAccountId
                    ]);

                    $mem->price_id = $newPrice->id;

                    $stripe->products->update($mem->product_id, [
                        'default_price' => $newPrice->id,
                    ], [
                        'stripe_account' => $connectedAccountId
                    ]);

                    $stripe->prices->update($oldPriceId, [
                        'active' => false
                    ], [
                        'stripe_account' => $connectedAccountId
                    ]);
                }

                $product = $stripe->products->update($mem->product_id, [
                    "name" => $user->username . '_' . $newLevel,
                    "images" => [$mem->perma_link],
                    "url" => env('APP_URL') . '/' . $user->username . '/memberships',
                ], [
                    'stripe_account' => $connectedAccountId
                ]);

                $mem->product_id = $product->id;
                $mem->approved = 0;
                $mem->save();

                Logs::where('edited_membership_id', $mem->id)
                    ->where('status', 'pending')
                    ->update(['status' => 'updated']);

                // Clear user caches
                $this->userProfileService->clearUserCaches($user->username, $user->id);
            } catch (\Exception $e) {
                Log::info("Stripe Error: " . $e->getMessage());
                return redirect()->back()->with("error", "Stripe Error: " . $e->getMessage());
            }

            return redirect()->back()->with("success", "Membership level is Updated.");
        }
    }


    // return redirect(route("user.show", [
    //     "username" => Auth::user()->username,
    //     "page" => "memberships"
    // ]))->with('error', "Stripe Error: " . $e->getMessage());
    // return redirect()->back()->with('success', 'Membership level is added in your profile.')


    // return redirect(route("user.show", [
    //     "username" => Auth::user()->username,
    //     "page" => "memberships"
    // ]))->with('success', 'Membership level is Updated.');


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

        $stripeProduct = StripeControl::getProduct($mem->product_id, $mem->user->account_id);
        // dd($stripeProduct);
        if ($stripeProduct) {
            // Delete the product and prices from Stripe
            StripeControl::deleteProductAndPrices($stripeProduct->id, $mem->user->account_id);
        }

        $mem->delete();

        // Clear user caches
        $user = $mem->user;
        $this->userProfileService->clearUserCaches($user->username, $user->id);

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
        $checkGifterStatus = Helpers::checkGifterCardVerificationStatus();
        if ($checkGifterStatus === true) {
            $user = Auth::user();
            return to_route('user.show', ['username' => $user->username])
                ->with("error", "⚠️ Please complete your card verification payment and wait for admin approval before making further payments.");
        }
        $user = Auth::user();
        if ($user) {
            $isSocilAdded = SocialLinks::where('user_id', $user->id)
                ->where(function ($query) {
                    $query->whereNotNull('tumblr')
                        ->orWhereNotNull('instagram')
                        ->orWhereNotNull('twitch')
                        ->orWhereNotNull('facebook')
                        ->orWhereNotNull('twitter');
                })->exists();
        } else {
            $isSocilAdded = true;
            $user = User::where('email', $request->email)->first();
        }

        $membership = Membership::with('user')->whereUuid($uuid)->first();
        if (!$membership) return redirect()->back()->with('error', 'Membership not found!');

        if (!$membership->user) {
            return redirect()->back()->with('error', 'Creator account not found or deactivated.');
        }

        // NEW: Check creator subscription eligibility first
        $subscriptionCheck = app(CreatorSubscriptionService::class)->validateCreatorSubscription($membership->user);
        // return $subscriptionCheck;
        if (!$subscriptionCheck['eligible']) {
            $membership->user->notify(new SubscriptionBlockedNotification($subscriptionCheck, $membership->price));

            return redirect()->back()->with(
                'error',
                'This creator is temporarily unavailable. Please try again later.'
            );
        }

        // NEW: Check creator activity eligibility
        $activityCheck = app(CreatorActivityService::class)->validateCreatorActivity($membership->user);

        if (!$activityCheck['eligible']) {
            $membership->user->notify(new PaymentBlockedNotification($activityCheck, $membership->price));

            return redirect()->back()->with(
                'error',
                'This creator is temporarily unavailable. Please try again later.'
            );
        }

        // Log successful activity check for analytics
        if ($activityCheck['status'] !== 'not_creator' && $activityCheck['status'] !== 'not_fully_verified') {
        }

        // if (!in_array($membership->user->subscription_status, [1, 2])) {
        //     return redirect()->back()->with('error', "Currently creator has paused gift payments. Please again later when gift payments are active.");
        // }

        if ($user != null && $membership->user_id === $user->id) return redirect()->back()->with('error', "You can't buy your own membership!");
        $currency = strtolower($request->cookie("currency", "GBP"));
        $creatorCurrency = $membership->currency;
        $price = $membership->price;
        $convertedAmount = Helpers::priceFormat($creatorCurrency, $price, 'gbp');


        $memberTaxPercent = config('app.member_tax');
        $adminFeeGBP = config('app.administration_fee');
        $vatPercent = $membership->user->vat_amount_percentage ?? 0;

        $taxAmount = $price * $memberTaxPercent / 100;
        $vatAmount = ($price + $taxAmount) * $vatPercent / 100;

        $convertedAdminFee = Helpers::priceFormat('GBP', $adminFeeGBP, $currency);
        $convertedTaxAmount = Helpers::priceFormat($creatorCurrency, $taxAmount, $currency);
        $convertedVatAmount = Helpers::priceFormat($creatorCurrency, $vatAmount, $currency);
        $creatorTotal = $price + $vatAmount;
        $convertedCreatorTotal = Helpers::priceFormat($creatorCurrency, $creatorTotal, $currency);
        $platformTotal = $convertedTaxAmount + $convertedAdminFee;
        $finalTotalAmount = round($convertedCreatorTotal + $platformTotal, 2);
        $applicationFeePercent = round(($platformTotal / $finalTotalAmount) * 100, 2);

        if ($request->isMethod("POST")) {
            if (!Auth::check() && $convertedAmount > 50) {
                return to_route('login', ['message' => 'Larger payments more than £50 need to login']);
            }

            $this->ensureTurnstileVerified($request);

            $request->validate([
                'name' => ['nullable', 'string', 'max:50'],
                'email' => ['required', 'email:dns'],
                'message' => ['nullable', 'string', 'max:800'],
            ]);

            $sub = MembershipPayment::create([
                'membership_id' => $membership->id,
                'user_id' => $user->id ?? null,
                'guest_name' => $request->name,
                'guest_email' => $request->email,
                'currency' => $currency,
                'amount' => $price,
                'tax' => $convertedTaxAmount + $convertedAdminFee,
                'vat_tax_amount' => $convertedVatAmount,
                'recurring_for' => $reccure ?? null,
                'recurring_type' => in_array($membership->level, ['bronze', 'silver', 'gold', 'platinum']) ? 'monthly' : 'lifetime',
                'surprise_message' => $request->message,
                'anonymous' => $request->anonymous ?? 0,
            ]);

            try {
                $connectedAccountId = $membership->user->account_id;

                $customerRecord = ConnectedAccountCustomer::where([
                    'user_id' => $user->id ?? null,
                    'creator_id' => $membership->user->id,
                    'connected_account_id' => $connectedAccountId,
                    'product_type' => 'membership',
                    'product_id' => $membership->product_id,
                    'currency' => $currency
                ])->first();

                $customer_id = $customerRecord->stripe_customer_id ?? null;

                $existingSub = $customer_id
                    ? StripeControl::getActiveSubscriptionByCustomer($customer_id, $connectedAccountId)
                    : null;

                if ($existingSub && $existingSub->currency !== $currency) {
                    $customer = StripeControl::createCustomer([
                        'email' => $user->email ?? $request->email,
                        'name' => $user->name ?? $request->name,
                    ], $connectedAccountId);

                    $customer_id = $customer->id;
                    $customerRecord = null;
                }

                if (!$customer_id) {
                    $customer = StripeControl::createCustomer([
                        'email' => $user->email ?? $request->email,
                        'name' => $user->name ?? $request->name,
                    ], $connectedAccountId);
                    $customer_id = $customer->id;
                }

                $priceId = $customerRecord->price_id ?? null;

                // Get currency metadata to handle zero-decimal currencies properly
                $currencyModel = Currency::where('ISO', strtoupper($currency))->first();
                $multiplier = ($currencyModel && $currencyModel->ISOdigits == 0) ? 1 : 100;

                if (!$priceId) {

                    $priceData = [
                        'unit_amount' => round($finalTotalAmount * $multiplier),
                        'currency' => $currency,
                        'product' => $membership->product_id,
                    ];

                    if ($membership->level !== 'lifetime') {
                        $priceData['recurring'] = [
                            'interval' => StripeControl::$periods['monthly'],
                            'interval_count' => 1,
                        ];
                    }

                    $stripePrice = StripeControl::createPrice($priceData, $connectedAccountId);
                    $priceId = $stripePrice->id;
                }

                if (!$customerRecord) {
                    ConnectedAccountCustomer::create([
                        'user_id' => $user->id ?? null,
                        'creator_id' => $membership->user->id,
                        'connected_account_id' => $connectedAccountId,
                        'stripe_customer_id' => $customer_id,
                        'product_type' => 'membership',
                        'product_id' => $membership->product_id,
                        'price_id' => $priceId,
                        'currency' => $currency
                    ]);
                }

                // Calculate creator VAT amount if applicable
                $creatorVatAmount = 0;
                if (isset($membership->user->vat_amount_percentage) && $membership->user->vat_amount_percentage > 0) {
                    $creatorVatAmount = round(($membership->price * $membership->user->vat_amount_percentage / 100) * $multiplier);
                }

                // Use Direct Charges pattern (Standard/Express accounts)
                // We create the session on the connected account
                // 1. Line items are for the product/service
                // 2. Application fee is taken from the total
                
                $lineItems = [
                    [
                        'quantity' => 1,
                        'price_data' => [
                            'currency' => $currency,
                            'product_data' => [
                                'name' => $membership->level . ' Membership - ' . $membership->user->name,
                                'description' => "{$membership->level} membership from {$membership->user->name}",
                            ],
                            'unit_amount' => round($membership->price * $multiplier),
                        ]
                    ]
                ];

                // Add recurring data for non-lifetime memberships
                if ($membership->level !== 'lifetime') {
                    $lineItems[0]['price_data']['recurring'] = [
                        'interval' => StripeControl::$periods['monthly'],
                        'interval_count' => 1,
                    ];
                }

                // Add creator VAT as separate line item if applicable
                if ($creatorVatAmount > 0) {
                    $vatLineItem = [
                        'quantity' => 1,
                        'price_data' => [
                            'currency' => $currency,
                            'product_data' => [
                                'name' => 'VAT',
                            ],
                            'unit_amount' => $creatorVatAmount,
                            'tax_behavior' => 'exclusive',
                        ],
                    ];

                    // Add recurring data for VAT if not lifetime
                    if ($membership->level !== 'lifetime') {
                        $vatLineItem['price_data']['recurring'] = [
                            'interval' => StripeControl::$periods['monthly'],
                            'interval_count' => 1,
                        ];
                    }

                    $lineItems[] = $vatLineItem;
                }

                // Platform fee is calculated based on total amount
                // Total amount user pays = Price + VAT + Platform Fees
                // But for Direct Charges, the "amount" is what the user pays.
                // We want the user to pay (Price + VAT + Platform Fee).
                // So we add the Platform Fee as a line item OR we just add it to the total and take it out as app fee.
                // Best practice for Platform Fee transparency: Add it as a line item.
                
                $platformFeeLineItem = [
                    'quantity' => 1,
                    'price_data' => [
                        'currency' => $currency,
                        'product_data' => [
                            'name' => 'Platform Fee (' . config('app.platform_fee_percentage', 20) . '%)',
                        ],
                        'unit_amount' => round($platformTotal * $multiplier),
                        'tax_behavior' => 'exclusive',
                    ],
                ];

                // Add recurring data for platform fee if not lifetime
                if ($membership->level !== 'lifetime') {
                    $platformFeeLineItem['price_data']['recurring'] = [
                        'interval' => StripeControl::$periods['monthly'],
                        'interval_count' => 1,
                    ];
                }

                $lineItems[] = $platformFeeLineItem;

                // Total charge amount = membership price + creator's VAT + platform fees
                $totalChargeAmount = round($membership->price * $multiplier) + $creatorVatAmount + round($platformTotal * $multiplier);
                
                // Application Fee = Platform Fee
                $applicationFeeAmount = round($platformTotal * $multiplier);

                $payload = [
                    'payment_method_types' => ['card'],
                    'line_items' => $lineItems,
                    'customer_email' => $user->email ?? $request->email,
                    'success_url' => route('membership.handle', ['uuid' => $sub->uuid, 'status' => 'success']),
                    'cancel_url' => route('membership.handle', ['uuid' => $sub->uuid, 'status' => 'cancel']),
                ];

                if ($membership->level === 'lifetime') {
                    $payload['mode'] = 'payment';
                    $paymentIntentData = [
                        'description' => "Lifetime Membership for {$membership->user->username}",
                        'metadata' => \App\Helpers::buildStripeMetadata('membership', $sub, [
                            'membership_level' => $membership->level,
                            'item_amount' => (string) round($membership->price * $multiplier),
                            'creator_vat_amount' => (string) $creatorVatAmount,
                            'platform_fee_amount' => (string) $applicationFeeAmount,
                            'total_charge_amount' => (string) $totalChargeAmount,
                            'payment_type' => 'Lifetime Membership - Direct Charge',
                            'anonymous' => (string) ($request->anonymous ?? 0),
                        ]),
                        'application_fee_amount' => (int) $applicationFeeAmount,
                    ];
                    
                    $payload['payment_intent_data'] = $paymentIntentData;
                } else {
                    $payload['mode'] = 'subscription';
                    $payload['subscription_data'] = [
                        'description' => "Monthly Membership for {$membership->user->username}",
                        'metadata' => \App\Helpers::buildStripeMetadata('membership', $sub, [
                            'membership_level' => $membership->level,
                            'item_amount' => (string) round($membership->price * $multiplier),
                            'creator_vat_amount' => (string) $creatorVatAmount,
                            'platform_fee_amount' => (string) $applicationFeeAmount,
                            'total_charge_amount' => (string) $totalChargeAmount,
                            'payment_type' => 'Monthly Membership - Direct Charge',
                            'anonymous' => (string) ($request->anonymous ?? 0),
                        ]),
                        // For subscriptions in Direct Charges, application_fee_percent is common,
                        // but we can also use application_fee_amount on the first invoice if needed,
                        // but usually percent is better for recurring.
                        // However, since we added a specific line item for the fee, we should take THAT amount.
                        // Ideally, we want to take the exact amount of the platform fee line item.
                        // If we use application_fee_percent, it applies to the WHOLE amount.
                        // Application Fee % = (Platform Fee / Total Amount) * 100
                        'application_fee_percent' => $applicationFeePercent,
                    ];
                }

                // Create session on CONNECTED account
                $session = StripeControl::createCheckoutSession($payload, $connectedAccountId);

                $sub->update([
                    'session_id' => $session->id,
                    'product_id' => $membership->product_id,
                    'price_id' => $priceId,
                    'customer_id' => $customer_id,
                ]);

                return Inertia::location($session->url);
            } catch (\Exception $e) {
                Log::error("Stripe checkout session failed: " . $e->getMessage());
                return back()->with('error', $e->getMessage());
            }
        }

        return Inertia::render('membership/MemberCheckout', [
            'membership' => $membership,
            'isSocilAdded' => $isSocilAdded,
            'vat_amount' => $vatAmount,
            'reccure' => $reccure,
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
            // Retrieve session from CONNECTED account
            // We need to pass the connected account ID because the session was created on that account
            $connectedAccountId = $mem->membership->user->account_id;
            $session = StripeControl::getCheckoutSession($mem->session_id, $connectedAccountId);
            
            $mem->status = $session->payment_status;
            if ($session->payment_status == 'paid') {
                $mem->stripe_id = $session->subscription;
                $current = Carbon::now();
                if ($mem->recurring_type == "monthly") {
                    $current->addMonth();
                }
                $mem->upcoming_payment = $current;
                $mem->save();

                // Update GMV for creator
                Helpers::addGmv($mem->membership->user_id, (float) $mem->amount, $mem->membership->user->default_currency);

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

                Log::info('MembershipController: Starting membership email handling', [
                    'membership_payment_id' => $mem->id,
                    'membership_id' => $mem->membership->id,
                    'membership_level' => $mem->membership->level,
                    'recurring_for' => $mem->recurring_for,
                    'guest_email' => $mem->guest_email
                ]);

                // ✅ FIXED: Create deliverable entry for membership payment (exactly like bills)
                $this->createMembershipDeliverable($mem, $session);

                // ✅ ALWAYS send MembershipMailToUser - this is the confirmation email to the gifter
                // This should be sent regardless of CheckoutMailToUser success/failure
                MembershipMailToUser::dispatch($mem, $amountWithcurrency);
                Log::info('MembershipController: MembershipMailToUser dispatched for gifter confirmation', [
                    'membership_payment_id' => $mem->id,
                    'gifter_email' => $mem->guest_email,
                    'amount_with_currency' => $amountWithcurrency,
                    'membership_level' => $mem->membership->level
                ]);

                /**************************MEMBERSHIP**PWA**START****************************************************/
                // below is membership pwa for fans
                $CreatorName = ucfirst($mem->membership->user->name) ?? 'A Creator';
                $title = "🏆 Membership Activated!";
                $content = "You've subscribed to $CreatorName ’s membership. Enjoy the perks!.";
                $email = $mem->guest_email ?? $mem->user->email;

                Helpers::sendNotification($title, $content, $email);

                // below is membership pwa for creator
                $FanName = ucfirst($mem->user->name ?? $mem->guest_name) ?? 'A Fan';
                $title = "💎 New Member Joined!";
                $content = "$FanName just subscribed to your membership!.";
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

                $userPayment = new UserPayment();
                $userPayment->from_user_id = $mem->user_id ?? null;
                $userPayment->to_user_id = $mem->membership->user_id;
                $userPayment->product_type = 'membership';
                $userPayment->amount = $mem->amount;
                $userPayment->currency = $mem->currency;
                $userPayment->payment_method = 'stripe';
                $userPayment->payment_details = json_encode($session, true);
                $userPayment->paid_at = Carbon::now();
                $userPayment->status = $session->payment_status;
                $userPayment->save();
                // if ($mem->wish_item->user->auto_tweet == 1) {
                //     // MakeAutoTweets::dispatch($user);
                //     SubscribeAutoTweet::dispatch($mem);
                //     MembershipAutoTweet::dispatch($mem);
                // }

                // Clear user caches
                $this->userProfileService->clearUserCaches($mem->membership->user->username, $mem->membership->user->id);
                if ($mem->user) {
                    $this->userProfileService->clearUserCaches($mem->user->username, $mem->user->id);
                }

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
        // $endpoint_secret = env('MEMBER_SUB_WEBHOOK_SECRET');
        $endpoint_secret = 'whsec_xRYw7XUOjpI2icZQ7c8YwG3y4NtiXOMG';
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
            $convertedAmount = Helpers::priceFormat('GBP', $subs->amount, $subs->currency);

            // $ret = StripeControl::getSubscription($event->data->object->id);
            $ret = $event->data->object;


            if ($event->type == "invoice.updated" && !empty($subs)) {

                $array = [
                    'email' => $event->data->object->customer_email ?? $subs->guest_email,
                    'name' => $event->data->object->customer_name ?? $subs->guest_name,
                    'invoice_pdf' => $event->data->object->invoice_pdf ?? null,
                    'uuid' => $subs->uuid,
                    'notification' => $subs->user->notification_send ?? 0,
                    'trial_end' => $subs->upcoming_payment ?? null,
                    'amount' => $subs->amount ?? null,
                    'currency' => $subs->currency ?? 'GBP',
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

                // ✅ NEW: Create deliverable for membership renewal
                try {
                    Log::info('MembershipController: Creating deliverable for membership renewal', [
                        'new_membership_payment_id' => $newSubs->id,
                        'membership_id' => $newSubs->membership_id,
                        'stripe_subscription_id' => $newSubs->stripe_id
                    ]);

                    // Create deliverable entry for renewal (same as initial purchase)
                    $renewalDeliverable = $this->createMembershipRenewalDeliverable($newSubs);

                    if ($renewalDeliverable) {
                        Log::info('MembershipController: Renewal deliverable created', [
                            'deliverable_id' => $renewalDeliverable->id,
                            'membership_payment_id' => $newSubs->id
                        ]);
                    }
                } catch (Exception $e) {
                    Log::error('MembershipController: Failed to create renewal deliverable', [
                        'membership_payment_id' => $newSubs->id,
                        'error' => $e->getMessage()
                    ]);
                }

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
    
    // REMOVED: Old createStripePaymentForMembership method - now using direct deliverable creation like bills

    /**
     * Create deliverable entry for membership payment (exactly like bills)
     */
    private function createMembershipDeliverable($membershipPayment, $session)
    {
        try {
            $membership = $membershipPayment->membership;

            // Get payment intent ID from Stripe session if available
            $paymentIntentId = null;
            if ($session && isset($session->id)) {
                try {
                    $stripe = new \Stripe\StripeClient(env('STRIPE_SECRET_KEY'));
                    $retrievedSession = $stripe->checkout->sessions->retrieve($session->id);
                    $paymentIntentId = $retrievedSession->payment_intent ?? null;
                    \Illuminate\Support\Facades\Log::info('MembershipController: Retrieved payment intent from session', [
                        'session_id' => $session->id,
                        'payment_intent_id' => $paymentIntentId
                    ]);
                } catch (\Exception $e) {
                    \Illuminate\Support\Facades\Log::warning('MembershipController: Failed to retrieve payment intent from session', [
                        'session_id' => $session->id ?? 'unknown',
                        'error' => $e->getMessage()
                    ]);
                }
            }

            // Create deliverable entry for tracking (exactly like bills)
            $deliverable = \App\Models\Deliverable::create([
                'uuid' => \Ramsey\Uuid\Uuid::uuid4(),
                'product_id' => $membership->product_id ?? 'membership_' . $membership->id,
                'price_id' => $membership->price_id,
                'item_id' => $membership->id, // Add item_id for membership lookup
                'creator_id' => $membership->user_id,
                'gifter_id' => $membershipPayment->user_id,
                'payment_intent_id' => $paymentIntentId,
                'session_id' => $session->id,
                'deliverable_type' => 'access', // Membership provides access, not a file
                'product_type' => 'membership',
                'transaction_amount' => $membershipPayment->amount,
                'customer_email' => $membershipPayment->guest_email,
                'customer_name' => $membershipPayment->guest_name,
                'payment_currency' => strtoupper($membershipPayment->currency ?? 'GBP'),
                'anonymous' => $membershipPayment->anonymous ?? false,
                'message' => $membershipPayment->surprise_message,
                'deliverable_url' => null, // Memberships don't have downloadable content
                'metadata' => json_encode([
                    'product_type' => 'membership',
                    'membership_id' => $membership->id,
                    'membership_name' => $membership->level . ' Membership Access',
                    'membership_level' => $membership->level,
                    'amount' => $membershipPayment->amount,
                    'currency' => $membershipPayment->currency,
                    'subscription_id' => $membershipPayment->stripe_id,
                    'recurring_type' => $membershipPayment->recurring_type,
                    'recurring_for' => $membershipPayment->recurring_for,
                    'anonymous' => $membershipPayment->anonymous,
                    'message' => $membershipPayment->surprise_message,
                    'guest_email' => $membershipPayment->guest_email,
                    'guest_name' => $membershipPayment->guest_name,
                    'members_only_access' => true, // Flag indicating this grants membership access
                    'subscription_active' => true
                ]),
                'status' => 'delivered',
                'delivered_at' => now()
            ]);

            // Dispatch ProcessWishItemDeliverable job for certificate generation
            \App\Jobs\ProcessWishItemDeliverable::dispatch($deliverable);

            // Update Stripe payment intent metadata (same as bills)
            if ($paymentIntentId) {
                try {
                    $stripeMetadataService = app(\App\Services\StripeMetadataService::class);
                    $stripeMetadataService->updateDeliverableMetadata($deliverable, [
                        'membership_processed_at' => now()->toISOString(),
                        'immediate_delivery' => 'true'
                    ]);
                } catch (\Exception $e) {
                    \Illuminate\Support\Facades\Log::error('MembershipController: Failed to update Stripe metadata', [
                        'deliverable_id' => $deliverable->id,
                        'payment_intent_id' => $paymentIntentId,
                        'error' => $e->getMessage()
                    ]);
                }
            }

            Log::info('Membership deliverable created successfully', [
                'deliverable_id' => $deliverable->id,
                'membership_payment_id' => $membershipPayment->id,
                'membership_id' => $membership->id,
                'membership_level' => $membership->level
            ]);

            return $deliverable;
        } catch (\Exception $e) {
            Log::error('Failed to create membership deliverable', [
                'error' => $e->getMessage(),
                'membership_payment_id' => $membershipPayment->id ?? 'unknown',
                'membership_id' => $membershipPayment->membership->id ?? 'unknown'
            ]);
            return null;
        }
    }

    /**
     * Create deliverable entry for membership renewal (similar to initial purchase)
     */
    private function createMembershipRenewalDeliverable($membershipPayment)
    {
        try {
            $membership = $membershipPayment->membership;

            if (!$membership) {
                \Illuminate\Support\Facades\Log::error('MembershipController: No membership found for renewal deliverable', [
                    'membership_payment_id' => $membershipPayment->id
                ]);
                return null;
            }

            // For renewals, we don't have a session but we have the subscription info
            $paymentIntentId = null; // Renewals typically don't have payment intent, just subscription invoice

            // Create deliverable entry for renewed membership access
            $deliverable = \App\Models\Deliverable::create([
                'uuid' => \Ramsey\Uuid\Uuid::uuid4(),
                'product_id' => $membership->product_id ?? 'membership_' . $membership->id,
                'price_id' => $membership->price_id,
                'item_id' => $membership->id,
                'creator_id' => $membership->user_id,
                'gifter_id' => $membershipPayment->user_id,
                'payment_intent_id' => $paymentIntentId,
                'session_id' => $membershipPayment->session_id, // Original session, not renewal invoice
                'deliverable_type' => 'membership_access',
                'product_type' => 'membership',
                'transaction_amount' => $membershipPayment->amount,
                'customer_email' => $membershipPayment->guest_email,
                'customer_name' => $membershipPayment->guest_name,
                'payment_currency' => strtoupper($membershipPayment->currency ?? 'GBP'),
                'anonymous' => $membershipPayment->anonymous ?? false,
                'message' => $membershipPayment->surprise_message,
                'deliverable_url' => null, // Members-only access, no direct content URL
                'metadata' => json_encode([
                    'certificate' => 'true', // Enable certificate for renewed membership
                    'product_type' => 'membership',
                    'membership_id' => $membership->id,
                    'membership_level' => $membership->level,
                    'membership_name' => $membership->level . ' Membership',
                    'amount' => $membershipPayment->amount,
                    'currency' => $membershipPayment->currency,
                    'subscription_id' => $membershipPayment->stripe_id,
                    'recurring_type' => $membershipPayment->recurring_type,
                    'recurring_for' => $membershipPayment->recurring_for,
                    'anonymous' => $membershipPayment->anonymous,
                    'message' => $membershipPayment->surprise_message,
                    'guest_email' => $membershipPayment->guest_email,
                    'guest_name' => $membershipPayment->guest_name,
                    'members_only_access' => true, // Flag for membership access
                    'subscription_active' => true,
                    'is_renewal' => true, // Mark as renewal deliverable
                    'renewal_period_start' => now()->toISOString(),
                    'renewal_period_end' => $membershipPayment->upcoming_payment ?? Carbon::now()->addMonth()->toISOString()
                ]),
                'status' => 'delivered',
                'delivered_at' => now()
            ]);

            // Dispatch ProcessWishItemDeliverable job for certificate generation
            \App\Jobs\ProcessWishItemDeliverable::dispatch($deliverable);

            Log::info('Membership renewal deliverable created successfully', [
                'deliverable_id' => $deliverable->id,
                'membership_payment_id' => $membershipPayment->id,
                'membership_id' => $membership->id,
                'membership_level' => $membership->level,
                'is_renewal' => true,
                'has_certificate' => true
            ]);

            return $deliverable;
        } catch (\Exception $e) {
            Log::error('Failed to create membership renewal deliverable', [
                'error' => $e->getMessage(),
                'membership_payment_id' => $membershipPayment->id ?? 'unknown',
                'membership_id' => $membershipPayment->membership->id ?? 'unknown'
            ]);
            return null;
        }
    }
}
