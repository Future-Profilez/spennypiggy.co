<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class SendAdminIntroMail extends Mailable
{
    use Queueable, SerializesModels;

    public $intro;
    /**
     * Create a new message instance.
     */
    public function __construct($intro)
    {
        $this->intro = $intro;
    }

      /**
     * Build the message.
     *
     * @return $this
     */
    public function build()
    {
        try {
            $subject = 'New intro video to approve.';
            return $this->view('email.new-intro')
                ->from('Noreply@spennypiggy.co', 'SPENNY PIGGY')
                ->subject($subject);
        } catch (\Exception $e) {
        }
    }
}
