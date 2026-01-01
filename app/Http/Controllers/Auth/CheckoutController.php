<?php

namespace App\Http\Controllers\Auth;

use App\Helpers;
use App\Http\Controllers\Controller;
use App\Jobs\CheckoutMailToUser;
use App\Jobs\CheckoutTweet;
use App\Jobs\CheckoutUser;
use App\Jobs\CrowdfundTweet;
use App\Jobs\SurpriseTweet;
use App\Mail\CommandFailed;
use App\Models\ConnectedAccountCustomer;
use App\Models\CreatorReferral;
use App\Models\Currency;
use App\Models\StripePaymentDetail;
use App\Models\StripePaymentItems;
use App\Models\Subscription;
use App\Models\User;
use App\Models\UserCart;
use App\Models\UserPayment;
use App\StripeControl;
use Carbon\Carbon;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Session;
use Inertia\Inertia;
use Ramsey\Uuid\Uuid;
use Stripe\Stripe;
use App\Services\CreatorActivityService;
use App\Services\CreatorSubscriptionService;
use App\Notifications\PaymentBlockedNotification;
use App\Notifications\SubscriptionBlockedNotification;
use Illuminate\Support\Facades\DB;

class CheckoutController extends Controller
{
    /* create checkout */
    public function createCheckout($creator_id, $user_id_or_device = null)
    {


        $checkGifterStatus = Helpers::checkGifterCardVerificationStatus();
        Log::info('Gifter card verification status', ['status' => $checkGifterStatus]);
        if ($checkGifterStatus == true) {
            $user = Auth::user();
            Log::info('Redirecting for card verification', ['user_id' => $user->id]);
            return to_route('user.show', ['username' => $user->username])->with("error", "⚠️ Please complete your card verification payment and wait for admin approval before making further payments.");
        }

        $user = Auth::user();
        $currency = !empty(request()->cookie('currency')) ? strtolower(request()->cookie('currency')) : 'gbp';
        try {
            if (!empty(request()->query('message'))) {
                $wordLimit = 100;
                $message = request()->query('message');

                if (str_word_count($message) > $wordLimit) {
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
            } else {
                // For guests, filter by device_id AND owner_id (creator_id)
                $device_id = $user_id_or_device ?? request()->get('device_id');

                if (!$device_id) {

                    return redirect()->back()->with('error', 'Device ID is required for guest checkout.');
                }

                $getdata = UserCart::where('device_id', $device_id)
                    ->where('owner_id', $creator_id)  // Filter by specific creator
                    ->where('status', 1)
                    ->with(['wish', 'owner'])
                    ->get();
            }

            if ($getdata->isEmpty()) {
                return redirect()->back()->with('error', 'No items in cart to checkout for this creator.');
            }

            // Get creator by ID
            $owner = User::find($creator_id);
            if (!$owner) {
                return redirect()->back()->with('error', 'Creator not found.');
            }
            if ($owner['is_subscribed'] !== 1) {
                return redirect()->back()->with('error', 'Currently creator has paused gift payments. Please try again later when gift payments are active.');
            }

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
                    'This creator is temporarily unavailable. Please try again later.'
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
                    'This creator is temporarily unavailable. Please try again later.'
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
            $currencyModel = Currency::where('ISO', strtoupper($currency))->first();
            $multiplier = ($currencyModel && $currencyModel->ISOdigits == 0) ? 1 : 100;

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

            // Log the connected account ID for debugging
            Log::info('Connected account ID found for checkout', [
                'connected_account_id' => $connectedAccountId,
                'creator_id' => $creator_id,
                'owner_username' => $owner->username ?? 'unknown'
            ]);

            $lineItems = [];
            $subtotal = 0;
            $transfer_amount = 0;
            $totalShowTaxWithQuantity = 0;
            $totalStoreTax = 0; // Add this to accumulate store tax
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
                $subtotals = 0;
                $totalAmount = $dd->amount;
                $ConvertedToGBpAmount = Helpers::priceFormat($dd->owner->default_currency, $totalAmount, 'gbp');
                $subtotals += $ConvertedToGBpAmount * $dd->quantity;
                if (!Auth::check() && $subtotals > 50) {
                    return to_route('login', ['message' => 'Larger payments more than £50 need to login']);
                }

                $adminFee = config('app.administration_fee');
                $showAdminsFees = Helpers::priceFormat('GBP', $adminFee, $currency);
                $StoreAdminsFees = Helpers::priceFormat('GBP', $adminFee, $dd->owner->default_currency);
                $taxPercentage = config('app.platform_fee_percentage');

                // Step 1: Check if customer already exists in connected account
                $storeCustomer = ConnectedAccountCustomer::where('user_id', Auth::id())
                    ->where('creator_id', $dd->owner->id)
                    ->where('connected_account_id', $connectedAccountId)
                    ->where('product_type', 'wish item')
                    ->first();

                // Step 3: Create customer in connected account if not exists
                $customer = null;
                if (!$storeCustomer) {
                    $customer = StripeControl::createCustomer([
                        'email' => $user->email ?? $dd->email,
                        'name' => $user->name ?? $dd->name,
                    ], $connectedAccountId);
                }

                $customer_id = $storeCustomer->stripe_customer_id ?? $customer->id;

                // Step 5: Store customer & price if not already stored
                if (!$storeCustomer && $user) {
                    ConnectedAccountCustomer::create([
                        'user_id' => Auth::id() ?? $user->id,
                        'creator_id' => $dd->owner->id,
                        'connected_account_id' => $connectedAccountId,
                        'stripe_customer_id' => $customer_id,
                        'product_type' => 'wish item',
                        'product_id' => $dd->wish->stripe_product_id,
                        // 'price_id' => $priceId,
                    ]);
                }

                $ConvertedAmount = Helpers::priceFormat($dd->owner->default_currency, $totalAmount, $currency);
                $platformFeeAmount = $ConvertedAmount * $taxPercentage / 100;
                $showTax = $platformFeeAmount + $showAdminsFees;
                $showTaxWithQuantity = $showTax * $dd->quantity;
                $storeTax = $platformFeeAmount + $StoreAdminsFees * $dd->quantity;
                $storeTaxWithQuantity = $storeTax * $dd->quantity;

                // Create product data dynamically for platform account (products exist in connected accounts)
                $productName = $dd->wish->wishname ?? 'Wish Item';
                $lineItems[] = [
                    'quantity' => $dd->quantity,
                    'price_data' => [
                        'currency' => $currency,
                        'product_data' => [
                            'name' => $productName,
                            'description' => 'Content from ' . ($dd->owner->name ?? 'Creator'),
                        ],
                        'unit_amount' => (int) round($ConvertedAmount * $multiplier),
                    ]
                ];

                // Add platform fee as separate line item for each product
                $lineItems[] = [
                    'quantity' => 1,
                    'price_data' => [
                        'currency' => $currency,
                        'product_data' => [
                            'name' => 'Platform Fee (' . config('app.platform_fee_percentage', 20) . '%) - ' . ($dd->wish->wishname ?? 'Content'),
                        ],
                        'unit_amount' => (int) round($showTaxWithQuantity * $multiplier),
                        'tax_behavior' => 'exclusive',
                    ],
                ];

                // this amount will be transfer to the creators account
                $transfer_amount += $ConvertedAmount * $dd->quantity;
                $subtotal += $ConvertedAmount * $dd->quantity; // Add this line to properly calculate subtotal
                $showTaxWithQuantity = $showTax * $dd->quantity;
                $totalShowTaxWithQuantity += $showTaxWithQuantity;
                $totalStoreTax += $storeTaxWithQuantity; // Accumulate store tax properly
            }

            // Check if we have any valid line items after processing
            if (empty($lineItems)) {
                Log::error('No valid line items found after processing cart', [
                    'creator_id' => $creator_id,
                    'cart_items_count' => $getdata->count(),
                    'user_id' => Auth::id()
                ]);
                return redirect()->back()->with('error', 'Your cart contains no valid items. Please add items and try again.');
            }

            // Calculate transfer amount (what creator receives = item amount only, no platform fees)
            // Total charge = item amount + platform fees
            // Transfer amount = item amount (what creator gets)
            // Platform keeps = platform fees
            $creatorVatAmount = 0;
            if (isset($owner->vat_amount_percentage) && $owner->vat_amount_percentage > 0) {
                $creatorVatAmount = round(($subtotal * $owner->vat_amount_percentage / 100) * $multiplier);
            }

            // Transfer amount = only the item amount (subtotal) + creator's VAT
            $transferAmount = round($subtotal * $multiplier) + $creatorVatAmount;

            // Total charged to customer = item amount + platform fees
            $totalChargeAmount = round($subtotal * $multiplier) + $creatorVatAmount + round($totalShowTaxWithQuantity * $multiplier);

            if ($transferAmount > $totalChargeAmount) {
                $transferAmount = $totalChargeAmount - round($totalShowTaxWithQuantity * $multiplier);
            }

            // Check if creator has card_payments capability to determine payment flow
            $hasCardPayments = \App\StripeControl::hasCardPaymentsCapability($connectedAccountId);

            // Build payment_intent_data based on creator's capabilities
            $paymentIntentData = [
                'description' => "Spenny Piggy - Content purchase with platform fee",
                'metadata' => $this->buildSafeMetadata($owner, $getdata, $totalChargeAmount),
            ];

            // Only add on_behalf_of if creator has card_payments capability
            if ($hasCardPayments) {
                // Standard flow for creators with card_payments capability
                $paymentIntentData['on_behalf_of'] = $connectedAccountId; // Shows creator as seller-of-record
                $paymentIntentData['transfer_data'] = [
                    'destination' => $connectedAccountId, // Creator's connected account
                    'amount' => (int) $transferAmount, // What creator receives (item + VAT)
                ];
                Log::info('Using standard flow with on_behalf_of for creator', [
                    'creator_id' => $creator_id,
                    'connected_account_id' => $connectedAccountId,
                    'has_card_payments' => true,
                    'transfer_amount' => $transferAmount
                ]);
            } else {
                // For restricted creators (transfers-only), charge on platform and transfer the creator amount
                // Use simple destination transfer without application_fee_amount to avoid conflicts
                $paymentIntentData['transfer_data'] = [
                    'destination' => $connectedAccountId,
                    'amount' => (int) $transferAmount, // Transfer only what creator should receive
                ];
                Log::info('Using fallback flow without on_behalf_of for restricted creator', [
                    'creator_id' => $creator_id,
                    'connected_account_id' => $connectedAccountId,
                    'has_card_payments' => false,
                    'reason' => 'Creator lacks card_payments capability',
                    'transfer_amount' => $transferAmount
                ]);
            }

            $payload = [
                'success_url' => route('checkout.success', [$creator_id]),
                'cancel_url' => route('checkout.cancel', [$creator_id]),
                "mode"  =>  "payment",
                'line_items' => $lineItems, // This determines the total amount automatically
                'payment_intent_data' => $paymentIntentData,
                'customer_email' =>  $getdata[0]->user->email ?? request()->query('email'),
            ];

            // Validate payload before sending to Stripe
            $validationError = $this->validateStripePayload($payload);
            if ($validationError) {
                Log::error("Stripe payload validation failed: " . $validationError);
                return redirect()->back()->with('error', 'Payment configuration error. Please try again.');
            }

            try {
                // For destination charges with 'on_behalf_of', don't pass connectedAccountId as parameter
                // The connected account is specified in the payload's payment_intent_data
                $sessionCreate = StripeControl::createCheckoutSession($payload);
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
                'amount_subtotal' => $subtotal,
                'amount_total' => $sessionCreate->amount_total / $multiplier,
                'tax' => $totalStoreTax, // Use the accumulated store tax
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
                'metadata' => json_encode($paymentMetadata), // Store comprehensive metadata
                'created_at' => now(),
                'updated_at' => now(),
            ]);

            $stripePaymentDetail->refresh();

            return Inertia::location($sessionCreate->url);
        } catch (\Throwable $th) {
            Log::error("Error in createCheckout: " . $th->getMessage());
            throw $th;
        }
    }

    public function handleCreatorReferralGMV(User $creator, float $gmvAmount): void
    {
        // Creator must have referral_code
        if (empty($creator->referral_code)) {
            return;
        }

        // Find referrer creator by referral_code
        $referrer = User::where('referral_code', $creator->referral_code)
            ->where('role', 1) // creator only
            ->first();

        if (!$referrer || $referrer->id === $creator->id) {
            return;
        }

        DB::transaction(function () use ($referrer, $creator, $gmvAmount) {

            $referral = CreatorReferral::firstOrCreate(
                [
                    'referrer_creator_id' => $referrer->id,
                    'referred_creator_id' => $creator->id,
                ],
                [
                    'lifetime_gmv' => 0,
                    'status' => 'IN_PROGRESS',
                ]
            );

            // Update GMV
            $referral->increment('lifetime_gmv', $gmvAmount);

            // Qualification check (£1000)
            if (
                $referral->status === 'IN_PROGRESS' &&
                $referral->lifetime_gmv >= 1000
            ) {
                $referral->update([
                    'status' => 'QUALIFIED',
                    'qualified_at' => now(),
                ]);
            }
        });
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

                // Validate transfer_data if present
                if (isset($payload['payment_intent_data']['transfer_data'])) {
                    $transferData = $payload['payment_intent_data']['transfer_data'];
                    if (!is_array($transferData)) {
                        return "transfer_data must be an array";
                    }
                    if (!isset($transferData['destination']) || empty($transferData['destination'])) {
                        return "transfer_data missing destination";
                    }
                    if (!isset($transferData['amount']) || !is_numeric($transferData['amount'])) {
                        return "transfer_data missing valid amount";
                    }
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
    private function buildSafeMetadata($owner, $getdata, $totalChargeAmount)
    {
        try {
            // Build basic payment info - REQUIRED fields
            $metadata = [
                'platform' => 'SpennyPiggy',
                'created_at' => now()->toISOString(),
                'creator_id' => (string) $owner->id,
                'creator_name' => $owner->name ?? 'Unknown Creator',
                'creator_username' => $owner->username ?? 'unknown',
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

            // Payment details - REQUIRED fields
            $metadata['payment_type'] = 'Destination Charges with transfers';
            $metadata['product_type'] = 'wish_one_off';
            $metadata['quantity'] = (string) array_sum(array_column($getdata->toArray(), 'quantity'));
            $metadata['items_count'] = (string) count($getdata);

            // Content delivery status - REQUIRED field
            $contentItems = [];
            $hasContent = false;

            foreach ($getdata as $item) {
                $wish = $item->wish;
                if (!$wish) continue;

                $contentUrl = null;
                $contentType = 'file';
                $source = 'content_file';

                // Priority: content_file → reward
                if (!empty($wish->content_file)) {
                    $contentUrl = $this->generateContentUrl($wish->content_file, $wish->content_file_type);
                    $contentType = $wish->content_file_type ?? 'file';
                    $source = 'content_file';
                    $hasContent = true;
                } elseif (!empty($wish->reward)) {
                    $contentUrl = $this->generateContentUrl($wish->reward, 'image');
                    $contentType = 'image';
                    $source = 'reward';
                    $hasContent = true;
                }

                $contentItems[] = [
                    'wish_id' => $wish->id,
                    'wish_name' => $wish->wishname ?? 'Unknown Wish',
                    'content_url' => $contentUrl,
                    'content_type' => $contentType,
                    'source' => $source
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
                'total_amount' => $totalChargeAmount,
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
                $wishContentData['content_url'] = $this->generateContentUrl($wish->content_file, $wish->content_file_type);
                $wishContentData['content_type'] = $wish->content_file_type ?? 'file';
                $wishContentData['delivery_status'] = 'ready'; // Content files are immediately available
                $wishContentData['source'] = 'content_file';
            } elseif (!empty($wish->reward)) {
                $wishContentData['has_content'] = true;
                $wishContentData['content_url'] = $this->generateContentUrl($wish->reward, 'image');
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
    private function generateContentUrl($fileIdentifier, $fileType)
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
            $deliveryStatus = 'no_content';
            $contentType = null;

            // Check for content and determine delivery status
            if (!empty($wish->content_file)) {
                $hasContent = true;
                $deliveryStatus = 'ready';
                $contentType = $wish->content_file_type ?? 'file';
                $summary['items_ready_for_delivery']++;
            } elseif (!empty($wish->reward)) {
                $hasContent = true;
                $deliveryStatus = 'ready';
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

                if ($existingPayment->payment_status === 'paid') {
                    Log::info("Payment already processed by webhook", ['session_id' => $sessionId]);
                    return redirect(route('thank-you', [$existingPayment->owner->username]))->with('success', 'Payment Successful.');
                }
            } else {
                Log::warning("No existing payment found for session", ['session_id' => $sessionId]);
            }

            foreach ($getdata as $dd) {

                /**************************WISH**PWA**START****************************************************/
                // below is wish pwa for fans

                if (isset($dd->user) && $dd->user->email) {
                    $CreatorName = !empty($dd->owner->name) ? ucfirst($dd->owner->name) : 'A Creator';
                    $titles = "✨ Wish Sent Successfully!";
                    $contents = "You've sent a wish to $CreatorName. They'll be notified right away!.";
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
            Log::info("Updating payment status", ['session_id' => $sessionId]);

            $updateResult = StripePaymentDetail::where('session_id', $sessionId)->update([
                'payment_status' => 'paid',
                'updated_at' => Carbon::now(),
            ]);
            
            Log::info("Payment update result", ['updated_rows' => $updateResult]);

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
                $payment_data = StripePaymentItems::create([
                    'uuid' => Uuid::uuid4(),
                    'stripe_payment_detail_id' => $stripeid->id,
                    'wish_item_id' => $dd->wish_item_id ?? Null,
                    'user_cart_id' => $dd->id,
                    'amount' => $dd->amount,
                    'message_media' => $dd->wish ? ($dd->wish->reward ?? null) : null,
                    'media_type' => ($dd->wish && !empty($dd->wish->reward)) ? 'image' : null,
                    'thank_you_approved' => ($dd->wish && !empty($dd->wish->reward)) ? 1 : 0,
                    'tax' => $dd->tax,
                    'quantity' => $dd->quantity,
                    'anonymous' => $dd->anonymous ?? false,
                    'message' => $dd->message ?? null
                ]);
                $payment_data->refresh();

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
                    $tax = $stripeid->amount_subtotal * config('app.platform_fee_percentage') / 100;
                    Log::info("Tax calculated", ['tax' => $tax]);

                    Log::info("About to calculate VAT amount");
                    // // Calculate VAT if the user has set a percentage
                    $vat_amount = ($stripeid->amount_subtotal + $tax) * $vat_percentage / 100;
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
                    $userPayment = new UserPayment();
                    $userPayment->from_user_id = $dd->user_id ?? null;
                    $userPayment->to_user_id = $dd->owner_id;
                    $userPayment->product_type = 'wish item';
                    $userPayment->amount = $total_amount;
                    $userPayment->currency = $dd->wish ? $dd->wish->currency : 'GBP';
                    $userPayment->payment_method = 'stripe';
                    $userPayment->payment_details = json_encode($sessionId, true);
                    $userPayment->paid_at = Carbon::now();
                    $userPayment->status = $stripeid->payment_status;
                    $userPayment->save();
                    Log::info("UserPayment record created successfully");
                }

                Log::info("About to update cart item status");
                $dd->status = 0;
                $dd->quantity = 0;
                $dd->save();
                Log::info("Cart item status updated successfully");
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

        // Check if creator has card_payments capability to determine payment flow
        $hasCardPayments = \App\StripeControl::hasCardPaymentsCapability($owner->account_id);

        $paymentIntentData = [
            'transfer_data' => [
                'destination' => $owner->account_id
            ],
        ];

        // Only add on_behalf_of if creator has card_payments capability
        if ($hasCardPayments) {
            $paymentIntentData['on_behalf_of'] = $owner->account_id;
            $paymentIntentData['application_fee_amount'] = $tax * $multiplier;
        } else {
            // For restricted creators, charge on platform and transfer the creator amount
            // Calculate the creator amount (total minus platform fees)
            $totalAmount = array_sum(array_map(function ($item) use ($multiplier) {
                return $item['quantity'] * ($item['price'] ?? 0);
            }, $items));
            $creatorAmount = $totalAmount - ($tax * $multiplier);
            $paymentIntentData['transfer_data']['amount'] = max(0, $creatorAmount); // Transfer creator amount
        }

        $payload = [
            "mode"  => "payment",
            "line_items"    => $items,
            "payment_intent_data" => $paymentIntentData,
            'success_url'   => route("test.stripe.callback"),
            'cancel_url'    => route("test.stripe.callback", ["status" => "cancel"])
        ];

        Log::info('Test checkout payment flow determined', [
            'owner_id' => $owner->id,
            'connected_account_id' => $owner->account_id,
            'has_card_payments' => $hasCardPayments,
            'using_on_behalf_of' => $hasCardPayments
        ]);

        $session = StripeControl::createCheckoutSession($payload);
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
