<?php

namespace App\Mail;

use App\Http\Controllers\EmailPreferenceController;
use App\Models\User;
use App\Support\SubscriptionPlan;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Address;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

/**
 * A creator opened the card step and never finished it.
 *
 * Every product checkout on this platform is chased when it is abandoned. The
 * platform subscription — the one step that stops a creator selling ANYTHING —
 * was the only one that was not, so a creator who bounced off the Stripe page
 * heard nothing at all and simply stayed stuck.
 */
class FinishAddingYourCard extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(
        public int $userId,
        public string $creatorName,
        public string $checkoutUrl,
    ) {}

    /**
     * One definition of the wording, read by the subject AND the bell/push title,
     * so the message on-site cannot drift from the one in the inbox.
     *
     * ⚠️ Not named `subject()` — `Mailable` already declares one with a different
     * signature, and redeclaring it is a fatal incompatibility rather than an
     * override.
     */
    public static function subjectLine(): string
    {
        return 'You have not finished adding your card';
    }

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: self::subjectLine(),
            // ⚠️ config(), never env(). Vapor caches config on deploy, after which
            // env() returns null and the sender silently falls back to a hardcoded
            // default rather than what the environment is configured with.
            from: new Address(
                config('mail.from.address') ?: 'noreply@spennypiggy.co',
                config('mail.from.name') ?: 'Spenny Piggy'
            )
        );
    }

    public function content(): Content
    {
        $user = User::find($this->userId);

        return new Content(
            view: 'email.finish-adding-card',
            with: [
                'user' => $user,
                'creatorName' => $this->creatorName,
                // ⚠️ Their ORIGINAL Stripe session, not a fresh one. A new session
                // would create a second `monthly_charges` row beside the one they
                // already started, and the link they were sent would then be
                // completing a row nothing is watching.
                'checkoutUrl' => $this->checkoutUrl,
                'promise' => SubscriptionPlan::copy('promise'),
                'priceLine' => SubscriptionPlan::copy('price_line'),
                'unsubscribeUrl' => $user
                    ? EmailPreferenceController::generateUnsubscribeToken($user, 'creator_updates_enabled')
                    : null,
            ]
        );
    }
}
