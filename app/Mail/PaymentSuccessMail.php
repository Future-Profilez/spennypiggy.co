<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Queue\SerializesModels;

class PaymentSuccessMail extends Mailable
{
    use Queueable, SerializesModels;

    public $user;
    public $amount;
    public $nextPaymentDate;

    public function __construct($user, $amount, $nextPaymentDate)
    {
        $this->user = $user;
        $this->amount = $amount;
        $this->nextPaymentDate = $nextPaymentDate;
    }

    public function build()
    {
        return $this->subject('Your Payment was Successful')
            ->markdown('email.user-subscription4');
    }
}
