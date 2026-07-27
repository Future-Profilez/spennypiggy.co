<?php

namespace App\Observers;

use App\Models\Deliverable;
use App\Services\StripeMetadataService;
use Illuminate\Support\Facades\Log;

class DeliverableObserver
{
    /**
     * Handle the Deliverable "updated" event.
     *
     * This observer automatically updates Stripe payment intent metadata
     * whenever a deliverable record is updated, ensuring metadata stays in sync.
     */
    public function updated(Deliverable $deliverable): void
    {
        // Only update Stripe metadata if we have a payment intent ID
        if (! $deliverable->payment_intent_id) {
            return;
        }

        // For support payments, only track basic changes (no certificate/delivery fields)
        if ($deliverable->product_type === 'support_payment') {
            $relevantFields = ['status', 'failure_reason'];
        } else {
            $relevantFields = [
                'status',
                'certificate_url',
                'deliverable_url',
                'delivered_at',
                'failure_reason',
            ];
        }

        $hasRelevantChanges = false;
        foreach ($relevantFields as $field) {
            if ($deliverable->isDirty($field)) {
                $hasRelevantChanges = true;
                break;
            }
        }

        // Only proceed if relevant fields were changed
        if (! $hasRelevantChanges) {
            return;
        }

        try {
            // Use the StripeMetadataService to update metadata
            $stripeMetadataService = app(StripeMetadataService::class);

            // Build additional metadata based on what changed
            $additionalMetadata = [
                'observer_updated_at' => now()->toISOString(),
            ];

            // Add field-specific metadata
            if ($deliverable->isDirty('status')) {
                $additionalMetadata['status_updated'] = 'true';
                $additionalMetadata['previous_status'] = $deliverable->getOriginal('status');
                $additionalMetadata['current_status'] = $deliverable->status;
            }

            if ($deliverable->isDirty('certificate_url')) {
                $additionalMetadata['certificate_updated'] = 'true';
            }

            if ($deliverable->isDirty('deliverable_url')) {
                $additionalMetadata['delivery_url_updated'] = 'true';
            }

            if ($deliverable->isDirty('failure_reason')) {
                $additionalMetadata['failure_reason'] = $deliverable->failure_reason ?? 'none';
            }

            $success = $stripeMetadataService->updateDeliverableMetadata($deliverable, $additionalMetadata);

            if ($success) {
                Log::info('DeliverableObserver: Successfully updated Stripe metadata', [
                    'deliverable_id' => $deliverable->id,
                    'payment_intent_id' => $deliverable->payment_intent_id,
                    'changed_fields' => array_intersect($relevantFields, array_keys($deliverable->getDirty())),
                ]);
            }

        } catch (\Exception $e) {
            Log::error('DeliverableObserver: Failed to update Stripe metadata', [
                'deliverable_id' => $deliverable->id,
                'payment_intent_id' => $deliverable->payment_intent_id,
                'error' => $e->getMessage(),
                'changed_fields' => array_intersect($relevantFields, array_keys($deliverable->getDirty())),
            ]);
        }
    }

    /**
     * Handle the Deliverable "created" event.
     *
     * Updates Stripe metadata when a new deliverable is created with a payment intent.
     */
    public function created(Deliverable $deliverable): void
    {
        // Only update Stripe metadata if we have a payment intent ID
        if (! $deliverable->payment_intent_id) {
            return;
        }

        try {
            // Use the StripeMetadataService to update metadata
            $stripeMetadataService = app(StripeMetadataService::class);

            $additionalMetadata = [
                'deliverable_created_at' => now()->toISOString(),
                'observer_created_event' => 'true',
            ];

            $success = $stripeMetadataService->updateDeliverableMetadata($deliverable, $additionalMetadata);

            if ($success) {
                Log::info('DeliverableObserver: Successfully updated Stripe metadata for new deliverable', [
                    'deliverable_id' => $deliverable->id,
                    'payment_intent_id' => $deliverable->payment_intent_id,
                    'product_type' => $deliverable->product_type,
                ]);
            }

        } catch (\Exception $e) {
            Log::error('DeliverableObserver: Failed to update Stripe metadata for new deliverable', [
                'deliverable_id' => $deliverable->id,
                'payment_intent_id' => $deliverable->payment_intent_id,
                'error' => $e->getMessage(),
            ]);
        }
    }
}
