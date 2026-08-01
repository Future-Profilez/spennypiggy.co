<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Queue\SerializesModels;

class PiggyPotContributionReceiptMail extends Mailable
{
    use Queueable, SerializesModels;

    public $pay;

    public $symbol;

    public $thankYouUrl;

    public function __construct($pay, $symbol, $thankYouUrl)
    {
        $this->pay = $pay;
        $this->symbol = $symbol;
        $this->thankYouUrl = $thankYouUrl;
    }

    public function build()
    {
        if (! $this->pay->relationLoaded('creator') || ! $this->pay->relationLoaded('user')) {
            $this->pay->load(['creator', 'user']);
        }

        return $this->view('email.piggy-pot-receipt')
            ->from(env('MAIL_FROM_ADDRESS', 'noreply@spennypiggy.co'), env('MAIL_FROM_NAME', 'Spenny Piggy'))
            ->subject('Piggy Pot Contribution Confirmed');
    }
}
