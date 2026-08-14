<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Queue\SerializesModels;

/**
 * Sent when a payment was stopped before it reached Stripe.
 *
 * Why this exists: everything the risk engine says was on screen only. A
 * supporter on a phone who navigated away had nothing at all — no reference,
 * no explanation, no route back — and for a GUEST it is worse, because they
 * have no account to return to. Email is their only channel. The client raised
 * this twice in the 9 Aug messaging brief (questions 5 and 9).
 *
 * ⚠️ Every word in this email comes from `App\Support\RiskMessages`, including
 * the subject line. The three rules apply here exactly as they do on screen —
 * no threshold, no accusation, always a next step — and an email is the copy
 * most likely to be forwarded, screenshotted or replied to.
 *
 * ⚠️ Arguments are plain scalars and a flat array on purpose: this is queued,
 * so anything passed here is serialised and rebuilt on a worker.
 */
class PaymentCouldNotGoThrough extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(
        public array $ui,
        public bool $isGuest = true,
        public ?string $firstName = null,
    ) {}

    public function build()
    {
        return $this
            // The on-screen title IS the subject. One source, so the inbox and
            // the page cannot describe the same event differently.
            ->subject($this->ui['title'] ?? 'About your payment')
            ->from(config('mail.from.address'), config('mail.from.name'))
            ->view('email.payment-blocked', [
                'ui' => $this->ui,
                'isGuest' => $this->isGuest,
                'firstName' => $this->firstName,
            ]);
    }
}
