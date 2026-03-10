<?php

namespace App\Mail;

use App\Models\PlatformRiskState;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Mail\Mailable;
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
     * Create a new message instance.
     */
    public function __construct($state, $reasons, $metrics)
    {
        $this->state = $state;
        $this->reasons = $reasons;
        $this->metrics = $metrics;
    }

    /**
     * Get the message envelope.
     */
    public function envelope(): Envelope
    {
        $emoji = $this->state === 'FREEZE' ? '❄️🚨' : ($this->state === 'THROTTLE' ? '⚠️' : '✅');
        return new Envelope(
            subject: "{$emoji} Platform Risk Alert: State changed to {$this->state}",
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
