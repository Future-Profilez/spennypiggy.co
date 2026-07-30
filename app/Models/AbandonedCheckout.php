<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

/**
 * One row per Stripe Checkout session that was opened but not (yet) paid.
 *
 * Written by AbandonedCheckoutService::record() at checkout-create time and closed
 * out when the payment completes, the session expires, or the item stops being
 * buyable. Nothing else may write to it.
 */
class AbandonedCheckout extends Model
{
    use HasFactory;

    protected $fillable = [
        'session_id',
        'checkout_url',
        'expires_at',
        'product_type',
        'item_id',
        'creator_id',
        'user_id',
        'guest_email',
        'amount_minor',
        'currency',
        'fee_profile',
        'reminder_count',
        'last_reminded_at',
        'recovered_at',
        'closed_at',
        'closed_reason',
    ];

    protected $casts = [
        'expires_at' => 'datetime',
        'last_reminded_at' => 'datetime',
        'recovered_at' => 'datetime',
        'closed_at' => 'datetime',
        'amount_minor' => 'integer',
        'reminder_count' => 'integer',
    ];

    public function user()
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    public function creator()
    {
        return $this->belongsTo(User::class, 'creator_id');
    }

    /** Still open: not paid, not closed. */
    public function scopeOpen($query)
    {
        return $query->whereNull('recovered_at')->whereNull('closed_at');
    }

    /** The address we would email. Logged-in user's account email wins. */
    public function recipientEmail(): ?string
    {
        return $this->user?->email ?: ($this->guest_email ?: null);
    }
}
