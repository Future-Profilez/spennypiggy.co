<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Currency extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable =   [
        'ISO',
        'conversion_rate',
        'name',
        'demonym',
        'majorSingle',
        'majorPlural',
        'ISOnum',
        'symbol',
        'symbolNative',
        'minorSingle',
        'minorPlural',
        'ISOdigits',
        'numToBasic',
    ];

    protected $hidden   =   [
        'id',
        'created_at',
        'updated_at',
        'deleted_at'
    ];
}
