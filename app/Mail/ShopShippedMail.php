<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class ShopShippedMail extends Mailable implements ShouldQueue
{
    use Queueable, SerializesModels;

    public $deliverable;
    public $creator;

    /**
     * Create a new message instance.
     */
    public function __construct($deliverable, $creator)
    {
        $this->deliverable = $deliverable;
        $this->creator = $creator;
    }

    /**
     * Build the message.
     */
    public function build()
    {
        $subject = "Your order from " . $this->creator->name . " has been shipped!";
        
        return $this->view('email.shop-shipped')
            ->from(env('MAIL_FROM_ADDRESS', 'noreply@spennypiggy.co'), env('MAIL_FROM_NAME', 'Spenny Piggy'))
            ->subject($subject);
    }
}
