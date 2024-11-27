<?php

namespace App\Mail;

use App\Models\MonthlyCharge;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;

class MonthlySubscriptionSuccessMail extends Mailable
{
    use Queueable, SerializesModels;

    public $sub;

    /**
     * Create a new message instance.
     *
     * @param MonthlyCharge $subscription
     */
    public function __construct(MonthlyCharge $sub)
    {
        $this->sub = $sub;
        Log::info("come in sendMonthlySubscribedMail class construct function $this->sub");
    }

    /**
     * Build the message.
     *
     * @return $this
     */
    public function build()
    {
        Log::info("come in build function");
        return $this->subject('Monthly Subscription Successful')
            ->view('email.monthly-subs');
    }
}
