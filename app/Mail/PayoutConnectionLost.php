<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

/**
 * Stripe will not let us reach this creator's connected account, so no payout
 * to them can succeed — and only they can put it back.
 *
 * 🚨 TRANSACTIONAL, AND IT MUST STAY THAT WAY. It tells somebody the platform
 * cannot pay them money they have already earned. There is no version of that a
 * creator should be able to opt out of, so it carries no unsubscribe footer and
 * `$marketing` is false at the call site.
 */
class PayoutConnectionLost extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(
        public string $creatorName = '',
        /*
         * 🚨 PROTECTED — the documented `AbandonedCheckoutReminder` trap. As a
         * public property an empty string overwrites `content()`'s
         * `config('app.url')` fallback, so a mail sent without an explicit URL
         * renders `href=""`: a link to nowhere, on the one e-mail whose whole
         * purpose is to get the creator to a particular page.
         */
        protected string $reconnectUrl = ''
    ) {}

    public function envelope(): Envelope
    {
        return new Envelope(subject: 'Reconnect Stripe to receive your payouts');
    }

    public function content(): Content
    {
        return new Content(
            view: 'email.payout-connection-lost',
            with: [
                'creatorName' => $this->creatorName,
                'reconnectUrl' => $this->reconnectUrl !== '' ? $this->reconnectUrl : config('app.url'),
            ],
        );
    }
}
