<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class UkTaxSetting extends Model
{
    protected $fillable = [
        'tax_year_start',
        'tax_year_label',
        'personal_allowance',
        'basic_rate_limit',
        'higher_rate_limit',
        'basic_rate',
        'higher_rate',
        'additional_rate',
    ];
}

