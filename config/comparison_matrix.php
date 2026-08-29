<?php

/*
|--------------------------------------------------------------------------
| Feature matrix — the 21 fixed rows, and OUR column
|--------------------------------------------------------------------------
|
| Client spec "Comparison Build FINAL v4.3", 24 Aug 2026, Section 4.
|
| 🚨 THE ROWS ARE IDENTICAL AND IN THIS ORDER ON EVERY COMPARISON PAGE, and
| our column never changes. That is the whole point of the matrix: a creator
| reading /creators/vs/throne and then /creators/vs/patreon is comparing the
| same twenty-one questions in the same order. A competitor config supplies
| ONLY its own cell per row, keyed by `key` below — it can never add a row,
| reorder them, or restate ours.
|
| ⚠️ A competitor sheet missing a key here renders "Not stated", which is the
| spec's answer for "they do not say". It is never left blank and never
| guessed.
*/

return [

    /*
     * Cell vocabulary. A competitor cell may be one of these four and nothing
     * else — no prose, no hedging, no half-ticks. `NOT_STATED` is the default
     * for a row a sheet does not answer.
     */
    'values' => [
        'yes' => '✓',
        'no' => '✗',
        'coming_soon' => 'Coming soon',
        'not_stated' => 'Not stated',
    ],

    'rows' => [
        [
            'key' => 'exclusive_content',
            'label' => 'Sell exclusive content (unlock on payment)',
            'ours' => 'yes',
        ],
        [
            'key' => 'content_goals',
            'label' => 'Content Goals (sold toward a visible target)',
            'ours' => 'yes',
        ],
        [
            /*
             * ⚠️ "Piggy Bank", NOT the spec's own word "Tips".
             *
             * The client's sheet calls this row Tips. Tip/gift/donation
             * vocabulary is banned on every user-facing surface by the Stripe
             * content-first rule, and a standing prohibition beats a row label
             * in a brief — the same call already made on the A3 ad page. The
             * product is named Piggy Bank everywhere else in the app.
             */
            'key' => 'piggy_bank',
            'label' => 'Piggy Bank (supporter picks the amount, gets content)',
            'ours' => 'yes',
        ],
        [
            /*
             * ⚠️ "Paid Requests — paid up front, refunds handled for you", and
             * the wording is load-bearing. It is NOT escrow: the supporter pays
             * up front, the money is credited to the creator's balance straight
             * away, and what waits is the bank payout. The spec corrects this
             * wording everywhere (appendix), because "escrow" tells a creator
             * their money is being held.
             */
            'key' => 'paid_requests',
            'label' => 'Paid Requests — paid up front, refunds handled for you',
            'ours' => 'yes',
        ],
        [
            'key' => 'shop',
            'label' => 'Your Shop (digital and physical)',
            'ours' => 'yes',
        ],
        [
            'key' => 'recurring_content',
            'label' => 'Recurring Content on a schedule',
            'ours' => 'yes',
        ],
        [
            'key' => 'memberships',
            'label' => 'Memberships with tiers',
            'ours' => 'yes',
        ],
        [
            'key' => 'bio_link',
            'label' => 'Bio link supporters can buy from in one tap',
            'ours' => 'yes',
        ],
        [
            'key' => 'public_discovery',
            'label' => 'Public discovery on the platform',
            'ours' => 'yes',
        ],
        [
            'key' => 'keep_listed_price',
            'label' => 'You keep 100% of your listed price',
            'ours' => 'yes',
        ],
        [
            'key' => 'supporter_pays_fees',
            'label' => 'Supporter pays the fees at checkout',
            'ours' => 'yes',
        ],
        [
            'key' => 'free_until_first_sale',
            'label' => '£0 a month until your first sale',
            'ours' => 'yes',
        ],
        [
            'key' => 'weekly_payouts',
            'label' => 'Weekly payouts to your own bank',
            'ours' => 'yes',
        ],
        [
            'key' => 'delivery_record',
            'label' => 'Delivery record on every payment',
            'ours' => 'yes',
        ],
        [
            'key' => 'dispute_evidence',
            'label' => 'Dispute evidence gathered for you',
            'ours' => 'yes',
        ],
        [
            'key' => 'live_chat',
            'label' => 'Real people on live chat',
            'ours' => 'yes',
        ],
        [
            /*
             * 🚨 THIS ROW IS A RISK FACT, NOT A JUDGEMENT, AND IT IS FRAMED THAT
             * WAY ON PURPOSE.
             *
             * It is deliberately NOT "Strictly SFW ✓" for us and ✗ for them.
             * The question asked is "does this platform permit 18+ content",
             * because that is what changes how a bank and a payment provider
             * rate the platform — a fact about the platform, never a comment on
             * the creators using it. Spenny Piggy actively wants 18+ creators'
             * SFW income.
             *
             * ⚠️ A competitor cell here may NEVER read yes without a link to the
             * policy page that says so.
             */
            'key' => 'permits_adult',
            'label' => 'Permits 18+ content (a risk flag for banks and payment providers)',
            'ours' => 'No — SFW only',
            'ours_is_literal' => true,
        ],
        [
            'key' => 'pay_by_bank',
            'label' => 'Pay by Bank at a lower fee',
            'ours' => 'yes',
        ],
        [
            /*
             * ⚠️ Always "coming soon", with no timing, no network and no
             * settlement-speed claim anywhere near it.
             */
            'key' => 'stablecoin_tips',
            'label' => 'Stablecoin Tips',
            'ours' => 'coming_soon',
        ],
        [
            'key' => 'custom_pricing',
            'label' => 'Custom Pricing for high earners',
            'ours' => 'yes',
        ],
        [
            'key' => 'creator_bonuses',
            'label' => 'Creator bonuses paid on top',
            'ours' => 'yes',
        ],
    ],
];
