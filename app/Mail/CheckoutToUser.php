<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class CheckoutToUser extends Mailable
{
    use Queueable, SerializesModels;

    public $data;
    public $curr;


    /**
     * Create a new message instance.
     *
     * @return void
     */
    public function __construct($data,$curr)
    {
        $this->data = $data;
        $this->curr = $curr;
    }

    /**
     * Build the message.
     *
     * @return $this
     */
    public function build()
    {
        try {
            $subject = 'Gift Granted on Spenny Piggy!';
            return $this->view('email.checkout-user')
                ->from('Noreply@spennypiggy.co', 'SPENNY PIGGY')
                ->subject($subject);
        } catch (\Exception $e) {
        }
    }
}
