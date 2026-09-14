<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Why an intro video was pulled back, in the creator's own words to fix.
 *
 * 🚨 INTROS AUTO-PUBLISH FROM 13 Sep 2026 (client direction), so for the first
 * time nothing waits on a person before a video is on a profile. Every other
 * module that publishes itself carries a `moderation_reason`; without one here
 * a retracted intro would vanish from the creator's page with no explanation
 * anywhere — the exact dead end the held-listing work spent two days removing.
 */
return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasTable('user_intros') || Schema::hasColumn('user_intros', 'moderation_reason')) {
            return;
        }

        Schema::table('user_intros', function (Blueprint $table) {
            $table->text('moderation_reason')->nullable();
        });
    }

    public function down(): void
    {
        if (! Schema::hasTable('user_intros') || ! Schema::hasColumn('user_intros', 'moderation_reason')) {
            return;
        }

        Schema::table('user_intros', function (Blueprint $table) {
            $table->dropColumn('moderation_reason');
        });
    }
};
