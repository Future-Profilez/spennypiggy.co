<?php

namespace App\Services;

use App\EmailService;
use App\Helpers;
use App\Jobs\SendEngagementNotification;
use App\Models\EngagementNotification;
use App\Models\Notification;
use App\Models\NotificationLog;
use App\Models\User;
use App\Support\NotificationRecorder;
use Illuminate\Database\QueryException;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;

/**
 * One delivery path for engagement notifications: in-app bell, push and email.
 *
 * Why this exists:
 *  - The on-site bell (`notifications` table, read by `get-notification`) had no
 *    writer at all, so anything sent via MagicBell never appeared on the site.
 *  - `Helpers::sendNotification` posts to MagicBell synchronously, which cannot
 *    be called in a loop over thousands of supporters — callers queue this work
 *    through SendEngagementNotification instead.
 *  - Consent was only modelled for marketing EMAIL. Marketing-class sends here
 *    respect per-channel consent; transactional callers bypass it.
 *
 * Callers should normally use `queue()`, not `send()`.
 */
class NotificationDispatcher
{
    public const CHANNEL_BELL = 'bell';

    public const CHANNEL_PUSH = 'push';

    public const CHANNEL_EMAIL = 'email';

    public const ALL_CHANNELS = [self::CHANNEL_BELL, self::CHANNEL_PUSH, self::CHANNEL_EMAIL];

    /**
     * Queue a notification for delivery (the normal entry point).
     *
     * @param  array  $payload  title, body, url, module, target_id, mailable (optional FQCN+args)
     */
    public static function queue(User $user, string $type, array $payload, array $channels = self::ALL_CHANNELS, bool $marketing = true): void
    {
        SendEngagementNotification::dispatch($user->id, $type, $payload, $channels, $marketing);
    }

    /**
     * Deliver now. Called by the queued job — avoid calling directly from a
     * request or a loop, because the push call is a synchronous HTTP request.
     */
    public function send(User $user, string $type, array $payload, array $channels = self::ALL_CHANNELS, bool $marketing = true): void
    {
        $title = (string) ($payload['title'] ?? '');
        $body = (string) ($payload['body'] ?? '');

        if (in_array(self::CHANNEL_BELL, $channels, true)) {
            if ($this->allowsBell($user, $marketing)) {
                $this->writeBell($user, $payload, $title, $body);
            } else {
                // A refusal is recorded, not swallowed. "Nothing was sent" and
                // "they asked us not to" look identical in a support ticket
                // otherwise, and only one of them is a bug.
                NotificationRecorder::bell($title, $body, $user, NotificationLog::STATUS_SKIPPED, 'Notifications turned off by the recipient', $type);
            }
        }

        if (in_array(self::CHANNEL_PUSH, $channels, true)) {
            if ($this->allowsPush($user, $marketing)) {
                try {
                    // Helpers::sendNotification records its own outcome.
                    Helpers::sendNotification($title, $body, $user->email);
                } catch (\Throwable $e) {
                    Log::error('NotificationDispatcher: push failed', [
                        'user_id' => $user->id, 'type' => $type, 'error' => $e->getMessage(),
                    ]);

                    NotificationRecorder::push($title, $body, $user->email, NotificationLog::STATUS_FAILED, $e->getMessage(), $user->id);
                }
            } else {
                NotificationRecorder::push(
                    $title,
                    $body,
                    $user->email,
                    NotificationLog::STATUS_SKIPPED,
                    empty($user->email) ? 'No email address on file' : 'Push turned off by the recipient',
                    $user->id,
                );
            }
        }

        if (in_array(self::CHANNEL_EMAIL, $channels, true)) {
            if (! empty($payload['mailable'])) {
                $this->sendEmail($user, $type, $payload, $marketing);
            } else {
                // The email channel is a no-op without a mailable in the payload,
                // so passing ALL_CHANNELS looks like three channels while sending
                // two. Record it rather than let the gap stay invisible.
                NotificationRecorder::email($title, $body, $user, NotificationLog::STATUS_SKIPPED, 'No mailable supplied for this notification', $type);
            }
        }
    }

    /**
     * Record that a notification was sent, and report whether it was already
     * sent before. Returns false when this exact (user, type, key) is a repeat —
     * callers use it as the "should I send?" gate. Relies on the unique index,
     * so two workers racing cannot both win.
     */
    public static function claim(int $userId, string $type, string $dedupKey): bool
    {
        try {
            EngagementNotification::create([
                'user_id' => $userId,
                'type' => $type,
                'dedup_key' => $dedupKey,
                'sent_at' => now(),
            ]);

            return true;
        } catch (QueryException $e) {
            // Duplicate key — already sent.
            return false;
        }
    }

    /**
     * Give a claim back after the send it was taken for FAILED.
     *
     * 🚨 A CLAIM IS A PROMISE THAT THE MAIL WENT OUT. `claim()` is deliberately
     * taken BEFORE the send (claiming afterwards leaves a window in which a crash
     * re-sends), which means a send that then throws leaves a row saying
     * "delivered" behind a mail nobody received — and every later run skips that
     * person on the strength of it. The failure is logged and then made permanent.
     *
     * ⚠️ CALLERS RUN THIS INSIDE A `catch`, so it MUST NOT THROW. A second
     * exception there would replace the real one and the original failure would
     * never be logged at all. Failing to release is the lesser evil: it leaves
     * exactly the un-retryable claim we had before this method existed.
     *
     * ⚠️ Release only where a retry can actually happen — a command whose next run
     * would re-select the same person. Releasing a claim nothing will ever look at
     * again buys nothing and costs a write.
     */
    public static function releaseClaim(int $userId, string $type, string $dedupKey): void
    {
        try {
            EngagementNotification::query()
                ->where('user_id', $userId)
                ->where('type', $type)
                ->where('dedup_key', $dedupKey)
                ->delete();
        } catch (\Throwable $e) {
            Log::warning('Could not release a notification claim after a failed send', [
                'user_id' => $userId,
                'type' => $type,
                'dedup_key' => $dedupKey,
                'error' => $e->getMessage(),
            ]);
        }
    }

    /** In-app bell. Marketing-class bell entries are gated by push consent. */
    private function allowsBell(User $user, bool $marketing): bool
    {
        return ! $marketing || ($user->push_notifications_enabled ?? true);
    }

    private function allowsPush(User $user, bool $marketing): bool
    {
        if (empty($user->email)) {
            return false;
        }

        return ! $marketing || ($user->push_notifications_enabled ?? true);
    }

    private function writeBell(User $user, array $payload, string $title, string $body): void
    {
        try {
            Notification::create([
                'user_id' => $payload['from_user_id'] ?? null,
                'notifiable_id' => $user->id,
                'notifiable_type' => User::class,
                'notification' => trim($title."\n".$body),
                'module' => $payload['module'] ?? 'engagement',
                'target_id' => $payload['target_id'] ?? null,
                'is_read' => 0,
            ]);

            NotificationRecorder::bell($title, $body, $user, NotificationLog::STATUS_SENT, null, $payload['module'] ?? null);
        } catch (\Throwable $e) {
            Log::error('NotificationDispatcher: bell write failed', [
                'user_id' => $user->id, 'error' => $e->getMessage(),
            ]);

            NotificationRecorder::bell($title, $body, $user, NotificationLog::STATUS_FAILED, $e->getMessage(), $payload['module'] ?? null);
        }
    }

    /**
     * Marketing-class email goes through EmailService::sendMarketingEmail so the
     * existing unsubscribe flag is honoured, plus the engagement-specific opt-out.
     */
    private function sendEmail(User $user, string $type, array $payload, bool $marketing): void
    {
        if ($marketing && ! ($user->reactivation_emails_enabled ?? true)) {
            NotificationRecorder::email(
                $payload['title'] ?? null,
                $payload['body'] ?? null,
                $user,
                NotificationLog::STATUS_SKIPPED,
                'Reactivation emails turned off by the recipient',
                $payload['mailable'] ?? $type,
            );

            return;
        }

        try {
            $mailableClass = $payload['mailable'];
            $args = $payload['mailable_args'] ?? [];

            // Spread as-is, not array_values(): a keyed payload becomes NAMED
            // arguments, so reordering the keys at a call site can no longer
            // silently hand the mailable its arguments in the wrong order. A
            // plain list still spreads positionally, so old callers are safe.
            $mailable = new $mailableClass(...$args);

            if ($marketing) {
                EmailService::sendMarketingEmail($user, $mailable);
            } else {
                Mail::to($user->email)->send($mailable);
            }
        } catch (\Throwable $e) {
            Log::error('NotificationDispatcher: email failed', [
                'user_id' => $user->id, 'type' => $type, 'error' => $e->getMessage(),
            ]);

            NotificationRecorder::email(
                $payload['title'] ?? null,
                $payload['body'] ?? null,
                $user,
                NotificationLog::STATUS_FAILED,
                $e->getMessage(),
                $payload['mailable'] ?? $type,
            );
        }
    }
}
