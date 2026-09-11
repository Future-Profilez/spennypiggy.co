<?php

return [
    /*
    |--------------------------------------------------------------------------
    | Founder Bonus Configuration
    |--------------------------------------------------------------------------
    |
    | This file contains all configurable settings for the Founder Bonus system.
    | Only new members can qualify based on their first 30 days earnings.
    |
    */

    /*
    |--------------------------------------------------------------------------
    | 🚨 RETIREMENT SWITCHES (11 Sep 2026, simplification programme §6)
    |--------------------------------------------------------------------------
    |
    | 🚨 THERE ARE TWO SWITCHES AND THEY ARE SWITCHED OFF IN THAT ORDER, NEVER
    | TOGETHER. `enabled` stops NEW qualifications and takes down every surface;
    | `payouts_enabled` is what actually sends money to somebody who already
    | qualified. Turning the payer off first strands a creator who met the
    | published condition with a bonus that is never paid — which is the one
    | outcome retiring a scheme must not produce.
    |
    | ⚠️ Plain values, no env(), deliberately — the `growth_bonus.php` rule. One
    | line, one place to look. Config is cached on deploy, so a change here
    | lands on the next deploy.
    |
    | ⚠️ MIRROR THIS FILE IN admin.spennypiggy.co — the `fee_profiles` rule.
    |
    | 🚨 D8 IS OPEN AND IS NOT DECIDED HERE. Creators still INSIDE their 30-day
    | window when this switched off keep that window running: `enabled = false`
    | stops the qualification job, so nobody new qualifies — but the client has
    | not yet said whether somebody mid-window who would have qualified should
    | be honoured. Setting this back to `true` until their windows close is the
    | one-line way to honour them.
    */

    // Master switch. Off = no new qualifications, no founder page, no dashboard
    // tracker, no missed banner, no congratulation email, no promo card.
    // Existing founder_bonuses / founder_bonus rows and every admin screen are
    // untouched.
    'enabled' => false,

    /*
     * 🚨 STILL TRUE, AND DELIBERATELY SO. Somebody who qualified before the
     * scheme closed is owed the money. `ProcessFounderPayouts` and
     * `ProcessFounderMonthlyBonuses` keep running against the bonuses that
     * already exist; with `enabled` false no new ones can be created, so this
     * queue only ever drains.
     *
     * Set to false ONLY once `founder_bonuses` holds no row at
     * `payout_status = pending` or `approved`.
     */
    'payouts_enabled' => true,

    // The date the programme closed to new participation. Display only.
    'closed_on' => '2026-09-11',

    /*
    |--------------------------------------------------------------------------
    | Qualification Settings
    |--------------------------------------------------------------------------
    |
    | Configure the qualification requirements for new founders.
    |
    */
    'qualification' => [
        // Minimum earnings in first 30 days to qualify as founder (in GBP)
        'min_first_30d_earnings' => env('FOUNDER_MIN_FIRST_30D_EARNINGS', 2500.00),

        // Number of days from joining to calculate qualification earnings
        'qualification_period_days' => 30,
    ],

    /*
    |--------------------------------------------------------------------------
    | Monthly Bonus Settings
    |--------------------------------------------------------------------------
    |
    | Configure the monthly bonus calculation for qualified founders.
    |
    */
    'bonus' => [
        // Minimum monthly earnings to receive bonus (in GBP)
        'min_monthly_earnings' => env('FOUNDER_MIN_MONTHLY_EARNINGS', 2500.00),

        // Maximum monthly earnings for bonus calculation (in GBP)
        'max_monthly_earnings' => env('FOUNDER_MAX_MONTHLY_EARNINGS', 10000.00),

        // Bonus percentage (as decimal, e.g., 0.10 = 10%)
        'bonus_percentage' => env('FOUNDER_BONUS_PERCENTAGE', 0.10),

        // Maximum bonus amount per month (in GBP)
        'max_bonus_per_month' => env('FOUNDER_MAX_BONUS_PER_MONTH', 1000.00),

        // Extra multiplier on the qualification bonus for referred creators (added to 1.0).
        // e.g. 0.01 = +1% bonus on top of the standard 10%.
        'referral_multiplier' => env('FOUNDER_REFERRAL_MULTIPLIER', 0.01),
    ],

    /*
    |--------------------------------------------------------------------------
    | Program Limits
    |--------------------------------------------------------------------------
    |
    | Configure the limits and constraints for the founder program.
    |
    */
    'limits' => [
        // Maximum number of founder seats available
        'max_founder_seats' => env('FOUNDER_MAX_SEATS', 150),
    ],

    /*
    |--------------------------------------------------------------------------
    | Feature Flags
    |--------------------------------------------------------------------------
    |
    | Enable or disable specific features of the founder bonus system.
    |
    */
    'features' => [
        // Enable email notifications
        'email_notifications' => env('FOUNDER_EMAIL_NOTIFICATIONS', true),

        // Enable founder badges on profiles
        'show_badges' => env('FOUNDER_SHOW_BADGES', true),
    ],

    /*
    |--------------------------------------------------------------------------
    | Display Settings
    |--------------------------------------------------------------------------
    |
    | Configure how founder bonus information is displayed.
    |
    */
    'display' => [
        // Currency symbol to display
        'currency_symbol' => env('FOUNDER_CURRENCY_SYMBOL', '£'),
    ],
];
