<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Facades\Auth;
use Ramsey\Uuid\Uuid;

class ShopPayment extends Model
{
    use HasFactory, SoftDeletes;

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
        'fee_profile',
        'uuid',
        'session_id',
        'amount',
        'total_paid',
        'tax_amount',
        'vat_tax_amount',
        'shipping_amount',
        'currency',
        'shop_id',
        'user_id',
        'name',
        'email',
        'message',
        'anonymous',
        'answer',
        'payment_status',
        'twitter_response',
        'quantity',
        'shipping_info',
        'digital_waiver_confirmed_at',
        'digital_waiver_text',
        'creator_note',
    ];

    protected $hidden = [
        'id',
        'user_id',
        'shop_id',
        'updated_at',
        'deleted_at',
    ];

    protected $appends = [
        'sender',
    ];

    public static function boot()
    {
        parent::boot();
        static::creating(fn ($w) => $w->uuid = Uuid::uuid4());
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

    public function getResolvedTotalPaidAmount(): float
    {
        $totalPaid = (float) ($this->total_paid ?? 0);
        if ($totalPaid > 0) {
            return round($totalPaid, 2);
        }

        $baseAmount = (float) ($this->amount ?? 0);
        $shippingAmount = (float) ($this->shipping_amount ?? 0);
        $vatAmount = (float) ($this->vat_tax_amount ?? 0);
        $taxAmount = (float) ($this->tax_amount ?? 0);

        return round($baseAmount + $shippingAmount + $vatAmount + $taxAmount, 2);
    }

    public function user()
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    public function shop()
    {
        return $this->belongsTo(Shop::class, 'shop_id');
    }

    public function deliverable()
    {
        return $this->hasOne(Deliverable::class, 'session_id', 'session_id');
    }

    public function financialTransaction()
    {
        return $this->morphOne(FinancialTransaction::class, 'source');
    }
}
