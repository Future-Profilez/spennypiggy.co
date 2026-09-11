<?php

namespace App\Support;

use App\Models\User;
use Illuminate\Support\Facades\Log;

/**
 * What the creator's payout page says about their identity check.
 *
 * 🚨 NULL WHEN THEY HAVE EARNED NOTHING (client rule, 10 Sep 2026). A creator with no
 * money waiting is not asked to photograph their passport — there is nothing for it to
 * unlock yet, and asking reads as a demand rather than a prompt. They can still verify
 * early if they go looking; nothing blocks that, it is simply not advertised.
 *
 * 🚨 NULL WHEN THE CHECK IS COMPLETE. The page renders on the PRESENCE of this prop, so
 * an always-sent object is one truthiness slip away from telling every verified creator
 * they are unverified. Same rule as the suspension banner.
 *
 * ⚠️ THE AMOUNT AND THE DATE ARE PASSED IN, never recomputed here. They are the same
 * `upcoming_payout` and `payout_cycle` figures the rest of the page already renders — a
 * second source for them is a second answer, and the whole point of this panel is that
 * it names the money the creator is not receiving.
 *
 * ⚠️ NEVER THROWS. It is built inline in the payout page's payload, so a failure here
 * would turn a missing panel into a 500 on the creator's own finance page. House
 * pattern, same as `GrowthBonusPanelPayload` and `SetupCelebrationPayload`.
 */
class PayoutIdentityGatePayload
{
    /**
     * @param  float  $heldAmount  What the next run would pay them, in $currency.
     * @param  float  $heldReserves  Reserves waiting to be released, in $currency.
     * @param  ?string  $expectedAt  The payout date those funds would land on.
     * @return array<string, mixed>|null
     */
    public static function for(
        ?User $creator,
        float $heldAmount,
        float $heldReserves,
        string $currency,
        ?string $expectedAt,
    ): ?array {
        try {
            if (! $creator || (int) ($creator->role ?? 0) !== 1) {
                return null;
            }

            $state = PayoutEligibility::stateFor($creator);

            if ($state === PayoutEligibility::STATE_COMPLETE) {
                return null;
            }

            /*
             * ⚠️ Reserves count as earnings for this test. A creator whose whole balance
             * is sitting in a held reserve has unquestionably earned — and a reserve is
             * released by its own payout, which this gate also stops. Reading
             * `$heldAmount` alone would go quiet on exactly the creator whose money is
             * furthest from reaching them.
             */
            $total = $heldAmount + $heldReserves;

            if ($total <= 0) {
                return null;
            }

            $copy = PayoutEligibility::copyFor($state);

            return [
                'state' => $state,
                'title' => $copy['title'],
                'body' => $copy['body'],
                'cta' => $copy['cta'],
                'route' => self::routeFor($copy['route']),
                'held_amount' => round($heldAmount, 2),
                'held_reserves' => round($heldReserves, 2),
                'held_total' => round($total, 2),
                'currency' => strtoupper($currency ?: 'GBP'),
                'expected_at' => $expectedAt,
                /*
                 * ⚠️ Only ever populated for a refusal, and it is the reviewer's own
                 * words. Every other state's wording is fixed copy — a per-creator
                 * reason on a state nobody decided would be inventing one.
                 */
                'reason' => $state === PayoutEligibility::STATE_REJECTED
                    ? (filled($creator->identity_verification_error) ? (string) $creator->identity_verification_error : null)
                    : null,
            ];
        } catch (\Throwable $e) {
            Log::warning('PayoutIdentityGatePayload failed', [
                'user_id' => $creator?->id,
                'error' => $e->getMessage(),
            ]);

            return null;
        }
    }

    /**
     * ⚠️ `route()` THROWS for a name Ziggy does not carry, and this is built inside the
     * finance page's payload — one rename would 500 the page for every creator to render
     * a button. An unresolvable route drops the CTA instead.
     */
    private static function routeFor(?string $name): ?string
    {
        if (blank($name)) {
            return null;
        }

        try {
            return route($name);
        } catch (\Throwable) {
            return null;
        }
    }
}
