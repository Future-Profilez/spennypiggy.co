<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class WishCategory extends Model {
    use HasFactory;

    protected $fillable = [
        "wish_id",
        "category_id",
    ];

    public function wish(){
        return $this->belongsTo(WishItem::class,'wish_id');
    }

    public function category(){
        return $this->belongsTo(UserCategory::class,'category_id');
    }

}
