<?php

namespace App\Jobs;

use App\Models\Deliverable;
use App\Models\WishItem;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use ZipArchive;

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
            switch ($this->deliverable->deliverable_type) {
                case 'media_bundle':
                    $this->processMediaBundle($item);
                    break;
                
                case 'content_file':
                    $this->processContentFile($item);
                    break;
                
                case 'subscription_content':
                    $this->processSubscriptionContent($item);
                    break;
                
                default:
                    // Default to content file if wish item has content_file, otherwise media bundle
                    if ($item->content_file) {
                        $this->processContentFile($item);
                    } else {
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
        
        // Generate certificate if requested
        $certificatePath = null;
        $metadata = json_decode($this->deliverable->metadata, true);
        if (($metadata['certificate'] ?? 'true') === 'true') {
            $certificatePath = $this->generateCertificate($item);
        }

        // Update deliverable with file paths
        $this->deliverable->update([
            'content_url' => $bundlePath,
            'certificate_url' => $certificatePath,
            'metadata' => json_encode(array_merge($metadata, [
                'bundle_created_at' => now()->toISOString(),
                'bundle_size' => Storage::size($bundlePath)
            ]))
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
        
        // Generate certificate if requested
        $certificatePath = null;
        $metadata = json_decode($this->deliverable->metadata, true);
        if (($metadata['certificate'] ?? 'true') === 'true') {
            $certificatePath = $this->generateCertificate($item);
        }

        // Update deliverable with file paths
        $this->deliverable->update([
            'content_url' => $contentUrl,
            'certificate_url' => $certificatePath,
            'metadata' => json_encode(array_merge($metadata, [
                'content_file_name' => $item->content_file_name,
                'content_file_type' => $item->content_file_type,
                'content_file_uuid' => $item->content_file,
                'content_processed_at' => now()->toISOString(),
                'delivery_type' => 'uploadcare_file'
            ]))
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
     * Generate certificate for the deliverable
     */
    private function generateCertificate($item): string
    {
        $certificateName = "certificate_{$this->deliverable->uuid}.pdf";
        $certificatePath = "deliverables/certificates/{$certificateName}";
        
        // Ensure directory exists
        Storage::makeDirectory('deliverables/certificates');

        // Simple certificate content (in a real implementation, you'd use a PDF library)
        $certificateContent = $this->generateCertificateContent($item);
        
        Storage::put($certificatePath, $certificateContent);
        
        return $certificatePath;
    }

    /**
     * Generate certificate content
     */
    private function generateCertificateContent($item): string
    {
        $itemName = $item->wishname ?? $item->name ?? 'Digital Content';
        
        return "CERTIFICATE OF AUTHENTICITY\n\n" .
               "This certifies that the digital content for:\n" .
               "'{$itemName}'\n\n" .
               "Created by: {$item->user->name}\n" .
               "Deliverable ID: {$this->deliverable->uuid}\n" .
               "Generated on: " . now()->format('Y-m-d H:i:s') . "\n\n" .
               "This certificate validates the authenticity of the digital deliverable.";
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
            'content_url' => $contentUrl, // Direct link for subscriptions
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
        
        // Generate membership access certificate
        $certificatePath = $this->generateMembershipCertificate($membership);
        
        // Create access URL (could be a direct link to membership benefits page)
        $accessUrl = env('APP_URL') . '/' . $membership->user->username . '/memberships';
        
        // Get metadata
        $metadata = json_decode($this->deliverable->metadata, true) ?? [];
        
        // Update deliverable with membership-specific data
        $this->deliverable->update([
            'deliverable_url' => $accessUrl, // Link to membership benefits page
            'content_url' => $certificatePath, // Certificate download link
            'certificate_url' => $certificatePath,
            'metadata' => json_encode(array_merge($metadata, [
                'membership_processed_at' => now()->toISOString(),
                'content_type' => 'membership_access',
                'access_url' => $accessUrl,
                'certificate_generated' => !empty($certificatePath),
                'membership_thumbnail' => $membership->perma_link ?? null,
                'creator_username' => ($membership->user->username ?? 'Unknown')
            ]))
        ]);
    }
    
    /**
     * Generate membership access certificate
     */
    private function generateMembershipCertificate(\App\Models\Membership $membership): ?string
    {
        try {
            $certificateName = "membership_certificate_{$this->deliverable->uuid}.pdf";
            $certificatePath = "deliverables/certificates/{$certificateName}";
            
            // Ensure directory exists
            Storage::makeDirectory('deliverables/certificates');
            
            // Generate certificate content for membership
            $certificateContent = $this->generateMembershipCertificateContent($membership);
            
            Storage::put($certificatePath, $certificateContent);
            
            return Storage::url($certificatePath);
        } catch (\Exception $e) {
            Log::error("Failed to generate membership certificate", [
                'membership_id' => $membership->id,
                'deliverable_id' => $this->deliverable->id,
                'error' => $e->getMessage()
            ]);
            return null;
        }
    }
    
    /**
     * Generate membership certificate content
     */
    private function generateMembershipCertificateContent(\App\Models\Membership $membership): string
    {
        $metadata = json_decode($this->deliverable->metadata, true) ?? [];
        $membershipLevel = $metadata['membership_level'] ?? ($membership->level ?? 'Member');
        $creatorName = $membership->user->name ?? 'Creator';
        $buyerName = $this->deliverable->customer_name ?? ($this->deliverable->gifter->name ?? 'Member');
        
        return "🏆 MEMBERSHIP ACCESS CERTIFICATE 🏆\n\n" .
               "This certifies that:\n" .
               "'{$buyerName}'\n\n" .
               "Has successfully subscribed to:\n" .
               "'{$creatorName}'s {$membershipLevel} Membership'\n\n" .
               "Membership Benefits Included:\n" .
               $this->formatMembershipRewards($membership) . "\n\n" .
               "Certificate ID: {$this->deliverable->uuid}\n" .
               "Generated on: " . now()->format('Y-m-d H:i:s') . "\n\n" .
               "Access your membership benefits at:\n" .
               env('APP_URL') . '/' . $membership->user->username . "/memberships\n\n" .
               "This certificate validates your membership access and benefits.";
    }
    
    /**
     * Format membership rewards for certificate
     */
    private function formatMembershipRewards(\App\Models\Membership $membership): string
    {
        $rewards = json_decode($membership->rewards, true) ?? [];
        
        if (empty($rewards)) {
            return "• Exclusive membership benefits";
        }
        
        $formattedRewards = "";
        foreach ($rewards as $index => $reward) {
            $formattedRewards .= "• " . $reward . "\n";
        }
        
        return trim($formattedRewards);
    }
}