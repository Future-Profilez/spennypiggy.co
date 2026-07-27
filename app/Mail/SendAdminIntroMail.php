<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
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
                ->from(env('MAIL_FROM_ADDRESS', 'noreply@spennypiggy.co'), env('MAIL_FROM_NAME', 'Spenny Piggy'))
                ->subject($subject);
        } catch (\Exception $e) {
        }
    }
}
