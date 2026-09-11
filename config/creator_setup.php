<?php

/**
 * The creator setup celebration — what a creator is told the moment their account is ready.
 *
 * 🚨 THE TARGET LIVES HERE AND NOWHERE ELSE. It is written on the popup, counted by the
 * progress strip and asserted by the tests, and a literal `3` at any of those call sites is
 * the same figure in a fourth place waiting to disagree with the other three. Same rule as
 * the price limits and the fee profiles.
 */
return [

    /*
     * How many listings the creator is asked for before their page is worth sharing.
     *
     * 🚨 THIS IS ENCOURAGEMENT, NOT A GATE. Nothing on the platform refuses a sale below
     * this number — one listing on a live page is the real threshold, enforced by the
     * eleven checkout gates, not here. (Identity gates the PAYOUT, never listing —
     * `EnsureIdentityVerifiedForListings` was deleted 10 Sep 2026.) A creator sitting on
     * two listings can be bought from today. Wiring this figure
     * into a refusal would turn a piece of coaching into a payment block, which is a
     * different feature and a much larger decision.
     */
    'listings_target' => 3,

];
