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
 * Tells creators the subscription is no longer charged until their first sale.
 *
 * ⚠️ Constructed from a serialized queue payload, so every argument must be a
 * primitive — a User model here would be re-fetched (or fail) on the worker.
 */
class SubscriptionPolicyChanged extends Mailable
{
    use Queueable, SerializesModels;

    /** Billing already. Nothing changes for them. */
    public const VARIANT_BILLING = 'billing';

    /** Card on file, in their free period — the new terms already apply. */
    public const VARIANT_FREE_PERIOD = 'free_period';

    /** No subscription at all. The only cohort that needs a "add your card" CTA. */
    public const VARIANT_NONE = 'none';

    public function __construct(
        public int $userId,
        public string $creatorName,
        public string $variant = self::VARIANT_NONE,
    ) {}

    /**
     * One definition of the subject, so the command and any on-site notification
     * cannot drift from what lands in the inbox.
     */
    public static function subjectFor(string $variant = self::VARIANT_NONE): string
    {
        return $variant === self::VARIANT_BILLING
            ? 'A change to how the creator subscription is billed'
            : 'Good news — no charge until your first sale';
    }

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: self::subjectFor($this->variant),
            // config(), never env(): Vapor caches config on deploy, after which
            // env() returns null and the sender silently falls back to a default.
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
            view: 'email.subscription-policy-changed',
            with: [
                'user' => $user,
                'creatorName' => $this->creatorName,
                'variant' => $this->variant,
                'alreadySubscribed' => $this->variant === self::VARIANT_BILLING,
                // ⚠️ Only the cohort with no card sees "add your card". Showing
                // that button to someone who added one months ago reads as
                // "we lost your details".
                'showCta' => $this->variant === self::VARIANT_NONE,
                'plan' => SubscriptionPlan::forFrontend(),
                'ctaUrl' => route('activate-subscription'),
                'unsubscribeUrl' => $user
                    ? EmailPreferenceController::generateUnsubscribeToken($user, 'creator_updates_enabled')
                    : null,
            ]
        );
    }
}
