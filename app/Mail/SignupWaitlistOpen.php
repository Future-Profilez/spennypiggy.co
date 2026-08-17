<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Address;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

/**
 * "Creator sign-ups are open again."
 *
 * Sent once per lead by `signup-leads:notify`, to someone who has NO account —
 * they were refused one while the platform was paused. There is no preference
 * page to link, no bell to write to and no push to send: this address exists
 * solely because the person asked to be told, so email is the only channel and
 * one message is the whole of it.
 *
 * ⚠️ Do NOT route this through `EmailService::sendMarketingEmail`. That reads a
 * consent column off a `User`, and there is no user here — the send is the
 * single thing this address was collected for, and `signup-leads:prune` is what
 * stops the row outliving its purpose.
 */
class SignupWaitlistOpen extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(
        public string $registerUrl,
    ) {}

    /**
     * ⚠️ Not `subject()` — `Mailable` already declares one with a different
     * signature, and redeclaring it is a fatal incompatibility, not an override.
     */
    public static function subjectLine(): string
    {
        return 'Creator sign-ups are open again 🐷';
    }

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: self::subjectLine(),
            // ⚠️ config(), never env() — Vapor caches config on deploy, after
            // which env() is null and the sender silently falls back to a
            // hardcoded default that does not match the environment.
            from: new Address(
                config('mail.from.address') ?: 'noreply@spennypiggy.co',
                config('mail.from.name') ?: 'Spenny Piggy'
            )
        );
    }

    public function content(): Content
    {
        return new Content(
            view: 'email.signup-waitlist-open',
            with: ['registerUrl' => $this->registerUrl],
        );
    }
}
