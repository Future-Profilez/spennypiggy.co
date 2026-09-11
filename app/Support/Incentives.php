<?php

namespace App\Support;

/**
 * Is a creator incentive scheme live? One place, read by every surface.
 *
 * 🚨 ONE FLAG PER SCHEME TAKES DOWN EVERY SURFACE AT ONCE (simplification
 * programme §6, `docs/simplification-sept-2026/08-incentive-retirement.md`).
 * A half-retired scheme is worse than a live one: it advertises money that no
 * longer exists. The flags themselves live in each scheme's own config file —
 * this class is the single READ of them, so a new surface cannot invent its own
 * idea of "is this on" and a scanner can find every caller.
 *
 * 🚨 EACH SCHEME HAS A SEPARATE PAYER SWITCH, AND THE TWO ARE NOT THE SAME
 * QUESTION. `founderEnabled()` is "may somebody new qualify, and do we still
 * advertise it"; `founderPayoutsEnabled()` is "may money still go out to
 * somebody who already qualified". A creator who met the published condition
 * must still be paid, so the payer is switched off LAST — never in the same
 * change as the scheme.
 *
 * ⚠️ ADMIN SCREENS DO NOT READ THIS. Historic records stay readable whatever
 * these answer; a back office that empties when a scheme retires cannot answer
 * "what did we owe, and did we pay it".
 *
 * ⚠️ THE PUBLISHED TERMS PAGES DO NOT READ THIS EITHER — they read `closedOn()`
 * and render a dated closed notice above wording that is never rewritten. A
 * legal page cannot 404: anyone who agreed to it is entitled to read what they
 * agreed to.
 */
class Incentives
{
    /* -----------------------------------------------------------------
     | Retired 11 Sep 2026 — switched off, never deleted
     | ----------------------------------------------------------------- */

    public static function growthBonusEnabled(): bool
    {
        return (bool) config('growth_bonus.enabled', false);
    }

    /**
     * @see founderPayoutsEnabled() — same reasoning, same shape, deliberately.
     *
     * 🚨 THIS USED TO BE `growthBonusEnabled() && …`, on the grounds that the client
     * confirmed no live participants so there was nobody part-earned to strand. That
     * was true of the DATA on the day it was written and is not a property of the
     * mechanism: switch the scheme back on, award a rung, switch it off again, and the
     * payer stops with somebody owed — silently, because from the code's point of view
     * the scheme is merely closed. Made consistent with the other two 11 Sep 2026, at
     * no cost precisely because there is nobody to strand today.
     *
     * ⚠️ NOT `growth_bonus.payout.enabled` — that is the Phase 3 AUTOMATIC payout,
     * which is not built and is correctly false. "May we still pay a reward somebody
     * has already earned" is a different question, and conflating the two made closing
     * the scheme stop the manual release as well.
     */
    public static function growthBonusPayoutsEnabled(): bool
    {
        return (bool) config('growth_bonus.payouts_enabled', true);
    }

    public static function founderEnabled(): bool
    {
        return (bool) config('founder_bonus.enabled', false);
    }

    /**
     * 🚨 DELIBERATELY NOT `founderEnabled() && …`. The whole point of the second
     * switch is that it outlives the first: the scheme closes, and the payer
     * keeps running until the last honoured bonus has gone out.
     */
    public static function founderPayoutsEnabled(): bool
    {
        return (bool) config('founder_bonus.payouts_enabled', true);
    }

    public static function fastStartEnabled(): bool
    {
        return (bool) config('fast_start_bonus.enabled', false);
    }

    /** @see founderPayoutsEnabled() — same reasoning, same shape. */
    public static function fastStartPayoutsEnabled(): bool
    {
        return (bool) config('fast_start_bonus.payouts_enabled', true);
    }

    /* -----------------------------------------------------------------
     | Live
     | ----------------------------------------------------------------- */

    public static function membershipCreditsEnabled(): bool
    {
        return (bool) config('membership_credits.enabled', false);
    }

    /* -----------------------------------------------------------------
     | Terms pages
     | ----------------------------------------------------------------- */

    /**
     * The date a retired scheme closed to new participation, or null while it
     * is live. Rendered by the published terms page and by nothing else.
     */
    public static function closedOn(string $scheme): ?string
    {
        $date = match ($scheme) {
            'growth_bonus' => config('growth_bonus.closed_on'),
            'founder_bonus' => config('founder_bonus.closed_on'),
            'fast_start' => config('fast_start_bonus.closed_on'),
            default => null,
        };

        // A closed date on a scheme that is still switched on is a
        // contradiction, and the live scheme is the one to believe: the engine
        // is paying people.
        $live = match ($scheme) {
            'growth_bonus' => self::growthBonusEnabled(),
            'founder_bonus' => self::founderEnabled(),
            'fast_start' => self::fastStartEnabled(),
            default => true,
        };

        return $live ? null : ($date ? (string) $date : null);
    }

    /* -----------------------------------------------------------------
     | The shared Inertia payload
     | ----------------------------------------------------------------- */

    /**
     * What every page needs to know about which schemes exist.
     *
     * 🚨 THIS IS WHY A FOOTER LINK CAN BE RETIRED BY A CONFIG LINE. Most surfaces
     * are already prop-gated on the server, but the footer, the header and the
     * marketing pages render from JSX with no scheme prop of their own — and a
     * JS constant is always importable, which is exactly how a card once
     * advertised a route that 404s. Read `incentives.*` in JSX, never a
     * constant.
     *
     * ⚠️ Booleans and figures only: it is serialised into the page payload on
     * every request and must cost no query.
     *
     * @return array<string, mixed>
     */
    public static function payload(): array
    {
        return [
            'growth_bonus' => self::growthBonusEnabled(),
            'founder_bonus' => self::founderEnabled(),
            'fast_start' => self::fastStartEnabled(),
            'membership_credits' => self::membershipCreditsEnabled(),
            'referral' => [
                'reward' => (float) config('referral.reward_amount', 50),
                'threshold' => (float) config('referral.qualifying_gmv', 2000),
            ],
            'membership_credit' => [
                'threshold' => (float) config('membership_credits.threshold_gbp', 500),
                'months' => (int) config('membership_credits.months_per_threshold', 1),
            ],
        ];
    }
}
