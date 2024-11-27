<?php

namespace App\Mail;

use App\Models\MonthlyCharge;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Queue\SerializesModels;

class MonthlySubscriptionFailedMail extends Mailable
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
    }

    /**
     * Build the message.
     *
     * @return $this
     */
    public function build()
    {
        return $this->subject('Monthly Subscription Failed')
            ->view('email.monthly-subs-failed');
    }
}
