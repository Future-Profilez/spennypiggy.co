<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Address;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class DiagnosticsAlertMail extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(
        public string $overallStatus,
        public array $results,
        public string $timestamp,
        public int $failedCount,
        public int $warningCount,
    ) {}

    public function envelope(): Envelope
    {
        $emoji = $this->overallStatus === 'failed' ? '🚨' : '⚠️';
        $env = strtoupper(app()->environment());
        $subject = "{$emoji} [{$env}] Platform Diagnostics: ".ucfirst($this->overallStatus)
                 ." — {$this->failedCount} failed, {$this->warningCount} warnings";

        return new Envelope(
            subject: $subject,
            from: new Address(
                env('MAIL_FROM_ADDRESS', 'noreply@spennypiggy.co'),
                env('MAIL_FROM_NAME', 'Spenny Piggy')
            ),
        );
    }

    public function content(): Content
    {
        return new Content(
            view: 'email.diagnostics-alert',
            with: [
                'overallStatus' => $this->overallStatus,
                'results' => $this->results,
                'timestamp' => $this->timestamp,
                'failedCount' => $this->failedCount,
                'warningCount' => $this->warningCount,
                'appUrl' => env('APP_URL', 'https://spennypiggy.co'),
                'environment' => app()->environment(),
            ],
        );
    }

    public function attachments(): array
    {
        return [];
    }
}
