<?php

namespace App\Support;

use App\Models\User;
use Illuminate\Support\Facades\Log;

/**
 * One reading of "is this account suspended", and one source for what it is told.
 *
 * 🚨 THREE SEPARATE GATES ENFORCE A SUSPENSION AND THEY DO NOT SHARE A CALLER.
 * Each closes a hole the others structurally cannot:
 *
 *   1. `CheckSuspendedUser` — the account holder's own session. Reads open,
 *      writes denied. Cannot see a guest.
 *   2. `CreatorSubscriptionService::validateCreatorSubscription` — money coming
 *      IN. Keyed on the payee row, so it covers guest Piggy Pot and guest Wish
 *      checkout, which have no session at all.
 *   3. `SuspendedAccount::blocksPayer()` in the checkout controllers — money
 *      going OUT. Some purchases start on a GET (`bill/checkout/{uuid}`,
 *      `membership/checkout/{uuid}`), which gate 1 deliberately lets through.
 *
 * Removing any one of them leaves a live path. Do not "simplify" them into one.
 */
class SuspendedAccount
{
    /** The status code the checkout gates record and report. */
    public const REASON = 'creator_suspended';

    public static function isSuspended($user): bool
    {
        return $user instanceof User && (int) $user->suspended_account === 1;
    }

    /**
     * True when this person may not send money.
     *
     * A suspended account is barred from paying as well as from being paid — the
     * same row is both a creator and a supporter on this platform, and a
     * suspension that only stopped income would leave them spending on it.
     */
    public static function blocksPayer($user): bool
    {
        return self::isSuspended($user);
    }

    /**
     * The creator-facing headline, sentence, tone and way out.
     *
     * 🚨 THE ADMIN'S FREE TEXT IS NEVER RETURNED. `suspension_note` is an
     * internal case file; the code maps to copy we are willing to stand behind
     * on somebody's own dashboard. An unrecognised or missing code — every
     * account suspended before the column existed — gets the default, which
     * states the fact and points at support rather than inventing a cause.
     *
     * 🚨 `tone` IS PART OF THE MESSAGE, NOT STYLING. "Suspended" is for an
     * account a person judged; an unpaid subscription or an unfinished ID check
     * reads "limited", because telling somebody they are suspended for a missed
     * payment says they did something wrong when they only left something
     * undone. See config/suspension.php.
     *
     * @return array{code:?string, title:string, body:string, tone:string, action:?array{label:string,url:string}, suspended_at:?string}
     */
    public static function copyFor($user): array
    {
        $code = $user instanceof User ? $user->suspension_reason_code : null;

        $reasons = (array) config('suspension.reasons', []);
        $default = (array) config('suspension.default_reason', []);
        $copy = ($code && isset($reasons[$code])) ? $reasons[$code] : $default;

        return [
            'code' => $code,
            'title' => $copy['title'] ?? 'Your account is suspended',
            'body' => $copy['body'] ?? 'We suspended your account. Contact support and our team will take you through what happens next.',
            // ⚠️ Anything unrecognised reads as the heavier word. Softening a
            // real suspension is the costlier direction to be wrong in.
            'tone' => in_array($copy['tone'] ?? null, ['limited', 'suspended'], true)
                ? $copy['tone']
                : 'suspended',
            'action' => self::actionFor($copy),
            'suspended_at' => $user instanceof User && $user->suspended_at
                ? $user->suspended_at->toIso8601String()
                : null,
        ];
    }

    /**
     * The "here is how you fix it" button, or null when only support can.
     *
     * 🚨 NEVER THROWS, AND A ROUTE IT CANNOT RESOLVE BECOMES NULL. `route()`
     * throws for a name Ziggy or the router does not carry, and this is built
     * inside the shared Inertia payload — so one typo in config would take down
     * EVERY page for EVERY signed-in user, to render a button. Falling back to
     * the support CTA is the safe direction. Same reasoning as
     * `EmailPreferenceController::generateManageToken()` returning null.
     *
     * @return array{label:string,url:string}|null
     */
    private static function actionFor(array $copy): ?array
    {
        $action = $copy['action'] ?? null;

        if (! is_array($action) || empty($action['route']) || empty($action['label'])) {
            return null;
        }

        try {
            return ['label' => (string) $action['label'], 'url' => route($action['route'])];
        } catch (\Throwable $e) {
            Log::warning('SuspendedAccount: a reason names a route that does not resolve', [
                'route' => $action['route'],
                'error' => $e->getMessage(),
            ]);

            return null;
        }
    }

    /**
     * The Inertia prop, or null when there is nothing to say.
     *
     * ⚠️ Null rather than a flag-plus-empty-copy object: the banner renders on
     * the prop's presence, so an object that is always sent is one truthiness
     * mistake away from showing every signed-in creator a suspension notice.
     */
    public static function payload($user): ?array
    {
        return self::isSuspended($user) ? self::copyFor($user) : null;
    }
}
