<?php

namespace App\Mail;

use App\Http\Controllers\EmailPreferenceController;
use App\Models\User;
use App\Support\DiscoverySources;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Address;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

/**
 * "Here is what you have missed" — the email half of the reactivation engine.
 *
 * Marketing-class: it is only ever sent through NotificationDispatcher, which
 * checks reactivation_emails_enabled and routes via EmailService::sendMarketingEmail
 * so the marketing opt-out is honoured too.
 *
 * The constructor takes primitives only. It is instantiated inside a queued job
 * from a serialized payload, so an Eloquent model here would either bloat the
 * payload or arrive stale.
 */
class ReactivationReminder extends Mailable
{
    use Queueable, SerializesModels;

    /**
     * Per-stage copy. Deliberately separate from the short bell/push copy in
     * ReactivationNotify: an email has room to say more, and the tone escalates
     * across stages while staying content-first — no gift, tip, donation or
     * fundraising wording, and never a request for money.
     */
    private const COPY = [
        7 => [
            'subject' => 'New from the creators you follow',
            'emoji' => '✨',
            'heading' => 'There is new content waiting',
            'intro' => 'It has been about a week since you were last here. The creators you support have been posting — here is where to pick up.',
        ],
        14 => [
            'subject' => 'You still have content to catch up on',
            'emoji' => '📼',
            'heading' => 'Your unlocked content is still here',
            'intro' => 'Everything you have already unlocked stays in your account for good. There is also new work from the creators you support.',
        ],
        30 => [
            'subject' => 'We saved your spot',
            'emoji' => '🐷',
            'heading' => 'We saved your spot',
            'intro' => 'It has been a month. Your purchases and unlocked content are exactly where you left them, and the creators you support have published since.',
        ],
    ];

    /**
     * @param  array<int, array{name:string, username:?string, avatar:?string}>  $creators
     *                                                                                      Up to three creators this supporter has actually paid, so the email
     *                                                                                      names real people rather than making a generic "come back" pitch.
     */
    public function __construct(
        public int $userId,
        public int $days,
        /*
         * 🚨 `protected`, NOT `public`, AND THAT IS LOAD-BEARING.
         * `Mailable::buildViewData()` reflects over PUBLIC properties and merges
         * them OVER the `Content(with: […])` array. `content()` passes
         * `taggedCreators()` — the same list with `?sp_d=personalised` on each
         * profile URL — under the key `creators`, and a public property of the
         * same name silently replaced it with the raw, untagged input.
         *
         * The effect was invisible: the email rendered perfectly, with the right
         * creators and working links, and simply carried no attribution. Every
         * visit and purchase it produced was recorded as creator-generated, and
         * Discovery attribution has NO BACKFILL. Measured before the fix:
         * `taggedCreators()` returned a tagged URL and the rendered HTML
         * contained zero `sp_d=`.
         *
         * ⚠️ Protected properties still serialize for the queue, so nothing about
         * dispatching changes. Found 20 Aug 2026 while building Phase 4;
         * `AbandonedCheckoutReminder` was checked and is NOT affected — its
         * tagged URL uses a key no public property shares.
         */
        protected array $creators = [],
    ) {}

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: $this->copy()['subject'],
            from: new Address(
                env('MAIL_FROM_ADDRESS', 'noreply@spennypiggy.co'),
                env('MAIL_FROM_NAME', 'Spenny Piggy')
            )
        );
    }

    public function content(): Content
    {
        $user = User::find($this->userId);
        $copy = $this->copy();

        return new Content(
            view: 'email.reactivation-reminder',
            with: [
                // The layout renders the unsubscribe link only when a real User
                // is present, and a marketing email without one is not sendable.
                'user' => $user,
                'firstName' => $this->firstName($user),
                'emoji' => $copy['emoji'],
                'heading' => $copy['heading'],
                'intro' => $copy['intro'],
                'creators' => $this->taggedCreators(),
                'browseUrl' => url('/'),
                'purchasesUrl' => url('/my-purchases'),
                'unsubscribeUrl' => $user
                    ? EmailPreferenceController::generateUnsubscribeToken($user, 'reactivation_emails_enabled')
                    : null,
            ]
        );
    }

    /**
     * Each named creator gets a Discovery-tagged profile URL.
     *
     * 🚨 This e-mail is Spenny Piggy putting a creator back in front of a
     * supporter, so the visit it produces is SP-generated — and a surface that
     * is not tagged is invisible for ever, because attribution is recorded at
     * the moment of the visit and there is no backfill.
     *
     * `personalised` is the reserved key that fits: the creators listed are the
     * ones THIS supporter has actually paid, chosen for them. There is no
     * "supporter-email" key, and the server drops anything off the reserved
     * list in silence, which looks exactly like a tagged link that works.
     *
     * ⚠️ Built here rather than in the Blade view so the view never hand-builds
     * a query string, and so a creator with no username still renders.
     *
     * @return array<int, array<string, mixed>>
     */
    private function taggedCreators(): array
    {
        return array_map(function (array $creator): array {
            $creator['url'] = ! empty($creator['username'])
                ? DiscoverySources::profileUrl($creator['username'], 'personalised')
                : null;

            return $creator;
        }, $this->creators);
    }

    /** Falls back to the 30-day copy for an unexpected stage rather than failing. */
    private function copy(): array
    {
        return self::COPY[$this->days] ?? self::COPY[30];
    }

    private function firstName(?User $user): string
    {
        $name = trim((string) ($user->name ?? ''));

        if ($name === '') {
            return 'there';
        }

        return ucwords(explode(' ', $name)[0]);
    }
}
