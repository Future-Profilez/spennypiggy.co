<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class MemberMail extends Mailable
{
    use Queueable, SerializesModels;

    public $mem;
    public $amountWithCurr;
    /**
     * Create a new message instance.
     *
     * @return void
     */
    public function __construct($mem, $amountWithCurr)
    {
        $this->mem = $mem;
        $this->amountWithCurr = $amountWithCurr;
    }

    /**
     * Build the message.
     *
     * @return $this
     */
    public function build()
    {
        try {
            $subject = 'WooHoo! You got a new membership.';
            return $this->view('email.membership')
            ->from('Noreply@spennypiggy.co', 'SPENNY PIGGY')
            ->subject($subject);
        } catch (\Exception $e) {
        }
    }
}
