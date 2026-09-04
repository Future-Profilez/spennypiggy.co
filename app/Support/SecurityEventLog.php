<?php

namespace App\Support;

use App\Models\SecurityEvent;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Schema;

/**
 * Writes the security log. Counts it back for the threshold checks.
 *
 * 🚨 NOTHING HERE MAY THROW. This is called from the middle of a sign-in, a
 * Stripe webhook and a paid download. Observation must never be able to break
 * the thing it observes: the house pattern is `RecordUserLogin` and
 * `BlockedPaymentAlert` — catch everything, log a warning, carry on. A missing
 * row is an acceptable cost; a failed login for a legitimate user, or a webhook
 * that 500s and gets retried, is not.
 *
 * ⚠️ Guarded by `Schema::hasTable`. The table is created by a migration that
 * lives in spennypiggy.co, so the admin app can be deployed against a database
 * that does not have it yet — and the admin app's test suite has no copy of the
 * migration at all.
 */
class SecurityEventLog
{
    /** Which app this deployment is. Set once, read into every row. */
    public static function app(): string
    {
        return (string) config('security_alerts.app', config('app.name') === 'Spenny Piggy Admin' ? 'admin' : 'website');
    }

    /**
     * Record one observation. Returns the row, or null if it could not be
     * written — callers must treat null as "carry on", never as an error.
     *
     * @param  array<string,mixed>  $attributes
     */
    public static function record(string $eventType, array $attributes = []): ?SecurityEvent
    {
        try {
            if (! Schema::hasTable('security_events')) {
                return null;
            }

            // Everything free-text is scrubbed on the way IN, so the table can
            // never become the place a secret is sitting in plain text. The
            // alert body then re-reads already-clean values.
            $attributes['description'] = SecurityRedactor::scrub($attributes['description'] ?? null) ?: null;

            if (isset($attributes['email'])) {
                $attributes['email'] = SecurityRedactor::maskEmail($attributes['email']);
            }

            if (isset($attributes['ip_address'])) {
                $attributes['ip_address'] = SecurityRedactor::ip($attributes['ip_address']);
            }

            if (isset($attributes['context']) && is_array($attributes['context'])) {
                $attributes['context'] = self::scrubContext($attributes['context']);
            }

            $event = SecurityEvent::create(array_merge([
                'event_type' => $eventType,
                'severity' => 'info',
                'app' => self::app(),
            ], $attributes));

            /*
             * An observation nobody reads is not an observation. The alert mails
             * go to config/alerts.php recipients and are gone once read; a flag
             * is the same fact sitting on the account until an admin resolves it.
             *
             * ⚠️ Only some event types, and only above `info` — the filter lives
             * in UserFlagger::fromSecurityEvent, which never throws.
             */
            UserFlagger::fromSecurityEvent($event);

            return $event;
        } catch (\Throwable $e) {
            Log::warning('SecurityEventLog::record failed', [
                'event_type' => $eventType,
                'error' => $e->getMessage(),
            ]);

            return null;
        }
    }

    /** Stamp a row as having produced a mail. Never throws. */
    public static function markAlerted(?SecurityEvent $event): void
    {
        if (! $event) {
            return;
        }

        try {
            $event->forceFill(['alerted_at' => now()])->save();
        } catch (\Throwable $e) {
            Log::warning('SecurityEventLog::markAlerted failed', ['error' => $e->getMessage()]);
        }
    }

    /**
     * How many events of this type happened in the last N minutes, optionally
     * narrowed by a column.
     *
     * ⚠️ Counted from the DATABASE, not from a cache counter. A cache flush or a
     * worker restart must not reset a brute-force count to zero — that is the
     * one moment the count matters. The `(ip_address, created_at)` and
     * `(event_type, created_at)` indexes exist for exactly this query.
     *
     * @param  array<string,mixed>  $where
     */
    public static function countRecent(string $eventType, int $minutes, array $where = []): int
    {
        try {
            if (! Schema::hasTable('security_events')) {
                return 0;
            }

            $query = SecurityEvent::query()
                ->where('event_type', $eventType)
                ->where('created_at', '>=', now()->subMinutes($minutes));

            foreach ($where as $column => $value) {
                $query->where($column, $value);
            }

            return (int) $query->count();
        } catch (\Throwable $e) {
            Log::warning('SecurityEventLog::countRecent failed', ['error' => $e->getMessage()]);

            return 0;
        }
    }

    /**
     * How many DISTINCT values of a column appear in this type's recent rows.
     *
     * This is the spray signal: five failures against one address is somebody
     * who forgot their password; five failures against five addresses from one
     * IP is a list being worked through, and the existing `email|ip` lockout key
     * cannot see it at all.
     *
     * @param  array<string,mixed>  $where
     */
    public static function countRecentDistinct(string $eventType, string $column, int $minutes, array $where = []): int
    {
        try {
            if (! Schema::hasTable('security_events')) {
                return 0;
            }

            $query = SecurityEvent::query()
                ->where('event_type', $eventType)
                ->where('created_at', '>=', now()->subMinutes($minutes));

            foreach ($where as $key => $value) {
                $query->where($key, $value);
            }

            return (int) $query->distinct()->count($column);
        } catch (\Throwable $e) {
            Log::warning('SecurityEventLog::countRecentDistinct failed', ['error' => $e->getMessage()]);

            return 0;
        }
    }

    /**
     * Scrub a context array one level deep. Keys whose NAME says the value is a
     * secret are dropped outright rather than pattern-matched — a pattern can
     * only catch the shapes it knows, and this table is not worth the gamble.
     *
     * @param  array<string,mixed>  $context
     * @return array<string,mixed>
     */
    private static function scrubContext(array $context): array
    {
        $banned = ['password', 'secret', 'token', 'otp', 'code', 'card', 'cvc', 'iban', 'sort_code', 'account_number', 'document', 'id_number'];

        $clean = [];

        foreach ($context as $key => $value) {
            $lowerKey = strtolower((string) $key);

            foreach ($banned as $word) {
                if (str_contains($lowerKey, $word)) {
                    continue 2;
                }
            }

            if (is_string($value)) {
                $clean[$key] = SecurityRedactor::scrub($value);
            } elseif (is_scalar($value) || $value === null) {
                $clean[$key] = $value;
            } elseif (is_array($value)) {
                $clean[$key] = array_map(
                    fn ($item) => is_string($item) ? SecurityRedactor::scrub($item) : (is_scalar($item) ? $item : null),
                    $value
                );
            }
        }

        return $clean;
    }
}
