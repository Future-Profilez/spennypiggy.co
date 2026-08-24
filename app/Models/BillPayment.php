<?php

namespace App\Models;

use App\Models\Concerns\RecurringPaymentState;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Facades\Auth;
use Ramsey\Uuid\Uuid;

class BillPayment extends Model
{
    use HasFactory, RecurringPaymentState, SoftDeletes;

    protected $fillable = [
        // Discovery Phase 1 — the source that earned this sale, read back by
        // finance:sync-transactions when it writes the ledger row (no browser,
        // no Stripe event metadata in that worker). Class is derived, never stored.
        'discovery_source',
        'platform_fee_rate',
        'compliance_fee_rate',
        'fee_source',
        'fee_override_id',
        'uuid',
        'stripe_id',
        'session_id',
        'user_id',
        'bills_id',
        'guest_name',
        'guest_email',
        'amount',
        'total_paid',
        'currency',
        'recurring_for',
        'tax',
        'vat_tax_amount',
        'recurring_type',
        'message',
        'anonymous',
        'status',
        'twitter_response',
        'end',
        'upcoming_payment',
        'current_period_start',
        'current_period_end',
        'stripe_status',
        'cancel_at_period_end',
        'renewal_reminded_for',
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

    public function user()
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    public function bill()
    {
        return $this->belongsTo(Bills::class, 'bills_id');
    }

    public function creator()
    {
        return $this->hasOneThrough(User::class, Bills::class, 'id', 'id', 'bills_id', 'user_id');
    }

    public function scopePaid($query)
    {
        return $query->where('status', 'paid');
    }

    public function scopePending($query)
    {
        return $query->where('status', 'pending');
    }

    public function scopeThisMonth($query)
    {
        return $query->whereMonth('created_at', now()->month)
            ->whereYear('created_at', now()->year);
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
