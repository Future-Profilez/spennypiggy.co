<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Queue\SerializesModels;

class PiggyPotContributionReceivedMail extends Mailable
{
    use Queueable, SerializesModels;

    public $pay;
    public $symbol;

    public function __construct($pay, $symbol)
    {
        $this->pay = $pay;
        $this->symbol = $symbol;
    }

    public function build()
    {
        return $this->view('email.piggy-pot-received')
            ->from(env('MAIL_FROM_ADDRESS', 'noreply@spennypiggy.co'), env('MAIL_FROM_NAME', 'Spenny Piggy'))
            ->subject('You received a Piggy Pot contribution');
    }
}

