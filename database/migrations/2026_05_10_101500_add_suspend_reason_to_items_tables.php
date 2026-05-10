<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        foreach (['wish_items', 'bills', 'shops', 'tasks', 'memberships'] as $table) {
            Schema::table($table, function (Blueprint $table) {
                if (! Schema::hasColumn($table->getTable(), 'suspend_reason')) {
                    $table->text('suspend_reason')->nullable()->after('is_suspended');
                }
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        foreach (['wish_items', 'bills', 'shops', 'tasks', 'memberships'] as $table) {
            Schema::table($table, function (Blueprint $table) {
                if (Schema::hasColumn($table->getTable(), 'suspend_reason')) {
                    $table->dropColumn('suspend_reason');
                }
            });
        }
    }
};
