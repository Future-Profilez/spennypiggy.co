<?php

namespace App\Events;

use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class SupportPaymentMetadataUpdated
{
    use Dispatchable, SerializesModels;

    public int $deliverableId;

    public string $paymentIntentId;

    public string $certificateUrl;

    public array $metadata;

    /**
     * Create a new event instance.
     */
    public function __construct(
        int $deliverableId,
        string $paymentIntentId,
        string $certificateUrl,
        array $metadata = []
    ) {
        $this->deliverableId = $deliverableId;
        $this->paymentIntentId = $paymentIntentId;
        $this->certificateUrl = $certificateUrl;
        $this->metadata = $metadata;
    }
}
