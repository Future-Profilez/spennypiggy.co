<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Queue\SerializesModels;

class SubsMail extends Mailable
{
    use Queueable, SerializesModels;

    public $sub;

    public $creatorFinalAmount;

    /**
     * Create a new message instance.
     *
     * @return void
     */
    public function __construct($sub, $creatorFinalAmount)
    {
        $this->sub = $sub;
        $this->creatorFinalAmount = $creatorFinalAmount;
    }

    /**
     * Build the message.
     *
     * @return $this
     */
    public function build()
    {
        try {
            $subject = 'WooHoo! You got a new subscription.';

            return $this->view('email.subscription')
                ->from(env('MAIL_FROM_ADDRESS', 'noreply@spennypiggy.co'), env('MAIL_FROM_NAME', 'Spenny Piggy'))
                ->subject($subject);
        } catch (\Exception $e) {
        }
    }
}
