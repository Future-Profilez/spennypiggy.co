<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Extends the creator-facing hold reason to the three item tables that never
 * had one (migration 2026_06_20_000001 covered piggy_pots, shops and tasks).
 *
 * Wish items, bills and memberships are all created unapproved and wait for an
 * admin, so they were already reviewed — but with nothing recording WHY a given
 * row is waiting, the creator saw an item sitting unpublished with no
 * explanation and the reviewer saw no reason to look closer at one row over
 * another. Cleared when an admin approves the item.
 */
return new class extends Migration
{
    private array $tables = ['wish_items', 'bills', 'memberships'];

    public function up(): void
    {
        foreach ($this->tables as $t) {
            if (Schema::hasTable($t) && ! Schema::hasColumn($t, 'moderation_reason')) {
                Schema::table($t, function (Blueprint $table) {
                    $table->string('moderation_reason', 255)->nullable();
                });
            }
        }
    }

    public function down(): void
    {
        foreach ($this->tables as $t) {
            if (Schema::hasTable($t) && Schema::hasColumn($t, 'moderation_reason')) {
                Schema::table($t, function (Blueprint $table) {
                    $table->dropColumn('moderation_reason');
                });
            }
        }
    }
};
