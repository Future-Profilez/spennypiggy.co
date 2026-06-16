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