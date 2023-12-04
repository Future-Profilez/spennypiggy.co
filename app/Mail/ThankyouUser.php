<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Queue\SerializesModels;

class ThankyouUser extends Mailable
{
    use Queueable, SerializesModels;

    public $payment;
    public $mess;

    /**
     * Create a new message instance.
     *
     * @return void
     */
    public function __construct($payment, $mess)
    {
        $this->payment = $payment;
        $this->mess = $mess;
    }

    /**
     * Build the message.
     *
     * @return $this
     */
    public function build()
    {
        try {
            $subject = 'Thank You from ' . $this->payment->payment->user->uuid . ' !!';
            return $this->view('email.thankyou-user')
                ->from('Noreply@spennypiggy.co', 'SPENNY PIGGY')
                ->subject($subject);
        } catch (\Exception $e) {
        }
    }
}
