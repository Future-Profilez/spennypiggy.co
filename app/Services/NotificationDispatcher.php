<?php

namespace App\Services;

use App\EmailService;
use App\Helpers;
use App\Jobs\SendEngagementNotification;
use App\Models\EngagementNotification;
use App\Models\Notification;
use App\Models\User;
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

        if (in_array(self::CHANNEL_BELL, $channels, true) && $this->allowsBell($user, $marketing)) {
            $this->writeBell($user, $payload, $title, $body);
        }

        if (in_array(self::CHANNEL_PUSH, $channels, true) && $this->allowsPush($user, $marketing)) {
            try {
                Helpers::sendNotification($title, $body, $user->email);
            } catch (\Throwable $e) {
                Log::error('NotificationDispatcher: push failed', [
                    'user_id' => $user->id, 'type' => $type, 'error' => $e->getMessage(),
                ]);
            }
        }

        if (in_array(self::CHANNEL_EMAIL, $channels, true) && ! empty($payload['mailable'])) {
            $this->sendEmail($user, $type, $payload, $marketing);
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
        } catch (\Throwable $e) {
            Log::error('NotificationDispatcher: bell write failed', [
                'user_id' => $user->id, 'error' => $e->getMessage(),
            ]);
        }
    }

    /**
     * Marketing-class email goes through EmailService::sendMarketingEmail so the
     * existing unsubscribe flag is honoured, plus the engagement-specific opt-out.
     */
    private function sendEmail(User $user, string $type, array $payload, bool $marketing): void
    {
        if ($marketing && ! ($user->reactivation_emails_enabled ?? true)) {
            return;
        }

        try {
            $mailableClass = $payload['mailable'];
            $args = $payload['mailable_args'] ?? [];
            $mailable = new $mailableClass(...array_values($args));

            if ($marketing) {
                EmailService::sendMarketingEmail($user, $mailable);
            } else {
                Mail::to($user->email)->send($mailable);
            }
        } catch (\Throwable $e) {
            Log::error('NotificationDispatcher: email failed', [
                'user_id' => $user->id, 'type' => $type, 'error' => $e->getMessage(),
            ]);
        }
    }
}
