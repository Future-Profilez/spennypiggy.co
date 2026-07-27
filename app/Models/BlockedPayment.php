<?php

namespace App\Models;

use Carbon\Carbon;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;

class BlockedPayment extends Model
{
    use HasFactory;

    protected $fillable = [
        'uuid',
        'creator_id',
        'payer_id',
        'amount',
        'currency',
        'payment_type',
        'payment_method',
        'blocked_reason',
        'activity_data',
        'payer_info',
        'payment_metadata',
        'ip_address',
        'user_agent',
        'blocked_at',
    ];

    protected $casts = [
        'activity_data' => 'array',
        'payer_info' => 'array',
        'payment_metadata' => 'array',
        'blocked_at' => 'datetime',
        'amount' => 'decimal:2',
    ];

    protected $dates = [
        'blocked_at',
        'created_at',
        'updated_at',
    ];

    /**
     * Boot the model
     */
    protected static function boot()
    {
        parent::boot();

        static::creating(function ($model) {
            if (empty($model->uuid)) {
                $model->uuid = (string) Str::uuid();
            }
            if (empty($model->blocked_at)) {
                $model->blocked_at = now();
            }
        });
    }

    /**
     * Relationships
     */
    public function creator()
    {
        return $this->belongsTo(User::class, 'creator_id');
    }

    public function payer()
    {
        return $this->belongsTo(User::class, 'payer_id');
    }

    /**
     * Scopes
     */
    public function scopeRecent($query, $days = 30)
    {
        return $query->where('blocked_at', '>=', Carbon::now()->subDays($days));
    }

    public function scopeForCreator($query, $creatorId)
    {
        return $query->where('creator_id', $creatorId);
    }

    public function scopeByPaymentType($query, $type)
    {
        return $query->where('payment_type', $type);
    }

    public function scopeByBlockedReason($query, $reason)
    {
        return $query->where('blocked_reason', $reason);
    }

    /**
     * Static helper methods
     */
    public static function logBlockedPayment(array $data)
    {
        return self::create([
            'creator_id' => $data['creator_id'],
            'payer_id' => $data['payer_id'] ?? null,
            'amount' => $data['amount'],
            'currency' => $data['currency'] ?? 'USD',
            'payment_type' => $data['payment_type'],
            'payment_method' => $data['payment_method'] ?? 'stripe',
            'blocked_reason' => $data['blocked_reason'],
            'activity_data' => $data['activity_data'] ?? null,
            'payer_info' => $data['payer_info'] ?? null,
            'payment_metadata' => $data['payment_metadata'] ?? null,
            'ip_address' => $data['ip_address'] ?? request()->ip(),
            'user_agent' => $data['user_agent'] ?? request()->userAgent(),
        ]);
    }

    /**
     * Get formatted amount with currency
     */
    public function getFormattedAmountAttribute()
    {
        return $this->currency.' '.number_format((float) $this->amount, 2, '.', '');
    }

    /**
     * Get human readable time since blocked
     */
    public function getTimeAgoAttribute()
    {
        return $this->blocked_at->diffForHumans();
    }
}
