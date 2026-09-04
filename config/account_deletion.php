<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Why an account was deleted
    |--------------------------------------------------------------------------
    |
    | Client-supplied list, 4 Sep 2026. The KEY is what is stored on the
    | feedback row; the label is what the person reads. Storing the code and
    | not the sentence is what lets the wording be improved later without
    | rewriting history — the same rule `marketing_consent` versions follow.
    |
    | 🚨 MIRROR THIS FILE IN admin.spennypiggy.co. The two apps share one
    | database and the back office renders these labels for a code the website
    | wrote; a list that drifts shows an admin a raw code, or worse, the wrong
    | reason. Same rule as `fee_profiles` and `growth_bonus`.
    |
    | ⚠️ NEVER re-use or re-point a key. `other` must stay last in the UI and
    | must keep meaning "none of the above" — a stored code is only readable
    | against the list that was live when it was written.
    |
    */

    'reasons' => [
        'not_using_enough' => "I'm not using Spenny Piggy enough",
        'no_sales' => "I haven't made any sales",
        'fees_too_high' => 'Fees are too high',
        'prefer_another_platform' => 'I prefer another platform',
        'dont_understand_platform' => "I don't understand how the platform works",
        'payment_or_payout_issues' => "I'm having payment or payout issues",
        'onboarding_too_difficult' => 'Verification/onboarding is too difficult',
        'unhappy_with_features' => "I'm not happy with the features",
        'taking_a_break' => "I'm taking a break from creating",
        'no_longer_a_creator' => "I'm no longer a creator",
        'privacy_or_security' => 'Privacy or security concerns',
        'created_by_mistake' => 'I created the account by mistake',
        'other' => 'Other',
    ],

    /*
    | The code that requires the free-text box to be filled in. Every other
    | reason says what it means on its own; "Other" says nothing at all
    | without it, and a table full of bare `other` rows answers no question
    | anyone would ask of this feature.
    */
    'comment_required_for' => 'other',

    'comment_max' => 1000,

];
