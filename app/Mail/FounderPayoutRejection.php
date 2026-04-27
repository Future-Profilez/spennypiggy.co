<?php

namespace App\Mail;

use App\Models\FounderBonus;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Address;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class FounderPayoutRejection extends Mailable
{
    use Queueable, SerializesModels;

    public FounderBonus $founderBonus;

    /**
     * Create a new message instance.
     */
    public function __construct(FounderBonus $founderBonus)
    {
        $this->founderBonus = $founderBonus;
    }

    /**
     * Get the message envelope.
     */
    public function envelope(): Envelope
    {
        return new Envelope(
            subject: 'Founder Bonus Payout Issue - Action Required',
            from: new Address(env('MAIL_FROM_ADDRESS', 'noreply@spennypiggy.co'), env('MAIL_FROM_NAME', 'Spenny Piggy'))
        );
    }

    /**
     * Get the message content definition.
     */
    public function content(): Content
    {
        return new Content(
            view: 'email.founder-payout-rejection',
            with: [
                'founderBonus' => $this->founderBonus,
                'creator' => $this->founderBonus->creator,
            ],
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
