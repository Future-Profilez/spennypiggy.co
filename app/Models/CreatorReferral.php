<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class CreatorReferral extends Model
{
    use HasFactory;

    protected $table = 'creator_referrals';

    protected $fillable = [
        'referrer_creator_id',
        'payout_id',
        'referred_creator_id',
        'referral_code_id',
        'lifetime_gmv',
        'status',
        'qualified_at',
        /*
         * 🚨 STAMPED AT CREATION AND NEVER READ FROM CONFIG AFTERWARDS. The
         * threshold moved from £1,000 to £2,000 on 11 Sep 2026, and a referral
         * already in flight is judged at the figure it was made under —
         * "somebody part-way to qualifying must not silently have the
         * goalposts moved". See `config/referral.php`.
         */
        'qualifying_threshold',
        'reward_amount',
        'first_earned_at',
    ];

    protected $casts = [
        'qualified_at' => 'datetime',
        'first_earned_at' => 'datetime',
        'blocked_at' => 'datetime',
        'lifetime_gmv' => 'decimal:2',
        'qualifying_threshold' => 'decimal:2',
        'reward_amount' => 'decimal:2',
    ];

    /* ================= RELATIONSHIPS ================= */

    // Creator who owns the referral
    public function referrer()
    {
        return $this->belongsTo(User::class, 'referrer_creator_id');
    }

    // Creator who signed up via referral
    public function referred()
    {
        return $this->belongsTo(User::class, 'referred_creator_id');
    }

    // Payout request (if any)
    public function payout()
    {
        return $this->hasOne(CreatorReferralPayout::class);
    }

    // Referral code used
    public function referralCode()
    {
        return $this->belongsTo(ReferralCode::class, 'referral_code_id');
    }

    /* ================= SCOPES (OPTIONAL BUT USEFUL) ================= */

    public function scopeQualified($query)
    {
        return $query->where('status', 'QUALIFIED');
    }

    public function scopePayable($query)
    {
        return $query->where('status', 'PAYOUT_REQUESTED');
    }

    public function isQualified(): bool
    {
        return $this->status === 'QUALIFIED';
    }

    public function isPaid(): bool
    {
        return $this->status === 'PAID';
    }

    /**
     * The threshold THIS referral is judged at.
     *
     * 🚨 THE ROW, NOT THE CONFIG. Config decides what a NEW referral is
     * stamped with; this one keeps the figure it was made under. Falls back to
     * config only for a row written before the column existed.
     */
    public function qualifyingThreshold(): float
    {
        $stamped = (float) ($this->qualifying_threshold ?? 0);

        return $stamped > 0
            ? $stamped
            : (float) config('referral.qualifying_gmv', 2000);
    }

    /** The reward THIS referral pays, snapshot the same way. */
    public function rewardAmount(): float
    {
        $stamped = (float) ($this->reward_amount ?? 0);

        return $stamped > 0
            ? $stamped
            : (float) config('referral.reward_amount', 50);
    }

    /**
     * ⚠️ The DENOMINATOR IS THIS REFERRAL'S OWN QUALIFYING THRESHOLD, not a
     * round number that happens to match it and not today's config value. This
     * bar is what a creator watches to decide whether a referral is going to
     * pay; a bar that fills at a different figure than the query in
     * `ReferAndEarnController` counts at reads as full and pays nothing — and
     * after 11 Sep 2026 a config read here would show an old referral filling
     * at £2,000 while it actually qualifies at £1,000.
     */
    public function progressPercentage(): float
    {
        $target = $this->qualifyingThreshold();

        if ($target <= 0) {
            return 100;
        }

        return min(100, ($this->lifetime_gmv / $target) * 100);
    }
}
