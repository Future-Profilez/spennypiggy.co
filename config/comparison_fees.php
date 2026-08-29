<?php

/*
|--------------------------------------------------------------------------
| Fee rails shown on the comparison pages
|--------------------------------------------------------------------------
|
| Client spec "Comparison Build FINAL v4.3", 24 Aug 2026, Section 4.
|
| 🚨 CARD AND PAY BY BANK ARE NOT DEFINED HERE. They are read live from
| `config/payments.php` → `fee_profiles`, through
| `Helpers::calculateStripeDirectChargeFlow()`, which is the same code that
| charges a real supporter. That is the spec's own acceptance criterion:
| "Changing a rate in config/payments.php changes the supporter-pays figures on
| every page with no code change." A second copy of a live rate is a number that
| will eventually disagree with what the checkout charges, on the page whose
| entire claim is that it does not.
|
| This file exists for the ONE rail that has no fee profile because it does not
| charge anybody yet.
*/

return [

    /*
     * Stablecoin Tips — announced, not built.
     *
     * ⚠️ There is no `stablecoin` entry in `fee_profiles`, deliberately: that
     * array is the live charge path and adding a rail nobody can pay with would
     * put an unreachable option in front of the resolver. These figures are the
     * client's published intent and are labelled COMING SOON wherever they
     * appear.
     *
     * 🚨 NEVER add a timing, a network, or a settlement speed here or anywhere
     * near it. No settlement speed has been confirmed by anybody, and "instant"
     * / "immediate" / "seconds" are banned outright on these surfaces.
     */
    'announced' => [
        'stablecoin' => [
            'label' => 'Stablecoin Tips',
            'coming_soon' => true,
            'platform_rate' => 10,
            'compliance_rate' => 2,
            // No processing rate is published, so none is shown. The all-in
            // figure is the two rates above and nothing implied.
            'processing_note' => 'Provider rate',
        ],
    ],

    /*
     * The three-tier sentence, stated in exactly these words on every page.
     *
     * ⚠️ "Never 'cheapest'" is a spec rule. The claim is a shape — one rail
     * under, one level, one above — and the reason card runs above is stated in
     * the same breath, because that is what makes it an argument rather than an
     * apology.
     */
    'three_tier_line' => 'Stablecoin Tips undercut. Pay by Bank matches. Card runs above — because card carries the chargeback risk.',

    // The YouPay page compares against a different baseline; the spec gives it
    // its own wording rather than bending the sentence above.
    'three_tier_line_youpay' => 'Stablecoin Tips match. Pay by Bank runs a little above. Card runs above.',

    /*
     * What the £1 buys, said on the page rather than buried.
     *
     * ⚠️ The £1 is NOT hardcoded anywhere in the UI — it is `admin_fee` in the
     * breakdown, converted into the creator's currency by
     * `Helpers::administrationFeeInCurrency()`. Only this sentence is fixed.
     */
    'flat_fee_line' => '£1 covers the human review of every payment before it is paid out.',

    'creator_line' => 'You receive the price you list on every rail. No withdrawal fee, no instant-payout fee, no currency fee.',

    // The worked example every page shows. One number, one place.
    'example_price' => 20,
];
