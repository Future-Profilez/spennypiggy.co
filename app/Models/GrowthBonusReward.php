<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

/**
 * One Growth Bonus milestone reward (brief §5 states):
 * pending_validation → approved → paid, or → reversed.
 *
 * `qualifying_transaction_id` is the ledger row that crossed the threshold.
 * Payout rule (client, 26 Aug 2026): the bonus is paid in the SAME payout run
 * as that transaction — if the transaction is refunded before payout the
 * evaluator reverses the reward; if refunded after, `needs_review` is set.
 *
 * ⚠️ Mirrored in admin.spennypiggy.co (shared DB). Keep in step by hand.
 */
class GrowthBonusReward extends Model
{
    use HasFactory;

    const STATUS_PENDING_VALIDATION = 'pending_validation';

    const STATUS_APPROVED = 'approved';

    const STATUS_PAID = 'paid';

    const STATUS_REVERSED = 'reversed';

    protected $fillable = [
        'profile_id',
        'creator_id',
        'milestone_gmv',
        'amount',
        'status',
        'qualifying_transaction_id',
        'needs_review',
        'approved_at',
        'paid_at',
        'reversed_at',
        'payout_reference',
        'admin_note',
    ];

    protected $casts = [
        'milestone_gmv' => 'decimal:2',
        'amount' => 'decimal:2',
        'needs_review' => 'boolean',
        'approved_at' => 'datetime',
        'paid_at' => 'datetime',
        'reversed_at' => 'datetime',
    ];

    public function profile()
    {
        return $this->belongsTo(GrowthBonusProfile::class, 'profile_id');
    }

    public function creator()
    {
        return $this->belongsTo(User::class, 'creator_id');
    }

    public function qualifyingTransaction()
    {
        return $this->belongsTo(FinancialTransaction::class, 'qualifying_transaction_id');
    }
}
