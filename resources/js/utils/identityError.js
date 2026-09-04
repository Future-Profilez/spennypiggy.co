/**
 * Reads the failure payload stored on `users.identity_verification_error`.
 *
 * The creator-facing wording is resolved SERVER-side (App\Support\IdentityFailureReason)
 * and stored with the row, so this file deliberately holds no copy of its own —
 * the email and the profile can never drift apart, and an old failure keeps the
 * wording the creator was originally shown.
 */
export function parseIdentityError(raw) {
    if (!raw) return null;

    let data = raw;

    if (typeof raw === "string") {
        try {
            data = JSON.parse(raw);
        } catch {
            return null;
        }
    }

    if (!data || typeof data !== "object") return null;

    return {
        code: data.code || null,
        // Rows written before the map existed carry only code + reason, so fall
        // back to Stripe's own sentence rather than rendering an empty card.
        title:
            data.title ||
            (data.code
                ? String(data.code).replaceAll("_", " ")
                : "Your ID check didn’t go through"),
        whatHappened:
            data.what_happened ||
            data.reason ||
            "Stripe couldn’t complete your identity check this time.",
        whatToDo: Array.isArray(data.what_to_do) ? data.what_to_do : [],
        note: data.note || null,
        reason: data.reason || null,
        failedAt: data.failed_at || null,
    };
}

/** A flagged check can't be retried — the creator has to reach a human. */
export function isFraudFlagged(failure, identityStatus) {
    return failure?.code === "fraud_suspected" || Number(identityStatus) === 3;
}

/**
 * 2 = an identity session is OPEN. It says nothing about whether the creator
 * actually submitted anything — see isIdentityProcessing below.
 */
export function isIdentityPending(identityStatus) {
    return Number(identityStatus) === 2;
}

/**
 * The creator's documents are genuinely with Stripe.
 *
 * 🚨 `identity_status = 2` is written when the SESSION IS CREATED, not on submit,
 * and Stripe emits no event for a closed tab — so treating 2 as "being processed"
 * told every creator who opened the check and walked away to wait for an answer
 * nobody was going to send. `identity_session_status` carries Stripe's own status
 * ('requires_input' | 'processing' | 'verified' | 'canceled'); only 'processing'
 * means a document was submitted.
 */
export function isIdentityProcessing(identityStatus, sessionStatus) {
    return Number(identityStatus) === 2 && sessionStatus === "processing";
}

/**
 * Session open, nothing submitted — the creator's own move.
 *
 * ⚠️ A missing/NULL session status counts as unfinished: every row written before
 * that column existed was only ever known as "created", and `identity:reconcile`
 * settles the real answer against Stripe within a day.
 */
export function isIdentityUnfinished(identityStatus, sessionStatus) {
    return (
        Number(identityStatus) === 2 &&
        !isIdentityProcessing(identityStatus, sessionStatus)
    );
}
