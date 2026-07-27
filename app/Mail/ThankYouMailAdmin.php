<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Queue\SerializesModels;

class ThankYouMailAdmin extends Mailable
{
    use Queueable, SerializesModels;

    public $pay;

    /**
     * Create a new message instance.
     */
    public function __construct($pay)
    {
        $this->pay = $pay;
    }

    /**
     * Build the message.
     *
     * @return $this
     */
    public function build()
    {
        try {
            $subject = 'New thank you message to approve.';

            return $this->view('email.new-thanks-message')
                ->from(env('MAIL_FROM_ADDRESS', 'noreply@spennypiggy.co'), env('MAIL_FROM_NAME', 'Spenny Piggy'))
                ->subject($subject);
        } catch (\Exception $e) {
        }
    }
}
