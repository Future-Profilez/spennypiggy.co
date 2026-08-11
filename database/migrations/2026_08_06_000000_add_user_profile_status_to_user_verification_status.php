<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * `user_verification_status.user_profile_status` is read and written all over
 * ProfileController, but no migration ever CREATED it — `2025_05_30_091042` only
 * `change()`s it, guarded by `hasColumn`, so on a database built from migrations
 * alone the column silently never exists and every profile save dies with
 * "table user_verification_status has no column named user_profile_status".
 *
 * Every deployed database has it, so this is a no-op there. Same class of gap as
 * `users.role`, `users.cover_approved` and `shops.status`.
 *
 * `down()` is intentionally empty — a rollback must not drop a live column.
 */
return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasTable('user_verification_status')) {
            return;
        }

        if (Schema::hasColumn('user_verification_status', 'user_profile_status')) {
            return;
        }

        Schema::table('user_verification_status', function (Blueprint $table) {
            $table->smallInteger('user_profile_status')
                ->default(0)
                ->comment('0: locked, 1: pending, 2: unlocked, 3: card verification success for gifter users, 4: card verification pending for gifter users')
                ->after('role');
        });
    }

    public function down(): void
    {
        // Intentionally empty.
    }
};
