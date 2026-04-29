<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Dispute extends Model
{
    use HasFactory, HasUuids;

    protected $fillable = [
        'payment_id',
        'creator_id',
        'stripe_dispute_id',
        'amount',
        'currency',
        'reason',
        'status',
        'evidence_due_by',
        'evidence_status',
        'evidence_details',
        'customer_email',
        'has_response',
        'resolved_at',
    ];

    protected $casts = [
        'amount' => 'integer',
        'evidence_due_by' => 'datetime',
        'resolved_at' => 'datetime',
        'evidence_details' => 'array',
        'has_response' => 'boolean',
    ];
    
    public $timestamps = false; // Disable updated_at since migration doesn't have it

    public function creator()
    {
        return $this->belongsTo(User::class, 'creator_id', 'uuid');
    }

    public function payment()
    {
        return $this->belongsTo(Payment::class, 'payment_id', 'id');
    }
}
