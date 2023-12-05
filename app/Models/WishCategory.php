<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class WishCategory extends Model
{
    use HasFactory, SoftDeletes;

    protected $dates = ['deleted_at'];
    protected $fillable = [
        "wish_id",
        "category_id",
        'deleted_at',
    ];

    public function wish()
    {
        return $this->belongsTo(WishItem::class, 'wish_id');
    }

    public function category()
    {
        return $this->belongsTo(UserCategory::class, 'category_id');
    }
}
