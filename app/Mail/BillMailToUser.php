<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Queue\SerializesModels;

class BillMailToUser extends Mailable
{
    use Queueable, SerializesModels;

    public $bill_pay;

    public $amountWithCurr;

    public $user_name;

    public $deliverable;

    /**
     * Create a new message instance.
     *
     * @return void
     */
    public function __construct($bill_pay, $amountWithCurr, $user_name, $deliverable = null)
    {
        $this->bill_pay = $bill_pay;
        $this->amountWithCurr = $amountWithCurr;
        $this->user_name = $user_name;
        $this->deliverable = $deliverable;
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
                ->from(env('MAIL_FROM_ADDRESS', 'noreply@spennypiggy.co'), env('MAIL_FROM_NAME', 'Spenny Piggy'))
                ->subject($subject);
        } catch (\Exception $e) {
        }
    }
}
