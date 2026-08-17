<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * 🚨 `creator_bio_links_unique_target` NEVER FIRED, and the reason is the
 * documented one: MySQL treats NULLs in a unique index as DISTINCT.
 *
 * The index was `(user_id, kind, platform, target_type)`, and exactly one of
 * `platform` / `target_type` is populated on any row — `platform` is NULL on
 * every internal row, `target_type` is NULL on every external one. So no two
 * rows ever collided, whatever they held. Verified against the live schema:
 * two identical `(user_id, external, twitch)` rows were both accepted.
 *
 * That matters because `store()` is a check-then-act `firstOrNew`. A double
 * submit or two workers racing produce two rows for one button, and the public
 * page renders it twice in an order nobody chose.
 *
 * `target_key` is the same device `profile_change_requests.active_key` uses for
 * the same reason: collapse the discriminator into ONE non-null string so a
 * plain unique index can do its job.
 */
return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasTable('creator_bio_links')) {
            return;
        }

        if (! Schema::hasColumn('creator_bio_links', 'target_key')) {
            Schema::table('creator_bio_links', function (Blueprint $table) {
                // Nullable on the way in so existing rows can be backfilled
                // before the unique index is applied.
                $table->string('target_key', 80)->nullable()->after('target_type');
            });
        }

        // Backfill in SQL rather than through the model: this must produce the
        // same string CreatorBioLink::targetKey() does, and a row the model
        // cannot hydrate must still be keyed.
        DB::table('creator_bio_links')
            ->whereNull('target_key')
            ->update([
                'target_key' => DB::raw("CONCAT(kind, ':', COALESCE(platform, target_type, ''))"),
            ]);

        // ⚠️ Dropping by NAME — the column list this was built from is exactly
        // what stopped it working, so it cannot be dropped by column list.
        $this->dropIndexIfExists('creator_bio_links_unique_target');

        if (! $this->indexExists('creator_bio_links_owner_target_unique')) {
            Schema::table('creator_bio_links', function (Blueprint $table) {
                $table->unique(['user_id', 'target_key'], 'creator_bio_links_owner_target_unique');
            });
        }
    }

    public function down(): void
    {
        if (! Schema::hasTable('creator_bio_links')) {
            return;
        }

        $this->dropIndexIfExists('creator_bio_links_owner_target_unique');

        if (Schema::hasColumn('creator_bio_links', 'target_key')) {
            Schema::table('creator_bio_links', function (Blueprint $table) {
                $table->dropColumn('target_key');
            });
        }
    }

    /**
     * ⚠️ sqlite has no `information_schema`, and the test database is built from
     * these migrations — an unguarded lookup there takes down the whole suite
     * rather than one migration. Same branch as
     * `2026_06_24_000000_add_discovery_performance_indexes`.
     */
    private function indexExists(string $index): bool
    {
        if (DB::getDriverName() === 'sqlite') {
            $rows = DB::select("PRAGMA index_list('creator_bio_links')");

            foreach ($rows as $row) {
                if (($row->name ?? null) === $index) {
                    return true;
                }
            }

            return false;
        }

        return DB::table('information_schema.statistics')
            ->where('table_schema', DB::getDatabaseName())
            ->where('table_name', 'creator_bio_links')
            ->where('index_name', $index)
            ->exists();
    }

    private function dropIndexIfExists(string $index): void
    {
        if (! $this->indexExists($index)) {
            return;
        }

        Schema::table('creator_bio_links', function (Blueprint $table) use ($index) {
            $table->dropUnique($index);
        });
    }
};
