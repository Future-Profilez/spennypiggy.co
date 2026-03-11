<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class CreatorFinancialProfile extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'user_id',
        'business_name',
        'business_address_line1',
        'business_address_line2',
        'business_city',
        'business_postal_code',
        'business_country',
        'vat_registered',
        'vat_registration_number',
        'tax_percentage',
        'rolling_revenue',
        'last_revenue_check_at',
    ];

    protected $casts = [
        'vat_registered' => 'boolean',
        'last_revenue_check_at' => 'datetime',
        'tax_percentage' => 'decimal:2',
        'rolling_revenue' => 'decimal:2',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
