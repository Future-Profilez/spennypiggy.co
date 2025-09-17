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
        'price_id',
        'creator_id',
        'gifter_id',
        'payment_intent_id',
        'session_id',
        'deliverable_type',
        'deliverable_url',
        'metadata',
        'status',
        'delivered_at',
    ];

    protected $casts = [
        'delivered_at' => 'datetime',
        'metadata' => 'array'
    ];

    protected $dates = [
        'delivered_at'
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

    // Deliverable types enum
    const DELIVERABLE_TYPES = [
        'digital_file',
        'pdf_receipt',
        'badge',
        'cert',
        'access',
        'post',
        'media_bundle',
        'content_file'
    ];

    // Status enum
    const STATUSES = [
        'pending',
        'delivered',
        'failed'
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
}