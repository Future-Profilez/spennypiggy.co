<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * The last two columns of the `memberships` drift (see
 * `2026_08_23_000000_declare_memberships_live_columns.php`, which closed twelve
 * and missed these). Measured by building a database from this repo's
 * migrations and diffing it against the live table: `currency` and `status`
 * were the only two still absent.
 *
 * They matter because `MembershipFactory` sets `status`, so on a fresh database
 * a membership fixture could not be created at all — which is why the
 * membership purchase paths still had no feature coverage.
 *
 * ⚠️ A NEW migration rather than an edit to `2026_08_23_000000`: that one has
 * already run everywhere, so appending to it would never execute.
 *
 * ⚠️ Guarded and additive; types transcribed from `SHOW COLUMNS FROM
 * memberships` on 25 Aug 2026, never guessed. `down()` is deliberately empty —
 * it must not drop production columns this migration did not create.
 */
return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasTable('memberships')) {
            return;
        }

        Schema::table('memberships', function (Blueprint $table) {
            if (! Schema::hasColumn('memberships', 'currency')) {
                $table->string('currency')->nullable();
            }

            if (! Schema::hasColumn('memberships', 'status')) {
                $table->tinyInteger('status')->default(1);
            }
        });

        /*
         * 🚨 THE DRIFT RUNS THE OTHER WAY TOO. `2024_01_02_000000_create_memberships_table`
         * declares `name` NOT NULL and `description`, and the live table has
         * NEITHER — the tier's label is `level`. So a database built from this
         * repo carries a required column the application never writes, and
         * every membership insert fails with "NOT NULL constraint failed:
         * memberships.name" on a fault that cannot exist in production.
         *
         * Relaxed rather than dropped: nulling a stale column is reversible and
         * cannot lose data, and the guard means this is a no-op anywhere the
         * column is genuinely absent (i.e. every deployed database).
         */
        if (Schema::hasColumn('memberships', 'name') && Schema::hasColumn('memberships', 'level')) {
            Schema::table('memberships', function (Blueprint $table) {
                $table->string('name')->nullable()->change();
            });
        }
    }

    public function down(): void
    {
        // Deliberate no-op — see the class docblock.
    }
};
