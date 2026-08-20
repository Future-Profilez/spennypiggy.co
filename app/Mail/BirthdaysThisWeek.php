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
 * Discovery Phase 4 — the Monday "Birthdays This Week" campaign.
 *
 * Goes to supporters AND creators, ONE COPY PER PERSON — never one per creator
 * they follow. That guarantee is enforced by the SENDER (`birthday:weekly`),
 * which claims a per-person, per-week row in `engagement_notifications` before
 * building this mailable; see the command for the mechanism.
 *
 * 🚨 THE BIRTH YEAR IS NEVER DISPLAYED. Cards arrive already reduced by
 * `BirthdayDiscoveryService::card()`, which carries `birthday_label` (day and
 * month) and no year at all.
 *
 * 🚨 MARKETING-CLASS. Sent through `EmailService::sendMarketingEmail()`, which
 * honours `users.marketing_emails_enabled`. It is a promotional round-up of
 * creators the recipient may never have met — unlike the per-creator birthday
 * reminder, which is news about somebody they already support and rides on
 * `creator_updates_enabled`. It must NEVER go through `Mail::to()`.
 *
 * ⚠️ This mailable does not send itself.
 */
class BirthdaysThisWeek extends Mailable
{
    use Queueable, SerializesModels;

    /**
     * @param  int  $userId  the recipient — supporter or creator, one copy either way
     * @param  array<int, array<string, mixed>>  $creators  up to ten cards
     * @param  string  $weekLabel  e.g. "1 Sep – 7 Sep" — day and month only
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
     * Caught by rendering the mailable and grepping the HTML for `sp_d`. ⚠️
     * `App\Mail\ReactivationReminder` has the SAME public-property shape and is
     * very probably losing its `personalised` tags the same way — reported, not
     * changed here.
     *
     * ⚠️ `protected` still serializes for the queue (`SerializesModels` reflects
     * over all properties, not just public ones), so nothing else changes.
     */
    public function __construct(
        protected int $userId,
        protected array $creators = [],
        protected string $weekLabel = '',
    ) {}

    public function envelope(): Envelope
    {
        $count = count($this->creators);

        return new Envelope(
            subject: $count === 1
                ? 'A creator birthday this week'
                : $count.' creator birthdays this week',
            from: new Address(
                env('MAIL_FROM_ADDRESS', 'noreply@spennypiggy.co'),
                env('MAIL_FROM_NAME', 'Spenny Piggy')
            )
        );
    }

    public function content(): Content
    {
        $user = User::find($this->userId);

        return new Content(
            view: 'email.birthdays-this-week',
            with: [
                'user' => $user,
                'firstName' => $this->firstName($user),
                'weekLabel' => $this->weekLabel,
                'creators' => $this->taggedCreators(),
                /*
                 * The final CTA the brief names — "Discover more birthdays" →
                 * the birthday collection. Not a tagged profile link (it is a
                 * collection page, not a creator), so it is built plainly; the
                 * cards ON that page carry their own `birthdays-this-week` tag.
                 */
                'collectionUrl' => url('/discover/birthdays'),
                /*
                 * 🚨 UNSUBSCRIBE WORKS ON DAY ONE — a signed marketing opt-out,
                 * live before the Email Preferences Centre lands.
                 */
                'unsubscribeUrl' => $user
                    ? EmailPreferenceController::generateUnsubscribeToken($user)
                    : null,
            ]
        );
    }

    /**
     * Every card's profile link tagged `birthdays-this-week`.
     *
     * 🚨 Server-side, never hand-built in Blade — see `BirthdayReminder` for the
     * full reasoning. An untagged card here is a placement that never appears in
     * any creator's Discovery numbers, and there is no backfill for it.
     *
     * @return array<int, array<string, mixed>>
     */
    private function taggedCreators(): array
    {
        return array_map(function (array $card): array {
            unset($card['date_of_birth']);

            return $card;
        }, BirthdayDiscoveryService::tag($this->creators, 'birthdays-this-week'));
    }

    private function firstName(?User $user): string
    {
        $name = trim((string) ($user->name ?? ''));

        if ($name === '') {
            return 'there';
        }

        return ucwords(explode(' ', $name)[0]);
    }

    /** The reserved source key every card in this e-mail is tagged with. */
    public static function source(): string
    {
        return DiscoverySources::normalise('birthdays-this-week') ?? 'birthdays-this-week';
    }
}
