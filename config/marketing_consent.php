<?php

/*
|--------------------------------------------------------------------------
| Marketing consent wording
|--------------------------------------------------------------------------
|
| The single source of truth for what a person is shown when they opt in to
| marketing email, and for the version key recorded alongside their consent.
|
| 🚨 WHEN THE WORDING CHANGES, ADD A NEW VERSION — NEVER EDIT AN OLD ONE.
| `users.marketing_consent_version` stores the KEY, not the prose, precisely so
| that "what exactly did this person agree to in March" is still answerable
| after the copy is rewritten. Editing v1 in place destroys the evidence the
| column exists to preserve.
|
| Bump `current` and the signup form, the settings page and every new consent
| record follow automatically. Existing records keep pointing at the version
| they were actually given.
|
*/

return [

    // The version stamped on any consent captured from now on.
    'current' => 'v1',

    /*
     | Every wording that has ever been shown, keyed by version.
     |
     | `label` is what renders next to the checkbox. Keep it specific about what
     | the mail contains — a vague label is not informed consent, and it is the
     | text a regulator would be shown.
     */
    'versions' => [
        'v1' => [
            'label' => "Yes, I'd like to receive emails from Spenny Piggy about offers, promotions, new features, creator opportunities and tips to help me get more from my account.",
            'introduced' => '2026-08-23',
        ],
    ],

];
