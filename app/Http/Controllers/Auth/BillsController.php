<?php

namespace App\Http\Controllers\Auth;

use App\Helpers;
use App\Http\Controllers\Controller;
use App\Jobs\BillPayMail;
use App\Jobs\BillPayToUser;
use App\Jobs\BillContentDeliveryMail;
use App\Jobs\ProcessWishItemDeliverable;
use App\Jobs\NotificationSave;
use App\Jobs\SendRenewMail;
use App\Models\BillPayment;
use App\Models\Bills;
use App\Models\ConnectedAccountCustomer;
use App\Models\Currency;
use App\Models\FinancialTransaction;
use App\Models\Deliverable;
use App\Models\Logs;
use App\Models\MembershipPayment;
use App\Models\Payment;
use App\Models\User;
use App\Models\UserPayment;
use App\StripeControl;
use App\Services\StripeMetadataService;
use Carbon\Carbon;
use App\Services\UserProfileService;
use App\Notifications\SubscriptionBlockedNotification;
use App\Services\CreatorSubscriptionService;
use Exception;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Stripe\StripeClient;
use Stripe\Webhook;
use Stripe\Exception\SignatureVerificationException;
use App\Traits\RiskEnforcement;
use Stripe\Stripe;
use Stripe\Subscription;

class BillsController extends Controller
{
    use RiskEnforcement;
    public function billSave(Request $request)
    {
        // 🔴 DEBUGGING: Log that method was called
        Log::info('🎯 billSave method called', [
            'user_id' => Auth::id(),
            'request_data' => $request->all()
        ]);

        $validator = Validator::make($request->all(), [
            "name" => ["required", "string"],
            "price" => ["required", "numeric", "min:0"],
            'period' => ['required', 'string']
        ]);

        if ($validator->fails()) {
            return response()->json([
                "status" => false,
                "msg" => "Validation failed",
                "errors" => $validator->errors(),
            ]);
        }

        $user = User::where('id', Auth::id())->first();

        // 🔴 DEBUGGING: Log user found
        Log::info('👤 User found', ['user_id' => $user->id ?? null]);

        $media = $request->thumbnail;
        $price = $request->price;
        $currency = $user->default_currency ?? 'gbp';

        // Calculate VAT if applicable (Client Rule: Add VAT before other fees)
        $vatPercent = $user->vat_amount_percentage ?? 0;
        $vatAmount = $price * $vatPercent / 100;
        $priceWithVat = $price + $vatAmount;

        $metrics = app(\App\Services\Risk\RiskService::class)->recalculateMetrics((string) $user->uuid);
        $reserveRate = $metrics->reserve_percent ?? 0;

        // Use new gross-up flow for consistent fee calculation
        $breakdown = Helpers::calculateStripeDirectChargeFlow($priceWithVat, $currency, $reserveRate);

        $createPriceId = $breakdown['total_supporter_pays'];
        $taxAmount = $breakdown['total_fees'];

        $bill = new Bills();
        $bill->user_id = Auth::id();
        $bill->name = $request->name;
        $bill->currency = $currency;
        $bill->price = $price;
        $bill->tax_amount = $taxAmount;
        $bill->thumbnail = !empty($media) ? $media : null;
        $bill->period = $request->period;
        $bill->status = 1;

        $bill->save();

        // Get currency metadata to handle zero-decimal currencies properly
        $currencyModel = Currency::where('ISO', strtoupper($currency))->first();
        $multiplier = ($currencyModel && $currencyModel->ISOdigits == 0) ? 1 : 100;

        $productPayload = [
            "name"  => "Bill: {$bill->name} (Total value including all fees)",
            "images" => [$bill->perma_link],
            "default_price_data"    => [
                "currency"  => $currency,
                "unit_amount_decimal"   => round($createPriceId * $multiplier, 2, PHP_ROUND_HALF_UP),
                'recurring' => [
                    'interval'  =>  StripeControl::$periods[$bill->period],
                    'interval_count'    =>  1
                ]
            ],
            "url"   =>  env('APP_URL') . '/' . $user->username . '/bill',
            'metadata' => [
                'bill_name' => $bill->name,
                'creator_id' => $user->id,
                'creator_net_amount' => (string)($breakdown['net_to_creator'] * $multiplier),
                'total_charge_amount' => (string)($createPriceId * $multiplier),
            ]
        ];

        try {
            $product = StripeControl::createProduct($productPayload, $user->account_id);
            $bill->product_id = $product->id;
            $bill->price_id = $product->default_price;
            $bill->save();

            // Clear user caches
            app(UserProfileService::class)->clearUserCaches($user->username, $user->id);

            return response()->json([
                'status' => true,
                'msg' => "Bill added successfully, your upload will be approved shortly.",
                'bill_id' => $bill->id  // Added for debugging
            ]);
        } catch (Exception $e) {

            $bill->delete();

            return response()->json([
                'status' => false,
                'msg' => "Stripe Error: " . $e->getMessage()
            ]);
        }
    }

    public function billEdit(Request $request, $id)
    {
        Log::info("from start request->period: $request->period");

        $validator = Validator::make($request->all(), [
            "name" => ["required", "string"],
            "price" => ["required", "numeric", "min:0"],
        ]);

        if ($validator->fails()) {
            return response()->json([
                "status" => false,
                "msg" => "Validation failed",
                "errors" => $validator->errors(),
            ]);
        }

        $user = User::where('id', Auth::id())->first();
        $bill = Bills::where('uuid', $id)->first();
        $old_periods = $bill->period;

        if (!$user || !$bill) {
            return response()->json([
                'status' => false,
                'msg' => 'User or Bill not found'
            ]);
        }

        $old_price = $bill->price;
        $old_price_id = $bill->price_id;

        $media = $request->thumbnail;
        $price = $request->price;
        $currency = $user->default_currency ?? 'gbp';

        // Calculate VAT if applicable (Client Rule: Add VAT before other fees)
        $vatPercent = $user->vat_amount_percentage ?? 0;
        $vatAmount = $price * $vatPercent / 100;
        $priceWithVat = $price + $vatAmount;

        $metrics = app(\App\Services\Risk\RiskService::class)->recalculateMetrics((string) $user->uuid);
        $reserveRate = $metrics->reserve_percent ?? 0;

        // Use new gross-up flow for consistent fee calculation
        $breakdown = Helpers::calculateStripeDirectChargeFlow($priceWithVat, $currency, $reserveRate);

        $taxamount = $breakdown['application_fee'];
        $totalAmount = $breakdown['total_supporter_pays'];

        $bill->fill([
            'user_id' => $user->id,
            'name' => $request->name,
            'currency' => $currency,
            'price' => $price,
            'tax_amount' => $taxamount,
            'thumbnail' => $media ?? null,
            'period' => $request->period,
        ])->save();

        try {
            Log::info("starting from try request->period: $request->period");

            if (!$bill->product_id) {
                return response()->json([
                    'status' => false,
                    'msg' => "Missing product ID on bill."
                ]);
            }

            Log::info("after if condition in try request->period: $request->period");
            Log::info("old_period: $old_periods");
            $stripe = new StripeClient(env('STRIPE_SECRET_KEY'));

            // Check if product exists in Stripe
            $stripeProduct = null;
            try {
                $stripeProduct = $stripe->products->retrieve($bill->product_id, [], ['stripe_account' => $user->account_id]);
            } catch (Exception $e) {
                Log::warning("Stripe Product not found for bill {$bill->uuid}, will attempt to recreate. Error: " . $e->getMessage());
            }

            // Get currency metadata to handle zero-decimal currencies properly
            $currencyModel = Currency::where('ISO', strtoupper($user->default_currency))->first();
            $multiplier = ($currencyModel && $currencyModel->ISOdigits == 0) ? 1 : 100;

            if (!$stripeProduct) {
                // Recreate the product if it's missing from Stripe
                $productPayload = [
                    "name"  => "Bill: {$bill->name} (Total value including all fees)",
                    "images" => [$bill->perma_link],
                    "default_price_data"    => [
                        "currency"  => $currency,
                        "unit_amount_decimal"   => round($totalAmount * $multiplier, 2, PHP_ROUND_HALF_UP),
                        'recurring' => [
                            'interval'  =>  StripeControl::$periods[$request->period],
                            'interval_count'    =>  1
                        ]
                    ],
                    "url"   =>  env('APP_URL') . '/' . $user->username,
                    'metadata' => [
                        'bill_name' => $bill->name,
                        'creator_id' => $user->id,
                        'creator_net_amount' => (string)($breakdown['net_to_creator'] * 100),
                        'total_charge_amount' => (string)($totalAmount * 100),
                    ]
                ];

                $stripeProduct = StripeControl::createProduct($productPayload, $user->account_id);

                $bill->update([
                    'product_id' => $stripeProduct->id,
                    'price_id' => $stripeProduct->default_price,
                    'approved' => 0,
                ]);

                Log::info("Recreated Stripe Product for bill {$bill->uuid}: " . $stripeProduct->id);
            } else if ($old_price != $price || $old_periods != $request->period) {
                Log::info("request->period: $request->period");

                $newPrice = $stripe->prices->create([
                    'unit_amount_decimal' => (string) round($totalAmount * $multiplier),
                    'currency' => $user->default_currency,
                    'product' => $bill->product_id,
                    'recurring' => [
                        'interval' => StripeControl::$periods[$request->period],
                        'interval_count' => 1
                    ]
                ], [
                    'stripe_account' => $user->account_id
                ]);
                Log::info(json_encode($newPrice));

                $product = $stripe->products->update($bill->product_id, [
                    'name' => "Bill: {$bill->name} (Total value including all fees)",
                    'images' => [$bill->perma_link],
                    'default_price' => $newPrice->id,
                    'url' => env('APP_URL') . '/' . $user->username,
                    'metadata' => [
                        'bill_name' => $bill->name,
                        'creator_id' => $user->id,
                        'creator_net_amount' => (string)($breakdown['net_to_creator'] * 100),
                        'total_charge_amount' => (string)($totalAmount * 100),
                    ]
                ], [
                    'stripe_account' => $user->account_id
                ]);

                $stripe->prices->update($old_price_id, [
                    'active' => false
                ], [
                    'stripe_account' => $user->account_id
                ]);

                $bill->update([
                    'price_id' => $newPrice->id,
                    'product_id' => $product->id,
                    'approved' => 0,
                ]);
            } else {
                // Only name or metadata might have changed
                $stripe->products->update($bill->product_id, [
                    'name' => "Bill: {$bill->name} (Total value including all fees)",
                    'images' => [$bill->perma_link],
                    'metadata' => [
                        'bill_name' => $bill->name,
                        'creator_id' => $user->id,
                        'creator_net_amount' => (string)($breakdown['net_to_creator'] * 100),
                        'total_charge_amount' => (string)($totalAmount * 100),
                    ]
                ], [
                    'stripe_account' => $user->account_id
                ]);
            }

            Logs::where('edited_bill_id', $bill->id)
                ->where('status', 'pending')
                ->update(['status' => 'updated']);

            // Clear user caches
            app(UserProfileService::class)->clearUserCaches($user->username, $user->id);
        } catch (Exception $e) {
            Log::error("Stripe Error during bill edit: " . $e->getMessage());

            return response()->json([
                'status' => false,
                'msg' => "Stripe Error: " . $e->getMessage()
            ]);
        }

        Log::info("to end request->period: $request->period");


        return response()->json([
            'status' => true,
            'msg' => "Bill edited successfully."
        ]);
    }

    public function removeBill($uuid)
    {
        $bill = Bills::whereUuid($uuid)->first();

        if (!empty($bill)) {
            BillPayment::where('bills_id', $bill->id)->delete();
            $account_id = $bill->user->account_id;

            // Only attempt to delete Stripe product if product_id exists
            if (!empty($bill->product_id)) {
                try {
                    $stripeProduct = StripeControl::getProduct($bill->product_id, $account_id);
                    if ($stripeProduct) {
                        // Delete the product and prices from Stripe
                        StripeControl::deleteProductAndPrices($stripeProduct->id, $account_id);
                    }
                } catch (\Exception $e) {
                    // Log the error but continue with bill deletion
                    Log::error('Failed to delete Stripe product: ' . $e->getMessage(), [
                        'bill_uuid' => $uuid,
                        'product_id' => $bill->product_id
                    ]);
                }
            }

            $bill->delete();

            // Clear user caches
            $user = $bill->user;
            app(UserProfileService::class)->clearUserCaches($user->username, $user->id);

            return response()->json([
                'status' => true,
                'msg' => "Bill removed successfully."
            ]);
        }
        return response()->json([
            'status' => false,
            'msg' => "Bill not found."
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
    public function buyBill(Request $request, $uuid, $reccure = 'continue')
    {
        $checkGifterStatus = Helpers::checkGifterCardVerificationStatus();
        if ($checkGifterStatus === true) {
            $user = Auth::user();
            return to_route('user.show', ['username' => $user->username])
                ->with("error", "⚠️ Please complete your card verification payment and wait for admin approval before making further payments.");
        }
        DB::beginTransaction();
        $bill = Bills::with('user')->whereUuid($uuid)->first();
        // if (!in_array($bill->user->subscription_status, [1, 2])) {
        //     return redirect()->back()->with('error', "Currently creator has paused gift payments. Please again later when gift payments are active.");
        // }
        if (!$bill) {
            DB::rollBack();
            return redirect()->back()->with('error', 'Bill not found!');
        }

        if ($bill->is_suspended) {
            DB::rollBack();
            return redirect()->back()->with('error', 'This bill is currently suspended and cannot accept payments.');
        }

        if (!$bill->user) {
            DB::rollBack();
            return redirect()->back()->with('error', 'Creator account not found or deactivated.');
        }

        // Check if creator has card_payments capability
        if (!StripeControl::hasCardPaymentsCapability($bill->user->account_id)) {
            DB::rollBack();
            $stripeCheck = ['eligible' => false, 'status' => 'stripe_disabled'];
            return redirect()->back()->with('error', app(\App\Services\CreatorAvailabilityMessageService::class)->supporterMessage(null, null, $stripeCheck));
        }

        // NEW: Check creator subscription eligibility first
        $subscriptionCheck = app(CreatorSubscriptionService::class)->validateCreatorSubscription($bill->user);

        if (!$subscriptionCheck['eligible']) {
            DB::rollBack(); // Rollback the transaction before early return

            // Send notification to creator about blocked payment
            $bill->user->notify(new SubscriptionBlockedNotification($subscriptionCheck, $bill->price));

            // Log the blocked payment for subscription issues
            Log::warning('Bill payment blocked due to subscription issue', [
                'creator_id' => $bill->user->id,
                'creator_username' => $bill->user->username,
                'bill_id' => $bill->id,
                'bill_price' => $bill->price,
                'subscription_status' => $subscriptionCheck['status'],
                'subscription_status_code' => $subscriptionCheck['subscription_status'] ?? 'unknown'
            ]);

            // Return user-friendly error to fan
            return redirect()->back()->with(
                'error',
                app(\App\Services\CreatorAvailabilityMessageService::class)->supporterMessage($subscriptionCheck, null)
            );
        }

        // NEW: Skip creator activity eligibility for bill payments
        // Optional: Log exemption for analytics
        Log::info('Bill payment allowed - activity check exempted for bills', [
            'creator_id' => $bill->user->id,
            'creator_username' => $bill->user->username,
            'bill_id' => $bill->id,
        ]);

        $price = $bill->price;
        // Client Requirement: Always charge in Creator's Currency
        $chargeCurrency = $bill->currency;
        // Supporter's display currency for estimation
        $displayCurrency = strtolower($request->cookie("currency", "GBP"));

        // Calculate VAT in Creator's Currency
        $vatPercent = $bill->user->vat_amount_percentage ?? 0;
        $priceWithVat = $price + ($price * $vatPercent / 100);

        $metrics = app(\App\Services\Risk\RiskService::class)->recalculateMetrics((string) $bill->user->uuid);
        $reserveRate = $metrics->reserve_percent ?? 0;

        // Gross-up calculation in Creator's Currency (No FX conversion)
        $breakdown = Helpers::calculateStripeDirectChargeFlow($priceWithVat, $chargeCurrency, $reserveRate);

        $finalTotalAmount = $breakdown['total_supporter_pays'];
        $applicationFeeAmount = $breakdown['application_fee'];
        $creatorNet = $breakdown['net_to_creator'];

        $totalTax = $applicationFeeAmount;
        // $vatAmount variable here is used for vat_tax_amount in DB which stores compliance+admin fees
        $feesAsVat = $breakdown['compliance_fee'] + $breakdown['admin_fee'];

        // Calculate actual VAT amount for display
        $actualVatAmount = $price * $vatPercent / 100;

        $checkGifterStatus = Helpers::checkGifterCardVerificationStatus();
        if ($checkGifterStatus === true) {
            $user = Auth::user();
            return to_route('user.show', ['username' => $user->username])
                ->with("error", "⚠️ Please complete your card verification payment and wait for admin approval before making further payments.");
        }

        $user = Auth::user();

        $user = Auth::user();
        if ($user) {
            if ($bill->user_id === $user->id) return redirect()->back()->with('error', "You can't buy your own bill!");
        }

        if ($request->isMethod("POST")) {
            // Unified Risk Enforcement
            $riskData = $this->enforceRiskChecks(
                $request,
                $bill->user,
                $finalTotalAmount,
                $chargeCurrency,
                'bill_checkout',
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
                return redirect()->back()->with('error', $msgErr);
            }

            $sub = BillPayment::create([
                'bills_id'       => $bill->id,
                'user_id'        => $user->id ?? null,
                'guest_name'     => $request->name,
                'guest_email'    => $request->email,
                'currency'       => $chargeCurrency, // Force Creator's Currency
                'amount'         => $bill->price,
                'total_paid'     => $finalTotalAmount,
                'tax'            => $breakdown['total_fees'],
                'vat_tax_amount' => $bill->price * $vatPercent / 100, // Store actual VAT
                'recurring_for'  => $reccure ?? null,
                'recurring_type' => $bill->period,
                'message'        => $request->message ?? null,
                'anonymous'      => $request->anonymous ?? 0,
                'creator_currency' => $bill->currency,
                'charge_currency' => $chargeCurrency,
                'display_currency' => $displayCurrency,
            ]);

            // Apply digital waiver confirmation
            Helpers::applyDigitalWaiver($sub, (bool) $request->digital_waiver);
            $sub->save();

            try {
                $connectedAccountId = $bill->user->account_id;

                $storeCustomer = ConnectedAccountCustomer::where([
                    ['user_id', $user->id ?? null],
                    ['creator_id', $bill->user->id],
                    ['connected_account_id', $connectedAccountId],
                    ['currency', $chargeCurrency],
                ])->first();

                $existingPriceEntry = ConnectedAccountCustomer::where([
                    ['user_id', $user->id ?? null],
                    ['creator_id', $bill->user->id],
                    ['connected_account_id', $connectedAccountId],
                    ['product_id', $bill->product_id],
                    ['currency', $chargeCurrency],
                ])->whereNotNull('price_id')->first();

                $customer_id = $storeCustomer ? $storeCustomer->stripe_customer_id : null;

                $existingSubscription = null;
                if (isset($storeCustomer->stripe_customer_id)) {
                    $existingSubscription = StripeControl::getActiveSubscriptionByCustomer(
                        $storeCustomer->stripe_customer_id,
                        $storeCustomer->connected_account_id
                    );
                }

                DB::commit();

                if ($existingSubscription && $existingSubscription->currency !== $chargeCurrency) {
                    $newCustomer = StripeControl::createCustomer([
                        'email' => $user->email ?? $request->email,
                        'name' => $user->name ?? $request->name,
                    ], $connectedAccountId);

                    $customer_id = $newCustomer->id;

                    $storeCustomer = ConnectedAccountCustomer::create([
                        'user_id' => $user->id ?? null,
                        'creator_id' => $bill->user->id,
                        'connected_account_id' => $connectedAccountId,
                        'stripe_customer_id' => $customer_id ?? null,
                        'product_type' => 'bill',
                        'product_id' => $bill->product_id,
                        'currency' => $chargeCurrency,
                    ]);
                }

                if (!$customer_id) {
                    $newCustomer = StripeControl::createCustomer([
                        'email' => $user->email ?? $request->email,
                        'name' => $user->name ?? $request->name,
                    ], $connectedAccountId);

                    $customer_id = $newCustomer->id;
                }

                $priceId = $existingPriceEntry->price_id ?? null;

                // Get currency metadata to handle zero-decimal currencies properly
                $currencyModel = Currency::where('ISO', strtoupper($chargeCurrency))->first();
                $multiplier = ($currencyModel && $currencyModel->ISOdigits == 0) ? 1 : 100;

                if (!$priceId) {

                    $priceData = [
                        'unit_amount' => round($finalTotalAmount * $multiplier),
                        'currency' => $chargeCurrency,
                        'product' => $bill->product_id,
                        'recurring' => [
                            'interval' => StripeControl::$periods[$bill->period],
                            'interval_count' => 1,
                        ],
                    ];

                    $stripePrice = StripeControl::createPrice($priceData, $connectedAccountId);
                    if (empty($stripePrice->id)) {
                        throw new Exception("Failed to create Stripe price.");
                    }

                    $priceId = $stripePrice->id;
                }

                if (!$storeCustomer) {
                    ConnectedAccountCustomer::create([
                        'user_id' => $user->id ?? null,
                        'creator_id' => $bill->user->id,
                        'connected_account_id' => $connectedAccountId,
                        'stripe_customer_id' => $customer_id ?? null,
                        'product_type' => 'bill',
                        'product_id' => $bill->product_id,
                        'price_id' => $priceId,
                        'currency' => $chargeCurrency,
                    ]);
                }

                // Use destination charges pattern like cart/tip payments - create line items that sum to total charge
                $lineItems = [
                    [
                        'quantity' => 1,
                        'price_data' => [
                            'currency' => $chargeCurrency,
                            'product_data' => [
                                'name' => "Total value of item including all fees",
                                'description' => "Recurring Bill from {$bill->user->name}",
                            ],
                            'unit_amount' => round($finalTotalAmount * $multiplier),
                            'recurring' => [
                                'interval' => StripeControl::$periods[$bill->period],
                                'interval_count' => 1,
                            ],
                        ]
                    ]
                ];

                $payload = [
                    'mode' => 'subscription',
                    'payment_method_types' => ['card'],
                    'line_items' => $lineItems, // Total amount determined by line items
                    'subscription_data' => [
                        'description' => "Recurring Bill for {$bill->user->username} (Total value including all fees)",
                        'metadata' => Helpers::buildStripeMetadata('bill', $sub, [
                            'bill_id' => (string) $bill->id,
                            'recurring_for' => $reccure,
                            'item_amount' => (string) round($bill->price * $multiplier),
                            'creator_net_amount' => (string) ($creatorNet * $multiplier),
                            'application_fee_amount' => (string) ($applicationFeeAmount * $multiplier),
                            'total_charge_amount' => (string) ($finalTotalAmount * $multiplier),
                            'payment_type' => 'Bill Payment - Direct Charges',
                            'anonymous' => (string) ($sub->anonymous ?? 0),
                            'creator_currency' => $bill->currency,
                            'display_currency' => $displayCurrency,
                            'vat_rate' => (string) $vatPercent,
                        ]),
                        'application_fee_percent' => round(($applicationFeeAmount / $finalTotalAmount) * 100, 2),
                    ],
                    'customer' => $customer_id,
                    'success_url' => route('bill.handle', ['uuid' => $sub->uuid, 'status' => "success"]),
                    'cancel_url' => route('bill.handle', ['uuid' => $sub->uuid, 'status' => "cancel"]),
                ];

                // Note: For mode: subscription, Stripe uses the customer_email or the email of the customer object for receipts.
                // We are providing customer_email here.

                // Risk Engine: Force 3DS if Step-Up required
                if (in_array('FORCE_3DS', $riskData['reason_codes'] ?? [])) {
                    $payload['payment_method_options'] = [
                        'card' => [
                            'request_three_d_secure' => 'any',
                        ],
                    ];
                }

                $session = StripeControl::createCheckoutSession($payload, $connectedAccountId, $force3DS, $bill->user->username); // Create session on CONNECTED account

                $sub->update([
                    'session_id' => $session->id,
                    // 'product_id' => $bill->product_id,
                    // 'price_id' => $priceId,
                    // 'customer_id' => $customer_id ?? null,
                ]);

                try {
                    Payment::firstOrCreate(
                        ['stripe_session_id' => $session->id],
                        [
                            'creator_id' => $bill->user->uuid,
                            'risk_identity_id' => $riskData['risk_identity_id'] ?? null,
                            'amount' => app(\App\Services\Risk\MoneyNormalizer::class)->toGbpMinor((int) round($finalTotalAmount * $multiplier), strtoupper($chargeCurrency)),
                            'currency' => 'gbp',
                            'stripe_payment_intent_id' => $session->payment_intent ?? null,
                            'status' => 'initiated',
                            'reason_codes' => $riskData['reason_codes'] ?? [],
                        ]
                    );
                } catch (\Exception $e) {
                    Log::warning('Risk Ledger: Failed to record bill payment', [
                        'session_id' => $session->id,
                        'error' => $e->getMessage(),
                    ]);
                }

                return Inertia::location($session->url);
            } catch (Exception $e) {
                DB::rollBack();
                Log::error("Stripe checkout session failed: " . $e->getMessage());
                return back()->with('error', $e->getMessage());
            }
        }

        $card_capabilities = StripeControl::hasCardPaymentsCapability($bill->user->account_id);

        return Inertia::render('bills/BillCheckout', [
            'bill' => $bill,
            'vat_amount' => $actualVatAmount,
            'reccure' => $reccure,
            'card_capabilities' => $card_capabilities,
            'creator_currency' => $bill->currency, // Pass creator currency to frontend
            'display_currency' => $displayCurrency, // Pass display currency to frontend
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
        $bill_pay = BillPayment::with('bill')->whereUuid($uuid)->first();


        if (!$bill_pay) {
            return to_route('home')->with("error", 'Insufficient data!');
        }

        if ($bill_pay->status !== 'initiated') {
            return to_route('user.show', ['username' => $bill_pay->bill->user->username])->with("success", 'Subscription already processed!');
        }

        try {

            // Update GMV for creator
            Helpers::addGmv($bill_pay->bill->user_id, (float) $bill_pay->amount, $bill_pay->bill->user->default_currency);

            // Direct Charges: session is created on connected account
            $session = StripeControl::getCheckoutSession($bill_pay->session_id, $bill_pay->bill->user->account_id);
            $bill_pay->status = $session->payment_status;

            if ($session->payment_status === 'paid') {
                $bill_pay->stripe_id = $session->subscription;

                $current = Carbon::now();
                switch ($bill_pay->recurring_type) {
                    case 'monthly':
                        $current->addMonth();
                        break;
                    case 'weekly':
                        $current->addWeek();
                        break;
                    case 'yearly':
                        $current->addYear();
                        break;
                }
                $bill_pay->upcoming_payment = $current;

                $symbol = Currency::where('iso', strtoupper($bill_pay->currency))->first();

                $vatAmountPercentage = $bill_pay->vat_tax_amount ?? 0;
                $amountWithVat = $symbol->symbol . ($bill_pay->amount + $vatAmountPercentage);

                $multiplier = Helpers::isZeroDecimalCurrency($session->currency) ? 1 : 100;
                $totalPaidAmount = $bill_pay->total_paid && $bill_pay->total_paid > 0 ? $bill_pay->total_paid : (float) ($session->amount_total / $multiplier);
                $amountWithCurr = ($symbol->symbol ?? '£') . number_format($totalPaidAmount, 2);

                /**************************BILL**PWA**START****************************************************/
                // below is BILL pwa for fans
                $CreatorName = ucfirst($bill_pay->bill->user->name) ?? 'A Creator';
                $title = "🧾 Bill Paid!";
                $content = "You’ve successfully paid your bill to $CreatorName for {$amountWithCurr}.";
                $email = $bill_pay->guest_email;

                Helpers::sendNotification($title, $content, $email);

                // below is BILL pwa for creator
                $FanName = ucfirst($bill_pay->user->name ?? $bill_pay->guest_name) ?? 'A Fan';
                $title = "💰 Bill Payment Received!";
                $content = "$FanName has paid their bill. Check your earnings!.";
                $email = $bill_pay->bill->user->email;

                Helpers::sendNotification($title, $content, $email);
                /**************************BILL**PWA**ENDS****************************************************/

                // Create deliverable entry for bill payment (like wish subscriptions)
                $this->createBillDeliverable($bill_pay, $session);

                // Calculate creator net amount
                $breakdown = Helpers::calculateStripeDirectChargeFlow($bill_pay->amount + $bill_pay->vat_tax_amount, $bill_pay->currency);
                $creatorNetAmount = ($symbol->symbol ?? '£') . number_format($breakdown['net_to_creator'], 2);

                // Dispatch mail jobs
                BillPayMail::dispatch($bill_pay, $creatorNetAmount);
                BillPayToUser::dispatch($bill_pay, $amountWithCurr, $bill_pay->bill->user->name);

                // Dispatch content delivery email if bill has content file
                if (!empty($bill_pay->bill->content_file)) {
                    BillContentDeliveryMail::dispatch($bill_pay, $symbol->symbol);
                    Log::info('BillsController: Content delivery email dispatched for bill payment', [
                        'bill_payment_id' => $bill_pay->id,
                        'bill_id' => $bill_pay->bill->id,
                        'has_content_file' => !empty($bill_pay->bill->content_file)
                    ]);
                }

                // Notification setup
                $username = $bill_pay->anonymous ? "Anonymous user" : ($bill_pay->guest_name ?? "Anonymous user");
                $message = "$username just subscribed to your bill {$bill_pay->bill->name}";
                NotificationSave::dispatch($message, $bill_pay->bill->user, $bill_pay->user ?? null, 'Bill');

                $bill_pay->save();

                $userPayment = new UserPayment();
                $userPayment->from_user_id = $bill_pay->user_id ?? null;
                $userPayment->to_user_id = $bill_pay->bill->user_id;
                $userPayment->product_type = 'bill';
                $userPayment->amount = $bill_pay->amount;

                // Ensure total_paid is updated in BillPayment if missing
                if (!$bill_pay->total_paid || $bill_pay->total_paid <= 0) {
                    $multiplier = Helpers::isZeroDecimalCurrency($session->currency) ? 1 : 100;
                    $bill_pay->total_paid = (float) ($session->amount_total / $multiplier);
                    $bill_pay->save();
                }

                $userPayment->total_paid = $bill_pay->total_paid;
                $userPayment->currency = $bill_pay->currency;
                $userPayment->payment_method = 'stripe';
                $userPayment->payment_details = json_encode($session, true);
                $userPayment->paid_at = Carbon::now();
                $userPayment->status = $session->payment_status;
                $userPayment->save();

                // Immediately sync to FinancialTransaction so earnings dashboard and support history shows up-to-date
                try {
                    $creator = $bill_pay->bill->user;
                    $amount = (float) $bill_pay->amount;
                    $vat = (float) ($bill_pay->vat_tax_amount ?? 0);
                    if ($vat <= 0 && $creator && $creator->vat_amount_percentage > 0) {
                        $vat = round(($amount * (float) $creator->vat_amount_percentage) / 100, 2, PHP_ROUND_HALF_UP);
                    }
                    // Use actual fee breakdown from the gross-up formula
                    $billBreakdown = \App\Helpers::calculateStripeDirectChargeFlow($amount + $vat, strtoupper($bill_pay->currency ?? 'GBP'));
                    $platformFee = $billBreakdown['platform_fee'] + $billBreakdown['compliance_fee'] + $billBreakdown['admin_fee'];
                    $stripeFee = $billBreakdown['stripe_fee'];
                    $gross = $bill_pay->total_paid && $bill_pay->total_paid > 0
                        ? (float) $bill_pay->total_paid
                        : $billBreakdown['total_supporter_pays'];
                    $creatorAmount = $amount;

                    FinancialTransaction::updateOrCreate(
                        [
                            'source_type' => \App\Models\BillPayment::class,
                            'source_id' => $bill_pay->id,
                        ],
                        [
                            'user_id' => $creator->id,
                            'supporter_id' => $bill_pay->user_id,
                            'type' => 'income',
                            'gross_amount' => $gross,
                            'platform_fee' => $platformFee,
                            'stripe_fee' => $stripeFee,
                            'vat_amount' => $vat,
                            'net_amount' => $creatorAmount,
                            'currency' => strtoupper($bill_pay->currency ?? 'GBP'),
                            'status' => 'completed',
                            'description' => 'Bill Payment: ' . ($bill_pay->bill->name ?? 'Bill'),
                            'transaction_date' => $bill_pay->created_at,
                        ]
                    );
                } catch (\Throwable $e) {
                    Log::error('Failed to sync BillPayment to FinancialTransaction in handlePayment: ' . $e->getMessage(), ['bill_payment_id' => $bill_pay->id]);
                }
                $totalAmount = 0;
                if ($bill_pay->user->role == 0) {
                    $totalAmount = $bill_pay->total_paid;
                } else {
                    $totalAmount = $bill_pay->amount;
                }


                return to_route('thank-you', [
                    'username' => $bill_pay->bill->user->username,
                    'type' => 'bill',
                    'item_name' => $bill_pay->bill->name,
                    'amount' => $totalAmount,
                    'currency' => $bill_pay->currency ?? 'GBP',
                    'item_id' => $bill_pay->bill->uuid
                ])->with('success', "Payment for subscription of bill is successful.");
            }

            $bill_pay->save();

            return to_route('user.show', ['username' => $bill_pay->bill->user->username])->with('warning', "Bill is in {$session->payment_status} status.");
        } catch (Exception $e) {
            return to_route('user.show', ['username' => $bill_pay->bill->user->username])->with('error', $e->getMessage());
        }
    }

    /**
     * Create deliverable entry for bill payment (like wish subscriptions)
     */
    private function createBillDeliverable($billPayment, $session)
    {
        try {
            $bill = $billPayment->bill;

            $metrics = app(\App\Services\Risk\RiskService::class)->recalculateMetrics((string) $bill->user->uuid);
            $reserveRate = $metrics->reserve_percent ?? 0;

            // Use consistent fee calculation for creator net amount
            $breakdown = Helpers::calculateStripeDirectChargeFlow($billPayment->amount, $billPayment->currency, $reserveRate);
            $creatorNet = $breakdown['net_to_creator'];

            // Get payment intent ID from Stripe session if available
            $paymentIntentId = null;
            if ($session && isset($session->id)) {
                try {
                    $stripe = new StripeClient(env('STRIPE_SECRET_KEY'));
                    $retrievedSession = $stripe->checkout->sessions->retrieve($session->id);
                    $paymentIntentId = $retrievedSession->payment_intent ?? null;
                    Log::info('BillsController: Retrieved payment intent from session', [
                        'session_id' => $session->id,
                        'payment_intent_id' => $paymentIntentId
                    ]);
                } catch (Exception $e) {
                    Log::warning('BillsController: Failed to retrieve payment intent from session', [
                        'session_id' => $session->id ?? 'unknown',
                        'error' => $e->getMessage()
                    ]);
                }
            }

            // Create deliverable entry for tracking (similar to wish subscriptions)
            $deliverable = Deliverable::create([
                'uuid' => (string) Str::uuid(),
                'product_id' => $bill->product_id ?? 'bill_' . $bill->id,
                'price_id' => $bill->price_id,
                'item_id' => $bill->id, // Add item_id for bill lookup
                'creator_id' => $bill->user_id,
                'gifter_id' => $billPayment->user_id,
                'payment_intent_id' => $paymentIntentId,
                'session_id' => $session->id,
                'deliverable_type' => !empty($bill->content_file) ? 'digital_file' : 'access',
                'product_type' => 'bill',
                'transaction_amount' => $billPayment->amount, // Add transaction amount
                'deliverable_url' => !empty($bill->content_file) ? "https://ucarecdn.com/{$bill->content_file}/" : null,
                'customer_email' => $billPayment->guest_email ?? $billPayment->user->email ?? null,
                'customer_name' => $billPayment->guest_name ?? $billPayment->user->name ?? null,
                'payment_status' => $billPayment->status,
                'payment_currency' => $billPayment->currency,
                'anonymous' => $billPayment->anonymous ?? false,
                'message' => $billPayment->message,
                'metadata' => json_encode([
                    'product_type' => 'bill',
                    'bill_id' => $bill->id,
                    'bill_name' => $bill->name,
                    'amount' => $billPayment->amount,
                    'creator_net_amount' => $creatorNet,
                    'currency' => $billPayment->currency,
                    'subscription_id' => $billPayment->stripe_id,
                    'recurring_type' => $billPayment->recurring_type,
                    'anonymous' => $billPayment->anonymous,
                    'message' => $billPayment->message,
                    'guest_email' => $billPayment->guest_email,
                    'guest_name' => $billPayment->guest_name,
                    'has_content_file' => !empty($bill->content_file)
                ]),
                'status' => 'delivered',
                'delivered_at' => now()
            ]);

            // Dispatch ProcessWishItemDeliverable job for certificate generation
            ProcessWishItemDeliverable::dispatch($deliverable);

            // Update Stripe payment intent metadata (exactly like membership)
            if ($paymentIntentId) {
                try {
                    $stripeMetadataService = app(StripeMetadataService::class);
                    $stripeMetadataService->updateDeliverableMetadata($deliverable, [
                        'bill_processed_at' => now()->toISOString(),
                        'immediate_delivery' => 'true'
                    ]);
                } catch (Exception $e) {
                    Log::error('BillsController: Failed to update Stripe metadata', [
                        'deliverable_id' => $deliverable->id,
                        'payment_intent_id' => $paymentIntentId,
                        'error' => $e->getMessage()
                    ]);
                }
            }

            Log::info('Bill deliverable created successfully', [
                'deliverable_id' => $deliverable->id,
                'bill_payment_id' => $billPayment->id,
                'bill_id' => $bill->id,
                'has_content_file' => !empty($bill->content_file)
            ]);

            return $deliverable;
        } catch (Exception $e) {
            Log::error('Failed to create bill deliverable', [
                'error' => $e->getMessage(),
                'bill_payment_id' => $billPayment->id ?? 'unknown',
                'bill_id' => $billPayment->bill->id ?? 'unknown'
            ]);
            return null;
        }
    }

    public function billStatus(Request $request)
    {
        Log::info("Bill status request received");

        $endpoint_secret = env('STRIPE_WEBHOOK_SECRET');

        $payload = $request->getContent();
        $sig_header = $request->header('Stripe-Signature');

        $event = null;

        try {
            $event = Webhook::constructEvent(
                $payload,
                $sig_header,
                $endpoint_secret
            );
        } catch (SignatureVerificationException $e) {
            Log::error("BillsController: Webhook signature verification failed: " . $e->getMessage());
            return response()->json([
                'status' => false,
                'message' => 'Invalid signature'
            ], 400);
        } catch (Exception $e) {
            Log::error("BillsController: Webhook processing error: " . $e->getMessage());
            return response()->json([
                'status' => false,
                'message' => $e->getMessage()
            ], 400);
        }

        $array = [];
        if (!empty($event)) {
            $subs = BillPayment::where('stripe_id', $event->data->object->subscription)->latest()->first();

            $ret = StripeControl::getSubscription($event->data->object->subscription);

            if ($event->type == "invoice.updated" && !empty($subs)) {

                $array = [
                    'email' => $event->data->object->customer_email,
                    'name' => $event->data->object->customer_name,
                    'invoice_pdf' => $event->data->object->invoice_pdf,
                    'uuid' => $subs->uuid,
                    'notification' => $subs->user->notification_send ?? 0,
                    'trial_end' => $subs->upcoming_payment ?? null,
                    'amount' => $subs->amount ?? null,
                    'currency' => $subs->currency ?? 'GBP',
                ];

                $subs->status = "ended";
                $subs->save();

                $newSubs = new BillPayment();
                $newSubs->stripe_id = $subs->stripe_id;
                $newSubs->session_id = $subs->session_id;
                $newSubs->bills_id = $subs->bills_id;
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

                SendRenewMail::dispatch($array, 'renew', 'bill');
            } elseif ($event->type == "customer.subscription.deleted" && !empty($subs)) {
                $subs->status = 'cancelled';
                $subs->save();

                SendRenewMail::dispatch($array, 'cancelled', 'bill');
            } elseif ($event->type == "invoice.payment_failed" && !empty($subs)) {
                $subs->status = 'failed';
                $subs->save();

                SendRenewMail::dispatch($array, 'failed', 'bill');
            }
        }

        return response()->json([
            'status' => true,
            'message' => 'success',
        ]);
        // return true;
    }

    public function getDashboardData()
    {
        $user = Auth::user();

        $bills = Bills::with([
            'payments.user',
            'payments',
        ])
            ->where('user_id', $user->id)
            ->latest()
            ->get();

        $totalBills = $bills->count();

        $totalRevenue = 0;
        $monthlyRevenue = 0;
        $estimatedNextMonth = 0;
        $uniqueCustomers = [];

        foreach ($bills as $bill) {

            $paidPayments = $bill->payments
                ->where('status', 'paid');

            $billRevenue = $paidPayments->sum('amount');

            /*
            |--------------------------------------------------------------------------
            | ACTIVE RECURRING SUBSCRIPTIONS
            |--------------------------------------------------------------------------
            |
            | Only count subscriptions which:
            | - are recurring
            | - active
            | - not canceled
            |
            */

            $activeRecurringPayments = $bill->payments
                ->filter(function ($payment) {

                    /*
                    |--------------------------------------------------------------------------
                    | ONLY RECURRING PAYMENTS
                    |--------------------------------------------------------------------------
                    */

                    if (
                        $payment->recurring_type === 'one_time'
                    ) {
                        return false;
                    }

                    /*
                    |--------------------------------------------------------------------------
                    | ONLY SUCCESSFUL PAYMENTS
                    |--------------------------------------------------------------------------
                    */

                    if ($payment->status !== 'paid') {
                        return false;
                    }

                    /*
                    |--------------------------------------------------------------------------
                    | IF STRIPE SUBSCRIPTION STATUS EXISTS
                    |--------------------------------------------------------------------------
                    */

                    if (isset($payment->subscription_status) && $payment->subscription_status) {
                        if (!in_array($payment->subscription_status, ['active', 'trialing'])) {
                            return false;
                        }
                    }

                    /*
                    |--------------------------------------------------------------------------
                    | CANCELED SUBSCRIPTIONS
                    |--------------------------------------------------------------------------
                    */

                    if (isset($payment->cancel_at_period_end) && $payment->cancel_at_period_end) {
                        return false;
                    }

                    return true;
                });

            /*
            |--------------------------------------------------------------------------
            | NEXT MONTH ESTIMATION
            |--------------------------------------------------------------------------
            */

            $nextMonthEstimate =
                $activeRecurringPayments->sum('amount');

            $bill->total_revenue = round($billRevenue, 2);

            $bill->buyers_count =
                $paidPayments
                ->pluck('user_id')
                ->unique()
                ->count();

            $bill->next_month_estimate =
                round($nextMonthEstimate, 2);

            $totalRevenue += $billRevenue;

            $estimatedNextMonth += $nextMonthEstimate;

            foreach ($paidPayments as $payment) {

                if (
                    $payment->created_at->month == now()->month &&
                    $payment->created_at->year == now()->year
                ) {
                    $monthlyRevenue += $payment->amount;
                }

                if ($payment->user_id) {
                    $uniqueCustomers[] = $payment->user_id;
                }
            }
        }

        // CHART

        $chartData = [];

        for ($i = 5; $i >= 0; $i--) {

            $month = now()->subMonths($i);

            $amount = 0;

            foreach ($bills as $bill) {

                foreach ($bill->payments as $payment) {

                    if (
                        $payment->status == 'paid' &&
                        $payment->created_at->format('Y-m') == $month->format('Y-m')
                    ) {
                        $amount += $payment->amount;
                    }
                }
            }

            $chartData[] = [
                'month' => $month->format('M Y'),
                'amount' => round($amount, 2)
            ];
        }


        // TOP BILL

        $topBill = $bills->sortByDesc('total_revenue')->first();

        return response()->json([
            'status' => true,

            'stats' => [
                'total_bills' => $totalBills,
                'total_revenue' => round($totalRevenue, 2),
                'monthly_revenue' => round($monthlyRevenue, 2),
                'estimated_next_month' => round($estimatedNextMonth, 2),
                'unique_customers' => count(array_unique($uniqueCustomers)),
            ],

            'top_bill' => $topBill,

            'chart' => $chartData,

            'bills' => $bills,
        ]);
    }

    public function mySubscriptions()
    {
        return Inertia::render('bills/MySubscriptions');
    }

    public function getMySubscriptions()
    {
        $user = Auth::user();

        /*
        |--------------------------------------------------------------------------
        | ACTIVE CONDITION
        |--------------------------------------------------------------------------
        */

        $activeCondition = function ($query) {

            $query
                ->whereNull('end')
                ->orWhere('end', 0);
        };

        /*
        |--------------------------------------------------------------------------
        | BILL SUBSCRIPTIONS
        |--------------------------------------------------------------------------
        */

        $billSubscriptions = BillPayment::with([
            'bill.user'
        ])
            ->where('user_id', $user->id)

            ->whereRaw('LOWER(status) = ?', ['paid'])

            ->whereIn('recurring_type', [
                'monthly',
                'yearly',
                'annual'
            ])

            ->latest()

            ->get();

        /*
        |--------------------------------------------------------------------------
        | MEMBERSHIP SUBSCRIPTIONS
        |--------------------------------------------------------------------------
        */

        $membershipSubscriptions = MembershipPayment::with([
            'membership.user'
        ])
            ->where('user_id', $user->id)

            ->whereRaw('LOWER(status) = ?', ['paid'])

            ->whereIn('recurring_type', [
                'monthly',
                'yearly',
                'annual'
            ])

            ->latest()

            ->get();

        /*
        |--------------------------------------------------------------------------
        | ACTIVE COUNTS
        |--------------------------------------------------------------------------
        */

        $activeBillSubscriptions =
            $billSubscriptions
            ->filter(function ($subscription) {

                return
                    $subscription->end != 1;
            })
            ->count();

        $activeMembershipSubscriptions =
            $membershipSubscriptions
            ->filter(function ($subscription) {

                return
                    $subscription->end != 1;
            })
            ->count();

        /*
        |--------------------------------------------------------------------------
        | MONTHLY SPEND
        |--------------------------------------------------------------------------
        */

        $monthlySpend =

            $billSubscriptions

            ->where('recurring_type', 'monthly')

            ->where('end', '!=', 1)

            ->sum('amount')

            +

            $membershipSubscriptions

            ->where('recurring_type', 'monthly')

            ->where('end', '!=', 1)

            ->sum('amount');

        /*
        |--------------------------------------------------------------------------
        | YEARLY SPEND
        |--------------------------------------------------------------------------
        */

        $yearlySpend =

            $billSubscriptions

            ->filter(function ($subscription) {

                return
                    in_array(
                        $subscription->recurring_type,
                        ['yearly', 'annual']
                    )
                    &&

                    $subscription->end != 1;
            })

            ->sum('amount')

            +

            $membershipSubscriptions

            ->filter(function ($subscription) {

                return
                    in_array(
                        $subscription->recurring_type,
                        ['yearly', 'annual']
                    )
                    &&

                    $subscription->end != 1;
            })

            ->sum('amount');

        /*
        |--------------------------------------------------------------------------
        | RESPONSE
        |--------------------------------------------------------------------------
        */

        return response()->json([

            'status' => true,

            'stats' => [

                'active_bill_subscriptions' =>
                $activeBillSubscriptions,

                'active_membership_subscriptions' =>
                $activeMembershipSubscriptions,

                'total_active_subscriptions' =>

                $activeBillSubscriptions +
                    $activeMembershipSubscriptions,

                'monthly_spend' =>
                round($monthlySpend, 2),

                'yearly_spend' =>
                round($yearlySpend, 2),
            ],

            'bill_subscriptions' =>
            $billSubscriptions,

            'membership_subscriptions' =>
            $membershipSubscriptions,
        ]);
    }

    public function cancelSubscription(Request $request)
    {
        /*
        |--------------------------------------------------------------------------
        | VALIDATION
        |--------------------------------------------------------------------------
        */

        $request->validate([
            'payment_id' => 'required|exists:bill_payments,id',
        ]);

        /*
        |--------------------------------------------------------------------------
        | GET PAYMENT
        |--------------------------------------------------------------------------
        */

        $payment = BillPayment::findOrFail(
            $request->payment_id
        );

        /*
        |--------------------------------------------------------------------------
        | SECURITY CHECK
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
                'message' => 'Subscription already canceled'
            ]);
        }

        /*
        |--------------------------------------------------------------------------
        | STRIPE CANCEL AT PERIOD END
        |--------------------------------------------------------------------------
        */

        try {

            Stripe::setApiKey(
                config('services.stripe.secret')
            );

            if (!empty($payment->stripe_id)) {

                $subscription =
                    Subscription::retrieve(
                        $payment->stripe_id
                    );

                $subscription->cancel_at_period_end = true;

                $subscription->save();
            }
        } catch (\Exception $e) {

            return response()->json([

                'status' => false,

                'message' => $e->getMessage(),

            ], 500);
        }

        /*
        |--------------------------------------------------------------------------
        | UPDATE DATABASE
        |--------------------------------------------------------------------------
        */

        $payment->update([

            'end' => 1,

            /*
            |--------------------------------------------------------------------------
            | OPTIONAL
            |--------------------------------------------------------------------------
            */

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
            'Subscription scheduled for cancellation successfully.'
        ]);
    }

    public function getAllPayments(Request $request)
    {
        try {
            $user = Auth::user();
            $billIds = Bills::where('user_id', $user->id)->pluck('id')->toArray();

            $perPage = $request->get('per_page', 20);

            $payments = BillPayment::with(['bill', 'user'])
                ->whereIn('bills_id', $billIds)
                ->where('status', 'paid')
                ->orderBy('created_at', 'desc')
                ->paginate($perPage)
                ->through(function ($payment) {
                    return [
                        'id' => $payment->id,
                        'uuid' => $payment->uuid,
                        'bill_name' => $payment->bill->name ?? 'Unknown Bill',
                        'bill_uuid' => $payment->bill->uuid ?? null,
                        'amount' => round($payment->amount, 2),
                        'total_paid' => round($payment->total_paid ?? $payment->amount, 2),
                        'currency' => strtoupper($payment->currency ?? 'GBP'),
                        'status' => $payment->status,
                        'created_at' => $payment->created_at->format('Y-m-d H:i:s'),
                        'recurring_type' => $payment->recurring_type,
                        'recurring_for' => $payment->recurring_for,
                        'customer_name' => $payment->guest_name ?? ($payment->user->name ?? 'Anonymous'),
                        'customer_email' => $payment->guest_email ?? ($payment->user->email ?? 'N/A'),
                        'anonymous' => $payment->anonymous,
                        'message' => $payment->message,
                        'user' => $payment->user,
                    ];
                });

            return response()->json([
                'success' => true,
                'data' => $payments
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage()
            ], 500);
        }
    }

    public function getBillDetails($uuid)
    {
        $user = Auth::user();

        $bill = Bills::with([
            'payments.user'
        ])
            ->where('uuid', $uuid)
            ->where('user_id', $user->id)
            ->first();

        if (!$bill) {

            return response()->json([
                'status' => false,
                'message' => 'Bill not found'
            ], 404);
        }

        return response()->json([
            'status' => true,
            'bill' => $bill
        ]);
    }

    private function getMonthlyData($billIds)
    {
        $months = [];
        $currentDate = Carbon::now();

        for ($i = 11; $i >= 0; $i--) {
            $month = $currentDate->copy()->subMonths($i);
            $monthName = $month->format('M Y');

            $monthlyTotal = BillPayment::whereIn('bills_id', $billIds)
                ->where('status', 'paid')
                ->whereYear('created_at', $month->year)
                ->whereMonth('created_at', $month->month)
                ->sum('amount');

            $months[] = [
                'month' => $monthName,
                'amount' => round($monthlyTotal, 2),
            ];
        }

        return $months;
    }

    private function getCurrencySymbol($currency)
    {
        $symbols = [
            'GBP' => '£',
            'USD' => '$',
            'EUR' => '€',
            'JPY' => '¥',
            'CAD' => 'C$',
            'AUD' => 'A$',
            'CNY' => '¥',
            'INR' => '₹',
        ];

        return $symbols[strtoupper($currency)] ?? '£';
    }
}
