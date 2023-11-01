<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Ramsey\Uuid\Uuid;

class WishItem extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        "user_id",
        "wishname",
        "price",
        "item_url",
        "thumbnail",
        "subscription",
        "subscription_period",
        "repeat_purchase",
        "category",
    ];

    public static function boot(){
        parent::boot();
        static::creating(fn($w) => $w->uuid = Uuid::uuid4());
    }

    protected $hidden = [
        "id",
        "user_id",
        "created_at",
        "deleted_at"
    ];
}
