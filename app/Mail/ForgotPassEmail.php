<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Queue\SerializesModels;

class ForgotPassEmail extends Mailable
{
    use Queueable, SerializesModels;

    public $data;

    /**
     * Create a new message instance.
     *
     * @return void
     */
    public function __construct($data)
    {
        $this->data = $data;
    }

    /**
     * Build the message.
     *
     * @return $this
     */
    public function build()
    {
        // ⚠️ `config()`, never `env()` — env() returns null once the config is cached
        // on deploy, and the old try/catch returned NULL from build() on any failure,
        // producing a mailable with no view rather than a reportable error.
        return $this->view('email.forgot-password')
            ->from(
                config('mail.from.address', 'noreply@spennypiggy.co'),
                config('mail.from.name', 'Spenny Piggy')
            )
            ->subject('Reset your Spenny Piggy password');
    }
}
