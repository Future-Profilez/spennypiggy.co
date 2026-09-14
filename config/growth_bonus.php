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
     * ✅ ON 28 Aug 2026 (client approval) — 🚨 RETIRED 11 Sep 2026 (simplification
     * programme §6, `docs/simplification-sept-2026/08-incentive-retirement.md`).
     * The client confirmed NO live participants, so nothing part-earned was
     * taken away.
     *
     * 🚨 THIS ONE LINE TAKES DOWN EVERY SURFACE AND NOTHING ELSE WAS DELETED.
     * `/growth-bonus` 404s, the landing lead card and the profile promo card
     * vanish, the dashboard widget renders nothing, `growth-bonus:evaluate`,
     * `:announce` and `:pay` all no-op, and the milestone / approval / hold
     * mails stop. Profiles, rewards and every admin screen are untouched, so
     * switching this back to `true` RESUMES the programme rather than
     * restarting it.
     *
     * ⚠️ THE PUBLISHED TERMS PAGE IS THE ONE EXCEPTION AND STAYS REACHABLE.
     * `/growth-bonus-terms` is a legal document: anybody who agreed to it is
     * entitled to read what they agreed to. It renders a dated CLOSED notice
     * above wording that is never rewritten — see `closed_on` below.
     */
    'enabled' => false,

    /*
     * 🚨 THE PAYER OUTLIVES THE SCHEME, AND THAT IS THE WHOLE POINT OF A SECOND
     * SWITCH (11 Sep 2026). `enabled` above stops NEW qualifications; this keeps
     * paying rewards somebody has already earned. Switching this off is a separate,
     * later, deliberate act — done once the last honoured reward has gone out.
     *
     * ⚠️ Not to be confused with `payout.enabled` further down, which is the Phase 3
     * AUTOMATIC payout and is a different question entirely.
     *
     * ⚠️ Mirror this in the admin app, the `fee_profiles` rule.
     */
    'payouts_enabled' => true,

    /*
     * The date the programme closed to new participation. Read ONLY by the
     * terms page's closed notice — never by the engine, which is governed by
     * `enabled` above.
     *
     * 🚨 A DATE, NOT A BOOLEAN, because "closed" without "closed when" is not a
     * legal statement. Null while the scheme is live.
     */
    'closed_on' => '2026-09-11',

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
