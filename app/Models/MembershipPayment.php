<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Facades\Auth;
use Ramsey\Uuid\Uuid;

class MembershipPayment extends Model
{
    use \App\Models\Concerns\RecurringPaymentState, HasFactory, SoftDeletes;

    protected $fillable = [
        'uuid',
        'stripe_id',
        'session_id',
        'iban',
        'sort_code',
        'membership_id',
        'user_id',
        'guest_email',
        'guest_name',
        'currency',
        'amount',
        'total_paid',
        'tax',
        'vat_tax_amount',
        'recurring_for',
        'recurring_type',
        'payment_method',
        'message',
        'anonymous',
        'end',
        'upcoming_payment',
        'current_period_start',
        'current_period_end',
        'stripe_status',
        'cancel_at_period_end',
        'renewal_reminded_for',
        'status',
        'twitter_response',
        'payout_at',
        'creator_currency',
        'charge_currency',
        'display_currency',
        'stripe_fee_actual',
        'stripe_fee_expected',
        'supporter_country',
        'card_country',
        'fee_variance',
        'digital_waiver_confirmed_at',
        'digital_waiver_text',
    ];

    protected $appends = [
        'sender',
    ];

    protected $casts = [
        'current_period_start' => 'datetime',
        'current_period_end' => 'datetime',
        'cancel_at_period_end' => 'boolean',
    ];

    public static function boot()
    {
        parent::boot();
        static::creating(fn ($w) => $w->uuid = Uuid::uuid4());
    }

    public function membership()
    {
        return $this->belongsTo(Membership::class);
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function deliverables()
    {
        return $this->hasMany(Deliverable::class, 'gifter_id', 'user_id')
            ->where('product_type', 'membership')
            ->whereRaw('JSON_EXTRACT(metadata, "$.membership_id") = ?', [$this->membership_id]);
    }

    public function getSenderAttribute()
    {
        $sender = false;
        if (isset($this->user_id)) {
            if (Auth::check() && $this->user_id == Auth::id()) {
                $sender = true;
            }
        }

        return $sender;
    }
}
