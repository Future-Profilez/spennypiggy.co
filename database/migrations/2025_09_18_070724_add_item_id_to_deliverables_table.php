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
        Schema::table('deliverables', function (Blueprint $table) {
            // Add item_id column to store database wish item ID
            $table->unsignedBigInteger('item_id')->nullable()->after('product_id')->index()->comment('Database wish item ID (wish_items.id)');
            
            // Add foreign key constraint to wish_items table
            $table->foreign('item_id')->references('id')->on('wish_items')->onDelete('cascade');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('deliverables', function (Blueprint $table) {
            // Drop foreign key constraint first
            $table->dropForeign(['item_id']);
            
            // Drop the column
            $table->dropColumn('item_id');
        });
    }
};
