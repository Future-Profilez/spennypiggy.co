<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Bonus scheme eligibility is an INDEPENDENT Super Admin control (client
 * decision, 3 Aug 2026) — deliberately NOT a column on creator_fee_overrides.
 *
 * Switching a creator onto bespoke pricing does not change this flag, and a
 * creator on standard pricing can have it turned off. The two decisions are
 * commercially separate and the client asked for them to stay that way.
 *
 * Default true: every existing creator keeps the eligibility they have today.
 */
return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('users') && ! Schema::hasColumn('users', 'bonus_scheme_eligible')) {
            Schema::table('users', function (Blueprint $table) {
                $table->boolean('bonus_scheme_eligible')->default(true);
            });
        }
    }

    public function down(): void
    {
        if (Schema::hasTable('users') && Schema::hasColumn('users', 'bonus_scheme_eligible')) {
            Schema::table('users', function (Blueprint $table) {
                $table->dropColumn('bonus_scheme_eligible');
            });
        }
    }
};
