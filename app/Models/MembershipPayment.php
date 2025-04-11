<?php

namespace App\Models;

use App\Helpers;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Facades\Auth;
use Ramsey\Uuid\Uuid;

class MembershipPayment extends Model
{
    use HasFactory, SoftDeletes;

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
        'tax',
        'vat_tax_amount',
        'recurring_for',
        'recurring_type',
        'payment_method',
        'message',
        'anonymous',
        'end',
        'upcoming_payment',
        'status',
        'twitter_response',
        'payout_at',
    ];

    protected $appends = [
        'sender',
        'final_amount',
    ];

    public static function boot()
    {
        parent::boot();
        static::creating(fn($w) => $w->uuid = Uuid::uuid4());
    }


    public function membership()
    {
        return $this->belongsTo(Membership::class);
    }

    public function user()
    {
        return $this->belongsTo(User::class);
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

    public function getFinalAmountAttribute()
    {
        $amount = $this->amount;

        // Accessing the related 'wish' model
        $membership = $this->membership;

        // Ensure $wish is not null
        if ($membership && $membership->user && $membership->user->vat_amount_percentage && $membership->user->vat_amount_percentage > 0) {
            $amount = $membership->price;
            $vat = $membership->user->vat_amount_percentage; // Assuming 'vat' is a property or method in the WishItem model
            $tax = $amount * config('app.member_tax_plaid') / 100; // Assuming 'vat' is a property or method in the WishItem model
            $totalAmount = $amount + $tax;
            $finalAmount = $amount + ($totalAmount * $vat / 100);
            if ($this->payment && $this->payment->currency == 'EUR') {
                $finalAmount = Helpers::priceFormat('GBP', $finalAmount, strtoupper($this->payment->currency));
                return $finalAmount;
            }
            return $finalAmount;
        }

        // If 'wish' is null, return the original amount
        return $amount;
    }
}
