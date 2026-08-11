<?php

namespace App\Http\Controllers;

use App\Helpers;
use App\Services\PaymentMethodPricingService;
use App\Services\PaymentTierService;
use App\StripeControl;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;

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
            // Whose listing this is. Without it a creator on a bespoke rate is
            // QUOTED the standard price and CHARGED their own — the preview must
            // resolve exactly what checkout will resolve.
            //
            // Safe on a public endpoint: it discloses nothing a visitor cannot
            // already read off the listing page, and unlike `email` it cannot be
            // used to probe anyone's risk state.
            'creator_id' => ['nullable', 'integer', 'min:1'],
        ]);

        $itemCurrency = strtoupper($validated['currency']);
        $chargeCurrency = strtoupper($validated['charge_currency'] ?? $itemCurrency);

        $listedPrice = $itemCurrency === $chargeCurrency
            ? (float) $validated['amount']
            : (float) Helpers::priceFormat($itemCurrency, $validated['amount'], $chargeCurrency);

        $reserveRate = (float) ($validated['reserve_rate'] ?? 0);

        $prices = PaymentMethodPricingService::dualPrices(
            $listedPrice,
            $chargeCurrency,
            $reserveRate,
            isset($validated['creator_id']) ? (int) $validated['creator_id'] : null
        );

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
            // SEPA/ACH settle async (days) — the UI must warn before pay, not after.
            'delayed_settlement' => PaymentMethodPricingService::hasDelayedSettlement($chargeCurrency),
            'prices' => [
                'card' => $prices['card']['total_supporter_pays'],
                'bank' => $prices['bank']['total_supporter_pays'] ?? null,
                'saving' => $prices['saving'],
            ],
            'rules' => $rules,
        ]);
    }

    /**
     * Creator-facing: can THIS creator's connected account take bank payments,
     * and if not, is that fixable? Drives the "Enable bank payments" dashboard
     * card so support never has to run the backfill command by hand.
     */
    public function bankStatus()
    {
        $user = Auth::user();

        if (empty($user->account_id)) {
            return response()->json(['status' => true, 'state' => 'not_connected']);
        }

        try {
            $account = StripeControl::getAccount($user->account_id);
        } catch (\Throwable $e) {
            Log::error('bankStatus: failed to load connected account', ['user_id' => $user->id, 'error' => $e->getMessage()]);

            return response()->json(['status' => false, 'state' => 'error'], 502);
        }

        $eligible = StripeControl::bankCapabilitiesForCountry($account->country ?? null);

        // A country outside every bank scheme can never be enabled — the UI
        // must say "not supported in your region", not offer a broken button.
        if (empty($eligible)) {
            return response()->json(['status' => true, 'state' => 'unsupported_region', 'country' => $account->country]);
        }

        $caps = StripeControl::capabilitiesMap($account);
        $active = array_values(array_filter($eligible, fn ($c) => ($caps[$c] ?? null) === 'active'));
        $missing = array_values(array_diff($eligible, $active));

        return response()->json([
            'status' => true,
            'state' => empty($missing) ? 'active' : 'needs_enable',
            'country' => $account->country,
            'eligible' => $eligible,
            'active' => $active,
            'missing' => $missing,
        ]);
    }

    /**
     * Creator-facing self-service: request the missing bank capabilities on the
     * creator's OWN connected account. Idempotent — re-requesting an already
     * granted capability is a no-op on Stripe's side.
     */
    public function enableBank()
    {
        $user = Auth::user();

        if (empty($user->account_id)) {
            return response()->json(['status' => false, 'message' => 'Connect your payout account first.'], 422);
        }

        try {
            StripeControl::requestBankCapabilities($user->account_id);
        } catch (\Throwable $e) {
            Log::error('enableBank: capability request failed', ['user_id' => $user->id, 'error' => $e->getMessage()]);

            return response()->json(['status' => false, 'message' => 'Could not enable bank payments right now — please try again shortly.'], 502);
        }

        return $this->bankStatus();
    }
}
