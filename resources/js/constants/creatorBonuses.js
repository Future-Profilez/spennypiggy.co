/**
 * Client-side mirror of the bonus configs — keep the two in step.
 *
 *   config/founder_bonus.php      → FOUNDER
 *   config/fast_start_bonus.php   → FAST_START
 *   config/referral.php           → REFERRAL
 *
 * These figures are printed on the paid-ads landing pages (`/creators/*`), which
 * are the pages Google Ads sends traffic to. A number that is wrong here is a
 * number in an advert, so it is imported — never retyped into a component.
 * Same rule as `creatorSubscription.js`.
 *
 * ⚠️ Every one of these is a QUALIFYING threshold, not a promise of earnings.
 * The copy below says so, and the pages must keep saying so — "no assured
 * earnings" is on the Founder page for a reason.
 */

/** config/founder_bonus.php */
export const FOUNDER = {
    /** limits.max_founder_seats */
    seats: 150,
    /** qualification.min_first_30d_earnings — NET, in the first 30 days */
    qualifyingNet: 2500,
    /** qualification.qualification_period_days */
    windowDays: 30,
    /** bonus.bonus_percentage */
    monthlyRate: 0.1,
    /** bonus.max_bonus_per_month */
    monthlyCap: 1000,
};

/** config/fast_start_bonus.php — bonus.flat_rate */
export const FAST_START = {
    rate: 0.05,
    windowDays: 30,
};

/** config/referral.php — reward_amount / currency */
export const REFERRAL = {
    amount: 50,
    currency: 'GBP',
    /**
     * The referred creator's lifetime GMV at which the reward is released.
     *
     * ⚠️ THIS ONE HAS NO CONFIG KEY. `config/referral.php` carries only
     * `reward_amount` and `currency`; the threshold is a literal `1000` in FOUR
     * PHP places — `PromoBannerService::REFERRAL_QUALIFYING_GMV`,
     * `Helpers.php:337`, `Helpers.php:357` and `CreatorReferral.php:79`. It is
     * mirrored here so the marketing pages stop retyping it as well; if it ever
     * moves, it has to move in five places until someone gives it a config key.
     */
    qualifyingGmv: 1000,
};

export const CURRENCY_SYMBOL = '£';

/** `2500` → `£2,500`. No decimals: these are round thresholds, not prices. */
export const money = (amount) =>
    `${CURRENCY_SYMBOL}${Number(amount).toLocaleString('en-GB')}`;

/** `0.05` → `5%`. */
export const percent = (rate) => `${Math.round(rate * 100)}%`;

/**
 * Per-feature price limits, GBP-equivalent.
 *
 * Mirrors `Helpers::priceWithinLimits()` and the per-feature validation in each
 * module's store/edit. Shown on the "7 ways to earn" page so a creator can see
 * what they are allowed to charge before signing up.
 */
export const PRICE_LIMITS = {
    min: 4.99,
    wish: 500,
    piggyPot: 500,
    piggyBank: 500,
    bills: 100, // per month
    memberships: 100, // per month
    shop: 10000,
    tasks: 10000,
};

/** `4.99` → `£4.99`, `10000` → `£10,000`. */
export const price = (amount) =>
    `${CURRENCY_SYMBOL}${Number(amount).toLocaleString('en-GB', {
        minimumFractionDigits: Number.isInteger(amount) ? 0 : 2,
        maximumFractionDigits: 2,
    })}`;
