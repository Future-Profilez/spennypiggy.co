<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Queue\SerializesModels;

class Checkout extends Mailable
{
    use Queueable, SerializesModels;

    public $data;

    public $anon;

    public $surprise;

    public $messages;

    public $anonname;

    public $symbol;

    public $vat_amount;

    /**
     * Create a new message instance.
     *
     * @return void
     */
    public function __construct($data, $anon, $surprise, $messages, $anonname, $symbol, $vat_amount)
    {
        $this->data = $data;
        $this->anon = $anon;
        $this->surprise = $surprise;
        $this->messages = $messages;
        $this->anonname = $anonname;
        $this->symbol = $symbol;
        $this->vat_amount = $vat_amount;

    }

    /**
     * Build the message.
     *
     * @return $this
     */
    public function build()
    {
        try {
            $subject = 'You’ve just received a gift on Spenny Piggy.';

            return $this->view('email.checkout')
                ->from(env('MAIL_FROM_ADDRESS', 'noreply@spennypiggy.co'), env('MAIL_FROM_NAME', 'Spenny Piggy'))
                ->subject($subject);
        } catch (\Exception $e) {
        }
    }
}
