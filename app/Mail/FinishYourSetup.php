<?php

namespace App\Mail;

use App\Http\Controllers\EmailPreferenceController;
use App\Models\User;
use App\Services\CreatorJourneyService;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Address;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;

/**
 * "You are one step from being able to sell" — the reminder for a creator whose setup
 * stalled part-way.
 *
 * 🚨 The copy is NOT written here. Every heading and body line comes from
 * `CreatorJourneyService::STEPS`, which is also what the dashboard card, the nudge bar and
 * the admin drip render — so the email cannot tell a creator something different from the
 * screen they land on. This class only decides the framing (first reminder vs second) and
 * the one extra sentence that a step needs in an inbox but not on a card.
 *
 * Sent at most twice per step (`CreatorJourneyService::NUDGE_STAGES`), then silence.
 */
class FinishYourSetup extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(
        public int $userId,
        public string $creatorName,
        public string $step,
        public int $stage = 2,
    ) {}

    /**
     * One definition of the wording, read by the mailable subject AND the bell/push title —
     * duplicating it in the command is how the on-site notification drifts from the inbox.
     */
    public static function subjectFor(string $step, int $stage): string
    {
        $second = $stage >= 7;

        return match ($step) {
            'profile' => $second ? 'Your page is still missing a photo' : 'Finish your Spenny Piggy page',
            'social' => $second ? 'Your page still has no social handle' : 'Add a social handle to your page',
            'subscription' => $second ? 'One step left before you can sell' : 'Add your card to finish setting up',
            'review' => $second ? 'Your profile is still waiting to be submitted' : 'Send your profile for review',
            'stripe' => $second ? 'Your earnings have nowhere to go yet' : 'Connect your payouts',
            'identity' => $second ? 'Your identity check is still unfinished' : 'Finish your identity check',
            'first_post' => $second ? 'Your members are waiting for a post' : 'Write your first post',
            'first_sale' => $second ? 'Your page is ready — share it' : 'Share your page',
            default => 'Finish setting up your Spenny Piggy page',
        };
    }

    /**
     * The one sentence that belongs in an inbox and not on a dashboard card: WHY this is
     * being sent now, and what it unblocks.
     *
     * ⚠️ Content-first wording only — no gift/tip/donation/fundraise/bill language. This is
     * coaching a creator on what to publish, and Stripe reads what they publish.
     */
    public static function contextFor(string $step): string
    {
        return match ($step) {
            'profile' => 'Supporters decide whether to buy from a page that looks finished, and this is the fastest thing you can do today.',
            'social' => 'The review team checks one account you post on to confirm the page is yours — it is the quickest thing standing between you and approval.',
            'subscription' => 'Nothing is charged until your first sale — this is only so we can bill you once you are earning.',
            'review' => 'Everything the review needs is on your page. It is not in the queue until you press Submit — nothing is checked, and payouts stay locked, until you do.',
            'stripe' => 'Until your bank details are connected, anything you sell has nowhere to be paid out to.',
            'identity' => 'You started this check but it was never completed, so it is still open. Nothing on your page can be listed for sale until it is finished — it takes about two minutes with your passport.',
            'first_post' => 'Posts are what your members see after they buy, and one is enough to give a subscriber a reason to stay.',
            'first_sale' => 'Most first sales come from the creator sharing their link, not from someone finding the page on their own.',
            default => 'You are part-way through setting up your page.',
        };
    }

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: self::subjectFor($this->step, $this->stage),
            // ⚠️ config(), never env(). Vapor caches config on every deploy, after which
            // env() returns null and the sender silently falls back to whatever is
            // hardcoded here rather than what the environment is configured with.
            from: new Address(
                config('mail.from.address') ?: 'noreply@spennypiggy.co',
                config('mail.from.name') ?: 'Spenny Piggy'
            )
        );
    }

    public function content(): Content
    {
        $user = User::find($this->userId);
        $copy = CreatorJourneyService::STEPS[$this->step] ?? null;

        return new Content(
            view: 'email.finish-setup',
            with: [
                'user' => $user,
                'creatorName' => $this->creatorName,
                'step' => $this->step,
                'stage' => $this->stage,
                'heading' => $copy['title'] ?? 'Finish setting up your page',
                'body' => $copy['body'] ?? '',
                'ctaLabel' => $copy['cta'] ?? 'Open your dashboard',
                'ctaUrl' => $this->ctaUrl($copy, $user),
                'context' => self::contextFor($this->step),
                'emoji' => $this->emoji(),
                // "Step 4 of 7" — a stalled creator has usually forgotten how far they
                // already got, and how little is left is the argument for finishing.
                'stepNumber' => (int) array_search($this->step, array_keys(CreatorJourneyService::STEPS), true) + 1,
                'totalSteps' => count(CreatorJourneyService::STEPS),
                'unsubscribeUrl' => $user
                    ? EmailPreferenceController::generateUnsubscribeToken($user, 'creator_updates_enabled')
                    : null,
            ]
        );
    }

    /**
     * Where the button goes.
     *
     * ⚠️ `first_sale` has no route of its own — on-site it opens the device share sheet,
     * which an email cannot do, so it sends them to their own public page (the thing they
     * are being asked to share). A step whose route cannot be resolved falls back to the
     * dashboard rather than throwing: a missing Ziggy-style name must not stop a reminder.
     */
    private function ctaUrl(?array $copy, ?User $user): string
    {
        $dashboard = rtrim(config('app.url'), '/').'/dashboard';

        try {
            if ($this->step === 'first_sale') {
                return $user && $user->username
                    ? route('user.show', $user->username)
                    : $dashboard;
            }

            if (! empty($copy['route'])) {
                return route($copy['route'], $copy['params'] ?? []);
            }
        } catch (\Throwable $e) {
            Log::warning('FinishYourSetup: could not resolve step route', [
                'step' => $this->step,
                'error' => $e->getMessage(),
            ]);
        }

        return $dashboard;
    }

    private function emoji(): string
    {
        return match ($this->step) {
            'profile' => '🎀',
            'social' => '🔗',
            'subscription' => '💳',
            'review' => '✅',
            'stripe' => '💸',
            'identity' => '🪪',
            'first_post' => '📝',
            'first_sale' => '📣',
            default => '🐷',
        };
    }
}
