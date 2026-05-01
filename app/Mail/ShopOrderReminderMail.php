<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;
use App\Models\User;
use App\Models\ShopPayment;
use App\Models\Deliverable;

class ShopOrderReminderMail extends Mailable implements ShouldQueue
{
    use Queueable, SerializesModels;

    public $creator;
    public $payment;
    public $deliverable;

    /**
     * Create a new message instance.
     */
    public function __construct(User $creator, ShopPayment $payment, ?Deliverable $deliverable)
    {
        $this->creator = $creator;
        $this->payment = $payment;
        $this->deliverable = $deliverable;
    }

    /**
     * Get the message envelope.
     */
    public function envelope(): Envelope
    {
        return new Envelope(
            subject: 'Reminder: Pending Physical Shop Order Fulfillment',
        );
    }

    /**
     * Get the message content definition.
     */
    public function content(): Content
    {
        return new Content(
            view: 'email.shop-order-reminder',
        );
    }

    /**
     * Get the attachments for the message.
     *
     * @return array<int, \Illuminate\Mail\Mailables\Attachment>
     */
    public function attachments(): array
    {
        return [];
    }
}
