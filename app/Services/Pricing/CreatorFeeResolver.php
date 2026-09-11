<?php

namespace App\Services\Pricing;

use App\Helpers;
use App\Models\CreatorFeeOverride;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;

/**
 * The ONE decision of which fee rates price a charge.
 *
 * Standard pricing is unchanged and is what every creator gets: this class
 * returns the config profile verbatim unless a live bespoke agreement exists for
 * that creator, in which case it swaps in the negotiated PLATFORM rate only.
 * The 2% compliance fee always comes from config and is never negotiable.
 *
 * Everything here fails OPEN to standard pricing. A missing table, a malformed
 * rate or a database blip must never be able to price a charge at 0% — the worst
 * outcome of a failure is that a bespoke creator is billed at the standard rate
 * for one transaction, which is recoverable; the reverse is not.
 *
 * @see Helpers::calculateStripeDirectChargeFlow()
 */
class CreatorFeeResolver
{
    public const SOURCE_STANDARD = 'standard';

    public const SOURCE_CUSTOM = 'custom';

    /**
     * Request-scoped cache of the live agreement per creator. A single checkout
     * resolves the profile several times (price preview, tier resolution, the
     * charge itself), and this is one indexed lookup either way.
     *
     * @var array<int, CreatorFeeOverride|null>
     */
    private static array $liveCache = [];

    public static function flushCache(): void
    {
        self::$liveCache = [];
    }

    /**
     * The live agreement for a creator, or null when they are on standard rates.
     */
    public static function liveOverrideFor(?int $creatorId): ?CreatorFeeOverride
    {
        if (! $creatorId) {
            return null;
        }

        if (array_key_exists($creatorId, self::$liveCache)) {
            return self::$liveCache[$creatorId];
        }

        try {
            $override = CreatorFeeOverride::query()
                ->where('user_id', $creatorId)
                ->live()
                ->orderByDesc('id')
                ->first();
        } catch (\Throwable $e) {
            // Fail open. A creator paying standard rates for one charge is a far
            // better outcome than a checkout that cannot price itself at all.
            Log::warning('CreatorFeeResolver: could not read fee override, falling back to standard rates', [
                'creator_id' => $creatorId,
                'error' => $e->getMessage(),
            ]);

            $override = null;
        }

        return self::$liveCache[$creatorId] = $override;
    }

    /**
     * The fee profile that should price this charge.
     *
     * Returns the config profile array with `platform_rate` replaced when a
     * bespoke deal covers this payment method, plus the metadata the caller
     * needs to record what was applied:
     *
     *   fee_source       standard|custom
     *   fee_override_id  which agreement priced it (null on standard)
     *
     * @param  string  $feeProfile  'card' | 'bank'
     */
    public static function profileFor(?int $creatorId, string $feeProfile = 'card'): array
    {
        $profile = config("payments.fee_profiles.$feeProfile");

        if (! is_array($profile)) {
            $feeProfile = 'card';
            $profile = config('payments.fee_profiles.card', []);
        }

        $profile['fee_source'] = self::SOURCE_STANDARD;
        $profile['fee_override_id'] = null;

        $override = self::liveOverrideFor($creatorId);

        if (! $override) {
            return $profile;
        }

        $rate = $override->platformRateFor($feeProfile);

        // NULL means the deal says nothing about this payment method — a bespoke
        // bank rate does not silently change what the creator pays on card.
        if ($rate === null || ! self::rateIsSane($rate, $profile)) {
            if ($rate !== null) {
                Log::error('CreatorFeeResolver: rejecting an out-of-range bespoke platform rate, using standard', [
                    'creator_id' => $creatorId,
                    'override_id' => $override->id,
                    'fee_profile' => $feeProfile,
                    'rate' => $rate,
                ]);
            }

            return $profile;
        }

        $profile['platform_rate'] = $rate;
        $profile['fee_source'] = self::SOURCE_CUSTOM;
        $profile['fee_override_id'] = $override->id;

        return $profile;
    }

    /**
     * The fee-rate columns to persist on a row, resolved directly rather than
     * lifted off a pricing breakdown.
     *
     * For rows that are written away from the call that priced them — a cart's
     * parent payment record, or a per-item row inside a loop — where reaching for
     * whichever `$breakdown` happens to be in scope is how the wrong creator's
     * rate gets recorded.
     */
    public static function columnsFor(?int $creatorId, string $feeProfile = 'card'): array
    {
        $profile = self::profileFor($creatorId, $feeProfile);

        /*
         * 🚨 UNDER ALL-IN THIS MUST STAMP THE ALL-IN FINGERPRINT (11 Sep 2026).
         *
         * `Helpers::storedFeeRates()` infers which model priced a row from its
         * compliance rate: legacy records the configured 2%, all-in records exactly 0
         * (there is no second fee line). This method wrote the legacy profile's 2% onto
         * EVERY row whatever the live model, so an all-in wish or cart charge of
         * £112.01 carried a legacy fingerprint and `finance:sync-transactions` re-cost
         * it as legacy every 30 minutes — booking £17.74 of platform revenue per £100
         * that was never collected. Three writers (CheckoutController, StripeController
         * ×2), all on the wish/cart path. `Helpers::feeRateColumns()` was already
         * right; this was the one stamp built from the profile instead of a breakdown.
         *
         * ⚠️ `platform_fee_rate` IS NULL UNDER ALL-IN, DELIBERATELY. On a real breakdown
         * that column is the platform's take as a percentage of the TOTAL, and this
         * method has no total to compute it from — it prices nothing. Writing the
         * supporter rate (12) there would put a second quantity in the same column.
         * The all-in re-cost never reads it: it reconstructs the split from the row's
         * own recorded total (`supporter_total` in storedFeeRates). Null says "not
         * recorded", which is the truth here.
         */
        if (FeeModel::isAllIn()) {
            return [
                'platform_fee_rate' => null,
                'compliance_fee_rate' => 0.0,
                'fee_source' => $profile['fee_source'],
                'fee_override_id' => $profile['fee_override_id'],
            ];
        }

        return [
            'platform_fee_rate' => round((float) ($profile['platform_rate'] ?? 0), 2),
            'compliance_fee_rate' => round((float) ($profile['compliance_rate'] ?? 0), 2),
            'fee_source' => $profile['fee_source'],
            'fee_override_id' => $profile['fee_override_id'],
        ];
    }

    /**
     * Both methods' effective rates for a creator, for display and for the admin
     * screens. `total` is what the supporter sees quoted (platform + compliance).
     *
     * @return array{card: array, bank: array, is_custom: bool, override_id: int|null}
     */
    public static function ratesFor(?int $creatorId): array
    {
        $out = ['is_custom' => false, 'override_id' => null];

        foreach (['card', 'bank'] as $feeProfile) {
            $profile = self::profileFor($creatorId, $feeProfile);

            $platform = (float) ($profile['platform_rate'] ?? 0);
            $compliance = (float) ($profile['compliance_rate'] ?? 0);

            $out[$feeProfile] = [
                'platform_rate' => $platform,
                'compliance_rate' => $compliance,
                'total_rate' => round($platform + $compliance, 2),
                'is_custom' => $profile['fee_source'] === self::SOURCE_CUSTOM,
            ];

            if ($profile['fee_source'] === self::SOURCE_CUSTOM) {
                $out['is_custom'] = true;
                $out['override_id'] = $profile['fee_override_id'];
            }
        }

        return $out;
    }

    /** Cache key for the map the frontend renders prices from. */
    public const RATE_MAP_CACHE_KEY = 'creator_fee_overrides:rate_map';

    /**
     * ⚠️ Deliberately SHORT. Agreements are set from the ADMIN app, and the two
     * apps share a database but NOT a cache — nothing the admin does can forget
     * a key this app holds. So this cannot be a long TTL bumped on write; it has
     * to expire on its own.
     *
     * Only the DISPLAY map is affected. `liveOverrideFor()` is request-scoped, so
     * what a supporter is actually CHARGED changes the instant a deal is saved.
     */
    public const RATE_MAP_TTL = 60;

    /**
     * Hard ceiling on how many bespoke creators travel in the page payload.
     * Bespoke deals are a handful by design; if this is ever hit, the frontend
     * needs per-item rates instead of a shared map.
     */
    public const RATE_MAP_LIMIT = 250;

    /**
     * Every creator on a bespoke rate, as `[userId => ['card' => 12.0, 'bank' => 8.0]]`.
     *
     * Shared with the frontend so any screen that quotes a price can look the
     * creator up. A map rather than a rate on each item because the payload
     * builders are spread across a dozen controllers and services, and one of
     * them missing the field would show the standard price on a bespoke listing —
     * the exact mismatch this exists to prevent.
     *
     * PLATFORM rates only. Compliance is fixed and already a global prop.
     */
    public static function publicRateMap(): array
    {
        try {
            return Cache::remember(self::RATE_MAP_CACHE_KEY, self::RATE_MAP_TTL, function () {
                return CreatorFeeOverride::query()
                    ->live()
                    ->orderByDesc('id')
                    ->limit(self::RATE_MAP_LIMIT)
                    ->get(['user_id', 'platform_rate_card', 'platform_rate_bank'])
                    // Newest agreement per creator wins, matching profileFor().
                    ->groupBy('user_id')
                    ->map(function ($rows) {
                        $row = $rows->first();

                        return array_filter([
                            'card' => $row->platform_rate_card === null ? null : (float) $row->platform_rate_card,
                            'bank' => $row->platform_rate_bank === null ? null : (float) $row->platform_rate_bank,
                        ], fn ($v) => $v !== null);
                    })
                    ->filter(fn ($rates) => $rates !== [])
                    ->all();
            });
        } catch (\Throwable $e) {
            // Same rule as everywhere else here: an unreadable override table
            // means standard pricing, never a broken page.
            Log::warning('CreatorFeeResolver: could not build the public rate map', ['error' => $e->getMessage()]);

            return [];
        }
    }

    /**
     * Call after any change to an agreement. Without it a creator's own screens
     * and every cached profile keep quoting the previous rate for up to the TTL.
     */
    public static function forgetRateMap(): void
    {
        self::flushCache();
        Cache::forget(self::RATE_MAP_CACHE_KEY);
    }

    /**
     * A negotiated rate has to leave the gross-up solvable and the platform's
     * take non-negative. A typo here would otherwise price real charges.
     */
    private static function rateIsSane(float $rate, array $profile): bool
    {
        if ($rate < 0) {
            return false;
        }

        /*
         * 🚨 UNDER ALL-IN, "SANE" MEANS "COVERS THE PLATFORM'S OWN MINIMUM LISTING"
         * (11 Sep 2026). The legacy test below asks whether the gross-up is solvable,
         * which is meaningless when the rate IS the fee. What matters is that Stripe's
         * fixed 30p can be paid out of the percentage at £4.99 — below break-even the
         * platform fee clamps to zero and the SHORTFALL LANDS ON THE CREATOR: measured,
         * 8% on card paid £4.91 on a £4.99 listing. Same rule, same formula, as the
         * admin `/pricing` screen's refusal of a platform rate (`PricingPreview::refuse`),
         * so a bespoke deal cannot be a way round the break-even guard.
         */
        if (FeeModel::isAllIn()) {
            $breakEven = PricingPreview::breakEven(
                $rate,
                FeeModel::fixedFee('GBP'),
                (float) ($profile['stripe_rate'] ?? 3.4),
                (float) ($profile['stripe_fixed_fee'] ?? 0.30)
            );

            return is_finite($breakEven) && $breakEven <= Helpers::MIN_PRICE_GBP;
        }

        $total = ($rate
            + (float) ($profile['compliance_rate'] ?? 0)
            + (float) ($profile['stripe_rate'] ?? 0)) / 100;

        // The gross-up divides by (1 - total); at or above 1 there is no price
        // that covers the fees and Helpers bails out to charging the listed price.
        return $total < 0.95;
    }
}
