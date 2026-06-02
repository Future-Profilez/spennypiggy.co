<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class ShopOrderStatusMail extends Mailable implements ShouldQueue
{
    use Queueable, SerializesModels;

    public $deliverable;
    public $creator;
    public $status;

    /**
     * Create a new message instance.
     */
    public function __construct($deliverable, $creator, $status)
    {
        $this->deliverable = $deliverable;
        $this->creator = $creator;
        $this->status = $status;
    }

    /**
     * Build the message.
     */
    public function build()
    {
        $subject = "Your order from " . $this->creator->name . " is now " . ucfirst($this->status);
        
        return $this->view('email.shop-order-status')
            ->from(env('MAIL_FROM_ADDRESS', 'noreply@spennypiggy.co'), env('MAIL_FROM_NAME', 'Spenny Piggy'))
            ->subject($subject);
    }
}
