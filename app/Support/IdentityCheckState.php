<?php

namespace App\Support;

use App\Models\User;

/**
 * What a creator's ID check is ACTUALLY doing right now.
 *
 * 🚨 `users.identity_status = 2` is written when the Stripe Identity session is
 * CREATED (`StripeController::createVerificationSession`), not when a document is
 * submitted. Stripe sends no event for a closed tab, so a creator who opened the
 * passport check and walked away sat on 2 forever — and every surface read 2 as
 * "with our team", telling them to wait for an answer that could never arrive.
 *
 * `users.identity_session_status` carries Stripe's own session status, so the two
 * cases are separable:
 *
 * - `requires_input` (or NULL, for rows written before this column existed) — the
 *   ball is with the CREATOR. They have not finished.
 * - `processing` — documents submitted, Stripe is deciding. A genuine wait.
 * - `verified` / `canceled` — terminal; `identity_status` carries the outcome and
 *   this column is only the audit trail of the session that produced it.
 *
 * ⚠️ A FAILED check is not one of these: `handleRequiresInputEvent` writes
 * `identity_status = 0` plus a stored reason, so a failure leaves state 2 entirely.
 */
final class IdentityCheckState
{
    /** Session open, nothing submitted yet — or the creator has to try again. */
    public const REQUIRES_INPUT = 'requires_input';

    /** Documents submitted; Stripe is deciding. The only genuine "wait for us" state. */
    public const PROCESSING = 'processing';

    public const VERIFIED = 'verified';

    public const CANCELED = 'canceled';

    /** `identity_status`: the check is open and waiting on somebody. */
    public const STATUS_OPEN = 2;

    /**
     * Stripe is deciding — the creator has done their part and must not be chased.
     */
    public static function isProcessing(User $creator): bool
    {
        return (int) ($creator->identity_status ?? 0) === self::STATUS_OPEN
            && $creator->identity_session_status === self::PROCESSING;
    }

    /**
     * The session is open but nothing was ever submitted — the creator's own move.
     *
     * ⚠️ NULL counts as unfinished, deliberately. Every row that predates the column
     * is a session we only ever knew as "created", and the abandoned case is the one
     * that needs telling; showing "finish your check" to somebody Stripe is already
     * processing costs them one wasted click, while the reverse costs them the
     * account. The reconcile command settles the real answer within a day.
     */
    public static function isUnfinished(User $creator): bool
    {
        return (int) ($creator->identity_status ?? 0) === self::STATUS_OPEN
            && ! self::isProcessing($creator);
    }

    /**
     * Everything that has to move together when a check passes.
     *
     * 🚨 THREE PATHS MARK A CREATOR VERIFIED — the `verified` webhook, `identity:reconcile`
     * repairing a webhook that never landed, and `createVerificationSession` finding an
     * already-passed session when the creator comes back. A field written by only some of
     * them leaves the creator verified on one screen and not on another: the review that
     * caught this found `identity_admin_status` left at 2 (rejected) beside a green tick.
     *
     * @return array<string, mixed>
     */
    public static function verifiedAttributes(): array
    {
        return [
            'identity_status' => 1,
            'identity_session_status' => self::VERIFIED,
            'identity_session_updated_at' => now(),
            'identity_verified_at' => now(),
            'identity_verification_details' => null,
            // A passed check clears the previous failure — otherwise the profile keeps
            // rendering the old rejection reason next to a green "verified" tick.
            'identity_verification_error' => null,
            /*
             * 🚨 BACK INTO THE QUEUE, NEVER STRAIGHT TO APPROVED (4 Sep 2026,
             * client direction).
             *
             * 0 means "a person still has to look". Two things depend on it
             * being written rather than left alone: a creator who was REFUSED
             * carries a stale 2, which reads as rejected on their own page and
             * puts them in no queue at all — verified by Stripe and invisible to
             * everybody; and a fresh document is a fresh thing to judge, so an
             * earlier sign-off does not carry over to it.
             *
             * It used to be written to 1 in this array, so the admin sign-off was
             * stamped in the same second Stripe returned a pass and no person ever
             * looked. Measured on the live database: 4 of the 6 reviewed rows had
             * `identity_admin_reviewed_at` within a second of `identity_verified_at`.
             *
             * The reason a human is needed at all: **Stripe checks the DOCUMENT, not
             * the person.** It proves the passport is real and the selfie matches the
             * passport — not that the holder is the person on the profile photo and
             * the social accounts. Somebody using another person's ID passes every
             * automated check there is.
             *
             * Leaving it at 0 does NOT block the creator: the listing gate reads
             * `identity_status`, which is 1 here. It only puts them in the admin
             * sign-off queue.
             */
            'identity_admin_status' => 0,
            // ⚠️ Cleared with it, or the row says a review happened on a date
            // that belongs to a decision about a different document.
            'identity_admin_reviewed_at' => null,
        ];
    }

    /**
     * Does this session's document meet the passport-only rule?
     *
     * ⚠️ TRUE when no document type is present: a redacted or partially expanded session
     * carries no `verified_outputs`, and refusing on missing data would fail creators for
     * a privacy measure the platform itself asked for. The `verified` WEBHOOK is where a
     * wrong document type is rejected and the creator told why — callers outside that path
     * use this only to decline to mark somebody verified, never to fail them.
     */
    public static function documentTypeAllowed($session): bool
    {
        $type = data_get($session, 'verified_outputs.document.type')
            ?: data_get($session, 'last_verification_report.document.type');

        return blank($type) || strtolower((string) $type) === 'passport';
    }

    /**
     * Record Stripe's session status against the creator.
     *
     * Kept off `update()` so callers can batch it with the other identity columns
     * they are already writing in one save.
     *
     * @return array<string, mixed>
     */
    public static function attributes(string $sessionStatus): array
    {
        return [
            'identity_session_status' => $sessionStatus,
            'identity_session_updated_at' => now(),
        ];
    }
}
