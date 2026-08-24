<?php

namespace App\Services\Bio;

use App\Helpers;
use App\Models\User;
use App\Support\BioTipRail;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Log;
use RuntimeException;

/**
 * The stablecoin Tip flow, end to end, with one unimplemented seam.
 *
 * The whole flow the brief asks for is here and is testable today: the amount
 * rules, the presets, the £1 admin fee added to the value, the indicative
 * local-currency equivalent, and the freeze that makes "FX frozen at transaction
 * point" a real property rather than a sentence. What is NOT here is the call
 * that hands the order to a rail — see `send()`.
 *
 * 🚨 A TIP IS NOT A CONTENT PURCHASE AND MUST NOT BE ROUTED LIKE ONE. It creates
 * no `Deliverable` (there is nothing to deliver, which is the only remarkable
 * thing about it), it carries no `fee_profile`, it never touches
 * `Helpers::calculateStripeDirectChargeFlow`, and it is not a Stripe charge at
 * all. Every existing money rule in this codebase describes a purchase of
 * creator content; wiring a tip through them would misreport it as one.
 *
 * 🚨 NO COPY IN THIS CLASS NAMES A PROVIDER OR PROMISES A SETTLEMENT SPEED.
 * Both are standing client prohibitions. See `App\Support\BioTipRail` for the
 * unresolved Coinflow/Bridge question this is deliberately agnostic about.
 */
class BioTipService
{
    /**
     * Everything the Tip button needs to render, including whether it may be
     * pressed at all.
     *
     * ⚠️ The amounts are sent from the server rather than typed into the React
     * file, so the numbers the supporter sees and the numbers `quote()` enforces
     * are one definition. A preset list duplicated in JS is a preset list that
     * will eventually offer an amount the server refuses.
     *
     * @return array<string,mixed>
     */
    public static function payload(): array
    {
        return [
            'live' => BioTipRail::enabled(),
            'currency' => BioTipRail::CURRENCY,
            'stablecoin' => BioTipRail::STABLECOIN,
            'min' => BioTipRail::MIN,
            'max' => BioTipRail::MAX,
            'presets' => BioTipRail::PRESETS,
            'admin_fee' => [
                'amount' => BioTipRail::ADMIN_FEE_GBP,
                'currency' => BioTipRail::ADMIN_FEE_CURRENCY,
            ],
        ];
    }

    /**
     * Price a tip and FREEZE the rate it was priced at.
     *
     * The returned quote is the contract with the supporter: this tip, this fee,
     * this total, at this rate, until this moment. `send()` re-reads it rather
     * than re-converting, which is what "FX frozen at transaction point" means —
     * without it the supporter agrees to one number and is charged another when
     * the rail settles.
     *
     * ⚠️ `display` is INDICATIVE and is labelled as such wherever it renders. The
     * charge is in `currency`; the supporter's own bank or wallet decides what
     * that costs them, and printing our rate as if it were theirs is a claim we
     * cannot honour.
     *
     * @param  float  $amount  the tip, in BioTipRail::CURRENCY
     * @param  string|null  $displayCurrency  the visitor's own currency, for the
     *                                        indicative line only
     * @return array<string,mixed>
     *
     * @throws RuntimeException when the amount is outside the published range
     */
    public function quote(float $amount, ?string $displayCurrency = null): array
    {
        $error = self::amountError($amount);

        if ($error !== null) {
            throw new RuntimeException($error);
        }

        // Round to the cent BEFORE anything else — a quote is a figure someone is
        // charged, and a float carried through three conversions is not one.
        $amount = round($amount, 2);

        // The £1 admin fee, expressed in the tip's own currency at today's rate.
        $fee = round((float) Helpers::priceFormat(
            BioTipRail::ADMIN_FEE_CURRENCY,
            BioTipRail::ADMIN_FEE_GBP,
            BioTipRail::CURRENCY
        ), 2);

        $total = round($amount + $fee, 2);

        $display = strtoupper(trim((string) ($displayCurrency ?: BioTipRail::CURRENCY)));
        $frozenAt = Carbon::now();

        $quote = [
            // 🚨 The creator receives the tip; the fee is ADDED to it, never taken
            // out of it. Two different numbers, and the page prints both.
            'amount' => $amount,
            'admin_fee' => $fee,
            'total' => $total,
            'currency' => BioTipRail::CURRENCY,
            'stablecoin' => BioTipRail::STABLECOIN,
            'frozen_at' => $frozenAt->toIso8601String(),
            'expires_at' => $frozenAt->copy()->addSeconds(BioTipRail::QUOTE_TTL_SECONDS)->toIso8601String(),
        ];

        // The indicative line is omitted entirely when the visitor is already in
        // the charge currency, or when the rate is unavailable. An "approximately
        // $25.00" beside a $25.00 charge is noise; a silently wrong number is worse.
        if ($display !== BioTipRail::CURRENCY) {
            $converted = (float) Helpers::priceFormat(BioTipRail::CURRENCY, $total, $display);

            if ($converted > 0) {
                $quote['display'] = [
                    'currency' => $display,
                    'total' => round($converted, 2),
                    // The rate is stated so the frozen figure can be reproduced.
                    'rate' => round($converted / max($total, 0.01), 6),
                    'indicative' => true,
                ];
            }
        }

        return $quote;
    }

    /**
     * Is this a tip we would accept?
     *
     * ⚠️ Deliberately NOT `Helpers::priceWithinLimits`. That rule enforces the
     * Stripe content-first per-feature price bands (£4.99 minimum, per-module
     * maximums) on a purchase of creator content. A tip is not a purchase, is not
     * denominated in GBP, and has its own published range — running it through
     * the content rule would apply the wrong floor and the wrong ceiling and
     * would misreport a tip as a content sale.
     */
    public static function amountError(float $amount): ?string
    {
        if (! is_finite($amount) || $amount <= 0) {
            return 'Enter an amount.';
        }

        if (round($amount, 2) < BioTipRail::MIN) {
            return 'The smallest tip is $'.number_format(BioTipRail::MIN, 2).'.';
        }

        if (round($amount, 2) > BioTipRail::MAX) {
            return 'The largest tip is $'.number_format(BioTipRail::MAX, 0).'.';
        }

        return null;
    }

    /**
     * 🚨 THE ONE SEAM, AND THE ONLY THING NOT BUILT.
     *
     * Everything above — the amounts, the fee, the freeze, the validation, the UI
     * and its flag — is finished and switched off. This is the single call that
     * would hand a frozen quote to the stablecoin rail, and it cannot be written
     * yet for two reasons that are not ours to resolve: we have no access to the
     * rail, and our own documents disagree about which one it is (see
     * `App\Support\BioTipRail`).
     *
     * ⚠️ IT REFUSES RATHER THAN PRETENDING. A stub that returned success would
     * put a "thank you" in front of a supporter whose money never moved, which is
     * the worst possible failure on a payment surface. It throws, the controller
     * answers 503, and the button is greyed out in front of it anyway.
     *
     * ⚠️ When the rail lands, everything it needs is already decided here: the
     * creator, the frozen quote, and an idempotency key the caller must supply —
     * the same rule every payout in this codebase follows, so a retry can never
     * double-send.
     *
     * @param  array<string,mixed>  $quote  a quote from quote(), unmodified
     *
     * @throws BioTipUnavailableException always, while the rail is unavailable
     */
    public function send(User $creator, array $quote, string $idempotencyKey): never
    {
        Log::info('Bio tip attempted while the rail is unavailable', [
            'creator_id' => $creator->id,
            'total' => $quote['total'] ?? null,
            'currency' => $quote['currency'] ?? null,
            'idempotency_key' => $idempotencyKey,
        ]);

        throw new BioTipUnavailableException;
    }
}
