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
 * The Growth Bonus outcomes that are not a milestone — the window closing, the
 * window closed, and every place having gone.
 *
 * 🚨 THE WORDS COME FROM `GrowthBonusService::notifyOutcome()`, NOT FROM HERE.
 * The same sentence is the push body, the bell entry and this email, so a
 * creator who reads it on their phone and then opens the inbox sees the same
 * thing. Writing a second version here is how those three drift apart.
 *
 * 🚨 TRANSACTIONAL. It reports the state of the creator's own account in a
 * programme they were enrolled in, so it carries no unsubscribe footer and is
 * dispatched with `$marketing = false`. `EmailService::warnIfNoUnsubscribeLink()`
 * guards only the marketing path.
 *
 * 🚨 EVERY PROPERTY IS `protected` — `Mailable::buildViewData()` merges PUBLIC
 * properties over `Content(with: …)`, which is how `ReactivationReminder` lost
 * its attribution and `AbandonedCheckoutReminder` greeted people as "there, ".
 * Protected still serialises for the queue.
 */
class GrowthBonusOutcome extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(
        protected User $creator,
        protected string $outcome,
        protected string $headline,
        protected string $message,
    ) {}

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: $this->headline,
            from: new Address(
                env('MAIL_FROM_ADDRESS', 'noreply@spennypiggy.co'),
                env('MAIL_FROM_NAME', 'Spenny Piggy'),
            ),
        );
    }

    public function content(): Content
    {
        return new Content(
            view: 'email.growth-bonus-outcome',
            with: [
                'creator' => $this->creator,
                'outcome' => $this->outcome,
                'headline' => $this->headline,
                'message' => $this->message,
                // ⚠️ Only the closing-window mail has anything to act on, so it
                // is the only one that gets an action button. A "See your
                // milestones" button under "your window has closed" invites a
                // creator to go and look at a page that will tell them the same
                // thing again.
                'actionable' => $this->outcome === 'window_closing',
            ],
        );
    }

    public function attachments(): array
    {
        return [];
    }
}
