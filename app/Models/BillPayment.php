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
        /*
         * 🚨 THESE TWO WERE EMITTED BY `Helpers::feeRateColumns()` AND DROPPED
         * SILENTLY ON EVERY WRITE until 12 Sep 2026, because they were never in
         * this list. Measured then: 0 of 225 rows populated across all four
         * payment tables.
         *
         * What it cost: `Helpers::storedFeeRates()` reads `stripe_fee_rate`,
         * finds null and falls back to `LEGACY_CARD_STRIPE_RATE` (2.9%) — while
         * the configured card estimate has been 3.4% since 11 Aug 2026. So every
         * card sale since then is RE-COST 0.5pp cheap, understating Stripe's cost
         * and overstating the platform's margin on the screens the platform reads
         * its own margin from. Nothing errors.
         *
         * ⚠️ SAFE TO MAKE FILLABLE ONLY BECAUSE THE RECOMPUTE RE-COSTS FROM THE
         * ROW'S OWN FROZEN RATES. `finance:sync-transactions` builds its
         * breakdown from `Helpers::storedFeeRates($payment)` — the SOURCE row's
         * stored values — so a historic row is written back with what it already
         * had, never with today's configured rate. If a recompute is ever changed
         * to read config directly, this becomes the way history gets restated.
         *
         * ⚠️ FORWARD ONLY, DELIBERATELY. Rows charged between 11 Aug and 12 Sep
         * 2026 keep the 2.9% fallback and stay 0.5pp understated. Backfilling
         * them would write recorded economics from an inference, which is the one
         * thing the fee columns exist to avoid; making them TRUE means reading
         * Stripe's own balance transactions, and that is a separate decision.
         */
        'stripe_fee_rate',
        'stripe_fixed_fee',
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
