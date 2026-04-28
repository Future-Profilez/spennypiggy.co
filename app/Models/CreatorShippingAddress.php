<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Casts\Attribute;
use Illuminate\Support\Facades\Crypt;
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

    public function firstName(): Attribute
    {
        return Attribute::make(
            get: fn($value) => Crypt::decryptString($value),
        );
    }

    public function lastName(): Attribute
    {
        return Attribute::make(
            get: fn($value) => Crypt::decryptString($value),
        );
    }

    public function phone(): Attribute
    {
        return Attribute::make(
            get: fn($value) => Crypt::decryptString($value),
        );
    }

    public function address1(): Attribute
    {
        return Attribute::make(
            get: fn($value) => Crypt::decryptString($value),
        );
    }

    public function address2(): Attribute
    {
        return Attribute::make(
            get: fn($value) => Crypt::decryptString($value),
        );
    }

    public function city(): Attribute
    {
        return Attribute::make(
            get: fn($value) => Crypt::decryptString($value),
        );
    }

    public function provinceCode(): Attribute
    {
        return Attribute::make(
            get: fn($value) => Crypt::decryptString($value),
        );
    }

    public function countryCode(): Attribute
    {
        return Attribute::make(
            get: fn($value) => Crypt::decryptString($value),
        );
    }

    public function postalCode(): Attribute
    {
        return Attribute::make(
            get: fn($value) => Crypt::decryptString($value),
        );
    }
}
