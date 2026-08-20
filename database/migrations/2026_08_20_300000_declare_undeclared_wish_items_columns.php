<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * `wish_items` grew two columns that no migration ever declared.
 *
 * 🚨 THE SAME FAULT AS `shops` (migration `2026_08_04_000000`), and it has the
 * same consequence: every deployed database HAS these columns, so nothing has
 * ever failed in production — but a database built FROM THE MIGRATIONS comes out
 * with a `wish_items` table the app cannot insert into. That is why the wish
 * paths have no feature test: they could not run. `WishItem::factory()` writes
 * `reward` and `ai_generated`, so the first test to touch a wish dies with
 * "table wish_items has no column named reward", which is exactly how this was
 * found (Discovery Phase 3, 20 Aug 2026).
 *
 * Verified against the live schema before writing:
 *   reward        varchar(255)  NULL      default NULL
 *   ai_generated  tinyint(4)    NOT NULL  default 0
 *
 * ⚠️ GUARDED AND ADDITIVE. On every existing database both columns are already
 * there, so this is a no-op; it only does work on a freshly built one. Do not
 * "tidy" the guards away.
 *
 * ⚠️ `down()` IS DELIBERATELY EMPTY. Dropping these would destroy live data on
 * every deployed database in exchange for tidiness on a scratch one — the
 * columns predate this file and are not ours to remove. Same reasoning as the
 * `shops` migration.
 */
return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasTable('wish_items')) {
            return;
        }

        Schema::table('wish_items', function (Blueprint $table) {
            if (! Schema::hasColumn('wish_items', 'reward')) {
                $table->string('reward')->nullable();
            }

            if (! Schema::hasColumn('wish_items', 'ai_generated')) {
                $table->boolean('ai_generated')->default(false);
            }
        });
    }

    public function down(): void
    {
        // Intentionally empty — see the docblock.
    }
};
