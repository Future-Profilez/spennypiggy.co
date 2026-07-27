<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Brings profile media (avatar + cover) under the same moderation contract as
 * every sellable item.
 *
 * Three columns, all additive and all guarded, because the deployed database is
 * ahead of the migrations here:
 *
 *  - `cover_approved` is read and written all over the codebase
 *    (ProfileController, HandleInertiaRequests, a dozen selects) but **no
 *    migration ever created it** — it exists on the deployed databases and not
 *    on a fresh one, so `migrate:fresh` produced a schema the app cannot run
 *    against. Created here if missing, left alone where it already exists.
 *  - `moderation_reason` / `moderation_asset` mirror the item tables, so a
 *    flagged avatar can say WHY it was held and WHICH asset was scanned rather
 *    than sitting in the review queue as an unexplained photo.
 */
return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasTable('users')) {
            return;
        }

        Schema::table('users', function (Blueprint $table) {
            if (! Schema::hasColumn('users', 'cover_approved')) {
                // Matches avatar_approved: 0 = pending, 1 = approved, 2 = rejected.
                $table->smallInteger('cover_approved')->default(0);
            }

            if (! Schema::hasColumn('users', 'moderation_reason')) {
                $table->string('moderation_reason', 255)->nullable();
            }

            if (! Schema::hasColumn('users', 'moderation_asset')) {
                $table->string('moderation_asset', 32)->nullable();
            }
        });
    }

    public function down(): void
    {
        if (! Schema::hasTable('users')) {
            return;
        }

        // `cover_approved` is deliberately NOT dropped: this migration may have
        // found it already present, and dropping a column the app reads
        // everywhere would break the rollback rather than undo it.
        foreach (['moderation_reason', 'moderation_asset'] as $column) {
            if (Schema::hasColumn('users', $column)) {
                Schema::table('users', function (Blueprint $table) use ($column) {
                    $table->dropColumn($column);
                });
            }
        }
    }
};
