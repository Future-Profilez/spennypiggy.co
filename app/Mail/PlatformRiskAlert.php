<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Address;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class PlatformRiskAlert extends Mailable
{
    use Queueable, SerializesModels;

    public $state;

    public $reasons;

    public $metrics;

    /**
     * Optional subject line, for an alert that is NOT a state transition.
     *
     * ⚠️ Added for the refund-volume watch (Security Checklist §3), which
     * reuses this mail deliberately rather than inventing a second admin
     * notification path — but is not a state change, so the default subject
     * would be a lie. Null keeps the original behaviour exactly.
     */
    public ?string $headline;

    /**
     * Create a new message instance.
     */
    public function __construct($state, $reasons, $metrics, ?string $headline = null)
    {
        $this->state = $state;
        $this->reasons = $reasons;
        $this->metrics = $metrics;
        $this->headline = $headline;
    }

    /**
     * Get the message envelope.
     */
    public function envelope(): Envelope
    {
        if ($this->headline !== null) {
            return new Envelope(
                subject: $this->headline,
                from: new Address(env('MAIL_FROM_ADDRESS', 'noreply@spennypiggy.co'), env('MAIL_FROM_NAME', 'Spenny Piggy'))
            );
        }

        $emoji = $this->state === 'FREEZE' ? '❄️🚨' : ($this->state === 'THROTTLE' ? '⚠️' : '✅');

        return new Envelope(
            subject: "{$emoji} Platform Risk Alert: State changed to {$this->state}",
            from: new Address(env('MAIL_FROM_ADDRESS', 'noreply@spennypiggy.co'), env('MAIL_FROM_NAME', 'Spenny Piggy'))
        );
    }

    /**
     * Get the message content definition.
     */
    public function content(): Content
    {
        return new Content(
            view: 'email.platform_risk_alert',
            with: [
                'state' => $this->state,
                'reasons' => $this->reasons,
                'metrics' => $this->metrics,
            ],
        );
    }
}
