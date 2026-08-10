<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Address;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

/**
 * The link back to a guest's own purchases.
 *
 * Transactional: it is about money that has already moved and content already paid for.
 * There is no version of this a supporter may opt out of, so it never goes through
 * `EmailService::sendMarketingEmail`.
 */
class GuestPurchaseLink extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(
        public string $link,
        public int $expiresInDays,
    ) {}

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: 'Your purchases on Spenny Piggy',
            // ⚠️ config(), never env() — env() returns null once Vapor caches config on
            // deploy, and the sender silently falls back to a hardcoded default.
            from: new Address(
                config('mail.from.address', 'noreply@spennypiggy.co'),
                config('mail.from.name', 'Spenny Piggy')
            )
        );
    }

    public function content(): Content
    {
        return new Content(view: 'email.guest-purchase-link');
    }
}
