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
 * PHASE 3 (30 Aug 2026): approval now leads to a real Stripe payment.
 * `scheduled_payout_date` is the date the creator was TOLD the money would be
 * sent, stored rather than recomputed — the notification, the creator's screens
 * and the payer must all name the same day.
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

    /*
     * 🚨 HOLD REASONS ARE CODES, NEVER PROSE. The creator-facing sentence is
     * derived from these by `GrowthBonusService::holdMessage()` — a stored
     * English string cannot be reworded or translated, and it invites writing a
     * cause nobody verified. Same rule as the moderation queue's categories.
     *
     * A hold is separate from `status`: the status records that an ADMIN
     * approved the bonus, the hold records that the PLATFORM is not sending it
     * today. Both facts stay true at once.
     */
    const HOLD_MILESTONE_NOT_COVERED = 'milestone_not_covered';

    const HOLD_ACCOUNT_SUSPENDED = 'account_suspended';

    const HOLD_CANNOT_RECEIVE = 'cannot_receive';

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
        // Phase 3 — the automatic payout.
        'scheduled_payout_date',
        'announced_at',
        'payout_record_uuid',
        'stripe_transfer_id',
        'stripe_payout_id',
        'payout_failure_message',
        'payout_hold_reason',
        'held_at',
    ];

    protected $casts = [
        'milestone_gmv' => 'decimal:2',
        'amount' => 'decimal:2',
        'needs_review' => 'boolean',
        'approved_at' => 'datetime',
        'paid_at' => 'datetime',
        'reversed_at' => 'datetime',
        'scheduled_payout_date' => 'date',
        'announced_at' => 'datetime',
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
