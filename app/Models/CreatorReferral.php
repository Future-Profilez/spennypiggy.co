<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class CreatorReferral extends Model
{
    use HasFactory;

    protected $table = 'creator_referrals';

    protected $fillable = [
        'referrer_creator_id',
        'referred_creator_id',
        'referral_code_id',
        'lifetime_gmv',
        'status',
        'qualified_at',
    ];

    protected $casts = [
        'qualified_at' => 'datetime',
        'lifetime_gmv' => 'decimal:2',
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

    public function progressPercentage(): float
    {
        return min(100, ($this->lifetime_gmv / 1000) * 100);
    }
}
