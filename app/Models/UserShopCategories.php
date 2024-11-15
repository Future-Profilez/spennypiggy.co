<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Ramsey\Uuid\Uuid;

class UserShopCategories extends Model
{
    use HasFactory, SoftDeletes;

    protected $table = 'user_shop_categories';

    protected $fillable = [
        'user_id',
        'category',
    ];

    protected $hidden   =   [
        'id',
        'user_id',
        'created_at',
        'updated_at',
        'deleted_at'
    ];


    public static function boot()
    {
        parent::boot();
        static::creating(fn ($w) => $w->uuid = Uuid::uuid4());
    }
}
