<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * When did this creator's profile actually go live?
 *
 * 🚨 THE DAILY REVIEW FEED COULD NOT SEE THE ONE COHORT IT MOST NEEDS TO. Its
 * `profile_new` source dates a creator by `users.created_at`, so somebody who
 * signed up three weeks ago and completes their photo and bio TODAY — publishing
 * a profile no human has ever looked at — appears under no source in today's
 * feed. Nothing on `users` recorded the 0 → 2 activation, and `updated_at` cannot
 * stand in: it moves for a dozen unrelated reasons, and it also orders the
 * creator-review queue and keys the public profile cache.
 *
 * ⚠️ NULL FOR EVERY EXISTING CREATOR, AND THAT IS FINE. The feed reads
 * `COALESCE(profile_activated_at, created_at)`, so a row with no stamp behaves
 * exactly as it does today. There is deliberately no backfill: nothing records
 * when those profiles went live, and `updated_at` would be a guess dressed as a
 * fact.
 *
 * ⚠️ Written by `ProfileAutoApproval::activateIfComplete()` through the query
 * builder, in the same statement as the lock — so it cannot disagree with the
 * activation it describes, and it does not stamp `updated_at`.
 *
 * ⚠️ `Schema::table` on `users`. See the 7 Sep 2026 outage note before deploying
 * this alongside anything else heavy.
 */
return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasColumn('users', 'profile_activated_at')) {
            return;
        }

        Schema::table('users', function (Blueprint $table) {
            $table->timestamp('profile_activated_at')->nullable();
        });
    }

    public function down(): void
    {
        if (! Schema::hasColumn('users', 'profile_activated_at')) {
            return;
        }

        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn('profile_activated_at');
        });
    }
};
