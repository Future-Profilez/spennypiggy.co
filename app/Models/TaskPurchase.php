<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Str;

class TaskPurchase extends Model
{
    use HasFactory, SoftDeletes;

    // Status constants for clarity and consistency
    const TASK_STATUSES = [
        'initiated',
        'paid', 
        'delivered', 
        'assigned', 
        'pending_review', 
        'completed_accepted', 
        'paid_out',
        'expired',
        'rejected_once', 
        'escalated', 
        'sla_missed', 
        'refunded',
        'completed' // Added for instant tasks
    ];

    protected $fillable = [
        'uuid',
        'task_id',
        'supporter_id',
        'creator_id',
        'stripe_session_id',
        'payment_intent_id',
        'charge_id',
        'transfer_id',
        'refund_id',
        'amount',
        'currency',
        'status',
        'payment_type',
        'proof_content',
        'rejection_reason',
        'sla_deadline',
        'reviewed_at',
        'completed_at',
        'admin_fee',
        'platform_fee',
        'vat_amount',
        'transfer_amount',
        'dispute_status',
        'rejection_count',
        'refund_status',
        'refunded_at',
        'gifter_message',
        'last_reminder_at',
    ];

    protected $casts = [
        'sla_deadline' => 'datetime',
        'reviewed_at' => 'datetime',
        'completed_at' => 'datetime',
        'refunded_at' => 'datetime',
        'last_reminder_at' => 'datetime',
        'proof_content' => 'array', // Cast JSON proof to array
    ];

    protected static function boot()
    {
        parent::boot();
        
        static::creating(function ($model) {
            if (empty($model->uuid)) {
                $model->uuid = (string) Str::uuid();
            }
        });
    }

    public function task()
    {
        return $this->belongsTo(Task::class);
    }

    public function supporter()
    {
        return $this->belongsTo(User::class, 'supporter_id');
    }

    public function creator()
    {
        return $this->belongsTo(User::class, 'creator_id');
    }
}
