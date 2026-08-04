<?php

namespace App\Listeners;

use App\Models\NotificationLog;
use App\Models\User;
use App\Support\NotificationContext;
use Illuminate\Mail\Events\MessageSending;
use Illuminate\Mail\Events\MessageSent;
use Illuminate\Support\Facades\Log;

/**
 * Records every outbound email, by listening to the mailer itself.
 *
 * The platform sends mail from 121 call sites through 95 mailables. Patching
 * each one to log itself would have missed the next one written, and it was
 * exactly such a miss — a commented-out dispatch on the bank-settlement path —
 * that let wish purchases go out with no receipt and no trace. The mailer fires
 * these two events for every send regardless of the call site, so this is the
 * one place that cannot be forgotten.
 *
 * ⚠️ Nothing here may throw. A listener exception on MessageSending propagates
 * out of Mail::send and would turn a logging fault into a failed receipt.
 */
class LogOutboundMail
{
    /** Header carrying the log row id from the sending event through to the sent event. */
    public const HEADER = 'X-Spenny-Notification-Log';

    /** Bounded email → user id memo, so a batch of mail is not a query per message. */
    private static array $userIdCache = [];

    private const USER_CACHE_LIMIT = 200;

    public function sending(MessageSending $event): void
    {
        try {
            if (! config('notification_logs.enabled', true)) {
                return;
            }

            $context = NotificationContext::current();

            // Campaign traffic is opt-outable because a single send can be tens
            // of thousands of rows.
            if (! empty($context['campaign_id']) && ! config('notification_logs.log_campaigns', true)) {
                return;
            }

            $message = $event->message;
            $subject = (string) ($message->getSubject() ?? '');
            $type = $this->resolveType($event->data ?? []);

            $ids = [];

            foreach ($message->getTo() ?: [] as $address) {
                $email = $address->getAddress();

                if (empty($email)) {
                    continue;
                }

                $userId = $this->userIdFor($email);

                $row = NotificationLog::record(array_merge(NotificationContext::logColumns(), [
                    'channel' => NotificationLog::CHANNEL_EMAIL,
                    'status' => NotificationLog::STATUS_QUEUED,
                    'role' => NotificationContext::roleFor($userId, $email),
                    'recipient_user_id' => $userId,
                    'recipient_email' => $email,
                    'type' => $type,
                    'subject' => $subject,
                ]));

                if ($row) {
                    $ids[] = $row->id;
                }
            }

            if ($ids !== []) {
                // The header is how the sent event finds these rows again. The
                // same Email instance is not guaranteed to reach MessageSent
                // (transports may wrap it), but its headers always do.
                $message->getHeaders()->addTextHeader(self::HEADER, implode(',', $ids));
            }
        } catch (\Throwable $e) {
            Log::warning('LogOutboundMail: sending hook failed', ['error' => $e->getMessage()]);
        }
    }

    public function sent(MessageSent $event): void
    {
        try {
            $header = $event->message->getHeaders()->get(self::HEADER);

            if (! $header) {
                return;
            }

            $ids = array_filter(array_map('intval', explode(',', (string) $header->getBodyAsString())));

            if ($ids === []) {
                return;
            }

            NotificationLog::whereIn('id', $ids)
                ->where('status', NotificationLog::STATUS_QUEUED)
                ->update([
                    'status' => NotificationLog::STATUS_SENT,
                    'sent_at' => now(),
                    'updated_at' => now(),
                ]);
        } catch (\Throwable $e) {
            Log::warning('LogOutboundMail: sent hook failed', ['error' => $e->getMessage()]);
        }
    }

    /**
     * The mailable class where there is one (injected globally by
     * NotificationLogServiceProvider), otherwise the view name — enough to say
     * what the message was about when a raw view was rendered.
     */
    private function resolveType(array $data): ?string
    {
        if (! empty($data['__spenny_mailable'])) {
            return (string) $data['__spenny_mailable'];
        }

        return null;
    }

    private function userIdFor(string $email): ?int
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
            // A guest buyer has no account at all — that is normal, not an error.
        }

        if (count(self::$userIdCache) >= self::USER_CACHE_LIMIT) {
            self::$userIdCache = [];
        }

        self::$userIdCache[$key] = $id;

        return $id;
    }
}
