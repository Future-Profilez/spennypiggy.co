<?php

/*
|--------------------------------------------------------------------------
| Creator platform subscription
|--------------------------------------------------------------------------
| The mandatory platform subscription a creator pays to sell on SpennyPiggy.
|
| Client decision (31 July 2026): a creator is NOT charged until they make
| their first sale. Previously the card was taken at sign-up and charged
| three days later — before the creator had earned anything — which was the
| single largest drop-off point in creator onboarding.
|
| The card is still collected at exactly the same step, so the filter that
| keeps junk sign-ups away from identity verification and the admin queue is
| unchanged. Only the moment of the first charge moved.
|
| `free_until_first_sale` is deliberately a switch, not a hard-coded rule:
| the client's intent is to run it during the platform's early phase and to
| revisit charging from day one once there is a track record. Turning it off
| restores the old behaviour (a `legacy_trial_days` trial, then billing).
*/

return [

    'price' => (float) env('CREATOR_SUBSCRIPTION_PRICE', 8.99),

    'vat_rate' => (float) env('CREATOR_SUBSCRIPTION_VAT_RATE', 20),

    'currency' => 'GBP',

    /*
    | When true, the creator's card is saved but nothing is taken until their
    | first completed sale. When false, `legacy_trial_days` applies instead.
    */
    'free_until_first_sale' => (bool) env('CREATOR_SUBSCRIPTION_FREE_UNTIL_FIRST_SALE', true),

    /*
    | Stripe has no "infinite trial" — `trial_end` is always a timestamp. While
    | we wait for a first sale the subscription is parked on a trial this far
    | out, and SubscriptionActivationService ends it the moment a sale lands.
    |
    | Long enough that no genuine creator ever reaches it; short enough that a
    | dormant subscription does not sit in Stripe forever.
    */
    'free_period_days' => (int) env('CREATOR_SUBSCRIPTION_FREE_PERIOD_DAYS', 1095),

    /*
    | Only used when `free_until_first_sale` is false. This was the live rule
    | until 31 July 2026.
    */
    'legacy_trial_days' => (int) env('CREATOR_SUBSCRIPTION_TRIAL_DAYS', 3),

    /*
    | One set of words for every surface — the activate screen, the dashboard
    | card, the creator marketing pages, the Stripe Checkout line item and the
    | terms. `resources/js/constants/creatorSubscription.js` mirrors this for
    | the frontend; keep the two in step.
    |
    | `:price` renders the ex-VAT figure, `:total` the VAT-inclusive figure.
    | Content-compliance applies here as it does anywhere creator-facing.
    */
    'copy' => [
        'promise' => 'No charge until your first sale',
        'promise_long' => "Add your card now — you won't be charged anything until you make your first sale.",
        'price_line' => ':price + VAT / month, starting after your first sale',
        'reassurance' => 'If you never make a sale, you never pay.',
        'checkout_name' => 'SpennyPiggy creator subscription',
        'checkout_description' => "Charged only after your first sale — :price + VAT per month. You won't be charged today.",
        'active_price_line' => ':price + VAT / month',

        /*
        | The digital-content waiver. Stored verbatim on the monthly_charges row
        | the creator ticked it on, so the record says what was agreed, not just
        | when. Change the wording and existing rows keep the wording they were
        | actually shown — which is the point of storing it.
        */
        'waiver' => 'I understand my creator tools are available immediately, that nothing is charged until my first sale, and that my subscription is then :price + VAT per month until I cancel.',
    ],

];
