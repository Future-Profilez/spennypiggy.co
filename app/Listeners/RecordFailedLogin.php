<?php

namespace App\Listeners;

use App\Models\User;
use App\Support\FailedLoginMonitor;
use Illuminate\Auth\Events\Failed;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Schema;

/**
 * Records a FAILED sign-in into the shared `login_logs` table, and feeds the
 * per-IP threshold — Security Checklist §3.
 *
 * 🚨 Why this exists: `RecordUserLogin` records successes only, so the website
 * side of `login_logs` contained no failures at all. A per-IP failed-login
 * threshold was therefore not merely un-implemented, it was not COMPUTABLE —
 * there was no data to compute it from. The admin app has recorded its failures
 * since it was built; the public platform, where anyone on the internet can
 * try, recorded none.
 *
 * ⚠️ Hooked to the framework's `Failed` event rather than to the login
 * controller, for exactly the reason `RecordUserLogin`'s docblock gives about
 * `Login`: this app authenticates through several paths, and patching them one
 * at a time is how one gets missed.
 *
 * ⚠️ `Failed::$user` is the matched account or null. Null means the ADDRESS does
 * not exist — which is the more interesting case, because it is what walking a
 * leaked list looks like. Both are recorded.
 *
 * 🚨 NEVER THROWS. A failed login must render its "these credentials do not
 * match" message, not a 500.
 */
class RecordFailedLogin
{
    public function handle(Failed $event): void
    {
        try {
            $email = $event->credentials['email'] ?? null;
            $email = is_string($email) ? mb_substr($email, 0, 255) : null;

            $user = $event->user instanceof User ? $event->user : null;
            $request = request();
            $ip = $request?->ip();

            if (Schema::hasTable('login_logs')) {
                DB::table('login_logs')->insert([
                    'user_id' => $user?->getKey(),
                    'email' => (string) ($email ?? ''),
                    'ip_address' => $ip,
                    'user_agent' => substr((string) $request?->userAgent(), 0, 1000),
                    'success' => false,
                    // ⚠️ Never record WHICH half was wrong. "no such account"
                    // versus "wrong password" written into a table admins read
                    // is an account-enumeration oracle sitting in our own logs.
                    'failure_reason' => 'Invalid credentials',
                    'login_at' => now(),
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
            }

            FailedLoginMonitor::record(
                (string) ($email ?? ''),
                $ip,
                'invalid credentials',
                $user?->getKey(),
                null,
                'website',
            );
        } catch (\Throwable $e) {
            Log::warning('RecordFailedLogin failed', ['error' => $e->getMessage()]);
        }
    }
}
