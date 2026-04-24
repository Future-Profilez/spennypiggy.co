<?php

namespace App\Mail;

use App\Models\FeatureSuggestion;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class FeatureSuggestionStatusMail extends Mailable
{
    use Queueable, SerializesModels;

    public FeatureSuggestion $suggestion;

    public function __construct(FeatureSuggestion $suggestion)
    {
        $this->suggestion = $suggestion;
    }

    public function envelope(): Envelope
    {
        $subjects = [
            'under_review' => 'Your idea is under review',
            'planned'      => 'Great news! Your idea is planned',
            'rejected'     => 'An update on your feature suggestion',
        ];
        $subject = $subjects[$this->suggestion->status] ?? 'Update on your feature suggestion';
        return new Envelope(subject: $subject . ' - Spenny Piggy');
    }

    public function content(): Content
    {
        return new Content(view: 'email.feature_suggestion_status');
    }

    public function attachments(): array
    {
        return [];
    }
}
