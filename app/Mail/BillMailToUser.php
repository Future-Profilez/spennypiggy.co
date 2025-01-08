<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class BillMailToUser extends Mailable
{
    use Queueable, SerializesModels;

    public $bill_pay;
    public $amountWithCurr;
    public $user_name;
    /**
     * Create a new message instance.
     *
     * @return void
     */
    public function __construct($bill_pay, $amountWithCurr, $user_name)
    {
        $this->bill_pay = $bill_pay;
        $this->amountWithCurr = $amountWithCurr;
        $this->user_name = $user_name;
    }

    /**
     * Build the message.
     *
     * @return $this
     */
    public function build()
    {
        try {
            $subject = 'Bill Granted on Spenny Piggy!';
            return $this->view('email.bill_checkout_to_user')
            ->from('Noreply@spennypiggy.co', 'SPENNY PIGGY')
            ->subject($subject);
        } catch (\Exception $e) {
        }
    }
}
