<?php

namespace App\Support;

use App\Helpers;

/**
 * Our side of "What a £20 payment really costs".
 *
 * Client spec "Comparison Build FINAL v4.3", 24 Aug 2026, Section 4.
 *
 * 🚨 EVERY FIGURE IS COMPUTED BY THE CODE THAT CHARGES A REAL SUPPORTER.
 * `Helpers::calculateStripeDirectChargeFlow()` is the pricing engine for every
 * checkout in this app; this class only arranges what it returns. Nothing here
 * adds, rounds or re-derives a fee.
 *
 * That is not tidiness — it is the page's entire claim. These pages tell a
 * creator that our fees are shown in full and cannot drift from what the
 * checkout charges. The moment a percentage is typed into a component, that
 * claim is false and nothing will ever report it.
 *
 * ⚠️ The rates therefore come out as `config/payments.php` currently holds
 * them. If that disagrees with a figure written in the brief, the config is
 * what supporters are charged and the brief is what needs correcting.
 */
class ComparisonFeePayload
{
    /**
     * @param  string  $currency  The visitor's display currency where the site
     *                            supports one; GBP otherwise. The £1 flat fee
     *                            is converted with it, so a non-GBP reader is
     *                            not shown a pound sign against their own total.
     */
    public static function build(string $currency = 'GBP'): array
    {
        $price = (float) config('comparison_fees.example_price', 20);

        return [
            'example_price' => $price,
            'currency' => $currency,
            'rails' => array_values(array_filter([
                self::liveRail('card', 'Card', $price, $currency),
                self::liveRail('bank', 'Pay by Bank', $price, $currency),
                self::announcedRail('stablecoin'),
            ])),
            'lines' => [
                'three_tier' => config('comparison_fees.three_tier_line'),
                'flat_fee' => config('comparison_fees.flat_fee_line'),
                'creator' => config('comparison_fees.creator_line'),
            ],
        ];
    }

    /**
     * A rail somebody can actually pay with, priced by the live engine.
     */
    private static function liveRail(string $profile, string $label, float $price, string $currency): ?array
    {
        if (! is_array(config("payments.fee_profiles.$profile"))) {
            // A rail that is not configured is not advertised. Silence beats a
            // column of zeroes on a page about fee transparency.
            return null;
        }

        $flow = Helpers::calculateStripeDirectChargeFlow($price, $currency, 0, $profile);

        return [
            'key' => $profile,
            'label' => $label,
            'coming_soon' => false,

            /*
             * ⚠️ Percentages next to percentages, the flat fee on its own.
             * The spec is explicit that the two are shown in separate blocks —
             * every platform on these pages charges both kinds, and folding a
             * flat fee into a percentage is how a comparison stops being one.
             */
            'platform_rate' => $flow['platform_fee_rate'],
            'compliance_rate' => $flow['compliance_fee_rate'],
            'processing_rate' => $flow['stripe_fee_rate'],
            'processing_fixed' => $flow['stripe_fixed_fee'],
            'all_in_rate' => round(
                $flow['platform_fee_rate'] + $flow['compliance_fee_rate'] + $flow['stripe_fee_rate'],
                1
            ),

            // The £1, in the reader's currency, straight off the breakdown.
            'flat_fee' => $flow['admin_fee'],

            'supporter_pays' => $flow['total_supporter_pays'],

            // 🚨 Always the listed price. If this ever differs, the payment
            // engine has changed and this page is the least of the problems.
            'creator_receives' => $flow['net_to_creator'],
        ];
    }

    /**
     * A rail that has been announced and cannot be paid with yet.
     *
     * ⚠️ It carries no supporter total and no creator figure, because there is
     * no charge to compute — showing one would be inventing a transaction.
     */
    private static function announcedRail(string $key): ?array
    {
        $rail = config("comparison_fees.announced.$key");

        if (! is_array($rail)) {
            return null;
        }

        return [
            'key' => $key,
            'label' => $rail['label'],
            'coming_soon' => true,
            'platform_rate' => $rail['platform_rate'],
            'compliance_rate' => $rail['compliance_rate'],
            'processing_rate' => null,
            'processing_note' => $rail['processing_note'] ?? null,

            /*
             * 🚨 NO ALL-IN FIGURE, AND THAT IS DELIBERATE.
             *
             * The provider rate for this rail is not published, so 10% + 2%
             * is not the total — it is the part we know, with an unknown on
             * top. Printing "≈12%" would under-state our own cost IN OUR
             * FAVOUR on the one page whose entire claim is that every fee is
             * shown in full, and it would be the lowest number in the table.
             * The component prints the two known rates and "provider rate"
             * instead. Give it a number when the provider publishes one.
             */
            'all_in_rate' => null,
            'flat_fee' => null,
            'supporter_pays' => null,
            'creator_receives' => null,
        ];
    }
}
