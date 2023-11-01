<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

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
}
