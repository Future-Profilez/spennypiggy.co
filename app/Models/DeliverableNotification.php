<?php

namespace App\Models;

use Carbon\Carbon;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Str;

class DeliverableNotification extends Model
{
    use HasFactory;

    protected $fillable = [
        'uuid',
        'deliverable_id',
        'user_id',
        'notification_type',
        'channel',
        'subject',
        'message',
        'status',
        'sent_at',
        'metadata',
    ];

    protected $casts = [
        'sent_at' => 'datetime',
        'metadata' => 'array',
    ];

    protected $dates = [
        'sent_at',
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

    /**
     * Get the deliverable this notification is for
     */
    public function deliverable(): BelongsTo
    {
        return $this->belongsTo(Deliverable::class);
    }

    /**
     * Get the user who receives this notification
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Create a purchase confirmation notification
     */
    public static function createPurchaseConfirmation(Deliverable $deliverable): self
    {
        return self::create([
            'deliverable_id' => $deliverable->id,
            'user_id' => $deliverable->gifter_id,
            'notification_type' => 'purchase_confirmation',
            'channel' => 'email',
            'subject' => 'Purchase Confirmation - '.$deliverable->product_type_display,
            'message' => "Thank you for your purchase! Your {$deliverable->product_type_display} order has been confirmed.",
            'metadata' => [
                'transaction_id' => $deliverable->transaction_id,
                'product_type' => $deliverable->product_type,
            ],
        ]);
    }

    /**
     * Create a deliverable pending notification
     */
    public static function createDeliverablePending(Deliverable $deliverable): self
    {
        $timeRemaining = $deliverable->time_remaining ?? 'soon';

        return self::create([
            'deliverable_id' => $deliverable->id,
            'user_id' => $deliverable->gifter_id,
            'notification_type' => 'deliverable_pending',
            'channel' => 'email',
            'subject' => 'Your Order is Being Prepared',
            'message' => "Your {$deliverable->product_type_display} is being prepared by the creator. Expected delivery: {$timeRemaining}.",
            'metadata' => [
                'sla_deadline' => $deliverable->sla_deadline,
                'creator_name' => $deliverable->creator->name ?? 'Creator',
            ],
        ]);
    }

    /**
     * Create a deliverable delivered notification
     */
    public static function createDeliverableDelivered(Deliverable $deliverable): self
    {
        return self::create([
            'deliverable_id' => $deliverable->id,
            'user_id' => $deliverable->gifter_id,
            'notification_type' => 'deliverable_delivered',
            'channel' => 'email',
            'subject' => 'Your Order Has Been Delivered!',
            'message' => "Great news! Your {$deliverable->product_type_display} has been delivered and is ready for download.",
            'metadata' => [
                'deliverable_url' => $deliverable->deliverable_url,
                'receipt_url' => $deliverable->receipt_url,
            ],
        ]);
    }

    /**
     * Create an SLA warning notification for creator
     */
    public static function createSlaWarning(Deliverable $deliverable): self
    {
        $timeRemaining = $deliverable->time_remaining ?? 'soon';

        return self::create([
            'deliverable_id' => $deliverable->id,
            'user_id' => $deliverable->creator_id,
            'notification_type' => 'sla_warning',
            'channel' => 'email',
            'subject' => '⚠️ Deliverable Deadline Approaching',
            'message' => "You have a pending deliverable that needs to be uploaded within {$timeRemaining}. Please upload it to avoid penalties.",
            'metadata' => [
                'sla_deadline' => $deliverable->sla_deadline,
                'buyer_name' => $deliverable->gifter->name ?? 'Buyer',
            ],
        ]);
    }

    /**
     * Create an SLA violation notification for creator
     */
    public static function createSlaViolation(Deliverable $deliverable, SlaViolation $violation): self
    {
        return self::create([
            'deliverable_id' => $deliverable->id,
            'user_id' => $deliverable->creator_id,
            'notification_type' => 'sla_violation',
            'channel' => 'email',
            'subject' => '🚨 SLA Violation - Action Required',
            'message' => "You missed a deliverable deadline. {$violation->penalty_description} has been applied. Please upload the deliverable immediately.",
            'metadata' => [
                'violation_id' => $violation->id,
                'penalty' => $violation->penalty_applied,
                'penalty_end_date' => $violation->penalty_end_date,
            ],
        ]);
    }

    /**
     * Create a penalty applied notification
     */
    public static function createPenaltyApplied(SlaViolation $violation): self
    {
        return self::create([
            'deliverable_id' => $violation->deliverable_id,
            'user_id' => $violation->creator_id,
            'notification_type' => 'penalty_applied',
            'channel' => 'email',
            'subject' => 'Penalty Applied to Your Account',
            'message' => "Due to missed deliverable deadlines, a {$violation->penalty_description} has been applied to your account.",
            'metadata' => [
                'violation_id' => $violation->id,
                'penalty' => $violation->penalty_applied,
                'penalty_start_date' => $violation->penalty_start_date,
                'penalty_end_date' => $violation->penalty_end_date,
            ],
        ]);
    }

    /**
     * Mark notification as sent
     */
    public function markAsSent(): void
    {
        $this->update([
            'status' => 'sent',
            'sent_at' => Carbon::now(),
        ]);
    }

    /**
     * Mark notification as failed
     */
    public function markAsFailed(): void
    {
        $this->update([
            'status' => 'failed',
        ]);
    }

    /**
     * Get human-readable notification type
     */
    public function getNotificationTypeDisplayAttribute(): string
    {
        return match ($this->notification_type) {
            'purchase_confirmation' => 'Purchase Confirmation',
            'deliverable_pending' => 'Deliverable Pending',
            'deliverable_delivered' => 'Deliverable Delivered',
            'sla_warning' => 'SLA Warning',
            'sla_violation' => 'SLA Violation',
            'penalty_applied' => 'Penalty Applied',
            'refund_processed' => 'Refund Processed',
            default => ucfirst(str_replace('_', ' ', $this->notification_type))
        };
    }

    /**
     * Scope for pending notifications
     */
    public function scopePending($query)
    {
        return $query->where('status', 'pending');
    }

    /**
     * Scope for sent notifications
     */
    public function scopeSent($query)
    {
        return $query->where('status', 'sent');
    }

    /**
     * Scope for failed notifications
     */
    public function scopeFailed($query)
    {
        return $query->where('status', 'failed');
    }

    /**
     * Scope for user's notifications
     */
    public function scopeForUser($query, $userId)
    {
        return $query->where('user_id', $userId);
    }

    /**
     * Scope for notification type
     */
    public function scopeOfType($query, $type)
    {
        return $query->where('notification_type', $type);
    }
}
