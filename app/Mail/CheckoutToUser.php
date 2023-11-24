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
    public $detail;



    /**
     * Create a new message instance.
     *
     * @return void
     */
    public function __construct($data, $detail)
    {
        $this->data = $data;
        $this->detail = $detail;
    }

    /**
     * Build the message.
     *
     * @return $this
     */
    public function build()
    {
        try {
            \Log::info('owner mail 3');

            $subject = 'You done a checkout from spanny piggy platform.';
            return $this->view('email.checkout-user')
                ->from('Noreply@spennypiggy.co', 'SPENNY PIGGY')
                ->subject($subject);
        } catch (\Exception $e) {
        }
    }
}
