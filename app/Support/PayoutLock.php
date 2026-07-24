<?php

namespace App\Support;

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

/**
 * Durable, cross-application mutex for payout execution, backed by the shared `payout_locks`
 * table (the website and admin apps are separate deployments that share one database).
 *
 * Chosen over MySQL GET_LOCK because GET_LOCK is session-scoped: a mid-run connection drop +
 * Laravel auto-reconnect silently releases it, letting a concurrent run start and issue a
 * second Stripe payout over the same payments. A table row with an owner token and an expiry
 * survives reconnects and self-heals if a holder crashes (the expiry lets the next run steal a
 * stale lock).
 */
class PayoutLock
{
    public const NAME = 'spennypiggy_payout_execute';

    /** Seconds a run may hold the lock before another run may steal it as stale. */
    public const TTL = 3600;

    /**
     * Returns an opaque owner token on success, or null when another run holds a live lock.
     */
    public static function acquire(?string $name = null, int $ttl = self::TTL): ?string
    {
        $name = $name ?: self::NAME;
        $token = (string) Str::uuid();
        $now = time();
        $expires = $now + $ttl;

        // 1. Fresh acquire: INSERT wins on the primary key when no row exists.
        try {
            DB::table('payout_locks')->insert([
                'name' => $name,
                'token' => $token,
                'expires_at' => $expires,
            ]);

            return $token;
        } catch (\Throwable $e) {
            // Row already exists — fall through to the steal-if-stale path.
        }

        // 2. Steal a STALE lock atomically: only one racer's conditional UPDATE can match the
        //    expired row; the loser then sees the now-future expiry and matches zero rows.
        try {
            $stolen = DB::table('payout_locks')
                ->where('name', $name)
                ->where('expires_at', '<', $now)
                ->update([
                    'token' => $token,
                    'expires_at' => $expires,
                ]);

            return $stolen === 1 ? $token : null;
        } catch (\Throwable $e) {
            // A hard DB error (e.g. the table is missing before a deploy migrates) must refuse
            // the run, never proceed unlocked — a lockless run risks a double payout.
            Log::error('PayoutLock: could not acquire, refusing the run rather than risking a double payout: '.$e->getMessage());

            return null;
        }
    }

    /**
     * Release the lock only if we still own it (token match), so a run that overran its TTL
     * and was stolen cannot delete the new owner's lock.
     */
    public static function release(?string $token, ?string $name = null): void
    {
        if (! $token) {
            return;
        }

        $name = $name ?: self::NAME;

        try {
            DB::table('payout_locks')
                ->where('name', $name)
                ->where('token', $token)
                ->delete();
        } catch (\Throwable $e) {
            Log::warning('PayoutLock: release failed: '.$e->getMessage());
        }
    }
}
