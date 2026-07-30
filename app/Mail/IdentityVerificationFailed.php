<?php

namespace App\Mail;

use App\Support\IdentityFailureReason;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Queue\SerializesModels;

class IdentityVerificationFailed extends Mailable
{
    use Queueable, SerializesModels;

    public $user;

    public function __construct($user)
    {
        $this->user = $user;
    }

    public function build()
    {
        // The failure copy is resolved once, server-side, and shared with the
        // profile page — the creator reads the same words in both places.
        $failure = IdentityFailureReason::explain($this->user->identity_verification_error);

        return $this->from(
            config('mail.from.address', 'noreply@spennypiggy.co'),
            config('mail.from.name', 'Spenny Piggy')
        )
            ->subject($failure['title'] ?? 'Your identity check didn’t go through')
            ->view('email.identity_failed')
            ->with([
                'user' => $this->user,
                'failure' => $failure,
                'retryUrl' => rtrim(config('app.url'), '/').'/stripe/identity-verification',
                'supportEmail' => config('support.contact_email'),
            ]);
    }
}
