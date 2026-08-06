<?php

namespace App\Support;

use App\Helpers;

/**
 * What a gifter is charged to verify their card.
 *
 * 🚨 **A FLAT amount. It does NOT go through `calculateStripeDirectChargeFlow`.**
 *
 * That formula prices a supporter buying from a creator: it grosses the listed price
 * up so the creator still nets it after a 17% platform fee, a 2% compliance fee, a
 * flat £1 admin fee and Stripe's cut. Run against a £1 verification it returned
 * **£2.95** — and the breakdown reported `net_to_creator: 1` for a charge that has no
 * creator at all. The platform was charging itself £1.56 in application fees and
 * passing the bill to the gifter.
 *
 * The screen, meanwhile, promised "a one-time verification fee of £1", so the card was
 * charged nearly three times the quoted figure — on the one payment whose entire
 * purpose is to establish that a card and its owner can be trusted, and a surprise
 * amount is precisely what produces the dispute this gate exists to prevent.
 *
 * This is not a sale. Nobody is being paid; the platform is the merchant and the only
 * unavoidable cost is Stripe's. So the gifter is charged the headline amount, full
 * stop — quoted and charged are the same number because there is only one number.
 *
 * ONE definition, read by the screen that quotes the price and by the Checkout session
 * that takes it.
 */
class GifterVerificationCharge
{
    /**
     * The headline amount, in GBP. This is what the gifter pays — not a base that
     * something else marks up. Stripe takes roughly £0.33 of it.
     */
    public const AMOUNT_GBP = 1.00;

    /**
     * @return array{
     *     currency: string,
     *     amount: float,
     *     minor: int,
     *     formatted: string
     * }
     */
    public static function quote(?string $currency = null): array
    {
        $currency = strtoupper(trim((string) $currency)) ?: 'GBP';

        // A gifter outside the UK pays the same real value, in their own currency.
        $amount = $currency === 'GBP'
            ? self::AMOUNT_GBP
            : (float) Helpers::priceFormat('gbp', self::AMOUNT_GBP, $currency);

        // ⚠️ Guard against a missing or zero conversion rate. Stripe rejects a
        // zero-amount charge outright, so the gate would simply stop working for that
        // currency with nothing on screen explaining why; falling back to the GBP
        // figure keeps it usable.
        if ($amount <= 0) {
            $amount = self::AMOUNT_GBP;
            $currency = 'GBP';
        }

        return [
            'currency' => $currency,
            'amount' => $amount,
            // Stripe takes minor units; rounding here rather than at the call site is
            // what keeps the quoted figure and the charged figure the same number.
            'minor' => (int) round($amount * 100),
            'formatted' => self::format($amount, $currency),
        ];
    }

    /**
     * ⚠️ Never hardcode "£". The charge is taken in the visitor's own currency (the
     * `currency` cookie), so a hardcoded pound sign is wrong for everybody outside
     * the UK — and a bare number on a charge screen is worse than a wrong symbol.
     * `Helpers::getCurrency()` falls back to the ISO code rather than to nothing.
     */
    private static function format(float $amount, string $currency): string
    {
        try {
            $symbol = Helpers::getCurrency($currency);
        } catch (\Throwable $e) {
            $symbol = $currency.' ';
        }

        return $symbol.number_format($amount, 2);
    }
}
