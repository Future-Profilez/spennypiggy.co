<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Queue\SerializesModels;

class RiskOtpMail extends Mailable
{
    use Queueable, SerializesModels;

    public int $otp;

    public function __construct(int $otp)
    {
        $this->otp = $otp;
    }

    public function build()
    {
        return $this->view('email.risk-otp')
            ->from(env('MAIL_FROM_ADDRESS', 'Noreply@spennypiggy.co'), env('MAIL_FROM_NAME', 'SPENNY PIGGY'))
            ->subject('Confirm Your Payment - OTP Code');
    }
}

