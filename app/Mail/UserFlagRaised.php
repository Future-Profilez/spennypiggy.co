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
    ) {}

    public function envelope(): Envelope
    {
        return new Envelope(subject: 'Critical account flag: '.$this->flagLabel);
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
                'flagsUrl' => $base.'/user-flags',
            ],
        );
    }
}
