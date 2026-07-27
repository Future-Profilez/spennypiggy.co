<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

/**
 * "Your listing is on hold" — the email half of a moderation hold.
 *
 * TRANSACTIONAL, never marketing: a creator whose listing has been taken out of
 * sale has to be told, whatever their promotional preferences say. It is sent
 * through NotificationDispatcher with `$marketing = false`, which routes it via
 * Mail::to() and skips every consent check by design. Do not route it through
 * EmailService::sendMarketingEmail, and do not add an opt-out for it.
 *
 * The constructor takes primitives only — it is instantiated inside a queued
 * job from a serialized payload, so an Eloquent model here would either bloat
 * that payload or arrive stale.
 */
class ContentUnderReview extends Mailable
{
    use Queueable, SerializesModels;

    /**
     * @param  string  $creatorName  Who to greet.
     * @param  string  $feature  What was held, in words ('shop listing', 'profile photo').
     * @param  string  $itemTitle  The listing's own name, when it has one.
     * @param  string  $reason  Creator-facing explanation, already written by the check.
     * @param  string  $manageUrl  Where they go to fix it.
     */
    public function __construct(
        public string $creatorName = '',
        public string $feature = 'listing',
        public string $itemTitle = '',
        public string $reason = '',
        public string $manageUrl = ''
    ) {}

    public function envelope(): Envelope
    {
        $named = $this->itemTitle !== '' ? " \"{$this->itemTitle}\"" : '';

        return new Envelope(
            subject: "Your {$this->feature}{$named} is under review"
        );
    }

    public function content(): Content
    {
        return new Content(
            view: 'email.content-under-review',
            with: [
                'creatorName' => $this->creatorName,
                'feature' => $this->feature,
                'itemTitle' => $this->itemTitle,
                'reason' => $this->reason,
                'manageUrl' => $this->manageUrl !== '' ? $this->manageUrl : config('app.url'),
            ],
        );
    }
}
