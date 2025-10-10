<?php

namespace App\Jobs;

use App\Models\Deliverable;
use App\Services\StripeMetadataService;
use App\Events\SupportPaymentMetadataUpdated;
use App\Events\SupportPaymentMetadataFailed;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;

class UpdateSupportPaymentStripeMetadata implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $deliverableId;
    public int $tries = 3;
    public int $timeout = 60;

    /**
     * Create a new job instance.
     */
    public function __construct(int $deliverableId)
    {
        $this->deliverableId = $deliverableId;
        
        // Use low-priority queue for metadata updates
        $this->onQueue('low');
    }

    /**
     * Execute the job.
     */
    public function handle(): void
    {
        Log::info('UpdateSupportPaymentStripeMetadata job started', [
            'deliverable_id' => $this->deliverableId
        ]);

        try {
            // Load fresh deliverable record
            $deliverable = Deliverable::find($this->deliverableId);
            
            if (!$deliverable) {
                Log::error('UpdateSupportPaymentStripeMetadata: Deliverable not found', [
                    'deliverable_id' => $this->deliverableId
                ]);
                return;
            }

            // Verify this is a support payment with certificate
            if ($deliverable->product_type !== 'support_payment') {
                Log::warning('UpdateSupportPaymentStripeMetadata: Not a support payment', [
                    'deliverable_id' => $this->deliverableId,
                    'product_type' => $deliverable->product_type
                ]);
                return;
            }

            if (empty($deliverable->certificate_url)) {
                Log::warning('UpdateSupportPaymentStripeMetadata: No certificate URL available', [
                    'deliverable_id' => $this->deliverableId,
                    'deliverable_uuid' => $deliverable->uuid
                ]);
                return;
            }

            if (!$deliverable->payment_intent_id) {
                Log::warning('UpdateSupportPaymentStripeMetadata: No payment intent ID', [
                    'deliverable_id' => $this->deliverableId,
                    'deliverable_uuid' => $deliverable->uuid
                ]);
                return;
            }

            // Check if already updated (idempotent check)
            if ($this->isAlreadyUpdated($deliverable)) {
                Log::info('UpdateSupportPaymentStripeMetadata: Already updated, skipping', [
                    'deliverable_id' => $this->deliverableId,
                    'payment_intent_id' => $deliverable->payment_intent_id
                ]);
                return;
            }

            // Update Stripe metadata using the service
            $stripeMetadataService = app(StripeMetadataService::class);
            
            Log::info('UpdateSupportPaymentStripeMetadata: About to call StripeMetadataService', [
                'deliverable_id' => $deliverable->id,
                'payment_intent_id' => $deliverable->payment_intent_id,
                'certificate_url' => $deliverable->certificate_url,
                'product_type' => $deliverable->product_type,
                'status' => $deliverable->status
            ]);
            
            $success = $stripeMetadataService->updateDeliverableMetadata($deliverable);
            
            Log::info('UpdateSupportPaymentStripeMetadata: StripeMetadataService returned', [
                'deliverable_id' => $deliverable->id,
                'payment_intent_id' => $deliverable->payment_intent_id,
                'success' => $success ? 'true' : 'false'
            ]);
            
            // Verify the update by reading back from Stripe
            if ($success) {
                try {
                    \Stripe\Stripe::setApiKey(env('STRIPE_SECRET_KEY'));
                    $verifyPI = \Stripe\PaymentIntent::retrieve($deliverable->payment_intent_id);
                    $hasCertUrl = isset($verifyPI->metadata['certificate_url']);
                    $certUrlValue = $verifyPI->metadata['certificate_url'] ?? null;
                    
                    Log::info('UpdateSupportPaymentStripeMetadata: Verification check', [
                        'payment_intent_id' => $deliverable->payment_intent_id,
                        'has_certificate_url' => $hasCertUrl ? 'YES' : 'NO',
                        'certificate_url_value' => $certUrlValue,
                        'expected_cert_url' => $deliverable->certificate_url,
                        'urls_match' => $certUrlValue === $deliverable->certificate_url ? 'YES' : 'NO'
                    ]);
                } catch (\Exception $e) {
                    Log::warning('UpdateSupportPaymentStripeMetadata: Could not verify Stripe update', [
                        'payment_intent_id' => $deliverable->payment_intent_id,
                        'error' => $e->getMessage()
                    ]);
                }
            }

            if ($success) {
                // Mark as updated in deliverable metadata
                $this->markAsUpdated($deliverable);

                // Fire success event
                SupportPaymentMetadataUpdated::dispatch(
                    $deliverable->id,
                    $deliverable->payment_intent_id,
                    $deliverable->certificate_url,
                    ['updated_at' => now()->toISOString()]
                );

                Log::info('UpdateSupportPaymentStripeMetadata: Successfully updated Stripe metadata', [
                    'deliverable_id' => $this->deliverableId,
                    'payment_intent_id' => $deliverable->payment_intent_id,
                    'certificate_url' => $deliverable->certificate_url
                ]);
            } else {
                // Fire failure event
                SupportPaymentMetadataFailed::dispatch(
                    $deliverable->id,
                    $deliverable->payment_intent_id,
                    'StripeMetadataService returned false',
                    'ServiceReturnedFalse',
                    ['service_class' => StripeMetadataService::class]
                );

                Log::error('UpdateSupportPaymentStripeMetadata: Failed to update Stripe metadata', [
                    'deliverable_id' => $this->deliverableId,
                    'payment_intent_id' => $deliverable->payment_intent_id
                ]);

                throw new \Exception('Failed to update Stripe metadata via StripeMetadataService');
            }

        } catch (\Exception $e) {
            Log::error('UpdateSupportPaymentStripeMetadata: Job failed with exception', [
                'deliverable_id' => $this->deliverableId,
                'error' => $e->getMessage(),
                'error_class' => get_class($e),
                'trace' => $e->getTraceAsString()
            ]);

            // Fire failure event
            if (isset($deliverable)) {
                SupportPaymentMetadataFailed::dispatch(
                    $deliverable->id ?? $this->deliverableId,
                    $deliverable->payment_intent_id ?? null,
                    $e->getMessage(),
                    get_class($e),
                    ['trace' => $e->getTraceAsString()]
                );
            }

            throw $e; // Let Laravel handle retry logic
        }
    }

    /**
     * Check if this deliverable's Stripe metadata has already been updated
     */
    private function isAlreadyUpdated(Deliverable $deliverable): bool
    {
        try {
            // Initialize Stripe
            \Stripe\Stripe::setApiKey(env('STRIPE_SECRET_KEY'));
            
            // Retrieve current payment intent metadata
            $paymentIntent = \Stripe\PaymentIntent::retrieve($deliverable->payment_intent_id);
            $currentMetadata = $paymentIntent->metadata ?? new \stdClass();
            
            // Check if certificate URL matches what we want to set
            $currentCertUrl = $currentMetadata->certificate_url ?? null;
            
            if ($currentCertUrl === $deliverable->certificate_url) {
                Log::info('UpdateSupportPaymentStripeMetadata: Stripe metadata already has matching certificate URL', [
                    'deliverable_id' => $deliverable->id,
                    'payment_intent_id' => $deliverable->payment_intent_id,
                    'current_cert_url' => $currentCertUrl,
                    'deliverable_cert_url' => $deliverable->certificate_url
                ]);
                return true;
            }

            return false;
            
        } catch (\Exception $e) {
            Log::warning('UpdateSupportPaymentStripeMetadata: Could not check existing metadata', [
                'deliverable_id' => $deliverable->id,
                'payment_intent_id' => $deliverable->payment_intent_id,
                'error' => $e->getMessage()
            ]);
            
            // If we can't check, proceed with update to be safe
            return false;
        }
    }

    /**
     * Mark deliverable as having updated Stripe metadata
     */
    private function markAsUpdated(Deliverable $deliverable): void
    {
        try {
            // Update the deliverable's metadata to track that Stripe was updated
            $metadata = json_decode($deliverable->metadata, true) ?? [];
            $metadata['stripe_metadata_updated'] = true;
            $metadata['stripe_metadata_updated_at'] = now()->toISOString();
            
            $deliverable->update([
                'metadata' => json_encode($metadata)
            ]);

            Log::info('UpdateSupportPaymentStripeMetadata: Marked deliverable as updated', [
                'deliverable_id' => $deliverable->id
            ]);
            
        } catch (\Exception $e) {
            Log::warning('UpdateSupportPaymentStripeMetadata: Could not mark as updated', [
                'deliverable_id' => $deliverable->id,
                'error' => $e->getMessage()
            ]);
        }
    }

    /**
     * Handle failed job
     */
    public function failed(\Throwable $exception): void
    {
        Log::error('UpdateSupportPaymentStripeMetadata: Job permanently failed', [
            'deliverable_id' => $this->deliverableId,
            'error' => $exception->getMessage(),
            'error_class' => get_class($exception),
            'attempts' => $this->attempts()
        ]);

        // Fire final failure event
        SupportPaymentMetadataFailed::dispatch(
            $this->deliverableId,
            null, // Payment intent ID unknown at this point
            $exception->getMessage(),
            get_class($exception),
            [
                'attempts' => $this->attempts(),
                'permanent_failure' => true,
                'trace' => $exception->getTraceAsString()
            ]
        );
    }
}