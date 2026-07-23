<?php

namespace App\Support;

use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

/**
 * Cross-application mutual exclusion for payout execution.
 *
 * The website app and this admin app are separate deployments that both execute payout
 * runs against the SAME database. A per-app cache lock cannot see the other app, so the
 * lock has to live where both can reach it: MySQL's named locks. A run started from the
 * admin panel while the website's Friday cron is mid-run would otherwise create a second
 * PayoutRun over the same still-unstamped payments — two Stripe payouts, same money.
 *
 * MySQL: GET_LOCK() — session-scoped, released automatically if the connection dies.
 * Anything else (sqlite in tests): falls back to the cache lock.
 */
class PayoutLock
{
    public const NAME = 'spennypiggy_payout_execute';

    /** Seconds a run may hold the lock before another process may take it. */
    public const TTL = 3600;

    /**
     * Returns a release handle on success, null when another run holds the lock.
     */
    public static function acquire(): ?array
    {
        if (DB::getDriverName() === 'mysql') {
            try {
                $got = DB::selectOne('SELECT GET_LOCK(?, 0) AS acquired', [self::NAME]);

                return ((int) ($got->acquired ?? 0) === 1) ? ['driver' => 'mysql'] : null;
            } catch (\Throwable $e) {
                Log::error('PayoutLock: GET_LOCK failed, refusing the run rather than risking a double payout: '.$e->getMessage());

                return null;
            }
        }

        $lock = Cache::lock(self::NAME, self::TTL);

        return $lock->get() ? ['driver' => 'cache', 'lock' => $lock] : null;
    }

    public static function release(?array $handle): void
    {
        if (! $handle) {
            return;
        }

        try {
            if (($handle['driver'] ?? null) === 'mysql') {
                DB::selectOne('SELECT RELEASE_LOCK(?) AS released', [self::NAME]);

                return;
            }

            $handle['lock']?->release();
        } catch (\Throwable $e) {
            Log::warning('PayoutLock: release failed: '.$e->getMessage());
        }
    }
}
