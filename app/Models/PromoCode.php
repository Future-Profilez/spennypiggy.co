<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Ramsey\Uuid\Uuid;

/**
 * A signup promo code. Created by an admin (`admin.spennypiggy.co`
 * → `Admin\PromoCodeController`), typed by a fan on the register form.
 *
 * 🚨 A CODE GRANTS NOTHING TODAY, AND THIS TABLE CANNOT EXPRESS A BENEFIT.
 * There is no discount, amount, percentage or free-period column — only a name, a
 * code, an optional `limit` and an optional date window. The register form says
 * "Code applied." because the code EXISTS, not because anything happened. What a
 * code should actually give a fan is an open product decision; do not invent one
 * here, and do not read the reassuring copy as evidence that something downstream
 * is consuming it.
 *
 * ⚠️ What this class DOES guarantee is that a code which is expired, not yet
 * started, or fully claimed stops validating — all three were ignored until
 * 24 Aug 2026, so a code with an end date two years past still answered
 * "Code applied.", and a `limit` of 10 was unlimited because **nothing counted
 * redemptions**. `users.promo_code_id` existed and was written by nobody, which
 * also left the admin panel's "who used this code" list permanently empty.
 */
class PromoCode extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = ['user_id', 'name', 'code', 'limit', 'start_date', 'end_date'];

    protected $casts = [
        'start_date' => 'date',
        'end_date' => 'date',
    ];

    public static function boot()
    {
        parent::boot();
        static::creating(fn ($w) => $w->uuid = Uuid::uuid4());
    }

    /**
     * Everyone who signed up with this code.
     *
     * ⚠️ Mirrors the relation the ADMIN app already had and read
     * (`Admin\PromoCodeController::getPromoCodeUser`). The two apps share one
     * database and not one line of code, so this must stay in step by hand.
     */
    public function users()
    {
        return $this->hasMany(User::class, 'promo_code_id');
    }

    /** How many people have redeemed it. This is what `limit` is measured against. */
    public function redemptions(): int
    {
        return $this->users()->count();
    }

    /**
     * Resolve a typed code to one that may actually be redeemed right now.
     *
     * 🚨 ONE RULE, ONE PLACE. The register form checks a code before submitting and
     * the signup checks it again on submit; if those two disagree a fan is told
     * "Code applied." and then silently signs up without it. Both call this.
     *
     * A NULL `limit`, `start_date` or `end_date` means "no restriction" — that is
     * the state every existing row is in, so enforcing these changes nothing for
     * codes an admin has not deliberately bounded.
     *
     * @return array{code: ?self, reason: ?string}
     */
    public static function redeemable(?string $code): array
    {
        $code = trim((string) $code);

        if ($code === '') {
            return ['code' => null, 'reason' => "That code isn't valid."];
        }

        // Soft deletes are scoped out globally, so a withdrawn code cannot match.
        $promo = static::where('code', $code)->first();

        if (! $promo) {
            return ['code' => null, 'reason' => "That code isn't valid."];
        }

        $today = now()->startOfDay();

        if ($promo->start_date && $today->lt($promo->start_date->startOfDay())) {
            return ['code' => null, 'reason' => 'That code is not active yet.'];
        }

        if ($promo->end_date && $today->gt($promo->end_date->startOfDay())) {
            return ['code' => null, 'reason' => 'That code has expired.'];
        }

        $limit = $promo->getAttribute('limit');

        if ($limit !== null && $limit > 0 && $promo->redemptions() >= (int) $limit) {
            return ['code' => null, 'reason' => 'That code has been fully claimed.'];
        }

        return ['code' => $promo, 'reason' => null];
    }
}
