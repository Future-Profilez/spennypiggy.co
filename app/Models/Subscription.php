<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Ramsey\Uuid\Uuid;

class Subscription extends Model
{
    use HasFactory;


    protected $fillable = [
        'uuid',
        'user_id',
        'owner_id',
        'wish_id',
        'start_at',
        'end_at',
        'status'
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

    public function wish()
    {
        return $this->belongsTo(WishItem::class, 'wish_id');
    }

    public function owner()
    {
        return $this->belongsTo(User::class, 'owner_id');
    }
}
