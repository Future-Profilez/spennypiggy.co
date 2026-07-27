<?php

namespace App\Jobs;

use App\Mail\ReferralQualifiedMail;
use App\Models\CreatorReferral;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Mail;

class SendReferralQualifiedEmailJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public CreatorReferral $referral;

    public function __construct(CreatorReferral $referral)
    {
        $this->referral = $referral;
    }

    public function handle(): void
    {
        $user = $this->referral->referrer; // relationship required

        if (! $user || ! $user->email) {
            return;
        }

        Mail::to($user->email)->send(
            new ReferralQualifiedMail($this->referral)
        );
    }
}
