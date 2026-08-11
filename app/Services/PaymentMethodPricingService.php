<?php

namespace App\Services;

use App\Helpers;

/**
 * Single source of truth for method-aware supporter pricing.
 *
 * The creator always receives exactly the listed price; the platform fee is
 * grossed-up into the supporter price per fee profile ("card" vs "bank").
 * Every surface (price preview, checkout session, ledger sync) must go
 * through this service — nothing else computes supporter prices.
 */
class PaymentMethodPricingService
{
    public const PROFILE_CARD = 'card';

    public const PROFILE_BANK = 'bank';

    /**
     * @param  int|null  $creatorId  Applies this creator's bespoke platform rate when
     *                               they have one. Every supporter-facing quote must
     *                               pass it, or the price shown differs from the price
     *                               charged for exactly the creators on a custom deal.
     */
    public static function breakdown(string $feeProfile, $listedPrice, string $currency = 'GBP', $reserveRate = 0, ?int $creatorId = null): array
    {
        return Helpers::calculateStripeDirectChargeFlow($listedPrice, $currency, $reserveRate, $feeProfile, $creatorId);
    }

    /**
     * Card + bank supporter prices for one listed price, plus the saving.
     * bank is null when no bank method exists for the charge currency.
     */
    public static function dualPrices($listedPrice, string $currency = 'GBP', $reserveRate = 0, ?int $creatorId = null): array
    {
        $card = self::breakdown(self::PROFILE_CARD, $listedPrice, $currency, $reserveRate, $creatorId);

        $bank = null;
        $saving = null;
        if (self::bankAvailable($currency)) {
            $bank = self::breakdown(self::PROFILE_BANK, $listedPrice, $currency, $reserveRate, $creatorId);
            $saving = round(max(0, $card['total_supporter_pays'] - $bank['total_supporter_pays']), 2);
        }

        return [
            'currency' => strtoupper($currency),
            'card' => $card,
            'bank' => $bank,
            'saving' => $saving,
        ];
    }

    /**
     * Enabled Stripe payment_method_types for the bank profile in a currency.
     */
    public static function bankMethodsForCurrency(string $currency): array
    {
        if (! config('payments.enabled')) {
            return [];
        }

        $methods = config('payments.bank_methods.'.strtoupper($currency), []);
        $flags = config('payments.method_flags', []);

        return array_values(array_filter($methods, fn ($m) => (bool) ($flags[$m] ?? false)));
    }

    public static function bankAvailable(string $currency): bool
    {
        return count(self::bankMethodsForCurrency($currency)) > 0;
    }

    /**
     * True when a bank-profile charge in this currency settles asynchronously
     * (SEPA/ACH) and fulfilment must wait for async_payment_succeeded.
     * pay_by_bank settles near-instantly, so GBP is treated as instant.
     */
    public static function hasDelayedSettlement(string $currency): bool
    {
        $methods = self::bankMethodsForCurrency($currency);

        return in_array('sepa_debit', $methods, true) || in_array('us_bank_account', $methods, true);
    }
}
