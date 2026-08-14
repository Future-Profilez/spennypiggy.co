<?php

namespace App\Mail;

use App\Http\Controllers\EmailPreferenceController;
use App\Models\User;
use App\Support\PushReachability;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Address;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

/**
 * "We cannot confirm your phone alerts are still switched on."
 *
 * 🚨 THE COPY MUST NEVER CLAIM PUSH IS BROKEN. A MagicBell subscription lives in
 * the browser and at MagicBell, so a stale heartbeat means we have not been able
 * to CONFIRM it — not that it has stopped. Stating the stronger version would be
 * telling a creator their notifications are dead when they may be arriving fine,
 * and once one of these is wrong every later one is ignored.
 *
 * Email is the only channel that can carry this. Push is what we cannot confirm,
 * and the bell is only read by someone already in the app — which is exactly the
 * act that would have refreshed the heartbeat in the first place.
 */
class PushAlertsNeedChecking extends Mailable
{
    use Queueable, SerializesModels;

    /**
     * ⚠️ Primitives only. This is constructed from a serialized queue payload by
     * `NotificationDispatcher`, which spreads a keyed array as named arguments.
     */
    public function __construct(
        public int $userId,
        public string $creatorName,
        public string $dashboardUrl,
    ) {}

    /**
     * One definition of the wording, read by the subject AND the bell/push title,
     * so what lands in the inbox cannot drift from what shows on site.
     *
     * ⚠️ Not named `subject()` — `Mailable` already declares one with a different
     * signature, and redeclaring it is a fatal incompatibility, not an override.
     */
    public static function subjectLine(): string
    {
        return 'Check your phone alerts are still on';
    }

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: self::subjectLine(),
            // ⚠️ config(), never env(). Vapor caches config on deploy, after which
            // env() returns null and the sender silently falls back to a hardcoded
            // default that does not match what the environment is configured with.
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
            view: 'email.push-alerts-need-checking',
            with: [
                'user' => $user,
                'creatorName' => $this->creatorName,
                'dashboardUrl' => $this->dashboardUrl,
                'days' => PushReachability::STALE_DAYS,
                // ⚠️ Points at `push_notifications_enabled`, not the generic
                // creator-updates flag: someone unsubscribing from THIS is saying
                // they do not want push chased, and turning it off also removes
                // them from the sweep entirely — the link means what it says.
                'unsubscribeUrl' => $user
                    ? EmailPreferenceController::generateUnsubscribeToken($user, 'push_notifications_enabled')
                    : null,
            ],
        );
    }
}
