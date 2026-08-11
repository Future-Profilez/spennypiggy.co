<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Queue\SerializesModels;

/**
 * A creator-facing account notice — their payments stopped, or their payout
 * was held.
 *
 * ⚠️ Specificity is the whole point of these two messages, and it is the one
 * thing the brief is most insistent about:
 *
 *   #14 "Always substitute the specific reason. 'Account status issue' on its
 *        own is exactly what we're trying to get away from."
 *   #16 "Never leave a held payout unexplained. This is the single scariest
 *        message a creator can receive."
 *
 * So `reason` is required, not optional — a caller with nothing to say has no
 * business sending this.
 *
 * Copy comes from `App\Support\RiskMessages`; this class only carries it.
 * Arguments are plain scalars and a flat array because this is queued.
 */
class CreatorAccountNotice extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(
        public array $ui,
        public ?string $firstName = null,
    ) {}

    public function build()
    {
        return $this
            ->subject($this->ui['title'] ?? 'Something needs your attention')
            ->from(config('mail.from.address'), config('mail.from.name'))
            ->view('email.creator-account-notice', [
                'ui' => $this->ui,
                'firstName' => $this->firstName,
            ]);
    }
}
