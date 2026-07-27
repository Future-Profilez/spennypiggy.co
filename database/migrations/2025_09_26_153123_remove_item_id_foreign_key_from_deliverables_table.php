<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        if (config('database.default') === 'sqlite') {
            return;
        }

        Schema::table('deliverables', function (Blueprint $table) {
            // Remove the restrictive foreign key constraint
            $table->dropForeign(['item_id']);

            // Update the comment to reflect the new usage
            $table->bigInteger('item_id')->unsigned()->nullable()->change();
        });

        // Add a new comment via raw SQL
        DB::statement("ALTER TABLE deliverables MODIFY COLUMN item_id BIGINT UNSIGNED NULL COMMENT 'Item ID - references different tables based on product_type (wish_items, bills, memberships, etc.)'");
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('deliverables', function (Blueprint $table) {
            // Re-add the foreign key constraint (only works if all item_id values reference existing wish_items)
            $table->foreign('item_id')->references('id')->on('wish_items')->onDelete('cascade');
        });
    }
};
