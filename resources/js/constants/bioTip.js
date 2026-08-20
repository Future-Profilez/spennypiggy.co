/**
 * The Tip button's words. The NUMBERS are not here — see below.
 *
 * 🚨 EVERY AMOUNT COMES FROM THE SERVER (`BioTipService::payload()`), never from
 * this file. The minimum, the maximum, the presets and the admin fee are all
 * enforced by `BioTipController`, and a second copy in JavaScript is a second
 * copy that will eventually offer an amount the server refuses. `constants/
 * stablecoinTips.js` holds the marketing copy for the same feature and follows
 * the same rule; this file is the in-product wording only.
 *
 * 🚨 NOTHING HERE MAY SAY "INSTANT", "IMMEDIATE" OR "SECONDS", AND NOTHING HERE
 * MAY NAME THE PAYMENT PROVIDER. Both are standing client prohibitions (Master
 * Plan, 19 Aug 2026) and the first is one no settlement speed has ever been
 * confirmed for. "Its own rail" is the agreed way to say that this does not go
 * through the card processor.
 *
 * ⚠️ It also never says WHEN. There is no launch date, so any date printed here
 * is a promise nobody made.
 */
export const BIO_TIP_COPY = {
    /** The greyed state's badge. The only thing that separates this from a claim. */
    comingSoon: "Coming soon",

    /** Above the amounts. A tip is the one thing here with nothing behind it. */
    chooseLabel: "Choose an amount",

    /** The custom field. */
    customLabel: "Or enter your own",
    customPlaceholder: "0.00",

    /**
     * ⚠️ The fee is ADDED to the tip, and the creator receives the tip in full.
     * Saying which way round it goes is the difference between a fee and a cut.
     */
    feeNote: "A £1 admin fee is added to your tip. Your creator receives the full amount you choose.",

    /**
     * ⚠️ "Indicative" is load-bearing. The charge is in USD; what that costs in
     * the supporter's own money is their bank's decision, not ours, and printing
     * our rate as if it were theirs is a claim we cannot honour.
     */
    fxNote: "Your local total is indicative. The rate is fixed at the moment you pay.",

    /** What a tip IS — the only payment on this platform with no deliverable. */
    natureNote: "A tip is voluntary. Nothing is unlocked and nothing is delivered in return.",

    action: "Send a tip",

    /** Shown while the rail is off, in place of the button's normal wording. */
    actionDisabled: "Not available yet",
};
