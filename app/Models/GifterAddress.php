<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class GifterAddress extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'address',
        'stripe_address'
    ];

}
