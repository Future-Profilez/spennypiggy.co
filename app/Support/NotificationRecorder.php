<?php

namespace App\Support;

use App\Models\NotificationLog;
use App\Models\User;

/**
 * Writes the push and in-app-bell half of the delivery log.
 *
 * Email is captured by the mailer's own events (see LogOutboundMail); push and
 * bell have no equivalent, but both go through a single implementation each —
 * Helpers::sendNotification for push, NotificationDispatcher/NotificationSave
 * for the bell — so one call in each covers all ~107 push call sites.
 *
 * ⚠️ Every method swallows its own failures. These run mid-notification, and a
 * logging fault must never be why a creator is not told they were paid.
 */
class NotificationRecorder
{
    private static array $userIdCache = [];

    /** id → email, for bell call sites that only have an id. */
    private static array $emailCache = [];

    private const USER_CACHE_LIMIT = 200;

    public static function push(
        ?string $title,
        ?string $body,
        ?string $email,
        string $status,
        ?string $reason = null,
        ?int $userId = null,
    ): void {
        self::write(NotificationLog::CHANNEL_PUSH, $title, $body, $email, $userId, $status, $reason);
    }

    /**
     * @param  User|int|null  $user  the recipient, or just their id — call sites
     *                               that only have an id (a moderation approve
     *                               resolves a creator id, not a model) must not
     *                               have to load a whole User just to log.
     */
    public static function bell(
        ?string $title,
        ?string $body,
        $user,
        string $status,
        ?string $reason = null,
        ?string $module = null,
    ): void {
        [$userId, $email] = self::resolveRecipient($user);

        self::write(
            NotificationLog::CHANNEL_BELL,
            $title,
            $body,
            $email,
            $userId,
            $status,
            $reason,
            $module,
        );
    }

    /** @return array{0: ?int, 1: ?string} */
    private static function resolveRecipient($user): array
    {
        if ($user instanceof User) {
            return [$user->id, $user->email];
        }

        if (is_numeric($user) && (int) $user > 0) {
            $id = (int) $user;

            if (! array_key_exists($id, self::$emailCache)) {
                if (count(self::$emailCache) >= self::USER_CACHE_LIMIT) {
                    self::$emailCache = [];
                }

                try {
                    self::$emailCache[$id] = User::withTrashed()->whereKey($id)->value('email');
                } catch (\Throwable $e) {
                    self::$emailCache[$id] = null;
                }
            }

            return [$id, self::$emailCache[$id]];
        }

        return [null, null];
    }

    /**
     * An email outcome the mailer never saw — a consent refusal, or a caller
     * that asked for the email channel without supplying a mailable. Successful
     * sends are recorded by LogOutboundMail instead, so this must not be used
     * for them or the same message would be logged twice.
     */
    public static function email(
        ?string $subject,
        ?string $body,
        ?User $user,
        string $status,
        ?string $reason = null,
        ?string $type = null,
    ): void {
        self::write(NotificationLog::CHANNEL_EMAIL, $subject, $body, $user?->email, $user?->id, $status, $reason, $type);
    }

    private static function write(
        string $channel,
        ?string $title,
        ?string $body,
        ?string $email,
        ?int $userId,
        string $status,
        ?string $reason,
        ?string $type = null,
    ): void {
        try {
            if (! config('notification_logs.enabled', true)) {
                return;
            }

            $context = NotificationContext::current();

            if (! empty($context['campaign_id']) && ! config('notification_logs.log_campaigns', true)) {
                return;
            }

            if ($userId === null && ! empty($email)) {
                $userId = self::userIdFor($email);
            }

            NotificationLog::record(array_merge(NotificationContext::logColumns(), [
                'channel' => $channel,
                'status' => $status,
                'role' => NotificationContext::roleFor($userId, $email),
                'recipient_user_id' => $userId,
                'recipient_email' => $email,
                // Push and bell have no mailable, so the type is a stable slug
                // derived from the module or the message itself.
                'type' => $type ?: self::slug($title),
                'subject' => $title,
                // Push and bell text is short and is the whole message, so it
                // goes in the same column the email preview uses — one place for
                // "what did this say?", whatever the channel.
                'body_preview' => $body ? mb_substr($body, 0, max(200, (int) config('notification_logs.body_limit', 2000))) : null,
                'reason' => $reason,
                'sent_at' => $status === NotificationLog::STATUS_SENT ? now() : null,
            ]));
        } catch (\Throwable $e) {
            // Deliberately silent — see the class docblock.
        }
    }

    private static function slug(?string $title): ?string
    {
        if (empty($title)) {
            return null;
        }

        $slug = strtolower(preg_replace('/[^a-z0-9]+/i', '_', mb_substr($title, 0, 60)));

        return trim($slug, '_') ?: null;
    }

    private static function userIdFor(string $email): ?int
    {
        $key = strtolower($email);

        if (array_key_exists($key, self::$userIdCache)) {
            return self::$userIdCache[$key];
        }

        $id = null;

        try {
            $id = User::withTrashed()->whereRaw('LOWER(email) = ?', [$key])->value('id');
            $id = $id !== null ? (int) $id : null;
        } catch (\Throwable $e) {
            // Guests have no account; that is not an error.
        }

        if (count(self::$userIdCache) >= self::USER_CACHE_LIMIT) {
            self::$userIdCache = [];
        }

        self::$userIdCache[$key] = $id;

        return $id;
    }
}
