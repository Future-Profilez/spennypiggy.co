<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Ramsey\Uuid\Uuid;

class Shop extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'name',
        'description',
        'image',
        'price',
        'success_page_type',
        'success_page_value',
        'success_page_type',
        'ask_question',
        'slot_limitation',
        'special_member_price',
        'quantity_allow',
    ];

    protected $hidden   =   [
        'id',
        'user_id',
        'image',
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
