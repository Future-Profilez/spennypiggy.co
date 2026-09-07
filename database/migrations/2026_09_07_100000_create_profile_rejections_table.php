<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Every time a creator's profile was turned down, kept for ever.
 *
 * 🚨 `users.profile_reject_reason` IS ONE COLUMN, OVERWRITTEN ON EVERY DECISION
 * AND CLEARED THE MOMENT THE CREATOR RESUBMITS (`ProfileController::
 * updateProfileLockStatus`). So the reminder that says "last time it was your
 * photo" has nothing to read the day after they press Submit, and a reviewer
 * on the second look cannot see what was asked for on the first. Same reasoning
 * as `identity_reviews`.
 *
 * `source` is the asset that triggered it — `avatar` · `bio` · `socials` ·
 * `cover` · `profile` (the whole-profile decision) · `sweep` (the one-off
 * collapse of the pre-7-Sep-2026 per-asset rejections).
 *
 * ⚠️ NO FOREIGN KEY, and the username is a snapshot: the row is evidence about a
 * decision and outlives the account. Written by the ADMIN app; this migration
 * ships from here because the website owns the shared schema.
 */
return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('profile_rejections')) {
            return;
        }

        Schema::create('profile_rejections', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('user_id')->index();
            $table->string('username')->nullable();
            $table->string('source', 20)->index();
            $table->text('reason');
            $table->unsignedBigInteger('admin_id')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('profile_rejections');
    }
};
