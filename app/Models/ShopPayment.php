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
