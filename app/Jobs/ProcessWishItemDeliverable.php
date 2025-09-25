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
            
            if ($this->deliverable->product_type === 'membership_onetime' || $this->deliverable->product_type === 'membership_subscription') {
                // Handle membership deliverable
                $item = \App\Models\Membership::find($this->deliverable->item_id);
                if (!$item) {
                    throw new \Exception("Membership not found for deliverable {$this->deliverable->id}");
                }
                $this->processMembershipDeliverable($item);
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

            // Mark as delivered
            $this->deliverable->update([
                'status' => 'delivered',
                'delivered_at' => now()
            ]);

            // Clear activity cache to ensure real-time updates
            if ($item && $item->user) {
                app(\App\Services\CreatorActivityService::class)->clearActivityCache($item->user);
            }

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
            'metadata' => json_encode(array_merge($metadata, [
                'bundle_created_at' => now()->toISOString(),
                'bundle_size' => Storage::size($bundlePath),
                'certificate_generated' => !empty($certificateUrl) || !empty($this->deliverable->certificate_url)
            ]))
        ]);
        
        // Update Stripe payment intent metadata with certificate URL
        if (($certificateUrl ?: $this->deliverable->certificate_url) && $this->deliverable->payment_intent_id) {
            $this->updateStripeMetadata($certificateUrl ?: $this->deliverable->certificate_url);
        }
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
            'metadata' => json_encode(array_merge($metadata, [
                'content_file_name' => $item->content_file_name,
                'content_file_type' => $item->content_file_type,
                'content_file_uuid' => $item->content_file,
                'content_processed_at' => now()->toISOString(),
                'delivery_type' => 'uploadcare_file',
                'certificate_generated' => !empty($certificateUrl) || !empty($this->deliverable->certificate_url)
            ]))
        ]);
        
        // Update Stripe payment intent metadata with certificate URL
        if (($certificateUrl ?: $this->deliverable->certificate_url) && $this->deliverable->payment_intent_id) {
            $this->updateStripeMetadata($certificateUrl ?: $this->deliverable->certificate_url);
        }
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
            'metadata' => json_encode([
                'subscription_processed_at' => now()->toISOString(),
                'content_type' => 'subscription_access'
            ])
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
        
        // Generate and upload membership certificate to Uploadcare
        $certificateService = app(CertificateService::class);
        $certificateUrl = $certificateService->generateAndUploadCertificate($this->deliverable, $membership);
        
        // Create access URL (could be a direct link to membership benefits page)
        $accessUrl = env('APP_URL') . '/' . $membership->user->username . '/memberships';
        
        // Get metadata
        $metadata = json_decode($this->deliverable->metadata, true) ?? [];
        
        // Update deliverable with membership-specific data
        $this->deliverable->update([
            'deliverable_url' => $accessUrl, // Link to membership benefits page
            'certificate_url' => $certificateUrl, // Certificate download link from Uploadcare
            'metadata' => json_encode(array_merge($metadata, [
                'membership_processed_at' => now()->toISOString(),
                'content_type' => 'membership_access',
                'access_url' => $accessUrl,
                'certificate_generated' => !empty($certificateUrl),
                'membership_thumbnail' => $membership->perma_link ?? null,
                'creator_username' => ($membership->user->username ?? 'Unknown')
            ]))
        ]);
        
        // Update Stripe payment intent metadata with certificate URL
        if ($certificateUrl && $this->deliverable->payment_intent_id) {
            $this->updateStripeMetadata($certificateUrl);
        }
    }
    
    /**
     * Update Stripe payment intent metadata with certificate URL
     */
    private function updateStripeMetadata($certificateUrl)
    {
        try {
            // Initialize Stripe
            \Stripe\Stripe::setApiKey(env('STRIPE_SECRET_KEY'));
            
            // Update payment intent metadata
            \Stripe\PaymentIntent::update($this->deliverable->payment_intent_id, [
                'metadata' => [
                    'certificate_url' => $certificateUrl,
                    'certificate_id' => $this->deliverable->uuid,
                    'delivery_status' => 'completed',
                    'updated_at' => now()->toISOString()
                ]
            ]);
            
            Log::info('Updated Stripe payment intent metadata with certificate', [
                'payment_intent_id' => $this->deliverable->payment_intent_id,
                'certificate_url' => $certificateUrl,
                'deliverable_id' => $this->deliverable->id
            ]);
            
        } catch (\Exception $e) {
            Log::error('Failed to update Stripe payment intent metadata', [
                'payment_intent_id' => $this->deliverable->payment_intent_id,
                'deliverable_id' => $this->deliverable->id,
                'certificate_url' => $certificateUrl,
                'error' => $e->getMessage()
            ]);
        }
    }
}
