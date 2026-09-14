<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

/**
 * The platform flagged an account for something that stops money moving.
 *
 * 🚨 INTERNAL, AND TRANSACTIONAL. It goes to the `user_flag_critical` recipients
 * in `config/alerts.php` — never to a creator, never through
 * `EmailService::sendMarketingEmail`, and it must never gain an opt-out: it is
 * an operational alert about the platform's own money.
 *
 * ⚠️ It names the flag and the account id, and carries the reason the flag was
 * stored with — which `SecurityRedactor` already scrubbed on the way IN. There
 * is deliberately no username or e-mail: the recipients can open the account,
 * and an alert list is not a place to park contact details.
 */
class UserFlagRaised extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(
        public string $flagLabel = '',
        public string $reason = '',
        public int $userId = 0,
        protected string $adminUrl = '',
        /*
         * 🚨 THE USERNAME, BECAUSE "#203" IS NOT A PERSON. The first version of
         * this alert named only the id, so an admin opening it could not tell
         * who it was about, what had happened or what to do — it read as a
         * system error rather than as one account needing a look. Reported the
         * day it shipped.
         */
        public string $username = '',
        /** What this flag type MEANS, from config — one definition, not retyped. */
        public string $meaning = '',
        /** The one thing to do about it. */
        public string $action = '',
    ) {}

    public function envelope(): Envelope
    {
        /*
         * ⚠️ The creator's name in the subject line. An inbox full of
         * "Critical account flag: Stripe connection lost" is indistinguishable
         * row to row, so two different accounts read as one repeated error.
         */
        $who = $this->username !== '' ? ' — @'.$this->username : '';

        return new Envelope(subject: $this->flagLabel.$who);
    }

    public function content(): Content
    {
        $base = rtrim($this->adminUrl !== '' ? $this->adminUrl : (string) config('app.url'), '/');

        return new Content(
            view: 'email.user-flag-raised',
            with: [
                'flagLabel' => $this->flagLabel,
                'reason' => $this->reason,
                'userId' => $this->userId,
                'username' => $this->username,
                'meaning' => $this->meaning,
                'action' => $this->action,
                'flagsUrl' => $base.'/user-flags',
                // ⚠️ The account's own page, which is where the decision is
                // actually taken — the flags list only says who to look at.
                'accountUrl' => $this->username !== ''
                    ? $base.'/'.$this->username.'/details'
                    : $base.'/user-flags',
            ],
        );
    }
}
