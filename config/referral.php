<?php

return [
    'reward_amount' => env('REFERRAL_REWARD_AMOUNT', 50),
    'currency' => env('REFERRAL_REWARD_CURRENCY', 'gbp'),

    /*
     * 🚨 THE ONE THRESHOLD A REFERRAL QUALIFIES AT (GBP lifetime GMV of the
     * REFERRED creator).
     *
     * This number decides whether a creator is paid `reward_amount` or nothing,
     * and it was written out by hand in FIVE places: the qualification short-cut
     * in `Helpers`, the progress bar on the referral page, the two counting
     * queries in `ReferAndEarnController`, and the figure the promo deck prints
     * to every creator on the platform. Four of those are read by the person
     * being paid and one is what actually pays them — so a drift does not fail,
     * it quietly promises a creator money at a number the payout query does not
     * agree with. Read it from here and nowhere else.
     */
    'qualifying_gmv' => env('REFERRAL_QUALIFYING_GMV', 1000),
];
