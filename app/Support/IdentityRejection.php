<?php

namespace App\Support;

use App\Models\User;
use App\Services\SuspensionService;
use Illuminate\Support\Facades\Log;

/**
 * An admin refused a creator's ID check — apply it, and take it back.
 *
 * 🚨 THIS DOES NOT INVENT A SECOND WAY TO STOP MONEY. Everything the client
 * asked for on a rejection — incoming purchases refused, payouts frozen, the
 * page hidden, a banner on every screen carrying the reason and a route out —
 * already exists as `App\Services\SuspensionService` plus the
 * `identity_rejected` reason in `config/suspension.php`. A parallel money-stop
 * would be a second set of gates to keep in step with the nine checkout
 * controllers, and the two would disagree the first time one of them changed.
 *
 * ⚠️ WHAT IS NOT DONE HERE, DELIBERATELY: `identity_admin_status` and
 * `identity_status` are written by the ADMIN app, which owns the decision. This
 * class owns only the CONSEQUENCE, so the two apps cannot both half-apply it.
 */
class IdentityRejection
{
    /**
     * The one reason code an identity refusal ever writes.
     *
     * 🚨 Kept apart from the plain `identity` reason on purpose. That one means
     * "the check could not be completed" and sends the creator to support; this
     * one means "a person looked and said no", and the creator has something
     * specific they can do themselves.
     */
    public const REASON_CODE = 'identity_rejected';

    /**
     * Stop the money and hide the page, because an admin refused the check.
     *
     * ⚠️ NEVER THROWS. The caller is an admin request that has already written
     * the decision; failing here would leave a creator marked rejected with
     * nothing actually applied, which is the worst of both.
     */
    public static function apply(User $user, ?string $note = null, ?int $adminId = null): bool
    {
        try {
            /*
             * 🚨 A SUSPENSION SOMEBODY ELSE APPLIED IS NEVER OVERWRITTEN.
             * An account already stopped for a policy breach must not be
             * quietly re-labelled as an ID problem — and `lift()` below keys on
             * this code to decide what it may undo, so overwriting here would
             * let an identity re-verify release a policy suspension.
             */
            if ((int) $user->suspended_account === 1) {
                return false;
            }

            return app(SuspensionService::class)->suspend(
                $user,
                self::REASON_CODE,
                $note,
                $adminId
            );
        } catch (\Throwable $e) {
            Log::error('Could not apply identity rejection', [
                'user_id' => $user->id,
                'error' => $e->getMessage(),
            ]);

            return false;
        }
    }

    /**
     * Give the account back, once a fresh check is genuinely under way.
     *
     * 🚨 ONLY THE HOLD THIS PUT ON. The reason code is the guard: an admin may
     * have suspended the same creator for something entirely unrelated, and a
     * creator re-running their ID check must not be able to lift that by
     * pressing a button. Same rule the payout hold already follows
     * (`payout_pause_reason === 'Account suspended'`).
     */
    public static function lift(User $user): bool
    {
        try {
            if ((int) $user->suspended_account !== 1) {
                return false;
            }

            if ($user->suspension_reason_code !== self::REASON_CODE) {
                return false;
            }

            $service = app(SuspensionService::class);

            /*
             * ⚠️ `lift()` before `unsuspend()`: the first un-pauses the
             * supporter subscriptions at Stripe, the second clears the flag.
             * Done the other way round the account reads healthy for the
             * moments in between while its subscriptions are still paused, and
             * a failure in the middle leaves it that way permanently with
             * nothing to notice it.
             */
            $service->lift($user);

            return $service->unsuspend($user);
        } catch (\Throwable $e) {
            Log::error('Could not lift identity rejection', [
                'user_id' => $user->id,
                'error' => $e->getMessage(),
            ]);

            return false;
        }
    }

    /** Is this account currently stopped BECAUSE of an ID refusal? */
    public static function isRejected($user): bool
    {
        return (int) ($user->suspended_account ?? 0) === 1
            && ($user->suspension_reason_code ?? null) === self::REASON_CODE;
    }
}
