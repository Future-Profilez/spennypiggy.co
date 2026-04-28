<?php

namespace App\Models;

use Carbon\Carbon;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Ramsey\Uuid\Uuid;

class WishItemSubscription extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable =   [
        'uuid',
        'stripe_id',
        'session_id',
        'wish_item_id',
        'user_id',
        'guest_name',
        'guest_email',
        'currency',
        'amount',
        'tax',
        'vat_tax_amount',
        'recurring_for',
        'recurring_type',
        'payment_method',
        'surprise_message',
        'anonymous',
        'digital_waiver_confirmed_at',
        'digital_waiver_text',
        'end',
        'upcoming_payment',
        'twitter_response',
        'status',
        // New Stripe subscription fields
        'stripe_status',
        'cancel_at_period_end',
        'current_period_start',
        'current_period_end',
        'canceled_at',
        'ended_at',
        'stripe_metadata',
        'payment_method_id',
        'trial_start',
        'trial_end',
    ];

    protected $hidden   =   [
        'session_id',
        'wish_item_id',
        'user_id',
        'upcoming_payment',
        'created_at',
        'updated_at',
        'deleted_at'
    ];

    protected $appends = [
        'start_date',
        'payment_upcoming'
    ];

    protected $casts = [
        'end'   =>  'datetime',
        'upcoming_payment'  =>  'datetime',
        'current_period_start' => 'datetime',
        'current_period_end' => 'datetime',
        'canceled_at' => 'datetime',
        'ended_at' => 'datetime',
        'trial_start' => 'datetime',
        'trial_end' => 'datetime',
        'stripe_metadata' => 'array',
        'cancel_at_period_end' => 'boolean'
    ];

    public static function boot()
    {
        parent::boot();
        static::creating(fn($s) =>  $s->uuid = Uuid::uuid4());
    }

    // public function wish_item()
    // {
    //     return $this->belongsTo(WishItem::class);
    // }
    public function wish_item()
    {
        return $this->belongsTo(WishItem::class, 'wish_item_id');
    }

    public function user()
    {
        return $this->belongsTo(User::class, 'user_id');
    }


    public function getStartDateAttribute()
    {
        return Carbon::createFromFormat('Y-m-d H:i:s', $this->created_at)->isoFormat('DD MMM YYYY');
    }

    public function getPaymentUpcomingAttribute()
    {
        if (!empty($this->upcoming_payment)) {
            return Carbon::createFromFormat('Y-m-d H:i:s', $this->upcoming_payment)->isoFormat('DD MMM YYYY');
        }

        return false;
    }
    
    // Relationship with subscription events
    public function events()
    {
        return $this->hasMany(SubscriptionEvent::class, 'subscription_id')
                    ->where('subscription_type', 'wish_item')
                    ->orderBy('event_date', 'desc');
    }
    
    // Helper methods for subscription status
    public function isActive()
    {
        if ($this->recurring_for === 'onetime') {
            // One-time subscriptions are active for 30 days from creation
            return $this->created_at->greaterThan(Carbon::now()->subDays(30));
        }
        
        // Recurring subscriptions check Stripe status and period end
        return $this->stripe_status === 'active' && 
               $this->current_period_end && 
               $this->current_period_end->greaterThan(Carbon::now());
    }
    
    public function isCanceling()
    {
        return $this->cancel_at_period_end && $this->stripe_status === 'active';
    }
    
    public function canBeCanceled()
    {
        return $this->recurring_for !== 'onetime' && 
               $this->stripe_status === 'active' && 
               !$this->cancel_at_period_end;
    }
    
    public function getNextPaymentDate()
    {
        if ($this->cancel_at_period_end) {
            return $this->current_period_end;
        }
        
        // For one-time subscriptions, return null as they don't have next payments
        if ($this->recurring_for === 'onetime') {
            return null;
        }
        
        return $this->upcoming_payment ?: $this->current_period_end;
    }
    
    // Scope for active subscriptions
    public function scopeActive($query)
    {
        return $query->where(function ($q) {
            $q->where(function ($subQ) {
                // One-time subscriptions active for 30 days
                $subQ->where('recurring_for', 'onetime')
                     ->where('created_at', '>=', Carbon::now()->subDays(30))
                     ->where('status', 'paid');
            })->orWhere(function ($subQ) {
                // Recurring subscriptions with active Stripe status
                $subQ->where('recurring_for', 'continue')
                     ->where('stripe_status', 'active')
                     ->where('status', 'paid')
                     ->where(function ($periodQ) {
                         // Check current_period_end if available, otherwise use upcoming_payment
                         $periodQ->where('current_period_end', '>=', Carbon::now())
                                 ->orWhere(function($fallbackQ) {
                                     $fallbackQ->whereNull('current_period_end')
                                              ->where('upcoming_payment', '>=', Carbon::now());
                                 });
                     });
            });
        });
    }
    
    // Scope for subscriptions that can be canceled
    public function scopeCancelable($query)
    {
        return $query->where('recurring_for', 'continue')
                     ->where('stripe_status', 'active')
                     ->where('cancel_at_period_end', false);
    }
    
    // Log subscription event
    public function logEvent($eventType, $data = [])
    {
        return SubscriptionEvent::logEvent('wish_item', $this->id, $eventType, array_merge([
            'stripe_subscription_id' => $this->stripe_id,
            'amount' => $this->amount,
            'currency' => $this->currency
        ], $data));
    }
}
