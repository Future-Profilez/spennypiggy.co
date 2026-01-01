<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class CreatorReferral extends Model
{
    use HasFactory;

    protected $fillable = [
        'referrer_creator_id',
        'referred_creator_id',
        'lifetime_gmv',
        'status',
        'qualified_at',
    ];

    protected $casts = [
        'lifetime_gmv' => 'decimal:2',
        'qualified_at' => 'datetime',
    ];

    /* =========================
     | Relationships
     ========================= */

    // Creator who shared the referral
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

    /* =========================
     | Helpers
     ========================= */

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
