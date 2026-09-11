<?php

namespace App\Services\Pricing;

use App\Helpers;
use Illuminate\Support\Facades\Log;

/**
 * The ONE definition of what a supporter is charged on top of a listed price.
 *
 * 🚨 THE COMMERCIAL MODEL CHANGED ON 11 Sep 2026 (client direction). Until now the
 * platform rate, the compliance rate and Stripe's estimated cost were each added ON TOP
 * of the listed price — a £100 listing charged the supporter £130.55. The new model is
 * **all-in**: the supporter pays the listed price plus ONE advertised percentage, and
 * **Stripe comes out of that percentage instead of on top of it.**
 *
 * ⚠️ WHAT DID NOT CHANGE, and no copy may imply otherwise: the creator receives 100% of
 * their listed price under both models. That was already true. What changed is the size
 * of the supporter's fee and which side of it the processor sits on.
 *
 * 🚨 EVERY USER-FACING FEE FIGURE MUST COME FROM HERE. A literal "12%" typed into a
 * landing page, a help article or a checkout line is a number that will be wrong the day
 * the rate moves, and the client's §3 asks for a rate that can change **without
 * development work**. `describe()` exists so a surface can render the rate without
 * knowing where it is stored.
 *
 * ⚠️ It is NOT the calculator. `Helpers::calculateStripeDirectChargeFlow` still owns the
 * arithmetic and the rounding; this class answers "what rate applies to this rail, for
 * this creator, right now" and "below what price does that rate stop covering its own
 * costs".
 *
 * 🚨 THE RATE IS NO LONGER A CONFIG VALUE (11 Sep 2026) — it is PUBLISHED from the back
 * office, and `PricingResolver` is where that is read: the pricing version in force,
 * falling back to `config/payments.php`, falling back to a hard default. **This class is
 * still the ONE read path.** Nothing outside `App\Services\Pricing` asks the resolver,
 * nothing reads `payments.all_in.*` directly, and no caller can tell which link in the
 * chain answered. If a surface has to know where the number came from, the design is
 * wrong.
 *
 * 🚨 A SCHEDULED FUTURE RATE IS NEVER RETURNED. The resolver filters on
 * `effective_at <= now`, so nothing here — `describe()` least of all, since it is the
 * public `fees` prop — can leak pricing that has not started. Client direction: "do not
 * expose future pricing plans publicly."
 */
class FeeModel
{
    public const MODEL_ALL_IN = 'all_in';

    public const MODEL_LEGACY = 'legacy_markup';

    /** The rails an all-in rate is configured for. Stablecoin is not built. */
    public const PROFILES = ['card', 'bank'];

    /** Is the platform on the all-in model? */
    public static function isAllIn(): bool
    {
        return PricingResolver::model() === self::MODEL_ALL_IN;
    }

    /**
     * The advertised percentage a supporter pays on top of the listed price.
     *
     * ⚠️ A BESPOKE CREATOR DEAL OVERRIDES IT. `creator_fee_overrides.platform_rate` was
     * written for the old model, where it meant "the platform's cut". Under all-in the
     * platform's cut IS the supporter's fee minus Stripe, so the same column is read as
     * the creator's all-in rate — one number, one meaning, no second table. The existing
     * sanity bounds in `CreatorFeeResolver` still apply, so a nonsense rate is refused
     * and the standard one used.
     */
    public static function supporterRate(string $feeProfile = 'card', ?int $creatorId = null): float
    {
        $feeProfile = in_array($feeProfile, self::PROFILES, true) ? $feeProfile : 'card';

        /*
         * 🚨 WHERE THIS NUMBER COMES FROM MOVED ON 11 Sep 2026, AND NOTHING ELSE DID.
         * It used to be `config('payments.all_in.*')`; it is now whatever
         * `PricingResolver` answers — the published pricing version in force, falling
         * back to that same config, falling back to a hard default. Callers cannot tell
         * which link answered, which is the point: there is still ONE way to ask.
         *
         * ⚠️ The creator id is passed even for the "standard" rate because a published
         * version may GRANDFATHER creators who predate it. A grandfathered creator is
         * still on standard terms — just an older set of them.
         */
        $standard = PricingResolver::rateFor($feeProfile, $creatorId);

        if ($creatorId === null) {
            return $standard;
        }

        $profile = CreatorFeeResolver::profileFor($creatorId, $feeProfile);

        // A bespoke deal is present only when the resolver says so — a standard profile
        // carries the config's own platform_rate, which under all-in means nothing.
        if (($profile['fee_source'] ?? CreatorFeeResolver::SOURCE_STANDARD) === CreatorFeeResolver::SOURCE_STANDARD) {
            return $standard;
        }

        $bespoke = (float) ($profile['platform_rate'] ?? $standard);

        return $bespoke > 0 ? $bespoke : $standard;
    }

    /**
     * The flat per-transaction fee, in the charge currency.
     *
     * 🚨 Zero at launch, and the toggle is why it exists rather than being deleted:
     * processing carries a fixed cost that does not shrink with the sale, so if the
     * measured cost ever exceeds the estimate this is the lever. Turning it on is a
     * visible price rise.
     *
     * ⚠️ Zero-decimal currencies (JPY, KRW) get an integer — a fractional yen is
     * meaningless, and the gross-up would carry the fraction into the supporter's total.
     */
    public static function fixedFee(string $currency = 'GBP', ?int $creatorId = null): float
    {
        // Published version first, config second — the same chain as the percentage,
        // and the creator id so a grandfathered creator keeps the toggle state they
        // were on rather than inheriting a fee introduced after them.
        $gbp = PricingResolver::fixedFeeGbp($creatorId);

        if ($gbp <= 0) {
            return 0.0;
        }

        $currency = strtoupper($currency ?: 'GBP');

        if ($currency === 'GBP') {
            return $gbp;
        }

        $converted = (float) Helpers::priceFormat('GBP', $gbp, $currency);

        if (! is_finite($converted) || $converted <= 0) {
            // An unknown rate must not silently drop the fee to zero on one currency
            // and charge it on another — fall back to the GBP figure and say so.
            Log::warning('FeeModel: could not convert the fixed supporter fee', [
                'currency' => $currency,
                'amount_gbp' => $gbp,
            ]);

            return $gbp;
        }

        return round($converted, Helpers::isZeroDecimalCurrency($currency) ? 0 : 2, PHP_ROUND_HALF_UP);
    }

    /**
     * The lowest listed price at which the all-in rate still covers Stripe's cost.
     *
     * 🚨 COMPUTED, NEVER ASSERTED. Below this price the processor's fixed component eats
     * the whole percentage and the platform pays to take the money — and because the
     * creator is always made whole, the shortfall lands on us silently. This is the
     * number that decides whether a headline rate is viable at the platform's £4.99
     * minimum, and it is why 9% and 12% are not interchangeable:
     *
     *   listed × f  ≥  stripeRate × (listed × (1+f) + fixed) + stripeFixed
     *   ⇒ listed ≥ (stripeFixed + fixed × stripeRate − fixed) / (f − stripeRate × (1+f))
     *
     * On the estimate this platform freezes (3.4% + 30p): 12% breaks even at about
     * £3.66, comfortably under the £4.99 minimum. 9% breaks even at about £5.67, which
     * is ABOVE it — every minimum-priced card sale would lose money.
     *
     * ⚠️ Returns INF when the rate cannot cover the percentage cost at any price, which
     * is a configuration error rather than a price floor.
     */
    public static function minimumSellable(string $feeProfile = 'card', string $currency = 'GBP', ?int $creatorId = null): float
    {
        /*
         * ⚠️ THE FORMULA LIVES IN `PricingPreview`, NOT HERE, since 11 Sep 2026. The
         * admin app has to compute the same break-even to REFUSE a rate that cannot
         * cover the platform's own minimum listing, and it has no copy of this class or
         * of `Helpers::calculateStripeDirectChargeFlow`. One formula, mirrored and
         * drift-guarded, beats two that agree until they do not.
         *
         * ⚠️ The processing estimate stays in `config/payments.php` deliberately: it is
         * an estimate of what STRIPE costs us, not a price we set, so it is not on the
         * admin pricing screen and does not move without a deploy.
         */
        $profile = config("payments.fee_profiles.$feeProfile", config('payments.fee_profiles.card', []));

        return PricingPreview::breakEven(
            self::supporterRate($feeProfile, $creatorId),
            self::fixedFee($currency, $creatorId),
            (float) ($profile['stripe_rate'] ?? 3.4),
            Helpers::isZeroDecimalCurrency($currency) ? 0.0 : (float) ($profile['stripe_fixed_fee'] ?? 0.30)
        );
    }

    /**
     * Everything a surface needs to render the fee without knowing where it is stored.
     *
     * @return array{model: string, rate: float, rate_label: string, fixed_fee: float, all_in: bool}
     */
    public static function describe(string $feeProfile = 'card', string $currency = 'GBP', ?int $creatorId = null): array
    {
        $rate = self::supporterRate($feeProfile, $creatorId);

        /*
         * 🚨 NOTHING ABOUT A SCHEDULED VERSION MAY APPEAR HERE. This array is the shared
         * `fees` Inertia prop and feeds the landing pages, the comparison page, the help
         * tokens and every creator form — i.e. it is PUBLIC. `PricingResolver` only ever
         * returns a version whose `effective_at` has passed, so a future rate cannot
         * reach it; do not add a `next_rate`, an `effective_from` or a countdown.
         * Client direction: "do not expose future pricing plans publicly."
         */
        return [
            'model' => PricingResolver::model(),
            'all_in' => self::isAllIn(),
            'rate' => $rate,
            // Trailing zeros dropped: "12%", not "12.00%". A fee is read aloud.
            'rate_label' => rtrim(rtrim(number_format($rate, 2, '.', ''), '0'), '.').'%',
            'fixed_fee' => self::fixedFee($currency, $creatorId),
        ];
    }

    /**
     * The cheapest live rail, for the "supporter fees from X%" headline.
     *
     * 🚨 ONLY RAILS THAT CAN ACTUALLY TAKE A PAYMENT. Advertising an entry price on a
     * rail a supporter cannot select is a claim the platform cannot honour — the exact
     * reason the client's own plan gates the 8% stablecoin message on the rail being
     * genuinely live.
     */
    public static function lowestLiveRate(): float
    {
        $rates = [self::supporterRate('card')];

        // 🚨 `payments.enabled`, NOT `payments.bank.enabled` — that key has never
        // existed, so this always answered 12% while the bank rail was live at 9%.
        // The guard in AllInFeeModelTest set the same non-existent key, which is why it
        // certified a rate the platform never advertised. Both fixed 11 Sep 2026.
        if ((bool) config('payments.enabled', false)) {
            $rates[] = self::supporterRate('bank');
        }

        return min($rates);
    }
}
