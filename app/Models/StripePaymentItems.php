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
    ];
}
