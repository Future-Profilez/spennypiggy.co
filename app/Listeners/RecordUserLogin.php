<?php

namespace App\Listeners;

use App\Models\User;
use Illuminate\Auth\Events\Login;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Schema;

/**
 * Records a successful user sign-in into the shared `login_logs` table.
 *
 * ⚠️ Why this exists: `login_logs` was created by the ADMIN app and, until now,
 * only ever recorded ADMIN sign-ins — every row in it had a NULL `user_id`. The
 * admin panel's "inactive N months" audience filters were written against that
 * table, so they asked "has this user signed in recently?" of data that contained
 * no user sign-ins at all, and the answer was always no. Measured on live data,
 * "inactive 3 months" selected 73 of 78 eligible accounts: picking a re-engagement
 * segment would have mailed effectively the whole platform.
 *
 * The two apps share one database but not code, so the write has to happen here,
 * on the side that actually authenticates users.
 *
 * ⚠️ Hooked to the framework's Login event rather than to the login controller.
 * The website authenticates through several paths — password, 2FA completion,
 * WebAuthn, remember-me cookie, admin emulation — and patching them one at a time
 * is how one silently gets missed and a whole cohort keeps looking dormant.
 *
 * The backlog stays empty: this only fills going forward. That is why the admin
 * app's inactive segments combine sign-in with purchase, earning and posting
 * activity, all of which already have full history.
 */
class RecordUserLogin
{
    public function handle(Login $event): void
    {
        try {
            $user = $event->user;

            // Only real site users. The admin guard writes its own rows.
            if (! $user instanceof User || ! $user->getKey()) {
                return;
            }

            if (! Schema::hasTable('login_logs')) {
                return;
            }

            $request = request();

            DB::table('login_logs')->insert([
                'user_id' => $user->getKey(),
                'email' => (string) ($user->email ?? ''),
                'ip_address' => $request?->ip(),
                'user_agent' => substr((string) $request?->userAgent(), 0, 1000),
                'success' => true,
                'login_at' => now(),
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        } catch (\Throwable $e) {
            // ⚠️ Never let this break a sign-in. It is a analytics/segmentation
            // signal; a failure here must cost a missing row, not a locked-out
            // user.
            Log::warning('RecordUserLogin failed', ['error' => $e->getMessage()]);
        }
    }
}
