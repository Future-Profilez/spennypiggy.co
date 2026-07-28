<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Queue\SerializesModels;

class IdentityVerificationSuccess extends Mailable
{
    use Queueable, SerializesModels;

    public $user;

    public function __construct($user)
    {
        $this->user = $user;
    }

    public function build()
    {
        // config(), not env(): env() returns null once the config cache is built,
        // which Vapor does on every deploy.
        return $this->from(config('mail.from.address', 'noreply@spennypiggy.co'), config('mail.from.name', 'Spenny Piggy'))
            ->subject('Identity Verification Successful')
            ->view('email.identity_success')
            ->with(['user' => $this->user]);
    }
}
