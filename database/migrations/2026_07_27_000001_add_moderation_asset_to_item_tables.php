<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * WHICH part of a listing the moderation gate objected to.
 *
 * `moderation_reason` is prose written for the creator, so the admin review
 * screen had to guess the asset by searching that sentence for the words
 * "reward file" or "thumbnail" — which breaks the moment the copy is reworded,
 * and cannot express a text flag at all.
 *
 * Values: thumbnail · cover_image · product_image · task_image · reward_file ·
 * reward_text. Cleared when an admin approves the item.
 */
return new class extends Migration
{
    private array $tables = [
        'piggy_pots', 'shops', 'tasks', 'wish_items', 'bills', 'memberships',
    ];

    public function up(): void
    {
        foreach ($this->tables as $t) {
            if (Schema::hasTable($t) && ! Schema::hasColumn($t, 'moderation_asset')) {
                Schema::table($t, function (Blueprint $table) {
                    $table->string('moderation_asset', 32)->nullable();
                });
            }
        }
    }

    public function down(): void
    {
        foreach ($this->tables as $t) {
            if (Schema::hasTable($t) && Schema::hasColumn($t, 'moderation_asset')) {
                Schema::table($t, function (Blueprint $table) {
                    $table->dropColumn('moderation_asset');
                });
            }
        }
    }
};
