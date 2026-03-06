<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class RiskSetting extends Model
{
    use HasFactory;

    protected $fillable = ['key', 'value', 'description', 'last_updated_by'];

    protected $casts = [
        'value' => 'array',
    ];

    /**
     * Get a setting value by key, or return default.
     */
    public static function get($key, $default = null)
    {
        $setting = self::where('key', $key)->first();
        return $setting ? $setting->value : $default;
    }
}
