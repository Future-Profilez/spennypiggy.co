<?php

namespace App\Jobs;

use App\Jobs\Concerns\RetriesCriticalWork;
use App\Models\Bills;
use App\Models\Deliverable;
use App\Models\Membership;
use App\Models\Task;
use App\Models\WishItem;
use App\Services\CertificateService;
use App\Services\StripeMetadataService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;

class ProcessWishItemDeliverable implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, RetriesCriticalWork, SerializesModels;

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
            Log::info('Processing wish item deliverable', [
                'deliverable_id' => $this->deliverable->id,
                'uuid' => $this->deliverable->uuid,
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
                $item = Membership::find($this->deliverable->item_id);
                if (! $item) {
                    throw new \Exception("Membership not found for deliverable {$this->deliverable->id}");
                }
                $this->processMembershipDeliverable($item);

                return;
            } elseif ($this->deliverable->product_type === 'bill') {
                // Handle bill deliverable
                $item = Bills::find($this->deliverable->item_id);
                if (! $item && isset($metadata['bill_id'])) {
                    // Fallback to metadata bill_id
                    $item = Bills::find($metadata['bill_id']);
                }
                if (! $item) {
                    throw new \Exception("Bill not found for deliverable {$this->deliverable->id}");
                }
                $this->processBillDeliverable($item);

                return;
            } elseif ($this->deliverable->product_type === 'task') {
                // Handle task deliverable
                $item = Task::find($this->deliverable->item_id);
                if (! $item) {
                    throw new \Exception("Task not found for deliverable {$this->deliverable->id}");
                }
                $this->processTaskDeliverable($item);

                return;
            } else {
                // Handle wish item deliverable (existing logic)
                $wishItem = WishItem::find($this->deliverable->item_id);
                if (! $wishItem && isset($metadata['wish_id'])) {
                    // Fallback to metadata wish_id for backwards compatibility
                    $wishItem = WishItem::find($metadata['wish_id']);
                }
                if (! $wishItem) {
                    throw new \Exception("Wish item not found for deliverable {$this->deliverable->id}");
                }
                $item = $wishItem;
            }

            // Process based on deliverable type for wish items
            Log::info('ProcessWishItemDeliverable: Determining processing type', [
                'deliverable_id' => $this->deliverable->id,
                'deliverable_type' => $this->deliverable->deliverable_type,
                'item_has_content_file' => ! empty($item->content_file),
                'item_content_file' => $item->content_file ?? 'null',
            ]);

            switch ($this->deliverable->deliverable_type) {
                case 'media_bundle':
                    Log::info('ProcessWishItemDeliverable: Processing as media_bundle', ['deliverable_id' => $this->deliverable->id]);
                    $this->processMediaBundle($item);
                    break;

                case 'content_file':
                    Log::info('ProcessWishItemDeliverable: Processing as content_file', ['deliverable_id' => $this->deliverable->id]);
                    $this->processContentFile($item);
                    break;

                case 'subscription_content':
                    Log::info('ProcessWishItemDeliverable: Processing as subscription_content', ['deliverable_id' => $this->deliverable->id]);
                    $this->processSubscriptionContent($item);
                    break;

                default:
                    Log::info('ProcessWishItemDeliverable: Processing as default type', [
                        'deliverable_id' => $this->deliverable->id,
                        'deliverable_type' => $this->deliverable->deliverable_type,
                        'will_process_content_file' => ! empty($item->content_file),
                    ]);

                    // Default to content file if wish item has content_file, otherwise media bundle
                    if ($item->content_file) {
                        Log::info('ProcessWishItemDeliverable: Calling processContentFile from default', ['deliverable_id' => $this->deliverable->id]);
                        $this->processContentFile($item);
                    } else {
                        Log::info('ProcessWishItemDeliverable: Calling processMediaBundle from default', ['deliverable_id' => $this->deliverable->id]);
                        $this->processMediaBundle($item);
                    }
            }

            // Cache clearing removed - CreatorActivityService no longer uses Redis cache

            Log::info('Successfully processed deliverable', [
                'deliverable_id' => $this->deliverable->id,
                'type' => $this->deliverable->deliverable_type,
            ]);

        } catch (\Exception $e) {
            Log::error('Failed to process deliverable', [
                'deliverable_id' => $this->deliverable->id,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);

            // Mark as failed.
            // ⚠️ This used to write `failure_reason`, a column that exists in
            // NO migration, is absent from the live table and is not in
            // `$fillable` — so mass assignment dropped it silently and a failed
            // deliverable recorded status and nothing else. (Had it been
            // fillable it would have thrown a SQL error inside this catch and
            // buried the original exception.) The reason goes in `metadata`,
            // which exists.
            $existing = json_decode($this->deliverable->metadata ?? '[]', true) ?: [];

            $this->deliverable->update([
                'status' => 'failed',
                'metadata' => json_encode(array_merge($existing, [
                    'failure_reason' => $e->getMessage(),
                    'failed_at' => now()->toISOString(),
                ])),
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
                'certificate_generated' => ! empty($certificateUrl),
            ])),
        ];

        // If task is instant and has content, set deliverable_url so it appears in purchases
        if ($item->type === 'instant' && ! empty($item->deliverable_content)) {
            $updateData['deliverable_url'] = $item->deliverable_content;
        }

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

        try {
            app(StripeMetadataService::class)->updateDeliverableMetadata($this->deliverable);
        } catch (\Exception $e) {
            Log::error('Failed to update Stripe metadata for task deliverable', [
                'deliverable_id' => $this->deliverable->id,
                'error' => $e->getMessage(),
            ]);
        }
    }

    /**
     * The fallback branch for a wish with no `content_file` — in practice a
     * legacy listing whose paid deliverable is the `reward` image.
     *
     * 🚨 THIS USED TO BUILD A ZIP ON LOCAL DISK AND STORE ITS PATH AS THE
     * DELIVERABLE URL. Three things were wrong with that, and together they
     * meant every one of these purchases delivered a dead link:
     *   - `deliverables/bundles/x.zip` is not a route, so
     *     `DeliveriesController::access` redirected to a path that does not
     *     resolve;
     *   - on Vapor the Lambda's filesystem is ephemeral and `public/` is
     *     stripped, so the file was gone before anyone clicked anyway;
     *   - the ZIP was assembled from `$item->image_url` / `$item->video_url`,
     *     neither of which is a column on WishItem — so it only ever contained
     *     `metadata.json`.
     * Nothing errored. The buyer simply got a link to nowhere.
     *
     * The item's own CDN media IS the deliverable, so point at it directly.
     */
    private function processMediaBundle($item): void
    {
        // Bare by rule — the column stays unsigned and the access route signs
        // per click. content_file first: a wish that has one is not legacy.
        $contentUrl = (method_exists($item, 'bareContentFileUrl') ? $item->bareContentFileUrl() : null)
            ?: (method_exists($item, 'bareRewardUrl') ? $item->bareRewardUrl() : null);

        // Generate and upload certificate to Uploadcare if requested
        $certificateUrl = null;
        $metadata = json_decode($this->deliverable->metadata, true) ?? [];

        if (($metadata['certificate'] ?? 'true') === 'true') {
            $certificateService = app(CertificateService::class);
            $certificateUrl = $certificateService->generateAndUploadCertificate($this->deliverable, $item);
        }

        if (! $contentUrl) {
            Log::info('ProcessMediaBundle: item carries no downloadable media; recording the receipt only', [
                'deliverable_id' => $this->deliverable->id,
                'item_id' => $item->id ?? null,
            ]);
        }

        $this->deliverable->update([
            // ⚠️ Never overwrite a url a previous run resolved with null.
            'deliverable_url' => $contentUrl ?: $this->deliverable->deliverable_url,
            // Preserve existing certificate_url if this run didn't generate one
            'certificate_url' => $certificateUrl ?: $this->deliverable->certificate_url,
            'status' => 'delivered',
            'delivered_at' => now(),
            'metadata' => json_encode(array_merge($metadata, [
                'delivered_at' => now()->toISOString(),
                'has_content' => (bool) $contentUrl,
                'certificate_generated' => ! empty($certificateUrl) || ! empty($this->deliverable->certificate_url),
            ])),
        ]);

        $this->updateStripeMetadata($certificateUrl ?: $this->deliverable->certificate_url, [
            'delivered_at' => now()->toISOString(),
            'certificate_generated' => (! empty($certificateUrl) || ! empty($this->deliverable->certificate_url)) ? 'true' : 'false',
            'content_type' => 'media_bundle',
        ]);
    }

    /**
     * Process content file deliverable
     */
    private function processContentFile($item): void
    {
        if (! $item->content_file) {
            throw new \Exception("No content file found for item {$item->id}");
        }

        // Get the content file URL from Uploadcare — BARE, never the signed
        // accessor: this value is persisted into deliverables.deliverable_url,
        // which stays unsigned (DeliveriesController signs per click), and
        // SecureMedia::sign() refuses to re-sign a URL already carrying a token.
        $contentUrl = $item->bareContentFileUrl();

        // Generate and upload certificate to Uploadcare if requested
        $certificateUrl = null;
        $metadata = json_decode($this->deliverable->metadata, true) ?? [];

        Log::info('ProcessContentFile: Checking certificate generation', [
            'deliverable_id' => $this->deliverable->id,
            'metadata_certificate' => $metadata['certificate'] ?? 'not set',
            'will_generate' => ($metadata['certificate'] ?? 'true') === 'true',
        ]);

        if (($metadata['certificate'] ?? 'true') === 'true') {
            Log::info('ProcessContentFile: Starting certificate generation', [
                'deliverable_id' => $this->deliverable->id,
            ]);
            $certificateService = app(CertificateService::class);
            $certificateUrl = $certificateService->generateAndUploadCertificate($this->deliverable, $item);
            Log::info('ProcessContentFile: Certificate generation completed', [
                'deliverable_id' => $this->deliverable->id,
                'certificate_url' => $certificateUrl ?: 'Failed',
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
                'certificate_generated' => ! empty($certificateUrl) || ! empty($this->deliverable->certificate_url),
            ])),
        ]);

        // Always update Stripe payment intent metadata for content files
        $this->updateStripeMetadata($certificateUrl ?: $this->deliverable->certificate_url, [
            'content_file_name' => $item->content_file_name ?? 'unknown',
            'content_file_type' => $item->content_file_type ?? 'unknown',
            'content_processed_at' => now()->toISOString(),
            'delivery_type' => 'uploadcare_file',
            'certificate_generated' => (! empty($certificateUrl) || ! empty($this->deliverable->certificate_url)) ? 'true' : 'false',
            'content_type' => 'content_file',
        ]);
    }

    /**
     * Process subscription content deliverable
     */
    private function processSubscriptionContent($item): void
    {
        // For subscription content, we might handle differently
        // This is a placeholder for subscription-specific logic
        Log::info('Processing subscription content', [
            'item_id' => $item->id,
            'deliverable_id' => $this->deliverable->id,
        ]);

        // Update deliverable with subscription-specific data
        $contentUrl = $item->image_url ?? null;
        $this->deliverable->update([
            'deliverable_url' => $contentUrl, // Direct link for subscriptions
            'status' => 'delivered',
            'delivered_at' => now(),
            'metadata' => json_encode([
                'subscription_processed_at' => now()->toISOString(),
                'content_type' => 'subscription_access',
            ]),
        ]);

        // Update Stripe payment intent metadata
        $this->updateStripeMetadata(null, [
            'subscription_processed_at' => now()->toISOString(),
            'content_type' => 'subscription_access',
        ]);
    }

    /**
     * Process membership deliverable (access certificate)
     */
    private function processMembershipDeliverable(Membership $membership): void
    {
        Log::info('Processing membership deliverable', [
            'membership_id' => $membership->id,
            'deliverable_id' => $this->deliverable->id,
        ]);

        // Check if certificate already exists to prevent duplicates
        if (! empty($this->deliverable->certificate_url)) {
            Log::info('Certificate already exists for membership deliverable', [
                'deliverable_id' => $this->deliverable->id,
                'existing_certificate_url' => $this->deliverable->certificate_url,
            ]);
            // Still update status to delivered if it's not already
            if ($this->deliverable->status !== 'delivered') {
                $this->deliverable->update([
                    'status' => 'delivered',
                    'delivered_at' => now(),
                ]);
            }

            return;
        }

        // Generate and upload membership certificate to Uploadcare
        $certificateService = app(CertificateService::class);
        $certificateUrl = $certificateService->generateAndUploadCertificate($this->deliverable, $membership);

        // Get metadata
        $metadata = json_decode($this->deliverable->metadata, true) ?? [];

        // 🚨 THIS USED TO HARDCODE NULL — "memberships don't have downloadable
        // content" was never true. A tier cannot even be published without an
        // on-platform content benefit (MembershipController::hasOnPlatformContent),
        // `memberships.content_file` is where it lives, and the bill branch below
        // has always resolved the equivalent. The result was that a member's
        // content existed in exactly ONE place on the platform: the confirmation
        // email. Bare URL by rule — DeliveriesController signs per click.
        $this->deliverable->update([
            'deliverable_url' => $membership->bareContentFileUrl(),
            'certificate_url' => $certificateUrl, // Certificate download link from Uploadcare
            'status' => 'delivered',
            'delivered_at' => now(),
            'metadata' => json_encode(array_merge($metadata, [
                'membership_processed_at' => now()->toISOString(),
                'content_type' => 'membership_access',
                'certificate_generated' => ! empty($certificateUrl),
                'membership_thumbnail' => $membership->perma_link ?? null,
                'creator_username' => ($membership->user->username ?? 'Unknown'),
            ])),
        ]);

        // Always update Stripe payment intent metadata
        $this->updateStripeMetadata($certificateUrl, [
            'membership_processed_at' => now()->toISOString(),
            'content_type' => 'membership_access',
            'certificate_generated' => ! empty($certificateUrl) ? 'true' : 'false',
            'membership_thumbnail' => $membership->perma_link ?? null,
        ]);
    }

    /**
     * Process bill deliverable
     */
    private function processBillDeliverable($bill): void
    {
        Log::info('Processing bill deliverable', [
            'deliverable_id' => $this->deliverable->id,
            'bill_id' => $bill->id,
            'bill_name' => $bill->name,
        ]);

        // Check if certificate already exists to prevent duplicates
        if (! empty($this->deliverable->certificate_url)) {
            Log::info('Certificate already exists for deliverable', [
                'deliverable_id' => $this->deliverable->id,
                'existing_certificate_url' => $this->deliverable->certificate_url,
            ]);

            return;
        }

        // Generate and upload bill certificate to Uploadcare
        $certificateService = app(CertificateService::class);
        $certificateUrl = $certificateService->generateAndUploadCertificate($this->deliverable, $bill);

        // Direct link to the bill's content, or the creator's page when the
        // subscription's benefit is access rather than a file.
        // ⚠️ `config()`, not `env()` — env() returns null once the config cache
        // is built, which is every deployed environment.
        $accessUrl = $bill->bareContentFileUrl() ?: rtrim((string) config('app.url'), '/').'/'.$bill->user->username;

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
                'certificate_generated' => ! empty($certificateUrl),
                'bill_thumbnail' => $bill->perma_link ?? null,
                'creator_username' => ($bill->user->username ?? 'Unknown'),
            ])),
        ]);

        // Always update Stripe payment intent metadata
        $this->updateStripeMetadata($certificateUrl, [
            'bill_processed_at' => now()->toISOString(),
            'content_type' => 'bill_payment',
            'access_url' => $accessUrl,
            'certificate_generated' => ! empty($certificateUrl) ? 'true' : 'false',
            'bill_thumbnail' => $bill->perma_link ?? null,
        ]);
    }

    /**
     * Process support payment deliverable (tips/donations)
     * No certificate generation, just metadata update
     */
    private function processSupportPaymentDeliverable(): void
    {
        Log::info('Processing support payment deliverable', [
            'deliverable_id' => $this->deliverable->id,
        ]);

        // Update deliverable status - support payments are immediately "delivered"
        $this->deliverable->update([
            'status' => 'delivered',
            'delivered_at' => now(),
            'metadata' => json_encode([
                'support_processed_at' => now()->toISOString(),
                'content_type' => 'support_payment',
                'no_certificate' => true,
                'no_content' => true,
            ]),
        ]);

        // Update Stripe metadata (without delivery/certificate fields)
        $this->updateStripeMetadata(null, [
            'support_processed_at' => now()->toISOString(),
            'content_type' => 'support_payment',
            'payment_type' => 'tip_donation',
        ]);
    }

    /**
     * Update Stripe payment intent metadata using the centralized service
     *
     * @param  string|null  $certificateUrl
     * @return void
     */
    private function updateStripeMetadata($certificateUrl = null, array $additionalMetadata = [])
    {
        // Use the new centralized StripeMetadataService
        $stripeMetadataService = app(StripeMetadataService::class);

        // Update the deliverable status to delivered if certificate was generated
        if ($certificateUrl && $this->deliverable->status !== 'delivered') {
            $this->deliverable->update([
                'status' => 'delivered',
                'delivered_at' => now(),
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
                'product_type' => $this->deliverable->product_type,
            ]);
        }
    }
}
