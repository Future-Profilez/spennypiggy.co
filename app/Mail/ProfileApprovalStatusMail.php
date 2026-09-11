<?php

namespace App\Mail;

use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Address;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

/**
 * "Your profile has been approved" — sent once, when a creator's profile unlocks (profile_status_lock = 2).
 *
 * 🚨 TRANSACTIONAL ACCOUNT STATE NOTIFICATION. Sent when all checks clear or admin approves.
 * Carries no unsubscribe link because it reports a fundamental account status change.
 */
class ProfileApprovalStatusMail extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(
        public User|int $user,
        public bool $status = true,
    ) {}

    public function envelope(): Envelope
    {
        $subject = 'Spenny Piggy Profile Has Been '.($this->status ? 'Approved.' : 'Rejected.');

        return new Envelope(
            subject: $subject,
            from: new Address(
                config('mail.from.address') ?: 'noreply@spennypiggy.co',
                config('mail.from.name') ?: 'Spenny Piggy'
            )
        );
    }

    public function content(): Content
    {
        $userModel = $this->user instanceof User ? $this->user : User::find($this->user);

        return new Content(
            view: 'email.profile-approval-status',
            with: [
                'user' => $userModel,
                'status' => $this->status,
                'creatorName' => $userModel?->name ?: ($userModel?->username ?? 'Creator'),
                'ctaUrl' => $userModel && $userModel->username
                    ? rtrim(config('app.url'), '/').'/'.$userModel->username
                    : rtrim(config('app.url'), '/').'/dashboard',
            ]
        );
    }
}
