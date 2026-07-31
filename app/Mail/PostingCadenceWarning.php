<?php

namespace App\Mail;

use App\Models\User;
use App\Services\PostingCadenceService;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Address;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

/**
 * "Your subscribers are still paying you, and your posts are running low."
 *
 * Sent BEFORE collection is paused, which is the whole point: the existing pause and resume
 * messages only ever arrived after the creator's recurring income had already stopped.
 */
class PostingCadenceWarning extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(
        public int $userId,
        public string $creatorName,
        public int $posts,
        public int $required,
    ) {}

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: 'Your subscriber posts are running low',
            // config(), never env() — Vapor caches config on deploy, after which env() is null.
            from: new Address(
                config('mail.from.address') ?: 'noreply@spennypiggy.co',
                config('mail.from.name') ?: 'Spenny Piggy'
            )
        );
    }

    public function content(): Content
    {
        $user = User::find($this->userId);

        return new Content(
            view: 'email.posting-cadence-warning',
            with: [
                'user' => $user,
                'creatorName' => $this->creatorName,
                'posts' => $this->posts,
                'required' => $this->required,
                'windowDays' => PostingCadenceService::WINDOW_DAYS,
                'dashboardUrl' => route('dashboard', ['add' => 'post']),
            ]
        );
    }
}
