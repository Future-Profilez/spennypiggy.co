<?php

namespace App\Mail;

use App\Models\FounderBonus;
use Illuminate\Bus\Queueable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Address;
use Illuminate\Mail\Mailables\Attachment;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class FounderPayoutRejection extends Mailable
{
    use Queueable, SerializesModels;

    public Model $founderBonus;

    /**
     * Create a new message instance.
     */
    public function __construct(Model $founderBonus)
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
            from: new Address(config('mail.from.address', 'noreply@spennypiggy.co'), config('mail.from.name', 'Spenny Piggy'))
        );
    }

    /**
     * Get the message content definition.
     */
    public function content(): Content
    {
        $period = null;
        if (! empty($this->founderBonus->month)) {
            $period = \Carbon\Carbon::parse($this->founderBonus->month)->format('F Y');
        } elseif (! empty($this->founderBonus->qualification_date)) {
            $period = \Carbon\Carbon::parse($this->founderBonus->qualification_date)->format('F Y');
        } else {
            $period = now()->format('F Y');
        }

        return new Content(
            view: 'email.founder-payout-rejection',
            with: [
                'founderBonus' => $this->founderBonus,
                'creator' => $this->founderBonus->creator,
                'bonusPeriod' => $period,
            ],
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
