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

    /**
     * Get Only Exchange Rates
     *
     * @return array
     */
    public static function rates()
    {
        return self::whereNotNull('conversion_rate')
            ->orderBy('ISO')
            ->pluck('conversion_rate', 'ISO');
    }

    /**
     * Get Currency Symbol like USD => $
     *
     * @param $type symbol or symbolNative
     * @return array
     */
    public static function symbols($type = 'symbolNative')
    {
        return self::whereNotNull($type)
            ->orderBy('ISO')
            ->pluck($type, 'ISO');
    }
}
