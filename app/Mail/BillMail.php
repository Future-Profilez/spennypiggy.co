<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Queue\SerializesModels;

class BillMail extends Mailable
{
    use Queueable, SerializesModels;

    public $bill_pay;

    public $amountWithVat;

    /**
     * Create a new message instance.
     *
     * @return void
     */
    // public function __construct($bill_pay)
    public function __construct($bill_pay, $amountWithVat)
    {
        $this->bill_pay = $bill_pay;
        $this->amountWithVat = $amountWithVat;
    }

    /**
     * Build the message.
     *
     * @return $this
     */
    public function build()
    {
        try {
            $subject = 'WooHoo! You got a new Bill subscription.';

            return $this->view('email.bills')
                ->from(env('MAIL_FROM_ADDRESS', 'noreply@spennypiggy.co'), env('MAIL_FROM_NAME', 'Spenny Piggy'))
                ->subject($subject);
        } catch (\Exception $e) {
        }
    }
}
