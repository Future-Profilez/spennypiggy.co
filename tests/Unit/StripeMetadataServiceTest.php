<?php

namespace Tests\Unit;

use App\Models\Deliverable;
use App\Services\StripeMetadataService;
use Tests\TestCase;

class StripeMetadataServiceTest extends TestCase
{
    public function test_it_prunes_metadata_to_a_safe_payload_size(): void
    {
        $service = new StripeMetadataService;
        $metadata = [];

        for ($i = 0; $i < 60; $i++) {
            $metadata['key_'.$i] = 'value_'.$i;
        }

        $pruned = (new \ReflectionMethod($service, 'pruneStripeMetadataPayload'))
            ->invoke($service, $metadata);

        $this->assertLessThanOrEqual(45, count($pruned));
    }

    public function test_it_keeps_task_metadata_compact_for_task_deliverables(): void
    {
        $deliverable = new Deliverable;
        $deliverable->product_type = 'task';
        $deliverable->transaction_amount = 12.34;
        $deliverable->payment_currency = 'GBP';
        $deliverable->status = 'pending';
        $deliverable->payment_status = 'paid';
        $deliverable->deliverable_url = null;
        $deliverable->created_at = now();
        $deliverable->updated_at = now();
        $deliverable->task = null;
        $deliverable->purchase = null;
        $deliverable->gifter_id = null;
        $deliverable->creator_id = null;
        $deliverable->deliverable_type = 'digital_task';

        $service = new StripeMetadataService;
        $metadata = (new \ReflectionMethod($service, 'buildProductSpecificMetadata'))
            ->invoke($service, $deliverable);

        $this->assertArrayHasKey('product_type', $metadata);
        $this->assertArrayHasKey('transaction_amount', $metadata);
        $this->assertArrayHasKey('payment_currency', $metadata);
    }
}
