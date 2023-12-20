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
        Schema::table('wish_categories', function (Blueprint $table) {
            $table->renameColumn('wish_id', 'wish_item_id');
            // $table->foreignIdFor(WishItem::class)->nullable()->change();

            $table->renameColumn('category_id', 'user_category_id');
            // $table->foreignIdFor(UserCategory::class)->nullable()->change();
            // $table->index(['wish_item_id', 'user_category_id'], 'wish_category_index');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('wish_categories', function (Blueprint $table) {
            // $table->dropIndex('wish_category_index');
        });
    }
};
