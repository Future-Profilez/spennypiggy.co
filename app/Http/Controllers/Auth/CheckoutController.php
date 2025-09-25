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

class CheckoutController extends Controller
{
    /* create checkout */
    public function createCheckout($creator_id, $user_id_or_device = null) {
       

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
                return redirect()->back()->with('error', 
                    'This creator is temporarily unavailable. Please try again later.'
                );
            }
            
            // Check creator activity eligibility
            $activityCheck = app(CreatorActivityService::class)->validateCreatorActivity($owner);
            
            if (!$activityCheck['eligible']) {
                // Send notification to creator about blocked payment
                $owner->notify(new PaymentBlockedNotification($activityCheck, $preliminaryTotal));
                
                 
                
                // Return user-friendly error to fan
                return redirect()->back()->with('error', 
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
                        'unit_amount_decimal' => round($totalAmount * $multiplier),
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
                        'unit_amount' => round($showTaxWithQuantity * $multiplier),
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

            $stripe = new \Stripe\StripeClient(env('STRIPE_SECRET_KEY'));

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

            $payload = [
                'success_url' => route('checkout.success', [$creator_id]),
                'cancel_url' => route('checkout.cancel', [$creator_id]),
                "mode"  =>  "payment",
                'line_items' => $lineItems, // This determines the total amount automatically
                'payment_intent_data' => [
                    'on_behalf_of' => $connectedAccountId, // Shows creator as seller-of-record
                    'transfer_data' => [
                        'destination' => $connectedAccountId, // Creator's connected account
                        'amount' => $transferAmount, // What creator receives (item + VAT)
                    ],
                    'description' => "Spenny Piggy - Content purchase with platform fee",
                    "metadata" => \App\Helpers::buildStripeMetadata('wishlist', (object) [
                        'user_id' => Auth::id(),
                        'owner_id' => $owner->id,
                        'owner' => $owner,
                        'uuid' => 'checkout-session-' . time(),
                        'total_charge_amount' => $totalChargeAmount,
                    ], [
                        "quantity" => (string) array_sum(array_column($getdata->toArray(), 'quantity')),
                        "payment_type" => "Destination Charges with transfers",
                        "creator_id" => (string) $owner->id,
                        "wish_id" => (string) ($getdata[0]->wish->id ?? null), // Primary wish ID for legacy compatibility
                        "deliverable_type" => "media_bundle",
                        "certificate" => "true",
                        "product_type" => "wish_one_off",
                        "items_count" => (string) count($getdata),
                        "content_delivery_status" => "delivered",
                        // Flatten content URLs instead of JSON
                        ...$this->buildFlattenedContentMetadata($getdata),
                        // Clean wish items metadata (avoid duplication)
                        "wish_items_summary" => $this->buildCleanWishItemsMetadata($getdata),
                    ]),
                ],
                'customer_email' =>  $getdata[0]->user->email ?? request()->query('email'),
            ];

            try {
                $sessionCreate = StripeControl::createCheckoutSession($payload); // Removed $connectedAccount parameter
            } catch (\Stripe\Exception\InvalidRequestException $e) {
                Log::error("Stripe Checkout Error: " . $e->getMessage());
                Log::error("Stripe Error Details: ", ['error' => $e->getJsonBody()]);
                return redirect()->back()->with('error', 'Payment failed: ' . $e->getMessage());
            } catch (\Exception $e) {
                Log::error("General Checkout Error: " . $e->getMessage());
                Log::error("Error trace: " . $e->getTraceAsString());
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
                'delivery_status' => 'pending'
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
     * Build flattened content metadata for Stripe - individual keys instead of JSON
     */
    private function buildFlattenedContentMetadata($cartItems)
    {
        $flattenedMetadata = [];
        $contentUrls = [];
        $contentCount = 0;
        
        foreach ($cartItems as $index => $item) {
            $wish = $item->wish;
            if (!$wish) continue;
            
            $hasContent = false;
            $contentUrl = null;
            $contentType = null;
            $source = null;
            
            // Priority: content_file → reward
            if (!empty($wish->content_file)) {
                $hasContent = true;
                $contentUrl = $this->generateContentUrl($wish->content_file, $wish->content_file_type);
                $contentType = $wish->content_file_type ?? 'file';
                $source = 'content_file';
            } elseif (!empty($wish->reward)) {
                $hasContent = true;
                $contentUrl = $this->generateContentUrl($wish->reward, 'image');
                $contentType = 'image';
                $source = 'reward';
            }
            
            if ($hasContent) {
                $contentCount++;
                $itemKey = "item_" . ($index + 1);
                
                // Add individual content keys
                $flattenedMetadata["{$itemKey}_wish_id"] = (string) $wish->id;
                $flattenedMetadata["{$itemKey}_wish_name"] = $wish->wishname;
                $flattenedMetadata["{$itemKey}_content_url"] = $contentUrl;
                $flattenedMetadata["{$itemKey}_content_type"] = $contentType ?? '';
                $flattenedMetadata["{$itemKey}_content_source"] = $source;
                
                // Also collect for legacy content_urls if needed
                $contentUrls[] = [
                    'wish_id' => $wish->id,
                    'wish_name' => $wish->wishname,
                    'content_url' => $contentUrl,
                    'content_type' => $contentType,
                    'source' => $source
                ];
            }
        }
        
        // Add summary keys
        $flattenedMetadata['content_items_count'] = (string) $contentCount;
        $flattenedMetadata['has_content'] = $contentCount > 0 ? 'true' : 'false';
        
        // Keep a simplified content_urls as JSON for backward compatibility (but cleaner)
        if (!empty($contentUrls)) {
            $flattenedMetadata['content_urls'] = json_encode($contentUrls);
        }
        
        return $flattenedMetadata;
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
     * Build clean wish items metadata to avoid duplication with individual content keys
     */
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
            $getdata = UserCart::where('user_id', Auth::id())->where('owner_id', $id)->where('status', 1)->get();
        } else {
            // For guest checkouts, we need to find the cart items by matching the payment details
            // The $id parameter is the creator_id, not device_id
            if ($paymentRecord && $paymentRecord->guest_email) {
                // Try to find cart items by matching guest email and owner_id from the payment record
                $getdata = UserCart::where('owner_id', $paymentRecord->owner_id)
                    ->where('status', 1)
                    ->whereNull('user_id') // Guest cart items
                    ->get();
            } else {
                // Fallback: try to find by device_id from session or other means
                $deviceId = session('device_id') ?? request()->get('device_id');
                if ($deviceId) {
                    $getdata = UserCart::where('device_id', $deviceId)
                        ->where('owner_id', $id)
                        ->where('status', 1)
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
                    'message_media' => $dd->wish->reward ?? null,
                    'media_type' => !empty($dd->wish->reward) ? 'image' : null,
                    'thank_you_approved' => !empty($dd->wish->reward) ? 1 : 0,
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
                    } elseif ($dd->wish->subscription == 2) {
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
                    $userPayment->currency = $dd->wish->currency;
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
    public function debugCheckout($id) {
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
        
        $payload = [
            "mode"  => "payment",
            "line_items"    => $items,
            "payment_intent_data"   =>  [
                'application_fee_amount'    => $tax * $multiplier,
                'transfer_data' => [
                    'destination'   => $owner->account_id
                ],
                'on_behalf_of'  => $owner->account_id
            ],
            'success_url'   => route("test.stripe.callback"),
            'cancel_url'    => route("test.stripe.callback", ["status" => "cancel"])
        ];

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
