<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Payment extends Model
{
    use HasFactory, HasUuids;

    protected $fillable = [
        'creator_id',
        'risk_identity_id',
        'amount',
        'reserve_amount_minor',
        'platform_holds_funds',
        'stripe_transfer_id',
        'currency',
        'stripe_session_id',
        'stripe_payment_intent_id',
        'status',
        'confirmation_log_id',
        'reason_codes',
        'payout_run_id',
        'adjustment_payout_run_id',
    ];

    protected $casts = [
        'reason_codes' => 'array',
        'amount' => 'integer',
        'reserve_amount_minor' => 'integer',
        'platform_holds_funds' => 'boolean',
        'payout_run_id' => 'string',
        'adjustment_payout_run_id' => 'string',
    ];

    public function riskIdentity()
    {
        return $this->belongsTo(RiskIdentity::class);
    }
    
    public function creator()
    {
        return $this->belongsTo(User::class, 'creator_id', 'uuid'); // Assuming User has uuid column
    }

    public function confirmationLog()
    {
        return $this->belongsTo(ConfirmationLog::class);
    }

    /**
     * Attempt to find the user (gifter) who made this payment
     * by matching the Stripe Session or Payment Intent ID across various purchase tables.
     */
    public function getGifter()
    {
        if (!$this->stripe_payment_intent_id && !$this->stripe_session_id) {
            return null;
        }

        // Try UserPayment
        $userPaymentQuery = \App\Models\UserPayment::query();
        if ($this->stripe_payment_intent_id) {
            $userPaymentQuery->where('payment_details', 'LIKE', '%' . $this->stripe_payment_intent_id . '%');
        } elseif ($this->stripe_session_id) {
            $userPaymentQuery->where('payment_details', 'LIKE', '%' . $this->stripe_session_id . '%');
        }
        $userPayment = $userPaymentQuery->first();
        
        if ($userPayment && $userPayment->from_user_id) {
            $user = \App\Models\User::find($userPayment->from_user_id);
            if ($user) return $user;
        }

        // Try TipGoalsPayment
        if ($this->stripe_session_id) {
            $tip = \App\Models\TipGoalsPayment::where('session_id', $this->stripe_session_id)->first();
            if ($tip && $tip->user_id) {
                $user = \App\Models\User::find($tip->user_id);
                if ($user) return $user;
            }
        }

        // Try TaskPurchase
        $taskPurchaseQuery = \App\Models\TaskPurchase::query();
        if ($this->stripe_session_id) {
            $taskPurchaseQuery->where('stripe_session_id', $this->stripe_session_id);
        } elseif ($this->stripe_payment_intent_id) {
            $taskPurchaseQuery->where('payment_intent_id', $this->stripe_payment_intent_id);
        }
        $taskPurchase = $taskPurchaseQuery->first();

        if ($taskPurchase && $taskPurchase->supporter_id) {
            $user = \App\Models\User::find($taskPurchase->supporter_id);
            if ($user) return $user;
        }
        
        // Try Deliverable
        $deliverableQuery = \App\Models\Deliverable::query();
        if ($this->stripe_session_id) {
            $deliverableQuery->where('session_id', $this->stripe_session_id);
        } elseif ($this->stripe_payment_intent_id) {
            $deliverableQuery->where('payment_intent_id', $this->stripe_payment_intent_id);
        }
        $deliverable = $deliverableQuery->first();

        if ($deliverable && $deliverable->purchaser_id) {
            $user = \App\Models\User::find($deliverable->purchaser_id);
            if ($user) return $user;
        }

        return null;
    }
}
