<?php

namespace App\Models;

use App\Services\Pricing\PricingResolver;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;

/**
 * One published platform pricing version.
 *
 * 🚨 THIS APP NEVER WRITES THIS TABLE. Pricing is published from
 * `admin.spennypiggy.co`; the website reads it and prices charges with it. The two
 * apps share a database and no code, so the model exists in BOTH — keep the casts
 * in step (the `fee_profiles` rule).
 *
 * 🚨 `$fillable` IS EMPTY IN BOTH APPS AND MUST STAY EMPTY. These columns decide
 * what every supporter on the platform is charged; a mass-assignable copy is a
 * route by which a posted form sets a rate nobody chose, or backdates
 * `effective_at` so a change appears to have been live since last month. The admin
 * controller builds the row explicitly from validated input with `forceFill`.
 *
 * @see PricingResolver
 */
class PlatformPricingVersion extends Model
{
    protected $table = 'platform_pricing_versions';

    /** @var array<string> */
    protected $fillable = [];

    protected $casts = [
        'rate_card' => 'float',
        'rate_bank' => 'float',
        'fixed_fee_enabled' => 'boolean',
        'fixed_fee_gbp' => 'float',
        'effective_at' => 'datetime',
        'ends_at' => 'datetime',
        'grandfather_existing' => 'boolean',
        'grandfathered_from_id' => 'integer',
        'rolled_back_from_id' => 'integer',
        'cancelled_at' => 'datetime',
        'cancelled_by_admin_id' => 'integer',
        'published_by_admin_id' => 'integer',
    ];

    public const KIND_STANDARD = 'standard';

    public const KIND_CAMPAIGN = 'campaign';

    /**
     * The versions that could be pricing a charge right now.
     *
     * 🚨 A CAMPAIGN THAT HAS ENDED SIMPLY STOPS MATCHING, and the version underneath
     * it becomes the newest match on the next read. There is no "reinstate" step to
     * forget and no scheduled command that can fail to run — the query is the
     * mechanism.
     */
    public function scopeApplicableAt(Builder $query, \DateTimeInterface $at): Builder
    {
        return $query
            ->whereNull('cancelled_at')
            ->where('effective_at', '<=', $at)
            ->where(function (Builder $q) use ($at) {
                $q->whereNull('ends_at')->orWhere('ends_at', '>', $at);
            })
            ->orderByDesc('effective_at')
            ->orderByDesc('id');
    }

    /** Published, due to start, and not yet in force. */
    public function scopeScheduled(Builder $query, \DateTimeInterface $at): Builder
    {
        return $query
            ->whereNull('cancelled_at')
            ->where('effective_at', '>', $at)
            ->orderBy('effective_at');
    }

    public function isCampaign(): bool
    {
        return $this->kind === self::KIND_CAMPAIGN;
    }

    /** The rate this version charges on a rail, in percent. */
    public function rateFor(string $rail): float
    {
        return (float) ($rail === 'bank' ? $this->rate_bank : $this->rate_card);
    }
}
