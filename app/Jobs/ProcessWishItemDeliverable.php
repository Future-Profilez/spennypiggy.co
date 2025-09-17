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

            // Get the wish item
            $wishItem = WishItem::find($this->deliverable->wish_id);
            if (!$wishItem) {
                throw new \Exception("Wish item not found for deliverable {$this->deliverable->id}");
            }

            // Process based on deliverable type
            switch ($this->deliverable->deliverable_type) {
                case 'media_bundle':
                    $this->processMediaBundle($wishItem);
                    break;
                
                case 'content_file':
                    $this->processContentFile($wishItem);
                    break;
                
                case 'subscription_content':
                    $this->processSubscriptionContent($wishItem);
                    break;
                
                default:
                    // Default to content file if wish item has content_file, otherwise media bundle
                    if ($wishItem->content_file) {
                        $this->processContentFile($wishItem);
                    } else {
                        $this->processMediaBundle($wishItem);
                    }
            }

            // Mark as delivered
            $this->deliverable->update([
                'status' => 'delivered',
                'delivered_at' => now()
            ]);

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
    private function processMediaBundle(WishItem $wishItem): void
    {
        // Create media bundle (ZIP file with wish item content)
        $bundlePath = $this->createMediaBundle($wishItem);
        
        // Generate certificate if requested
        $certificatePath = null;
        $metadata = json_decode($this->deliverable->metadata, true);
        if (($metadata['certificate'] ?? 'true') === 'true') {
            $certificatePath = $this->generateCertificate($wishItem);
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
    private function processContentFile(WishItem $wishItem): void
    {
        if (!$wishItem->content_file) {
            throw new \Exception("No content file found for wish item {$wishItem->id}");
        }

        // Get the content file URL from Uploadcare
        $contentUrl = $wishItem->content_file_url;
        
        // Generate certificate if requested
        $certificatePath = null;
        $metadata = json_decode($this->deliverable->metadata, true);
        if (($metadata['certificate'] ?? 'true') === 'true') {
            $certificatePath = $this->generateCertificate($wishItem);
        }

        // Update deliverable with file paths
        $this->deliverable->update([
            'content_url' => $contentUrl,
            'certificate_url' => $certificatePath,
            'metadata' => json_encode(array_merge($metadata, [
                'content_file_name' => $wishItem->content_file_name,
                'content_file_type' => $wishItem->content_file_type,
                'content_file_uuid' => $wishItem->content_file,
                'content_processed_at' => now()->toISOString(),
                'delivery_type' => 'uploadcare_file'
            ]))
        ]);
    }

    /**
     * Create media bundle ZIP file
     */
    private function createMediaBundle(WishItem $wishItem): string
    {
        $zip = new ZipArchive();
        $bundleName = "wish_item_{$wishItem->id}_{$this->deliverable->uuid}.zip";
        $bundlePath = "deliverables/bundles/{$bundleName}";
        $fullPath = Storage::path($bundlePath);

        // Ensure directory exists
        Storage::makeDirectory('deliverables/bundles');

        if ($zip->open($fullPath, ZipArchive::CREATE) !== TRUE) {
            throw new \Exception("Cannot create ZIP file: {$fullPath}");
        }

        // Add wish item images/videos to bundle
        if ($wishItem->image_url) {
            $this->addFileToZip($zip, $wishItem->image_url, 'main_image.jpg');
        }

        if ($wishItem->video_url) {
            $this->addFileToZip($zip, $wishItem->video_url, 'main_video.mp4');
        }

        // Add metadata file
        $metadataContent = json_encode([
            'wish_item' => [
                'id' => $wishItem->id,
                'name' => $wishItem->wishname,
                'description' => $wishItem->description,
                'creator' => $wishItem->user->name ?? 'Unknown',
                'created_at' => $wishItem->created_at->toISOString()
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
    private function generateCertificate(WishItem $wishItem): string
    {
        $certificateName = "certificate_{$this->deliverable->uuid}.pdf";
        $certificatePath = "deliverables/certificates/{$certificateName}";
        
        // Ensure directory exists
        Storage::makeDirectory('deliverables/certificates');

        // Simple certificate content (in a real implementation, you'd use a PDF library)
        $certificateContent = $this->generateCertificateContent($wishItem);
        
        Storage::put($certificatePath, $certificateContent);
        
        return $certificatePath;
    }

    /**
     * Generate certificate content
     */
    private function generateCertificateContent(WishItem $wishItem): string
    {
        return "CERTIFICATE OF AUTHENTICITY\n\n" .
               "This certifies that the digital content for:\n" .
               "'{$wishItem->wishname}'\n\n" .
               "Created by: {$wishItem->user->name}\n" .
               "Deliverable ID: {$this->deliverable->uuid}\n" .
               "Generated on: " . now()->format('Y-m-d H:i:s') . "\n\n" .
               "This certificate validates the authenticity of the digital deliverable.";
    }

    /**
     * Process subscription content deliverable
     */
    private function processSubscriptionContent(WishItem $wishItem): void
    {
        // For subscription content, we might handle differently
        // This is a placeholder for subscription-specific logic
        Log::info("Processing subscription content", [
            'wish_item_id' => $wishItem->id,
            'deliverable_id' => $this->deliverable->id
        ]);

        // Update deliverable with subscription-specific data
        $this->deliverable->update([
            'content_url' => $wishItem->image_url, // Direct link for subscriptions
            'metadata' => json_encode([
                'subscription_processed_at' => now()->toISOString(),
                'content_type' => 'subscription_access'
            ])
        ]);
    }
}