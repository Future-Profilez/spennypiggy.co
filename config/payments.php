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

    /*
    | Fulfil bank payments immediately instead of waiting for settlement.
    |
    | Client decision (July 2026): "we can give them the content straight away.
    | If it doesn't settle, we block the gifter until they pay the debt."
    |
    | Even UK Pay by Bank is not paid at the moment the buyer returns (observed:
    | started 19:03, succeeded 19:04), so deferring meant the buyer got no
    | content and nobody got an email until the async webhook landed — and if
    | that webhook was missed, never. With this on, bank behaves like card at
    | the redirect and the webhook only acts as a backstop.
    |
    | Trade-off: SEPA/ACH can still be returned by the payer (8 weeks / 60 days),
    | so a failed settlement must be recovered via the debt flow
    | (async_payment_failed marks the payment failed and flags the buyer).
    */
    'instant_fulfilment' => env('BANK_INSTANT_FULFILMENT', true),

    'fee_profiles' => [
        // ⚠️ The Stripe estimate is what the supporter's price is grossed up
        // from, and the platform's cut goes to Stripe as a FIXED application
        // fee — so anything under-estimated here comes out of the CREATOR's
        // net, not ours, and does so silently.
        //
        // Raised 2.9 → 3.4 on 11 Aug 2026 (client decision). Stripe UK charges
        // roughly 1.5% + 20p on UK cards and 2.5% + 20p on EEA, both of which
        // 2.9% + 30p covered comfortably — but ~3.25% + 20p on international
        // cards, which it did not. Measured on a £100 listing, the creator was
        // receiving £99.64 instead of £100.
        //
        // 3.4% + 30p covers international at every price point from £4.99 to
        // £1,000 with margin to spare. The cost lands on the supporter: about
        // +0.65% on the total, so +84p on a £100 listing, paid by UK supporters
        // too. That trade — everyone pays slightly more, no creator is ever
        // short — was chosen over reconciling each charge after the fact.
        //
        // 🚨 NOT covered: Stripe's +2% currency conversion, which applies when
        // the charge currency differs from the connected account's settlement
        // currency. No flat estimate at this level absorbs that.
        'card' => [
            'platform_rate' => (float) env('PLATFORM_FEE_PERCENTAGE', 17),
            'compliance_rate' => (float) env('TRANSACTION_FEE_PERCENTAGE', 2),
            'stripe_rate' => (float) env('CARD_STRIPE_FEE_PERCENTAGE', 3.4),
            'stripe_fixed_fee' => (float) env('CARD_STRIPE_FIXED_FEE', 0.30),
        ],
        // Bank methods: total platform take presented to the client as 15%
        // (platform 13% + compliance 2%), with Stripe's cheaper bank
        // processing cost estimated separately for the gross-up.
        //
        // The Stripe cost MUST NOT be under-estimated: the gross-up derives the
        // supporter price from it, and anything we under-estimate comes out of
        // the creator's net. Observed live: a £15 listing charged £19.05 and
        // Stripe took £0.30 (a flat fee for Pay by Bank), but we'd assumed
        // 1% = £0.19 — so the creator received £14.89 instead of £15.00.
        // Now: flat 30p (Pay by Bank) plus a rate that also covers ACH's ~0.8%,
        // so the creator is never short on any bank rail. Tune per market via env.
        'bank' => [
            'platform_rate' => (float) env('BANK_PLATFORM_FEE_PERCENTAGE', 13),
            'compliance_rate' => (float) env('BANK_COMPLIANCE_FEE_PERCENTAGE', 2),
            'stripe_rate' => (float) env('BANK_STRIPE_FEE_PERCENTAGE', 0.8),
            'stripe_fixed_fee' => (float) env('BANK_STRIPE_FIXED_FEE', 0.30),
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
