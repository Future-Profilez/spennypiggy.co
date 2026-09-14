<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Bring `tip_goals.target` in line with what both live databases already are.
 *
 * 🚨 `POST /add-goal` COULD NOT CREATE A TIP GOAL ON ANY FRESHLY MIGRATED
 * DATABASE. The 2023 migration declares `$table->double('target')` — NOT NULL,
 * no default — while `target` is commented out of `TipGoal::$fillable` as a
 * "deprecated monetary field", so `create()` drops it and the insert fails on
 * MySQL in strict mode.
 *
 * ⚠️ IT WORKS IN PRODUCTION, WHICH IS WHY IT SURVIVED. Measured 12 Sep 2026:
 * `target` is `double(8,2) NULL` on production AND on the development copy —
 * altered at some point without a migration. So the fault only appears where the
 * schema is built from migrations: CI, a `migrate:fresh`, and any restore. A
 * disaster-recovery rebuild would have come back with a feature production had.
 *
 * ⚠️ NULLABLE, NOT A DEFAULT OF ZERO. A tip goal has no monetary target any more
 * — the column is deprecated and unread — and `0` is a number somebody could
 * legitimately have meant. Absent is the honest value.
 *
 * ⚠️ The column is deliberately NOT re-added to `$fillable`. It is deprecated;
 * making it writable again would invite new rows to carry a figure nothing uses.
 */
return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasTable('tip_goals') || ! Schema::hasColumn('tip_goals', 'target')) {
            return;
        }

        Schema::table('tip_goals', function (Blueprint $table) {
            $table->double('target', 8, 2)->nullable()->change();
        });
    }

    public function down(): void
    {
        /*
         * Deliberately empty. Putting NOT NULL back would break `/add-goal`
         * again, and there is no value to backfill the existing NULLs with.
         */
    }
};
