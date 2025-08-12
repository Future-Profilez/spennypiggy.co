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
        Schema::table('wish_items', function (Blueprint $table) {
            // Add new social engagement fields
            $table->integer('supporter_count')->default(0)->comment('Number of supporters for this wish item');
            $table->enum('gift_frequency', ['daily', 'weekly', 'monthly', 'rarely'])->default('rarely')->comment('How often gifts are received');
            $table->decimal('creator_growth_rate', 5, 2)->default(0.00)->comment('Creator growth percentage');
            $table->integer('rising_score')->default(0)->comment('Rising popularity score (0-100)');
            $table->enum('engagement_level', ['low', 'medium', 'high', 'viral'])->default('low')->comment('Engagement level category');
            $table->boolean('trending_status')->default(false)->comment('Whether this item is currently trending');
            
            // Add indexes for better query performance
            $table->index('supporter_count');
            $table->index('rising_score');
            $table->index('trending_status');
            $table->index(['engagement_level', 'trending_status']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('wish_items', function (Blueprint $table) {
            $table->dropIndex(['wish_items_supporter_count_index']);
            $table->dropIndex(['wish_items_rising_score_index']);
            $table->dropIndex(['wish_items_trending_status_index']);
            $table->dropIndex(['wish_items_engagement_level_trending_status_index']);
            
            $table->dropColumn([
                'supporter_count',
                'gift_frequency',
                'creator_growth_rate',
                'rising_score',
                'engagement_level',
                'trending_status'
            ]);
        });
    }
};
