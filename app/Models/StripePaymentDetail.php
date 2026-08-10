<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Schema;
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

    /** null = not yet checked. See supportsReceiptClaim(). */
    private static ?bool $receiptClaimSupported = null;

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
    public static function claimReceipt(?int $paymentId, bool $failOpen = true): bool
    {
        if (! $paymentId) {
            return false;
        }

        // 🚨 The column may not exist yet — code and migration do not always
        // land together outside Vapor (which migrates on deploy). Failing OPEN
        // for BOTH callers would mean both dispatch and the buyer gets TWO
        // receipts; failing CLOSED for both would mean nobody gets one.
        //
        // So the fallback restores the PRE-CLAIM behaviour exactly: the
        // redirect handler still sends ($failOpen = true, its historic role),
        // the webhook stands down ($failOpen = false, which is what its
        // commented-out dispatch used to do). Bank payments still lose their
        // receipt until the migration runs — the same bug as before, not a new
        // one — and nothing is ever sent twice.
        if (! self::supportsReceiptClaim()) {
            return $failOpen;
        }

        try {
            return static::where('id', $paymentId)
                ->whereNull('receipt_claimed_at')
                ->update(['receipt_claimed_at' => now()]) === 1;
        } catch (\Throwable $e) {
            Log::warning('StripePaymentDetail: receipt claim failed', [
                'payment_id' => $paymentId, 'error' => $e->getMessage(),
            ]);

            return $failOpen;
        }
    }

    /** Memoised per request — `hasColumn` is a round trip, and this sits on the money path. */
    private static function supportsReceiptClaim(): bool
    {
        if (self::$receiptClaimSupported === null) {
            try {
                self::$receiptClaimSupported = Schema::hasColumn('stripe_payment_details', 'receipt_claimed_at');
            } catch (\Throwable $e) {
                self::$receiptClaimSupported = false;
            }
        }

        return self::$receiptClaimSupported;
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
