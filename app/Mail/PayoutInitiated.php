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
 * "Your payout is on the way" for a standard weekly payout run.
 *
 * Transactional — a creator cannot opt out of being told their money moved,
 * so this is sent with Mail::to() and never through a consent-checking helper.
 */
class PayoutInitiated extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(
        public User $creator,
        public float $amount,
        public string $currency,
        public string $sentAt,
        public ?string $destination = null,
        public ?string $reference = null,
    ) {
        $this->currency = strtoupper($currency ?: 'GBP');
    }

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: 'Your payout is on the way',
            from: new Address(env('MAIL_FROM_ADDRESS', 'noreply@spennypiggy.co'), env('MAIL_FROM_NAME', 'Spenny Piggy'))
        );
    }

    public function content(): Content
    {
        return new Content(view: 'email.payout-initiated');
    }
}
