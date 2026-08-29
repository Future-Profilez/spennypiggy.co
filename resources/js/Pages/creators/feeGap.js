/**
 * The cost difference between us and a competitor, without an exchange rate.
 *
 * Client direction, 29 Aug 2026: *"Split them down the middle on all comparison
 * pages. So we can show the difference in cost. And how small it is for the
 * extra benefits we provide."*
 *
 * 🚨 SUBTRACTING TWO CURRENCIES IS NOT A DIFFERENCE. Throne prices in USD and we
 * price in the creator's own currency, so £27.45 − $23.11 is a number with no
 * meaning. Converting at a live rate is worse in a different way: it puts a
 * figure on the page that moves daily and depends on a third party, on the one
 * page whose entire claim is that every number is sourced, dated and stable.
 *
 * The way out is that both worked examples pay the creator exactly 20 of their
 * OWN unit. So the comparable quantity is the RATIO — what a supporter pays per
 * 1 the creator receives — which is currency-free and exact. The gap between two
 * ratios, applied to our own listed price, is the difference in cost.
 *
 * ⚠️ A competitor ratio is only as flat as their fee structure. Throne's carries
 * a fixed $0.30, which is diluted on a larger sale, so at a £20-equivalent their
 * real ratio would be slightly LOWER than the one their $20 example gives — and
 * the gap this returns therefore UNDERSTATES the difference. That errs in THEIR
 * favour, which is the only safe direction for this page.
 *
 * ⚠️ Kept out of the component on purpose, so the arithmetic can be tested
 * without mounting Inertia, ziggy and the currency helpers — the same reasoning
 * as `Pages/leaderboard/measure.js`.
 */

/**
 * What a supporter pays per 1 unit the creator receives.
 *
 * @returns {number|null} null when either figure is missing or not a positive
 *   number — a link page quotes no total because it does not process the sale,
 *   and a ratio invented for it would be the one made-up figure on the page.
 */
export function payRatio(supporterPays, creatorReceives) {
    const paid = Number(supporterPays);
    const kept = Number(creatorReceives);

    if (!Number.isFinite(paid) || !Number.isFinite(kept) || kept <= 0 || paid <= 0) {
        return null;
    }

    return paid / kept;
}

/**
 * The gap between our rails and theirs, in OUR currency, on OUR example sale.
 *
 * ⚠️ Stated against our listed price because it is our sale being described;
 * their column contributes a ratio, never a converted total of theirs.
 *
 * @param {Array<{key:string,rail:string,ratio:number|null}>} ourRails
 * @param {number|null} theirRatio
 * @param {number} listed
 * @returns {Array<{key:string,rail:string,amount:number}>} empty when there is
 *   nothing honest to compare
 */
export function feeGaps(ourRails, theirRatio, listed) {
    if (!Number.isFinite(theirRatio) || theirRatio === null) {
        return [];
    }

    const price = Number(listed);

    if (!Number.isFinite(price) || price <= 0) {
        return [];
    }

    return ourRails
        .filter((rail) => Number.isFinite(rail.ratio) && rail.ratio !== null)
        .map((rail) => ({
            key: rail.key,
            rail: rail.rail,
            amount: (rail.ratio - theirRatio) * price,
        }));
}
