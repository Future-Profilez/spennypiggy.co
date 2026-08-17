<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Records whether we can still confirm a user's web-push subscription.
 *
 * Push on this platform is registered ENTIRELY client-side — MagicBell's
 * `WebPushClient({ userEmail }).subscribe()` in the notification bell component.
 * Nothing was ever written server-side, so `Helpers::sendNotification` posted to
 * MagicBell, MagicBell answered 200 (it accepted the notification), and the
 * delivery log recorded `sent` whether or not any device existed to receive it.
 *
 * These three columns are the only signal the server has:
 *
 *  - `push_verified_at`      last time the browser confirmed a live subscription
 *  - `push_permission_state` what the browser said (granted/denied/unsupported/default)
 *  - `push_reminded_at`      the reminder claim, so nobody is nagged repeatedly
 *
 * ⚠️ None of the three are in `User::$fillable` — they are derived state written
 * by the heartbeat endpoint and the reminder command, not something a form posts.
 *
 * Every column is nullable and guarded: NULL means "never heard from this
 * browser", which is the state every existing row starts in.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            if (! Schema::hasColumn('users', 'push_verified_at')) {
                // Indexed: the reminder sweep filters the whole users table on it.
                $table->dateTime('push_verified_at')->nullable()->index();
            }

            if (! Schema::hasColumn('users', 'push_permission_state')) {
                $table->string('push_permission_state', 20)->nullable();
            }

            if (! Schema::hasColumn('users', 'push_reminded_at')) {
                $table->dateTime('push_reminded_at')->nullable();
            }
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            foreach (['push_verified_at', 'push_permission_state', 'push_reminded_at'] as $column) {
                if (Schema::hasColumn('users', $column)) {
                    $table->dropColumn($column);
                }
            }
        });
    }
};
