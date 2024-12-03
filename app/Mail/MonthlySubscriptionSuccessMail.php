<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class MonthlySubscriptionSuccessMail extends Mailable
{
    use Queueable, SerializesModels;

    public $sub;

    /**
     * Create a new message instance.
     *
     * @return void
     */
    public function __construct($sub)
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
        try {
            $subject = 'Your payment status is paid on Spenny Piggy.';
            return $this->view('email.monthly-subs')
                ->from('Noreply@spennypiggy.co', 'SPENNY PIGGY')
                ->subject($subject);
        } catch (\Exception $e) {
        }
    }
}


// namespace App\Mail;

// use App\Models\MonthlyCharge;
// use Illuminate\Bus\Queueable;
// use Illuminate\Mail\Mailable;
// use Illuminate\Queue\SerializesModels;
// use Illuminate\Support\Facades\Log;

// class MonthlySubscriptionSuccessMail extends Mailable
// {
//     use Queueable, SerializesModels;

//     public $sub;

//     /**
//      * Create a new message instance.
//      *
//      * @param MonthlyCharge $subscription
//      */
//     public function __construct(MonthlyCharge $sub)
//     {
//         $this->sub = $sub;
//         Log::info("come in sendMonthlySubscribedMail class construct function $this->sub");
//     }

//     /**
//      * Build the message.
//      *
//      * @return $this
//      */
//     public function build()
//     {
//         Log::info("come in build function");
//         return $this->subject('Monthly Subscription Successful')
//             ->view('email.monthly-subs');
//     }
// }
