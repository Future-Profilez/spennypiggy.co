<?php

namespace App\Services;

use App\Models\User;
use App\StripeControl;

/**
 * Resolves the supporter's requested payment method ('card' | 'bank') against
 * the listing preference, the progressive tiers, the currency's available
 * bank rails, and the creator's Stripe capabilities.
 *
 * Used by every one-off buy controller so the enforcement is identical
 * everywhere. Returns either:
 *   ['ok' => true, 'fee_profile', 'payment_method_types', 'force_3ds', 'delayed_settlement', 'rules']
 * or
 *   ['ok' => false, 'code', 'message'] — soft errors the UI turns into a
 *   "use Bank Payment instead" (or "use card") prompt; never a dead end
 *   unless the listing itself forbids every available method.
 */
class CheckoutMethodResolver
{
    public static function resolve(
        string $requestedMethod,
        ?string $listingPreference,
        $listedPrice,
        string $currency,
        ?User $buyer,
        ?string $guestEmail,
        ?string $connectedAccountId
    ): array {
        // Nullable + fail closed: listings created before creators were gated on
        // account_id still exist, and a TypeError here surfaced to the supporter
        // as a 500 rather than a readable refusal.
        if (empty($connectedAccountId)) {
            return self::refuse('creator_not_connected', 'This creator has not finished setting up payments yet. Please try again later.');
        }

        $requestedMethod = $requestedMethod === 'bank' ? 'bank' : 'card';
        $listingPreference = in_array($listingPreference, ['card', 'bank', 'both'], true) ? $listingPreference : 'both';

        $rules = PaymentTierService::resolve($listedPrice, $currency, $buyer, $guestEmail);

        if ($requestedMethod === 'bank') {
            if ($listingPreference === 'card') {
                return self::refuse('bank_not_accepted', 'The creator accepts card payments only for this item.');
            }

            $methods = PaymentMethodPricingService::bankMethodsForCurrency($currency);
            if (empty($methods)) {
                return self::refuse('bank_unavailable', 'Bank payment is not available for this currency — please pay by card.');
            }

            $requestedMethods = $methods;
            $methods = StripeControl::activeBankMethodTypes($connectedAccountId, $methods);
            if (empty($methods)) {
                // "yet" implies waiting fixes it, which sends support chasing a
                // capability the account can never have. When the account's
                // country is outside every scheme this currency uses, say so.
                $capabilityMap = [
                    'pay_by_bank' => 'pay_by_bank_payments',
                    'sepa_debit' => 'sepa_debit_payments',
                    'us_bank_account' => 'us_bank_account_ach_payments',
                ];
                try {
                    $country = StripeControl::getAccount($connectedAccountId)->country ?? null;
                    $countryCaps = StripeControl::bankCapabilitiesForCountry($country);
                    $everPossible = array_intersect(
                        $countryCaps,
                        array_map(fn ($m) => $capabilityMap[$m] ?? '', $requestedMethods)
                    );
                    if (empty($everPossible)) {
                        return self::refuse('bank_region_unsupported', 'Bank payment is not supported for this creator\'s region — please pay by card.');
                    }
                } catch (\Throwable) {
                    // Account lookup failed — fall through to the generic refusal.
                }

                return self::refuse('bank_capability_missing', 'Bank payment is not available for this creator yet — please pay by card.');
            }

            return [
                'ok' => true,
                'fee_profile' => PaymentMethodPricingService::PROFILE_BANK,
                'payment_method_types' => $methods,
                'force_3ds' => false,
                'delayed_settlement' => PaymentMethodPricingService::hasDelayedSettlement($currency),
                'rules' => $rules,
            ];
        }

        // Card path
        if ($listingPreference === 'bank' && $rules['bank_available']) {
            return self::refuse('card_not_accepted', 'The creator accepts bank payments only for this item.');
        }

        if (! $rules['card_allowed']) {
            return self::refuse('card_risk_declined', 'Card payment is unavailable for this purchase — please use the bank payment option (lower fees, higher limits).');
        }

        $force3ds = $rules['force_3ds'];
        if ($rules['tier'] === PaymentTierService::TIER_BANK_REQUIRED && $rules['bank_available']) {
            // Bank required at this amount; card only continues as a
            // 3DS-forced fallback per the client's progressive model.
            $force3ds = true;
        }

        return [
            'ok' => true,
            'fee_profile' => PaymentMethodPricingService::PROFILE_CARD,
            'payment_method_types' => ['card'],
            'force_3ds' => $force3ds,
            'delayed_settlement' => false,
            'rules' => $rules,
        ];
    }

    private static function refuse(string $code, string $message): array
    {
        return [
            'ok' => false,
            'code' => $code,
            'message' => $message,
        ];
    }
}
