<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class FastStartBonusPayout extends Model
{
    use HasFactory;

    protected $fillable = [
        'creator_uuid',
        'stripe_account_id',
        'window_start',
        'window_end',
        'eligible_at',
        'unsettled_count',
        'last_calculated_at',
        'earnings_minor',
        'bonus_minor',
        'expected_earnings_minor',
        'expected_bonus_minor',
        'clawback_minor',
        'currency',
        'status',
        'stripe_transfer_id',
        'stripe_payout_id',
        'paid_at',
        'reconciled_at',
    ];

    protected $casts = [
        'window_start' => 'datetime',
        'window_end' => 'datetime',
        'eligible_at' => 'datetime',
        'last_calculated_at' => 'datetime',
        'paid_at' => 'datetime',
        'reconciled_at' => 'datetime',
    ];

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'creator_uuid', 'uuid');
    }

    public function scopePending(Builder $query): Builder
    {
        return $query->where('status', 'pending_settlement');
    }

    public function scopeReady(Builder $query): Builder
    {
        return $query->where('status', 'ready');
    }

    public function scopePaid(Builder $query): Builder
    {
        return $query->where('status', 'paid');
    }

    public function scopeNoBonus(Builder $query): Builder
    {
        return $query->where('status', 'no_bonus');
    }

    public function scopeFailed(Builder $query): Builder
    {
        return $query->where('status', 'failed');
    }

    /**
     * Returns the effective bonus rate for the given earnings_minor amount,
     * respecting tiered config when enabled.
     */
    public static function resolveRate(int $earningsMinor): float
    {
        if (! config('fast_start_bonus.bonus.enable_tiered')) {
            return (float) config('fast_start_bonus.bonus.flat_rate', 0.05);
        }

        $tiers = collect(config('fast_start_bonus.bonus.tiered_rates', []))
            ->sortByDesc('threshold');

        foreach ($tiers as $tier) {
            if ($earningsMinor >= $tier['threshold']) {
                return (float) $tier['rate'];
            }
        }

        return (float) config('fast_start_bonus.bonus.flat_rate', 0.05);
    }

    /** Earnings in major currency units (e.g. £). */
    public function getEarningsAttribute(): float
    {
        return $this->earnings_minor / 100;
    }

    /** Bonus in major currency units (e.g. £). */
    public function getBonusAttribute(): float
    {
        return $this->bonus_minor / 100;
    }

    /** Days remaining in the earning window (negative = window closed). */
    public function getDaysRemainingAttribute(): int
    {
        return (int) now()->diffInDays($this->window_end, false);
    }

    /** True if the window is still open. */
    public function getWindowActiveAttribute(): bool
    {
        return now()->lt($this->window_end);
    }
}
