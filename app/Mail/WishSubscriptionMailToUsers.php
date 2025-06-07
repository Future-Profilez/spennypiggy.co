<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;

class WishSubscriptionMailToUsers extends Mailable
{
    use Queueable, SerializesModels;

    public $sub;
    public $amountTotal;
    public $creator_name;


    /**
     * Create a new message instance.
     *
     * @return void
     */
    public function __construct($sub, $amountTotal, $creator_name)
    {
        $this->sub = $sub;
        $this->amountTotal = $amountTotal;
        $this->creator_name = $creator_name;
    }

    /**
     * Build the message.
     *
     * @return $this
     */
    public function build()
    {
        try {
            $subject = 'Wish Subscription Granted on Spenny Piggy!';
            return $this->view('email.subscription_wish_for_user')
                ->from('Noreply@spennypiggy.co', 'SPENNY PIGGY')
                ->subject($subject);
        } catch (\Exception $e) {
        }
    }
}
