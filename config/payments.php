<?php

/*
|--------------------------------------------------------------------------
| Payment method fee profiles & progressive tiers
|--------------------------------------------------------------------------
| The pricing model guarantees the creator always receives exactly the
| listed price; all fees are grossed-up into the supporter price
| (see Helpers::calculateStripeDirectChargeFlow).
|
| "card"  = cards + Apple Pay / Google Pay (wallets ride card rails).
| "bank"  = Pay by Bank (GBP/EUR), SEPA Direct Debit (EUR), ACH (USD).
|
| Rates are percentages (17 = 17%). Fixed fees are in the charge currency.
*/

return [

    'enabled' => env('BANK_PAYMENTS_ENABLED', false),

    'fee_profiles' => [
        'card' => [
            'platform_rate' => (float) env('PLATFORM_FEE_PERCENTAGE', 17),
            'compliance_rate' => (float) env('TRANSACTION_FEE_PERCENTAGE', 2),
            'stripe_rate' => 2.9,
            'stripe_fixed_fee' => 0.30,
        ],
        // Bank methods: total platform take presented to the client as 15%
        // (platform 13% + compliance 2%), with Stripe's cheaper bank
        // processing cost estimated separately for the gross-up.
        'bank' => [
            'platform_rate' => (float) env('BANK_PLATFORM_FEE_PERCENTAGE', 13),
            'compliance_rate' => (float) env('BANK_COMPLIANCE_FEE_PERCENTAGE', 2),
            'stripe_rate' => (float) env('BANK_STRIPE_FEE_PERCENTAGE', 1),
            'stripe_fixed_fee' => 0.0,
        ],
    ],

    // Stripe payment_method_types offered per charge currency for the
    // "bank" profile. EUR lists both: Stripe Checkout shows Pay by Bank
    // to FR/DE bank holders and SEPA to the rest.
    'bank_methods' => [
        'GBP' => ['pay_by_bank'],
        'EUR' => ['pay_by_bank', 'sepa_debit'],
        'USD' => ['us_bank_account'],
    ],

    'method_flags' => [
        'pay_by_bank' => env('PAY_BY_BANK_ENABLED', true),
        'sepa_debit' => env('SEPA_PAYMENTS_ENABLED', true),
        'us_bank_account' => env('ACH_PAYMENTS_ENABLED', true),
    ],

    /*
    | Progressive tiers (GBP-equivalent, per transaction):
    |  - amount <= open_max: every enabled method available.
    |  - open_max < amount <= card_max: bank recommended; card allowed only
    |    when buyer passes risk checks (soft prompt to bank on failure).
    |  - amount > card_max: bank required; card falls back to forced 3DS.
    */
    'tiers' => [
        'open_max_gbp' => (float) env('PAYMENT_TIER_OPEN_MAX', 250),
        'card_max_gbp' => (float) env('PAYMENT_TIER_CARD_MAX', 1000),
    ],
];
