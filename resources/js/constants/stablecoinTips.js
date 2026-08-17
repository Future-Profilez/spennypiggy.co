/**
 * Stablecoin Tips — marketing copy and the switch that publishes it.
 *
 * ⚠️ THE FEATURE IS NOT BUILT. Provider is Coinflow (account approved); the
 * production build is gated on legal review and on Coinflow confirming their
 * payout mechanics. Nothing in the codebase implements it — there is no route,
 * no model, no provider adapter. This file exists so the landing page can
 * announce it as COMING, and so that announcement can be pulled in one edit.
 *
 * ⚠️ Every claim below is checked against the agreed specification
 * ("Stablecoin Tip — Agreed Specification", 6 Aug 2026). Four things the first
 * draft of the marketing copy claimed are NOT in that spec and are deliberately
 * absent here — do not put them back without a spec change:
 *
 *   1. "Doesn't wait for the Friday payout."  The spec says the opposite:
 *      "Where practical, Coinflow payouts should follow the normal Friday
 *      rhythm", and whether Coinflow supports scheduled payouts at all is
 *      listed as unconfirmed. Promising faster money than the platform can
 *      deliver is the most expensive claim on this page to get wrong.
 *   2. "No Spenny Piggy reserve."  Whether a reserve applies is an OPEN item
 *      owned by the client and Coinflow. It depends on whether Coinflow holds a
 *      balance on our behalf, which is unanswered.
 *   3. "$5 to $1,000 per tip."  The spec's table states £5–£1,000, and flags
 *      the GBP-vs-USD denomination as unresolved and blocking. £1,000 is roughly
 *      $1,270 — materially different caps. No amount is published until it is
 *      settled.
 *   4. "No wallet needed — supporters just press the button."  Not stated
 *      anywhere in the spec. Coinflow's pay-in experience is unverified, and
 *      whether USDC pay-in is even enabled on the account is an open question.
 *
 * What IS in the spec and is safe to say: it is a voluntary, content-free tip in
 * USDC; it settles through Coinflow, independently of Stripe; the creator
 * receives the full tip amount; it is opt-in for creators; and Coinflow pays out
 * to the US, UK, EU and Brazil.
 */

/**
 * Publishes the marketing. Turn OFF to remove the announcement from the landing
 * page — the section and the "ways to get paid" card both disappear and the
 * card count re-derives itself.
 */
export const STABLECOIN_TIPS_ANNOUNCED = true;

/**
 * Turn ON only when the feature actually ships. It flips the copy from future
 * tense to present tense; while false, every surface says "coming soon" and no
 * date is printed, because there is no date to print.
 */
export const STABLECOIN_TIPS_LIVE = false;

/** The one set of words. Do not retype any of these in a component. */
export const STABLECOIN_COPY = {
    flash: STABLECOIN_TIPS_LIVE ? "💠 New · Stablecoin tips" : "💠 Coming soon · Stablecoin tips",
    /**
     * The heading is the product, not a label for it. Every other way to earn on
     * this platform requires a deliverable — it is enforced in code — so "nothing
     * to make, nothing to send" is the one genuinely remarkable thing about this
     * one, and it is what the section is built around.
     */
    heading: "Nothing to make. Nothing to send.",
    body: STABLECOIN_TIPS_LIVE
        ? "Supporters can send you a straight tip in USDC. It is a voluntary tip — there is no content, no goods and no service given in exchange, and nothing for you to deliver."
        : "Supporters will be able to send you a straight tip in USDC. It is a voluntary tip — there is no content, no goods and no service given in exchange, and nothing for you to deliver.",
    points: [
        "Paid in USDC, settled through our payments partner",
        "A separate rail from your card and bank earnings — it keeps running independently",
        "You receive the full tip amount",
        "Opt in when you are ready; creators in the US, UK, EU and Brazil",
    ],
    /**
     * ⚠️ Reads "coming soon", never a launch date. The build has not started and
     * cannot start until legal review completes, so any date printed here is a
     * guess the page would be held to.
     */
    footnote: STABLECOIN_TIPS_LIVE
        ? "Availability depends on your country. Tips are voluntary and non-refundable except where required by law or approved under our refund policy."
        : "Coming soon, subject to final approval. Availability will depend on your country.",
    /**
     * The section's signature object: a Supporter Confirmation with the
     * deliverable line left BLANK.
     *
     * ⚠️ Every other payment on this platform is required to produce a
     * `Deliverable`. This is the only one that is not — so the absence is printed
     * on the platform's own document rather than described in a sentence. The
     * blank row is the focal point of the whole section; everything else on the
     * slip exists to make it read as a real record.
     *
     * ⚠️ NO AMOUNT IS PRINTED, deliberately. The agreed specification flags the
     * GBP-vs-USD denomination as unresolved and blocking, so a figure here would
     * publish a decision nobody has taken. The slip states the currency and
     * leaves the number out — which also keeps the blank row as the only gap the
     * eye lands on.
     */
    slip: {
        title: "Supporter confirmation",
        rows: [
            { k: "Type", v: "Voluntary tip" },
            { k: "Paid in", v: "USDC" },
            { k: "Settles", v: "Its own rail" },
        ],
        blankKey: "You deliver",
        blankValue: "nothing",
        stamp: STABLECOIN_TIPS_LIVE ? "Issued" : "Not issued yet",
    },
    /** The short form used on the ways-to-get-paid card. */
    card: {
        title: "Stablecoin Tips",
        line: "A straight tip in USDC. Voluntary, with nothing to deliver in return.",
        detail: STABLECOIN_TIPS_LIVE ? "Settles on its own rail" : "Coming soon",
    },
    /**
     * 🚨 Used where this sits BESIDE Stripe-processed buttons — the link-in-bio
     * page. Everything else a supporter can press on that page is a content
     * purchase settled by Stripe; this one is not, and saying so is what keeps
     * the two from reading as one offer.
     *
     * ⚠️ Naming the rail is the whole point, so do not shorten it to "separate
     * rail". Everywhere the distinction is not load-bearing, use `card.detail`
     * or `points`, which is why this is a separate key rather than a rewrite of
     * either.
     */
    railNote: STABLECOIN_TIPS_LIVE
        ? "Settles on its own rail — not through Stripe."
        : "When it arrives it will settle on its own rail — not through Stripe.",
};
