<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Ramsey\Uuid\Uuid;
use Illuminate\Database\Eloquent\SoftDeletes;

class UserCart extends Model
{
    use HasFactory, SoftDeletes;
    protected $dates = ['deleted_at'];
    protected $fillable = [
        "uuid",
        "user_id",
        'device_id',
        "owner_id",
        "wish_id",
        'amount',
        'quantity',
        'tax',
        'priceid',
        'message',
        'is_subscribed',
        "status",
        'deleted_at',
    ];

    public static function boot()
    {
        parent::boot();
        static::creating(fn ($w) => $w->uuid = Uuid::uuid4());
    }

    public function user()
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    public function owner()
    {
        return $this->belongsTo(User::class, 'owner_id');
    }

    public function wish()
    {
        return $this->belongsTo(WishItem::class, 'wish_id');
    }
}
