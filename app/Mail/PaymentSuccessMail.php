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

    public $planCurrency;

    public $nextPaymentDate;

    public function __construct($user, $amount, $planCurrency, $nextPaymentDate)
    {
        $this->user = $user;
        $this->amount = $amount;
        $this->planCurrency = $planCurrency;
        $this->nextPaymentDate = $nextPaymentDate;
    }

    public function build()
    {
        return $this->from(env('MAIL_FROM_ADDRESS', 'noreply@spennypiggy.co'), env('MAIL_FROM_NAME', 'Spenny Piggy'))
            ->subject('Your Payment was Successful')
            ->markdown('email.user-subscription4');
    }
}
