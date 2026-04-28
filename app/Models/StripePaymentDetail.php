<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Ramsey\Uuid\Uuid;
use Illuminate\Database\Eloquent\SoftDeletes;


class StripePaymentDetail extends Model
{
    use HasFactory, SoftDeletes;

    protected $dates = ['deleted_at'];

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
        'deleted_at',
    ];

    protected $hidden   =   [
        'id',
        'uuid',
        'session_id',
        'payment_method_config_detail_id',
        'payment_method_type',
        'session_created',
        'session_expires_at',
        'created_at',
        'updated_at',
        'deleted_at'
    ];

    public static function boot()
    {
        parent::boot();
        static::creating(fn($u) => $u->uuid = Uuid::uuid4());
    }


    public function owner()
    {
        return $this->belongsTo(User::class, 'owner_id');
    }

    public function user()
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    public function stripePaymentItems()
    {
        return $this->hasMany(StripePaymentItems::class, 'stripe_payment_detail_id');
    }
}
