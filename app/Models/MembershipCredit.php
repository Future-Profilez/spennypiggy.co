<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

/**
 * One free month of the creator platform subscription, earned by selling.
 *
 * 🚨 IT IS A CREDIT AND NEVER CASH. A credit is spent against the creator's own
 * membership bill and against nothing else: it is not withdrawable, not
 * transferable, and it never creates an income `FinancialTransaction`. A bonus
 * recorded as income would feed its own qualifying total and earn the next
 * credit on its own — the loop Fast Start, Referral and the Growth Bonus all
 * avoid structurally.
 *
 * 🚨 ONE ROW IS ONE MONTH. `(creator_id, rung, sequence)` is UNIQUE, so a
 * re-run of the evaluator, two workers racing or a retried job can never award
 * the same month twice.
 *
 * ⚠️ `username` is a SNAPSHOT and there is no foreign key: the record of what a
 * creator earned outlives the account it is about.
 */
class MembershipCredit extends Model
{
    use HasFactory;

    protected $table = 'membership_credits';

    /**
     * 🚨 DELIBERATELY NARROW. `status`, `applied_at`, `reversed_at`,
     * `stripe_balance_transaction_id` and `needs_review` are NOT fillable — they
     * are written by `MembershipCreditService` through `forceFill`, because they
     * are statements about money that has or has not moved. A back office (or a
     * posted form) able to mass-assign `status = 'earned'` would hand a creator
     * a free month nobody earned, or hand them the same one twice.
     */
    protected $fillable = [
        'creator_id',
        'username',
        'rung',
        'sequence',
        'threshold_gbp',
        'qualifying_earnings_gbp',
        'earned_at',
        'expires_at',
        'note',
    ];

    protected $casts = [
        'rung' => 'integer',
        'sequence' => 'integer',
        'threshold_gbp' => 'decimal:2',
        'qualifying_earnings_gbp' => 'decimal:2',
        'earned_at' => 'datetime',
        'applied_at' => 'datetime',
        'expires_at' => 'datetime',
        'reversed_at' => 'datetime',
        'applied_value_minor' => 'integer',
        'needs_review' => 'boolean',
    ];

    /** Available to spend. */
    public const STATUS_EARNED = 'earned';

    /** Spent against a bill. */
    public const STATUS_APPLIED = 'applied';

    /** A refund took qualifying earnings back below the rung before it was spent. */
    public const STATUS_REVERSED = 'reversed';

    /** Went unused past `expires_at`. Only reachable when an expiry is configured. */
    public const STATUS_EXPIRED = 'expired';

    public function creator()
    {
        return $this->belongsTo(User::class, 'creator_id');
    }

    public function scopeEarned($query)
    {
        return $query->where('status', self::STATUS_EARNED);
    }

    public function scopeApplied($query)
    {
        return $query->where('status', self::STATUS_APPLIED);
    }

    /**
     * 🚨 "AVAILABLE" IS NOT "EARNED" — an expired credit is still `earned`
     * until the sweep gets to it, and a creator must never be shown a month
     * they cannot use. Read this, never the bare scope, wherever the number is
     * offered to somebody.
     */
    public function scopeAvailable($query)
    {
        return $query->where('status', self::STATUS_EARNED)
            ->where(fn ($q) => $q->whereNull('expires_at')->orWhere('expires_at', '>', now()));
    }

    public function isSpendable(): bool
    {
        if ($this->status !== self::STATUS_EARNED) {
            return false;
        }

        return $this->expires_at === null || $this->expires_at->isFuture();
    }
}
