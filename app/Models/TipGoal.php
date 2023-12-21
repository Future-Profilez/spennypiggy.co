<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class TipGoal extends Model
{
    use HasFactory;


    protected $fillable = [
        "uuid",
        "user_id",
        'name',
        "target",
        "default_price",
        'fullfilled',
        'tax_amount',
        'currency',
        'price_id',
        'product_id'
    ];


    protected $hidden = [
        'id',
        'user_id',
        'price_id',
        'product_id',
        'created_at',
        'updated_at',
    ];


    public function user()
    {
        return $this->belongsTo(TipGoal::class, 'user_id');
    }
}
