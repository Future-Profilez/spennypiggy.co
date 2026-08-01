<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    /**
     * ⚠️ The drop and the adds MUST be separate `Schema::table` calls.
     *
     * SQLite has no ALTER TABLE DROP COLUMN, so Laravel emulates it by rebuilding the table from
     * its existing definition — which discards any columns added in the same Blueprint. Written
     * as one closure this migration ran clean and produced a `gifter_addresses` with **none** of
     * the five columns, on SQLite only. MySQL handles both in one ALTER, so every deployed
     * database was correct and the fault was invisible until a test tried to register a
     * supporter and hit "table gifter_addresses has no column named country".
     *
     * Guarded with `hasColumn` so re-running against an already-migrated database is a no-op.
     */
    public function up(): void
    {
        if (Schema::hasColumn('gifter_addresses', 'address')) {
            Schema::table('gifter_addresses', function (Blueprint $table) {
                $table->dropColumn('address');
            });
        }

        $columns = ['country', 'street_address', 'city', 'state', 'postal_code'];

        $missing = array_values(array_filter(
            $columns,
            fn ($column) => ! Schema::hasColumn('gifter_addresses', $column)
        ));

        if ($missing === []) {
            return;
        }

        Schema::table('gifter_addresses', function (Blueprint $table) use ($missing) {
            $after = 'user_id';
            foreach ($missing as $column) {
                $table->text($column)->nullable()->after($after);
                $after = $column;
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('gifter_addresses', function (Blueprint $table) {
            //
        });
    }
};
