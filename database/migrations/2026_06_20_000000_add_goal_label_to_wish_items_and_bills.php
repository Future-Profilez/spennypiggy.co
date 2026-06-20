<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Stripe compliance — Goal / Deliverable two-field model (20 June 2026 spec).
 *
 * Field A: an optional, display-only "goal label" (aspirational campaign context,
 * e.g. "New camera", "Studio upgrade"). It is never bound to checkout, receipt,
 * confirmation email or the Stripe statement descriptor — those always read the
 * content deliverable (Field B). The existing content fields stay required.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('wish_items', function (Blueprint $table) {
            if (! Schema::hasColumn('wish_items', 'goal_label')) {
                $table->string('goal_label', 60)->nullable()->after('wishname');
            }
        });

        Schema::table('bills', function (Blueprint $table) {
            if (! Schema::hasColumn('bills', 'goal_label')) {
                $table->string('goal_label', 60)->nullable()->after('name');
            }
        });
    }

    public function down(): void
    {
        Schema::table('wish_items', function (Blueprint $table) {
            if (Schema::hasColumn('wish_items', 'goal_label')) {
                $table->dropColumn('goal_label');
            }
        });

        Schema::table('bills', function (Blueprint $table) {
            if (Schema::hasColumn('bills', 'goal_label')) {
                $table->dropColumn('goal_label');
            }
        });
    }
};
