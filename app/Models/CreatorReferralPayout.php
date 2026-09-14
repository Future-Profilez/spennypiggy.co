<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class CreatorReferralPayout extends Model
{
    use HasFactory;

    /*
     * 🚨 THREE COLUMNS THIS MODEL NAMED DO NOT EXIST (fixed 11 Sep 2026, pre-existing
     * since Jan 2026): `approval_status` was dropped (`2026_01_03_112519`), `stripe_payout_id`
     * became `stripe_transfer_id`, `creator_referral_id` was dropped (`2026_01_03_062603`).
     * `isPending()`/`isApproved()`/`isRejected()` read `approval_status` and therefore
     * ALWAYS answered false. The admin app's copy had the right names all along.
     */
    protected $fillable = [
        'creator_id',
        'amount',
        'requested_at',
        'approved_by_admin_id',
        'approved_at',
        'rejection_reason',
        'stripe_transfer_id',
        'paid_at',
        'status',
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
        return strtolower((string) $this->status) === 'pending';
    }

    public function isApproved(): bool
    {
        return strtolower((string) $this->status) === 'approved';
    }

    public function isRejected(): bool
    {
        return strtolower((string) $this->status) === 'rejected';
    }

    public function isPaid(): bool
    {
        return ! is_null($this->paid_at);
    }
}
