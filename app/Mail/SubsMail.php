<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Mail\Mailable;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;

class SubsMail extends Mailable
{
    use Queueable, SerializesModels;
    public $sub;
    public $creatorFinalAmount;
    /**
     * Create a new message instance.
     *
     * @return void
     */
    public function __construct($sub, $creatorFinalAmount)
    {
        $this->sub = $sub;
        $this->creatorFinalAmount = $creatorFinalAmount;
    }

    /**
     * Build the message.
     *
     * @return $this
     */
    public function build()
    {
        try {
            $subject = 'WooHoo! You got a new subscription.';
            return $this->view('email.subscription')
            ->from('Noreply@spennypiggy.co', 'SPENNY PIGGY')
            ->subject($subject);
        } catch (\Exception $e) {
        }
    }
}
