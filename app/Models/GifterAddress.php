<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Casts\Attribute;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Crypt;

class GifterAddress extends Model
{
    /*
     * Every column here is encrypted at rest, and every accessor must tolerate
     * NULL. Since registration stopped collecting a billing address, a row is
     * created with `country` only and the rest of the columns stay NULL until
     * `successCheckout` fills them from Stripe — an unguarded
     * `Crypt::decryptString(null)` threw "The payload is invalid." on read.
     * The admin app's copy of this model already guarded them.
     */
    use HasFactory;

    protected $fillable = [
        'user_id',
        'country',
        'street_address',
        'city',
        'state',
        'postal_code',
        'stripe_address',
    ];

    public function country(): Attribute
    {
        return Attribute::make(
            get: fn ($value) => $value === null ? null : Crypt::decryptString($value),
            set: fn ($value) => $value === null ? null : Crypt::encryptString($value)
        );
    }

    public function streetAddress(): Attribute
    {
        return Attribute::make(
            get: fn ($value) => $value === null ? null : Crypt::decryptString($value),
            set: fn ($value) => $value === null ? null : Crypt::encryptString($value)
        );
    }

    public function city(): Attribute
    {
        return Attribute::make(
            get: fn ($value) => $value === null ? null : Crypt::decryptString($value),
            set: fn ($value) => $value === null ? null : Crypt::encryptString($value)
        );
    }

    public function state(): Attribute
    {
        return Attribute::make(
            get: fn ($value) => $value === null ? null : Crypt::decryptString($value),
            set: fn ($value) => $value === null ? null : Crypt::encryptString($value)
        );
    }

    public function postalCode(): Attribute
    {
        return Attribute::make(
            get: fn ($value) => $value === null ? null : Crypt::decryptString($value),
            set: fn ($value) => $value === null ? null : Crypt::encryptString($value)
        );
    }
}
