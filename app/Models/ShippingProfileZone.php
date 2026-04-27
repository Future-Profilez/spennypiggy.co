<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ShippingProfileZone extends Model
{
    use HasFactory;

    protected $fillable = ['shipping_profile_id', 'country', 'shipping_price'];

    public function profile()
    {
        return $this->belongsTo(ShippingProfile::class, 'shipping_profile_id');
    }
}
