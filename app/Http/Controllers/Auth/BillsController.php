<?php

namespace App\Http\Controllers\Auth;

use App\Helpers;
use App\Http\Controllers\Controller;
use App\Jobs\BillContentDeliveryMail;
use App\Jobs\BillPayMail;
use App\Jobs\BillPayToUser;
use App\Jobs\NotificationSave;
use App\Jobs\ProcessWishItemDeliverable;
use App\Jobs\SendRenewMail;
use App\Models\BillPayment;
use App\Models\Bills;
use App\Models\ConnectedAccountCustomer;
use App\Models\CreatorMetric;
use App\Models\Currency;
use App\Models\Deliverable;
use App\Models\FinancialTransaction;
use App\Models\Logs;
use App\Models\MembershipPayment;
use App\Models\Payment;
use App\Models\User;
use App\Models\UserPayment;
use App\Notifications\SubscriptionBlockedNotification;
use App\Rules\NoExpenseOrBrandName;
use App\Services\CreatorAvailabilityMessageService;
use App\Services\CreatorSubscriptionService;
use App\Services\RewardService;
use App\Services\Risk\MoneyNormalizer;
use App\Services\Risk\ReservePolicy;
use App\Services\Risk\RiskService;
use App\Services\StripeMetadataService;
use App\Services\UserProfileService;
use App\StripeControl;
use App\Traits\RiskEnforcement;
use Carbon\Carbon;
use Exception;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Stripe\Exception\SignatureVerificationException;
use Stripe\Stripe;
use Stripe\StripeClient;
use Stripe\Subscription;
use Stripe\Webhook;

class BillsController extends Controller
{
    use RiskEnforcement;

    /**
     * A Bill sells ONE recurring content stream: an instant welcome reward at
     * checkout, then the creator's subscriber-only posts. It deliberately has
     * no perks bundle — that is what makes it a different product from a
     * Membership, which sells tiers. Giving Bills perks made the two
     * indistinguishable.
     *
     * The on-platform content requirement is already met structurally: a
     * creator cannot publish a Bill without at least one subscriber-only post,
     * and `EnforcePostingCadence` pauses collection if they stop posting.
     *
     * @return string|null the reason the reward is unacceptable, or null
     */
    private function rewardBundleError(Request $request): ?string
    {
        return RewardService::submittedLinkError($request->all());
    }

    /** @return array<string, mixed> */
    private function rewardBundleColumns(Request $request): array
    {
        return RewardService::columnsWithFile($request->all());
    }

    public function billSave(Request $request)
    {
        // 🔴 DEBUGGING: Log that method was called
        Log::info('🎯 billSave method called', [
            'user_id' => Auth::id(),
            'request_data' => $request->all(),
        ]);

        // Default the reward headline from the listing name so a missing field
        // never blocks the save — the reward contract still gets a title.
        if (! filled($request->reward_title)) {
            $request->merge(['reward_title' => (string) $request->name]);
        }

        $validator = Validator::make($request->all(), [
            'name' => ['required', 'string', new NoExpenseOrBrandName],
            // Field A — optional aspirational goal label (display-only, never on a transactional surface).
            'goal_label' => ['nullable', 'string', 'max:60', new NoExpenseOrBrandName],
            'price' => [
                'required',
                'numeric',
                function ($attribute, $value, $fail) {
                    // Stripe compliance: content membership £4.99–£100/mo (GBP equivalent)
                    $err = Helpers::priceWithinLimits($value, Auth::user()->default_currency ?? 'gbp', 4.99, 100);
                    if ($err) {
                        $fail($err);
                    }
                },
            ],
            'period' => ['required', 'string'],
            'content_file' => RewardService::fileRule(),
        ] + RewardService::validationRules());

        if ($validator->fails()) {
            return response()->json([
                'status' => false,
                'msg' => $validator->errors()->first(),
                'errors' => $validator->errors(),
            ]);
        }

        if ($rewardError = $this->rewardBundleError($request)) {
            return response()->json(['status' => false, 'msg' => $rewardError]);
        }

        $user = User::where('id', Auth::id())->first();

        // 🔴 DEBUGGING: Log user found
        Log::info('👤 User found', ['user_id' => $user->id ?? null]);

        // A listing cannot exist without a payment destination. createProduct()
        // takes a non-nullable string, so an unconnected creator would 500 on a
        // TypeError (an Error, not an Exception — the catch below never sees it).
        if (empty($user->account_id)) {
            return response()->json([
                'status' => false,
                'msg' => 'Please connect your Stripe account before creating items.',
            ]);
        }

        $media = $request->thumbnail;
        $price = $request->price;
        $currency = $user->default_currency ?? 'gbp';

        // Calculate VAT if applicable (Client Rule: Add VAT before other fees)
        $vatPercent = $user->vat_amount_percentage ?? 0;
        $vatAmount = $price * $vatPercent / 100;
        $priceWithVat = $price + $vatAmount;

        $metrics = app(RiskService::class)->recalculateMetrics((string) $user->uuid);
        $reserveRate = $metrics->reserve_percent ?? 0;

        // Use new gross-up flow for consistent fee calculation
        $breakdown = Helpers::calculateStripeDirectChargeFlow($priceWithVat, $currency, $reserveRate);

        $createPriceId = $breakdown['total_supporter_pays'];
        $taxAmount = $breakdown['total_fees'];

        $bill = new Bills;
        $bill->user_id = Auth::id();
        $bill->name = $request->name;
        $bill->goal_label = $request->goal_label ?: null;
        $bill->currency = $currency;
        $bill->price = $price;
        $bill->tax_amount = $taxAmount;
        $bill->thumbnail = ! empty($media) ? $media : null;
        $bill->period = $request->period;
        $bill->status = 1;
        $bill->fill($this->rewardBundleColumns($request));

        $bill->save();

        // Get currency metadata to handle zero-decimal currencies properly
        $currencyModel = Currency::where('ISO', strtoupper($currency))->first();
        $multiplier = ($currencyModel && $currencyModel->ISOdigits == 0) ? 1 : 100;

        $productPayload = [
            'name' => 'Content membership (incl. all fees)',
            'images' => [$bill->perma_link],
            'default_price_data' => [
                'currency' => $currency,
                'unit_amount_decimal' => round($createPriceId * $multiplier, 2, PHP_ROUND_HALF_UP),
                'recurring' => [
                    'interval' => StripeControl::$periods[$bill->period],
                    'interval_count' => 1,
                ],
            ],
            'url' => env('APP_URL').'/'.$user->username.'/bill',
            'metadata' => [
                'bill_name' => $bill->name,
                'creator_id' => $user->id,
                'creator_net_amount' => (string) ($breakdown['net_to_creator'] * $multiplier),
                'total_charge_amount' => (string) ($createPriceId * $multiplier),
            ],
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
                'msg' => 'Bill added successfully, your upload will be approved shortly.',
                'bill_id' => $bill->id,  // Added for debugging
            ]);
        } catch (Exception $e) {

            $bill->delete();

            return response()->json([
                'status' => false,
                'msg' => 'Stripe Error: '.$e->getMessage(),
            ]);
        }
    }

    public function billEdit(Request $request, $id)
    {
        Log::info("from start request->period: $request->period");

        // Default the reward headline from the listing name so a missing field
        // never blocks the save — the reward contract still gets a title.
        if (! filled($request->reward_title)) {
            $request->merge(['reward_title' => (string) $request->name]);
        }

        $validator = Validator::make($request->all(), [
            'name' => ['required', 'string', new NoExpenseOrBrandName],
            // Field A — optional aspirational goal label (display-only, never on a transactional surface).
            'goal_label' => ['nullable', 'string', 'max:60', new NoExpenseOrBrandName],
            'price' => [
                'required',
                'numeric',
                function ($attribute, $value, $fail) {
                    $err = Helpers::priceWithinLimits($value, Auth::user()->default_currency ?? 'gbp', 4.99, 100);
                    if ($err) {
                        $fail($err);
                    }
                },
            ],
            // Required on save, so it must be required on edit too — a null period
            // produced a Stripe price with interval: null and killed the checkout.
            'period' => ['required', 'string', Rule::in(array_keys(StripeControl::$periods))],
            'content_file' => RewardService::fileRule(),
        ] + RewardService::validationRules());

        if ($validator->fails()) {
            return response()->json([
                'status' => false,
                'msg' => $validator->errors()->first(),
                'errors' => $validator->errors(),
            ]);
        }

        if ($rewardError = $this->rewardBundleError($request)) {
            return response()->json(['status' => false, 'msg' => $rewardError]);
        }

        $user = User::where('id', Auth::id())->first();
        $bill = Bills::where('uuid', $id)->where('user_id', Auth::id())->first();

        if (! $user || ! $bill) {
            return response()->json([
                'status' => false,
                'msg' => 'User or Bill not found',
            ]);
        }

        $old_periods = $bill->period;

        $old_price = $bill->price;
        $old_price_id = $bill->price_id;

        $media = $request->thumbnail;
        $price = $request->price;
        $currency = $user->default_currency ?? 'gbp';

        // Calculate VAT if applicable (Client Rule: Add VAT before other fees)
        $vatPercent = $user->vat_amount_percentage ?? 0;
        $vatAmount = $price * $vatPercent / 100;
        $priceWithVat = $price + $vatAmount;

        $metrics = app(RiskService::class)->recalculateMetrics((string) $user->uuid);
        $reserveRate = $metrics->reserve_percent ?? 0;

        // Use new gross-up flow for consistent fee calculation
        $breakdown = Helpers::calculateStripeDirectChargeFlow($priceWithVat, $currency, $reserveRate);

        $taxamount = $breakdown['application_fee'];
        $totalAmount = $breakdown['total_supporter_pays'];

        $bill->fill([
            'user_id' => $user->id,
            'name' => $request->name,
            'goal_label' => $request->has('goal_label') ? ($request->goal_label ?: null) : $bill->goal_label,
            'currency' => $currency,
            'price' => $price,
            'tax_amount' => $taxamount,
            // Keep the existing image when the edit form does not re-upload one —
            // `$media ?? null` wiped the thumbnail on every price/name-only edit.
            'thumbnail' => ! empty($media) ? $media : $bill->thumbnail,
            'period' => $request->period,
        ] + $this->rewardBundleColumns($request))->save();

        try {
            Log::info("starting from try request->period: $request->period");

            if (! $bill->product_id) {
                return response()->json([
                    'status' => false,
                    'msg' => 'Missing product ID on bill.',
                ]);
            }

            Log::info("after if condition in try request->period: $request->period");
            Log::info("old_period: $old_periods");
            $stripe = new StripeClient(config('services.stripe.secret'));

            // Check if product exists in Stripe
            $stripeProduct = null;
            try {
                $stripeProduct = $stripe->products->retrieve($bill->product_id, [], ['stripe_account' => $user->account_id]);
            } catch (Exception $e) {
                Log::warning("Stripe Product not found for bill {$bill->uuid}, will attempt to recreate. Error: ".$e->getMessage());
            }

            // Get currency metadata to handle zero-decimal currencies properly
            $currencyModel = Currency::where('ISO', strtoupper($user->default_currency))->first();
            $multiplier = ($currencyModel && $currencyModel->ISOdigits == 0) ? 1 : 100;

            if (! $stripeProduct) {
                // Recreate the product if it's missing from Stripe
                $productPayload = [
                    'name' => 'Content membership (incl. all fees)',
                    'images' => [$bill->perma_link],
                    'default_price_data' => [
                        'currency' => $currency,
                        'unit_amount_decimal' => round($totalAmount * $multiplier, 2, PHP_ROUND_HALF_UP),
                        'recurring' => [
                            'interval' => StripeControl::$periods[$request->period],
                            'interval_count' => 1,
                        ],
                    ],
                    'url' => env('APP_URL').'/'.$user->username,
                    'metadata' => [
                        'bill_name' => $bill->name,
                        'creator_id' => $user->id,
                        'creator_net_amount' => (string) ($breakdown['net_to_creator'] * 100),
                        'total_charge_amount' => (string) ($totalAmount * 100),
                    ],
                ];

                $stripeProduct = StripeControl::createProduct($productPayload, $user->account_id);

                $bill->update([
                    'product_id' => $stripeProduct->id,
                    'price_id' => $stripeProduct->default_price,
                    'approved' => 0,
                ]);

                Log::info("Recreated Stripe Product for bill {$bill->uuid}: ".$stripeProduct->id);
            } elseif ($old_price != $price || $old_periods != $request->period) {
                Log::info("request->period: $request->period");

                $newPrice = $stripe->prices->create([
                    'unit_amount_decimal' => (string) round($totalAmount * $multiplier),
                    'currency' => $user->default_currency,
                    'product' => $bill->product_id,
                    'recurring' => [
                        'interval' => StripeControl::$periods[$request->period],
                        'interval_count' => 1,
                    ],
                ], [
                    'stripe_account' => $user->account_id,
                ]);
                Log::info(json_encode($newPrice));

                $product = $stripe->products->update($bill->product_id, [
                    'name' => 'Content membership (incl. all fees)',
                    'images' => [$bill->perma_link],
                    'default_price' => $newPrice->id,
                    'url' => env('APP_URL').'/'.$user->username,
                    'metadata' => [
                        'bill_name' => $bill->name,
                        'creator_id' => $user->id,
                        'creator_net_amount' => (string) ($breakdown['net_to_creator'] * 100),
                        'total_charge_amount' => (string) ($totalAmount * 100),
                    ],
                ], [
                    'stripe_account' => $user->account_id,
                ]);

                $stripe->prices->update($old_price_id, [
                    'active' => false,
                ], [
                    'stripe_account' => $user->account_id,
                ]);

                $bill->update([
                    'price_id' => $newPrice->id,
                    'product_id' => $product->id,
                    'approved' => 0,
                ]);
            } else {
                // Only name or metadata might have changed
                $stripe->products->update($bill->product_id, [
                    'name' => 'Content membership (incl. all fees)',
                    'images' => [$bill->perma_link],
                    'metadata' => [
                        'bill_name' => $bill->name,
                        'creator_id' => $user->id,
                        'creator_net_amount' => (string) ($breakdown['net_to_creator'] * 100),
                        'total_charge_amount' => (string) ($totalAmount * 100),
                    ],
                ], [
                    'stripe_account' => $user->account_id,
                ]);
            }

            Logs::where('edited_bill_id', $bill->id)
                ->where('status', 'pending')
                ->update(['status' => 'updated']);

            // Clear user caches
            app(UserProfileService::class)->clearUserCaches($user->username, $user->id);
        } catch (Exception $e) {
            Log::error('Stripe Error during bill edit: '.$e->getMessage());

            return response()->json([
                'status' => false,
                'msg' => 'Stripe Error: '.$e->getMessage(),
            ]);
        }

        Log::info("to end request->period: $request->period");

        return response()->json([
            'status' => true,
            'msg' => 'Bill edited successfully.',
        ]);
    }

    public function removeBill($uuid)
    {
        $bill = Bills::whereUuid($uuid)->where('user_id', Auth::id())->first();

        if (! empty($bill)) {
            $account_id = $bill->user->account_id;

            /*
            |--------------------------------------------------------------------------
            | CANCEL LIVE SUBSCRIPTIONS FIRST
            |--------------------------------------------------------------------------
            |
            | Checkout builds inline price_data, so the live subscriptions are NOT
            | attached to $bill->product_id — deleting the product left every existing
            | supporter being charged monthly with their local record gone. Cancel by
            | the subscription id we stored, on the creator's connected account.
            */

            $liveSubscriptions = BillPayment::where('bills_id', $bill->id)
                ->whereNotNull('stripe_id')
                ->whereRaw('LOWER(status) = ?', ['paid'])
                ->get();

            foreach ($liveSubscriptions as $subscription) {
                if (! $subscription->isSubscriptionActive()) {
                    continue;
                }

                try {
                    StripeControl::cancelSubscription($subscription->stripe_id, false, $account_id);
                    $subscription->markCancelledAt(now());
                } catch (Exception $e) {
                    Log::error('Failed to cancel bill subscription during bill removal: '.$e->getMessage(), [
                        'bill_uuid' => $uuid,
                        'bill_payment_id' => $subscription->id,
                        'stripe_id' => $subscription->stripe_id,
                    ]);
                }
            }

            BillPayment::where('bills_id', $bill->id)->delete();

            // Only attempt to delete Stripe product if product_id exists
            if (! empty($bill->product_id)) {
                try {
                    $stripeProduct = StripeControl::getProduct($bill->product_id, $account_id);
                    if ($stripeProduct) {
                        // Delete the product and prices from Stripe
                        StripeControl::deleteProductAndPrices($stripeProduct->id, $account_id);
                    }
                } catch (Exception $e) {
                    // Log the error but continue with bill deletion
                    Log::error('Failed to delete Stripe product: '.$e->getMessage(), [
                        'bill_uuid' => $uuid,
                        'product_id' => $bill->product_id,
                    ]);
                }
            }

            $bill->delete();

            // Clear user caches
            $user = $bill->user;
            app(UserProfileService::class)->clearUserCaches($user->username, $user->id);

            return response()->json([
                'status' => true,
                'msg' => 'Bill removed successfully.',
            ]);
        }

        return response()->json([
            'status' => false,
            'msg' => 'Bill not found.',
        ]);
    }

    /**
     * Buy creator's membership
     *
     * @param  string  $uuid  Membership UUID
     * @param  string  $reccure  Subscription Reccuring - onetime or continue
     * @return mixed
     */
    public function buyBill(Request $request, $uuid, $reccure = 'continue')
    {
        // Stripe compliance: content memberships require an account (tracked, renewed, cancelled).
        // Guest checkout is only allowed for Piggy Pot and Wishes.
        if (! Auth::check()) {
            return redirect()->route('login')->with('error', 'Please log in or create an account to subscribe — memberships need an account so they can be tracked, renewed and cancelled.');
        }

        $checkGifterStatus = Helpers::checkGifterCardVerificationStatus();
        if ($checkGifterStatus === true) {
            $user = Auth::user();

            return to_route('user.show', ['username' => $user->username])
                ->with('error', '⚠️ Please complete your card verification payment and wait for admin approval before making further payments.');
        }

        $bill = Bills::with('user')->whereUuid($uuid)->first();
        if (! $bill) {
            return redirect()->back()->with('error', 'Bill not found!');
        }

        if ($bill->is_suspended) {
            return redirect()->back()->with('error', 'This bill is currently suspended and cannot accept payments.');
        }

        // The profile only *displays* approved items, but the checkout URL is public and
        // guessable — an item awaiting review (or pulled by an admin) could still be sold.
        if (! $bill->approved || ! $bill->status) {
            return redirect()->back()->with('error', 'This item is not available right now. It is awaiting review.');
        }

        if (! $bill->user) {
            return redirect()->back()->with('error', 'Creator account not found or deactivated.');
        }

        // Check if creator has card_payments capability
        if (! StripeControl::hasCardPaymentsCapability($bill->user->account_id)) {
            $stripeCheck = ['eligible' => false, 'status' => 'stripe_disabled'];

            return redirect()->back()->with('error', app(CreatorAvailabilityMessageService::class)->supporterMessage(null, null, $stripeCheck));
        }

        // NEW: Check creator subscription eligibility first
        $subscriptionCheck = app(CreatorSubscriptionService::class)->validateCreatorSubscription($bill->user);

        if (! $subscriptionCheck['eligible']) {
            // Send notification to creator about blocked payment
            $bill->user->notify(new SubscriptionBlockedNotification($subscriptionCheck, $bill->price));

            // Log the blocked payment for subscription issues
            Log::warning('Bill payment blocked due to subscription issue', [
                'creator_id' => $bill->user->id,
                'creator_username' => $bill->user->username,
                'bill_id' => $bill->id,
                'bill_price' => $bill->price,
                'subscription_status' => $subscriptionCheck['status'],
                'subscription_status_code' => $subscriptionCheck['subscription_status'] ?? 'unknown',
            ]);

            // Return user-friendly error to fan
            return redirect()->back()->with(
                'error',
                app(CreatorAvailabilityMessageService::class)->supporterMessage($subscriptionCheck, null)
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
        $displayCurrency = strtolower($request->cookie('currency', 'GBP'));

        // Calculate VAT in Creator's Currency
        $vatPercent = $bill->user->vat_amount_percentage ?? 0;
        $priceWithVat = $price + ($price * $vatPercent / 100);

        $metrics = app(RiskService::class)->recalculateMetrics((string) $bill->user->uuid);
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

        $user = Auth::user();
        if ($user && $bill->user_id === $user->id) {
            return redirect()->back()->with('error', "You can't buy your own bill!");
        }

        if ($request->isMethod('POST')) {
            // Stripe compliance: content memberships require an account so the supporter
            // can track, renew and cancel the subscription (guest checkout is only allowed
            // for one-off Piggy Pot and Wishes purchases).
            if (! Auth::check()) {
                return redirect()->guest(route('login'))
                    ->with('error', 'Please create an account or log in to subscribe — content memberships need an account so you can manage, renew or cancel them.');
            }

            // Unified Risk Enforcement
            $riskData = $this->enforceRiskChecks(
                $request,
                $bill->user,
                $finalTotalAmount,
                $chargeCurrency,
                'bill_checkout',
                false // redirect response
            );

            if ($riskData instanceof RedirectResponse) {
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

            DB::beginTransaction();

            $sub = BillPayment::create([
                'bills_id' => $bill->id,
                'user_id' => $user->id ?? null,
                'guest_name' => $request->name,
                'guest_email' => $request->email,
                'currency' => $chargeCurrency, // Force Creator's Currency
                'amount' => $bill->price,
                'total_paid' => $finalTotalAmount,
                'tax' => $breakdown['total_fees'],
                'vat_tax_amount' => $bill->price * $vatPercent / 100, // Store actual VAT
                'recurring_for' => $reccure ?? null,
                'recurring_type' => $bill->period,
                'message' => $request->message ?? null,
                'anonymous' => $request->anonymous ?? 0,
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

                if (! $customer_id) {
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

                if (! $priceId) {

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
                        throw new Exception('Failed to create Stripe price.');
                    }

                    $priceId = $stripePrice->id;
                }

                if (! $storeCustomer) {
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
                                'name' => 'Content membership',
                                'description' => Helpers::rewardLineDescription(
                                    $bill,
                                    "Content membership · @{$bill->user->username}"
                                ),
                            ],
                            'unit_amount' => round($finalTotalAmount * $multiplier),
                            'recurring' => [
                                'interval' => StripeControl::$periods[$bill->period],
                                'interval_count' => 1,
                            ],
                        ],
                    ],
                ];

                $payload = [
                    'mode' => 'subscription',
                    'payment_method_types' => ['card'],
                    'line_items' => $lineItems, // Total amount determined by line items
                    'subscription_data' => [
                        'description' => "Content membership · @{$bill->user->username}",
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
                    'success_url' => route('bill.handle', ['uuid' => $sub->uuid, 'status' => 'success']),
                    'cancel_url' => route('bill.handle', ['uuid' => $sub->uuid, 'status' => 'cancel']),
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
                            'amount' => app(MoneyNormalizer::class)->toGbpMinor((int) round($finalTotalAmount * $multiplier), strtoupper($chargeCurrency)),
                            'currency' => 'gbp',
                            'stripe_payment_intent_id' => $session->payment_intent ?? null,
                            'status' => 'initiated',
                            'reason_codes' => $riskData['reason_codes'] ?? [],
                        ]
                    );
                } catch (Exception $e) {
                    Log::warning('Risk Ledger: Failed to record bill payment', [
                        'session_id' => $session->id,
                        'error' => $e->getMessage(),
                    ]);
                }

                return Inertia::location($session->url);
            } catch (Exception $e) {
                DB::rollBack();
                Log::error('Stripe checkout session failed: '.$e->getMessage());

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
     * @param  string  $uuid  Subscription UUID
     * @param  string  $status  Status of Subscription
     * @return mixed
     */
    public function handlePayment($uuid)
    {
        $bill_pay = BillPayment::with('bill')->whereUuid($uuid)->first();

        if (! $bill_pay) {
            return to_route('home')->with('error', 'Insufficient data!');
        }

        /*
        |--------------------------------------------------------------------------
        | ATOMIC CLAIM
        |--------------------------------------------------------------------------
        |
        | The Stripe success redirect can arrive twice (double-tap, prefetch, back
        | button). A plain read-then-write guard let both requests through, creating
        | duplicate UserPayment rows, double GMV, duplicate deliverables and receipts.
        | A conditional UPDATE is the claim — only one request can win it.
        */

        $claimed = BillPayment::where('id', $bill_pay->id)
            ->where('status', 'initiated')
            ->update(['status' => 'processing']);

        if (! $claimed) {
            return to_route('user.show', ['username' => $bill_pay->bill->user->username])->with('success', 'Subscription already processed!');
        }

        $bill_pay->status = 'processing';

        try {

            // Update GMV for creator
            Helpers::addGmv($bill_pay->bill->user_id);

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

                $vatAmount = $bill_pay->vat_tax_amount ?? 0;
                $amountWithVat = ($symbol->symbol ?? '£').number_format($bill_pay->amount + $vatAmount, 2);

                $multiplier = Helpers::isZeroDecimalCurrency($session->currency) ? 1 : 100;
                $totalPaidAmount = $bill_pay->total_paid && $bill_pay->total_paid > 0 ? $bill_pay->total_paid : (float) ($session->amount_total / $multiplier);
                $amountWithCurr = ($symbol->symbol ?? '£').number_format($totalPaidAmount, 2);

                /**************************BILL**PWA**START****************************************************/
                // below is BILL pwa for fans
                $CreatorName = ucfirst($bill_pay->bill->user->name) ?? 'A Creator';
                $title = '🧾 Bill Paid!';
                $content = "You’ve successfully paid your bill to $CreatorName for {$amountWithCurr}.";
                $email = $bill_pay->guest_email;

                Helpers::sendNotification($title, $content, $email);

                // below is BILL pwa for creator
                $FanName = ucfirst($bill_pay->user->name ?? $bill_pay->guest_name) ?? 'A Fan';
                $title = '💰 Bill Payment Received!';
                $content = "$FanName has paid their bill. Check your earnings!.";
                $email = $bill_pay->bill->user->email;

                Helpers::sendNotification($title, $content, $email);
                /**************************BILL**PWA**ENDS****************************************************/

                // Create deliverable entry for bill payment (like wish subscriptions)
                $this->createBillDeliverable($bill_pay, $session);

                // Calculate creator net amount
                $breakdown = Helpers::calculateStripeDirectChargeFlow($bill_pay->amount + $bill_pay->vat_tax_amount, $bill_pay->currency);
                $creatorNetAmount = ($symbol->symbol ?? '£').number_format($breakdown['net_to_creator'], 2);

                // Dispatch mail jobs
                BillPayMail::dispatch($bill_pay, $creatorNetAmount);
                BillPayToUser::dispatch($bill_pay, $amountWithCurr, $bill_pay->bill->user->name);

                // Dispatch content delivery email if bill has content file
                if (! empty($bill_pay->bill->content_file)) {
                    BillContentDeliveryMail::dispatch($bill_pay, $symbol->symbol);
                    Log::info('BillsController: Content delivery email dispatched for bill payment', [
                        'bill_payment_id' => $bill_pay->id,
                        'bill_id' => $bill_pay->bill->id,
                        'has_content_file' => ! empty($bill_pay->bill->content_file),
                    ]);
                }

                // Notification setup
                $username = $bill_pay->anonymous ? 'Anonymous user' : ($bill_pay->guest_name ?? 'Anonymous user');
                $message = "$username just subscribed to your bill {$bill_pay->bill->name}";
                NotificationSave::dispatch($message, $bill_pay->bill->user, $bill_pay->user ?? null, 'Bill');

                $bill_pay->save();

                $userPayment = new UserPayment;
                $userPayment->from_user_id = $bill_pay->user_id ?? null;
                $userPayment->to_user_id = $bill_pay->bill->user_id;
                $userPayment->product_type = 'bill';
                $userPayment->amount = $bill_pay->amount;

                // Ensure total_paid is updated in BillPayment if missing
                if (! $bill_pay->total_paid || $bill_pay->total_paid <= 0) {
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
                    $billBreakdown = Helpers::calculateStripeDirectChargeFlow($amount + $vat, strtoupper($bill_pay->currency ?? 'GBP'));
                    $platformFee = $billBreakdown['platform_fee'] + $billBreakdown['compliance_fee'] + $billBreakdown['admin_fee'];
                    $stripeFee = $billBreakdown['stripe_fee'];
                    $gross = $bill_pay->total_paid && $bill_pay->total_paid > 0
                        ? (float) $bill_pay->total_paid
                        : $billBreakdown['total_supporter_pays'];
                    $creatorAmount = $amount;

                    // Reserve is taken from the creator's NET amount (never the gross).
                    // Without this the bill earning was unreserved until the nightly
                    // sync ran, and a payout in that window paid the full net.
                    $reservePercent = (int) app(ReservePolicy::class)->getEffectiveReservePercent(
                        $creator,
                        CreatorMetric::where('creator_id', $creator->uuid)->first(),
                        now()
                    );
                    $reserveAmount = $reservePercent > 0 ? round($creatorAmount * $reservePercent / 100, 2, PHP_ROUND_HALF_UP) : 0;

                    FinancialTransaction::updateOrCreate(
                        [
                            'source_type' => BillPayment::class,
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
                            'reserve_amount' => $reserveAmount,
                            'reserve_status' => $reserveAmount > 0 ? 'held' : 'none',
                            'currency' => strtoupper($bill_pay->currency ?? 'GBP'),
                            'status' => 'completed',
                            'description' => 'Recurring content: '.($bill_pay->bill->name ?? 'Subscription'),
                            'transaction_date' => $bill_pay->created_at,
                        ]
                    );
                } catch (\Throwable $e) {
                    Log::error('Failed to sync BillPayment to FinancialTransaction in handlePayment: '.$e->getMessage(), ['bill_payment_id' => $bill_pay->id]);
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
                    'item_id' => $bill_pay->bill->uuid,
                    'source' => 'bill_payments',
                    'source_id' => $bill_pay->id,
                ])->with('success', 'Payment for subscription of bill is successful.');
            }

            $bill_pay->save();

            return to_route('user.show', ['username' => $bill_pay->bill->user->username])->with('warning', "Bill is in {$session->payment_status} status.");
        } catch (Exception $e) {
            // Release the claim so a genuine retry is still possible.
            BillPayment::where('id', $bill_pay->id)
                ->where('status', 'processing')
                ->update(['status' => 'initiated']);

            Log::error('BillsController: handlePayment failed', [
                'bill_payment_id' => $bill_pay->id,
                'error' => $e->getMessage(),
            ]);

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

            $metrics = app(RiskService::class)->recalculateMetrics((string) $bill->user->uuid);
            $reserveRate = $metrics->reserve_percent ?? 0;

            // Use consistent fee calculation for creator net amount
            $breakdown = Helpers::calculateStripeDirectChargeFlow($billPayment->amount, $billPayment->currency, $reserveRate);
            $creatorNet = $breakdown['net_to_creator'];

            // Get payment intent ID from Stripe session if available
            $paymentIntentId = null;
            if ($session && isset($session->id)) {
                try {
                    $stripe = new StripeClient(config('services.stripe.secret'));
                    $retrievedSession = $stripe->checkout->sessions->retrieve($session->id);
                    $paymentIntentId = $retrievedSession->payment_intent ?? null;
                    Log::info('BillsController: Retrieved payment intent from session', [
                        'session_id' => $session->id,
                        'payment_intent_id' => $paymentIntentId,
                    ]);
                } catch (Exception $e) {
                    Log::warning('BillsController: Failed to retrieve payment intent from session', [
                        'session_id' => $session->id ?? 'unknown',
                        'error' => $e->getMessage(),
                    ]);
                }
            }

            // Create deliverable entry for tracking (similar to wish subscriptions)
            $deliverable = Deliverable::create([
                'uuid' => (string) Str::uuid(),
                'product_id' => $bill->product_id ?? 'bill_'.$bill->id,
                'price_id' => $bill->price_id,
                'item_id' => $bill->id, // Add item_id for bill lookup
                'creator_id' => $bill->user_id,
                'gifter_id' => $billPayment->user_id,
                'payment_intent_id' => $paymentIntentId,
                'session_id' => $session->id,
                'deliverable_type' => ! empty($bill->content_file) ? 'digital_file' : 'access',
                'product_type' => 'bill',
                'transaction_amount' => $billPayment->amount, // Add transaction amount
                'deliverable_url' => ! empty($bill->content_file) ? "https://ucarecdn.com/{$bill->content_file}/" : null,
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
                    'has_content_file' => ! empty($bill->content_file),
                ]),
                'status' => 'delivered',
                'delivered_at' => now(),
            ]);

            // Dispatch ProcessWishItemDeliverable job for certificate generation
            ProcessWishItemDeliverable::dispatch($deliverable);

            // Update Stripe payment intent metadata (exactly like membership)
            if ($paymentIntentId) {
                try {
                    $stripeMetadataService = app(StripeMetadataService::class);
                    $stripeMetadataService->updateDeliverableMetadata($deliverable, [
                        'bill_processed_at' => now()->toISOString(),
                        'immediate_delivery' => 'true',
                    ]);
                } catch (Exception $e) {
                    Log::error('BillsController: Failed to update Stripe metadata', [
                        'deliverable_id' => $deliverable->id,
                        'payment_intent_id' => $paymentIntentId,
                        'error' => $e->getMessage(),
                    ]);
                }
            }

            Log::info('Bill deliverable created successfully', [
                'deliverable_id' => $deliverable->id,
                'bill_payment_id' => $billPayment->id,
                'bill_id' => $bill->id,
                'has_content_file' => ! empty($bill->content_file),
            ]);

            return $deliverable;
        } catch (Exception $e) {
            Log::error('Failed to create bill deliverable', [
                'error' => $e->getMessage(),
                'bill_payment_id' => $billPayment->id ?? 'unknown',
                'bill_id' => $billPayment->bill->id ?? 'unknown',
            ]);

            return null;
        }
    }

    public function billStatus(Request $request)
    {
        Log::info('Bill status request received');

        $endpoint_secret = config('services.stripe.webhook_secret');

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
            Log::error('BillsController: Webhook signature verification failed: '.$e->getMessage());

            return response()->json([
                'status' => false,
                'message' => 'Invalid signature',
            ], 400);
        } catch (Exception $e) {
            Log::error('BillsController: Webhook processing error: '.$e->getMessage());

            return response()->json([
                'status' => false,
                'message' => $e->getMessage(),
            ], 400);
        }

        $array = [];
        if (! empty($event)) {
            $subs = BillPayment::where('stripe_id', $event->data->object->subscription)->latest()->first();

            $ret = StripeControl::getSubscription($event->data->object->subscription);

            if ($event->type == 'invoice.updated' && ! empty($subs)) {

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

                $subs->status = 'ended';
                $subs->save();

                $newSubs = new BillPayment;
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
                $newSubs->status = 'paid';
                $newSubs->created_at = $subs->created_at;
                $newSubs->updated_at = Carbon::now();
                $newSubs->save();

                SendRenewMail::dispatch($array, 'renew', 'bill');
            } elseif ($event->type == 'customer.subscription.deleted' && ! empty($subs)) {
                $subs->status = 'cancelled';
                $subs->save();

                SendRenewMail::dispatch($array, 'cancelled', 'bill');
            } elseif ($event->type == 'invoice.payment_failed' && ! empty($subs)) {
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

        // Recurring health: MRR (monthly-normalised recurring revenue) + churn.
        $mrr = 0;
        $activeRecurringCount = 0;
        $cancelledThisMonth = 0;
        $monthStart = now()->startOfMonth();

        // Normalise any billing period down to a monthly figure.
        $toMonthly = function ($payment) {
            $amount = (float) $payment->amount;
            switch ($payment->recurring_type) {
                case 'yearly':
                case 'annual':
                    return $amount / 12;
                case 'weekly':
                    return $amount * 52 / 12;
                default: // monthly
                    return $amount;
            }
        };

        foreach ($bills as $bill) {

            $paidPayments = $bill->payments
                ->where('status', 'paid');

            $billRevenue = $paidPayments->sum('amount');

            // Cancelled this month (for churn): rows whose access-end falls in this month.
            $cancelledThisMonth += $bill->payments->filter(function ($payment) use ($monthStart) {
                $endsAt = $payment->endsAt();

                return $endsAt !== null && $endsAt->greaterThanOrEqualTo($monthStart);
            })->count();

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

                    if (! empty($payment->stripe_status) && ! in_array($payment->stripe_status, ['active', 'trialing'])) {
                        return false;
                    }

                    /*
                    |--------------------------------------------------------------------------
                    | CANCELED SUBSCRIPTIONS
                    |--------------------------------------------------------------------------
                    |
                    | This used to read `subscription_status`/`cancel_at_period_end`, neither
                    | of which existed on bill_payments — so cancelled supporters were still
                    | counted in "estimated next month".
                    */

                    if ($payment->cancel_at_period_end || $payment->isCancelled()) {
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

            $activeRecurringCount += $activeRecurringPayments->count();
            $mrr += $activeRecurringPayments->sum($toMonthly);

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

        // 12 months so the dashboard's "Last 12 months" period filter has real data.
        for ($i = 11; $i >= 0; $i--) {

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
                'amount' => round($amount, 2),
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
                'mrr' => round($mrr, 2),
                'active_recurring' => $activeRecurringCount,
                'cancelled_this_month' => $cancelledThisMonth,
                // Churn = cancellations this month over the base that was active at the
                // month's start (still-active + those that cancelled this month).
                'churn_rate' => ($activeRecurringCount + $cancelledThisMonth) > 0
                    ? round(($cancelledThisMonth / ($activeRecurringCount + $cancelledThisMonth)) * 100, 1)
                    : 0,
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

        $isActive = fn ($subscription) => $subscription->isSubscriptionActive();

        /*
        |--------------------------------------------------------------------------
        | BILL SUBSCRIPTIONS
        |--------------------------------------------------------------------------
        */

        $billSubscriptions = BillPayment::with([
            'bill.user',
        ])
            ->where('user_id', $user->id)

            ->whereRaw('LOWER(status) = ?', ['paid'])

            ->whereIn('recurring_type', [
                'monthly',
                'yearly',
                'annual',
            ])

            ->latest()

            ->get();

        /*
        |--------------------------------------------------------------------------
        | MEMBERSHIP SUBSCRIPTIONS
        |--------------------------------------------------------------------------
        */

        $membershipSubscriptions = MembershipPayment::with([
            'membership.user',
        ])
            ->where('user_id', $user->id)

            ->whereRaw('LOWER(status) = ?', ['paid'])

            ->whereIn('recurring_type', [
                'monthly',
                'yearly',
                'annual',
            ])

            ->latest()

            ->get();

        /*
        |--------------------------------------------------------------------------
        | ACTIVE COUNTS
        |--------------------------------------------------------------------------
        */

        $activeBillSubscriptions =
            $billSubscriptions->filter($isActive)->count();

        $activeMembershipSubscriptions =
            $membershipSubscriptions->filter($isActive)->count();

        /*
        |--------------------------------------------------------------------------
        | MONTHLY SPEND
        |--------------------------------------------------------------------------
        */

        $monthlySpend =

            $billSubscriptions
                ->where('recurring_type', 'monthly')
                ->filter($isActive)
                ->sum('amount')

            +

            $membershipSubscriptions
                ->where('recurring_type', 'monthly')
                ->filter($isActive)
                ->sum('amount');

        /*
        |--------------------------------------------------------------------------
        | YEARLY SPEND
        |--------------------------------------------------------------------------
        */

        $yearlyFilter = fn ($subscription) => in_array(
            $subscription->recurring_type,
            ['yearly', 'annual']
        ) && $subscription->isSubscriptionActive();

        $yearlySpend =

            $billSubscriptions->filter($yearlyFilter)->sum('amount')

            +

            $membershipSubscriptions->filter($yearlyFilter)->sum('amount');

        /*
        |--------------------------------------------------------------------------
        | UPCOMING RENEWALS (next 30 days)
        |--------------------------------------------------------------------------
        |
        | Give the supporter a heads-up on what is about to be charged, so a renewal
        | is never a surprise. Only live subscriptions with a future charge date count.
        */

        $now = now();
        $in30 = now()->copy()->addDays(30);

        $upcoming = $billSubscriptions
            ->filter($isActive)
            ->merge($membershipSubscriptions->filter($isActive))
            ->filter(function ($sub) use ($now, $in30) {
                if (empty($sub->upcoming_payment)) {
                    return false;
                }
                $due = Carbon::parse($sub->upcoming_payment);

                return $due->betweenIncluded($now, $in30);
            });

        $nextRenewal = $billSubscriptions
            ->filter($isActive)
            ->merge($membershipSubscriptions->filter($isActive))
            ->filter(fn ($s) => ! empty($s->upcoming_payment) && Carbon::parse($s->upcoming_payment)->greaterThanOrEqualTo($now))
            ->sortBy(fn ($s) => Carbon::parse($s->upcoming_payment)->timestamp)
            ->first();

        /*
        |--------------------------------------------------------------------------
        | RESPONSE
        |--------------------------------------------------------------------------
        */

        return response()->json([

            'status' => true,

            'stats' => [

                'active_bill_subscriptions' => $activeBillSubscriptions,

                'active_membership_subscriptions' => $activeMembershipSubscriptions,

                'total_active_subscriptions' => $activeBillSubscriptions +
                    $activeMembershipSubscriptions,

                'monthly_spend' => round($monthlySpend, 2),

                'yearly_spend' => round($yearlySpend, 2),

                'upcoming_30d_count' => $upcoming->count(),

                'upcoming_30d_total' => round($upcoming->sum('amount'), 2),

                'next_renewal_at' => $nextRenewal?->upcoming_payment,
            ],

            'bill_subscriptions' => $billSubscriptions,

            'membership_subscriptions' => $membershipSubscriptions,
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
                'message' => 'Unauthorized access',
            ], 403);
        }

        /*
        |--------------------------------------------------------------------------
        | ALREADY CANCELED
        |--------------------------------------------------------------------------
        */

        if ($payment->isCancelled()) {

            return response()->json([
                'status' => false,
                'message' => 'Subscription already canceled',
            ]);
        }

        /*
        |--------------------------------------------------------------------------
        | STRIPE CANCEL AT PERIOD END
        |--------------------------------------------------------------------------
        */

        $endsAt = null;

        try {

            if (! empty($payment->stripe_id)) {
                // Bills use Direct Charges on the creator's connected account, so the
                // subscription lives there — retrieving/updating it on the platform
                // account fails. Use the region-correct client + stripe_account option.
                $connectedAccountId = $payment->bill->user->account_id ?? null;
                $opts = $connectedAccountId ? ['stripe_account' => $connectedAccountId] : [];
                $client = StripeControl::getClientForCurrency($payment->currency ?? 'gbp');
                $subscription = $client->subscriptions->update(
                    $payment->stripe_id,
                    ['cancel_at_period_end' => true],
                    $opts
                );

                if (! empty($subscription->current_period_end)) {
                    $endsAt = Carbon::createFromTimestamp($subscription->current_period_end);
                }

                $payment->forceFill([
                    'stripe_status' => $subscription->status,
                    'current_period_end' => $endsAt,
                ]);
            }
        } catch (Exception $e) {

            return response()->json([

                'status' => false,

                'message' => $e->getMessage(),

            ], 500);
        }

        /*
        |--------------------------------------------------------------------------
        | UPDATE DATABASE
        |--------------------------------------------------------------------------
        |
        | `end` is a timestamp column meaning "access ends at" — the supporter keeps
        | what they already paid for until the current period runs out.
        */

        $payment->markCancelledAt($endsAt ?: Carbon::parse($payment->upcoming_payment ?: now()));

        /*
        |--------------------------------------------------------------------------
        | RESPONSE
        |--------------------------------------------------------------------------
        */

        return response()->json([

            'status' => true,

            'message' => 'Subscription scheduled for cancellation successfully.',
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
                'data' => $payments,
            ]);
        } catch (Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 500);
        }
    }

    public function getBillDetails($uuid)
    {
        $user = Auth::user();

        $bill = Bills::with([
            'payments.user',
        ])
            ->where('uuid', $uuid)
            ->where('user_id', $user->id)
            ->first();

        if (! $bill) {

            return response()->json([
                'status' => false,
                'message' => 'Bill not found',
            ], 404);
        }

        return response()->json([
            'status' => true,
            'bill' => $bill,
        ]);
    }

    // private function getMonthlyData($billIds)
    // {
    //     $months = [];
    //     $currentDate = Carbon::now();

    //     for ($i = 11; $i >= 0; $i--) {
    //         $month = $currentDate->copy()->subMonths($i);
    //         $monthName = $month->format('M Y');

    //         $monthlyTotal = BillPayment::whereIn('bills_id', $billIds)
    //             ->where('status', 'paid')
    //             ->whereYear('created_at', $month->year)
    //             ->whereMonth('created_at', $month->month)
    //             ->sum('amount');

    //         $months[] = [
    //             'month' => $monthName,
    //             'amount' => round($monthlyTotal, 2),
    //         ];
    //     }

    //     return $months;
    // }

    // private function getCurrencySymbol($currency)
    // {
    //     $symbols = [
    //         'GBP' => '£',
    //         'USD' => '$',
    //         'EUR' => '€',
    //         'JPY' => '¥',
    //         'CAD' => 'C$',
    //         'AUD' => 'A$',
    //         'CNY' => '¥',
    //         'INR' => '₹',
    //     ];

    //     return $symbols[strtoupper($currency)] ?? '£';
    // }
}
