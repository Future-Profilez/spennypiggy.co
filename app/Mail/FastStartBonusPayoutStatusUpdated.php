<?php

namespace App\Mail;

use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Address;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class FastStartBonusPayoutStatusUpdated extends Mailable
{
    use Queueable, SerializesModels;

    public User $creator;

    public float $amount;

    public string $currency;

    public string $status;

    public ?string $arrivalDate;

    public ?string $failureMessage;

    public function __construct(
        User $creator,
        float $amount,
        string $currency,
        string $status,
        ?string $arrivalDate = null,
        ?string $failureMessage = null
    ) {
        $this->creator = $creator;
        $this->amount = $amount;
        $this->currency = strtoupper($currency ?: 'GBP');
        $this->status = $status;
        $this->arrivalDate = $arrivalDate;
        $this->failureMessage = $failureMessage;
    }

    public function envelope(): Envelope
    {
        $subject = $this->status === 'paid'
            ? 'Fast Start Bonus payout completed!'
            : 'Fast Start Bonus payout update';

        return new Envelope(
            subject: $subject,
            from: new Address(env('MAIL_FROM_ADDRESS', 'noreply@spennypiggy.co'), env('MAIL_FROM_NAME', 'Spenny Piggy'))
        );
    }

    public function content(): Content
    {
        return new Content(
            view: 'email.fast-start-bonus-payout-status-updated',
            with: [
                'creator' => $this->creator,
                'amount' => $this->amount,
                'currency' => $this->currency,
                'status' => $this->status,
                'arrivalDate' => $this->arrivalDate,
                'failureMessage' => $this->failureMessage,
            ]
        );
    }

    public function attachments(): array
    {
        return [];
    }
}
