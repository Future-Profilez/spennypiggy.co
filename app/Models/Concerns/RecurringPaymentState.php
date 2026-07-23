<?php

namespace App\Models\Concerns;

use Carbon\Carbon;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Schema;

/**
 * Shared "is this subscription still live?" logic for BillPayment and MembershipPayment.
 *
 * The `end` column is a nullable timestamp meaning "access ends at". Legacy cancel
 * code wrote the integer 1 into it (meaning "cancelled"), and legacy comparisons read
 * `end == 1` / `end != 1`, which silently disagreed with the date comparisons used by
 * NotifyUpcomingRenewals, GifterHubController and MembershipController::buyLevel.
 * endsAt() is the single reader: it normalises the legacy sentinel to "ended in the
 * past" so old rows keep their meaning, and every caller now asks the same question.
 *
 * @mixin Model
 */
trait RecurringPaymentState
{
    /**
     * When access ends. Null means "open ended / still renewing".
     */
    public function endsAt(): ?Carbon
    {
        $end = $this->getAttribute('end');

        if ($end === null || $end === '' || $end === 0 || $end === '0') {
            return null;
        }

        // Legacy sentinel: `end = 1` meant "cancelled", not a real date.
        if (is_numeric($end)) {
            return Carbon::createFromTimestamp(0);
        }

        try {
            $parsed = Carbon::parse($end);
        } catch (\Throwable $e) {
            // Zero-dates ('0000-00-00 00:00:00') and other junk: treat as open ended.
            return null;
        }

        return $parsed->year <= 1970 ? Carbon::createFromTimestamp(0) : $parsed;
    }

    /**
     * True while the supporter still has what they paid for.
     */
    public function isSubscriptionActive(): bool
    {
        if (strtolower((string) $this->getAttribute('status')) !== 'paid') {
            return false;
        }

        $endsAt = $this->endsAt();

        return $endsAt === null || $endsAt->isFuture();
    }

    /**
     * True once it is cancelled/ended (scheduled or already over).
     */
    public function isCancelled(): bool
    {
        return $this->endsAt() !== null;
    }

    /**
     * Rows that are still charging or still granting access.
     */
    public function scopeActiveSubscription(Builder $query): Builder
    {
        return $query
            ->whereRaw('LOWER(status) = ?', ['paid'])
            ->where(function ($q) {
                $q->whereNull('end')
                    ->orWhere('end', '>', now());
            });
    }

    /**
     * Mark this row as cancelled, ending at the paid-for period end.
     */
    public function markCancelledAt(?Carbon $endsAt = null): void
    {
        $this->forceFill([
            'end' => $endsAt ?: now(),
            'upcoming_payment' => null,
        ]);

        if (static::hasCancelAtPeriodEndColumn()) {
            $this->forceFill(['cancel_at_period_end' => true]);
        }

        $this->save();
    }

    /**
     * Cached per-request so a cancel loop does not re-introspect the schema.
     */
    protected static function hasCancelAtPeriodEndColumn(): bool
    {
        static $cache = [];
        $table = (new static)->getTable();

        if (! array_key_exists($table, $cache)) {
            try {
                $cache[$table] = Schema::hasColumn($table, 'cancel_at_period_end');
            } catch (\Throwable) {
                $cache[$table] = false;
            }
        }

        return $cache[$table];
    }
}
