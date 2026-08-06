<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Casts\Attribute;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Crypt;
use Illuminate\Support\Facades\Log;

class GifterAddress extends Model
{
    /*
     * Every column here is encrypted at rest, and every accessor must tolerate
     * NULL. Since registration stopped collecting a billing address, a row is
     * created with `country` only and the rest of the columns stay NULL until
     * the gifter fills them at the £500 card-verification gate — an unguarded
     * `Crypt::decryptString(null)` threw "The payload is invalid." on read.
     * The admin app's copy of this model already guarded them.
     *
     * ⚠️ An earlier comment here (and in CLAUDE.md) claimed `successCheckout`
     * filled the rest from Stripe on the first purchase. It never did — nothing
     * outside this feature has ever written these columns, so from the day
     * signup stopped asking, every new gifter's address stayed NULL and the
     * admin's £500 match report had nothing on its own side to compare.
     */
    use HasFactory;

    /**
     * What the gifter must type before the £500 verification charge is created.
     *
     * ⚠️ `postal_code` and `state` are deliberately NOT here. Several countries
     * have no postcode at all and many have no state, and this is the one gate
     * standing between a gifter and their ability to spend — a field they
     * cannot fill would be a dead end with no way out. A blank field is read as
     * `unknown` by the admin comparison, never as a mismatch, so leaving one
     * empty weakens the check without ever falsely accusing anybody.
     */
    public const REQUIRED_FIELDS = ['street_address', 'city', 'country'];

    /** Everything the admin match report compares, required or not. */
    public const COMPARED_FIELDS = ['street_address', 'city', 'state', 'postal_code', 'country'];

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

    /**
     * Has the gifter given us an address of their own to compare against?
     *
     * 🚨 This is the ONE definition, read by the server gate on the verification
     * charge and by the screen that decides whether to show the form. Two copies
     * would drift, and the direction that drifts silently is the dangerous one:
     * a screen that thinks the address is present skips the form, the charge is
     * refused, and the gifter is stuck at the gate with nothing to fill in.
     */
    public function isComplete(): bool
    {
        foreach (self::REQUIRED_FIELDS as $column) {
            if (blank($this->readable($column))) {
                return false;
            }
        }

        return true;
    }

    /**
     * The gifter's own address, for their own screen.
     *
     * ⚠️ `stripe_address` is deliberately absent. It is what they typed into
     * Stripe Checkout, and the whole point of holding two copies is that the
     * second one is typed independently — showing it back to them on the form
     * they are about to fill turns the comparison into a copying exercise.
     */
    public function toFormArray(): array
    {
        return [
            'street_address' => $this->readable('street_address'),
            'city' => $this->readable('city'),
            'state' => $this->readable('state'),
            'postal_code' => $this->readable('postal_code'),
            'country' => $this->readable('country'),
            'is_complete' => $this->isComplete(),
        ];
    }

    /**
     * One encrypted column, or null if it cannot be decrypted.
     *
     * 🚨 The accessors above throw `DecryptException` on a corrupt payload, and both
     * readers of this row are now on paths where a throw is far worse than a blank:
     * `toFormArray()` feeds the SHARED Inertia payload, so an unreadable row would
     * take down every page for that gifter with no way to reach the form and fix it;
     * and `isComplete()` is the server gate on the verification charge, where an
     * exception is a 500 instead of a refusal.
     *
     * ⚠️ Fails CLOSED — unreadable counts as absent, so the gate still refuses and
     * the gifter is simply asked to type the address again. A row can become
     * unreadable for one reason above all: `APP_KEY` rotating. Logged at warning so
     * a wave of them is visible rather than looking like gifters who never bothered.
     */
    private function readable(string $column): ?string
    {
        try {
            return $this->{$column};
        } catch (\Throwable $e) {
            Log::warning('GifterAddress column could not be decrypted', [
                'gifter_address_id' => $this->id,
                'column' => $column,
            ]);

            return null;
        }
    }
}
