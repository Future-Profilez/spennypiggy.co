<?php

namespace App\Mail;

use App\Models\CreatorMetric;
use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Address;
use Illuminate\Mail\Mailables\Attachment;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class RiskLevelChanged extends Mailable
{
    use Queueable, SerializesModels;

    public $metric;

    public $user;

    public $messageBody;

    /**
     * Create a new message instance.
     */
    public function __construct(CreatorMetric $metric, User $user, string $messageBody)
    {
        $this->metric = $metric;
        $this->user = $user;
        $this->messageBody = $messageBody;
    }

    /**
     * Get the message envelope.
     */
    public function envelope(): Envelope
    {
        $subject = 'Important: Update on your account status';
        if ($this->metric->risk_level === 'high') {
            $subject = 'Action Required: Account Restricted';
        } elseif ($this->metric->risk_level === 'low') {
            $subject = 'Account Status Update: Restrictions Lifted';
        }

        return new Envelope(
            subject: $subject,
            from: new Address(env('MAIL_FROM_ADDRESS', 'noreply@spennypiggy.co'), env('MAIL_FROM_NAME', 'Spenny Piggy'))
        );
    }

    /**
     * Get the message content definition.
     */
    public function content(): Content
    {
        $view = 'email.risk-level-changed'; // Default fallback

        if ($this->metric->risk_level === 'high') {
            $view = 'email.risk.high_risk_restricted';
        } elseif ($this->metric->risk_level === 'medium') {
            $view = 'email.risk.medium_risk_warning';
        } elseif ($this->metric->risk_level === 'low') {
            $view = 'email.risk.low_risk_restored';
        }

        return new Content(
            view: $view,
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
