<?php

return [
    /*
    |--------------------------------------------------------------------------
    | Earn your membership back (simplification §5, 11 Sep 2026)
    |--------------------------------------------------------------------------
    |
    | £500 in qualifying settled creator earnings = one free future month of the
    | creator platform subscription. £1,000 = 2 months. £3,000 = 6.
    |
    | 🚨 IT IS A SUBSCRIPTION CREDIT AND IT IS NEVER CASH. A credit is spent
    | against the creator's own platform bill and against nothing else — it is
    | not withdrawable, not transferable, and it never creates an income
    | FinancialTransaction. (A bonus recorded as income would feed its own
    | qualifying total and earn the next credit on its own — the same loop
    | Fast Start, Referral and Growth Bonus all avoid structurally.)
    |
    | ⚠️ MIRROR THIS FILE IN admin.spennypiggy.co — the `fee_profiles` rule.
    | The back office renders the threshold, the months and the spend mode, and
    | a drifted copy tells an admin something the engine does not do.
    */

    /*
     * Master switch. Off = no new credits are earned, `membership-credits:*`
     * no-op, the creator's progress panel renders nothing, and the admin screen
     * says the scheme is off rather than showing a table of zeroes. Nothing is
     * deleted and already-earned credits are still spendable.
     */
    'enabled' => true,

    /*
     * 🚨 THE TWO KNOBS THE CLIENT ASKED TO BE CONFIGURABLE.
     *
     * Every `threshold_gbp` of qualifying settled earnings awards
     * `months_per_threshold` free months. The defaults reproduce all three
     * figures the client stated exactly: £500 → 1, £1,000 → 2, £3,000 → 6.
     *
     * ⚠️ A LADDER WAS DELIBERATELY NOT USED. The client's three points are
     * exactly linear, and a rung table would let the two disagree — a rung at
     * £3,000 paying 6 while the step is £500 is two answers to one question.
     */
    'threshold_gbp' => 500.00,
    'months_per_threshold' => 1,

    /*
     * A ceiling on how many months one creator can ever earn. Null = none.
     * ⚠️ This is a LIFETIME cap, counted over earned rows including spent ones —
     * a cap that resets when a credit is used is not a cap.
     */
    'max_months_per_creator' => null,

    /*
     * Only earnings from this date count. Credits are not backdated onto a
     * creator's whole history the day the scheme launches: the point is to
     * reward earning from here, and a launch that instantly hands a large
     * creator twelve free months was not what was agreed.
     *
     * ⚠️ Null would count everything ever. Do not set it to null without a
     * client decision.
     */
    'earnings_from' => '2026-09-11',

    /*
    |--------------------------------------------------------------------------
    | 🚨 D11 IS OPEN — BOTH ANSWERS ARE BUILT AND THE DEFAULT IS AUTOMATIC
    |--------------------------------------------------------------------------
    |
    | The client has not decided (a) whether a credit is spent automatically
    | against the next bill or held until the creator applies it, or (b) whether
    | credits expire. Both are config choices here and the engine honours
    | whichever is set; nothing about the earning half changes either way.
    */

    /*
     * 'automatic' — the daily `membership-credits:apply` command pushes credit
     *               onto the creator's Stripe customer balance, which Stripe
     *               then applies to their next invoice by itself.
     * 'manual'    — the credit sits at `earned` until the creator presses
     *               "Use a month" on their own subscription screen. The same
     *               code path runs; only who triggers it changes.
     */
    'spend_mode' => env('MEMBERSHIP_CREDIT_SPEND_MODE', 'automatic'),

    /*
     * 🚨 HOW MANY MONTHS MAY BE PUSHED TO STRIPE AT ONCE, in automatic mode.
     *
     * Stripe's customer credit balance carries over — a £64.74 credit against a
     * £10.79 invoice leaves £53.95 sitting there — so pushing six months at
     * once is indistinguishable from pushing one a month for six months EXCEPT
     * that the money is committed up front and cannot be un-pushed if the
     * creator's earnings are later refunded back below the rung. One at a time
     * keeps the reversal window open.
     */
    'auto_spend_max_per_cycle' => (int) env('MEMBERSHIP_CREDIT_AUTO_MAX', 1),

    /*
     * Months from being earned until an unused credit expires. Null = never
     * (the shipped default — a creator who earned a free month and has not been
     * billed yet has done nothing wrong).
     */
    'expiry_months' => null,

    /*
     * Belt and braces against a runaway sweep: a run larger than this is a
     * fault, not a busy day.
     */
    'max_per_run' => 500,
];
