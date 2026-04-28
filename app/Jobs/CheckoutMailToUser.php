<?php

namespace App\Jobs;

use App\EmailService;
use App\Helpers;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldBeUnique;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\FacadesLog;
use Illuminate\SupportStr;

class CheckoutMailToUser implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public $payment;
    public $curr;


    /**
     * Create a new job instance.
     *
     * @param \App\Models\User $user
     * @param bool $social = false
     * @return void
     */
    public function __construct($payment,$curr)
    {
        $this->payment = $payment;
        $this->curr = $curr;
    }

    /**
     * Create email deliverable record
     */
    private function createEmailDeliverable()
    {
        // Only create email deliverable for authenticated users (due to gifter_id constraint)
        if (!$this->payment->user_id) {
            Log::info('CheckoutMailToUser: Skipping email deliverable for guest checkout', [
                'payment_id' => $this->payment->id,
                'guest_email' => $this->payment->guest_email ?? 'null'
            ]);
            return;
        }
        
        try {
            $deliverable = \App\Models\Deliverable::create([
                'uuid' => Str::uuid(),
                'product_id' => 'email_notification',
                'price_id' => null,
                'creator_id' => $this->payment->owner_id,
                'gifter_id' => $this->payment->user_id,
                'payment_intent_id' => $this->payment->stripe_payment_intent_id ?? null,
                'session_id' => $this->payment->session_id,
                'deliverable_type' => 'email',
                'product_type' => 'checkout',
                'transaction_amount' => $this->payment->amount_subtotal ?? 0,
                'deliverable_url' => null,
                'anonymous' => $this->payment->anonymous ?? false,
                'message' => $this->payment->message ?? null,
                'metadata' => json_encode([
                    'email_type' => 'checkout_notification',
                    'currency' => $this->curr,
                    'payment_id' => $this->payment->id
                ]),
                'status' => 'delivered',
                'delivered_at' => now()
            ]);
            
            Log::info('CheckoutMailToUser: Email deliverable created', [
                'deliverable_id' => $deliverable->id,
                'payment_id' => $this->payment->id
            ]);
        } catch (\Exception $e) {
            Log::error('CheckoutMailToUser: Failed to create email deliverable', [
                'payment_id' => $this->payment->id,
                'error' => $e->getMessage()
            ]);
        }
    }
    
    /**
     * Create content deliverables for purchased items
     */
    private function createContentDeliverables()
    {
        try {
            // Get payment items with their wish data
            $paymentItems = $this->payment->stripePaymentItems()->with('wish')->get();
            
            Log::info('CheckoutMailToUser: Processing content deliverables', [
                'payment_id' => $this->payment->id,
                'items_count' => $paymentItems->count()
            ]);
            
            foreach ($paymentItems as $item) {
                $this->createItemDeliverable($item);
            }
            
        } catch (\Exception $e) {
            Log::error('CheckoutMailToUser: Failed to create content deliverables', [
                'payment_id' => $this->payment->id,
                'error' => $e->getMessage()
            ]);
        }
    }
    
    /**
     * Create deliverable for individual purchased item
     */
    private function createItemDeliverable($paymentItem)
    {
        try {
            $wish = $paymentItem->wish;
            
            if (!$wish) {
                Log::warning('CheckoutMailToUser: No wish found for payment item', [
                    'payment_item_id' => $paymentItem->id
                ]);
                return;
            }
            
            // Determine deliverable type and URL based on available content
            $deliverableType = 'digital_file';
            $deliverableUrl = null;
            $status = 'pending';
            $deliveredAt = null;
            $contentFileName = null;
            $contentFileType = null;
            
            Log::info('CheckoutMailToUser: Analyzing content sources', [
                'wish_id' => $wish->id,
                'has_message_media' => !empty($paymentItem->message_media),
                'has_content_file' => !empty($wish->content_file),
                'has_reward' => !empty($wish->reward),
                'content_file' => $wish->content_file ?? 'null',
                'content_file_type' => $wish->content_file_type ?? 'null'
            ]);
            
            // Priority order: message_media → content_file → reward → fallback
            if (!empty($paymentItem->message_media)) {
                // Creator thank you media (highest priority)
                $deliverableType = $paymentItem->media_type == 'video' ? 'media_bundle' : 'digital_file';
                $deliverableUrl = $this->generateContentUrl($paymentItem->message_media, $paymentItem->media_type);
                $status = $paymentItem->thank_you_approved ? 'delivered' : 'pending';
                $deliveredAt = $paymentItem->thank_you_approved ? now() : null;
                $contentFileType = $paymentItem->media_type;
                Log::info('CheckoutMailToUser: Using message_media content');
            } elseif (!empty($wish->content_file)) {
                // Primary wish content file (main content source)
                $deliverableUrl = $this->generateContentUrl($wish->content_file, $wish->content_file_type);
                $deliverableType = $this->determineDeliverableType($wish->content_file_type);
                $status = 'delivered'; // Content files are immediately available
                $deliveredAt = now();
                $contentFileName = $wish->content_file_name;
                $contentFileType = $wish->content_file_type;
                Log::info('CheckoutMailToUser: Using content_file', [
                    'content_file' => $wish->content_file,
                    'type' => $wish->content_file_type,
                    'filename' => $wish->content_file_name
                ]);
            } elseif (!empty($wish->reward)) {
                // Legacy reward system
                $deliverableUrl = $this->generateContentUrl($wish->reward, 'image');
                $status = 'delivered';
                $deliveredAt = now();
                $contentFileType = 'image';
                Log::info('CheckoutMailToUser: Using legacy reward');
            } else {
                // No specific content, skip deliverable creation
                Log::info('CheckoutMailToUser: No content available for delivery', [
                    'wish_id' => $wish->id
                ]);
                return;
            }
            
            // Only create deliverable for authenticated users
            if (!$this->payment->user_id) {
                Log::info('CheckoutMailToUser: Skipping content deliverable for guest', [
                    'wish_id' => $wish->id,
                    'wish_name' => $wish->wishname
                ]);
                return;
            }
            
            // Get payment intent ID from Stripe session if available
            $paymentIntentId = null;
            if ($this->payment->session_id) {
                try {
                    $stripe = new StripeStripeClient(env('STRIPE_SECRET_KEY'));
                    $session = $stripe->checkout->sessions->retrieve($this->payment->session_id);
                    $paymentIntentId = $session->payment_intent ?? null;
                    Log::info('CheckoutMailToUser: Retrieved payment intent from session', [
                        'session_id' => $this->payment->session_id,
                        'payment_intent_id' => $paymentIntentId
                    ]);
                } catch (\Exception $e) {
                    Log::warning('CheckoutMailToUser: Failed to retrieve payment intent from session', [
                        'session_id' => $this->payment->session_id,
                        'error' => $e->getMessage()
                    ]);
                }
            }
            
            $deliverable = \App\Models\Deliverable::create([
                'uuid' => Str::uuid(),
                'product_id' => (string) $wish->id, // Use actual wish_id from database, not Stripe product_id
                'item_id' => $wish->id, // NEW: Database wish item ID for easy querying
                'price_id' => $wish->price_id,
                'creator_id' => $wish->user_id,
                'gifter_id' => $this->payment->user_id,
                'payment_intent_id' => $paymentIntentId,
                'session_id' => $this->payment->session_id,
                'deliverable_type' => $deliverableType,
                'product_type' => $this->getProductTypeFromWish($wish),
                'transaction_amount' => $paymentItem->amount * $paymentItem->quantity,
                'deliverable_url' => $deliverableUrl,
                'is_deliverable' => !empty($deliverableUrl), // Mark as deliverable if has content
                'anonymous' => $this->payment->anonymous ?? false,
                'message' => $this->payment->message ?? null,
                'metadata' => json_encode([
                    'certificate' => 'true', // Enable certificate generation
                    'wish_id' => $wish->id, // Database wish_id
                    'stripe_product_id' => $wish->stripe_product_id, // Stripe product_id for reference
                    'wish_name' => $wish->wishname,
                    'quantity' => $paymentItem->quantity,
                    'media_type' => $paymentItem->media_type ?? $contentFileType,
                    'content_file_name' => $contentFileName,
                    'content_file_type' => $contentFileType,
                    'has_content' => !empty($deliverableUrl),
                    'content_source' => !empty($paymentItem->message_media) ? 'message_media' : (!empty($wish->content_file) ? 'content_file' : 'reward'),
                    'payment_item_id' => $paymentItem->id,
                    'cart_item_id' => $paymentItem->user_cart_id // Reference to cart item for full traceability
                ]),
                'status' => $status,
                'delivered_at' => $deliveredAt
            ]);
            
            Log::info('CheckoutMailToUser: Content deliverable created', [
                'deliverable_id' => $deliverable->id,
                'wish_name' => $wish->wishname,
                'type' => $deliverableType,
                'status' => $status,
                'has_url' => !empty($deliverableUrl)
            ]);
            
            // Dispatch certificate generation job for the deliverable using default connection
            try {
                \App\Jobs\ProcessWishItemDeliverable::dispatch($deliverable);
                Log::info('CheckoutMailToUser: Certificate generation job dispatched', [
                    'deliverable_id' => $deliverable->id,
                    'wish_id' => $wish->id
                ]);
            } catch (\Exception $e) {
                Log::error('CheckoutMailToUser: Failed to dispatch certificate generation job', [
                    'deliverable_id' => $deliverable->id,
                    'error' => $e->getMessage()
                ]);
            }
            
        } catch (\Exception $e) {
            Log::error('CheckoutMailToUser: Failed to create item deliverable', [
                'payment_item_id' => $paymentItem->id,
                'error' => $e->getMessage()
            ]);
        }
    }
    
    /**
     * Determine deliverable type based on MIME type
     */
    private function determineDeliverableType($mimeType)
    {
        if (empty($mimeType)) {
            return 'digital_file';
        }
        
        $mimeType = strtolower($mimeType);
        
        if (strpos($mimeType, 'video/') === 0) {
            return 'media_bundle';
        } elseif (strpos($mimeType, 'image/') === 0) {
            return 'digital_file';
        } elseif (in_array($mimeType, ['application/pdf', 'text/plain', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'])) {
            return 'digital_file';
        } else {
            return 'digital_file';
        }
    }
    
    /**
     * Generate secure content URL for delivery
     */
    private function generateContentUrl($mediaId, $mediaType)
    {
        if (empty($mediaId)) {
            return null;
        }
        
        Log::info('CheckoutMailToUser: Generating content URL', [
            'media_id' => $mediaId,
            'media_type' => $mediaType ?? 'unknown'
        ]);
        
        // Generate Uploadcare URL with basic processing
        // For security and tracking, we could add processing parameters here
        $baseUrl = 'https://ucarecdn.com/' . $mediaId . '/';
        
        // Add processing parameters based on media type if needed
        if (!empty($mediaType)) {
            if (strpos($mediaType, 'image/') === 0) {
                // For images, we can add quality optimization
                // $baseUrl .= '-/quality/smart/-/format/auto/';
            } elseif (strpos($mediaType, 'video/') === 0) {
                // For videos, basic URL is sufficient
            }
        }
        
        return $baseUrl;
    }
    
    /**
     * Determine product type based on wish item properties
     */
    private function getProductTypeFromWish($wish)
    {
        if (!$wish) {
            return 'wish';
        }
        
        // Check if wish name or description indicates membership
        $wishName = strtolower($wish->wishname ?? '');
        $description = strtolower($wish->description ?? '');
        
        if (strpos($wishName, 'membership') !== false || strpos($description, 'membership') !== false) {
            return 'membership';
        }
        
        // Check if Stripe product ID indicates membership
        $productId = strtolower($wish->stripe_product_id ?? '');
        if (strpos($productId, 'membership') !== false || strpos($productId, 'member') !== false) {
            return 'membership';
        }
        
        // Default to wish
        return 'wish';
    }
    
    /**
     * REMOVED: Old individual deliverables method - replaced with consolidated approach
     */
    
    /**
     * Get comprehensive payment metadata from database or Stripe
     */
    private function getPaymentMetadata()
    {
        try {
            // First try to get from database metadata field
            if (!empty($this->payment->metadata)) {
                $metadata = json_decode($this->payment->metadata, true);
                if ($metadata && isset($metadata['content_urls'])) {
                    Log::info('CheckoutMailToUser: Using database metadata', [
                        'payment_id' => $this->payment->id,
                        'content_items' => count($metadata['content_urls'])
                    ]);
                    return $metadata;
                }
            }
            
            // Fallback: try to get from Stripe session metadata
            if (!empty($this->payment->session_id)) {
                $stripe = new StripeStripeClient(env('STRIPE_SECRET_KEY'));
                $session = $stripe->checkout->sessions->retrieve($this->payment->session_id);
                
                // Try new flattened format first
                if (isset($session->metadata['has_content']) && $session->metadata['has_content'] === 'true') {
                    $stripeMetadata = $this->parseFlattenedStripeMetadata($session->metadata);
                    
                    Log::info('CheckoutMailToUser: Using flattened Stripe metadata', [
                        'payment_id' => $this->payment->id,
                        'session_id' => $this->payment->session_id,
                        'content_items' => count($stripeMetadata['content_urls'] ?? [])
                    ]);
                    return $stripeMetadata;
                }
                // Fallback to legacy JSON format
                elseif (isset($session->metadata['content_urls'])) {
                    $stripeMetadata = [
                        'content_urls' => json_decode($session->metadata['content_urls'], true),
                        'wish_items' => json_decode($session->metadata['wish_items'] ?? '[]', true)
                    ];
                    
                    Log::info('CheckoutMailToUser: Using legacy Stripe metadata', [
                        'payment_id' => $this->payment->id,
                        'session_id' => $this->payment->session_id
                    ]);
                    return $stripeMetadata;
                }
            }
            
            Log::info('CheckoutMailToUser: No comprehensive metadata found, using fallback', [
                'payment_id' => $this->payment->id
            ]);
            return null;
            
        } catch (\Exception $e) {
            Log::warning('CheckoutMailToUser: Failed to retrieve metadata', [
                'payment_id' => $this->payment->id,
                'error' => $e->getMessage()
            ]);
            return null;
        }
    }
    
    /**
     * Parse flattened Stripe metadata into structured format
     */
    private function parseFlattenedStripeMetadata($metadata)
    {
        $contentUrls = [];
        $contentItemsCount = intval($metadata['content_items_count'] ?? 0);
        
        // Parse individual content items from flattened keys
        for ($i = 1; $i <= $contentItemsCount; $i++) {
            $itemKey = "item_{$i}";
            
            if (isset($metadata["{$itemKey}_wish_id"])) {
                $contentUrls[] = [
                    'wish_id' => intval($metadata["{$itemKey}_wish_id"]),
                    'wish_name' => $metadata["{$itemKey}_wish_name"] ?? '',
                    'has_content' => !empty($metadata["{$itemKey}_content_url"]),
                    'content_url' => $metadata["{$itemKey}_content_url"] ?? null,
                    'content_type' => $metadata["{$itemKey}_content_type"] ?? null,
                    'delivery_status' => $metadata['content_delivery_status'] ?? 'delivered',
                    'source' => $metadata["{$itemKey}_content_source"] ?? 'unknown'
                ];
            }
        }
        
        // Also include legacy content_urls if present
        if (isset($metadata['content_urls'])) {
            $legacyUrls = json_decode($metadata['content_urls'], true) ?? [];
            // Merge or replace as needed
            if (empty($contentUrls) && !empty($legacyUrls)) {
                $contentUrls = $legacyUrls;
            }
        }
        
        return [
            'content_urls' => $contentUrls,
            'content_delivery_status' => $metadata['content_delivery_status'] ?? 'delivered',
            'has_content' => $metadata['has_content'] === 'true',
            'content_items_count' => $contentItemsCount
        ];
    }
    
    /**
     * REMOVED: Old individual item deliverable method - replaced with consolidated approach
     */
    
    /**
     * Extract content info for specific wish from comprehensive metadata
     */
    private function getContentInfoFromMetadata($wishId, $paymentMetadata)
    {
        if (!$paymentMetadata || !isset($paymentMetadata['content_urls'])) {
            return null;
        }
        
        foreach ($paymentMetadata['content_urls'] as $contentData) {
            if ($contentData['wish_id'] == $wishId) {
                Log::info('CheckoutMailToUser: Found content info in metadata', [
                    'wish_id' => $wishId,
                    'has_content' => $contentData['has_content'],
                    'content_type' => $contentData['content_type'] ?? 'unknown',
                    'delivery_status' => $contentData['delivery_status'] ?? 'unknown'
                ]);
                return $contentData;
            }
        }
        
        return null;
    }
    
    /**
     * Create deliverable record for individual item
     */
    private function createItemDeliverableRecord($paymentItem, $wish, $contentInfo = null)
    {
        try {
            // Determine content and delivery details
            $deliverableType = 'digital_file';
            $deliverableUrl = null;
            $status = 'pending';
            $deliveredAt = null;
            $contentFileName = null;
            $contentFileType = null;
            
            // First priority: Use enhanced metadata if available
            if ($contentInfo && $contentInfo['has_content']) {
                $deliverableUrl = $contentInfo['content_url'];
                $contentFileType = $contentInfo['content_type'];
                $deliverableType = $this->determineDeliverableType($contentFileType);
                $status = ($contentInfo['delivery_status'] === 'ready') ? 'delivered' : 'pending';
                $deliveredAt = ($status === 'delivered') ? now() : null;
                
                Log::info('CheckoutMailToUser: Using metadata content info', [
                    'wish_id' => $wish->id,
                    'content_url' => $deliverableUrl,
                    'content_type' => $contentFileType,
                    'source' => $contentInfo['source'] ?? 'metadata'
                ]);
            }
            // Fallback: Traditional priority checks
            elseif (!empty($paymentItem->message_media)) {
                $deliverableType = $paymentItem->media_type == 'video' ? 'media_bundle' : 'digital_file';
                $deliverableUrl = $this->generateContentUrl($paymentItem->message_media, $paymentItem->media_type);
                $status = $paymentItem->thank_you_approved ? 'delivered' : 'pending';
                $deliveredAt = $paymentItem->thank_you_approved ? now() : null;
                $contentFileType = $paymentItem->media_type;
            } elseif (!empty($wish->content_file)) {
                $deliverableUrl = $this->generateContentUrl($wish->content_file, $wish->content_file_type);
                $deliverableType = $this->determineDeliverableType($wish->content_file_type);
                $status = 'delivered';
                $deliveredAt = now();
                $contentFileName = $wish->content_file_name;
                $contentFileType = $wish->content_file_type;
            } elseif (!empty($wish->reward)) {
                $deliverableUrl = $this->generateContentUrl($wish->reward, 'image');
                $status = 'delivered';
                $deliveredAt = now();
                $contentFileType = 'image';
            } else {
                // Create basic deliverable even without content for tracking
                $status = 'delivered';
                $deliveredAt = now();
            }
            
            // Only create for authenticated users due to gifter_id constraint
            if (!$this->payment->user_id) {
                Log::info('CheckoutMailToUser: Skipping deliverable for guest', [
                    'wish_id' => $wish->id
                ]);
                return null;
            }
            
            // Determine customer email and name
            $customerEmail = null;
            $customerName = null;
            
            if ($this->payment->user) {
                $customerEmail = $this->payment->user->email;
                $customerName = $this->payment->user->name;
            } else {
                $customerEmail = $this->payment->guest_email;
                $customerName = $this->payment->name ?? 'Guest';
            }
            
            // Get payment intent ID from Stripe session if available
            $paymentIntentId = null;
            if ($this->payment->session_id) {
                try {
                    $stripe = new StripeStripeClient(env('STRIPE_SECRET_KEY'));
                    $session = $stripe->checkout->sessions->retrieve($this->payment->session_id);
                    $paymentIntentId = $session->payment_intent ?? null;
                    Log::info('CheckoutMailToUser: Retrieved payment intent from session (item deliverable)', [
                        'session_id' => $this->payment->session_id,
                        'payment_intent_id' => $paymentIntentId
                    ]);
                } catch (\Exception $e) {
                    Log::warning('CheckoutMailToUser: Failed to retrieve payment intent from session (item deliverable)', [
                        'session_id' => $this->payment->session_id,
                        'error' => $e->getMessage()
                    ]);
                }
            }
            
            $deliverable = \App\Models\Deliverable::create([
                'uuid' => Str::uuid(),
                'product_id' => (string) $wish->id, // Use actual wish_id from database, not Stripe product_id
                'item_id' => $wish->id, // NEW: Database wish item ID for easy querying
                'price_id' => $wish->price_id,
                'creator_id' => $wish->user_id,
                'gifter_id' => $this->payment->user_id,
                'payment_intent_id' => $paymentIntentId,
                'session_id' => $this->payment->session_id,
                'deliverable_type' => $deliverableType,
                'product_type' => $this->getProductTypeFromWish($wish),
                'transaction_amount' => $paymentItem->amount * $paymentItem->quantity,
                'deliverable_url' => $deliverableUrl,
                'customer_email' => $customerEmail,
                'customer_name' => $customerName,
                'payment_status' => $this->payment->payment_status ?? 'paid',
                'payment_currency' => $this->payment->currency ?? 'USD',
                'anonymous' => $paymentItem->anonymous ?? false,
                'message' => $paymentItem->message ?? null,
                'metadata' => json_encode([
                    'certificate' => 'true', // Enable certificate generation
                    'wish_id' => $wish->id, // Database wish_id
                    'stripe_product_id' => $wish->stripe_product_id, // Stripe product_id for reference
                    'wish_name' => $wish->wishname,
                    'quantity' => $paymentItem->quantity,
                    'content_file_name' => $contentFileName,
                    'content_file_type' => $contentFileType,
                    'has_content' => !empty($deliverableUrl),
                    'payment_item_id' => $paymentItem->id,
                    'individual_delivery' => true,
                    'cart_item_id' => $paymentItem->user_cart_id // Reference to cart item for full traceability
                ]),
                'status' => $status,
                'delivered_at' => $deliveredAt
            ]);
            
            Log::info('CheckoutMailToUser: Individual deliverable created', [
                'deliverable_id' => $deliverable->id,
                'wish_name' => $wish->wishname,
                'status' => $status,
                'has_content' => !empty($deliverableUrl)
            ]);
            
            // Dispatch certificate generation job for the deliverable using SQS
            try {
                \App\Jobs\ProcessWishItemDeliverable::dispatch($deliverable)->onConnection('sqs_certificates');
                Log::info('CheckoutMailToUser: Certificate generation job dispatched to SQS', [
                    'deliverable_id' => $deliverable->id,
                    'wish_id' => $wish->id,
                    'queue_connection' => 'sqs_certificates'
                ]);
            } catch (\Exception $e) {
                Log::error('CheckoutMailToUser: Failed to dispatch certificate generation job', [
                    'deliverable_id' => $deliverable->id,
                    'error' => $e->getMessage()
                ]);
            }
            
            // Update Stripe payment intent metadata immediately for deliverables with payment intents
            if ($deliverable->payment_intent_id && $status === 'delivered') {
                try {
                    $stripeMetadataService = app(\App\ServicesStripeMetadataService::class);
                    $stripeMetadataService->updateDeliverableMetadata($deliverable, [
                        'checkout_processed_at' => now()->toISOString(),
                        'immediate_delivery' => 'true'
                    ]);
                } catch (\Exception $e) {
                    Log::error('CheckoutMailToUser: Failed to update Stripe metadata', [
                        'deliverable_id' => $deliverable->id,
                        'payment_intent_id' => $deliverable->payment_intent_id,
                        'error' => $e->getMessage()
                    ]);
                }
            }
            
            return $deliverable;
            
        } catch (\Exception $e) {
            Log::error('CheckoutMailToUser: Failed to create deliverable record', [
                'wish_id' => $wish->id,
                'error' => $e->getMessage()
            ]);
            return null;
        }
    }
    
    /**
     * REMOVED: Old individual email sender - replaced with consolidated approach
     */
    
    /**
     * Create deliverable notification record
     */
    private function createDeliverableNotification($deliverable)
    {
        try {
            if (!$this->payment->user_id) {
                Log::info('CheckoutMailToUser: Skipping notification for guest checkout');
                return;
            }
            
            $metadata = json_decode($deliverable->metadata, true);
            $wishName = $metadata['wish_name'] ?? 'Digital Content';
            
            $notification = \DB::table('deliverable_notifications')->insert([
                'uuid' => Str::uuid(),
                'deliverable_id' => $deliverable->id,
                'user_id' => $this->payment->user_id,
                'notification_type' => $deliverable->status === 'delivered' ? 'deliverable_delivered' : 'deliverable_pending',
                'channel' => 'email',
                'subject' => "Content Delivered: {$wishName}",
                'message' => $deliverable->status === 'delivered' 
                    ? "Your content for '{$wishName}' has been delivered and is ready for access." 
                    : "Your content for '{$wishName}' is being prepared and will be delivered soon.",
                'status' => 'sent',
                'sent_at' => now(),
                'metadata' => json_encode([
                    'deliverable_id' => $deliverable->id,
                    'payment_id' => $this->payment->id,
                    'wish_name' => $wishName,
                    'has_content' => !empty($deliverable->deliverable_url)
                ]),
                'created_at' => now(),
                'updated_at' => now()
            ]);
            
            Log::info('CheckoutMailToUser: Deliverable notification created', [
                'deliverable_id' => $deliverable->id,
                'wish_name' => $wishName,
                'notification_type' => $deliverable->status === 'delivered' ? 'deliverable_delivered' : 'deliverable_pending'
            ]);
            
        } catch (\Exception $e) {
            Log::error('CheckoutMailToUser: Failed to create deliverable notification', [
                'deliverable_id' => $deliverable->id,
                'error' => $e->getMessage()
            ]);
        }
    }
    
    /**
     * Legacy method - kept for backward compatibility
     */
    private function createDeliverableRecord()
    {
        try {
            // Get wish item from payment metadata or relationships
            $wishItemId = null;
            $wishItem = null;
            
            // Try multiple ways to get wish item
            if (isset($this->payment->metadata) && is_array($this->payment->metadata) && isset($this->payment->metadata['wish_item_id'])) {
                $wishItemId = $this->payment->metadata['wish_item_id'];
            } elseif (isset($this->payment->wish_item_id)) {
                $wishItemId = $this->payment->wish_item_id;
            } elseif (method_exists($this->payment, 'wishItem') && $this->payment->wishItem) {
                $wishItem = $this->payment->wishItem;
                $wishItemId = $wishItem->id;
            }
            
            if ($wishItemId && !$wishItem) {
                $wishItem = \App\Models\WishItem::find($wishItemId);
            }
            
            // Determine product type with better logic
            $productType = 'checkout'; // Default for checkout emails
            
            if ($wishItem) {
                $productType = 'wish';
            } elseif (isset($this->payment->metadata) && is_array($this->payment->metadata) && isset($this->payment->metadata['product_type'])) {
                $productType = $this->payment->metadata['product_type'];
            } else {
                // Try to determine from product ID or other fields
                $productId = $this->payment->stripe_product_id ?? '';
                if (strpos($productId, 'membership') !== false || strpos($productId, 'member') !== false) {
                    $productType = 'membership';
                } elseif (strpos($productId, 'bill') !== false) {
                    $productType = 'bill';
                } elseif (strpos($productId, 'tip') !== false) {
                    $productType = 'tip';
                } elseif (strpos($productId, 'shop') !== false) {
                    $productType = 'shop';
                } elseif (isset($this->payment->bill_id)) {
                    $productType = 'bill';
                } elseif (isset($this->payment->membership_id)) {
                    $productType = 'membership';
                }
            }
            
            // Get transaction amount from multiple possible sources
            $amount = 0;
            
            if (isset($this->payment->amount) && is_numeric($this->payment->amount)) {
                $amount = $this->payment->amount;
            } elseif (isset($this->payment->amount_total) && is_numeric($this->payment->amount_total)) {
                $amount = $this->payment->amount_total;
            } elseif (isset($this->payment->amount_subtotal) && is_numeric($this->payment->amount_subtotal)) {
                $amount = $this->payment->amount_subtotal;
            } elseif ($wishItem && isset($wishItem->amount) && is_numeric($wishItem->amount)) {
                $amount = $wishItem->amount;
            }
            
            // Ensure amount is positive
            $amount = max(0, $amount);
            
            Log::info('CheckoutMailToUser: Creating deliverable record with data', [
                'product_type' => $productType,
                'amount' => $amount,
                'amount_divided' => $amount / 100,
                'payment_id' => $this->payment->id,
                'user_id' => $this->payment->user_id ?? null,
                'wish_item_id' => $wishItemId
            ]);
            
            $deliverable = \App\Models\Deliverable::create([
                'uuid' => Str::uuid(),
                'product_id' => $this->payment->stripe_product_id ?? ($wishItem ? $wishItem->stripe_product_id : 'email_notification'),
                'price_id' => $this->payment->stripe_price_id ?? ($wishItem ? $wishItem->price_id : null),
                'creator_id' => $wishItem ? $wishItem->user_id : ($this->payment->owner_id ?? null),
                'gifter_id' => $this->payment->user_id ?? null, // Allow null for guest checkouts
                'payment_intent_id' => $this->payment->stripe_payment_intent_id ?? null,
                'session_id' => $this->payment->stripe_session_id ?? $this->payment->session_id ?? null,
                'deliverable_type' => 'email',
                'product_type' => $productType,
                'transaction_amount' => $amount / 100, // Convert from cents to dollars
                'deliverable_url' => null,
                'anonymous' => $this->payment->anonymous ?? false,
                'message' => $this->payment->message ?? null,
                'metadata' => json_encode([
                    'email_type' => 'checkout_notification',
                    'wish_item_id' => $wishItemId,
                    'currency' => $this->curr,
                    'payment_id' => $this->payment->id,
                    'guest_email' => $this->payment->guest_email ?? null // Include guest email for tracking
                ]),
                'status' => 'delivered',
                'delivered_at' => now()
            ]);

            Log::info('CheckoutMailToUser: Deliverable record created', [
                'deliverable_id' => $deliverable->id,
                'payment_id' => $this->payment->id,
                'type' => 'email',
                'product_type' => $productType,
                'amount' => $amount / 100
            ]);

        } catch (\Exception $e) {
            Log::error('CheckoutMailToUser: Failed to create deliverable record', [
                'payment_id' => $this->payment->id,
                'error' => $e->getMessage(),
                'payment_data' => [
                    'stripe_product_id' => $this->payment->stripe_product_id ?? 'null',
                    'stripe_price_id' => $this->payment->stripe_price_id ?? 'null',
                    'session_id' => $this->payment->session_id ?? 'null'
                ]
            ]);
        }
    }

    /**
     * Execute the job.
     *
     * @return void
     */
    public function handle()
    {
            Log::info('CheckoutMailToUser job started', [
            'payment_id' => $this->payment->id ?? 'null',
            'session_id' => $this->payment->session_id ?? 'null',
            'currency' => $this->curr,
            'guest_email' => $this->payment->guest_email ?? 'null',
            'user_id' => $this->payment->user_id ?? 'null',
            'owner_id' => $this->payment->owner_id ?? 'null',
            'amount_subtotal' => $this->payment->amount_subtotal ?? 'null'
        ]);

        // Check if payment has user relationship
        if (!isset($this->payment->user)) {
            Log::warning('CheckoutMailToUser: payment->user is not set', [
                'payment_id' => $this->payment->id ?? 'null',
                'user_id' => $this->payment->user_id ?? 'null'
            ]);
        } else {
            Log::info('CheckoutMailToUser: payment->user found', [
                'payment_id' => $this->payment->id,
                'user_id' => $this->payment->user->id ?? 'null',
                'user_email' => $this->payment->user->email ?? 'null',
                'notification_send' => $this->payment->user->notification_send ?? 'null'
            ]);
        }

        // Send email if user notifications are enabled OR if no user (guest checkout) but has guest_email
        $shouldSendEmail = false;
        
        if (isset($this->payment->user) && $this->payment->user->notification_send == 1) {
            Log::info('CheckoutMailToUser: Sending email - user notifications enabled');
            $shouldSendEmail = true;
        } elseif (empty($this->payment->user) && !empty($this->payment->guest_email)) {
            Log::info('CheckoutMailToUser: Sending email - guest checkout with email');
            $shouldSendEmail = true;
        } elseif (empty($this->payment->user)) {
            Log::warning('CheckoutMailToUser: Guest checkout but no guest email provided', [
                'payment_id' => $this->payment->id,
                'guest_email' => $this->payment->guest_email ?? 'null'
            ]);
        }
        
        if ($shouldSendEmail) {
            Log::info('CheckoutMailToUser: Sending consolidated email with all wish items', [
                'payment_id' => $this->payment->id,
                'currency' => $this->curr
            ]);
            
            // Create individual deliverables first (for tracking)
            $deliverables = $this->createConsolidatedDeliverables();
            
            // Send single consolidated email with all wish items to USER (Gifter)
            $this->sendConsolidatedEmail($deliverables);
            
            // Send email to CREATOR (Owner)
            $this->sendCreatorEmail($deliverables);
            
            Log::info('CheckoutMailToUser: Consolidated email sent', [
                'payment_id' => $this->payment->id,
                'deliverables_count' => count($deliverables)
            ]);
        } else {
            Log::info('CheckoutMailToUser: Email not sent', [
                'payment_id' => $this->payment->id,
                'has_user' => isset($this->payment->user) ? 'yes' : 'no',
                'user_notification_send' => $this->payment->user->notification_send ?? 'null',
                'guest_email' => $this->payment->guest_email ?? 'null'
            ]);
        }
    }
    
    /**
     * Create all deliverables and return them for consolidated email
     */
    private function createConsolidatedDeliverables()
    {
        try {
            $deliverables = [];
            
            // Get payment items with their wish data
            $paymentItems = $this->payment->stripePaymentItems()->with('wish')->get();
            
            Log::info('CheckoutMailToUser: Creating consolidated deliverables', [
                'payment_id' => $this->payment->id,
                'items_count' => $paymentItems->count()
            ]);
            
            // Try to use comprehensive metadata if available
            $paymentMetadata = $this->getPaymentMetadata();
            
            foreach ($paymentItems as $item) {
                $deliverable = $this->processItemDeliverableForConsolidation($item, $paymentMetadata);
                if ($deliverable) {
                    $deliverables[] = $deliverable;
                }
            }
            
            return $deliverables;
            
        } catch (\Exception $e) {
            Log::error('CheckoutMailToUser: Failed to create consolidated deliverables', [
                'payment_id' => $this->payment->id,
                'error' => $e->getMessage()
            ]);
            return [];
        }
    }
    
    /**
     * Process item deliverable for consolidation (creates deliverable record but no individual email)
     */
    private function processItemDeliverableForConsolidation($paymentItem, $paymentMetadata = null)
    {
        try {
            $wish = $paymentItem->wish;
            
            if (!$wish) {
                Log::warning('CheckoutMailToUser: No wish found for payment item', [
                    'payment_item_id' => $paymentItem->id
                ]);
                return null;
            }
            
            Log::info('CheckoutMailToUser: Processing item for consolidation', [
                'wish_id' => $wish->id,
                'wish_name' => $wish->wishname,
                'payment_item_id' => $paymentItem->id
            ]);
            
            // Get content info from metadata if available
            $contentInfo = $this->getContentInfoFromMetadata($wish->id, $paymentMetadata);
            
            // Create deliverable record
            $deliverable = $this->createItemDeliverableRecord($paymentItem, $wish, $contentInfo);
            
            if ($deliverable) {
                // Generate certificate if not already generated
                if (empty($deliverable->certificate_url)) {
                    try {
                        $certificateService = app(\App\Services\CertificateService::class);
                        $certificateUrl = $certificateService->generateAndUploadCertificate($deliverable, $wish);
                        if ($certificateUrl) {
                            $deliverable->update(['certificate_url' => $certificateUrl]);
                            Log::info('CheckoutMailToUser: Certificate generated for deliverable', [
                                'deliverable_id' => $deliverable->id,
                                'certificate_url' => $certificateUrl
                            ]);
                        }
                    } catch (\Exception $e) {
                        Log::error('CheckoutMailToUser: Failed to generate certificate', [
                            'deliverable_id' => $deliverable->id,
                            'error' => $e->getMessage()
                        ]);
                    }
                }
                
                // Create deliverable notification (but no individual email)
                $this->createDeliverableNotification($deliverable);
                
                // Add wish and content info to deliverable for email template
                $deliverable->wish_item = $wish;
                $deliverable->payment_item = $paymentItem;
                $deliverable->content_info = $contentInfo;
            }
            
            return $deliverable;
            
        } catch (\Exception $e) {
            Log::error('CheckoutMailToUser: Failed to process item for consolidation', [
                'payment_item_id' => $paymentItem->id,
                'error' => $e->getMessage()
            ]);
            return null;
        }
    }
    
    /**
     * Send single consolidated email with all wish items
     */
    private function sendConsolidatedEmail($deliverables)
    {
        try {
            Log::info('CheckoutMailToUser: Sending consolidated email', [
                'payment_id' => $this->payment->id,
                'deliverables_count' => count($deliverables)
            ]);
            
            // Create consolidated email data
            $consolidatedEmailData = (object) [
                'id' => $this->payment->id,
                'session_id' => $this->payment->session_id,
                'amount_subtotal' => $this->payment->amount_subtotal,
                'amount_total' => $this->payment->amount_total,
                'currency' => $this->payment->currency,
                'user_id' => $this->payment->user_id,
                'user' => $this->payment->user,
                'owner_id' => $this->payment->owner_id,
                'owner' => $this->payment->owner,
                'guest_email' => $this->payment->guest_email,
                'deliverables' => $deliverables, // All deliverables for consolidated display
                'total_items' => count($deliverables),
                'has_content' => count(array_filter($deliverables, function($d) { return !empty($d->deliverable_url); })) > 0,
                'consolidated_email' => true // Flag to identify this as consolidated email
            ];
            
            // Send email using existing service
            EmailService::checkOutToUser($consolidatedEmailData, $this->curr);
            
            Log::info('CheckoutMailToUser: Consolidated email sent successfully', [
                'payment_id' => $this->payment->id,
                'total_amount' => $this->payment->amount_total,
                'items_with_content' => count(array_filter($deliverables, function($d) { return !empty($d->deliverable_url); }))
            ]);
            
        } catch (\Exception $e) {
            Log::error('CheckoutMailToUser: Failed to send consolidated email', [
                'payment_id' => $this->payment->id,
                'error' => $e->getMessage()
            ]);
        }
    }

    /**
     * Send email to creator about the gift received
     */
    private function sendCreatorEmail($deliverables)
    {
        try {
            if (!$this->payment->owner) {
                Log::warning('CheckoutMailToUser: Skipping creator email - owner not set', [
                    'payment_id' => $this->payment->id
                ]);
                return;
            }

            Log::info('CheckoutMailToUser: Sending email to creator', [
                'payment_id' => $this->payment->id,
                'creator_email' => $this->payment->owner->email
            ]);

            // Calculate creator net amount (total of all items)
            $totalCreatorNet = 0;
            foreach ($deliverables as $deliverable) {
                $metadata = json_decode($deliverable->metadata, true);
                $totalCreatorNet += $metadata['creator_net_amount'] ?? $deliverable->transaction_amount;
            }

            // If we couldn't get it from deliverables, use a default calculation
            if ($totalCreatorNet <= 0) {
                $breakdown = Helpers::calculateStripeDirectChargeFlow($this->payment->amount_total, $this->payment->currency);
                $totalCreatorNet = $breakdown['net_to_creator'];
            }

            // Create creator email data object (mocking what Checkout mailable expects)
            $creatorEmailData = (object) [
                'payment' => $this->payment,
                'amount' => $totalCreatorNet, // Net amount for creator
                'wish_item_id' => $this->payment->wish_item_id ?? null,
                'cart' => $this->payment->userCart ?? null,
                'wish' => $this->payment->wishItem ?? null,
            ];

            $anon = $this->payment->anonymous ?? false;
            $surprise = !empty($this->payment->message);
            $message = $this->payment->message ?? '';
            $anonname = $this->payment->name ?? 'A Fan';
            $vat_amount = $this->payment->vat_tax_amount ?? 0;

            EmailService::checkOutUser(
                $creatorEmailData, 
                $anon, 
                $surprise, 
                $message, 
                $anonname, 
                $this->curr, 
                $vat_amount
            );

            Log::info('CheckoutMailToUser: Creator email sent successfully', [
                'payment_id' => $this->payment->id,
                'net_amount' => $totalCreatorNet
            ]);

        } catch (\Exception $e) {
            Log::error('CheckoutMailToUser: Failed to send creator email', [
                'payment_id' => $this->payment->id,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
        }
    }
}
