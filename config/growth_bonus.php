<?php

return [
    /*
    |--------------------------------------------------------------------------
    | Creator Growth Bonus (client brief 25 Aug 2026, confirmed 26 Aug 2026)
    |--------------------------------------------------------------------------
    |
    | Milestone bonus for the first 150 qualifying creators — up to £1,000 each
    | as they generate qualifying GMV (GROSS customer spend, before the platform
    | fee — unlike Founder/Fast Start which work on NET). The ladder below is
    | deliberately config-locked (client decision): per-creator overrides live
    | on the growth_bonus_profiles row (expires_at, gmv_adjustment, status),
    | never here. Reward rows are immutable records of what was promised, so a
    | later ladder change only affects thresholds not yet crossed.
    |
    | Payout rule (client, 26 Aug 2026): a bonus is paid in the SAME payout run
    | as the transaction that took the creator over the threshold — it follows
    | that transaction through the 7-day hold, so it lands 7–13 days after the
    | milestone is crossed. Never on a calendar schedule.
    |
    */

    /*
     * Master switch. **Edited HERE, not in .env** (client preference, 26 Aug
     * 2026) — there is deliberately no `GROWTH_BONUS_ENABLED` variable, so the
     * one place to look is this line.
     *
     * ⚠️ Turning it off takes down every entry point at once: `/growth-bonus`
     * 404s, the landing-page callout and the profile promo card disappear, the
     * dashboard widget renders nothing, and `growth-bonus:evaluate` no-ops.
     * Existing profile and reward rows are NOT deleted — the admin screens keep
     * working on them, so switching back on resumes rather than restarts.
     *
     * ⚠️ Config is cached in production (`config:cache` on deploy), so a change
     * here reaches the site on the next deploy, not instantly.
     *
     * ✅ ON SINCE 28 Aug 2026 (client approval). It was held off from 26 Aug while
     * the published terms carried clauses this engine did not honour; Part A and
     * Part B were corrected, the client signed both off, and it was switched on
     * with that deploy. Turning it off again is safe and reversible — no rows
     * are deleted and the admin screens keep working.
     */
    'enabled' => true,

    // Only creators whose Stripe Connect activation is ON or AFTER this date
    // are in the scheme (client, 26 Aug 2026). Earlier creators are excluded —
    // an admin can still add one by creating their profile row by hand.
    'launch_cutoff' => '2026-08-26',

    'limits' => [
        // First 150 creators to ACTIVATE (reach £100), not to register.
        'max_seats' => 150,
    ],

    'activation' => [
        // Days from stripe_connected_at to reach the activation threshold.
        'window_days' => 30,

        // GBP-equivalent qualifying GMV that activates the scheme (first rung).
        'threshold_gmv' => 100.00,
    ],

    // Months from ACTIVATION (not Stripe connection) to reach further
    // milestones. 0 or empty = no expiry. Per-creator extension is done on
    // growth_bonus_profiles.expires_at, not here.
    'expiry_months' => 12,

    /*
    | The ladder: cumulative qualifying GMV threshold => INCREMENTAL bonus
    | unlocked at that rung. Increments sum to £1,000. Cumulative bonus at each
    | rung matches the brief's table (£25, £50, £100, £150, £225, £300, £400,
    | £500, £650, £800, £1,000).
    */
    'ladder' => [
        ['gmv' => 100.00, 'amount' => 25.00],
        ['gmv' => 250.00, 'amount' => 25.00],
        ['gmv' => 500.00, 'amount' => 50.00],
        ['gmv' => 1000.00, 'amount' => 50.00],
        ['gmv' => 2500.00, 'amount' => 75.00],
        ['gmv' => 5000.00, 'amount' => 75.00],
        ['gmv' => 7500.00, 'amount' => 100.00],
        ['gmv' => 10000.00, 'amount' => 100.00],
        ['gmv' => 15000.00, 'amount' => 150.00],
        ['gmv' => 20000.00, 'amount' => 150.00],
        ['gmv' => 25000.00, 'amount' => 200.00],
    ],

    /*
     * ⚠️ THIS WHOLE FILE IS PLAIN VALUES — no `env()` anywhere, on purpose
     * (client preference, 26 Aug 2026). Every figure here was fixed by the
     * client and the ladder was already config-locked, so an env indirection
     * bought nothing and split "where is this set?" across two files. Change a
     * number here and deploy.
     */
    'display' => [
        'currency_symbol' => '£',
    ],

    /*
     * PHASE 3 — the automatic payout (30 Aug 2026).
     *
     * 🚨 APPROVING A BONUS NOW MOVES REAL MONEY. Before this it wrote a status
     * and nothing else; from here an approval is an instruction to pay, and
     * Stripe has no undo once the transfer is out.
     *
     * ⚠️ `payout_day` is ISO-8601 (1 = Monday … 5 = Friday) and matches
     * `payout:run-weekly`, so a bonus rides the platform's own payout rhythm
     * rather than inventing a second one.
     */
    'payout' => [
        // Master switch for the PAYMENT only. Off = approvals are recorded and
        // announced, and nothing is sent — which is exactly the Phase 1
        // behaviour, so turning it off is a safe retreat rather than a broken
        // half-state.
        'enabled' => true,

        // Friday, the day `payout:run-weekly` already uses.
        'payout_day' => 5,

        /*
         * ⚠️ A bonus approved ON the payout day waits for the NEXT one.
         * Announcing "today" and then paying in the same run is a race the
         * creator watches: the command runs at a fixed time, and an approval at
         * 16:00 on a Friday would name a date that had already passed.
         */
        'min_days_notice' => 1,

        // Belt and braces against a runaway loop; a run larger than this is a
        // fault, not a busy week.
        'max_per_run' => 200,
    ],
];
