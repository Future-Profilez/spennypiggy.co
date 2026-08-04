<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * `user_backup_codes` exists on every deployed database but had no migration, so a database built
 * from migrations alone did not have it — any test touching the two-factor backup-code path died
 * with "no such table: user_backup_codes".
 *
 * Same class of gap as `users.role`, `users.cover_approved` and the fourteen columns fixed by
 * `2026_08_01_000100_add_missing_users_columns`. Guarded with `hasTable`, so it is a **no-op on
 * every real environment**; it exists to bring a fresh database in line with the deployed ones.
 *
 * `code` holds a Laravel-encrypted backup code (hence `text`, not a short string) and is compared
 * with `hash_equals` after decryption. The row itself is the single-use token: redeeming a code
 * DELETEs it, and the affected-row count is what decides whether the attempt succeeded — see
 * `AuthenticatedSessionController::verify2FA()`.
 */
return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('user_backup_codes')) {
            return;
        }

        Schema::create('user_backup_codes', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('user_id')->index();
            $table->text('code');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        // Intentionally empty: this migration only ever creates a table a deployed database
        // already has, so rolling it back would drop live two-factor recovery codes.
    }
};
