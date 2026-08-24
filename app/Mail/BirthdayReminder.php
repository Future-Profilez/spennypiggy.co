<?php

namespace App\Mail;

use App\Http\Controllers\EmailPreferenceController;
use App\Models\User;
use App\Services\Discovery\BirthdayDiscoveryService;
use App\Support\DiscoverySources;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Address;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

/**
 * Discovery Phase 4 — the 7-days-before / 1-day-before / on-the-day birthday
 * reminder, sent to a creator's EXISTING supporters.
 *
 * 🚨 THE BIRTH YEAR IS NEVER DISPLAYED. The constructor takes `$birthdayLabel`
 * — a day-and-month string built by `BirthdayDiscoveryService::birthdayLabel()`
 * — and there is no date, no age and no year anywhere in this class or its
 * view. Nothing here can compute one.
 *
 * 🚨 CATEGORY-CLASS, NOT TRANSACTIONAL. It is sent through
 * `EmailService::sendCategoryEmail($user, $mailable, SendBirthdayReminders::CATEGORY)`
 * — BOTH `birthday_emails_enabled` (the dedicated switch, so a person can stop
 * birthday mail without losing every creator update) and
 * `creator_updates_enabled` (the column it has always ridden, so the new switch
 * never overturns an opt-out somebody already made). It must NEVER go through
 * `Mail::to()`, which bypasses consent and is for receipts and password resets
 * only.
 *
 * ⚠️ This mailable does not send itself. It is constructed and handed to
 * `EmailService` by `birthday:remind`; a mailable that sends from its own
 * constructor or `build()` cannot be consent-checked, previewed or tested.
 *
 * The constructor takes primitives only — same reason as `ReactivationReminder`:
 * it is built from an already-resolved card array and an Eloquent model here
 * would either bloat a queue payload or arrive stale.
 */
class BirthdayReminder extends Mailable
{
    use Queueable, SerializesModels;

    /**
     * Per-stage copy.
     *
     * ⚠️ CONTENT-FIRST THROUGHOUT — no gift, tip, donation, present, fundraising
     * or "treat them" wording anywhere. A birthday is the single easiest place
     * on this platform to write a sentence that reads as a gift appeal, and the
     * Stripe content-first rule does not bend for it. Every call to action here
     * points at the creator's CONTENT.
     */
    private const COPY = [
        7 => [
            'subject' => "It's :name's birthday next week",
            'emoji' => '🗓️',
            'heading' => 'A birthday coming up',
            'intro' => 'A creator you support has a birthday on :date. Their profile is the place to catch up on what they have published.',
        ],
        1 => [
            'subject' => "It's :name's birthday tomorrow",
            'emoji' => '🎈',
            'heading' => 'Tomorrow is the day',
            'intro' => ":name's birthday is tomorrow, :date. Have a look at what they have on their profile.",
        ],
        0 => [
            'subject' => "It's :name's birthday today",
            'emoji' => '🎂',
            'heading' => 'It is the day',
            'intro' => "Today is :name's birthday. Their profile has everything they have published, old and new.",
        ],
    ];

    /**
     * @param  int  $userId  the SUPPORTER receiving this
     * @param  int  $stage  7, 1 or 0 — days before the birthday
     * @param  array<string, mixed>  $creator  a card from BirthdayDiscoveryService::card()
     *
     * 🚨 THESE ARE `protected`, NOT `public`, AND THAT IS LOAD-BEARING.
     *
     * `Mailable::buildViewData()` reflects over every PUBLIC property of the
     * subclass and merges it into the view data AFTER `Content(with: […])` has
     * been applied — so a public property silently OVERWRITES a `with` key of
     * the same name. A public `$creator` therefore handed the view the RAW,
     * UNTAGGED array instead of the Discovery-tagged one built below, and the
     * e-mail shipped with no `?sp_d=` on any link. Nothing errors; the mail
     * looks perfect; every visit it produces is invisible for ever, and there is
     * no backfill.
     *
     * Caught by rendering the mailable and grepping the HTML for `sp_d`, and
     * pinned by `BirthdayDiscoveryTest` against the RENDERED HTML rather than
     * the payload — the payload is only half the path. ⚠️ CORRECTED: the note
     * that once stood here said `App\Mail\ReactivationReminder` was "very
     * probably losing its `personalised` tags the same way". It is not — that
     * one was found and fixed on 20 Aug 2026 and its `$creators` is already
     * `protected`. Verified 21 Aug 2026; do not go chasing it.
     *
     * ⚠️ `protected` still serializes for the queue (`SerializesModels` reflects
     * over all properties, not just public ones), so nothing else changes.
     */
    public function __construct(
        protected int $userId,
        protected int $stage,
        protected array $creator = [],
    ) {}

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: $this->fill($this->copy()['subject']),
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
            view: 'email.birthday-reminder',
            with: [
                // The shared layout renders its own unsubscribe row only when a
                // real User is present, and a category email without one is not
                // sendable in the first place.
                'user' => $user,
                'firstName' => $this->firstName($user),
                'emoji' => $copy['emoji'],
                'heading' => $copy['heading'],
                'intro' => $this->fill($copy['intro']),
                'creator' => $this->taggedCreator(),
                'collectionUrl' => url('/discover/birthdays'),
                /*
                 * 🚨 THE NARROWEST OPT-OUT THIS EMAIL CAN OFFER. One click turns
                 * off `birthday_emails_enabled` and nothing else — it does NOT
                 * silence the other news about the creators this person
                 * supports, which is what the old `creator_updates_enabled`
                 * link did. Signed, and live for 30 days rather than 24 hours.
                 */
                'unsubscribeUrl' => $user
                    ? EmailPreferenceController::generateUnsubscribeToken($user, 'birthday_emails_enabled')
                    : null,
                /*
                 * …and the full preference centre, reachable WITHOUT LOGGING IN.
                 * "Stop this one" and "choose what I do want" are different
                 * intentions; a footer offering only the first is what makes
                 * people opt out of everything.
                 */
                'preferencesUrl' => $user
                    ? EmailPreferenceController::generateManageToken($user)
                    : null,
            ]
        );
    }

    /**
     * The creator's profile link, tagged `birthday-reminder`.
     *
     * 🚨 Built here, never in the Blade view. `DiscoverySources::profileUrl()`
     * exists precisely so a template never hand-builds a tagged query string: a
     * typo produces an unrecognised key, the server drops it in silence, and the
     * result looks exactly like a tagged link that works — while every visit,
     * supporter and transaction it produces is invisible for ever.
     *
     * @return array<string, mixed>
     */
    private function taggedCreator(): array
    {
        $creator = BirthdayDiscoveryService::tag(
            [$this->creator],
            'birthday-reminder'
        )[0] ?? $this->creator;

        // Belt and braces on the one promise this feature makes: even if a
        // caller ever hands in a richer array, no year-bearing key travels into
        // the view.
        unset($creator['date_of_birth']);

        return $creator;
    }

    /** Falls back to the on-the-day copy for an unexpected stage rather than failing. */
    private function copy(): array
    {
        return self::COPY[$this->stage] ?? self::COPY[0];
    }

    /**
     * Substitute the creator's name and their day-and-month birthday.
     *
     * ⚠️ `:date` resolves to `birthday_label` — "12 March". There is no token
     * for a year and no value available to fill one.
     */
    private function fill(string $text): string
    {
        return strtr($text, [
            ':name' => (string) ($this->creator['name'] ?? 'a creator you support'),
            ':date' => (string) ($this->creator['birthday_label'] ?? 'soon'),
        ]);
    }

    private function firstName(?User $user): string
    {
        $name = trim((string) ($user->name ?? ''));

        if ($name === '') {
            return 'there';
        }

        return ucwords(explode(' ', $name)[0]);
    }

    /**
     * The reserved source key this e-mail tags every profile link with.
     *
     * Exposed so the command and the tests name it once rather than repeating a
     * string the server would silently refuse if it were mistyped.
     */
    public static function source(): string
    {
        return DiscoverySources::normalise('birthday-reminder') ?? 'birthday-reminder';
    }
}
