<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Facades\Log;

class WishCategory extends Model
{
    use HasFactory, SoftDeletes;

    protected $dates = ['deleted_at'];
    protected $fillable = [
        "wish_item_id",
        "user_category_id",
        'deleted_at',
    ];

    protected $hidden   =   [
        'created_at',
        'updated_at',
        'deleted_at'
    ];

    public function wish()
    {
        return $this->belongsTo(WishItem::class, 'wish_item_id');
    }

    public function category()
    {
        return $this->belongsTo(UserCategory::class, 'user_category_id');
    }
}
