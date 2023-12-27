<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Ramsey\Uuid\Uuid;

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
        'description',
        'status',
        'days',
        'completed',
        'completed_at',
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

    public static function boot()
    {
        parent::boot();
        static::creating(fn ($w) => $w->uuid = Uuid::uuid4());
    }

    public function user()
    {
        return $this->belongsTo(User::class, 'user_id');
    }
}
