import { usePage } from '@inertiajs/react';

/**
 * Which creator incentive schemes exist right now, from the server.
 *
 * 🚨 READ THIS, NEVER `constants/creatorBonuses.js`, TO DECIDE WHETHER TO DRAW
 * SOMETHING. That file is a mirror of the configs and is always importable —
 * so a surface keyed on it advertises a scheme that has been retired and links
 * at a route that 404s. It is for the FIGURES; this is for the FLAGS.
 *
 * Four schemes were retired on 11 Sep 2026 (simplification programme §6) and
 * one flag per scheme has to take down every surface at once. On the server
 * that is `App\Support\Incentives`; here it is the `incentives` prop it shares
 * with every page.
 *
 * ⚠️ Defaults are FALSE and the figures fall back to the constants. A page
 * rendered before the prop existed (a cached SSR response, a test harness)
 * must draw nothing rather than draw a retired scheme.
 */
export function useIncentives() {
    const { incentives } = usePage().props;

    return {
        founderBonus: !!incentives?.founder_bonus,
        fastStart: !!incentives?.fast_start,
        growthBonus: !!incentives?.growth_bonus,
        membershipCredits: !!incentives?.membership_credits,
        referral: {
            reward: Number(incentives?.referral?.reward ?? 50),
            threshold: Number(incentives?.referral?.threshold ?? 2000),
        },
        membershipCredit: {
            threshold: Number(incentives?.membership_credit?.threshold ?? 500),
            months: Number(incentives?.membership_credit?.months ?? 1),
        },
    };
}
