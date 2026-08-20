<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class RyeProductPayment extends Model
{
    use HasFactory, HasUuids;

    public function uniqueIds()
    {
        return ['uuid'];
    }

    protected $fillable = [
        // Discovery Phase 1 — the source that earned this sale, read back by
        // finance:sync-transactions when it writes the ledger row (no browser,
        // no Stripe event metadata in that worker). Class is derived, never stored.
        'discovery_source',
        'user_id',
        'currency',
        'amount',
        'total_paid',
        'tax',
        'message',
        'anonymous',
        'status',
        'payment_method',
        'customer_email',
        'stripe_payment_intent_id',
        'stripe_charge_id',
        'stripe_payment_intent_client_secret',
        'stripe_payment_intent_status',
        'stripe_payment_intent_last_payment_error',
        'payment_metadata',
        'digital_waiver_confirmed_at',
        'digital_waiver_text',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
