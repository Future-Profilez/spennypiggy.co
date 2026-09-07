<?php

namespace App\Mail;

use App\Http\Controllers\EmailPreferenceController;
use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Address;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

/**
 * One mail, sent ONCE, to a creator who reached the ID check and stopped — worded
 * for the reason they stopped (client decision, 7 Sep 2026).
 *
 * Four reasons, four different first sentences:
 *   never_opened     — approved, payouts connected, never pressed the button
 *   abandoned        — opened Stripe's screen and closed it (`identity_status = 2`)
 *   document_failed  — Stripe could not read the passport photo
 *   consent_declined — said no to Stripe's consent screen
 *
 * 🚨 `fraud_suspected` IS NEVER SENT THIS MAIL — that creator gets a support ticket
 * (App\Support\CreatorHelpTicket), not an invitation to try again.
 *
 * Every reason carries the same trust panel the page now shows: the passport goes
 * to Stripe, not to us. That was the question every stuck creator asked.
 *
 * Properties are `protected` — the `buildViewData()` trap.
 */
class IdentityCheckReengage extends Mailable
{
    use Queueable, SerializesModels;

    public const REASONS = ['never_opened', 'abandoned', 'document_failed', 'consent_declined'];

    public function __construct(
        protected int $userId,
        protected string $creatorName,
        protected string $reason,
    ) {}

    public static function subjectLine(string $reason): string
    {
        return match ($reason) {
            'abandoned' => 'Your ID check is still open — two minutes finishes it',
            'document_failed' => 'Your passport photo didn’t go through — here is what fixes it',
            'consent_declined' => 'About the consent screen on your ID check',
            default => 'One last step before your payouts can start',
        };
    }

    /** @return array{lead: string, steps: array<int, string>} */
    public static function copyFor(string $reason): array
    {
        return match ($reason) {
            'abandoned' => [
                'lead' => 'You opened the passport check and closed it before Stripe had everything it needed, so it is still sitting open. Nothing was lost — pick it up and it takes about two minutes.',
                'steps' => ['Have your passport to hand', 'Run it in one go on your phone', 'Good light, whole page in frame'],
            ],
            'document_failed' => [
                'lead' => 'Stripe could not read the photo of your passport last time. That is almost always the photo, not the document — glare, a cropped edge, or a card that is not a passport.',
                'steps' => ['Use the PHOTO PAGE of your passport (not a licence or ID card)', 'All four corners in frame, flat, no glare', 'Let the camera focus before you tap'],
            ],
            'consent_declined' => [
                'lead' => 'You stopped at the screen where Stripe asks permission to check your ID. That is a fair place to pause — so here is exactly what you are agreeing to, and what you are not.',
                'steps' => ['Stripe checks the passport and your selfie match — that is all the consent covers', 'Your documents stay with Stripe; Spenny Piggy never receives a copy', 'If you would rather talk it through first, reply to this mail'],
            ],
            default => [
                'lead' => 'Your profile is approved and your payouts are connected — the only thing between you and your first sale is a two-minute passport check.',
                'steps' => ['Open the check from your profile', 'Photograph your passport and take a selfie', 'Done — you can list and be paid the same day'],
            ],
        };
    }

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: self::subjectLine($this->reason),
            from: new Address(
                config('mail.from.address') ?: 'noreply@spennypiggy.co',
                config('mail.from.name') ?: 'Spenny Piggy'
            )
        );
    }

    public function content(): Content
    {
        $user = User::find($this->userId);
        $copy = self::copyFor($this->reason);

        return new Content(
            view: 'email.identity-check-reengage',
            with: [
                'user' => $user,
                'creatorName' => $this->creatorName,
                'reason' => $this->reason,
                'lead' => $copy['lead'],
                'steps' => $copy['steps'],
                'actionUrl' => route('stripe.identity.verification'),
                'unsubscribeUrl' => $user
                    ? EmailPreferenceController::generateUnsubscribeToken($user, 'creator_updates_enabled')
                    : null,
            ]
        );
    }
}
