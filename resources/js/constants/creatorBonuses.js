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
 *
 * 🚨 THREE OF THESE SCHEMES WERE RETIRED ON 11 Sep 2026 — FOUNDER, FAST_START
 * and GROWTH (simplification programme §6). THE CONSTANTS ARE KEPT, NOT
 * DELETED: the schemes are switched off, not removed, and their figures are
 * still needed by the admin screens' historic records and by the pages the
 * moment any of them is switched back on.
 *
 * 🚨 THIS FILE IS ALWAYS IMPORTABLE, WHICH IS EXACTLY THE TRAP. A surface that
 * decides WHETHER to draw a scheme by importing from here advertises a retired
 * one and links at a route that 404s. Decide with `useIncentives()`
 * (`@/lib/incentives`), which reads the server's own flags; use these only for
 * the numbers, once you have decided.
 */

/** config/founder_bonus.php — 🚨 RETIRED 11 Sep 2026. Gate on `useIncentives().founderBonus`. */
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

/**
 * config/growth_bonus.php — the milestone ladder, first 150 creators.
 *
 * 🚨 THESE ARE GROSS CUSTOMER-SPEND THRESHOLDS, NOT EARNINGS. Unlike FOUNDER
 * (net) and FAST_START (a rate on net), the Growth Bonus is measured on what the
 * customer spends before the platform fee — so a creator at the £100 rung has
 * received roughly £79. Every surface printing these must say "sales" or
 * "customer spend", never "earn £100".
 *
 * ⚠️ The live figures are served as props by `GrowthBonusController` wherever a
 * page can ask the server. This mirror exists for the marketing surfaces that
 * render without one, and must be kept in step with `config/growth_bonus.php`.
 */
/* 🚨 RETIRED 11 Sep 2026. Gate on `useIncentives().growthBonus`. */
export const GROWTH = {
    /** limits.max_seats */
    seats: 150,
    /** activation.threshold_gmv — GROSS customer spend, GBP-equivalent */
    activationGmv: 100,
    /** activation.window_days, from Stripe Connect activation */
    windowDays: 30,
    /** The sum of the ladder's increments */
    maxTotal: 1000,
    /** The first rung's reward */
    firstReward: 25,
    /** ladder length */
    milestones: 11,
    /** expiry_months, from activation */
    expiryMonths: 12,
};

/**
 * config/fast_start_bonus.php — bonus.flat_rate.
 *
 * 🚨 RETIRED 11 Sep 2026. Gate on `useIncentives().fastStart`.
 * ⚠️ The rate is 5% of NET, which is what the published terms say and what
 * `ProcessFastStartBonusPayouts` pays. Any surface saying otherwise is wrong.
 */
export const FAST_START = {
    rate: 0.05,
    windowDays: 30,
};

/**
 * config/referral.php — reward_amount / qualifying_gmv.
 *
 * ✅ LIVE, with NEW NUMBERS from 11 Sep 2026: £2,000 → £50 (was £1,000 → £50).
 *
 * 🚨 THE THRESHOLD MOVED AND EXISTING REFERRALS DID NOT. Every
 * `creator_referrals` row carries its own `qualifying_threshold`, stamped when
 * it was created, so somebody part-way to the old £1,000 is still judged at
 * £1,000. This constant is the figure a NEW referral is stamped with, and it is
 * what the marketing pages advertise.
 *
 * ⚠️ Prefer `useIncentives().referral` where a hook is available — it is served
 * from `config/referral.php` itself and cannot drift.
 */
export const REFERRAL = {
    amount: 50,
    currency: 'GBP',
    /** The referred creator's qualifying settled earnings at which £50 is released. */
    qualifyingGmv: 2000,
};

/**
 * config/membership_credits.php — "Earn your membership back".
 *
 * ✅ NEW 11 Sep 2026. Every £500 of qualifying settled earnings buys one free
 * month of the creator platform subscription. £1,000 = 2 months, £3,000 = 6.
 *
 * 🚨 IT IS A SUBSCRIPTION CREDIT AND NEVER CASH, and no surface may imply
 * otherwise — "a free month", never "£8.99 back".
 *
 * ⚠️ Prefer `useIncentives().membershipCredit` where a hook is available.
 */
export const MEMBERSHIP_CREDIT = {
    threshold: 500,
    months: 1,
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
