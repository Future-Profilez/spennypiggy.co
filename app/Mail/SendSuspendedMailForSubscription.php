<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class SendSuspendedMailForSubscription extends Mailable
{
    use Queueable, SerializesModels;

    /**
     * Create a new message instance.
     */
    public function __construct()
    {

    }

      /**
     * Build the message.
     *
     * @return $this
     */
    public function build()
    {
        try {
            $subject = '⚠️ Your account is suspended! ⚠️';
            return $this->view('email.account-suspend')
                ->from(env('MAIL_FROM_ADDRESS', 'noreply@spennypiggy.co'), env('MAIL_FROM_NAME', 'Spenny Piggy'))
                ->subject($subject);
        } catch (\Exception $e) {
        }
    }
}
