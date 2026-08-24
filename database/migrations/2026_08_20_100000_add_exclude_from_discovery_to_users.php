<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Discovery Phase 3 — the admin "exclude from Discovery" switch.
 *
 * The brief asks for eligibility to be "good standing only … Admin exclude-from-
 * Discovery flag (add it if missing)". It was missing.
 *
 * 🚨 THIS IS A KILL SWITCH, NOT A SUSPENSION. `suspended_account` takes a
 * creator's whole profile off the site; this only stops Spenny Piggy from
 * PROMOTING them. Their profile, their links and their catalogue all keep
 * working — they simply stop appearing in "More creators to support" and in any
 * later Discovery surface that reads
 * `App\Services\Discovery\CreatorRecommendationService`. That distinction is the
 * point: the one lever the back office needed was "stop recommending this
 * person" without punishing them publicly.
 *
 * ⚠️ SHARED DATABASE. The column lives on `users`, which BOTH apps read. It is
 * written from the admin app (a Super Admin control) and read by the website, so
 * the admin app's own `User` model needs it in `$casts` too. Deliberately NOT in
 * the website `User` model's `$fillable` — same reasoning as
 * `bonus_scheme_eligible`: nothing a creator can submit should be able to flip a
 * commercial control through mass assignment.
 *
 * ⚠️ Default FALSE, and the eligibility query also treats NULL as false. A
 * platform whose recommendation row silently empties itself because a column
 * defaulted the wrong way is a far worse failure than one that recommends
 * someone it should not have.
 */
return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasColumn('users', 'exclude_from_discovery')) {
            return;
        }

        Schema::table('users', function (Blueprint $table) {
            $table->boolean('exclude_from_discovery')->default(false)->after('is_founder');

            /*
             * The recommendation pool filters on role + standing + this flag in
             * one pass, every 15 minutes, for the whole platform. The flag is
             * low-cardinality on its own, so it is indexed together with the two
             * columns it is always read beside.
             */
            $table->index(['role', 'suspended_account', 'exclude_from_discovery'], 'users_discovery_pool_idx');
        });
    }

    public function down(): void
    {
        if (! Schema::hasColumn('users', 'exclude_from_discovery')) {
            return;
        }

        Schema::table('users', function (Blueprint $table) {
            $table->dropIndex('users_discovery_pool_idx');
            $table->dropColumn('exclude_from_discovery');
        });
    }
};
