<?php

namespace App\Mail;

use App\Http\Controllers\EmailPreferenceController;
use App\Models\User;
use App\Services\CreatorSetupService;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Address;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class PublishYourFirstItem extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(
        public int $userId,
        public string $creatorName,
        public int $stage = 3,
    ) {}

    /**
     * One definition of the wording, read by the mailable subject AND the bell/push title.
     * Kept here because it describes the email; duplicating it in the command is how the
     * notification a creator sees on-site drifts from the one that lands in their inbox.
     */
    public static function subjectFor(int $stage): string
    {
        return $stage >= 10
            ? 'Ready to publish your first item?'
            : 'Start earning from your Spenny Piggy page';
    }

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: self::subjectFor($this->stage),
            // ⚠️ config(), never env(). Vapor caches config on every deploy, after which
            // env() returns null and the sender silently falls back to whatever default is
            // hardcoded here rather than what the environment is actually configured with.
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
            view: 'email.first-listing',
            with: [
                'user' => $user,
                'creatorName' => $this->creatorName,
                'stage' => $this->stage,
                'dashboardUrl' => route('dashboard', ['add' => CreatorSetupService::FIRST_LISTING_PARAM]),
                'unsubscribeUrl' => $user
                    ? EmailPreferenceController::generateUnsubscribeToken($user, 'creator_updates_enabled')
                    : null,
            ]
        );
    }
}
