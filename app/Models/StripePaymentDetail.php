<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Ramsey\Uuid\Uuid;

class StripePaymentDetail extends Model
{
    use HasFactory, SoftDeletes;

    protected $dates = ['deleted_at'];

    protected $fillable = [
        'platform_fee_rate',
        'compliance_fee_rate',
        'fee_source',
        'fee_override_id',
        'fee_profile',
        'id',
        'uuid',
        'session_id',
        'stripe_payment_intent_id',
        'amount_subtotal',
        'amount_total',
        'currency',
        'payment_method_config_detail_id',
        'payment_method_type',
        'user_id',
        'owner_id',
        'name',
        'guest_email',
        'message',
        'anonymous',
        'tax',
        'payment_status',
        'session_created',
        'session_expires_at',
        'digital_waiver_confirmed_at',
        'digital_waiver_text',
        'metadata',
        'receipt_claimed_at',
        'deleted_at',
    ];

    protected $casts = [
        'receipt_claimed_at' => 'datetime',
    ];

    protected $hidden = [
        'id',
        'uuid',
        'session_id',
        'payment_method_config_detail_id',
        'payment_method_type',
        'session_created',
        'session_expires_at',
        'created_at',
        'updated_at',
        'deleted_at',
    ];

    public static function boot()
    {
        parent::boot();
        static::creating(fn ($u) => $u->uuid = Uuid::uuid4());
    }

    public function owner()
    {
        return $this->belongsTo(User::class, 'owner_id');
    }

    public function items()
    {
        return $this->hasMany(StripePaymentItems::class, 'stripe_payment_detail_id');
    }

    public function user()
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    public function stripePaymentItems()
    {
        return $this->hasMany(StripePaymentItems::class, 'stripe_payment_detail_id');
    }

    /**
     * Claim the right to send this purchase's receipt, once.
     *
     * The redirect handler and the webhook both reach this point for the same
     * payment — the card flow completes at the redirect, the bank flow only at
     * the webhook — and neither can know whether the other already ran. The
     * claim IS the update, so two workers racing cannot both win. Returns true
     * to exactly one caller.
     *
     * ⚠️ Never guard on a plain `whereNull` read followed by a save; that is
     * check-then-act and would send two receipts under load.
     */
    public static function claimReceipt(?int $paymentId): bool
    {
        if (! $paymentId) {
            return false;
        }

        try {
            return static::where('id', $paymentId)
                ->whereNull('receipt_claimed_at')
                ->update(['receipt_claimed_at' => now()]) === 1;
        } catch (\Throwable $e) {
            // The column is missing (a database that predates the migration) —
            // fall back to the old behaviour rather than blocking the receipt.
            return true;
        }
    }

    /** Hand the claim back so the next attempt can retry a failed dispatch. */
    public static function releaseReceiptClaim(?int $paymentId): void
    {
        if (! $paymentId) {
            return;
        }

        try {
            static::where('id', $paymentId)->update(['receipt_claimed_at' => null]);
        } catch (\Throwable $e) {
            // Nothing to do — the next sweep will find it either way.
        }
    }
}
