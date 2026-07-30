<?php

namespace App\Mail;

use App\Http\Controllers\EmailPreferenceController;
use App\Models\User;
use App\Services\AbandonedCheckoutService;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Address;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

/**
 * "You didn't finish your purchase" — the abandoned-checkout reminder.
 *
 * Sent to the supporter who opened Stripe Checkout and never completed it, with a link
 * back to the SAME Stripe session so the price, fees and creator payout are identical
 * to the ones they already saw. A fresh session would re-resolve the payment tier and
 * create a second ledger row.
 *
 * Goes to registered supporters AND guests, so it must not assume a User exists —
 * `userId` is nullable and the unsubscribe link is only rendered when there is an
 * account to unsubscribe.
 *
 * Constructor takes primitives only: it is built inside a queued job from a serialized
 * payload, where an Eloquent model would arrive stale.
 *
 * NEVER put the reward BODY in here. The reward is what the supporter is buying; the
 * headline sells it, the content is delivered after payment.
 */
class AbandonedCheckoutReminder extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(
        public string $checkoutUrl,
        public string $creatorName,
        public ?string $creatorUsername = null,
        public ?string $itemTitle = null,
        public ?string $rewardTitle = null,
        public ?string $amountLabel = null,
        public ?int $userId = null,
        public int $reminderNumber = 1,
        public ?string $firstName = null,
        public ?int $abandonedCheckoutId = null,
    ) {}

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: $this->isFinalReminder()
                ? 'Your checkout link expires soon'
                : 'You did not finish your purchase from '.$this->creatorName,
            from: new Address(
                env('MAIL_FROM_ADDRESS', 'noreply@spennypiggy.co'),
                env('MAIL_FROM_NAME', 'Spenny Piggy')
            )
        );
    }

    public function content(): Content
    {
        $user = $this->userId ? User::find($this->userId) : null;

        return new Content(
            view: 'email.abandoned-checkout',
            with: [
                'user' => $user,
                'firstName' => $this->resolvedFirstName($user),
                'creatorName' => $this->creatorName,
                'creatorUsername' => $this->creatorUsername,
                'itemTitle' => $this->itemTitle,
                'rewardTitle' => $this->rewardTitle,
                'amountLabel' => $this->amountLabel,
                'checkoutUrl' => $this->checkoutUrl,
                'isFinalReminder' => $this->isFinalReminder(),
                'creatorUrl' => $this->creatorUsername ? url('/'.$this->creatorUsername) : url('/'),
                // An account holder turns off the preference column; a guest has no
                // account, so their link records the opt-out against the email address.
                // Both must exist — "one email only" is not the same as "no way to stop
                // us", and a guest who wants out has no settings page to go to.
                'unsubscribeUrl' => $user
                    ? EmailPreferenceController::generateUnsubscribeToken($user, 'abandoned_checkout_emails_enabled')
                    : ($this->abandonedCheckoutId
                        ? EmailPreferenceController::generateCheckoutReminderOptOut($this->abandonedCheckoutId)
                        : null),
            ]
        );
    }

    /**
     * The last reminder gets "your link expires soon" copy.
     *
     * Read from the configured schedule rather than hardcoding "2" — a local environment
     * shortens the schedule for testing, and the expiry warning must land on whichever
     * reminder is actually the last one.
     */
    private function isFinalReminder(): bool
    {
        return $this->reminderNumber >= count(AbandonedCheckoutService::schedule());
    }

    private function resolvedFirstName(?User $user): string
    {
        $name = trim((string) ($this->firstName ?: ($user->name ?? '')));

        if ($name === '') {
            return 'there';
        }

        return ucwords(explode(' ', $name)[0]);
    }
}
