<?php

namespace App\Services;

use Illuminate\Support\Facades\Log;
use App\Models\Deliverable;
use App\Models\WishItem;
use App\Models\Bill;
use App\Models\Membership;

class StripeMetadataService
{
    /**
     * Update Stripe payment intent metadata with new flattened format
     * Implements NEW_STRIPE_METADATA_FORMAT.md specification
     * 
     * @param string $paymentIntentId Stripe payment intent ID
     * @param string|null $certificateUrl Certificate URL from Uploadcare
     * @param string $deliveryStatus Status: pending, delivered, failed, completed
     * @param array $additionalMetadata Additional metadata to include
     * @param string|null $deliverableUuid UUID of the deliverable record
     * @param string|null $deliveryUrl Content delivery URL
     * @param bool $skipDeliveryFields Skip delivery fields for support payments
     * @return bool Success status
     */
    public function updatePaymentIntentMetadata(
        string $paymentIntentId, 
        ?string $certificateUrl = null, 
        string $deliveryStatus = 'pending',
        array $additionalMetadata = [],
        ?string $deliverableUuid = null,
        ?string $deliveryUrl = null,
        bool $skipDeliveryFields = false
    ): bool {
        try {
            // Initialize Stripe with secret key
            \Stripe\Stripe::setApiKey(env('STRIPE_SECRET_KEY'));
            
            // Build metadata array with new flattened format
            $metadata = [
                'updated_at' => now()->toISOString(),
                'platform' => 'SpennyPiggy'
            ];
            
            // Only add delivery/certificate fields if not skipped (for support payments)
            if (!$skipDeliveryFields) {
                // STATIC VALUES AS REQUESTED - Always show delivered/true
                $metadata['content_delivery_status'] = 'delivered';
                $metadata['certificate'] = 'true';
                $metadata['delivery_status'] = 'delivered';
                
                // Add certificate URL if provided
                if ($certificateUrl) {
                    $metadata['certificate_url'] = $certificateUrl;
                }
                
                // Add delivery URL if provided
                if ($deliveryUrl) {
                    $metadata['delivery_url'] = $deliveryUrl;
                }
                
                // Add deliverable UUID if provided
                if ($deliverableUuid) {
                    $metadata['certificate_id'] = $deliverableUuid;
                    $metadata['deliverable_uuid'] = $deliverableUuid;
                }
            }
            
            // Add any additional metadata
            if (!empty($additionalMetadata)) {
                $metadata = array_merge($metadata, $additionalMetadata);
            }
            
            // Update payment intent metadata
            \Stripe\PaymentIntent::update($paymentIntentId, [
                'metadata' => $metadata
            ]);
            
            Log::info('StripeMetadataService: Successfully updated payment intent metadata (NEW FORMAT)', [
                'payment_intent_id' => $paymentIntentId,
                'certificate_url' => $certificateUrl,
                'delivery_status' => $deliveryStatus,
                'delivery_url' => $deliveryUrl,
                'deliverable_uuid' => $deliverableUuid,
                'skip_delivery_fields' => $skipDeliveryFields,
                'additional_metadata_count' => count($additionalMetadata)
            ]);
            
            return true;
            
        } catch (\Exception $e) {
            Log::error('StripeMetadataService: Failed to update payment intent metadata (NEW FORMAT)', [
                'payment_intent_id' => $paymentIntentId,
                'certificate_url' => $certificateUrl,
                'delivery_status' => $deliveryStatus,
                'delivery_url' => $deliveryUrl,
                'deliverable_uuid' => $deliverableUuid,
                'skip_delivery_fields' => $skipDeliveryFields,
                'error' => $e->getMessage(),
                'error_class' => get_class($e)
            ]);
            
            return false;
        }
    }
    
    /**
     * Update Stripe metadata for a deliverable record - NEW FLATTENED FORMAT
     * 
     * @param Deliverable $deliverable
     * @param array $additionalMetadata
     * @return bool
     */
    public function updateDeliverableMetadata(Deliverable $deliverable, array $additionalMetadata = []): bool
    {
        if (!$deliverable->payment_intent_id) {
            Log::warning('StripeMetadataService: No payment intent ID found for deliverable', [
                'deliverable_id' => $deliverable->id,
                'deliverable_uuid' => $deliverable->uuid
            ]);
            return false;
        }
        
        // Check if this is a support payment with certificate
        $isSupportPaymentWithCert = $this->isSupportPaymentWithCertificate($deliverable);
        
        // For support payments: include cert fields if certificate exists, otherwise exclude
        $skipDeliveryFields = $deliverable->product_type === 'support_payment' && !$isSupportPaymentWithCert;
        
        // Determine delivery status 
        $deliveryStatus = $skipDeliveryFields ? 'pending' : $this->mapDeliverableStatusToDeliveryStatus($deliverable->status);
        
        // Build NEW FLATTENED metadata format
        $newFormatMetadata = $this->buildNewFlattenedMetadata($deliverable);

        // Build Product Specific Metadata (Task details, etc.)
        $productSpecificMetadata = $this->buildProductSpecificMetadata($deliverable);
        
        // Merge all metadata: New Format + Product Specific + Additional
        $allAdditionalMetadata = array_merge($newFormatMetadata, $productSpecificMetadata, $additionalMetadata);
        
        // Add special logging for support payments with certificates
        if ($isSupportPaymentWithCert) {
            Log::info('StripeMetadataService: Support payment metadata + cert URL', [
                'deliverable_id' => $deliverable->id,
                'certificate_url' => $deliverable->certificate_url,
                'payment_intent_id' => $deliverable->payment_intent_id
            ]);
        }
        
        return $this->updatePaymentIntentMetadata(
            $deliverable->payment_intent_id,
            $skipDeliveryFields ? null : $deliverable->certificate_url,
            $deliveryStatus,
            $allAdditionalMetadata,
            $skipDeliveryFields ? null : $deliverable->uuid,
            $skipDeliveryFields ? null : $deliverable->deliverable_url,
            $skipDeliveryFields
        );
    }
    
    /**
     * Check if deliverable is a support payment with certificate
     * 
     * @param Deliverable $deliverable
     * @return bool
     */
    private function isSupportPaymentWithCertificate(Deliverable $deliverable): bool
    {
        return $deliverable->product_type === 'support_payment' 
            && !empty($deliverable->certificate_url)
            && $deliverable->status === 'delivered';
    }
    
    /**
     * Map deliverable status to delivery status for Stripe
     * 
     * @param string $deliverableStatus
     * @return string
     */
    private function mapDeliverableStatusToDeliveryStatus(string $deliverableStatus): string
    {
        return match($deliverableStatus) {
            'delivered' => 'completed',
            'completed_accepted' => 'completed',
            'completed' => 'completed',
            'pending' => 'pending',
            'assigned' => 'pending',
            'pending_review' => 'pending',
            'rejected_once' => 'pending',
            'escalated' => 'pending',
            'failed' => 'failed',
            'refunded' => 'cancelled',
            'cancelled' => 'cancelled',
            default => 'pending'
        };
    }
    
    /**
     * Build product-specific metadata for different product types
     * 
     * @param Deliverable $deliverable
     * @return array
     */
    private function buildProductSpecificMetadata(Deliverable $deliverable): array
    {
        $metadata = [
            'product_type' => $deliverable->product_type,
            'deliverable_type' => $deliverable->deliverable_type,
            'transaction_amount' => (string) $deliverable->transaction_amount,
            'payment_currency' => $deliverable->payment_currency ?? 'GBP'
        ];
        
        // Add product-specific details based on product type
        switch ($deliverable->product_type) {
            case 'wish':
                if ($deliverable->wishItem) {
                    $metadata['wish_name'] = $deliverable->wishItem->wishname ?? 'Unknown Wish';
                    $metadata['creator_username'] = $deliverable->wishItem->user->username ?? 'Unknown';
                }
                break;
                
            case 'bill':
                if ($deliverable->bill) {
                    $metadata['bill_name'] = $deliverable->bill->name ?? 'Unknown Bill';
                    $metadata['creator_username'] = $deliverable->bill->user->username ?? 'Unknown';
                }
                break;
                
            case 'membership':
                if ($deliverable->membership) {
                    $metadata['membership_name'] = $deliverable->membership->name ?? 'Unknown Membership';
                    $metadata['creator_username'] = $deliverable->membership->user->username ?? 'Unknown';
                }
                break;
                
            case 'shop_item':
                // Add shop item specific metadata if needed
                $metadata['shop_item_id'] = $deliverable->item_id;
                break;

            case 'task':
            case 'task_purchase':
                if ($deliverable->task) {
                    $task = $deliverable->task;
                    $metadata['task_id'] = $task->id;
                    $metadata['task_uuid'] = $task->uuid;
                    $metadata['task_type'] = $task->type;
                    $metadata['purpose'] = 'paid_task';
                    $metadata['sla_timeline'] = $task->type === 'timed' ? ($task->sla_hours . ' hours') : 'instant';
                    $metadata['payment_date'] = $deliverable->created_at ? $deliverable->created_at->toIso8601String() : now()->toIso8601String();
                    
                    // Order status - Prefer granular purchase status if available
                    if ($deliverable->purchase) {
                        $metadata['current_status_of_order'] = $deliverable->purchase->status;
                    } else {
                        $metadata['current_status_of_order'] = $deliverable->status;
                    }
                    
                    $metadata['payment_status'] = $deliverable->payment_status ?? 'pending';
                }
                break;
                
            case 'support_payment':
                $metadata['support_payment'] = 'true';
                $metadata['payment_type'] = 'tip_donation';
                // Include certificate/delivery fields if certificate exists
                if ($this->isSupportPaymentWithCertificate($deliverable)) {
                    $metadata['certificate_url'] = $deliverable->certificate_url;
                    $metadata['certificate_id'] = $deliverable->uuid;
                    $metadata['delivery_status'] = 'completed';
                    $metadata['deliverable_uuid'] = $deliverable->uuid;
                }
                break;
        }
        
        // Add content delivery information 
        if ($deliverable->product_type !== 'support_payment' && $deliverable->deliverable_url) {
            $metadata['content_available'] = 'true';
            $metadata['content_delivery_url'] = $deliverable->deliverable_url;
        }
        
        // Special handling for support payments with certificate delivery
        if ($this->isSupportPaymentWithCertificate($deliverable) && $deliverable->deliverable_url) {
            $metadata['content_available'] = 'true';
            $metadata['content_delivery_url'] = $deliverable->deliverable_url;
        }
        
        return $metadata;
    }
    
    /**
     * Build COMPLETE FLATTENED metadata format as per NEW_STRIPE_METADATA_FORMAT.md
     * Applied to ALL payment types (wish, bill, membership, shop_item)
     * 
     * @param Deliverable $deliverable
     * @return array
     */
    private function buildNewFlattenedMetadata(Deliverable $deliverable): array
    {
        $metadata = [];
        
        // Skip for support payments - they don't need flattened content metadata
        if ($deliverable->product_type === 'support_payment') {
            return [
                'payment_type' => 'tip_donation',
                'support_payment' => 'true',
                'product_type' => 'support_payment'
            ];
        }
        
        // BASIC PAYMENT INFO - same structure for all payment types
        $this->addBasicPaymentInfo($metadata, $deliverable);
        
        // CONTENT DELIVERY STATUS - REQUIRED
        $metadata['content_delivery_status'] = 'delivered'; // STATIC as requested
        
        // Get related content items based on product type
        $contentItems = $this->getContentItemsForDeliverable($deliverable);
        
        // CONTENT SUMMARY - REQUIRED
        $metadata['has_content'] = !empty($contentItems) ? 'true' : 'false';
        $metadata['content_items_count'] = (string) count($contentItems);
        
        // FLATTEN INDIVIDUAL CONTENT ITEMS - item_1_*, item_2_*, etc.
        foreach ($contentItems as $index => $item) {
            $itemNum = $index + 1;
            $prefix = "item_{$itemNum}_";
            
            $metadata[$prefix . 'wish_id'] = (string) $item['wish_id'];
            $metadata[$prefix . 'wish_name'] = substr($item['wish_name'], 0, 100); // Stripe limit
            
            if (!empty($item['content_url'])) {
                $metadata[$prefix . 'content_url'] = $item['content_url'];
                $metadata[$prefix . 'content_type'] = $item['content_type'] ?? 'file';
                $metadata[$prefix . 'content_source'] = $item['source'] ?? 'content_file';
            }
        }
        
        // PAYMENT DETAILS - same for all payment types
        $metadata['certificate'] = 'true'; // STATIC as requested
        $metadata['deliverable_type'] = $deliverable->deliverable_type;
        $metadata['items_count'] = (string) max(count($contentItems), 1);
        $metadata['payment_type'] = 'Destination Charges with transfers';
        $metadata['quantity'] = '1'; // Default quantity
        
        // BUILD ITEMS SUMMARY - clean JSON format
        $this->addItemsSummary($metadata, $deliverable, $contentItems);
        
        // BUILD BACKWARD COMPATIBILITY JSON - clean format
        if (!empty($contentItems)) {
            $cleanContentUrls = [];
            foreach ($contentItems as $item) {
                if (!empty($item['content_url'])) {
                    $cleanContentUrls[] = [
                        'wish_id' => $item['wish_id'],
                        'wish_name' => $item['wish_name'],
                        'content_url' => $item['content_url'],
                        'content_type' => $item['content_type'] ?? 'file',
                        'source' => $item['source'] ?? 'content_file'
                    ];
                }
            }
            
            if (!empty($cleanContentUrls)) {
                $metadata['content_urls'] = json_encode($cleanContentUrls);
            }
        }
        
        return $metadata;
    }
    
    /**
     * Add basic payment info (buyer/creator details) to metadata
     */
    private function addBasicPaymentInfo(array &$metadata, Deliverable $deliverable): void
    {
        // BUYER INFO
        $metadata['buyer_id'] = (string) ($deliverable->gifter_id ?? 'unknown');
        $metadata['buyer_name'] = $deliverable->customer_name ?? 'Anonymous';
        $metadata['buyer_email'] = $deliverable->customer_email ?? 'anonymous@spennypiggy.co';
        $metadata['buyer_username'] = 'guest'; // Default for now
        $metadata['gifter_profile_url'] = 'N/A';
        
        // CREATOR INFO
        $metadata['creator_id'] = (string) ($deliverable->creator_id ?? 'unknown');
        $metadata['creator_name'] = 'Creator'; // Default
        $metadata['creator_username'] = 'creator'; // Default
        $metadata['creator_profile_url'] = 'N/A';
        
        // Try to get actual creator details based on product type
        switch ($deliverable->product_type) {
            case 'wish':
                if ($deliverable->wishItem && $deliverable->wishItem->user) {
                    $user = $deliverable->wishItem->user;
                    $metadata['creator_name'] = $user->name ?? 'Creator';
                    $metadata['creator_username'] = $user->username ?? 'creator';
                    $metadata['creator_profile_url'] = route('user.show', $user->username);
                }
                break;
                
            case 'bill':
                if ($deliverable->bill && $deliverable->bill->user) {
                    $user = $deliverable->bill->user;
                    $metadata['creator_name'] = $user->name ?? 'Creator';
                    $metadata['creator_username'] = $user->username ?? 'creator';
                    $metadata['creator_profile_url'] = route('user.show', $user->username);
                }
                break;
                
            case 'membership':
                if ($deliverable->membership && $deliverable->membership->user) {
                    $user = $deliverable->membership->user;
                    $metadata['creator_name'] = $user->name ?? 'Creator';
                    $metadata['creator_username'] = $user->username ?? 'creator';
                    $metadata['creator_profile_url'] = route('user.show', $user->username);
                }
                break;

            case 'task':
            case 'task_purchase':
                // Get Creator
                $creator = null;
                if ($deliverable->creator) {
                    $creator = $deliverable->creator;
                } elseif ($deliverable->task && $deliverable->task->creator) {
                    $creator = $deliverable->task->creator;
                } elseif ($deliverable->creator_id) {
                    $creator = \App\Models\User::find($deliverable->creator_id);
                }

                if ($creator) {
                    $metadata['creator_name'] = $creator->name;
                    $metadata['creator_username'] = $creator->username;
                    $metadata['creator_profile_url'] = route('user.show', $creator->username);
                }

                // Get Gifter/Buyer
                $gifter = null;
                if ($deliverable->gifter) {
                    $gifter = $deliverable->gifter;
                } elseif ($deliverable->gifter_id) {
                    $gifter = \App\Models\User::find($deliverable->gifter_id);
                }

                if ($gifter) {
                    $metadata['buyer_username'] = $gifter->username;
                    $metadata['gifter_name'] = $gifter->name; // Explicit request for gifter_name
                    $metadata['gifter_profile_url'] = route('user.show', $gifter->username);
                }
                break;
        }
    }
    
    /**
     * Add items summary JSON to metadata
     */
    private function addItemsSummary(array &$metadata, Deliverable $deliverable, array $contentItems): void
    {
        $summary = [
            'total_items' => max(count($contentItems), 1),
            'total_amount' => $deliverable->transaction_amount ?? 0,
            'item_ids' => [],
            'item_names' => []
        ];
        
        // Add items based on product type
        if (!empty($contentItems)) {
            foreach ($contentItems as $item) {
                $summary['item_ids'][] = $item['wish_id'];
                $summary['item_names'][] = $item['wish_name'];
            }
        } else {
            // Fallback for items without content
            $summary['item_ids'][] = $deliverable->item_id ?? 0;
            $summary['item_names'][] = $this->getItemName($deliverable);
        }
        
        // Different summary key based on product type
        $summaryKey = match($deliverable->product_type) {
            'wish' => 'wish_items_summary',
            'bill' => 'bill_items_summary',
            'membership' => 'membership_items_summary',
            'shop_item' => 'shop_items_summary',
            default => 'items_summary'
        };
        
        $metadata[$summaryKey] = json_encode($summary);
    }
    
    /**
     * Get item name based on product type
     */
    private function getItemName(Deliverable $deliverable): string
    {
        return match($deliverable->product_type) {
            'wish' => $deliverable->wishItem->wishname ?? 'Wish Item',
            'bill' => $deliverable->bill->name ?? 'Bill',
            'membership' => $deliverable->membership->name ?? 'Membership',
            'shop_item' => 'Shop Item',
            default => 'Item'
        };
    }
    
    /**
     * Get content items for a deliverable based on its product type
     * Returns items in flattened format for ALL payment types
     * 
     * @param Deliverable $deliverable
     * @return array
     */
    private function getContentItemsForDeliverable(Deliverable $deliverable): array
    {
        $contentItems = [];
        
        switch ($deliverable->product_type) {
            case 'wish':
                if ($deliverable->wishItem) {
                    $wish = $deliverable->wishItem;
                    $contentItems[] = [
                        'wish_id' => $wish->id,
                        'wish_name' => $wish->wishname ?? 'Unknown Wish',
                        'content_url' => $this->generateContentUrl($wish->content_file ?? $wish->reward),
                        'content_type' => $wish->content_file_type ?? 'image',
                        'source' => !empty($wish->content_file) ? 'content_file' : 'reward'
                    ];
                } else {
                    // Fallback for wishes without wishItem relation
                    $contentItems[] = [
                        'wish_id' => $deliverable->item_id ?? 0,
                        'wish_name' => 'Wish Item',
                        'content_url' => $deliverable->deliverable_url,
                        'content_type' => 'file',
                        'source' => 'wish_fallback'
                    ];
                }
                break;
                
            case 'bill':
                // Bills use item_id as bill ID, wish_name as bill name
                $billName = 'Bill';
                if ($deliverable->bill) {
                    $billName = $deliverable->bill->name ?? 'Bill';
                }
                
                $contentItems[] = [
                    'wish_id' => $deliverable->item_id ?? 0, // Bill ID
                    'wish_name' => $billName,
                    'content_url' => $deliverable->deliverable_url,
                    'content_type' => 'file',
                    'source' => 'bill_content'
                ];
                break;
                
            case 'membership':
                // Memberships use item_id as membership ID
                $membershipName = 'Membership';
                if ($deliverable->membership) {
                    $membershipName = $deliverable->membership->name ?? 'Membership';
                }
                
                $contentItems[] = [
                    'wish_id' => $deliverable->item_id ?? 0, // Membership ID
                    'wish_name' => $membershipName,
                    'content_url' => $deliverable->deliverable_url,
                    'content_type' => 'membership',
                    'source' => 'membership_content'
                ];
                break;
                
            case 'shop_item':
                // Shop items use item_id as shop item ID
                $contentItems[] = [
                    'wish_id' => $deliverable->item_id ?? 0, // Shop item ID
                    'wish_name' => 'Shop Item',
                    'content_url' => $deliverable->deliverable_url,
                    'content_type' => 'file',
                    'source' => 'shop_item'
                ];
                break;
                
            default:
                // Fallback for unknown product types
                $contentItems[] = [
                    'wish_id' => $deliverable->item_id ?? 0,
                    'wish_name' => ucfirst($deliverable->product_type) . ' Item',
                    'content_url' => $deliverable->deliverable_url,
                    'content_type' => 'file',
                    'source' => $deliverable->product_type
                ];
                break;
        }
        
        // Ensure we always have at least one item for consistent metadata structure
        if (empty($contentItems)) {
            $contentItems[] = [
                'wish_id' => $deliverable->item_id ?? 0,
                'wish_name' => ucfirst($deliverable->product_type ?? 'Item'),
                'content_url' => $deliverable->deliverable_url ?? null,
                'content_type' => 'file',
                'source' => $deliverable->product_type ?? 'unknown'
            ];
        }
        
        return $contentItems;
    }
    
    /**
     * Generate content URL from file path/identifier
     * 
     * @param string|null $fileIdentifier
     * @return string|null
     */
    private function generateContentUrl(?string $fileIdentifier): ?string
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
     * Update multiple payment intents in batch
     * 
     * @param array $paymentIntentUpdates Array of ['payment_intent_id', 'certificate_url', 'delivery_status', 'additional_metadata']
     * @return array Results with success/failure status for each
     */
    public function batchUpdatePaymentIntents(array $paymentIntentUpdates): array
    {
        $results = [];
        
        foreach ($paymentIntentUpdates as $update) {
            $paymentIntentId = $update['payment_intent_id'];
            $certificateUrl = $update['certificate_url'] ?? null;
            $deliveryStatus = $update['delivery_status'] ?? 'pending';
            $additionalMetadata = $update['additional_metadata'] ?? [];
            $deliverableUuid = $update['deliverable_uuid'] ?? null;
            
            $success = $this->updatePaymentIntentMetadata(
                $paymentIntentId,
                $certificateUrl,
                $deliveryStatus,
                $additionalMetadata,
                $deliverableUuid
            );
            
            $results[] = [
                'payment_intent_id' => $paymentIntentId,
                'success' => $success
            ];
        }
        
        Log::info('StripeMetadataService: Batch update completed', [
            'total_updates' => count($paymentIntentUpdates),
            'successful_updates' => count(array_filter($results, fn($r) => $r['success'])),
            'failed_updates' => count(array_filter($results, fn($r) => !$r['success']))
        ]);
        
        return $results;
    }
    
    /**
     * Update payment intent with content delivery status specifically
     * This is a convenience method for common content delivery scenarios
     * Note: This method should not be used for support payments
     * 
     * @param string $paymentIntentId
     * @param bool $hasContent
     * @param string|null $contentUrl
     * @param string|null $certificateUrl
     * @return bool
     */
    public function updateContentDeliveryStatus(
        string $paymentIntentId, 
        bool $hasContent, 
        ?string $contentUrl = null,
        ?string $certificateUrl = null
    ): bool {
        $metadata = [
            'has_content' => $hasContent ? 'true' : 'false',
            'content_delivery_status' => $hasContent ? 'delivered' : 'no_content'
        ];
        
        if ($contentUrl) {
            $metadata['content_url'] = $contentUrl;
        }
        
        $deliveryStatus = $hasContent ? 'completed' : 'delivered';
        
        return $this->updatePaymentIntentMetadata(
            $paymentIntentId,
            $certificateUrl,
            $deliveryStatus,
            $metadata,
            null,
            false // Don't skip delivery fields for regular content
        );
    }
    
    /**
     * Update payment intent for support payments (tips/donations)
     * This excludes delivery/certificate fields entirely
     * 
     * @param string $paymentIntentId
     * @param array $additionalMetadata
     * @return bool
     */
    public function updateSupportPaymentMetadata(
        string $paymentIntentId,
        array $additionalMetadata = []
    ): bool {
        $metadata = array_merge([
            'payment_type' => 'tip_donation',
            'support_payment' => 'true'
        ], $additionalMetadata);
        
        return $this->updatePaymentIntentMetadata(
            $paymentIntentId,
            null, // No certificate
            'pending', // Not used anyway
            $metadata,
            null, // No deliverable UUID
            true // Skip delivery fields
        );
    }
}