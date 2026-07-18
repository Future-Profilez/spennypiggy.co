<?php

namespace App\Http\Controllers;

use App\Helpers;
use App\Services\PaymentMethodPricingService;
use App\Services\PaymentTierService;
use Illuminate\Http\Request;

/**
 * Supporter-facing price preview for the checkout method selector.
 * Pure pricing math — listing-level enforcement (payment_methods_accepted,
 * tier rules) is re-checked server-side in each buy controller.
 */
class PaymentMethodController extends Controller
{
    public function preview(Request $request)
    {
        // NOTE: deliberately no `email` field. Accepting a buyer email here and
        // feeding it to PaymentTierService::passesBuyerRiskChecks would let an
        // unauthenticated caller enumerate which emails are blocked/disputed.
        $validated = $request->validate([
            'amount' => ['required', 'numeric', 'min:0.01', 'max:1000000'],
            'currency' => ['required', 'string', 'size:3'],
            'charge_currency' => ['nullable', 'string', 'size:3'],
            'reserve_rate' => ['nullable', 'numeric', 'min:0', 'max:100'],
        ]);

        $itemCurrency = strtoupper($validated['currency']);
        $chargeCurrency = strtoupper($validated['charge_currency'] ?? $itemCurrency);

        $listedPrice = $itemCurrency === $chargeCurrency
            ? (float) $validated['amount']
            : (float) Helpers::priceFormat($itemCurrency, $validated['amount'], $chargeCurrency);

        $reserveRate = (float) ($validated['reserve_rate'] ?? 0);

        $prices = PaymentMethodPricingService::dualPrices($listedPrice, $chargeCurrency, $reserveRate);

        // Preview is non-binding and publicly reachable (throttle 60/min), so it
        // resolves tier rules from the AMOUNT ONLY — no buyer risk lookup. That
        // keeps this endpoint free of per-call DB risk queries and means it can
        // never disclose anyone's risk state. The authoritative check runs at buy
        // time in CheckoutMethodResolver with the real purchase context.
        $rules = PaymentTierService::resolve($listedPrice, $chargeCurrency, null, null);

        return response()->json([
            'status' => true,
            'bank_enabled' => (bool) config('payments.enabled'),
            'charge_currency' => $chargeCurrency,
            'prices' => [
                'card' => $prices['card']['total_supporter_pays'],
                'bank' => $prices['bank']['total_supporter_pays'] ?? null,
                'saving' => $prices['saving'],
            ],
            'rules' => $rules,
        ]);
    }
}
