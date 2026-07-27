<?php

namespace App\Events;

use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class SupportPaymentMetadataFailed
{
    use Dispatchable, SerializesModels;

    public int $deliverableId;

    public ?string $paymentIntentId;

    public string $error;

    public string $errorClass;

    public array $context;

    /**
     * Create a new event instance.
     */
    public function __construct(
        int $deliverableId,
        ?string $paymentIntentId,
        string $error,
        string $errorClass = 'Exception',
        array $context = []
    ) {
        $this->deliverableId = $deliverableId;
        $this->paymentIntentId = $paymentIntentId;
        $this->error = $error;
        $this->errorClass = $errorClass;
        $this->context = $context;
    }
}
