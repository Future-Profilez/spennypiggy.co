<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class StripePaymentItems extends Model
{
    use HasFactory;

    protected $fillable = [
        'uuid',
        'stripe_payment_id',
        'wish_item_id',
        'user_cart_id',
        'amount',
        'tax',
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
}
