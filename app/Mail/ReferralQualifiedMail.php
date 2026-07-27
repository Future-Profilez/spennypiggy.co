<?php

namespace App\Mail;

use App\Models\CreatorReferral;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Queue\SerializesModels;

class ReferralQualifiedMail extends Mailable
{
    use Queueable, SerializesModels;

    public CreatorReferral $referral;

    public function __construct(CreatorReferral $referral)
    {
        $this->referral = $referral;
    }

    public function build()
    {
        return $this->from(env('MAIL_FROM_ADDRESS', 'noreply@spennypiggy.co'), env('MAIL_FROM_NAME', 'Spenny Piggy'))
            ->subject('🎉 Your Referral Reward Is Ready to Redeem!')
            ->view('email.referral-qualified')
            ->with([
                'referral' => $this->referral,
                'amount' => number_format($this->referral->lifetime_gmv, 2),
                'redeemUrl' => config('app.url').'/wallet',
            ]);
    }
}
