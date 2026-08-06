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

    /**
     * Rows written during the current job that the transport has not confirmed.
     *
     * A send that throws never reaches MessageSent, so its row would sit at
     * `queued` until the prune command settled it an hour later — an hour in
     * which a failed receipt reads as "still on its way". When the job dies, we
     * already know those rows failed, so they are settled immediately.
     */
    private static array $pending = [];

    private const PENDING_LIMIT = 500;

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
            $bodyPreview = $this->bodyPreview($message, $context);

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
                    'body_preview' => $bodyPreview,
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

                if (count(self::$pending) < self::PENDING_LIMIT) {
                    foreach ($ids as $id) {
                        self::$pending[$id] = true;
                    }
                }
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

            foreach ($ids as $id) {
                unset(self::$pending[$id]);
            }
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

    /** Called when a job starts — the previous job's unconfirmed rows are not ours. */
    public static function resetPending(): void
    {
        self::$pending = [];
    }

    /**
     * Settle everything this job wrote but never confirmed. Called when the job
     * throws, so a transport failure is recorded as `failed` at the moment it
     * happens rather than an hour later by the prune command.
     */
    public static function settlePending(string $reason): void
    {
        try {
            $ids = array_keys(self::$pending);
            self::$pending = [];

            if ($ids === []) {
                return;
            }

            NotificationLog::whereIn('id', $ids)
                ->where('status', NotificationLog::STATUS_QUEUED)
                ->update([
                    'status' => NotificationLog::STATUS_FAILED,
                    'reason' => mb_substr($reason, 0, 500),
                    'updated_at' => now(),
                ]);
        } catch (\Throwable $e) {
            Log::warning('LogOutboundMail: could not settle unconfirmed rows', ['error' => $e->getMessage()]);
        }
    }

    /**
     * A plain-text preview of what the message said, so an admin can answer
     * "what did we send them?" without asking the recipient to forward it.
     *
     * ⚠️ A PREVIEW, never the message. Receipt emails carry `reward_body` — the
     * content the buyer paid for — so keeping whole HTML bodies would put every
     * purchased message and link in a second table that admins can read.
     * Plain text only, truncated, and attachments are never touched.
     *
     * ⚠️ Campaign bodies are identical for every recipient and already stored
     * once on the campaign row. Repeating one across tens of thousands of log
     * rows is pure waste, so it is off by default.
     */
    private function bodyPreview($message, array $context): ?string
    {
        try {
            if (! config('notification_logs.store_body', true)) {
                return null;
            }

            if (! empty($context['campaign_id']) && ! config('notification_logs.store_campaign_body', false)) {
                return null;
            }

            $text = $message->getTextBody();

            if (empty($text)) {
                $html = $message->getHtmlBody();

                if (empty($html)) {
                    return null;
                }

                // <br> and block ends become newlines first, or the whole email
                // collapses into one unreadable line. Table cells become a
                // space, not a newline, so a row's cells stay on one line.
                $html = preg_replace('/<(br|\/p|\/div|\/tr|\/h[1-6])[^>]*>/i', "\n", (string) $html);
                $html = preg_replace('/<\/(td|th)[^>]*>/i', ' ', $html);
                $html = preg_replace('/<(style|script|head)\b[^>]*>.*?<\/\1>/is', ' ', $html);
                $text = html_entity_decode(strip_tags($html), ENT_QUOTES | ENT_HTML5, 'UTF-8');
            }

            // Alert/receipt templates are heavily indented multi-line Blade
            // markup, so stripping tags leaves whitespace-only "lines" between
            // every block — a blank line padded with the original indentation
            // spaces/tabs, which a bare `\n{3,}` collapse does not match (it is
            // not three literal newlines in a row, it is newline-space-newline).
            // Trimming the horizontal whitespace touching every newline FIRST
            // is what makes the count collapse correctly.
            $text = (string) $text;
            $text = preg_replace('/[ \t]+/', ' ', $text);
            $text = preg_replace('/ *\n[ \t]*/', "\n", $text);
            $text = trim(preg_replace('/\n{3,}/', "\n\n", $text));

            if ($text === '') {
                return null;
            }

            $limit = max(200, (int) config('notification_logs.body_limit', 2000));

            return mb_strlen($text) > $limit
                ? mb_substr($text, 0, $limit)."\n\n… (truncated)"
                : $text;
        } catch (\Throwable $e) {
            return null;
        }
    }
}
