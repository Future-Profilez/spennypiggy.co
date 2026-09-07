<?php

namespace App\Mail;

use App\Http\Controllers\EmailPreferenceController;
use App\Models\User;
use App\Support\ReviewSubmission;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Address;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

/**
 * "Your profile was turned down — here is exactly why, and what to add. Come back."
 *
 * Sent by `profiles:nudge-rejected` to a creator whose profile a reviewer rejected
 * and who has not resubmitted: two months on, then two more, then yearly. Client
 * decision, 7 Sep 2026: exciting enough to bring somebody back, and it names the
 * reason — a rejection with no reason is what made them leave.
 *
 * 🚨 NO EARNINGS FIGURES, ever. "Creators on Spenny Piggy earn £X" is a claim
 * about other people's money on a marketing mail; the argument here is what the
 * PAGE does (memberships, one-off content, paid requests) and that nothing is
 * charged until the first sale.
 *
 * ⚠️ MARKETING-ADJACENT: it re-engages a lapsed signup, which the client's own
 * brief calls a reactivation campaign. The command therefore checks
 * `marketing_suppressions` as well as the creator-updates switch, and the footer
 * carries the unsubscribe link.
 *
 * Properties are `protected` — `Mailable::buildViewData()` merges PUBLIC
 * properties over `Content(with:)` (see the CLAUDE.md section on that trap).
 */
class ComeBackAndFinish extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(
        protected int $userId,
        protected string $creatorName,
        protected string $rejectReason,
        /** @var array<int, string> Presence-only blockers, e.g. "a profile photo". */
        protected array $missing = [],
        protected int $attempt = 1,
    ) {}

    public static function subjectLine(int $attempt): string
    {
        return $attempt >= 3
            ? 'Your Spenny Piggy page is still waiting for you'
            : 'Your page was one fix away — here is exactly what to change';
    }

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: self::subjectLine($this->attempt),
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
            view: 'email.come-back-and-finish',
            with: [
                'user' => $user,
                'creatorName' => $this->creatorName,
                'rejectReason' => trim($this->rejectReason),
                'missing' => $this->missing,
                'missingSentence' => ReviewSubmission::readableList($this->missing),
                'actionUrl' => url('/'.($user->username ?? '')),
                'unsubscribeUrl' => $user
                    ? EmailPreferenceController::generateUnsubscribeToken($user, 'creator_updates_enabled')
                    : null,
            ]
        );
    }
}
