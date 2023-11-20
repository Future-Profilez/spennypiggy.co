<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Ramsey\Uuid\Uuid;

class StripePaymentDetail extends Model
{
    use HasFactory;
    protected $fillable = [
        'id',
        'uuid',
        'session_id',
        'amount_subtotal',
        'amount_total',
        'currency',
        'payment_method_config_detail_id',
        'payment_method_type',
        'user_id',
        'owner_id',
        'tax',
        'payment_status',
        'session_created',
        'session_expires_at',
    ];

    public static function boot()
    {
        parent::boot();
        static::creating(fn ($u) => $u->uuid = Uuid::uuid4());
    }
}
