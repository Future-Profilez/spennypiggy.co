<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ShippingProfile extends Model
{
    use HasFactory;

    protected $fillable = ['user_id', 'name'];

    public function zones()
    {
        return $this->hasMany(ShippingProfileZone::class);
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function shops()
    {
        return $this->hasMany(Shop::class);
    }
}
