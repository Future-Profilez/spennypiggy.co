<?php

namespace App\Mail;

use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

/**
 * "Your page is open again" — sent by `profiles:release-historic`.
 *
 * 🚨 REQUIRED BY THE CLIENT'S D6: *"notify released creators by email."* These people were
 * turned down under a review process that no longer exists, most of them months ago; a
 * release nobody tells them about is a page that quietly starts working while they have
 * stopped looking.
 *
 * 🚨 TRANSACTIONAL — `Mail::to()`, never `EmailService::sendMarketingEmail`, and no
 * unsubscribe footer. It states what changed about the person's own account, and a
 * marketing opt-out must not silence that.
 *
 * ⚠️ `$creator` and `$live` are PROTECTED, not public. A public property whose name
 * matches a `Content(with:)` key silently REPLACES the computed value — the documented
 * `buildViewData` collision that shipped three faults on this platform.
 */
class ProfileReleased extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(
        protected User $creator,
        protected bool $live,
    ) {}

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: $this->live
                ? 'Your Spenny Piggy page is live'
                : 'Your Spenny Piggy page is open again',
        );
    }

    public function content(): Content
    {
        return new Content(
            view: 'email.profile-released',
            with: [
                'creatorName' => trim((string) ($this->creator->name ?? '')),
                'username' => (string) ($this->creator->username ?? ''),
                // 🚨 The two cases say different things and must not be merged. "Live"
                // is finished; "open again" still needs the creator to do something,
                // and telling the second group their page is live sends them away.
                'isLive' => $this->live,
                'profileUrl' => rtrim(config('app.url'), '/').'/'.ltrim((string) $this->creator->username, '/'),
            ],
        );
    }
}
