<?php

namespace App\Services;

use App\Helpers;
use App\Models\BlockedPayment;
use App\Models\Currency;
use App\Models\Dispute;
use App\Models\User;

/**
 * Progressive payment tiers (client spec, July 2026), GBP-equivalent per
 * transaction:
 *
 *  Tier 1 (<= open_max, default £250): all methods.
 *  Tier 2 (<= card_max, default £1,000): bank recommended; card allowed only
 *          when the buyer passes risk checks — on failure the buyer is
 *          prompted to use the bank method, never hard-blocked.
 *  Tier 3 (> card_max): bank required; card falls back to forced 3DS.
 *
 * Purchases are never blocked outright: when card is not allowed and no bank
 * method exists for the currency, card + forced 3DS is the fallback.
 */
class PaymentTierService
{
    public const TIER_OPEN = 1;

    public const TIER_RECOMMEND_BANK = 2;

    public const TIER_BANK_REQUIRED = 3;

    public static function tierFor($amount, string $currency = 'GBP'): int
    {
        $currency = strtoupper($currency);

        if ($currency === 'GBP') {
            $gbp = (float) $amount;
        } else {
            // Fail closed: a missing/zero-rate currency makes priceFormat
            // return the raw amount, which could misclassify a large foreign
            // payment into a lower tier — treat unconvertible as bank-required.
            $rate = Currency::where('ISO', $currency)->value('conversion_rate');
            if (empty($rate) || (float) $rate <= 0) {
                return self::TIER_BANK_REQUIRED;
            }
            $gbp = (float) Helpers::priceFormat($currency, $amount, 'GBP');
        }

        if ($gbp <= (float) config('payments.tiers.open_max_gbp', 250)) {
            return self::TIER_OPEN;
        }
        if ($gbp <= (float) config('payments.tiers.card_max_gbp', 1000)) {
            return self::TIER_RECOMMEND_BANK;
        }

        return self::TIER_BANK_REQUIRED;
    }

    /**
     * Resolve what the supporter may do for this amount/currency.
     *
     * Returns:
     *  - tier: 1|2|3
     *  - bank_available: bool (currency has an enabled bank method)
     *  - bank_recommended: bool (UI badge "Lower fees, higher limits")
     *  - card_allowed: bool
     *  - force_3ds: bool (create the card session with request_three_d_secure=any)
     *  - prompt_bank: bool (card refused softly — UI should point to bank)
     */
    public static function resolve($amount, string $currency, ?User $buyer, ?string $guestEmail = null): array
    {
        $tier = self::tierFor($amount, $currency);
        $bankAvailable = PaymentMethodPricingService::bankAvailable($currency);

        $cardAllowed = true;
        $force3ds = false;
        $promptBank = false;

        if ($tier === self::TIER_RECOMMEND_BANK) {
            if (! self::passesBuyerRiskChecks($buyer, $guestEmail)) {
                if ($bankAvailable) {
                    $cardAllowed = false;
                    $promptBank = true;
                } else {
                    // No bank rail for this currency — keep the sale, add friction.
                    $force3ds = true;
                }
            }
        } elseif ($tier === self::TIER_BANK_REQUIRED) {
            // Bank required; card only as a 3DS-forced fallback.
            $force3ds = true;
        }

        return [
            'tier' => $tier,
            'bank_available' => $bankAvailable,
            'bank_recommended' => $bankAvailable && $tier >= self::TIER_RECOMMEND_BANK,
            'card_allowed' => $cardAllowed,
            'force_3ds' => $force3ds,
            'prompt_bank' => $promptBank,
        ];
    }

    /**
     * Lightweight buyer-side risk screen for the tier-2 card path.
     * Signals: recent blocked payments by this payer, and card disputes tied
     * to the buyer's email. Fails closed only on positive signals — an
     * unknown guest passes (tier 3 rules add 3DS friction for big amounts).
     */
    public static function passesBuyerRiskChecks(?User $buyer, ?string $guestEmail = null): bool
    {
        $email = strtolower(trim((string) ($buyer->email ?? $guestEmail)));

        if ($buyer) {
            $blocked = BlockedPayment::where('payer_id', $buyer->id)->recent(90)->exists();
            if ($blocked) {
                return false;
            }
        }

        if ($email !== '') {
            $disputed = Dispute::whereRaw('LOWER(customer_email) = ?', [$email])
                ->whereNotIn('status', ['won', 'warning_closed'])
                ->exists();
            if ($disputed) {
                return false;
            }
        }

        return true;
    }
}
