<?php

namespace App\Mail;

use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Address;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class FastStartBonusPayoutInitiated extends Mailable
{
    use Queueable, SerializesModels;

    public User $creator;
    public float $amount;
    public string $currency;
    public ?string $arrivalDate;
    public float $earningsAmount;

    public function __construct(
        User $creator,
        float $amount,
        string $currency,
        float $earningsAmount = 0.0,
        ?string $arrivalDate = null
    ) {
        $this->creator = $creator;
        $this->amount = $amount;
        $this->currency = strtoupper($currency ?: 'GBP');
        $this->earningsAmount = $earningsAmount;
        $this->arrivalDate = $arrivalDate;
    }

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: 'Your Fast Start Bonus is on its way!',
            from: new Address(env('MAIL_FROM_ADDRESS', 'noreply@spennypiggy.co'), env('MAIL_FROM_NAME', 'Spenny Piggy'))
        );
    }

    public function content(): Content
    {
        return new Content(
            view: 'email.fast-start-bonus-payout-initiated',
            with: [
                'creator' => $this->creator,
                'amount' => $this->amount,
                'currency' => $this->currency,
                'earningsAmount' => $this->earningsAmount,
                'arrivalDate' => $this->arrivalDate,
            ]
        );
    }

    public function attachments(): array
    {
        return [];
    }
}
