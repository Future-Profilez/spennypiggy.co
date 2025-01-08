<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;

class BillMail extends Mailable
{
    use Queueable, SerializesModels;

    public $bill_pay;
    // public $amountWithVat;
    /**
     * Create a new message instance.
     *
     * @return void
     */
    public function __construct($bill_pay)
    // public function __construct($bill_pay, $amountWithVat)
    {
        Log::info("come in BillMail construct");

        $this->bill_pay = $bill_pay;
        // $this->amountWithVat = $amountWithVat;
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
            ->from('Noreply@spennypiggy.co', 'SPENNY PIGGY')
            ->subject($subject);
        } catch (\Exception $e) {
        }
    }
}
