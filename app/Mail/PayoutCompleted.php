<?php

namespace App\Mail;

use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Address;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

/**
 * Payout lifecycle result for a standard weekly payout run: arrived, or failed.
 *
 * Transactional — a failed payout in particular must always reach the creator,
 * so this never checks marketing consent.
 */
class PayoutCompleted extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(
        public User $creator,
        public float $amount,
        public string $currency,
        public string $status,
        public ?string $arrivalDate = null,
        public ?string $destination = null,
        public ?string $reference = null,
        public ?string $failureMessage = null,
    ) {
        $this->currency = strtoupper($currency ?: 'GBP');
    }

    public function envelope(): Envelope
    {
        $subject = $this->status === 'paid'
            ? 'Your payout has arrived'
            : 'There was a problem with your payout';

        return new Envelope(
            subject: $subject,
            from: new Address(config('mail.from.address', 'noreply@spennypiggy.co'), config('mail.from.name', 'Spenny Piggy'))
        );
    }

    public function content(): Content
    {
        return new Content(view: 'email.payout-completed');
    }
}
