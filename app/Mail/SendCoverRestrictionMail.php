<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class SendCoverRestrictionMail extends Mailable
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
            $subject = '⚠️ Cover Pic Removed! ⚠️';
            return $this->view('email.cover-remove')
                ->from('Noreply@spennypiggy.co', 'SPENNY PIGGY')
                ->subject($subject);
        } catch (\Exception $e) {
        }
    }
}
