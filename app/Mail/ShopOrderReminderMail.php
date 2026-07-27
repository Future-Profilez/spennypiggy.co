<?php

namespace App\Mail;

use App\Models\Deliverable;
use App\Models\ShopPayment;
use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Attachment;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class ShopOrderReminderMail extends Mailable implements ShouldQueue
{
    use Queueable, SerializesModels;

    public $creator;

    public $payment;

    public $deliverable;

    public $isManual;

    /**
     * Create a new message instance.
     */
    public function __construct(User $creator, ShopPayment $payment, ?Deliverable $deliverable, bool $isManual = false)
    {
        $this->creator = $creator;
        $this->payment = $payment;
        $this->deliverable = $deliverable;
        $this->isManual = $isManual;
    }

    /**
     * Get the message envelope.
     */
    public function envelope(): Envelope
    {
        $subject = $this->isManual
            ? 'FINAL REMINDER: Action Required for Shop Order'
            : 'Reminder: Pending Physical Shop Order Fulfillment';

        return new Envelope(
            subject: $subject,
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
     * @return array<int, Attachment>
     */
    public function attachments(): array
    {
        return [];
    }
}
