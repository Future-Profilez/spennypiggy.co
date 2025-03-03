<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class CreatorShippingAddress extends Model
{
    use HasFactory, HasUuids;

    public function uniqueIds()
    {
        return ['uuid'];
    }

    protected $fillable = ['creator_id', 'first_name', 'last_name', 'phone', 'address_1', 'address_2', 'city', 'province_code', 'country_code', 'postal_code'];

    public function creator()
    {
        return $this->belongsTo(User::class);
    }
}
