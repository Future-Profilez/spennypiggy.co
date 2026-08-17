/**
 * Client-side mirror of the small number of risk messages a checkout screen
 * needs BEFORE it has a server response.
 *
 * `App\Support\RiskMessages` is the source of truth — everything the server
 * refuses arrives as a rendered `ui` object on the response and should be shown
 * with <RiskMessage />. Only the two guest gates below are decided in the
 * browser (to save a round trip into a checkout that will certainly be
 * refused), so only those need a copy here. Keep them byte-identical to the PHP.
 *
 * THE RULES THESE OBEY (client brief, 9 Aug 2026):
 *  1. Never reveal a threshold. The previous strings on these very screens read
 *     "Larger payments more than £50 need to login." — printing the exact line
 *     for anyone testing stolen cards to stay under. Eleven files said it.
 *  2. Never imply the person has done something wrong.
 *  3. Always give a next step.
 *
 * ⚠️ Do not add new states here. A message that only the server can decide
 * belongs in the PHP, or the two copies drift — which is precisely what
 * happened before: five spellings of "Guest checkout is disabled" across the
 * backend and the JSX.
 */

/**
 * The guest value gate.
 * ⚠️ The threshold is deliberately absent from the COPY. The comparison value
 * still lives in the bundle (below) because the pre-check runs in the browser,
 * but a number in minified JS is not the same as a sentence printed on screen.
 * The server (`Helpers::guestCheckoutRestriction`) is the real enforcement.
 */
export const GUEST_VALUE_THRESHOLD_GBP = 50;

export const RISK_MESSAGES = {
    // Mirrors GUEST_ACCOUNT_REQUIRED — guest checkout switched off platform-wide.
    GUEST_ACCOUNT_REQUIRED: {
        title: "You'll need an account for this one 🔐",
        body:
            "We're running some extra checks at the moment, so guest checkout is switched off for a bit.\n\n" +
            "Creating an account takes about a minute and means you can see everything you've bought in one place. " +
            "There's a one-off £1 card verification when you sign up — here's why.",
        next_step: 'Create an account — it takes about a minute.',
    },

    // Mirrors GUEST_ACCOUNT_REQUIRED_VALUE — this payment is large enough to
    // need an account. Says nothing about how large.
    GUEST_ACCOUNT_REQUIRED_VALUE: {
        title: "You'll need an account for this one 🔐",
        body:
            "For a payment this size we'll need you signed in. It means your purchase is tied to you — " +
            "you can find it again, and we can help if anything goes wrong.\n\n" +
            "Creating an account takes about a minute and means you can see everything you've bought in one place. " +
            "There's a one-off £1 card verification when you sign up — here's why.",
        next_step: 'Create an account — it takes about a minute.',
    },

    // Mirrors CREATOR_SUBSCRIPTION_INACTIVE (supporter variant) — the creator
    // cannot currently be paid.
    //
    // Browser-decided like the two above: every checkout screen already has a
    // `card_capabilities` prop and refuses before it posts, so it needs the copy
    // locally. The server says the same sentence through
    // `CreatorAvailabilityMessageService` when the same purchase reaches it.
    //
    // 🚨 It replaced six hand-written copies, two of which printed
    // "(Card Payments capability missing)" — an internal Stripe capability name,
    // on a buyer's screen, about somebody else's account. A supporter can do
    // nothing with it and it discloses the creator's payment setup to whoever
    // opens the page.
    //
    // ⚠️ This is NOT the posting-gate message. That one is server-decided
    // (`CREATOR_CONTENT_PAUSED`) because only the server knows whether the
    // creator is behind on posts — do not add it here.
    CREATOR_UNAVAILABLE: {
        title: "This creator's page is paused right now ⏸",
        body: "They'll be back shortly. Worth checking their socials in the meantime. 🐷",
        next_step: 'Check back shortly.',
    },
};

/**
 * Body text for a state, for the one-line `errorAlert(...)` call sites that
 * have no room for a full panel.
 */
export function riskMessageBody(key) {
    return RISK_MESSAGES[key]?.body ?? '';
}

/**
 * Headline for a state, for the call sites that render a panel rather than a
 * toast. Falls back to an empty string so a mistyped key degrades to a body
 * with no heading, never to `undefined` printed on screen.
 */
export function riskMessageTitle(key) {
    return RISK_MESSAGES[key]?.title ?? '';
}

/**
 * Send a guest to the login screen carrying the right explanation.
 * One helper so the redirect, the message and the return URL cannot be
 * assembled three different ways on three different screens.
 */
export function redirectToLoginWithMessage(key) {
    const message = riskMessageBody(key);
    const redirect = encodeURIComponent(window.location.href);
    window.location = `/login?redirect=${redirect}&message=${encodeURIComponent(message)}`;
}
