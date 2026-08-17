<?php

namespace App\Support;

use App\Models\User;
use Carbon\CarbonInterface;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Schema;

/**
 * The ONE answer to "can we still confirm this person receives push?".
 *
 * Read by the heartbeat endpoint, the reminder sweep, the in-app banner gate and
 * the delivery log's annotation, so all four cannot disagree about who is stale.
 *
 * 🚨 THIS SERVICE NEVER ASSERTS THAT PUSH IS BROKEN, and no caller may treat it
 * that way. A MagicBell web-push subscription lives in the browser and at
 * MagicBell — it does NOT die when our Laravel session expires — so a stale
 * heartbeat means "we have not been able to CONFIRM it in a while", which is a
 * different and much weaker claim. It is the strongest signal available without
 * a per-user round trip to MagicBell on every sweep, and every piece of copy
 * built on it is worded as an unconfirmed state, never as a failure.
 *
 * ⚠️ Consequently nothing here may suppress a send. `Helpers::sendNotification`
 * still posts every push to MagicBell whatever this says; the state only ever
 * annotates the log and decides who is asked to check.
 */
class PushReachability
{
    /** The browser granted permission and MagicBell reported a live subscription. */
    public const GRANTED = 'granted';

    /** The browser refused. Re-prompting cannot help — this is a settings change. */
    public const DENIED = 'denied';

    /** No Push API here (iOS Safari outside an installed PWA, older browsers). */
    public const UNSUPPORTED = 'unsupported';

    /** Supported, never asked — or asked and dismissed without answering. */
    public const UNPROMPTED = 'default';

    public const PERMISSION_STATES = [
        self::GRANTED,
        self::DENIED,
        self::UNSUPPORTED,
        self::UNPROMPTED,
    ];

    /**
     * How long a confirmation is trusted for.
     *
     * ⚠️ Deliberately DOUBLE the 7-day session lifetime (`config/session.php`).
     * Anyone who opens the app in a normal week re-confirms long before this, so
     * tripping it means genuinely not having been back — not merely being busy.
     */
    public const STALE_DAYS = 14;

    /** Nobody is asked about this more than once in this window. */
    public const REMIND_EVERY_DAYS = 30;

    /**
     * How long the browser's confirmation is cached before the client re-posts.
     *
     * The heartbeat fires on page load, and this app is an SPA doing many
     * navigations per visit — without a floor it would be an UPDATE per
     * navigation per user, for a value that changes meaningfully once a fortnight.
     */
    public const HEARTBEAT_THROTTLE_HOURS = 6;

    /** Per-request memo for the delivery-log annotation, keyed by lowercased email. */
    private static array $stateCache = [];

    /**
     * Has this browser's subscription been confirmed recently enough to trust?
     *
     * ⚠️ Fails OPTIMISTIC on an unselected column. A missing attribute is null,
     * which is indistinguishable from "never confirmed" — and every surface built
     * on this either nags the user or marks their log row, so guessing wrong in
     * that direction is worse than saying nothing. Same reasoning as
     * `User::profileMediaVisible()`.
     */
    public static function isLive(?User $user): bool
    {
        if (! $user) {
            return false;
        }

        // The column was not selected — we know nothing, so claim nothing.
        if (! array_key_exists('push_verified_at', $user->getAttributes())) {
            return true;
        }

        $verifiedAt = $user->push_verified_at;

        if (empty($verifiedAt)) {
            return false;
        }

        return ! self::asDate($verifiedAt)->lt(now()->subDays(self::STALE_DAYS));
    }

    /** The inverse, stated positively so call sites read as intent. */
    public static function isStale(?User $user): bool
    {
        return ! self::isLive($user);
    }

    /**
     * Why we cannot confirm push, in one machine-readable token — or null when we
     * can. Callers pick their own copy; this decides only which case it is.
     *
     * ⚠️ `denied` and `unsupported` outrank staleness. Telling someone whose
     * browser refuses notifications to "open the app to reconnect" is advice they
     * cannot follow, and advice that cannot be followed is worse than none.
     */
    public static function reason(?User $user): ?string
    {
        if (self::isLive($user)) {
            return null;
        }

        $state = $user?->push_permission_state;

        if (in_array($state, [self::DENIED, self::UNSUPPORTED], true)) {
            return $state;
        }

        return empty($user?->push_verified_at) ? 'never_confirmed' : 'stale';
    }

    /**
     * Scope the reminder sweep to creators whose push we cannot confirm.
     *
     * ⚠️ `denied` and `unsupported` are excluded here, not merely worded around:
     * neither is fixed by opening the app, so an email would be noise. So is
     * anyone who turned push off — they made a choice, and re-asking is exactly
     * the behaviour that teaches people to ignore us.
     */
    public static function staleCreatorQuery(): Builder
    {
        $staleBefore = now()->subDays(self::STALE_DAYS);
        $remindBefore = now()->subDays(self::REMIND_EVERY_DAYS);

        return User::query()
            ->where('role', 1)
            ->where('suspended_account', 0)
            ->whereNotNull('email')
            // NULL means the preference was never written, which is opted IN —
            // the convention every other preference read on this platform uses.
            ->where(fn ($q) => $q->whereNull('push_notifications_enabled')->orWhere('push_notifications_enabled', 1))
            ->where(fn ($q) => $q->whereNull('push_permission_state')
                ->orWhereNotIn('push_permission_state', [self::DENIED, self::UNSUPPORTED]))
            ->where(fn ($q) => $q->whereNull('push_verified_at')->orWhere('push_verified_at', '<', $staleBefore))
            ->where(fn ($q) => $q->whereNull('push_reminded_at')->orWhere('push_reminded_at', '<', $remindBefore));
    }

    /**
     * Claim the right to remind this creator, atomically.
     *
     * The UPDATE **is** the claim (`where push_reminded_at < cutoff` → set now),
     * so two workers racing cannot both win and a re-run is a no-op. Same shape
     * as `AbandonedCheckoutService::claimReminder()`.
     *
     * The caller captures `$user->push_reminded_at` BEFORE calling this if it
     * intends to release — this returns only whether the claim was won.
     */
    public static function claimReminder(User $user): bool
    {
        $cutoff = now()->subDays(self::REMIND_EVERY_DAYS);

        return User::query()
            ->whereKey($user->id)
            ->where(fn ($q) => $q->whereNull('push_reminded_at')->orWhere('push_reminded_at', '<', $cutoff))
            ->update(['push_reminded_at' => now()]) === 1;
    }

    /**
     * Hand the claim back after a failed send, restoring whatever was there before.
     *
     * ⚠️ Without this one SMTP blip costs that creator the whole 30-day window —
     * they are marked reminded, hear nothing, and the next sweep skips them.
     */
    public static function releaseReminder(User $user, $previous): void
    {
        User::query()->whereKey($user->id)->update(['push_reminded_at' => $previous]);
    }

    /**
     * The delivery log's annotation for a push we just handed to MagicBell.
     *
     * 🚨 Returns a note for a `sent` row — it never downgrades the status and
     * never stops the send. MagicBell genuinely accepted the notification, so
     * calling it `skipped` would be its own lie; what the log could not say
     * before is that we have no idea whether a device was listening.
     *
     * Memoised per request and selects two columns, because this sits on the push
     * path and every notification on the platform goes through it.
     */
    public static function logNoteFor(?string $email): ?string
    {
        if (empty($email) || ! config('notification_logs.enabled', true)) {
            return null;
        }

        $key = strtolower($email);

        if (array_key_exists($key, self::$stateCache)) {
            return self::$stateCache[$key];
        }

        $note = null;

        try {
            if (Schema::hasColumn('users', 'push_verified_at')) {
                $row = DB::table('users')
                    ->whereRaw('LOWER(email) = ?', [$key])
                    ->select('push_verified_at', 'push_permission_state')
                    ->first();

                if ($row) {
                    $note = self::noteForRow($row->push_verified_at, $row->push_permission_state);
                }
            }
        } catch (\Throwable $e) {
            // Annotating a log line must never be why a notification path throws.
            Log::warning('PushReachability::logNoteFor failed', ['error' => $e->getMessage()]);
        }

        // Bounded: a bulk send can touch thousands of addresses in one process.
        if (count(self::$stateCache) < 500) {
            self::$stateCache[$key] = $note;
        }

        return $note;
    }

    private static function noteForRow($verifiedAt, ?string $permission): ?string
    {
        if (in_array($permission, [self::DENIED, self::UNSUPPORTED], true)) {
            return $permission === self::DENIED
                ? 'Accepted by provider — this browser has notifications blocked'
                : 'Accepted by provider — no push support on this device';
        }

        if (empty($verifiedAt)) {
            return 'Accepted by provider — no device subscription has ever been confirmed';
        }

        if (self::asDate($verifiedAt)->lt(now()->subDays(self::STALE_DAYS))) {
            return 'Accepted by provider — device subscription last confirmed '
                .self::asDate($verifiedAt)->diffForHumans();
        }

        return null;
    }

    /**
     * ⚠️ Accepts a string or a date object. `push_verified_at` arrives cast from
     * Eloquent and raw from a `DB::table()` read, and the raw form is what the
     * log annotation uses.
     */
    private static function asDate($value): CarbonInterface
    {
        return $value instanceof CarbonInterface ? $value : Carbon::parse($value);
    }

    /** Test seam — the memo would otherwise outlive a test's own data changes. */
    public static function flushCache(): void
    {
        self::$stateCache = [];
    }
}
