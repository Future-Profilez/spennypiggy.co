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
};

/**
 * Body text for a state, for the one-line `errorAlert(...)` call sites that
 * have no room for a full panel.
 */
export function riskMessageBody(key) {
    return RISK_MESSAGES[key]?.body ?? '';
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
