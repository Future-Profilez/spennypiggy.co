<?php

namespace App\Http\Controllers\Auth;

use App\Helpers;
use App\Http\Controllers\Controller;
use App\Jobs\CheckoutMailToUser;
use App\Jobs\CheckoutTweet;
use App\Jobs\CrowdfundTweet;
use App\Jobs\SurpriseTweet;
use App\Models\Currency;
use App\Models\FinancialTransaction;
use App\Models\StripePaymentDetail;
use App\Models\StripePaymentItems;
use App\Models\Subscription;
use App\Models\User;
use App\Models\UserCart;
use App\Models\UserPayment;
use App\Models\Deliverable;
use App\Services\StripeMetadataService;
use App\StripeControl;
use Carbon\Carbon;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Session;
use Inertia\Inertia;
use Ramsey\Uuid\Uuid;
use Stripe\Stripe;
use App\Services\CreatorActivityService;
use App\Services\CreatorSubscriptionService;
use App\Notifications\PaymentBlockedNotification;
use App\Notifications\SubscriptionBlockedNotification;
use App\Services\UserProfileService;
use Illuminate\Support\Str;
use App\Traits\RiskEnforcement;

class CheckoutController extends Controller
{
    use RiskEnforcement;

    protected $userProfileService;
    protected $riskEngine;

    public function __construct(UserProfileService $userProfileService, \App\Services\Risk\RiskEngineService $riskEngine)
    {
        $this->userProfileService = $userProfileService;
        $this->riskEngine = $riskEngine;
    }

    /* create checkout */
    public function createCheckout($creator_id, $user_id_or_device = null)
    {
        request()->validate([
            'digital_waiver' => ['required', 'accepted'],
        ]);

        $debugId = request()->query('debug_id');
        if (!empty($debugId)) {
            Log::info('Cart checkout debug start', [
                'debug_id' => $debugId,
                'creator_id' => $creator_id,
                'user_id' => Auth::id(),
                'device_id' => request()->get('device_id') ?? session()->getId(),
                'has_turnstile' => request()->has('cf_turnstile_response'),
                'ip' => request()->ip(),
            ]);
        }

        $checkGifterStatus = Helpers::checkGifterCardVerificationStatus();
        Log::info('Gifter card verification status', ['status' => $checkGifterStatus]);
        if ($checkGifterStatus == true) {
            $user = Auth::user();
            Log::info('Redirecting for card verification', ['user_id' => $user->id]);
            return to_route('user.show', ['username' => $user->username])->with("error", "⚠️ Please complete your card verification payment and wait for admin approval before making further payments.");
        }

        $user = Auth::user();
        try {
            if (!empty(request()->query('message'))) {
                $wordLimit = 100;
                $message = request()->query('message');

                if (str_word_count($message) > $wordLimit) {
                    if (!empty($debugId)) {
                        Log::info('Cart checkout debug: message word limit', ['debug_id' => $debugId]);
                    }
                    return redirect()->back()->with("error", "Max limit for message is 100 words");
                }
            }

            // Get cart data filtered by specific creator
            if (Auth::check()) {
                // For authenticated users, filter by user_id AND owner_id (creator_id)
                $getdata = UserCart::where('user_id', Auth::id())
                    ->where('owner_id', $creator_id)  // Filter by specific creator
                    ->where('status', 1)
                    ->with(['wish', 'owner'])
                    ->get();
                $device_id = request()->get('device_id') ?? session()->getId();
            } else {
                // For guests, filter by device_id AND owner_id (creator_id)
                $device_id = $user_id_or_device ?? request()->get('device_id');

                if (!$device_id) {
                    if (!empty($debugId)) {
                        Log::info('Cart checkout debug: missing device id', ['debug_id' => $debugId]);
                    }

                    return redirect()->back()->with('error', 'Device ID is required for guest checkout.');
                }

                $getdata = UserCart::where('device_id', $device_id)
                    ->where('owner_id', $creator_id)  // Filter by specific creator
                    ->where('status', 1)
                    ->with(['wish', 'owner'])
                    ->get();
            }

            if ($getdata->isEmpty()) {
                if (!empty($debugId)) {
                    Log::info('Cart checkout debug: empty cart for creator', ['debug_id' => $debugId]);
                }
                return redirect()->back()->with('error', 'No items in cart to checkout for this creator.');
            }

            // Get creator by ID
            $owner = User::find($creator_id);
            if (!$owner) {
                if (!empty($debugId)) {
                    Log::info('Cart checkout debug: creator not found', ['debug_id' => $debugId]);
                }
                return redirect()->back()->with('error', 'Creator not found.');
            }
            

            // Client Requirement: Always charge in Creator's Currency
            $chargeCurrency = strtolower($owner->default_currency ?? 'gbp');

            // Calculate preliminary total for activity check notification
            $preliminaryTotal = $getdata->sum(function ($item) {
                return $item->amount * $item->quantity;
            });

            // NEW: Check creator subscription eligibility first
            $subscriptionCheck = app(CreatorSubscriptionService::class)->validateCreatorSubscription($owner);

            if (!$subscriptionCheck['eligible']) {
                // Send notification to creator about blocked payment
                $owner->notify(new SubscriptionBlockedNotification($subscriptionCheck, $preliminaryTotal));

                // Return user-friendly error to fan
                return redirect()->back()->with(
                    'error',
                    app(\App\Services\CreatorAvailabilityMessageService::class)->supporterMessage($subscriptionCheck, null)
                );
            }

            // Check creator activity eligibility
            $activityCheck = app(CreatorActivityService::class)->validateCreatorActivity($owner);

            if (!$activityCheck['eligible']) {
                // Send notification to creator about blocked payment
                $owner->notify(new PaymentBlockedNotification($activityCheck, $preliminaryTotal));

                // Return user-friendly error to fan
                return redirect()->back()->with(
                    'error',
                    app(\App\Services\CreatorAvailabilityMessageService::class)->supporterMessage(null, $activityCheck)
                );
            }
            if ($activityCheck['status'] !== 'not_creator' && $activityCheck['status'] !== 'not_fully_verified') {
                Log::info('Cart payment allowed - creator activity check passed', [
                    'creator_id' => $owner->id,
                    'creator_username' => $owner->username,
                    'activity_status' => $activityCheck['status'],
                    'content_count' => $activityCheck['content_count'] ?? 0
                ]);
            }

            // Get currency metadata to handle zero-decimal currencies properly
            $currencyModel = Currency::where('ISO', strtoupper($chargeCurrency))->first();
            $multiplier = ($currencyModel && $currencyModel->ISOdigits == 0) ? 1 : 100;
            $precision = $multiplier === 1 ? 0 : 2;

            // Initialize connectedAccountId outside the loop to avoid undefined variable error
            $connectedAccountId = null;

            // Find the first valid cart item to get the connected account ID
            foreach ($getdata as $item) {
                if ($item->wish_item_id && $item->wish && $item->owner && $item->owner->account_id) {
                    $connectedAccountId = $item->owner->account_id;
                    break;
                }
            }

            // If no valid connected account ID found, return error
            if (!$connectedAccountId) {
                Log::error('No valid connected account ID found for checkout', [
                    'creator_id' => $creator_id,
                    'cart_items' => $getdata->pluck('id', 'wish_item_id'),
                    'user_id' => Auth::id()
                ]);
                return redirect()->back()->with('error', 'Unable to process payment. Please check your cart and try again.');
            }

            if (!StripeControl::hasCardPaymentsCapability($connectedAccountId)) {
                $stripeCheck = ['eligible' => false, 'status' => 'stripe_disabled'];
                return redirect()->back()->with('error', app(\App\Services\CreatorAvailabilityMessageService::class)->supporterMessage(null, null, $stripeCheck));
            }

            // Log the connected account ID for debugging
            Log::info('Connected account ID found for checkout', [
                'connected_account_id' => $connectedAccountId,
                'creator_id' => $creator_id,
                'owner_username' => $owner->username ?? 'unknown'
            ]);

            $lineItems = [];
            $subtotal = 0;
            $totalApplicationFee = 0;
            $totalCreatorNet = 0;
            $grandTotalSupporterPays = 0;
            $grandTotalCreatorTransfer = 0;

            $totalNetToGrossUp = 0;
            $lineItems = [];

            foreach ($getdata as $dd) {
                // Skip cart items without valid wish relationship
                if (!$dd->wish_item_id || !$dd->wish) {
                    Log::warning('Skipping cart item without valid wish', [
                        'cart_id' => $dd->id,
                        'wish_item_id' => $dd->wish_item_id,
                        'user_id' => $dd->user_id
                    ]);
                    continue;
                }

                if (!$user) {
                    $email = request()->query('email');
                    $user = User::where('email', $email)->first();
                    if (!$user) {
                        $user = null;
                    }
                }

                $itemAmount = $dd->amount;

                // Calculate VAT if applicable (Client Rule: Add VAT before other fees)
                $vatPercent = $dd->owner->vat_amount_percentage ?? 0;
                $vatAmount = $itemAmount * $vatPercent / 100;
                $itemAmountWithVat = $itemAmount + $vatAmount;

                // Accumulate net amount for batch gross-up (one fixed fee per transaction)
                $totalNetToGrossUp += $itemAmountWithVat * $dd->quantity;

                // Accumulate base totals
                $subtotal += $itemAmount * $dd->quantity;
                $grandTotalCreatorTransfer += $itemAmountWithVat * $dd->quantity;
            }

            // Calculate optimized breakdown for the entire cart group
            $breakdown = Helpers::calculateStripeDirectChargeFlow($totalNetToGrossUp, $chargeCurrency);
            $grandTotalSupporterPays = $breakdown['total_supporter_pays'];
            $totalApplicationFee = $breakdown['application_fee'];
            $totalCreatorNet = $breakdown['net_to_creator'];

            // Since Stripe Checkout line items must add up to the total, we need to adjust
            // We'll use one line item for the whole cart to ensure the gross-up total is exact
            $lineItems = [[
                'quantity' => 1,
                'price_data' => [
                    'currency' => $chargeCurrency,
                    'product_data' => [
                        'name' => "Total Basket for " . ($owner->name ?? 'Creator'),
                        'description' => "Includes platform and processing fees",
                    ],
                    'unit_amount' => (int) round($grandTotalSupporterPays * $multiplier),
                ]
            ]];

            // Check if we have any valid line items after processing
            if (empty($lineItems)) {
                Log::error('No valid line items found after processing cart', [
                    'creator_id' => $creator_id,
                    'cart_items_count' => $getdata->count(),
                    'user_id' => Auth::id()
                ]);
                return redirect()->back()->with('error', 'Your cart contains no valid items. Please add items and try again.');
            }

            // Check if creator has card_payments capability
            if (!StripeControl::hasCardPaymentsCapability($connectedAccountId)) {
                return redirect()->back()->with('error', 'This creator cannot receive direct payments at the moment.');
            }

            // Unified Risk Enforcement
            $riskData = $this->enforceRiskChecks(
                request(),
                $owner,
                $grandTotalSupporterPays,
                $chargeCurrency,
                'cart_checkout',
                false // redirect response
            );

            // If it's a redirect (blocked, step_up, login required), return it immediately
            if ($riskData instanceof \Illuminate\Http\RedirectResponse) {
                return $riskData;
            }

            // Check if we need to force 3DS
            $force3ds = in_array('FORCE_3DS', $riskData['reason_codes'] ?? []);

            // Direct Charges Implementation
            $paymentIntentData = [
                'description' => "Spenny Piggy - Content purchase for {$owner->name} (Total value including all fees)",
                'metadata' => $this->buildSafeMetadata($owner, $getdata, $totalCreatorNet),
                'application_fee_amount' => (int) round($totalApplicationFee * $multiplier),
            ];

            Log::info('Using Direct Charges for cart checkout', [
                'creator_id' => $creator_id,
                'connected_account_id' => $connectedAccountId,
                'application_fee_amount' => $paymentIntentData['application_fee_amount'],
                'total_charge' => $grandTotalSupporterPays
            ]);

            $payload = [
                'success_url' => route('checkout.success', [$creator_id]),
                'cancel_url' => route('checkout.cancel', [$creator_id]),
                "mode"  =>  "payment",
                'line_items' => $lineItems, // This determines the total amount automatically
                'payment_intent_data' => $paymentIntentData,
                'customer_email' =>  $getdata[0]->user->email ?? request()->query('email'),
            ];

            // Ensure receipt_email is set in payment_intent_data for Stripe receipts
            if ($payload['customer_email']) {
                $payload['payment_intent_data']['receipt_email'] = $payload['customer_email'];
            }

            // Validate payload before sending to Stripe
            $validationError = $this->validateStripePayload($payload);
            if ($validationError) {
                Log::error("Stripe payload validation failed: " . $validationError);
                return redirect()->back()->with('error', 'Payment configuration error. Please try again.');
            }

            try {
                // Direct Charge: create session on CONNECTED account
                $sessionCreate = StripeControl::createCheckoutSession($payload, $connectedAccountId, $force3ds, $owner->username);
            } catch (\Stripe\Exception\InvalidRequestException $e) {
                Log::error("Stripe Checkout Error: " . $e->getMessage(), [
                    'error_body' => $e->getJsonBody(),
                    'error_type' => $e->getError()->type ?? 'unknown',
                    'error_code' => $e->getError()->code ?? 'unknown',
                    'error_param' => $e->getError()->param ?? 'unknown',
                    'payload_summary' => [
                        'mode' => $payload['mode'] ?? 'missing',
                        'line_items_count' => count($payload['line_items'] ?? []),
                        'has_payment_intent_data' => isset($payload['payment_intent_data']),
                        'metadata_count' => isset($payload['payment_intent_data']['metadata']) ? count($payload['payment_intent_data']['metadata']) : 0
                    ]
                ]);
                return redirect()->back()->with('error', 'Payment configuration error. Please contact support if this persists.');
            } catch (\Exception $e) {
                Log::error("General Checkout Error: " . $e->getMessage(), [
                    'error_class' => get_class($e),
                    'error_trace' => $e->getTraceAsString(),
                    'payload_mode' => $payload['mode'] ?? 'missing',
                    'line_items_present' => isset($payload['line_items']),
                    'creator_id' => $creator_id,
                    'user_id' => Auth::id()
                ]);
                return redirect()->back()->with('error', 'Checkout failed: ' . $e->getMessage());
            }

            session()->forget('session_id');
            session(['session_id' => $sessionCreate->id]);

            try {
                $rawAmountMinor = (int) ($sessionCreate->amount_total ?? (int) round($grandTotalSupporterPays * $multiplier));
                $creatorNetMinor = (int) round($totalCreatorNet * $multiplier);
                
                $metrics = app(\App\Services\Risk\RiskService::class)->recalculateMetrics((string) $owner->uuid);
                $reserveRate = (int) ($metrics->reserve_percent ?? 0);
                
                // Calculate reserve based on the creator's share (Net Amount)
                $reserveMinor = $reserveRate > 0 ? (int) round(($creatorNetMinor * $reserveRate) / 100) : 0;
                
                \App\Models\Payment::create([
                    'creator_id' => $owner->uuid,
                    'risk_identity_id' => $riskData['risk_identity_id'],
                    'amount' => app(\App\Services\Risk\MoneyNormalizer::class)->toGbpMinor($rawAmountMinor, (string) strtoupper($chargeCurrency)),
                    'reserve_amount_minor' => app(\App\Services\Risk\MoneyNormalizer::class)->toGbpMinor($reserveMinor, (string) strtoupper($chargeCurrency)),
                    'currency' => 'gbp',
                    'stripe_session_id' => $sessionCreate->id,
                    'stripe_payment_intent_id' => $sessionCreate->payment_intent ?? null,
                    'status' => 'initiated',
                    'reason_codes' => $riskData['reason_codes'] ?? [],
                ]);
            } catch (\Exception $e) {
                Log::error('Risk Ledger: Failed to record checkout session payment', [
                    'session_id' => $sessionCreate->id ?? null,
                    'error' => $e->getMessage(),
                ]);
            }

            // Store device_id for guest checkouts to enable cart retrieval in success callback
            if (!Auth::check() && isset($device_id)) {
                session(['device_id' => $device_id]);
                Log::info('Stored device_id in session for guest checkout', ['device_id' => $device_id]);
            }

            // Build comprehensive metadata for storage
            $paymentMetadata = [
                'wish_items' => json_decode($this->buildWishItemsMetadata($getdata), true),
                'content_urls' => json_decode($this->buildContentUrlsMetadata($getdata), true),
                'delivery_summary' => $this->buildDeliverySummary($getdata),
                'created_at' => now()->toISOString(),
                'creator_info' => [
                    'id' => $owner->id,
                    'username' => $owner->username,
                    'name' => $owner->name
                ]
            ];

            $stripePaymentDetail = StripePaymentDetail::create([
                'session_id' => $sessionCreate->id,
                'stripe_payment_intent_id' => $sessionCreate->payment_intent ?? null,
                'amount_subtotal' => $subtotal,
                'amount_total' => $sessionCreate->amount_total / $multiplier,
                'tax' => $totalApplicationFee,
                'currency' => $getdata[0]->owner->default_currency,
                'payment_method_config_detail_id' => optional($sessionCreate->payment_method_configuration_details)->id,
                'payment_method_type' => optional($sessionCreate->payment_method_types)[0],
                'user_id' => Auth::id() ?? null,
                'owner_id' => $getdata[0]->owner->id,
                'name' => request()->query('from') ?? '',
                'guest_email' => request()->query('email') ?? ($getdata[0]->user->email ?? null),
                'message' => $message ?? '',
                'anonymous' => request()->query('anonymous') ?? 0,
                'session_created' => $sessionCreate->created,
                'session_expires_at' => $sessionCreate->expires_at,
                'metadata' => json_encode($paymentMetadata),
                'created_at' => now(),
                'updated_at' => now(),
            ]);

            Helpers::applyDigitalWaiver($stripePaymentDetail, (bool) request()->digital_waiver);
            $stripePaymentDetail->save();

            $stripePaymentDetail->refresh();

            return Inertia::location($sessionCreate->url);
        } catch (\Throwable $th) {
            Log::error("Error in createCheckout: " . $th->getMessage());
            throw $th;
        }
    }

    /**
     * Validate Stripe payload before sending to API
     */
    private function validateStripePayload($payload)
    {
        try {
            // Required fields
            $requiredFields = ['success_url', 'cancel_url', 'mode', 'line_items'];

            foreach ($requiredFields as $field) {
                if (!isset($payload[$field]) || empty($payload[$field])) {
                    return "Missing required field: {$field}";
                }
            }

            // Validate mode
            if (!in_array($payload['mode'], ['payment', 'setup', 'subscription'])) {
                return "Invalid mode: {$payload['mode']}";
            }

            // Validate line items
            if (!is_array($payload['line_items']) || empty($payload['line_items'])) {
                return "line_items must be a non-empty array";
            }

            // Validate each line item
            foreach ($payload['line_items'] as $index => $lineItem) {
                if (!is_array($lineItem)) {
                    return "Line item {$index} must be an array";
                }

                if (!isset($lineItem['quantity']) || !is_numeric($lineItem['quantity'])) {
                    return "Line item {$index} missing valid quantity";
                }

                if (!isset($lineItem['price_data']) || !is_array($lineItem['price_data'])) {
                    return "Line item {$index} missing valid price_data";
                }

                $priceData = $lineItem['price_data'];
                if (!isset($priceData['currency']) || !isset($priceData['product_data']) || !is_array($priceData['product_data'])) {
                    return "Line item {$index} price_data missing currency or product_data";
                }

                if (!isset($priceData['unit_amount']) && !isset($priceData['unit_amount_decimal'])) {
                    return "Line item {$index} price_data missing unit_amount or unit_amount_decimal";
                }
            }

            // Validate payment_intent_data if present
            if (isset($payload['payment_intent_data'])) {
                if (!is_array($payload['payment_intent_data'])) {
                    return "payment_intent_data must be an array";
                }



                // Validate metadata if present
                if (isset($payload['payment_intent_data']['metadata'])) {
                    if (!is_array($payload['payment_intent_data']['metadata'])) {
                        return "metadata must be an array";
                    }

                    // Check metadata key/value constraints
                    foreach ($payload['payment_intent_data']['metadata'] as $key => $value) {
                        if (!is_string($key) || !is_string($value)) {
                            return "metadata keys and values must be strings";
                        }
                        if (strlen($key) > 40) {
                            return "metadata key '{$key}' exceeds 40 character limit";
                        }
                        if (strlen($value) > 500) {
                            return "metadata value for '{$key}' exceeds 500 character limit";
                        }
                    }

                    // Check total metadata count (Stripe limit: 50 keys)
                    if (count($payload['payment_intent_data']['metadata']) > 50) {
                        return "metadata exceeds 50 key limit";
                    }
                }
            }

            Log::info('Stripe payload validation passed', [
                'line_items_count' => count($payload['line_items']),
                'mode' => $payload['mode'],
                'has_payment_intent_data' => isset($payload['payment_intent_data']),
                'has_metadata' => isset($payload['payment_intent_data']['metadata'])
            ]);

            return null; // No validation errors

        } catch (\Exception $e) {
            Log::error('Error during payload validation: ' . $e->getMessage());
            return "Payload validation error: " . $e->getMessage();
        }
    }

    /**
     * Build NEW FLATTENED metadata format for checkout - implements NEW_STRIPE_METADATA_FORMAT.md
     */
    private function buildSafeMetadata($owner, $getdata, $totalCreatorNet)
    {
        try {
            // Build basic payment info - REQUIRED fields
            $metadata = [
                'platform' => 'SpennyPiggy',
                'created_at' => now()->toISOString(),
                'updated_at' => now()->toISOString(),
                'creator_id' => (string) $owner->id,
                'creator_name' => $owner->name ?? 'Unknown Creator',
                'creator_username' => $owner->username ?? 'unknown',
                'creator_profile_url' => route('user.show', $owner->username),
            ];

            // Add buyer info if available
            $buyerId = Auth::id();
            $buyerName = request()->query('from') ?? (Auth::user()->name ?? 'Anonymous');
            $buyerEmail = request()->query('email') ?? (Auth::user()->email ?? 'anonymous@spennypiggy.co');
            $buyerUsername = Auth::user()->username ?? 'guest';

            $metadata['buyer_id'] = (string) $buyerId;
            $metadata['buyer_name'] = $buyerName;
            $metadata['buyer_email'] = $buyerEmail;
            $metadata['buyer_username'] = $buyerUsername;
            $metadata['gifter_profile_url'] = $buyerId ? route('user.show', $buyerUsername) : 'N/A';

            $metadata['digital_waiver_confirmed_at'] = now()->toDateTimeString();
            $metadata['digital_waiver_text'] = Helpers::DIGITAL_WAIVER_TEXT;

            // Payment details - REQUIRED fields
            $metadata['payment_type'] = 'Support Payment - Direct Charge';
            $metadata['product_type'] = 'wish_one_off';
            $metadata['quantity'] = (string) array_sum(array_column($getdata->toArray(), 'quantity'));
            $metadata['items_count'] = (string) count($getdata);
            $metadata['creator_net_amount'] = (string) ($totalCreatorNet * 100); // Amount in cents

            // Content delivery status - REQUIRED field
            $contentItems = [];
            $hasContent = false;

            $vatPercent = (float) ($owner->vat_amount_percentage ?? 0);

            foreach ($getdata as $item) {
                $wish = $item->wish;
                if (!$wish) continue;

                $itemVat = round(((float) $item->amount * $vatPercent) / 100, 2);

                $contentUrl = null;
                $contentType = 'file';
                $source = 'content_file';

                // Priority: content_file → reward
                if (!empty($wish->content_file)) {
                    $contentUrl = $this->generateContentUrl($wish->content_file);
                    $contentType = $wish->content_file_type ?? 'file';
                    $source = 'content_file';
                    $hasContent = true;
                } elseif (!empty($wish->reward)) {
                    $contentUrl = $this->generateContentUrl($wish->reward);
                    $contentType = 'image';
                    $source = 'reward';
                    $hasContent = true;
                }

                $contentItems[] = [
                    'wish_id' => $wish->id,
                    'wish_name' => $wish->wishname ?? 'Unknown Wish',
                    'content_url' => $contentUrl,
                    'content_type' => $contentType,
                    'source' => $source,
                    'amount' => $item->amount,
                    'quantity' => $item->quantity,
                    'tax' => $item->tax,
                    'vat_amount' => $itemVat
                ];
            }

            // Content summary - REQUIRED fields
            $metadata['has_content'] = $hasContent ? 'true' : 'false';
            $metadata['content_items_count'] = (string) count($contentItems);
            $metadata['content_delivery_status'] = 'delivered'; // STATIC: Always delivered

            // Certificate field - REQUIRED - STATIC: Always true
            $metadata['certificate'] = 'true';
            $metadata['delivery_status'] = 'delivered'; // STATIC: Always delivered

            // Deliverable type - REQUIRED
            $primaryWish = $getdata[0]->wish ?? null;
            if ($primaryWish) {
                if (!empty($primaryWish->content_file)) {
                    $metadata['deliverable_type'] = 'content_file';
                } elseif (!empty($primaryWish->reward)) {
                    $metadata['deliverable_type'] = 'reward';
                } else {
                    $metadata['deliverable_type'] = 'no_content';
                }
            }

            // Flatten individual content items - item_1_*, item_2_*, etc.
            foreach ($contentItems as $index => $item) {
                $itemNum = $index + 1;
                $prefix = "item_{$itemNum}_";

                $metadata[$prefix . 'wish_id'] = (string) $item['wish_id'];
                $metadata[$prefix . 'wish_name'] = substr($item['wish_name'], 0, 100); // Stripe limit
                $metadata[$prefix . 'amount'] = (string) $item['amount'];
                $metadata[$prefix . 'quantity'] = (string) $item['quantity'];
                $metadata[$prefix . 'tax'] = (string) ($item['tax'] ?? 0);
                $metadata[$prefix . 'vat_amount'] = (string) ($item['vat_amount'] ?? 0);

                if (!empty($item['content_url'])) {
                    $metadata[$prefix . 'content_url'] = $item['content_url'];
                    $metadata[$prefix . 'content_type'] = $item['content_type'];
                    $metadata[$prefix . 'content_source'] = $item['source'];
                }
            }

            // Build backward compatibility JSON - clean format
            if (!empty($contentItems)) {
                $cleanContentUrls = [];
                foreach ($contentItems as $item) {
                    if (!empty($item['content_url'])) {
                        $cleanContentUrls[] = [
                            'wish_id' => $item['wish_id'],
                            'wish_name' => $item['wish_name'],
                            'content_url' => $item['content_url'],
                            'content_type' => $item['content_type'],
                            'source' => $item['source']
                        ];
                    }
                }

                if (!empty($cleanContentUrls)) {
                    $metadata['content_urls'] = json_encode($cleanContentUrls);
                }
            }

            // Build wish items summary (clean JSON format)
            $wishItemsSummary = [
                'total_items' => count($getdata),
                'total_amount' => $totalCreatorNet,
                'wish_ids' => [],
                'wish_names' => []
            ];

            foreach ($getdata as $item) {
                if ($item->wish) {
                    $wishItemsSummary['wish_ids'][] = $item->wish->id;
                    $wishItemsSummary['wish_names'][] = $item->wish->wishname ?? 'Unknown';
                }
            }

            $metadata['wish_items_summary'] = json_encode($wishItemsSummary);

            // Add full wish items list for reconstruction if needed
            $fullWishItems = [];
            foreach ($getdata as $item) {
                if ($item->wish) {
                    $fullWishItems[] = [
                        'wish_id' => $item->wish->id,
                        'wish_name' => $item->wish->wishname ?? 'Item',
                        'amount' => (float) $item->amount,
                        'quantity' => (int) $item->quantity,
                        'tax' => (float) ($item->tax ?? 0),
                        'vat_amount' => (float) ($item->vat_amount ?? 0),
                    ];
                }
            }
            $metadata['wish_items'] = json_encode($fullWishItems);

            // Ensure all values are strings and within Stripe limits
            foreach ($metadata as $key => $value) {
                if (!is_string($value)) {
                    $metadata[$key] = (string) $value;
                }
                // Check Stripe limits
                if (strlen($metadata[$key]) > 500) {
                    $metadata[$key] = substr($metadata[$key], 0, 497) . '...';
                    Log::warning('Checkout metadata value truncated (NEW FORMAT)', ['key' => $key]);
                }
            }

            Log::info('Successfully built NEW FLATTENED checkout metadata', [
                'metadata_count' => count($metadata),
                'content_items' => count($contentItems),
                'has_content' => $hasContent,
                'total_items' => count($getdata)
            ]);

            return $metadata;
        } catch (\Exception $e) {
            Log::error('Error building NEW FLATTENED checkout metadata: ' . $e->getMessage());

            // Return minimal safe metadata as fallback
            return [
                'platform' => 'SpennyPiggy',
                'product_type' => 'wish_one_off',
                'creator_id' => (string) $owner->id,
                'items_count' => (string) count($getdata),
                'has_content' => 'false',
                'content_items_count' => '0',
                'content_delivery_status' => 'pending',
                'certificate' => 'false',
                'error' => 'metadata_generation_failed'
            ];
        }
    }


    /**
     * Build content URLs metadata for Stripe - handles multiple wish items with content
     */
    private function buildContentUrlsMetadata($cartItems)
    {
        $contentUrls = [];

        foreach ($cartItems as $item) {
            $wish = $item->wish;
            if (!$wish) continue;

            $wishContentData = [
                'wish_id' => $wish->id,
                'wish_name' => $wish->wishname,
                'has_content' => false,
                'content_url' => null,
                'content_type' => null,
                'delivery_status' => 'pending',
                'source' => null
            ];

            // Priority: content_file → reward → message_media (for future thank-you messages)
            if (!empty($wish->content_file)) {
                $wishContentData['has_content'] = true;
                $wishContentData['content_url'] = $this->generateContentUrl($wish->content_file);
                $wishContentData['content_type'] = $wish->content_file_type ?? 'file';
                $wishContentData['delivery_status'] = 'ready'; // Content files are immediately available
                $wishContentData['source'] = 'content_file';
            } elseif (!empty($wish->reward)) {
                $wishContentData['has_content'] = true;
                $wishContentData['content_url'] = $this->generateContentUrl($wish->reward);
                $wishContentData['content_type'] = 'image';
                $wishContentData['delivery_status'] = 'ready'; // Rewards are immediately available
                $wishContentData['source'] = 'reward';
            }

            $contentUrls[] = $wishContentData;
        }

        // Return as JSON string to fit in Stripe metadata limits
        return json_encode($contentUrls);
    }

    /**
     * Build wish items metadata for Stripe - comprehensive item details
     */
    private function buildWishItemsMetadata($cartItems)
    {
        $wishItems = [];

        foreach ($cartItems as $item) {
            $wish = $item->wish;
            if (!$wish) continue;

            $wishItems[] = [
                'wish_id' => $wish->id,
                'wish_name' => $wish->wishname,
                'quantity' => $item->quantity,
                'amount' => $item->amount,
                'cart_id' => $item->id,
                'has_reward' => !empty($wish->reward),
                'has_content_file' => !empty($wish->content_file),
                'content_file_type' => $wish->content_file_type ?? null,
                'subscription_type' => $wish->subscription ?? 0
            ];
        }

        return json_encode($wishItems);
    }

    /**
     * DEPRECATED: Build clean wish items metadata to avoid duplication with individual content keys
     * This function is no longer used - metadata is now built using refined structures
     * Preserved for reference only - can be removed in future cleanup
     */
    /*
    private function buildCleanWishItemsMetadata($cartItems)
    {
        $summary = [
            'total_items' => count($cartItems),
            'total_amount' => 0,
            'wish_ids' => [],
            'wish_names' => []
        ];
        
        foreach ($cartItems as $item) {
            $wish = $item->wish;
            if (!$wish) continue;
            
            $summary['total_amount'] += $item->amount * $item->quantity;
            $summary['wish_ids'][] = $wish->id;
            $summary['wish_names'][] = $wish->wishname;
        }
        
        return json_encode($summary);
    }
    */

    /**
     * Generate content URL from file path/identifier
     */
    private function generateContentUrl($fileIdentifier)
    {
        if (empty($fileIdentifier)) {
            return null;
        }

        // Handle Uploadcare URLs
        if (str_starts_with($fileIdentifier, 'https://ucarecdn.com/')) {
            return $fileIdentifier;
        }

        // Handle Uploadcare UUIDs
        if (preg_match('/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i', $fileIdentifier)) {
            return "https://ucarecdn.com/{$fileIdentifier}/";
        }

        // Handle relative paths or other formats
        if (str_starts_with($fileIdentifier, '/')) {
            return url($fileIdentifier);
        }

        // Default: assume it's a filename in storage
        return asset('storage/' . $fileIdentifier);
    }

    /**
     * Build delivery summary for comprehensive tracking
     */
    private function buildDeliverySummary($cartItems)
    {
        $summary = [
            'total_items' => count($cartItems),
            'items_with_content' => 0,
            'items_ready_for_delivery' => 0,
            'items_pending_approval' => 0,
            'content_types' => [],
            'delivery_methods' => []
        ];

        foreach ($cartItems as $item) {
            $wish = $item->wish;
            if (!$wish) continue;

            $hasContent = false;
            $contentType = null;

            // Check for content and determine delivery status
            if (!empty($wish->content_file)) {
                $hasContent = true;
                $contentType = $wish->content_file_type ?? 'file';
                $summary['items_ready_for_delivery']++;
            } elseif (!empty($wish->reward)) {
                $hasContent = true;
                $contentType = 'image';
                $summary['items_ready_for_delivery']++;
            }

            if ($hasContent) {
                $summary['items_with_content']++;
                if ($contentType && !in_array($contentType, $summary['content_types'])) {
                    $summary['content_types'][] = $contentType;
                }
            }
        }

        // Determine primary delivery method
        if ($summary['items_with_content'] > 0) {
            $summary['delivery_methods'][] = 'email_with_attachments';
            $summary['primary_delivery_method'] = 'email_with_content';
        } else {
            $summary['primary_delivery_method'] = 'thank_you_email_only';
        }

        return $summary;
    }


    public function successCheckout($id)
    {
        $currency = !empty(request()->cookie('currency')) ? strtolower(request()->cookie('currency')) : 'gbp';

        // Get the payment record to determine how to query cart items
        $sessionId = session('session_id');
        $paymentRecord = StripePaymentDetail::where('session_id', $sessionId)->first();

        if (Auth::check()) {
            $getdata = UserCart::where('user_id', Auth::id())->where('owner_id', $id)->where('status', 1)->with(['wish', 'owner', 'user'])->get();
        } else {
            // For guest checkouts, we need to find the cart items by matching the payment details
            // The $id parameter is the creator_id, not device_id
            if ($paymentRecord && $paymentRecord->guest_email) {
                // Try to find cart items by matching guest email and owner_id from the payment record
                $getdata = UserCart::where('owner_id', $paymentRecord->owner_id)
                    ->where('status', 1)
                    ->whereNull('user_id') // Guest cart items
                    ->with(['wish', 'owner', 'user'])
                    ->get();
            } else {
                // Fallback: try to find by device_id from session or other means
                $deviceId = session('device_id') ?? request()->get('device_id');
                if ($deviceId) {
                    $getdata = UserCart::where('device_id', $deviceId)
                        ->where('owner_id', $id)
                        ->where('status', 1)
                        ->with(['wish', 'owner', 'user'])
                        ->get();
                } else {
                    $getdata = collect(); // Empty collection
                }
            }
        }
        try {
            // Check if payment has already been processed to avoid race condition with webhook
            $sessionId = session('session_id');
            Log::info("successCheckout called", [
                'session_id' => $sessionId,
                'creator_id' => $id,
                'user_id' => Auth::id()
            ]);

            $existingPayment = StripePaymentDetail::where('session_id', $sessionId)->first();

            if ($existingPayment) {
                Log::info("Found existing payment", [
                    'session_id' => $sessionId,
                    'payment_status' => $existingPayment->payment_status,
                    'payment_id' => $existingPayment->id
                ]);

                // Only return early if the payment is marked as paid AND we have already created the payment items
                // This prevents race conditions where the webhook marks the payment as paid but doesn't create the items
                $hasItems = StripePaymentItems::where('stripe_payment_detail_id', $existingPayment->id)->exists();
                
                if ($existingPayment->payment_status === 'paid' && $hasItems) {
                    Log::info("Payment and items already processed", ['session_id' => $sessionId]);
                    if ($existingPayment->owner) {
                        $this->userProfileService->clearUserCaches($existingPayment->owner->username, $existingPayment->owner->id);
                        app(\App\Services\DiscoveryService::class)->clearDiscoveryCache();
                    }
                    return redirect(route('thank-you', [$existingPayment->owner->username]))->with('success', 'Payment Successful.');
                }
                
                Log::info("Payment found but continuing processing", [
                    'status' => $existingPayment->payment_status,
                    'has_items' => $hasItems
                ]);
            } else {
                Log::warning("No existing payment found for session", ['session_id' => $sessionId]);
            }

            foreach ($getdata as $dd) {

                /**************************WISH**PWA**START****************************************************/
                // below is wish pwa for fans

                if (isset($dd->user) && $dd->user->email) {
                    $CreatorName = !empty($dd->owner->name) ? ucfirst($dd->owner->name) : 'A Creator';
                    $titles = "✨ Wish Sent Successfully!";
                    
                    // Format total paid for notification
                    $multiplier = Helpers::isZeroDecimalCurrency($session->currency) ? 1 : 100;
                    $totalPaidAmount = $existingPayment->amount_total ?? (float) ($session->amount_total / $multiplier);
                    $currencySymbol = \App\Models\Currency::where('iso', strtoupper($session->currency))->value('symbol') ?? '£';
                    $formattedTotal = $currencySymbol . number_format($totalPaidAmount, 2);
                    
                    $contents = "You've sent a wish to $CreatorName. Total paid: {$formattedTotal}. They'll be notified right away!";
                    $emails = $dd->user->email ?? null;
                    Helpers::sendNotification($titles, $contents, $emails);
                }

                // below is wish pwa for creator
                $FanName = $dd->user ? ucfirst($dd->user->name) : 'A Fan';
                $title = "🎁 New Wish Received!";
                $content = "$FanName has sent you a paid wish.";
                $email = $dd->owner->email;

                Helpers::sendNotification($title, $content, $email);

                /****************************WISH**PWA**ENDS****************************************************/

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
                            $subscription->user_id = $dd->user_id ?? null;
                            $subscription->owner_id = $dd->owner_id;
                            $subscription->wish_id = $dd->wish_item_id;
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
            }

            $sessionId = session('session_id');

            StripePaymentDetail::where('session_id', $sessionId)->update([
                'payment_status' => 'paid',
                'updated_at' => Carbon::now(),
            ]);

            $stripeid = StripePaymentDetail::where('session_id', $sessionId)->first();

            if (!$stripeid) {
                Log::error("StripePaymentDetail not found after update", ['session_id' => $sessionId]);
                throw new \Exception("Payment record not found for session: " . $sessionId);
            }


            Log::info("Retrieved StripePaymentDetail", [
                'id' => $stripeid->id,
                'session_id' => $stripeid->session_id,
                'payment_status' => $stripeid->payment_status,
                'amount_subtotal' => $stripeid->amount_subtotal ?? 'NULL'
            ]);
            foreach ($getdata as $dd) {
                $vatPercent = $dd->owner->vat_amount_percentage ?? 0;
                $vatAmount = ((float) ($dd->amount ?? 0) * (float) $vatPercent) / 100;
                
                // Recalculate fees to ensure exact tax and total_paid are recorded
                $currency = strtoupper($stripeid->currency ?? 'GBP');
                $breakdown = \App\Helpers::calculateStripeDirectChargeFlow($dd->amount + $vatAmount, $currency);
                $tax = $breakdown['total_fees'];
                $totalPaid = $breakdown['total_supporter_pays'];

                $payment_data = StripePaymentItems::create([
                    'uuid' => Uuid::uuid4(),
                    'stripe_payment_detail_id' => $stripeid->id,
                    'wish_item_id' => $dd->wish_item_id ?? Null,
                    'user_cart_id' => $dd->id,
                    'amount' => $dd->amount,
                    'total_paid' => $totalPaid,
                    'message_media' => $dd->wish ? ($dd->wish->reward ?? null) : null,
                    'media_type' => ($dd->wish && !empty($dd->wish->reward)) ? 'image' : null,
                    'thank_you_approved' => ($dd->wish && !empty($dd->wish->reward)) ? 1 : 0,
                    'tax' => $tax,
                    'vat_amount' => $vatAmount,
                    'quantity' => $dd->quantity,
                    'anonymous' => $dd->anonymous ?? false,
                    'message' => $dd->message ?? null
                ]);
                $payment_data->refresh();


                // Update GMV for creator
                Helpers::addGmv($stripeid->owner_id, (float) $stripeid->amount_subtotal, $dd->owner->default_currency);

                Log::info("About to access payment->currency", [
                    'payment_data_id' => $payment_data->id,
                    'stripe_payment_detail_id' => $payment_data->stripe_payment_detail_id
                ]);

                // Check if payment relationship exists
                if (!$payment_data->payment) {
                    Log::error("Payment relationship is null", [
                        'payment_data_id' => $payment_data->id,
                        'stripe_payment_detail_id' => $payment_data->stripe_payment_detail_id
                    ]);
                    throw new \Exception("Payment relationship not found for payment item: " . $payment_data->id);
                }

                Log::info("Payment relationship exists", [
                    'payment_id' => $payment_data->payment->id,
                    'payment_currency' => $payment_data->payment->currency ?? 'NULL'
                ]);

                try {
                    Log::info("About to access payment currency for Currency lookup");
                    Log::info("Payment data details", [
                        'payment_data_id' => $payment_data->id,
                        'stripe_payment_detail_id' => $payment_data->stripe_payment_detail_id,
                        'has_payment_relationship' => $payment_data->payment ? 'yes' : 'no'
                    ]);

                    if (!$payment_data->payment) {
                        Log::error("Payment relationship is null");
                        throw new \Exception("Payment relationship not found");
                    }

                    Log::info("About to access currency property on payment model");
                    $currencyValue = $payment_data->payment->currency;
                    Log::info("Successfully accessed currency value", ['currency' => $currencyValue]);

                    $symbol = Currency::where('iso', strtoupper($currencyValue))->first();
                    Log::info("Currency lookup completed", ['symbol_found' => !is_null($symbol)]);

                    if (!$symbol) {
                        Log::error("Currency not found for ISO: " . strtoupper($currencyValue));
                        return redirect(route('user.show', [$stripeid->owner->username ?? $getdata[0]->owner->username]))->with('error', 'Currency configuration error. Please contact support.');
                    }

                    Log::info("About to calculate VAT percentage");
                    $vat_percentage = $dd->owner ? $dd->owner->vat_amount_percentage : 0; // Default to 0 if not set
                    Log::info("VAT percentage calculated", ['vat_percentage' => $vat_percentage]);

                    Log::info("About to calculate tax");
                    // Use the actual fee breakdown for display (17% platform + 2% compliance + £1 admin)
                    $feeBreakdown = \App\Helpers::calculateStripeDirectChargeFlow((float) $stripeid->amount_subtotal, strtoupper($stripeid->currency ?? 'GBP'));
                    $tax = $feeBreakdown['application_fee'];
                    Log::info("Tax calculated", ['tax' => $tax]);

                    Log::info("About to calculate VAT amount");
                    $vat_amount = (float) $stripeid->amount_subtotal * $vat_percentage / 100;
                    $amountWithVat = $stripeid->amount_subtotal + $vat_amount;
                    Log::info("VAT amount calculated", ['vat_amount' => $vat_amount, 'amountWithVat' => $amountWithVat]);

                    Log::info("About to get message");
                    $message = $stripeid->message;
                    Log::info("Message retrieved", ['message_length' => strlen($message ?? '')]);
                } catch (\Exception $e) {
                    Log::error("Error accessing payment currency", [
                        'error_message' => $e->getMessage(),
                        'error_trace' => $e->getTraceAsString(),
                        'payment_data_id' => $payment_data->id,
                        'stripe_payment_detail_id' => $payment_data->stripe_payment_detail_id
                    ]);
                    throw $e;
                }

                Log::info("Skipping individual CheckoutUser job dispatch - will be handled by consolidated email");
                // NOTE: CheckoutUser jobs have been moved outside the loop to prevent multiple creator emails

                Log::info("Jobs dispatched, continuing with auto_tweet check");

                Log::info("About to check auto_tweet setting");
                if ($dd->owner->auto_tweet == 1) {
                    Log::info("Auto tweet enabled, dispatching tweet jobs");
                    if (empty($dd->wish_item_id)) {
                        Log::info("Dispatching SurpriseTweet job");
                        SurpriseTweet::dispatch($payment_data);
                    } elseif ($dd->wish && $dd->wish->subscription == 2) {
                        Log::info("Dispatching CrowdfundTweet job");
                        CrowdfundTweet::dispatch($payment_data);
                    } else {
                        Log::info("Dispatching CheckoutTweet job");
                        CheckoutTweet::dispatch($payment_data);
                    }
                    Log::info("Tweet job dispatched successfully");
                }

                Log::info("About to create UserPayment record");
                if ($dd->user_id && !empty($dd->user->email)) {
                    Log::info("Creating UserPayment for user", ['user_id' => $dd->user_id]);
                    $total_amount = $dd->amount * $dd->quantity;
                    $creatorCurrency = strtoupper($dd->owner->default_currency ?? ($dd->wish->currency ?? 'GBP'));
                    $chargeCurrency = strtoupper($stripeid->currency ?? $creatorCurrency);
                    $displayCurrency = strtoupper(request()->cookie('currency', 'GBP'));
                    $userPayment = new UserPayment();
                    $userPayment->from_user_id = $dd->user_id ?? null;
                    $userPayment->to_user_id = $dd->owner_id;
                    $userPayment->product_type = 'wish item';
                    $userPayment->amount = $total_amount;
                    $userPayment->total_paid = $total_amount + ($dd->tax * $dd->quantity) + ($vatAmount * $dd->quantity);
                    $userPayment->currency = $dd->wish ? $dd->wish->currency : 'GBP';
                    $userPayment->creator_currency = $creatorCurrency;
                    $userPayment->charge_currency = $chargeCurrency;
                    $userPayment->display_currency = $displayCurrency;
                    $userPayment->payment_method = 'stripe';
                    $userPayment->payment_details = json_encode($sessionId, true);
                    $userPayment->paid_at = Carbon::now();
                    $userPayment->status = $stripeid->payment_status;
                    $userPayment->save();
                    Log::info("UserPayment record created successfully");
                }

                // NEW: Synchronous Deliverable creation for paid wish items
                // This ensures content is tracked even if CheckoutMailToUser job fails
                try {
                    $deliverable = Deliverable::create([
                        'uuid' => (string) Str::uuid(),
                        'product_id' => 'wish_item_' . ($dd->wish_item_id ?? 'direct'),
                        'item_id' => $dd->wish_item_id,
                        'creator_id' => $dd->owner_id,
                        'gifter_id' => $dd->user_id ?? null,
                        'session_id' => $sessionId,
                        'payment_intent_id' => $stripeid->stripe_payment_intent_id ?? null,
                        'deliverable_type' => 'wish_content',
                        'product_type' => 'wish_one_off',
                        'transaction_amount' => $dd->amount,
                        'customer_email' => $stripeid->guest_email ?? ($dd->user->email ?? null),
                        'customer_name' => $stripeid->name ?? ($dd->user->name ?? 'A Fan'),
                        'payment_currency' => strtoupper($stripeid->currency ?? 'GBP'),
                        'status' => 'delivered', // Mark as delivered since payment is successful
                        'metadata' => json_encode([
                            'wish_item_id' => $dd->wish_item_id,
                            'quantity' => $dd->quantity,
                            'creator_net_amount' => $dd->amount - $dd->tax, // Simple calculation as tax is stored per item
                            'message' => $dd->message,
                            'anonymous' => $dd->anonymous ?? false,
                        ])
                    ]);

                    // Update Stripe payment intent metadata
                    if ($stripeid->stripe_payment_intent_id) {
                        try {
                            $stripeMetadataService = app(StripeMetadataService::class);
                            $stripeMetadataService->updateDeliverableMetadata($deliverable, [
                                'wish_processed_at' => now()->toISOString(),
                                'sync_processed' => 'true'
                            ]);
                        } catch (\Throwable $e) {
                            Log::error("Failed to update Stripe metadata in successCheckout", ['error' => $e->getMessage()]);
                        }
                    }
                } catch (\Throwable $e) {
                    Log::error("Failed to create Deliverable in successCheckout", ['error' => $e->getMessage()]);
                }

                Log::info("About to update cart item status");
                $dd->status = 0;
                $dd->quantity = 0;
                $dd->save();
                Log::info("Cart item status updated successfully");

                // Immediately sync to FinancialTransaction so earnings dashboard and support history shows up-to-date
                try {
                    $creator = $dd->owner;
                    $vatPercent = (float) ($creator->vat_amount_percentage ?? 0);
                    $amount = (float) $dd->amount;
                    $vat = round(($amount * $vatPercent) / 100, 2);
                    
                    $currency = strtoupper($stripeid->currency ?? 'GBP');
                    $breakdown = \App\Helpers::calculateStripeDirectChargeFlow($amount + $vat, $currency);
                    $platformFee = $breakdown['application_fee'];
                    $stripeFee = $breakdown['stripe_fee'];

                    $gross = $payment_data->total_paid && $payment_data->total_paid > 0 
                        ? (float) $payment_data->total_paid 
                        : $breakdown['total_supporter_pays'];
                    $creatorAmount = $amount;

                    FinancialTransaction::updateOrCreate(
                        [
                            'source_type' => StripePaymentItems::class,
                            'source_id' => $payment_data->id,
                        ],
                        [
                            'user_id' => $creator->id,
                            'supporter_id' => $stripeid->user_id,
                            'type' => 'income',
                            'gross_amount' => $gross,
                            'platform_fee' => $platformFee,
                            'stripe_fee' => $stripeFee,
                            'vat_amount' => $vat,
                            'net_amount' => $creatorAmount,
                            'currency' => strtoupper($stripeid->currency ?? 'GBP'),
                            'status' => 'completed',
                            'description' => 'Wish Gift: ' . ($dd->wish->wishname ?? 'Item'),
                            'transaction_date' => $payment_data->created_at,
                        ]
                    );
                } catch (\Throwable $e) {
                    Log::error('Failed to sync StripePaymentItems to FinancialTransaction in successCheckout: ' . $e->getMessage(), ['payment_item_id' => $payment_data->id]);
                }
            }


            Log::info("About to dispatch checkout email (authenticated or guest)");
            // Use actual payment currency instead of cookie currency
            $actualCurrency = $stripeid->currency ?? $currency;
            $curr = Currency::where('iso', strtoupper($actualCurrency))->first();
            if ($curr) {
                Log::info("Currency found, dispatching CheckoutMailToUser", ['currency' => $actualCurrency, 'symbol' => $curr->symbol]);
                CheckoutMailToUser::dispatch($stripeid, $curr->symbol);
                Log::info("CheckoutMailToUser job dispatched successfully");
            } else {
                Log::warning("Currency not found for checkout email: " . strtoupper($actualCurrency));
                CheckoutMailToUser::dispatch($stripeid, '£'); // Default fallback
                Log::info("CheckoutMailToUser job dispatched with default symbol");
            }

            // Clear user cache for the creator
            if ($stripeid->owner) {
                $this->userProfileService->clearUserCaches($stripeid->owner->username, $stripeid->owner->id);
            }

            Log::info("About to redirect to thank-you page", ['username' => $stripeid->owner->username]);
            return redirect(route('thank-you', [$stripeid->owner->username]))->with('success', 'Payment Successfull.');
        } catch (\Throwable $th) {
            $errorMessage = $th->getMessage();
            Log::error("Error in successCheckout: " . $errorMessage, [
                'trace' => $th->getTraceAsString(),
                'file' => $th->getFile(),
                'line' => $th->getLine()
            ]);

            // Check if this is a Stripe token error, which we can safely ignore
            if (strpos($errorMessage, 'token was invalid') !== false) {
                Log::info("Ignoring Stripe token error and continuing checkout process");
                // Continue with the checkout process despite the token error
                return redirect(route('thank-you', [$stripeid->owner->username]))->with('success', 'Payment Successful.');
            }

            return redirect(route('user.show', [$stripeid->owner->username ?? $getdata[0]->owner->username]))->with('error', 'Something went wrong!');
        }
    }

    public function cancelCheckout($id)
    {
        Log::info('Cancel checkout called', [
            'creator_id' => $id,
            'is_authenticated' => Auth::check(),
            'auth_user_id' => Auth::id()
        ]);

        if (Auth::check()) {
            $getdata = UserCart::where('user_id', Auth::id())->where('owner_id', $id)->where('status', 1)->with(['wish'])->get();
        } else {
            $getdata = UserCart::where('device_id', $id)->where('status', 1)->with(['wish'])->get();
        }

        Log::info('Cart data found for cancellation', [
            'cart_items_count' => $getdata->count(),
            'creator_id' => $id
        ]);

        $sessionId = session('session_id');
        if ($sessionId) {
            StripePaymentDetail::where('session_id', $sessionId)->update([
                'payment_status' => 'unpaid',
                'updated_at' => Carbon::now(),
            ]);
            Log::info('Payment status updated to unpaid', ['session_id' => $sessionId]);
        }

        // Handle case where no cart data is found
        if ($getdata->isEmpty()) {
            Log::warning('No cart data found for cancel checkout', [
                'creator_id' => $id,
                'is_authenticated' => Auth::check()
            ]);

            // Try to find the creator by ID to get their username
            $creator = User::find($id);
            if ($creator) {
                return redirect(route('user.show', [$creator->username]))->with('error', 'Payment cancelled - no active cart items found.');
            } else {
                // If creator not found, redirect to home or cart
                return redirect(route('cart'))->with('error', 'Payment cancelled.');
            }
        }

        return redirect(route('user.show', [$getdata[0]->owner->username]))->with('error', 'Payment cancelled.');
    }

    /**
     * Debug Checkout - Simple test endpoint
     *
     * @return mixed
     */
    public function debugCheckout($id)
    {
        try {
            Log::info('Debug checkout called with ID: ' . $id);

            $user = Auth::user();
            Log::info('User authenticated: ' . ($user ? 'Yes - ID: ' . $user->id : 'No'));

            $owner = User::find($id);
            Log::info('Owner found: ' . ($owner ? 'Yes - Name: ' . $owner->name : 'No'));

            return response()->json([
                'status' => 'success',
                'message' => 'Checkout controller is working',
                'user_id' => $user ? $user->id : null,
                'owner_id' => $owner ? $owner->id : null,
                'timestamp' => now()->toISOString()
            ]);
        } catch (\Exception $e) {
            Log::error('Debug checkout error: ' . $e->getMessage());
            return response()->json([
                'status' => 'error',
                'message' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ], 500);
        }
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

        // Get currency metadata to handle zero-decimal currencies properly
        $currency = 'gbp'; // Test method uses GBP by default
        $currencyModel = Currency::where('ISO', strtoupper($currency))->first();
        $multiplier = ($currencyModel && $currencyModel->ISOdigits == 0) ? 1 : 100;

        $paymentIntentData = [
            'application_fee_amount' => $tax * $multiplier,
        ];

        $payload = [
            "mode"  => "payment",
            "line_items"    => $items,
            "payment_intent_data" => $paymentIntentData,
            'success_url'   => route("test.stripe.callback"),
            'cancel_url'    => route("test.stripe.callback", ["status" => "cancel"])
        ];

        Log::info('Test checkout payment flow determined (Direct Charge)', [
            'owner_id' => $owner->id,
            'connected_account_id' => $owner->account_id,
        ]);

        $session = StripeControl::createCheckoutSession($payload, $owner->account_id, false, $owner->username);
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
