<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;

/**
 * Someone we turned away at registration, and the address to tell when it opens.
 *
 * See the migration for why this table exists. The rules that matter:
 *
 *  - `notified_at` is a CLAIM, not an audit field. It is set by an atomic
 *    UPDATE before the email is sent and released if the send fails.
 *  - `converted_at` closes the lead. A converted lead must never be emailed
 *    "you can sign up now" — they already did.
 *  - `reason` is an enum in practice. A free-text value here would make the
 *    admin breakdown unreadable and the prune unable to distinguish cohorts.
 */
class SignupLead extends Model
{
    /** Refused because the platform risk state was FREEZE. */
    public const REASON_PLATFORM_FREEZE = 'platform_freeze';

    /**
     * The only values `reason` may hold.
     *
     * ⚠️ A daily onboarding cap exists in `RiskSetting` (`onboarding_limits`)
     * but is wired to nothing — `CreatorActivationService` has no callers. If
     * it is ever switched on, add `daily_cap` here and capture on it too, or
     * that refusal becomes the silent lead-loss this table was built to stop.
     */
    public const REASONS = [
        self::REASON_PLATFORM_FREEZE,
    ];

    protected $fillable = [
        'email',
        'role',
        'reason',
        'platform_state',
        'source',
        'landing_page',
        'notified_at',
        'converted_at',
    ];

    protected $casts = [
        'role' => 'integer',
        'notified_at' => 'datetime',
        'converted_at' => 'datetime',
    ];

    /**
     * Still waiting: never told, never converted.
     */
    public function scopePending(Builder $query): Builder
    {
        return $query->whereNull('notified_at')->whereNull('converted_at');
    }

    /**
     * Claim this lead's notification.
     *
     * The UPDATE *is* the claim — `whereNull` in the same statement — so two
     * workers running the sweep at once cannot both email the same person.
     * Returns false when somebody else won.
     */
    public function claimNotification(): bool
    {
        $claimed = static::query()
            ->whereKey($this->getKey())
            ->whereNull('notified_at')
            ->whereNull('converted_at')
            ->update(['notified_at' => now()]);

        return $claimed === 1;
    }

    /**
     * Hand the claim back after a failed send.
     *
     * Without this one SMTP blip costs that person their notice permanently:
     * the row would read "told" and the sweep would never look at it again.
     */
    public function releaseNotification(): void
    {
        static::query()->whereKey($this->getKey())->update(['notified_at' => null]);
    }
}
