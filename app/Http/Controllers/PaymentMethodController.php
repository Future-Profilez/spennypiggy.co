<?php

namespace App\Http\Controllers;

use App\Helpers;
use App\Services\PaymentMethodPricingService;
use App\Services\PaymentTierService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

/**
 * Supporter-facing price preview for the checkout method selector.
 * Pure pricing math — listing-level enforcement (payment_methods_accepted,
 * tier rules) is re-checked server-side in each buy controller.
 */
class PaymentMethodController extends Controller
{
    public function preview(Request $request)
    {
        $validated = $request->validate([
            'amount' => ['required', 'numeric', 'min:0.01', 'max:1000000'],
            'currency' => ['required', 'string', 'size:3'],
            'charge_currency' => ['nullable', 'string', 'size:3'],
            'reserve_rate' => ['nullable', 'numeric', 'min:0', 'max:100'],
            'email' => ['nullable', 'email'],
        ]);

        $itemCurrency = strtoupper($validated['currency']);
        $chargeCurrency = strtoupper($validated['charge_currency'] ?? $itemCurrency);

        $listedPrice = $itemCurrency === $chargeCurrency
            ? (float) $validated['amount']
            : (float) Helpers::priceFormat($itemCurrency, $validated['amount'], $chargeCurrency);

        $reserveRate = (float) ($validated['reserve_rate'] ?? 0);

        $prices = PaymentMethodPricingService::dualPrices($listedPrice, $chargeCurrency, $reserveRate);

        // Guests: never evaluate risk checks against an arbitrary submitted
        // email — the preview would leak whether that email is blocked or
        // disputed (enumeration). Real enforcement re-runs at buy time with
        // the actual purchase context.
        $rules = PaymentTierService::resolve($listedPrice, $chargeCurrency, Auth::user(), null);

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
