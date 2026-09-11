<?php

return [

    /*
    |--------------------------------------------------------------------------
    | 🚨 RETIREMENT SWITCHES (11 Sep 2026, simplification programme §6)
    |--------------------------------------------------------------------------
    |
    | 🚨 TWO SWITCHES, SWITCHED OFF IN THAT ORDER — the `founder_bonus.php`
    | rule, restated. `enabled` stops NEW awards and takes down every surface;
    | `payouts_enabled` is what pays a creator whose window already closed with
    | a bonus owed. Turning the payer off first means somebody who earned 5% of
    | their first thirty days never receives it.
    |
    | ⚠️ Plain values, no env(): a scheme's retirement must not be reversible by
    | an environment variable nobody can see in the repository.
    */

    // Master switch. Off = no new fast_start_bonus_payouts rows, no window
    // tracking, no countdown or milestone alerts, no promo card, no creator
    // page. Existing rows and every admin screen are untouched.
    'enabled' => false,

    /*
     * 🚨 STILL TRUE. `bonus:process-fast-start` keeps settling the awards that
     * already exist; with `enabled` false none can be created, so the queue
     * only drains. Set false once no row is left at a payable status.
     */
    'payouts_enabled' => true,

    // The date the programme closed to new participation. Display only —
    // read by the published terms page's closed notice, never by the engine.
    'closed_on' => '2026-09-11',

    'bonus' => [
        // Duration of the earning window in days (from stripe_connected_at)
        'window_days' => env('FAST_START_WINDOW_DAYS', 30),

        // Days after window_end before payout eligibility
        'settlement_buffer_days' => env('FAST_START_SETTLEMENT_DAYS', 7),

        // Flat bonus rate when tiered mode is disabled
        'flat_rate' => env('FAST_START_BONUS_RATE', 0.05),

        // Enable tiered bonus rates (false = use flat_rate for all)
        'enable_tiered' => env('FAST_START_ENABLE_TIERED', false),

        // Tiered rates: earnings_minor threshold (pence) => bonus rate (decimal)
        // Applied to the highest bracket the creator's earnings reach.
        // Tier 1: earnings < £500  → 3%
        // Tier 2: £500 ≤ earnings < £2,000 → 5%
        // Tier 3: earnings ≥ £2,000 → 7%
        'tiered_rates' => [
            ['threshold' => 0,      'rate' => env('FAST_START_TIER1_RATE', 0.03)],
            ['threshold' => 50000,  'rate' => env('FAST_START_TIER2_RATE', 0.05)],
            ['threshold' => 200000, 'rate' => env('FAST_START_TIER3_RATE', 0.07)],
        ],
    ],

    'notifications' => [
        // Send email notifications for payout events
        'email' => env('FAST_START_EMAIL_NOTIFICATIONS', true),

        // Days before window close to send countdown push notifications
        'window_end_remind_days' => [7, 3],

        // Earnings milestone percentages to notify at (0–100)
        // Triggered by SendBonusProgressAlerts command
        'earnings_milestone_pcts' => [50, 80],
    ],

    'display' => [
        'currency_symbol' => env('FAST_START_CURRENCY_SYMBOL', '£'),
    ],

];
