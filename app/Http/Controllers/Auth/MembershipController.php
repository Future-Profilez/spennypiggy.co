<?php

namespace App\Http\Controllers\Auth;

use App\Helpers;
use App\Http\Controllers\Controller;
use App\Jobs\MembershipMail;
use App\Jobs\MembershipMailToUser;
use App\Jobs\NotificationSave;
use App\Jobs\SendRenewMail;
use App\Jobs\SubscriptionCancelAtEnd;
use App\Services\CreatorActivityService;
use App\Services\UserProfileService;
use App\Notifications\PaymentBlockedNotification;
use App\Notifications\SubscriptionBlockedNotification;
use App\Services\CreatorSubscriptionService;
use App\Models\ConnectedAccountCustomer;
use App\Models\Currency;
use App\Models\FinancialTransaction;
use App\Models\Deliverable;
use App\Models\Logs;
use App\Models\Membership;
use App\Models\MembershipPayment;
use App\Models\Payment;
use App\Models\SocialLinks;
use App\Models\User;
use App\Models\UserPayment;
use App\StripeControl;
use App\Jobs\ProcessWishItemDeliverable;
use App\Services\StripeMetadataService;
use Carbon\Carbon;
use Exception;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Validator;
use Inertia\Inertia;
use Stripe\Stripe;
use Stripe\StripeClient;
use Stripe\Webhook;
use App\Traits\RiskEnforcement;
use Stripe\Subscription;

class MembershipController extends Controller
{
    use RiskEnforcement;
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

        $user = User::where('id', Auth::id())->first();
        $exist = Membership::where('user_id', $user->id)->pluck('level')->whereNull('deleted_at')->toArray();

        if (in_array($request->level, $exist)) {
            return response()->json([
                "status" => false,
                "msg" => "You already have a level of " . $request->level,
            ]);
        }

        $rewards = json_encode($request->rewards);

        $price = $request->month_price;
        $currency = $user->default_currency ?? 'GBP';

        // Calculate VAT in Creator's Currency
        $vatPercent = $user->vat_amount_percentage ?? 0;
        $vatAmount = $price * $vatPercent / 100;
        $priceWithVat = $price + $vatAmount;

        $metrics = app(\App\Services\Risk\RiskService::class)->recalculateMetrics((string) $user->uuid);
        $reserveRate = $metrics->reserve_percent ?? 0;

        // Use new gross-up flow
        $breakdown = Helpers::calculateStripeDirectChargeFlow($priceWithVat, $currency, $reserveRate);
        $totalPrice = $breakdown['total_supporter_pays'];
        $taxAmount = $breakdown['total_fees']; // Store total fees (Platform + Stripe) for consistency

        $mem = new Membership();
        $mem->user_id = Auth::id();
        $mem->level = $request->level;
        $mem->currency = $currency;
        $mem->price = $price;
        $mem->tax_amount = $taxAmount;
        $mem->thumbnail = $request->thumbnail ?? null;
        $mem->rewards = $rewards;
        $mem->status = 1;
        $mem->save();

        // Get currency metadata to handle zero-decimal currencies properly
        $currencyModel = Currency::where('ISO', strtoupper($currency))->first();
        $multiplier = ($currencyModel && $currencyModel->ISOdigits == 0) ? 1 : 100;

        $productPayload = [
            "name"  => "Membership: {$mem->level} (Total value including all fees)",
            "images" => [$mem->perma_link],
            "default_price_data"    =>  [
                "currency"  => $currency,
                "unit_amount_decimal"   => round($totalPrice * $multiplier, 2, PHP_ROUND_HALF_UP),
            ],
            "url"   =>  env('APP_URL') . '/' . $user->username,
            'metadata' => [
                'membership_level' => $mem->level,
                'creator_id' => $user->id,
                'creator_net_amount' => (string)($breakdown['net_to_creator'] * 100),
                'total_charge_amount' => (string)($totalPrice * 100),
            ]
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

        $blockedWord = Helpers::checkBlockData($request);
        if ($blockedWord !== false) {
            return redirect()->back()->with("error", "The word or emoji '{$blockedWord}' is not allowed as per our policies.");
        } else {
            try {
                $user = User::where('id', Auth::id())->first();
                $mem = Membership::where('uuid', $uuid)->first();

                if (empty($mem)) {
                    return redirect()->back()->with("error", "Membership not found.");
                }

                $oldPriceId = $mem->price_id;
                $old_price = $mem->price;
                $old_level = $mem->level;
                $newLevel = $request->level;

                $price = $request->month_price;
                $currency = $user->default_currency ?? 'USD';

                // Calculate VAT in Creator's Currency
                $vatPercent = $user->vat_amount_percentage ?? 0;
                $vatAmount = $price * $vatPercent / 100;
                $priceWithVat = $price + $vatAmount;

                $metrics = app(\App\Services\Risk\RiskService::class)->recalculateMetrics((string) $user->uuid);
                $reserveRate = $metrics->reserve_percent ?? 0;

                // Use new gross-up flow
                $breakdown = Helpers::calculateStripeDirectChargeFlow($priceWithVat, $currency, $reserveRate);
                $totalPriceGrossedUp = $breakdown['total_supporter_pays'];
                $totalTaxAmount = $breakdown['application_fee'];

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

                // Check if product exists in Stripe
                $stripeProduct = null;
                try {
                    $stripeProduct = $stripe->products->retrieve($mem->product_id, [], ['stripe_account' => $connectedAccountId]);
                } catch (Exception $e) {
                    Log::warning("Stripe Product not found for membership {$mem->uuid}, will attempt to recreate. Error: " . $e->getMessage());
                }

                // Get currency metadata to handle zero-decimal currencies properly
                $currencyModel = Currency::where('ISO', strtoupper($currency))->first();
                $multiplier = ($currencyModel && $currencyModel->ISOdigits == 0) ? 1 : 100;

                if (!$stripeProduct) {
                    // Recreate the product if it's missing from Stripe
                    $productPayload = [
                        "name"  => "Membership: {$newLevel} (Total value including all fees)",
                        "images" => [$mem->perma_link],
                        "default_price_data"    =>  [
                            "currency"  => $currency,
                            "unit_amount_decimal"   => round($totalPriceGrossedUp * $multiplier, 2, PHP_ROUND_HALF_UP),
                        ],
                        "url"   =>  env('APP_URL') . '/' . $user->username,
                        'metadata' => [
                            'membership_level' => $newLevel,
                            'creator_id' => $user->id,
                            'creator_net_amount' => (string)($breakdown['net_to_creator'] * 100),
                            'total_charge_amount' => (string)($totalPriceGrossedUp * 100),
                        ]
                    ];

                    if ($newLevel != 'lifetime') {
                        $productPayload['default_price_data']['recurring']  =   [
                            'interval'  =>  StripeControl::$periods["monthly"],
                            'interval_count'    =>  1
                        ];
                    }

                    $stripeProduct = StripeControl::createProduct($productPayload, $connectedAccountId);

                    $mem->update([
                        'product_id' => $stripeProduct->id,
                        'price_id' => $stripeProduct->default_price,
                        'approved' => 0,
                    ]);

                    Log::info("Recreated Stripe Product for membership {$mem->uuid}: " . $stripeProduct->id);
                } else {
                    $priceChanged = $old_price != $price || $old_level != $newLevel;

                    if ($priceChanged) {
                        $pricePayload = [
                            'unit_amount_decimal' => (string) round($totalPriceGrossedUp * $multiplier),
                            'currency' => $currency,
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
                        "name" => "Membership: {$newLevel} (Total value including all fees)",
                        "images" => [$mem->perma_link],
                        "url" => env('APP_URL') . '/' . $user->username . '/memberships',
                        'metadata' => [
                            'membership_level' => $newLevel,
                            'creator_id' => $user->id,
                            'creator_net_amount' => (string)($breakdown['net_to_creator'] * 100),
                            'total_charge_amount' => (string)($totalPriceGrossedUp * 100),
                        ]
                    ], [
                        'stripe_account' => $connectedAccountId
                    ]);

                    $mem->product_id = $product->id;
                }
                if ($mem->edited_status === 0 || $mem->edited_status === 3) {
                    $mem->edited_status = 1;
                }
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
        $user = Auth::user();
        if ($checkGifterStatus === true) {
            // $user = Auth::user();
            return to_route('user.show', ['username' => $user->username])
                ->with("error", "⚠️ Please complete your card verification payment and wait for admin approval before making further payments.");
        }
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

        if ($membership->is_suspended) {
            return redirect()->back()->with('error', 'This membership is currently suspended and cannot accept payments.');
        }

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
                app(\App\Services\CreatorAvailabilityMessageService::class)->supporterMessage($subscriptionCheck, null)
            );
        }

        // NEW: Check creator activity eligibility
        $activityCheck = app(CreatorActivityService::class)->validateCreatorActivity($membership->user);

        if (!$activityCheck['eligible']) {
            $membership->user->notify(new PaymentBlockedNotification($activityCheck, $membership->price));

            return redirect()->back()->with(
                'error',
                app(\App\Services\CreatorAvailabilityMessageService::class)->supporterMessage(null, $activityCheck)
            );
        }

        // Log successful activity check for analytics
        if ($activityCheck['status'] !== 'not_creator' && $activityCheck['status'] !== 'not_fully_verified') {
        }

        // if (!in_array($membership->user->subscription_status, [1, 2])) {
        //     return redirect()->back()->with('error', "Currently creator has paused gift payments. Please again later when gift payments are active.");
        // }

        if ($user != null && $membership->user_id === $user->id) return redirect()->back()->with('error', "You can't buy your own membership!");
        // Client Requirement: Always charge in Creator's Currency
        $chargeCurrency = $membership->currency;
        // Supporter's display currency for estimation
        $displayCurrency = strtolower($request->cookie("currency", "GBP"));

        $price = $membership->price;

        // Calculate VAT in Creator's Currency
        $vatPercent = $membership->user->vat_amount_percentage ?? 0;
        $priceWithVat = $price + ($price * $vatPercent / 100);

        $metrics = app(\App\Services\Risk\RiskService::class)->recalculateMetrics((string) $membership->user->uuid);
        $reserveRate = $metrics->reserve_percent ?? 0;

        // Gross-up calculation in Creator's Currency (No FX conversion)
        $breakdown = Helpers::calculateStripeDirectChargeFlow($priceWithVat, $chargeCurrency, $reserveRate);

        $finalTotalAmount = $breakdown['total_supporter_pays'];
        $applicationFeeAmount = $breakdown['application_fee'];
        $creatorNet = $breakdown['net_to_creator']; // This is what creator gets after Stripe fees

        // Application Fee % = (Application Fee / Total Amount) * 100
        $applicationFeePercent = round(($applicationFeeAmount / $finalTotalAmount) * 100, 2);

        if ($request->isMethod("POST")) {
            // Unified Risk Enforcement
            $riskData = $this->enforceRiskChecks(
                $request,
                $membership->user,
                $finalTotalAmount,
                $chargeCurrency,
                'membership_checkout',
                false // redirect response
            );

            if ($riskData instanceof \Illuminate\Http\RedirectResponse) {
                return $riskData;
            }

            $force3DS = in_array('FORCE_3DS', $riskData['reason_codes'] ?? []);

            $request->validate([
                'name' => ['nullable', 'sometimes', 'string', 'max:50'],
                'email' => ['required', 'email:dns'],
                'message' => ['sometimes', 'nullable', 'string', 'max:800'],
                'digital_waiver' => ['required', 'accepted'],
            ]);

            if ($msgErr = Helpers::validateSupporterMessage($request->message ?? null, 100)) {
                return back()->with('error', $msgErr);
            }

            if ($user) {
                $now = Carbon::now();
                // Check if the user has an active membership record that also has active access (not refunded)
                $hasActiveSameTier = MembershipPayment::where(function ($q) use ($user) {
                    $q->where('user_id', $user->id)
                        ->orWhere('guest_email', $user->email);
                })
                    ->where('membership_id', $membership->id)
                    ->where('status', 'paid')
                    ->where(function ($q) use ($now) {
                        $q->whereNull('end')->orWhere('end', '>', $now);
                    })
                    ->whereNotNull('stripe_id')
                    ->whereExists(function ($query) use ($user, $membership) {
                        $query->select(DB::raw(1))
                            ->from('deliverables')
                            ->where('deliverables.item_id', $membership->id)
                            ->where('deliverables.product_type', 'membership')
                            ->where('deliverables.status', 'delivered')
                            ->where(function ($q) use ($user) {
                                $q->where('deliverables.gifter_id', $user->id)
                                    ->orWhere('deliverables.customer_email', $user->email);
                            });
                    })
                    ->exists();

                if ($hasActiveSameTier) {
                    return back()->with(
                        'error',
                        "You already have an active {$membership->level} membership for this creator."
                    );
                }
            }

            $sub = MembershipPayment::create([
                'membership_id' => $membership->id,
                'user_id' => $user->id ?? null,
                'guest_name' => $request->name,
                'guest_email' => $request->email,
                'currency' => $chargeCurrency, // Force Creator's Currency
                'amount' => $price,
                'total_paid' => $finalTotalAmount,
                'tax' => $breakdown['total_fees'],
                'vat_tax_amount' => $price * $vatPercent / 100, // Store actual VAT amount
                'recurring_for' => $reccure ?? null,
                'recurring_type' => in_array($membership->level, ['bronze', 'silver', 'gold', 'platinum']) ? 'monthly' : 'lifetime',
                'surprise_message' => $request->message,
                'anonymous' => $request->anonymous ?? 0,
                'creator_currency' => $membership->currency,
                'charge_currency' => $chargeCurrency,
                'display_currency' => $displayCurrency,
            ]);

            // Apply digital waiver confirmation
            Helpers::applyDigitalWaiver($sub, (bool) $request->digital_waiver);
            $sub->save();

            try {
                $connectedAccountId = $membership->user->account_id;

                // Check if creator has card_payments capability
                if (!StripeControl::hasCardPaymentsCapability($connectedAccountId)) {
                    $stripeCheck = ['eligible' => false, 'status' => 'stripe_disabled'];
                    return back()->with('error', app(\App\Services\CreatorAvailabilityMessageService::class)->supporterMessage(null, null, $stripeCheck));
                }

                $customerRecord = ConnectedAccountCustomer::where([
                    'user_id' => $user->id ?? null,
                    'creator_id' => $membership->user->id,
                    'connected_account_id' => $connectedAccountId,
                    'product_type' => 'membership',
                    'product_id' => $membership->product_id,
                    'currency' => $chargeCurrency
                ])->first();

                $customer_id = $customerRecord->stripe_customer_id ?? null;

                $existingSub = $customer_id
                    ? StripeControl::getActiveSubscriptionByCustomer($customer_id, $connectedAccountId)
                    : null;

                if ($existingSub && $existingSub->currency !== $chargeCurrency) {
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
                $currencyModel = Currency::where('ISO', strtoupper($chargeCurrency))->first();
                $multiplier = ($currencyModel && $currencyModel->ISOdigits == 0) ? 1 : 100;

                if (!$priceId) {

                    // Verify product exists on connected account before creating price
                    try {
                        StripeControl::getProduct($membership->product_id, $connectedAccountId);
                    } catch (\Exception $e) {
                        // Product not found or other error - recreate it
                        Log::info("Product not found for membership checkout, recreating: " . $membership->product_id);

                        $productPayload = [
                            "name"  => "Membership: {$membership->level} (Total value including all fees)",
                            "images" => [$membership->perma_link],
                            "url"   =>  env('APP_URL') . '/' . $membership->user->username,
                            'metadata' => [
                                'membership_level' => $membership->level,
                                'creator_id' => $membership->user->id,
                            ]
                        ];

                        try {
                            $product = StripeControl::createProduct($productPayload, $connectedAccountId);
                            $membership->product_id = $product->id;
                            $membership->save();

                            // Update customer record if it exists
                            if ($customerRecord) {
                                $customerRecord->product_id = $product->id;
                                $customerRecord->save();
                            }
                        } catch (\Exception $createEx) {
                            Log::error("Failed to recreate product: " . $createEx->getMessage());
                            return back()->with('error', "Payment configuration error. Please try again.");
                        }
                    }

                    $priceData = [
                        'unit_amount' => round($finalTotalAmount * $multiplier),
                        'currency' => $chargeCurrency,
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
                        'currency' => $chargeCurrency
                    ]);
                }

                // Use Direct Charges pattern (Standard/Express accounts)
                // Single line item hiding all fees
                $lineItems = [
                    [
                        'quantity' => 1,
                        'price_data' => [
                            'currency' => $chargeCurrency,
                            'product_data' => [
                                'name' => "Total value of item including all fees",
                                'description' => "{$membership->level} membership from {$membership->user->name}",
                            ],
                            'unit_amount' => round($finalTotalAmount * $multiplier),
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

                $payload = [
                    'payment_method_types' => ['card'],
                    'line_items' => $lineItems,
                    'customer' => $customer_id,
                    'success_url' => route('membership.handle', ['uuid' => $sub->uuid, 'status' => 'success']),
                    'cancel_url' => route('membership.handle', ['uuid' => $sub->uuid, 'status' => 'cancel']),
                ];

                // Ensure receipt_email is set for Stripe receipts
                $customerEmail = $user->email ?? $request->email;
                if ($customerEmail) {
                    if ($membership->level === 'lifetime') {
                        // For mode: payment
                        if (!isset($payload['payment_intent_data'])) {
                            $payload['payment_intent_data'] = [];
                        }
                        $payload['payment_intent_data']['receipt_email'] = $customerEmail;
                    } else {
                        // For mode: subscription, Stripe uses the customer's email automatically.
                        // However, we can also set it on the checkout session if no customer ID is used.
                        // Since we have a customer_id, Stripe will use that customer's email.
                    }
                }

                // Risk Engine: Force 3DS if Step-Up required
                if (in_array('FORCE_3DS', $riskData['reason_codes'] ?? [])) {
                    $payload['payment_method_options'] = [
                        'card' => [
                            'request_three_d_secure' => 'any',
                        ],
                    ];
                }

                if ($membership->level === 'lifetime') {
                    $payload['mode'] = 'payment';
                    $paymentIntentData = [
                        'description' => "Lifetime Membership for {$membership->user->username} (Total value including all fees)",
                        'metadata' => Helpers::buildStripeMetadata('membership', $sub, [
                            'membership_level' => $membership->level,
                            'item_amount' => (string) round($membership->price * $multiplier),
                            'creator_net_amount' => (string) ($creatorNet * $multiplier),
                            'platform_fee_amount' => (string) round($applicationFeeAmount * $multiplier),
                            'total_charge_amount' => (string) round($finalTotalAmount * $multiplier),
                            'payment_type' => 'Lifetime Membership - Direct Charge',
                            'anonymous' => (string) ($request->anonymous ?? 0),
                            'creator_currency' => $membership->currency,
                            'display_currency' => $displayCurrency,
                            'vat_rate' => (string) $vatPercent,
                        ]),
                        'application_fee_amount' => (int) round($applicationFeeAmount * $multiplier),
                    ];

                    $payload['payment_intent_data'] = $paymentIntentData;
                } else {
                    $payload['mode'] = 'subscription';
                    $payload['subscription_data'] = [
                        'description' => "Monthly Membership for {$membership->user->username} (Total value including all fees)",
                        'metadata' => Helpers::buildStripeMetadata('membership', $sub, [
                            'membership_level' => $membership->level,
                            'item_amount' => (string) round($membership->price * $multiplier),
                            'creator_net_amount' => (string) ($creatorNet * $multiplier),
                            'platform_fee_amount' => (string) round($applicationFeeAmount * $multiplier),
                            'total_charge_amount' => (string) round($finalTotalAmount * $multiplier),
                            'payment_type' => 'Monthly Membership - Direct Charge',
                            'anonymous' => (string) ($request->anonymous ?? 0),
                            'creator_currency' => $membership->currency,
                            'display_currency' => $displayCurrency,
                            'vat_rate' => (string) $vatPercent,
                        ]),
                        'application_fee_percent' => $applicationFeePercent,
                    ];
                }

                // Create session on CONNECTED account
                $session = StripeControl::createCheckoutSession($payload, $connectedAccountId, $force3DS, $membership->user->username);

                $sub->update([
                    'session_id' => $session->id,
                    'product_id' => $membership->product_id,
                    'price_id' => $priceId,
                    'customer_id' => $customer_id,
                ]);

                try {
                    Payment::firstOrCreate(
                        ['stripe_session_id' => $session->id],
                        [
                            'creator_id' => $membership->user->uuid,
                            'risk_identity_id' => $riskData['risk_identity_id'] ?? null,
                            'amount' => app(\App\Services\Risk\MoneyNormalizer::class)->toGbpMinor((int) round($finalTotalAmount * $multiplier), strtoupper($chargeCurrency)),
                            'currency' => 'gbp',
                            'stripe_payment_intent_id' => $session->payment_intent ?? null,
                            'status' => 'initiated',
                            'reason_codes' => $riskData['reason_codes'] ?? [],
                        ]
                    );
                } catch (\Exception $e) {
                    Log::warning('Risk Ledger: Failed to record membership payment', [
                        'session_id' => $session->id,
                        'error' => $e->getMessage(),
                    ]);
                }

                return Inertia::location($session->url);
            } catch (\Exception $e) {
                Log::error("Stripe checkout session failed: " . $e->getMessage());
                return back()->with('error', $e->getMessage());
            }
        }

        $card_capabilities = StripeControl::hasCardPaymentsCapability($membership->user->account_id);

        // Recalculate fees for display purposes to ensure tax_amount is not null
        // Client Rule: VAT must be added BEFORE all other fees when calculating
        $vatPercent = $membership->user->vat_amount_percentage ?? 0;
        $vatAmount = $membership->price * $vatPercent / 100;

        $priceWithVat = $membership->price + $vatAmount;

        $metrics = app(\App\Services\Risk\RiskService::class)->recalculateMetrics((string) $membership->user->uuid);
        $reserveRate = $metrics->reserve_percent ?? 0;

        $breakdownCreator = Helpers::calculateStripeDirectChargeFlow($priceWithVat, $membership->currency, $reserveRate);

        // Update membership object for view (this doesn't save to DB)
        // We include both application fee and stripe fee in the "tax_amount" for display so the total is closer to reality
        // Note: The Stripe fee isn't "set" by us (it's variable), but we include the estimated amount here 
        // to highlight where it goes in the flow and ensure the Total matches the actual charge.
        $membership->tax_amount = $breakdownCreator['application_fee'] + $breakdownCreator['stripe_fee'];

        return Inertia::render('membership/MemberCheckout', [
            'membership' => $membership,
            'isSocilAdded' => $isSocilAdded,
            'reccure' => $reccure,
            'card_capabilities' => $card_capabilities,
            'vat_amount' => $vatAmount,
            'creator_currency' => $membership->currency, // Pass creator currency
            'display_currency' => $displayCurrency, // Pass display currency
        ]);
    }

    /**
     * Handle Checkout Session
     *
     * @param string $uuid Subscription UUID
     * @param string $status Status of Subscription
     * @return mixed
     */
    public function handlePayment($uuid)
    {
        $mem = MembershipPayment::with('membership')->whereUuid($uuid)->first();
        if (!$mem) {
            return to_route('home')->with("error", 'Insufficient data!');
        }
        if ($mem->status !== 'initiated') {
            return to_route('user.show', ['username' => $mem->membership->user->username])->with("success", 'Subscription already processed!');
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

                    // Calculate creator net amount
                    $breakdown = Helpers::calculateStripeDirectChargeFlow($total_amount, $mem->currency);
                    $creatorNetAmount = ($symbol->symbol ?? '£') . number_format($breakdown['net_to_creator'], 2);

                    MembershipMail::dispatch($mem, $creatorNetAmount);
                }

                // this job is for creator
                //  MembershipMail::dispatch($mem, $amountWithCurr);

                $multiplier = Helpers::isZeroDecimalCurrency($session->currency) ? 1 : 100;
                $totalPaidAmount = $mem->total_paid && $mem->total_paid > 0 ? $mem->total_paid : (float) ($session->amount_total / $multiplier);
                $amountWithcurrency = ($symbol->symbol ?? '£') . number_format($totalPaidAmount, 2);

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
                $amountWithcurrencies = $symbol->symbol . $mem->total_paid;
                MembershipMailToUser::dispatch($mem, $amountWithcurrencies);
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
                $content = "You've subscribed to $CreatorName ’s membership for {$amountWithcurrency}. Enjoy the perks!.";
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

                // Ensure total_paid is updated in MembershipPayment if missing
                if (!$mem->total_paid || $mem->total_paid <= 0) {
                    $multiplier = Helpers::isZeroDecimalCurrency($session->currency) ? 1 : 100;
                    $mem->total_paid = (float) ($session->amount_total / $multiplier);
                    $mem->save();
                }

                $userPayment->total_paid = $mem->total_paid;
                $userPayment->currency = $mem->currency;
                $userPayment->payment_method = 'stripe';
                $userPayment->payment_details = json_encode($session, true);
                $userPayment->paid_at = Carbon::now();
                $userPayment->status = $session->payment_status;
                $userPayment->save();

                // Immediately sync to FinancialTransaction so earnings dashboard and support history shows up-to-date
                try {
                    $creator = $mem->membership->user;
                    $amount = (float) $mem->amount;
                    $vat = (float) ($mem->vat_tax_amount ?? 0);
                    if ($vat <= 0 && $creator && $creator->vat_amount_percentage > 0) {
                        $vat = round(($amount * (float) $creator->vat_amount_percentage) / 100, 2, PHP_ROUND_HALF_UP);
                    }
                    // Use actual fee breakdown from the gross-up formula
                    $memBreakdown = \App\Helpers::calculateStripeDirectChargeFlow($amount + $vat, strtoupper($mem->currency ?? 'GBP'));
                    $platformFee = $memBreakdown['platform_fee'] + $memBreakdown['compliance_fee'] + $memBreakdown['admin_fee'];
                    $stripeFee = $memBreakdown['stripe_fee'];
                    $gross = $mem->total_paid && $mem->total_paid > 0
                        ? (float) $mem->total_paid
                        : $memBreakdown['total_supporter_pays'];
                    $creatorAmount = $amount;

                    FinancialTransaction::updateOrCreate(
                        [
                            'source_type' => \App\Models\MembershipPayment::class,
                            'source_id' => $mem->id,
                        ],
                        [
                            'user_id' => $creator->id,
                            'supporter_id' => $mem->user_id,
                            'type' => 'income',
                            'gross_amount' => $gross,
                            'platform_fee' => $platformFee,
                            'stripe_fee' => $stripeFee,
                            'vat_amount' => $vat,
                            'net_amount' => $creatorAmount,
                            'currency' => strtoupper($mem->currency ?? 'GBP'),
                            'status' => 'completed',
                            'description' => 'Membership: ' . ($mem->membership->level ?? 'Subscription'),
                            'transaction_date' => $mem->created_at,
                        ]
                    );
                } catch (\Throwable $e) {
                    Log::error('Failed to sync MembershipPayment to FinancialTransaction in handlePayment: ' . $e->getMessage(), ['membership_payment_id' => $mem->id]);
                }

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

                $totalAmount = 0;
                if ($mem->user->role == 0) {
                    $totalAmount = $mem->total_paid;
                } else {
                    $totalAmount = $mem->amount;
                }

                return to_route('thank-you', [
                    'username' => $mem->membership->user->username,
                    'type' => 'membership',
                    'item_name' => $mem->membership->level,
                    'amount' => $totalAmount,
                    'currency' => $mem->currency ?? 'GBP',
                    'item_id' => $mem->membership->uuid,
                    'source' => 'membership_payments',
                    'source_id' => $mem->id,
                ])->with('success', "Payment for subscription of membership is success.");
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

    // Page method - returns Inertia view
    public function membershipDashboardPage()
    {
        return inertia('membership/Membership_dashboard');
    }

    // API method - returns JSON data
    public function membershipDashboardData()
    {
        $user = User::find(Auth::id());

        $payments = MembershipPayment::with([
            'membership:uuid,id,user_id,level,price,currency',
            'user:uuid,id,name,username,email,avatar'
        ])
            ->whereHas('membership', function ($q) use ($user) {
                $q->where('user_id', $user->id);
            })
            ->where('status', 'paid')
            ->latest()
            ->get();

        $count = $payments->unique('user_id')->count();
        $per_month = $payments
            ->whereBetween('created_at', [
                now()->startOfMonth(),
                now()->endOfMonth()
            ])
            ->sum('amount');
        $all_time = $payments->sum('amount');

        $membershipStats = $payments
            ->groupBy('membership_id')
            ->map(function ($membershipPayments) {

                $membership = $membershipPayments->first()->membership;

                return [
                    'membership_id' => $membership->id,
                    'membership_uuid' => $membership->uuid,
                    'membership_title' => ucfirst($membership->level ?? 'Membership'),

                    'total_members' => $membershipPayments
                        ->pluck('user_id')
                        ->filter()
                        ->unique()
                        ->count(),

                    'total_revenue' => round(
                        $membershipPayments->sum('amount'),
                        2
                    ),

                    'price' => $membership->price ?? 0,
                ];
            })
            ->values();

        $recentPayments = $payments->map(function ($payment) {
            return [
                'id' => $payment->id,
                'amount' => $payment->amount,
                'currency' => strtoupper($payment->currency ?? $payment->membership->currency ?? 'GBP'),
                'status' => $payment->status,
                'created_at' => $payment->created_at->format('d M Y h:i A'),
                'membership' => [
                    'id' => $payment->membership->id,
                    'title' => ucfirst($payment->membership->level ?? 'Membership'),
                    'price' => $payment->membership->price ?? 0,
                    'type' => $payment->recurring_type ?? 'monthly',
                    'thumbnail' => $payment->membership->perma_link ?? null,
                    'uuid' => $payment->membership->uuid ?? null,
                ],

                'user' => [
                    'id' => $payment->user->id ?? null,
                    'name' => $payment->user->name ?? 'Guest',
                    'username' => $payment->user->username ?? '',
                    'email' => $payment->user->email ?? '',
                    'avatar' => $payment->user->avatar ?? null,
                    'uuid' => $payment->user->uuid ?? null,
                ]
            ];
        });

        return response()->json([
            'status' => true,
            'data' => [
                'members' => $count,
                'per_month' => round($per_month, 2),
                'all_time' => round($all_time, 2),
                'membership_stats' => $membershipStats,
                'payments' => $recentPayments
            ]
        ]);
    }

    // Page method for All Payments
    public function allPaymentsPage()
    {
        return inertia('membership/AllMembershipPayments');
    }

    // Keep this as API method
    public function getAllMembershipPayments()
    {
        $user = User::find(Auth::id());

        $payments = MembershipPayment::with([
            'membership:id,user_id,level,price,currency',
            'user:id,name,username,email,avatar'
        ])
            ->whereHas('membership', function ($q) use ($user) {
                $q->where('user_id', $user->id);
            })
            ->where('status', 'paid')
            ->latest()
            ->get();

        $formattedPayments = $payments->map(function ($payment) {
            return [
                'id' => $payment->id,
                'amount' => $payment->amount,
                'currency' => strtoupper($payment->currency ?? $payment->membership->currency ?? 'GBP'),
                'status' => $payment->status,
                'created_at' => $payment->created_at->format('d M Y h:i A'),
                'membership' => [
                    'title' => ucfirst($payment->membership->level ?? 'Membership'),
                    'price' => $payment->membership->price ?? 0,
                    'type' => $payment->recurring_type ?? 'monthly',
                    'thumbnail' => $payment->membership->perma_link ?? null,
                ],
                'user' => [
                    'name' => $payment->user->name ?? 'Guest',
                    'username' => $payment->user->username ?? '',
                    'email' => $payment->user->email ?? '',
                    'avatar' => $payment->user->avatar ?? null,
                ]
            ];
        });

        $stats = [
            'total_members' => $payments->unique('user_id')->count(),
            'total_earnings' => round($payments->sum('amount'), 2),
            'average_amount' => round($payments->avg('amount') ?? 0, 2)
        ];

        return response()->json([
            'status' => true,
            'payments' => $formattedPayments,
            'stats' => $stats
        ]);
    }


    public function membershipGraph()
    {
        $user = User::where('id', Auth::id())->first();


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

        // This is your Stripe CLI webhook secret for testing your endpoint locally.
        // $endpoint_secret = 'whsec_a5n2XAXrZTXHKcRYKGnYoIvMc9do2u6N';

        // $sig_header = $_SERVER['HTTP_STRIPE_SIGNATURE'];
        // $payload = $request->getContent();
        // $endpoint_secret = env('MEMBER_SUB_WEBHOOK_SECRET');
        $endpoint_secret = env('STRIPE_WEBHOOK_SECRET');
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
            $deliverable = Deliverable::create([
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
            ProcessWishItemDeliverable::dispatch($deliverable);

            // Update Stripe payment intent metadata (same as bills)
            if ($paymentIntentId) {
                try {
                    $stripeMetadataService = app(StripeMetadataService::class);
                    $stripeMetadataService->updateDeliverableMetadata($deliverable, [
                        'membership_processed_at' => now()->toISOString(),
                        'immediate_delivery' => 'true'
                    ]);
                } catch (\Exception $e) {
                    Log::error('MembershipController: Failed to update Stripe metadata', [
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
                Log::error('MembershipController: No membership found for renewal deliverable', [
                    'membership_payment_id' => $membershipPayment->id
                ]);
                return null;
            }

            // For renewals, we don't have a session but we have the subscription info
            $paymentIntentId = null; // Renewals typically don't have payment intent, just subscription invoice

            // Create deliverable entry for renewed membership access
            $deliverable = Deliverable::create([
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
            ProcessWishItemDeliverable::dispatch($deliverable);

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

    public function membershipDetails($uuid)
    {
        return Inertia::render(
            'membership/MembershipDetails',
            [
                'uuid' => $uuid
            ]
        );
    }

    public function getMembershipDetails($uuid)
    {
        $user = Auth::user();

        $membership = Membership::with([
            'payments.user'
        ])
            ->where('uuid', $uuid)
            ->where('user_id', $user->id)
            ->first();

        if (!$membership) {

            return response()->json([
                'status' => false,
                'message' => 'Membership not found'
            ], 404);
        }

        /*
        |--------------------------------------------------------------------------
        | SUPPORTERS
        |--------------------------------------------------------------------------
        */

        $supporters = $membership->payments->where('status', 'paid');

        /*
        |--------------------------------------------------------------------------
        | TOTAL REVENUE
        |--------------------------------------------------------------------------
        */

        $totalRevenue = $supporters->sum('amount');

        /*
        |--------------------------------------------------------------------------
        | UNIQUE SUPPORTERS
        |--------------------------------------------------------------------------
        */

        $totalSupporters = $supporters->pluck('user_id')->unique()->count();

        /*
        |--------------------------------------------------------------------------
        | NEXT MONTH FORECAST
        |--------------------------------------------------------------------------
        */

        $estimatedNextMonth = $supporters->filter(function ($payment) {

            /*
            |--------------------------------------------------------------------------
            | ONLY ACTIVE PAYMENTS
            |--------------------------------------------------------------------------
            */

            if (!in_array($payment->status, ['paid', 'active'])) {
                return false;
            }

            /*
            |--------------------------------------------------------------------------
            | ONLY RECURRING PAYMENTS
            |--------------------------------------------------------------------------
            */

            if (!in_array($payment->recurring_type, ['monthly', 'yearly'])) {
                return false;
            }

            /*
            |--------------------------------------------------------------------------
            | CANCELED MEMBERSHIPS
            |--------------------------------------------------------------------------
            */

            if ($payment->end == 1) {
                return false;
            }

            return true;
        })->sum('amount');

        return response()->json([
            'status' => true,
            'membership' => $membership,
            'stats' => [
                'supporters' => $totalSupporters,
                'revenue' => round($totalRevenue, 2),
                'estimated_next_month' => round($estimatedNextMonth, 2),
            ],
            'supporters_list' => $supporters->values(),
        ]);
    }

    public function cancelSubscription(Request $request)
    {
        try {

            /*
            |--------------------------------------------------------------------------
            | VALIDATION
            |--------------------------------------------------------------------------
            */

            $request->validate([
                'payment_id' =>
                'required|exists:membership_payments,id',
            ]);

            /*
            |--------------------------------------------------------------------------
            | GET PAYMENT
            |--------------------------------------------------------------------------
            */

            $payment = MembershipPayment::findOrFail(
                $request->payment_id
            );

            /*
            |--------------------------------------------------------------------------
            | SECURITY
            |--------------------------------------------------------------------------
            */

            if ($payment->user_id != Auth::id()) {
                return response()->json([
                    'status' => false,
                    'message' => 'Unauthorized access'
                ], 403);
            }

            /*
            |--------------------------------------------------------------------------
            | ALREADY CANCELED
            |--------------------------------------------------------------------------
            */

            if ($payment->end == 1) {
                return response()->json([
                    'status' => false,
                    'message' => 'Already canceled'
                ]);
            }

            /*
            |--------------------------------------------------------------------------
            | STRIPE CONFIG
            |--------------------------------------------------------------------------
            */

            Stripe::setApiKey(
                config('services.stripe.secret')
            );

            /*
            |--------------------------------------------------------------------------
            | STRIPE CANCEL AT PERIOD END
            |--------------------------------------------------------------------------
            */

            if (!empty($payment->stripe_id)) {
                $subscription =
                    Subscription::retrieve(
                        $payment->stripe_id
                    );

                Log::info('MembershipController: Retrieved subscription for cancellation', [
                    'subscription_id' => $subscription->id,
                    'current_status' => $subscription->status,
                    'cancel_at_period_end' => $subscription->cancel_at_period_end
                ]);
                $subscription->cancel_at_period_end = true;
                $subscription->save();
            }

            /*
            |--------------------------------------------------------------------------
            | UPDATE DB
            |--------------------------------------------------------------------------
            */

            $payment->update([
                'end' => 1,
                'upcoming_payment' => null,
            ]);

            /*
            |--------------------------------------------------------------------------
            | RESPONSE
            |--------------------------------------------------------------------------
            */

            return response()->json([
                'status' => true,
                'message' =>
                'Membership scheduled for cancellation successfully.'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'status' => false,
                'message' => $e->getMessage(),
            ], 500);
        }
    }
}
