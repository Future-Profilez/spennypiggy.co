<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Facades\Auth;

class StripePaymentItems extends Model
{
    use HasFactory, SoftDeletes;

    protected $dates = ['deleted_at'];

    protected $fillable = [
        'uuid',
        'stripe_payment_id',
        'wish_item_id',
        'user_cart_id',
        'amount',
        'tax',
        'deleted_at',
        'quantity'
    ];

    protected $appends = [
        'sender'
    ];

    public function payment()
    {
        return $this->belongsTo(StripePaymentDetail::class, 'stripe_payment_id');
    }

    public function wish()
    {
        return $this->belongsTo(WishItem::class, 'wish_item_id');
    }

    public function cart()
    {
        return $this->belongsTo(UserCart::class, 'user_cart_id');
    }

    public function getSenderAttribute()
    {
        $sender = false;
        if (Auth::check()) {
            $sender = $this->payment->owner_id == Auth::id() ? false : true;
        }
        return $sender;
    }
}
