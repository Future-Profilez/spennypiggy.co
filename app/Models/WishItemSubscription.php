<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Ramsey\Uuid\Uuid;

class WishItemSubscription extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable =   [
        'uuid',
        'stripe_id',
        'session_id',
        'wish_item_id',
        'user_id',
        'guest_name',
        'guest_email',
        'currency',
        'amount',
        'tax',
        'recurring_for',
        'recurring_type',
        'surprise_message',
        'end',
        'upcoming_payment'
    ];

    protected $hidden   =   [
        'session_id',
        'wish_item_id',
        'user_id',
        'created_at',
        'updated_at',
        'deleted_at'
    ];

    protected $casts = [
        'end'   =>  'datetime',
        'upcoming_payment'  =>  'datetime'
    ];

    public static function boot()
    {
        parent::boot();
        static::creating(fn ($s) =>  $s->uuid = Uuid::uuid4());
    }

    // public function wish_item()
    // {
    //     return $this->belongsTo(WishItem::class);
    // }
    public function wish_item()
    {
        return $this->belongsTo(WishItem::class, 'wish_item_id');
    }

    public function user()
    {
        return $this->belongsTo(User::class, 'user_id');
    }
}
