<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Wishitem extends Model
{
    use HasFactory;

    protected $fillable = [
        'uuid',
        'wishname',
        'price',
        'item_url',
        'thumbnail',
        'subcription',
        'subcription_period',
        'repeat_purchase',
        'category'
    ];

    protected $subcriptions = [
        0 => 'single',
        1 => 'subscription',
        2 => 'crowdfund',
    ];

}
