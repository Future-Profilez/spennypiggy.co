<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Dispute extends Model
{
    protected $table = 'disputes';

    protected $keyType = 'string';

    public $incrementing = false;

    protected $fillable = [
        'id',
        'payment_id',
        'creator_id',
        'stripe_dispute_id',
        // Stripe's own references, stored even when the Payment row does not
        // exist yet — a dispute event can arrive before the payment is recorded,
        // and without these the evidence pack has nothing to resolve against.
        'stripe_payment_intent_id',
        'stripe_charge_id',
        'amount',
        'currency',
        'reason',
        'status',
        'created_at',
        'resolved_at',
        'evidence_due_by',
        'evidence_status',
        'evidence_details',
        'customer_email',
        'has_response',
    ];

    protected $casts = [
        'amount' => 'integer',
        'has_response' => 'boolean',
        'evidence_due_by' => 'datetime',
        'resolved_at' => 'datetime',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    public function payment(): BelongsTo
    {
        return $this->belongsTo(Payment::class, 'payment_id', 'id');
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'creator_id', 'uuid');
    }
}
