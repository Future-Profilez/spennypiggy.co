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
 * "Your account is a creator account now" — sent once, when a gifter converts.
 *
 * 🚨 TRANSACTIONAL, AND IT CARRIES NO UNSUBSCRIBE. It states what has just
 * changed about the person's own account, including that their photo and bio
 * have gone back for review — the one fact they need and cannot see from an
 * inbox. `EmailService::sendMarketingEmail` is not used and must not be: a
 * marketing opt-out may not silence a notice about the state of an account (the
 * same rule `GrowthBonusMilestoneReached` follows for money).
 *
 * ⚠️ It says what happened and what is next, and it does NOT restate the setup
 * steps. `FinishYourSetup` owns that copy, reads it from
 * `CreatorJourneyService::STEPS`, and starts arriving three days later — a
 * second list here is how the two drift and then contradict each other.
 *
 * ⚠️ Every constructor property is `protected`. `Mailable::buildViewData()`
 * merges PUBLIC properties OVER `Content(with: …)`, so a public one silently
 * replaces the computed value under the same key — the documented collision that
 * shipped a dangling greeting and an `href=""` on two live mails. Protected
 * still serialises for the queue.
 */
class CreatorAccountOpened extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(
        protected int $userId,
        protected string $creatorName,
        protected bool $reviewingAssets = false,
    ) {}

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: 'Your Spenny Piggy account can sell now',
            // ⚠️ config(), never env() — Vapor caches config on deploy, after which
            // env() is null and the sender silently falls back to a literal.
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
            view: 'email.creator-account-opened',
            with: [
                'user' => $user,
                'creatorName' => $this->creatorName,
                // Whether they actually had a photo or bio on file, so the mail does
                // not tell somebody their picture is under review when they never
                // uploaded one.
                'reviewingAssets' => $this->reviewingAssets,
                'ctaUrl' => $user && $user->username
                    ? rtrim(config('app.url'), '/').'/'.$user->username
                    : rtrim(config('app.url'), '/'),
            ]
        );
    }
}
