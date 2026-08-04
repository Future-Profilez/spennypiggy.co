<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Log;

/**
 * One row per outbound delivery attempt — see the migration for why this exists.
 *
 * Nothing in here may throw into a send path. `record()` and `markSent()` are
 * called from inside the mailer's own event listeners and from the push helper;
 * a logging failure must never be the reason a receipt does not go out.
 */
class NotificationLog extends Model
{
    public const CHANNEL_EMAIL = 'email';

    public const CHANNEL_PUSH = 'push';

    public const CHANNEL_BELL = 'bell';

    public const STATUS_QUEUED = 'queued';

    public const STATUS_SENT = 'sent';

    public const STATUS_FAILED = 'failed';

    /** Consent off, no address on file, nothing to send to. Never counted as sent. */
    public const STATUS_SKIPPED = 'skipped';

    public const ROLE_BUYER = 'buyer';

    public const ROLE_CREATOR = 'creator';

    public const ROLE_ADMIN = 'admin';

    public const ROLE_OTHER = 'other';

    protected $fillable = [
        'channel',
        'status',
        'role',
        'recipient_user_id',
        'recipient_email',
        'type',
        'subject',
        'context_type',
        'context_id',
        'stripe_session_id',
        'stripe_payment_intent_id',
        'financial_transaction_id',
        'campaign_id',
        'reason',
        'meta',
        'sent_at',
        'delivered_at',
    ];

    protected $casts = [
        'meta' => 'array',
        'sent_at' => 'datetime',
        'delivered_at' => 'datetime',
    ];

    public function recipient()
    {
        return $this->belongsTo(User::class, 'recipient_user_id');
    }

    /**
     * Write a row, swallowing every failure. Returns the model or null — callers
     * must treat null as "logging is unavailable", never as "the send failed".
     */
    public static function record(array $attributes): ?self
    {
        try {
            if (! empty($attributes['subject'])) {
                $attributes['subject'] = mb_substr((string) $attributes['subject'], 0, 500);
            }
            if (! empty($attributes['reason'])) {
                $attributes['reason'] = mb_substr((string) $attributes['reason'], 0, 500);
            }

            return static::create($attributes);
        } catch (\Throwable $e) {
            Log::warning('NotificationLog: write failed', ['error' => $e->getMessage()]);

            return null;
        }
    }

    /** Flip a queued row once the transport accepted the message. */
    public static function markSent(?self $row, array $extra = []): void
    {
        if (! $row) {
            return;
        }

        try {
            $row->forceFill(array_merge([
                'status' => self::STATUS_SENT,
                'sent_at' => now(),
            ], $extra))->save();
        } catch (\Throwable $e) {
            Log::warning('NotificationLog: markSent failed', ['id' => $row->id, 'error' => $e->getMessage()]);
        }
    }

    public static function markFailed(?self $row, string $reason): void
    {
        if (! $row) {
            return;
        }

        try {
            $row->forceFill([
                'status' => self::STATUS_FAILED,
                'reason' => mb_substr($reason, 0, 500),
            ])->save();
        } catch (\Throwable $e) {
            Log::warning('NotificationLog: markFailed failed', ['id' => $row->id, 'error' => $e->getMessage()]);
        }
    }

    /**
     * Human label for the message. The mailable class name is the only thing we
     * reliably have for an email whose subject was never resolved.
     */
    public function getTypeLabelAttribute(): string
    {
        $type = (string) ($this->type ?? '');

        if ($type === '') {
            return 'Notification';
        }

        if (str_contains($type, '\\')) {
            $short = class_basename($type);

            return trim(preg_replace('/(?<!^)[A-Z]/', ' $0', $short));
        }

        return ucfirst(str_replace(['_', '-', '.'], ' ', $type));
    }

    public function scopeForSession($query, ?string $sessionId)
    {
        return $query->where('stripe_session_id', $sessionId);
    }

    /**
     * Rows a given person is allowed to see about themselves. Deliberately keyed
     * on the recipient, never on the transaction: a creator must not learn
     * whether their supporter's receipt arrived.
     */
    public function scopeVisibleTo($query, int $userId)
    {
        return $query->where('recipient_user_id', $userId);
    }
}
