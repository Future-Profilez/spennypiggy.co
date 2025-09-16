<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Str;
use Carbon\Carbon;

class Deliverable extends Model
{
    use HasFactory;

    protected $fillable = [
        'uuid',
        'transaction_id',
        'stripe_session_id',
        'buyer_id',
        'creator_id',
        'product_type',
        'product_id',
        'deliverable_url',
        'receipt_url',
        'certificate_url',
        'status',
        'sla_deadline',
        'sla_status',
        'delivered_at',
        'metadata'
    ];

    protected $casts = [
        'sla_deadline' => 'datetime',
        'delivered_at' => 'datetime',
        'metadata' => 'array'
    ];

    protected $dates = [
        'sla_deadline',
        'delivered_at'
    ];

    protected static function boot()
    {
        parent::boot();
        
        static::creating(function ($model) {
            if (empty($model->uuid)) {
                $model->uuid = (string) Str::uuid();
            }
            
            // Set SLA deadline based on product type
            if (empty($model->sla_deadline)) {
                $model->sla_deadline = $model->calculateSlaDeadline();
            }
        });
    }

    /**
     * Get the buyer who purchased this deliverable
     */
    public function buyer(): BelongsTo
    {
        return $this->belongsTo(User::class, 'buyer_id');
    }

    /**
     * Get the creator responsible for this deliverable
     */
    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'creator_id');
    }

    /**
     * Get all SLA violations for this deliverable
     */
    public function slaViolations(): HasMany
    {
        return $this->hasMany(SlaViolation::class);
    }

    /**
     * Get all notifications for this deliverable
     */
    public function notifications(): HasMany
    {
        return $this->hasMany(DeliverableNotification::class);
    }

    /**
     * Calculate SLA deadline based on product type
     */
    public function calculateSlaDeadline(): Carbon
    {
        $now = Carbon::now();
        
        return match ($this->product_type) {
            'piggy_bank', 'membership', 'wish_subscription' => $now, // Instant (0h)
            'bill_subscription' => $now->addDay(), // 1 day
            'wish', 'shop_item' => $now->addHours(12), // 0.5 day (12 hours)
            default => $now->addDay()
        };
    }

    /**
     * Check if deliverable is overdue
     */
    public function isOverdue(): bool
    {
        return $this->sla_deadline && 
               Carbon::now()->isAfter($this->sla_deadline) && 
               $this->status !== 'delivered';
    }

    /**
     * Check if deliverable is approaching deadline (within 2 hours)
     */
    public function isApproachingDeadline(): bool
    {
        return $this->sla_deadline && 
               Carbon::now()->addHours(2)->isAfter($this->sla_deadline) && 
               $this->status !== 'delivered';
    }

    /**
     * Mark deliverable as delivered
     */
    public function markAsDelivered(string $deliverableUrl = null, string $receiptUrl = null): void
    {
        $this->update([
            'status' => 'delivered',
            'sla_status' => $this->isOverdue() ? 'late' : 'on_time',
            'delivered_at' => Carbon::now(),
            'deliverable_url' => $deliverableUrl ?? $this->deliverable_url,
            'receipt_url' => $receiptUrl ?? $this->receipt_url
        ]);
    }

    /**
     * Mark deliverable as late
     */
    public function markAsLate(): void
    {
        $this->update([
            'status' => 'late',
            'sla_status' => 'late'
        ]);
    }

    /**
     * Mark deliverable as escalated
     */
    public function markAsEscalated(): void
    {
        $this->update([
            'status' => 'escalated',
            'sla_status' => 'escalated'
        ]);
    }

    /**
     * Revoke deliverable (for refunds)
     */
    public function revoke(): void
    {
        $this->update([
            'status' => 'revoked'
        ]);
    }

    /**
     * Get human-readable product type
     */
    public function getProductTypeDisplayAttribute(): string
    {
        return match ($this->product_type) {
            'piggy_bank' => 'Piggy Bank',
            'membership' => 'Membership',
            'wish_subscription' => 'Wish Subscription',
            'bill_subscription' => 'Bill Subscription',
            'wish' => 'Wish',
            'shop_item' => 'Shop Item',
            default => ucfirst(str_replace('_', ' ', $this->product_type))
        };
    }

    /**
     * Get time remaining until SLA deadline
     */
    public function getTimeRemainingAttribute(): ?string
    {
        if (!$this->sla_deadline || $this->status === 'delivered') {
            return null;
        }

        $now = Carbon::now();
        if ($now->isAfter($this->sla_deadline)) {
            return 'Overdue';
        }

        return $now->diffForHumans($this->sla_deadline, true);
    }

    /**
     * Scope for pending deliverables
     */
    public function scopePending($query)
    {
        return $query->where('status', 'pending');
    }

    /**
     * Scope for overdue deliverables
     */
    public function scopeOverdue($query)
    {
        return $query->where('status', '!=', 'delivered')
                    ->where('sla_deadline', '<', Carbon::now());
    }

    /**
     * Scope for deliverables approaching deadline
     */
    public function scopeApproachingDeadline($query)
    {
        return $query->where('status', '!=', 'delivered')
                    ->where('sla_deadline', '>', Carbon::now())
                    ->where('sla_deadline', '<=', Carbon::now()->addHours(2));
    }

    /**
     * Scope for creator's deliverables
     */
    public function scopeForCreator($query, $creatorId)
    {
        return $query->where('creator_id', $creatorId);
    }

    /**
     * Scope for buyer's deliverables
     */
    public function scopeForBuyer($query, $buyerId)
    {
        return $query->where('buyer_id', $buyerId);
    }
}