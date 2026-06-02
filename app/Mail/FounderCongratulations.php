<?php

namespace App\Mail;

use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Address;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class FounderCongratulations extends Mailable
{
    use Queueable, SerializesModels;

    public User $creator;
    public float $first30DayEarnings;

    /**
     * Create a new message instance.
     */
    public function __construct(User $creator, float $first30DayEarnings)
    {
        $this->creator = $creator;
        $this->first30DayEarnings = $first30DayEarnings;
    }

    /**
     * Get the message envelope.
     */
    public function envelope(): Envelope
    {
        return new Envelope(
            subject: '🎉 Congratulations! You\'re now a SpennyPiggy Founder!',
            from: new Address(env('MAIL_FROM_ADDRESS', 'noreply@spennypiggy.co'), env('MAIL_FROM_NAME', 'Spenny Piggy'))
        );
    }

    /**
     * Get the message content definition.
     */
    public function content(): Content
    {
        return new Content(
            view: 'email.founder-congratulations',
            with: [
                'creator' => $this->creator,
                'first30DayEarnings' => $this->first30DayEarnings,
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
