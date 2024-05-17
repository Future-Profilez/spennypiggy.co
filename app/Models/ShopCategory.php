<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Ramsey\Uuid\Uuid;

class ShopCategory extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'uuid',
        'shop_id',
        'user_shop_categories_id',
    ];

    protected $hidden = [
        'id',
        'shop_id',
        'user_shop_categories_id',
        'created_at',
        'updated_at',
        'deleted_at'
    ];

    public static function boot()
    {
        parent::boot();
        static::creating(fn ($w) => $w->uuid = Uuid::uuid4());
    }

    public function shop(){
        return $this->belongsTo(Shop::class,'shop_id');
    }

    public function category(){
        return $this->belongsTo(UserShopCategories::class,'user_shop_categories_id');
    }
}
