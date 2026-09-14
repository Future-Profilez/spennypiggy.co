<?php

namespace App\Services\Pricing;

/**
 * What a sample transaction costs at a given set of rates — the arithmetic only.
 *
 * 🚨 THIS APP IS THE ORIGINAL, AND THE ADMIN APP'S COPY IS BYTE-IDENTICAL —
 * same namespace, same file, `admin.spennypiggy.co/app/Services/Pricing/PricingPreview.php`.
 * Edit here, copy across, same commit — the `fee_profiles` rule. Both apps pin it:
 *   · website `PlatformPricingEngineTest::test_the_preview_agrees_with_the_real_calculator`
 *     proves this class returns what `Helpers::calculateStripeDirectChargeFlow` actually
 *     charges, swept across the real price range and both rails;
 *   · admin `PricingPreviewMirrorTest` fails on any drift from the website's copy.
 *
 * 🚨 WHY IT EXISTS AT ALL. The admin app needs a preview calculator before publishing a
 * rate, and it has no copy of `Helpers::calculateStripeDirectChargeFlow`. Re-typing the
 * formula there is exactly how a back office starts reporting numbers the website never
 * charged. So the formula is extracted ONCE, proved equal to the live calculator in the
 * app that owns it, and mirrored — rather than written twice and hoped about.
 *
 * ⚠️ GBP ONLY, deliberately. What an operator sets is a PERCENTAGE; the pound figures are
 * illustrative. A multi-currency preview would need the FX table on both sides and would
 * disagree with the charge the moment a rate moved, for no decision value — the decision
 * is "is this rate viable", and the platform's own minimum listing price is a GBP figure.
 *
 * ⚠️ NOT A SECOND PRICING PATH. Nothing that charges money calls this. `FeeModel` and
 * `Helpers::calculateStripeDirectChargeFlow` remain the live path; this answers
 * "what WOULD this rate do" for a screen and for a publish-time guard.
 */
final class PricingPreview
{
    /**
     * The platform's own minimum listing price.
     *
     * 🚨 MIRRORS `Helpers::MIN_PRICE_GBP`, and the website pins that they agree
     * (`test_the_preview_minimum_matches_the_platform_minimum`). It is duplicated here
     * only because the admin app has no `Helpers::MIN_PRICE_GBP` and the publish-time
     * viability guard runs there.
     */
    public const MIN_LISTING_GBP = 4.99;

    /**
     * One sample transaction, all-in.
     *
     * @param  float  $listed  what the creator listed, GBP
     * @param  float  $supporterRate  the advertised all-in percentage
     * @param  float  $fixedFee  the flat supporter fee in GBP (0 when the toggle is off)
     * @param  float  $stripeRate  the FROZEN processing estimate for this rail, percent
     * @param  float  $stripeFixed  the frozen fixed processing component, GBP
     * @return array{listed:float,total:float,supporter_fee:float,stripe_fee:float,platform_fee:float,net_to_creator:float,creator_whole:bool,platform_loses_money:bool}
     */
    public static function transaction(
        float $listed,
        float $supporterRate,
        float $fixedFee,
        float $stripeRate,
        float $stripeFixed
    ): array {
        $r = $supporterRate / 100;

        // 🚨 CEIL, matching the live calculator. The rounding always favours the
        // creator: a penny over is correct, a penny under leaves them short of what
        // they listed, which is the one promise the whole model is built on.
        $total = ceil((($listed * (1 + $r)) + $fixedFee) * 100) / 100;

        $stripeFee = round(($total * ($stripeRate / 100)) + $stripeFixed, 2, PHP_ROUND_HALF_UP);

        $platformFee = round($total - $listed - $stripeFee, 2, PHP_ROUND_HALF_UP);

        /*
         * 🚨 A NEGATIVE PLATFORM FEE IS NOT A SMALL LOSS FOR US — IT IS THE CREATOR
         * BEING SHORT. The live calculator clamps it at zero so Stripe's application
         * fee is never asked to be negative, and the shortfall then comes out of the
         * creator's net. Reproduced exactly, and reported as its own flag so the
         * screen can say which of the two is happening.
         */
        $losesMoney = $platformFee < 0;
        if ($losesMoney) {
            $platformFee = 0.0;
        }

        $net = round($total - $stripeFee - $platformFee, 2);

        return [
            'listed' => round($listed, 2),
            'total' => $total,
            'supporter_fee' => round($total - $listed, 2),
            'stripe_fee' => $stripeFee,
            'platform_fee' => $platformFee,
            'net_to_creator' => $net,
            // Compared with a tolerance of half a penny: the live calculator rounds to
            // two places, so an exact float equality would report a phantom shortfall.
            'creator_whole' => $net >= ($listed - 0.005),
            'platform_loses_money' => $losesMoney,
        ];
    }

    /**
     * The lowest listed price at which a rate still covers processing.
     *
     * 🚨 COMPUTED, NEVER ASSERTED — and it is the number that decides whether a
     * headline rate may be published at all. Stripe's fixed component does not shrink
     * with the sale, so below some price the percentage cannot pay for itself:
     *
     *   listed x f  >=  stripeRate x (listed x (1+f) + fixed) + stripeFixed
     *
     * On the estimate this platform freezes (3.4% + 30p) that is about GBP 3.66 at 12%
     * and about GBP 5.67 at 9% — against a GBP 4.99 minimum listing, which is why the
     * two are not interchangeable.
     *
     * ⚠️ INF means the rate cannot cover the percentage cost at ANY price. That is a
     * configuration error, not a price floor.
     */
    public static function breakEven(
        float $supporterRate,
        float $fixedFee,
        float $stripeRate,
        float $stripeFixed
    ): float {
        $f = $supporterRate / 100;
        $s = $stripeRate / 100;

        $denominator = $f - ($s * (1 + $f));

        if ($denominator <= 0) {
            return INF;
        }

        $numerator = $stripeFixed + ($fixedFee * $s) - $fixedFee;

        if ($numerator <= 0) {
            return 0.0;
        }

        return round($numerator / $denominator, 2, PHP_ROUND_HALF_UP);
    }

    /**
     * Is this rate publishable at all?
     *
     * 🚨 THE BACK OFFICE MUST NOT BE A WAY ROUND THE BUILD GUARD.
     * `AllInFeeModelTest::test_the_configured_rate_covers_the_platforms_own_minimum_price`
     * fails the build when a CONFIGURED rate cannot cover the platform's own minimum
     * listing. Once a rate can be published from a screen, the same rule has to be
     * enforced at publish time or the guard only protects the path nobody uses any more.
     *
     * @return string|null the refusal, or null when the rate is viable
     */
    public static function refuse(
        string $rail,
        float $supporterRate,
        float $fixedFee,
        float $stripeRate,
        float $stripeFixed
    ): ?string {
        $breakEven = self::breakEven($supporterRate, $fixedFee, $stripeRate, $stripeFixed);

        if ($breakEven === INF) {
            return sprintf(
                'A %s rate of %s%% cannot cover processing at any price (the estimate for this rail is %s%% + %s). '
                .'Raise the rate.',
                $rail,
                rtrim(rtrim(number_format($supporterRate, 3, '.', ''), '0'), '.'),
                rtrim(rtrim(number_format($stripeRate, 3, '.', ''), '0'), '.'),
                '£'.number_format($stripeFixed, 2)
            );
        }

        if ($breakEven > self::MIN_LISTING_GBP) {
            return sprintf(
                'A %s rate of %s%% breaks even at £%s, above the £%s minimum listing — every minimum-priced sale '
                .'on this rail would pay the creator less than they listed. Raise the rate, raise the minimum '
                .'price, or turn the fixed fee on.',
                $rail,
                rtrim(rtrim(number_format($supporterRate, 3, '.', ''), '0'), '.'),
                number_format($breakEven, 2),
                number_format(self::MIN_LISTING_GBP, 2)
            );
        }

        return null;
    }
}
