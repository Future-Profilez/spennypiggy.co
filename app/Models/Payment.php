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

        // Try PiggyPotContribution
        if ($this->stripe_session_id) {
            $piggy = \App\Models\PiggyPotContribution::where('session_id', $this->stripe_session_id)->first();
            if ($piggy && $piggy->user_id) {
                $user = \App\Models\User::find($piggy->user_id);
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

    public function getPurchaseDetails(): array
    {
        /*
        |--------------------------------------------------------------------------
        | DELIVERABLE
        |--------------------------------------------------------------------------
        */

        $deliverable = Deliverable::query()
            ->when(
                $this->stripe_session_id,
                fn($q) => $q->where('session_id', $this->stripe_session_id)
            )
            ->when(
                !$this->stripe_session_id && $this->stripe_payment_intent_id,
                fn($q) => $q->where(
                    'payment_intent_id',
                    $this->stripe_payment_intent_id
                )
            )
            ->first();

        if ($deliverable) {

            return [
                'activity_type' => 'deliverable_purchase',
                'item_id' => $deliverable->id,
                'item_name' => $deliverable->name,
                'item_image' => $deliverable->perma_link,
                'creator_id' => $deliverable->creator_id,
                'creator_name' => optional($deliverable->creator)->name,
                'amount' => $this->amount,
                'currency' => $this->currency,
                'status' => $this->status,
                'paid_at' => $this->created_at?->toIso8601String(),
                'payment_method' => 'stripe',
            ];
        }

        /*
        |--------------------------------------------------------------------------
        | TASK
        |--------------------------------------------------------------------------
        */

        $task = TaskPurchase::where(
            'stripe_session_id',
            $this->stripe_session_id
        )->first();

        if ($task) {

            return [
                'activity_type' => 'task_purchase',
                'item_id' => $task->task_id,
                'item_name' => optional($task->task)->title,
                'creator_id' => $task->creator_id,
                'creator_name' => optional($task->creator)->name,
                'amount' => $this->amount,
                'currency' => $this->currency,
                'status' => $this->status,
                'paid_at' => $this->created_at?->toIso8601String(),
                'payment_method' => 'stripe',
            ];
        }

        /*
        |--------------------------------------------------------------------------
        | PIGGY POT
        |--------------------------------------------------------------------------
        */

        $piggy = PiggyPotContribution::where(
            'session_id',
            $this->stripe_session_id
        )->first();

        if ($piggy) {

            return [
                'activity_type' => 'piggy_pot_contribution',
                'item_id' => $piggy->piggy_pot_id,
                'item_name' => optional($piggy->piggyPot)->title,
                'creator_id' => $piggy->piggyPot?->creator_id,
                'creator_name' => optional($piggy->piggyPot?->creator)->name,
                'amount' => $this->amount,
                'currency' => $this->currency,
                'status' => $this->status,
                'paid_at' => $this->created_at?->toIso8601String(),
                'payment_method' => 'stripe',
                'contribution_id' => $piggy->id,
            ];
        }

        // Fallback to generic payment
        $gifter = $this->getGifter();
        return [
            'activity_type' => 'payment',
            'gifter_id' => $gifter?->id,
            'gifter_name' => $gifter?->name,
            'creator_id' => $this->creator_id,
            'creator_name' => optional($this->creator)->name,
            'amount' => $this->amount,
            'currency' => strtoupper($this->currency ?? 'GBP'),
            'status' => $this->status,
            'paid_at' => $this->created_at?->toIso8601String(),
            'payment_method' => 'stripe',
            'stripe_session_id' => $this->stripe_session_id,
            'stripe_payment_intent_id' => $this->stripe_payment_intent_id,
            'reserve_amount' => $this->reserve_amount_minor,
            'platform_holds_funds' => $this->platform_holds_funds,
        ];
    }
}
