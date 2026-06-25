<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Stripe SFW gate: store a creator-facing reason when content is held by
 * App\Jobs\CheckMediaModeration, so the creator sees WHY (not just "under review")
 * on their own listing. Cleared when an admin approves the item.
 */
return new class extends Migration
{
    private array $tables = ['piggy_pots', 'shops', 'tasks'];

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
