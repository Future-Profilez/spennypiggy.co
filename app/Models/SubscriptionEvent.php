<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Ramsey\Uuid\Uuid;

class SubscriptionEvent extends Model
{
    use HasFactory;
    
    protected $fillable = [
        'uuid',
        'subscription_type',
        'subscription_id',
        'stripe_subscription_id',
        'stripe_event_id',
        'event_type',
        'event_status',
        'amount',
        'currency',
        'event_date',
        'event_data',
        'notes'
    ];
    
    protected $casts = [
        'event_data' => 'array',
        'event_date' => 'datetime',
        'amount' => 'decimal:2'
    ];
    
    public static function boot()
    {
        parent::boot();
        static::creating(fn($event) => $event->uuid = Uuid::uuid4());
    }
    
    // Get the related subscription record
    public function getSubscriptionAttribute()
    {
        switch ($this->subscription_type) {
            case 'wish_item':
                return WishItemSubscription::find($this->subscription_id);
            case 'membership':
                return MembershipPayment::find($this->subscription_id);
            case 'bill':
                return BillPayment::find($this->subscription_id);
            default:
                return null;
        }
    }
    
    // Scopes
    public function scopeForSubscription($query, $type, $id)
    {
        return $query->where('subscription_type', $type)->where('subscription_id', $id);
    }
    
    public function scopeByEventType($query, $eventType)
    {
        return $query->where('event_type', $eventType);
    }
    
    public function scopeSuccessful($query)
    {
        return $query->where('event_status', 'processed');
    }
    
    public function scopeRecent($query, $days = 30)
    {
        return $query->where('event_date', '>=', now()->subDays($days));
    }
    
    // Helper methods
    public static function logEvent($subscriptionType, $subscriptionId, $eventType, $data = [])
    {
        return static::create([
            'subscription_type' => $subscriptionType,
            'subscription_id' => $subscriptionId,
            'stripe_subscription_id' => $data['stripe_subscription_id'] ?? null,
            'stripe_event_id' => $data['stripe_event_id'] ?? null,
            'event_type' => $eventType,
            'event_status' => $data['status'] ?? 'processed',
            'amount' => $data['amount'] ?? null,
            'currency' => $data['currency'] ?? null,
            'event_date' => $data['event_date'] ?? now(),
            'event_data' => $data['event_data'] ?? null,
            'notes' => $data['notes'] ?? null
        ]);
    }
}
