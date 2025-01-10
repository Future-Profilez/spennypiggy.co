<?php

namespace App\Models;

use App\Helpers;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Facades\Auth;
use Ramsey\Uuid\Uuid;

class BillPayment extends Model
{
    use HasFactory,SoftDeletes;

    protected $fillable = [
        'uuid',
        'stripe_id',
        'session_id',
        'user_id',
        'bills_id',
        'guest_name',
        'guest_email',
        'amount',
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
    ];

    protected $appends = [
        'sender',
        'final_amount',
    ];

    public static function boot()
    {
        parent::boot();
        static::creating(fn ($w) => $w->uuid = Uuid::uuid4());
    }

    public function user(){
        return $this->belongsTo(User::class,'user_id');
    }

    public function bill(){
        return $this->belongsTo(Bills::class,'bills_id');
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
        $bill = $this->bill;

        // Ensure $wish is not null
        if ($bill && $bill->user && $bill->user->vat_amount_percentage && $bill->user->vat_amount_percentage > 0) {
            $amount = $bill->price;
            $vat = $bill->user->vat_amount_percentage; // Assuming 'vat' is a property or method in the WishItem model
            $tax = $amount * config('app.bill_tax_plaid') / 100; // Assuming 'vat' is a property or method in the WishItem model
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
