<?php

namespace App\Mail;

use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Address;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class FounderBonusPayoutInitiated extends Mailable
{
    use Queueable, SerializesModels;

    public User $creator;

    public string $label;

    public float $amount;

    public string $currency;

    public ?string $arrivalDate;

    public ?string $periodLabel;

    public function __construct(User $creator, string $label, float $amount, string $currency, ?string $arrivalDate = null, ?string $periodLabel = null)
    {
        $this->creator = $creator;
        $this->label = $label;
        $this->amount = $amount;
        $this->currency = strtoupper($currency ?: 'GBP');
        $this->arrivalDate = $arrivalDate;
        $this->periodLabel = $periodLabel;
    }

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: "{$this->label} payout is on the way",
            from: new Address(env('MAIL_FROM_ADDRESS', 'noreply@spennypiggy.co'), env('MAIL_FROM_NAME', 'Spenny Piggy'))
        );
    }

    public function content(): Content
    {
        return new Content(
            view: 'email.founder-bonus-payout-initiated',
            with: [
                'creator' => $this->creator,
                'label' => $this->label,
                'amount' => $this->amount,
                'currency' => $this->currency,
                'arrivalDate' => $this->arrivalDate,
                'periodLabel' => $this->periodLabel,
            ]
        );
    }

    public function attachments(): array
    {
        return [];
    }
}
