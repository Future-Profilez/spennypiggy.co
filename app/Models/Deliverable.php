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
        'product_id',
        'item_id', // NEW: Database wish item ID
        'order_id', // Linked to task_purchases
        'price_id',
        'creator_id',
        'gifter_id',
        'payment_intent_id',
        'session_id',
        'deliverable_type',
        'product_type',
        'transaction_amount',
        'deliverable_url',
        'certificate_url',
        'metadata',
        'status',
        'sla_hours',
        'due_at',
        'refund_eligible',
        'is_deliverable', // NEW: Flag for admin interface
        'delivered_at',
        'accessed_at',
        'access_count',
        'customer_email',
        'customer_name',
        'payment_status',
        'payment_type',
        'payment_currency',
        'anonymous',
        'message',
        'digital_waiver_confirmed_at',
        'digital_waiver_text',
        'tracking_id',
        'courier_name',
        'expected_delivery_date',
        'shipped_at',
    ];

    protected $casts = [
        'delivered_at' => 'datetime',
        'accessed_at' => 'datetime',
        'metadata' => 'array',
        'transaction_amount' => 'decimal:2',
        'access_count' => 'integer'
    ];

    protected $dates = [
        'delivered_at',
        'accessed_at'
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
     * Get the gifter who purchased this deliverable
     */
    public function gifter(): BelongsTo
    {
        return $this->belongsTo(User::class, 'gifter_id');
    }

    /**
     * Get the creator responsible for this deliverable
     */
    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'creator_id');
    }
    
    /**
     * Get the wish item this deliverable is for
     */
    public function wishItem(): BelongsTo
    {
        return $this->belongsTo(WishItem::class, 'item_id');
    }
    
    /**
     * Get the membership this deliverable is for
     */
    public function membership(): BelongsTo
    {
        return $this->belongsTo(Membership::class, 'item_id');
    }
    
    /**
     * Get the bill this deliverable is for
     */
    public function bill(): BelongsTo
    {
        return $this->belongsTo(Bills::class, 'item_id');
    }

    /**
     * Get the task this deliverable is for
     */
    public function task(): BelongsTo
    {
        return $this->belongsTo(Task::class, 'item_id');
    }

    /**
     * Get the shop item this deliverable is for
     */
    public function shop(): BelongsTo
    {
        return $this->belongsTo(Shop::class, 'item_id');
    }

    /**
     * Get the purchase/order this deliverable is for
     */
    public function purchase(): BelongsTo
    {
        return $this->belongsTo(TaskPurchase::class, 'order_id');
    }
    
    /**
     * Get the item based on product_type
     * 
     * @return mixed
     */
    public function getItemByType()
    {
        switch ($this->product_type) {
            case 'wish':
                return $this->wishItem;
            case 'bill':
                return $this->bill;
            case 'membership':
                return $this->membership;
            case 'task':
                return $this->task;
            case 'shop_item':
                return $this->belongsTo(Shop::class, 'item_id')->first();
            default:
                return null;
        }
    }

    // Deliverable types enum
    const DELIVERABLE_TYPES = [
        'digital_file',
        'pdf_receipt',
        'badge',
        'cert',
        'access',
        'post',
        'media_bundle',
        'email',
        'shipping',
        'platform_access',
        'content_file'
    ];

    // Status enum
    const STATUSES = [
        'pending',
        'processing',
        'shipped',
        'delivered',
        'failed',
        'refunded'
    ];

    /**
     * Mark deliverable as delivered
     */
    public function markAsDelivered(string $deliverableUrl = null): void
    {
        $this->update([
            'status' => 'delivered',
            'delivered_at' => Carbon::now(),
            'deliverable_url' => $deliverableUrl ?? $this->deliverable_url,
        ]);
    }

    /**
     * Mark deliverable as failed
     */
    public function markAsFailed(): void
    {
        $this->update([
            'status' => 'failed'
        ]);
    }

    /**
     * Check if deliverable is for wish items
     */
    public function isWishItem(): bool
    {
        return $this->deliverable_type === 'media_bundle';
    }

    /**
     * Get metadata value by key
     */
    public function getMetadataValue($key, $default = null)
    {
        return $this->metadata[$key] ?? $default;
    }

    /**
     * Get metadata as object
     */
    public function getMetadataJsonAttribute()
    {
        return (object) ($this->metadata ?? []);
    }

    /**
     * Get human-readable deliverable type
     */
    public function getDeliverableTypeDisplayAttribute(): string
    {
        return match ($this->deliverable_type) {
            'digital_file' => 'Digital File',
            'pdf_receipt' => 'PDF Receipt',
            'badge' => 'Badge',
            'cert' => 'Certificate',
            'access' => 'Access',
            'post' => 'Post',
            'media_bundle' => 'Media Bundle',
            'content_file' => 'Content File',
            default => ucfirst(str_replace('_', ' ', $this->deliverable_type))
        };
    }

    /**
     * Scope for pending deliverables
     */
    public function scopePending($query)
    {
        return $query->where('status', 'pending');
    }

    /**
     * Scope for delivered deliverables
     */
    public function scopeDelivered($query)
    {
        return $query->where('status', 'delivered');
    }

    /**
     * Scope for failed deliverables
     */
    public function scopeFailed($query)
    {
        return $query->where('status', 'failed');
    }

    /**
     * Scope for specific deliverable type
     */
    public function scopeOfType($query, $type)
    {
        return $query->where('deliverable_type', $type);
    }

    /**
     * Scope for creator's deliverables
     */
    public function scopeForCreator($query, $creatorId)
    {
        return $query->where('creator_id', $creatorId);
    }

    /**
     * Scope for gifter's deliverables
     */
    public function scopeForGifter($query, $gifterId)
    {
        return $query->where('gifter_id', $gifterId);
    }
    
    /**
     * Scope for specific wish item deliverables
     */
    public function scopeForWishItem($query, $wishItemId)
    {
        return $query->where('item_id', $wishItemId);
    }
    
    /**
     * Scope for deliverable items only
     */
    public function scopeDeliverableItems($query)
    {
        return $query->where('is_deliverable', true);
    }
    
    /**
     * Mark as deliverable item
     */
    public function markAsDeliverableItem(): void
    {
        $this->update(['is_deliverable' => true]);
    }
    
    /**
     * Mark as non-deliverable item
     */
    public function markAsNonDeliverableItem(): void
    {
        $this->update(['is_deliverable' => false]);
    }
}