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
        'user_id',
        'currency',
        'amount',
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
