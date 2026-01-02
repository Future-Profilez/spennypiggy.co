<?php

namespace App\Jobs;

use App\Models\Deliverable;
use App\Models\WishItem;
use App\Services\CertificateService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use ZipArchive;
use Stripe\StripeClient;
use Stripe\PaymentIntent;

class ProcessWishItemDeliverable implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    protected $deliverable;

    /**
     * Create a new job instance.
     */
    public function __construct(Deliverable $deliverable)
    {
        $this->deliverable = $deliverable;
    }

    /**
     * Execute the job.
     */
    public function handle(): void
    {
        try {
            Log::info("Processing wish item deliverable", [
                'deliverable_id' => $this->deliverable->id,
                'uuid' => $this->deliverable->uuid
            ]);

            // Determine the item type and get the appropriate item
            $item = null;
            $metadata = json_decode($this->deliverable->metadata, true) ?? [];
            
            if ($this->deliverable->product_type === 'support_payment') {
                // Handle support payment - just update metadata, no certificate generation
                $this->processSupportPaymentDeliverable();
                return;
            } elseif ($this->deliverable->product_type === 'membership' || $this->deliverable->product_type === 'membership_onetime' || $this->deliverable->product_type === 'membership_subscription') {
                // Handle membership deliverable
                $item = \App\Models\Membership::find($this->deliverable->item_id);
                if (!$item) {
                    throw new \Exception("Membership not found for deliverable {$this->deliverable->id}");
                }
                $this->processMembershipDeliverable($item);
                return;
            } elseif ($this->deliverable->product_type === 'bill') {
                // Handle bill deliverable
                $item = \App\Models\Bills::find($this->deliverable->item_id);
                if (!$item && isset($metadata['bill_id'])) {
                    // Fallback to metadata bill_id
                    $item = \App\Models\Bills::find($metadata['bill_id']);
                }
                if (!$item) {
                    throw new \Exception("Bill not found for deliverable {$this->deliverable->id}");
                }
                $this->processBillDeliverable($item);
                return;
            } elseif ($this->deliverable->product_type === 'task') {
                // Handle task deliverable
                $item = \App\Models\Task::find($this->deliverable->item_id);
                if (!$item) {
                    throw new \Exception("Task not found for deliverable {$this->deliverable->id}");
                }
                $this->processTaskDeliverable($item);
                return;
            } else {
                // Handle wish item deliverable (existing logic)
                $wishItem = \App\Models\WishItem::find($this->deliverable->item_id);
                if (!$wishItem && isset($metadata['wish_id'])) {
                    // Fallback to metadata wish_id for backwards compatibility
                    $wishItem = \App\Models\WishItem::find($metadata['wish_id']);
                }
                if (!$wishItem) {
                    throw new \Exception("Wish item not found for deliverable {$this->deliverable->id}");
                }
                $item = $wishItem;
            }

            // Process based on deliverable type for wish items
            Log::info("ProcessWishItemDeliverable: Determining processing type", [
                'deliverable_id' => $this->deliverable->id,
                'deliverable_type' => $this->deliverable->deliverable_type,
                'item_has_content_file' => !empty($item->content_file),
                'item_content_file' => $item->content_file ?? 'null'
            ]);
            
            switch ($this->deliverable->deliverable_type) {
                case 'media_bundle':
                    Log::info("ProcessWishItemDeliverable: Processing as media_bundle", ['deliverable_id' => $this->deliverable->id]);
                    $this->processMediaBundle($item);
                    break;
                
                case 'content_file':
                    Log::info("ProcessWishItemDeliverable: Processing as content_file", ['deliverable_id' => $this->deliverable->id]);
                    $this->processContentFile($item);
                    break;
                
                case 'subscription_content':
                    Log::info("ProcessWishItemDeliverable: Processing as subscription_content", ['deliverable_id' => $this->deliverable->id]);
                    $this->processSubscriptionContent($item);
                    break;
                
                default:
                    Log::info("ProcessWishItemDeliverable: Processing as default type", [
                        'deliverable_id' => $this->deliverable->id,
                        'deliverable_type' => $this->deliverable->deliverable_type,
                        'will_process_content_file' => !empty($item->content_file)
                    ]);
                    
                    // Default to content file if wish item has content_file, otherwise media bundle
                    if ($item->content_file) {
                        Log::info("ProcessWishItemDeliverable: Calling processContentFile from default", ['deliverable_id' => $this->deliverable->id]);
                        $this->processContentFile($item);
                    } else {
                        Log::info("ProcessWishItemDeliverable: Calling processMediaBundle from default", ['deliverable_id' => $this->deliverable->id]);
                        $this->processMediaBundle($item);
                    }
            }

            // Cache clearing removed - CreatorActivityService no longer uses Redis cache

            Log::info("Successfully processed deliverable", [
                'deliverable_id' => $this->deliverable->id,
                'type' => $this->deliverable->deliverable_type
            ]);

        } catch (\Exception $e) {
            Log::error("Failed to process deliverable", [
                'deliverable_id' => $this->deliverable->id,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);

            // Mark as failed
            $this->deliverable->update([
                'status' => 'failed',
                'failure_reason' => $e->getMessage()
            ]);

            throw $e;
        }
    }

    /**
     * Process task deliverable
     */
    private function processTaskDeliverable($item): void
    {
        // Generate and upload certificate to Uploadcare if requested
        $certificateUrl = null;
        $metadata = json_decode($this->deliverable->metadata, true) ?? [];
        
        if (($metadata['certificate'] ?? 'true') === 'true') {
            $certificateService = app(CertificateService::class);
            $certificateUrl = $certificateService->generateAndUploadCertificate($this->deliverable, $item);
        }

        // Update deliverable
        // For tasks, we don't necessarily have a "bundle" yet unless it's instant.
        // If it's instant, the StripeWebhookController already handled status = completed.
        // We just update the certificate.
        
        $updateData = [
            'certificate_url' => $certificateUrl,
            'metadata' => json_encode(array_merge($metadata, [
                'certificate_generated' => !empty($certificateUrl)
            ]))
        ];

        // Only set status to delivered if it's not already set (StripeWebhook might set it for Instant)
        // Or if we consider the "Deliverable" (the receipt) as delivered.
        // However, ProfileController looks for whereNotNull('deliverable_url'). 
        // We need to ensure deliverable_url is set if we want it to show up, 
        // OR modify ProfileController to look for certificate_url too.
        // If deliverable_url is null, let's set it to certificate_url as a fallback so it shows up?
        // But deliverable_url usually implies the CONTENT.
        // For timed tasks, there is no content yet.
        // Let's rely on ProfileController modification to check certificate_url.
        
        $this->deliverable->update($updateData);
        
        // Update Stripe metadata
        $this->updateStripeMetadata($certificateUrl, [
            'certificate_generated' => !empty($certificateUrl) ? 'true' : 'false',
            'content_type' => 'task_service'
        ]);
    }

    /**
     * Process media bundle deliverable
     */
    private function processMediaBundle($item): void
    {
        // Create media bundle (ZIP file with wish item content)
        $bundlePath = $this->createMediaBundle($item);
        
        // Generate and upload certificate to Uploadcare if requested
        $certificateUrl = null;
        $metadata = json_decode($this->deliverable->metadata, true) ?? [];
        
        if (($metadata['certificate'] ?? 'true') === 'true') {
            $certificateService = app(CertificateService::class);
            $certificateUrl = $certificateService->generateAndUploadCertificate($this->deliverable, $item);
        }

        // Update deliverable with file paths
        $this->deliverable->update([
            'deliverable_url' => $bundlePath,
            // Preserve existing certificate_url if this run didn't generate one
            'certificate_url' => $certificateUrl ?: $this->deliverable->certificate_url,
            'status' => 'delivered',
            'delivered_at' => now(),
            'metadata' => json_encode(array_merge($metadata, [
                'bundle_created_at' => now()->toISOString(),
                'bundle_size' => Storage::size($bundlePath),
                'certificate_generated' => !empty($certificateUrl) || !empty($this->deliverable->certificate_url)
            ]))
        ]);
        
        // Always update Stripe payment intent metadata for media bundles
        $this->updateStripeMetadata($certificateUrl ?: $this->deliverable->certificate_url, [
            'bundle_created_at' => now()->toISOString(),
            'bundle_size' => (string) Storage::size($bundlePath),
            'certificate_generated' => (!empty($certificateUrl) || !empty($this->deliverable->certificate_url)) ? 'true' : 'false',
            'content_type' => 'media_bundle'
        ]);
    }

    /**
     * Process content file deliverable
     */
    private function processContentFile($item): void
    {
        if (!$item->content_file) {
            throw new \Exception("No content file found for item {$item->id}");
        }

        // Get the content file URL from Uploadcare
        $contentUrl = $item->content_file_url;
        
        // Generate and upload certificate to Uploadcare if requested
        $certificateUrl = null;
        $metadata = json_decode($this->deliverable->metadata, true) ?? [];
        
        Log::info("ProcessContentFile: Checking certificate generation", [
            'deliverable_id' => $this->deliverable->id,
            'metadata_certificate' => $metadata['certificate'] ?? 'not set',
            'will_generate' => ($metadata['certificate'] ?? 'true') === 'true'
        ]);
        
        if (($metadata['certificate'] ?? 'true') === 'true') {
            Log::info("ProcessContentFile: Starting certificate generation", [
                'deliverable_id' => $this->deliverable->id
            ]);
            $certificateService = app(CertificateService::class);
            $certificateUrl = $certificateService->generateAndUploadCertificate($this->deliverable, $item);
            Log::info("ProcessContentFile: Certificate generation completed", [
                'deliverable_id' => $this->deliverable->id,
                'certificate_url' => $certificateUrl ?: 'Failed'
            ]);
        }

        // Update deliverable with file paths
        $this->deliverable->update([
            'deliverable_url' => $contentUrl,
            // Preserve existing certificate_url if this run didn't generate one
            'certificate_url' => $certificateUrl ?: $this->deliverable->certificate_url,
            'status' => 'delivered',
            'delivered_at' => now(),
            'metadata' => json_encode(array_merge($metadata, [
                'content_file_name' => $item->content_file_name,
                'content_file_type' => $item->content_file_type,
                'content_file_uuid' => $item->content_file,
                'content_processed_at' => now()->toISOString(),
                'delivery_type' => 'uploadcare_file',
                'certificate_generated' => !empty($certificateUrl) || !empty($this->deliverable->certificate_url)
            ]))
        ]);
        
        // Always update Stripe payment intent metadata for content files
        $this->updateStripeMetadata($certificateUrl ?: $this->deliverable->certificate_url, [
            'content_file_name' => $item->content_file_name ?? 'unknown',
            'content_file_type' => $item->content_file_type ?? 'unknown',
            'content_processed_at' => now()->toISOString(),
            'delivery_type' => 'uploadcare_file',
            'certificate_generated' => (!empty($certificateUrl) || !empty($this->deliverable->certificate_url)) ? 'true' : 'false',
            'content_type' => 'content_file'
        ]);
    }

    /**
     * Create media bundle ZIP file
     */
    private function createMediaBundle($item): string
    {
        $zip = new ZipArchive();
        $bundleName = "item_{$item->id}_{$this->deliverable->uuid}.zip";
        $bundlePath = "deliverables/bundles/{$bundleName}";
        $fullPath = Storage::path($bundlePath);

        // Ensure directory exists
        Storage::makeDirectory('deliverables/bundles');

        if ($zip->open($fullPath, ZipArchive::CREATE) !== TRUE) {
            throw new \Exception("Cannot create ZIP file: {$fullPath}");
        }

        // Add item images/videos to bundle
        if (isset($item->image_url) && $item->image_url) {
            $this->addFileToZip($zip, $item->image_url, 'main_image.jpg');
        }

        if (isset($item->video_url) && $item->video_url) {
            $this->addFileToZip($zip, $item->video_url, 'main_video.mp4');
        }

        // Add metadata file
        $itemName = $item->wishname ?? $item->name ?? 'Item';
        $itemDescription = $item->description ?? 'No description';
        $creatorName = $item->user->name ?? 'Unknown';
        
        $metadataContent = json_encode([
            'item' => [
                'id' => $item->id,
                'name' => $itemName,
                'description' => $itemDescription,
                'creator' => $creatorName,
                'created_at' => $item->created_at->toISOString()
            ],
            'deliverable' => [
                'uuid' => $this->deliverable->uuid,
                'created_at' => $this->deliverable->created_at->toISOString(),
                'gifter_id' => $this->deliverable->gifter_id
            ]
        ], JSON_PRETTY_PRINT);

        $zip->addFromString('metadata.json', $metadataContent);
        $zip->close();

        return $bundlePath;
    }

    /**
     * Add file to ZIP from URL
     */
    private function addFileToZip(ZipArchive $zip, string $url, string $filename): void
    {
        try {
            $content = file_get_contents($url);
            if ($content !== false) {
                $zip->addFromString($filename, $content);
            }
        } catch (\Exception $e) {
            Log::warning("Failed to add file to ZIP", [
                'url' => $url,
                'filename' => $filename,
                'error' => $e->getMessage()
            ]);
        }
    }


    /**
     * Process subscription content deliverable
     */
    private function processSubscriptionContent($item): void
    {
        // For subscription content, we might handle differently
        // This is a placeholder for subscription-specific logic
        Log::info("Processing subscription content", [
            'item_id' => $item->id,
            'deliverable_id' => $this->deliverable->id
        ]);

        // Update deliverable with subscription-specific data
        $contentUrl = $item->image_url ?? null;
        $this->deliverable->update([
            'deliverable_url' => $contentUrl, // Direct link for subscriptions
            'status' => 'delivered',
            'delivered_at' => now(),
            'metadata' => json_encode([
                'subscription_processed_at' => now()->toISOString(),
                'content_type' => 'subscription_access'
            ])
        ]);
        
        // Update Stripe payment intent metadata
        $this->updateStripeMetadata(null, [
            'subscription_processed_at' => now()->toISOString(),
            'content_type' => 'subscription_access'
        ]);
    }
    
    /**
     * Process membership deliverable (access certificate)
     */
    private function processMembershipDeliverable(\App\Models\Membership $membership): void
    {
        Log::info("Processing membership deliverable", [
            'membership_id' => $membership->id,
            'deliverable_id' => $this->deliverable->id
        ]);
        
        // Check if certificate already exists to prevent duplicates
        if (!empty($this->deliverable->certificate_url)) {
            Log::info("Certificate already exists for membership deliverable", [
                'deliverable_id' => $this->deliverable->id,
                'existing_certificate_url' => $this->deliverable->certificate_url
            ]);
            // Still update status to delivered if it's not already
            if ($this->deliverable->status !== 'delivered') {
                $this->deliverable->update([
                    'status' => 'delivered',
                    'delivered_at' => now()
                ]);
            }
            return;
        }
        
        // Generate and upload membership certificate to Uploadcare
        $certificateService = app(CertificateService::class);
        $certificateUrl = $certificateService->generateAndUploadCertificate($this->deliverable, $membership);
        
        // Get metadata
        $metadata = json_decode($this->deliverable->metadata, true) ?? [];
        
        // Update deliverable with membership-specific data
        // NOTE: We don't set deliverable_url for memberships because they don't have downloadable content
        // This prevents "View Exclusive Content" from showing in the UI
        $this->deliverable->update([
            'deliverable_url' => null, // No content URL for memberships (only certificate)
            'certificate_url' => $certificateUrl, // Certificate download link from Uploadcare
            'status' => 'delivered',
            'delivered_at' => now(),
            'metadata' => json_encode(array_merge($metadata, [
                'membership_processed_at' => now()->toISOString(),
                'content_type' => 'membership_access',
                'certificate_generated' => !empty($certificateUrl),
                'membership_thumbnail' => $membership->perma_link ?? null,
                'creator_username' => ($membership->user->username ?? 'Unknown')
            ]))
        ]);
        
        // Always update Stripe payment intent metadata
        $this->updateStripeMetadata($certificateUrl, [
            'membership_processed_at' => now()->toISOString(),
            'content_type' => 'membership_access',
            'certificate_generated' => !empty($certificateUrl) ? 'true' : 'false',
            'membership_thumbnail' => $membership->perma_link ?? null
        ]);
    }
    
    /**
     * Process bill deliverable
     */
    private function processBillDeliverable($bill): void
    {
        Log::info("Processing bill deliverable", [
            'deliverable_id' => $this->deliverable->id,
            'bill_id' => $bill->id,
            'bill_name' => $bill->name
        ]);
        
        // Check if certificate already exists to prevent duplicates
        if (!empty($this->deliverable->certificate_url)) {
            Log::info("Certificate already exists for deliverable", [
                'deliverable_id' => $this->deliverable->id,
                'existing_certificate_url' => $this->deliverable->certificate_url
            ]);
            return;
        }
        
        // Generate and upload bill certificate to Uploadcare
        $certificateService = app(CertificateService::class);
        $certificateUrl = $certificateService->generateAndUploadCertificate($this->deliverable, $bill);
        
        // Create access URL (could be a direct link to bill content or creator page)
        $accessUrl = $bill->content_file ? "https://ucarecdn.com/{$bill->content_file}/" : (env('APP_URL') . '/' . $bill->user->username);
        
        // Get metadata
        $metadata = json_decode($this->deliverable->metadata, true) ?? [];
        
        // Update deliverable with bill-specific data
        $this->deliverable->update([
            'deliverable_url' => $accessUrl, // Link to bill content or creator page
            'certificate_url' => $certificateUrl, // Certificate download link from Uploadcare
            'status' => 'delivered',
            'delivered_at' => now(),
            'metadata' => json_encode(array_merge($metadata, [
                'bill_processed_at' => now()->toISOString(),
                'content_type' => 'bill_payment',
                'access_url' => $accessUrl,
                'certificate_generated' => !empty($certificateUrl),
                'bill_thumbnail' => $bill->perma_link ?? null,
                'creator_username' => ($bill->user->username ?? 'Unknown')
            ]))
        ]);
        
        // Always update Stripe payment intent metadata
        $this->updateStripeMetadata($certificateUrl, [
            'bill_processed_at' => now()->toISOString(),
            'content_type' => 'bill_payment',
            'access_url' => $accessUrl,
            'certificate_generated' => !empty($certificateUrl) ? 'true' : 'false',
            'bill_thumbnail' => $bill->perma_link ?? null
        ]);
    }
    
    /**
     * Process support payment deliverable (tips/donations)
     * No certificate generation, just metadata update
     */
    private function processSupportPaymentDeliverable(): void
    {
        Log::info("Processing support payment deliverable", [
            'deliverable_id' => $this->deliverable->id
        ]);
        
        // Update deliverable status - support payments are immediately "delivered"
        $this->deliverable->update([
            'status' => 'delivered',
            'delivered_at' => now(),
            'metadata' => json_encode([
                'support_processed_at' => now()->toISOString(),
                'content_type' => 'support_payment',
                'no_certificate' => true,
                'no_content' => true
            ])
        ]);
        
        // Update Stripe metadata (without delivery/certificate fields)
        $this->updateStripeMetadata(null, [
            'support_processed_at' => now()->toISOString(),
            'content_type' => 'support_payment',
            'payment_type' => 'tip_donation'
        ]);
    }
    
    /**
     * Update Stripe payment intent metadata using the centralized service
     * 
     * @param string|null $certificateUrl
     * @param array $additionalMetadata
     * @return void
     */
    private function updateStripeMetadata($certificateUrl = null, array $additionalMetadata = [])
    {
        // Use the new centralized StripeMetadataService
        $stripeMetadataService = app(\App\Services\StripeMetadataService::class);
        
        // Update the deliverable status to delivered if certificate was generated
        if ($certificateUrl && $this->deliverable->status !== 'delivered') {
            $this->deliverable->update([
                'status' => 'delivered',
                'delivered_at' => now()
            ]);
        }
        
        // Update Stripe metadata with all deliverable information
        $success = $stripeMetadataService->updateDeliverableMetadata($this->deliverable, $additionalMetadata);
        
        if ($success) {
            Log::info('ProcessWishItemDeliverable: Updated Stripe payment intent metadata', [
                'deliverable_id' => $this->deliverable->id,
                'deliverable_uuid' => $this->deliverable->uuid,
                'payment_intent_id' => $this->deliverable->payment_intent_id,
                'certificate_url' => $certificateUrl,
                'product_type' => $this->deliverable->product_type
            ]);
        }
    }
}
