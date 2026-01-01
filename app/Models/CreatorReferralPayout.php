<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class CreatorReferralPayout extends Model
{
    use HasFactory;

    protected $fillable = [
        'creator_referral_id',
        'creator_id',
        'amount',
        'requested_at',
        'approval_status',
        'approved_by_admin_id',
        'approved_at',
        'rejection_reason',
        'stripe_payout_id',
        'paid_at',
    ];

    protected $casts = [
        'amount' => 'decimal:2',
        'requested_at' => 'datetime',
        'approved_at' => 'datetime',
        'paid_at' => 'datetime',
    ];

    /* =========================
     | Relationships
     ========================= */

    public function referral()
    {
        return $this->belongsTo(CreatorReferral::class, 'creator_referral_id');
    }

    // Creator receiving the payout (referrer)
    public function creator()
    {
        return $this->belongsTo(User::class, 'creator_id');
    }

    // Admin who approved the payout
    public function approvedBy()
    {
        return $this->belongsTo(User::class, 'approved_by_admin_id');
    }

    /* =========================
     | Helpers
     ========================= */

    public function isPending(): bool
    {
        return $this->approval_status === 'PENDING';
    }

    public function isApproved(): bool
    {
        return $this->approval_status === 'APPROVED';
    }

    public function isRejected(): bool
    {
        return $this->approval_status === 'REJECTED';
    }

    public function isPaid(): bool
    {
        return !is_null($this->paid_at);
    }
}
