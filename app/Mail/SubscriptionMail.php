<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class SubscriptionMail extends Mailable
{
    use Queueable, SerializesModels;

    public $data;
    /**
     * Create a new message instance.
     *
     * @return void
     */
    public function __construct($data)
    {
        $this->data = $data;
    }

    /**
     * Build the message.
     *
     * @return $this
     */
    public function build()
    {
        try {
            $name = $this->data['name'];
            $uuid = $this->data['uuid'];
            $subject = 'Checkout from spanny piggy platform.';
            return $this->view('email.checkout')->with(['name' => $name, 'uuid' => $uuid])
                ->from('Noreply@whoyouinto.com', 'SPANNYPIGGY')
                ->subject($subject);
        } catch (\Exception $e) {
        }
    }
}
