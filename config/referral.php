<?php

return [
    /*
    |--------------------------------------------------------------------------
    | Creator referral (new numbers, 11 Sep 2026 — simplification §5, W10)
    |--------------------------------------------------------------------------
    |
    | A creator refers another creator. When the referred creator reaches
    | `qualifying_gmv` in QUALIFYING SETTLED EARNINGS, the referrer is paid
    | `reward_amount`. One reward per referred creator, ever.
    |
    | ⚠️ MIRROR THIS FILE IN admin.spennypiggy.co — the `fee_profiles` rule.
    | The back office renders the threshold on its referral screens, and a
    | drifted copy shows an admin a bar filling at a figure the payer does not
    | agree with.
    */

    'reward_amount' => env('REFERRAL_REWARD_AMOUNT', 50),
    'currency' => env('REFERRAL_REWARD_CURRENCY', 'gbp'),

    /*
     * 🚨 THE ONE THRESHOLD A REFERRAL QUALIFIES AT (GBP qualifying settled
     * earnings of the REFERRED creator).
     *
     * This number decides whether a creator is paid `reward_amount` or nothing,
     * and it was written out by hand in FIVE places: the qualification short-cut
     * in `Helpers`, the progress bar on the referral page, the two counting
     * queries in `ReferAndEarnController`, and the figure the promo deck prints
     * to every creator on the platform. Four of those are read by the person
     * being paid and one is what actually pays them — so a drift does not fail,
     * it quietly promises a creator money at a number the payout query does not
     * agree with. Read it from here and nowhere else.
     *
     * 🚨 RAISED 1,000 → 2,000 ON 11 Sep 2026 (client, simplification §5).
     *
     * ⚠️ IT IS NOT READ BY AN EXISTING REFERRAL. Every `creator_referrals` row
     * carries its OWN `qualifying_threshold`, snapshot when the row was created
     * — see `honour_in_flight_at_old_threshold` below. This value is the
     * threshold a row created FROM NOW ON is stamped with.
     */
    'qualifying_gmv' => env('REFERRAL_QUALIFYING_GMV', 2000),

    /*
     * 🚨 IN-FLIGHT REFERRALS — RECORDED DECISION, AND IT IS THE CLIENT'S TO
     * CHANGE (retirement plan §Scheme 4: "somebody who referred a creator under
     * the old terms and is part-way to qualifying must not silently have the
     * goalposts moved").
     *
     * TRUE (the shipped default) — a referral created before 11 Sep 2026 keeps
     * the £1,000 it was made under. Its threshold is stamped on the row by the
     * backfill in migration `2026_09_11_100001`, so this switch changes nothing
     * about how a row is READ; it is here to record the decision and to say
     * where it lives.
     *
     * FALSE — migrate them: run `referrals:migrate-threshold --apply`, which
     * rewrites `qualifying_threshold` on rows not yet qualified. It deliberately
     * NEVER touches a row that has already qualified or been paid: historic
     * records keep their original values.
     */
    'honour_in_flight_at_old_threshold' => true,

    /*
     * The threshold in force before 11 Sep 2026. Kept so the backfill, the
     * migration command and any report can name it rather than a literal.
     */
    'legacy_qualifying_gmv' => 1000,

    /*
     * 🚨 FRAUD CONTROLS. A referral reward is real money paid for a signup, so
     * the cheap attack is to sign up as your own referral.
     *
     * `min_referred_account_age_days` — a referred creator must have existed
     * this long before their referral can qualify. Zero disables it.
     *
     * ⚠️ Self-referral is refused structurally at capture (the referrer may not
     * be the referred user) and is NOT a config option — see
     * `CreatorReferralService::blockReasonFor()`.
     */
    'fraud' => [
        'min_referred_account_age_days' => (int) env('REFERRAL_MIN_ACCOUNT_AGE_DAYS', 0),

        // Refuse to qualify a referral where the two creators share a signup IP.
        // ⚠️ A shared IP is a SIGNAL, not proof — a household, an office and a
        // mobile carrier's NAT all produce one — so it blocks the automatic
        // qualification and leaves the row for an admin, never deletes it.
        'block_shared_signup_ip' => (bool) env('REFERRAL_BLOCK_SHARED_IP', true),
    ],
];
