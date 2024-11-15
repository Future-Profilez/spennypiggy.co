<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Ramsey\Uuid\Uuid;

class ShopPayment extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'uuid',
        'session_id',
        'amount',
        'tax_amount',
        'currency',
        'shop_id',
        'user_id',
        'name',
        'email',
        'message',
        'anonymous',
        'answer',
        'payment_status',
        'twitter_response',
        'quantity',
    ];


    protected $hidden = [
        'id',
        'user_id',
        'shop_id',
        'updated_at',
        'deleted_at',
    ];

    public static function boot()
    {
        parent::boot();
        static::creating(fn ($w) => $w->uuid = Uuid::uuid4());
    }


    public function user(){
        return $this->belongsTo(User::class, 'user_id');
    }

    public function shop(){
        return $this->belongsTo(Shop::class,'shop_id');
    }
}
