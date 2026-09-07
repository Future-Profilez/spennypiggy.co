<?php

namespace App\Mail;

use App\Models\SupportTicket;
use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Address;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

/**
 * "We opened a support conversation for you" / "Your help request is open".
 *
 * The creator-facing sibling of `SupportTicketCreatedMail`, which is written for
 * a creator RECEIVING a supporter's request ("respond within 48 hours") — the
 * wrong letter for a conversation the platform started with them. Transactional;
 * no unsubscribe: it is about their own account and a ticket that exists.
 */
class HelpTicketOpenedMail extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(
        protected SupportTicket $ticket,
        protected User $creator,
        protected string $url,
        protected bool $auto,
    ) {}

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: $this->auto
                ? 'We opened a support conversation for you'
                : 'Your help request is open — reply any time',
            from: new Address(
                config('mail.from.address') ?: 'noreply@spennypiggy.co',
                config('mail.from.name') ?: 'Spenny Piggy'
            )
        );
    }

    public function content(): Content
    {
        $first = $this->ticket->messages()->orderBy('id')->first();

        return new Content(
            view: 'email.help-ticket-opened',
            with: [
                'creatorName' => $this->creator->name ?: ($this->creator->username ?? 'there'),
                'title' => $this->ticket->reason,
                'opening' => $first?->message,
                'ticketNumber' => strtoupper(explode('-', (string) $this->ticket->uuid)[0]),
                'url' => $this->url,
                'auto' => $this->auto,
            ]
        );
    }
}
