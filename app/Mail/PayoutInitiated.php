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
        // Stripe's own estimate of when the money lands. Stripe may omit it, so
        // the template renders the row only when it is present rather than
        // printing a date the bank never promised.
        public ?string $arrivalDate = null,
    ) {
        $this->currency = strtoupper($currency ?: 'GBP');
    }

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: 'Your payout is on the way',
            // config(), never env() — env() returns null once Vapor caches the
            // config on deploy, silently falling back to the hardcoded default.
            from: new Address(
                config('mail.from.address', 'noreply@spennypiggy.co'),
                config('mail.from.name', 'Spenny Piggy')
            )
        );
    }

    public function content(): Content
    {
        return new Content(view: 'email.payout-initiated');
    }
}
