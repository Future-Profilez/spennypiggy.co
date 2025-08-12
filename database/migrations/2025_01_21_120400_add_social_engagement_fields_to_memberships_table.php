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
        Schema::table('memberships', function (Blueprint $table) {
            // Add new social engagement fields
            $table->integer('supporter_count')->default(0)->comment('Number of supporters for this membership tier');
            $table->enum('gift_frequency', ['daily', 'weekly', 'monthly', 'rarely'])->default('rarely')->comment('How often memberships are gifted');
            $table->decimal('creator_growth_rate', 5, 2)->default(0.00)->comment('Creator growth percentage');
            $table->integer('rising_score')->default(0)->comment('Rising popularity score (0-100)');
            $table->enum('engagement_level', ['low', 'medium', 'high', 'viral'])->default('low')->comment('Engagement level category');
            $table->boolean('trending_status')->default(false)->comment('Whether this membership is currently trending');
            
            // Add indexes for better query performance
            $table->index('supporter_count');
            $table->index('rising_score');
            $table->index('trending_status');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('memberships', function (Blueprint $table) {
            $table->dropIndex(['memberships_supporter_count_index']);
            $table->dropIndex(['memberships_rising_score_index']);
            $table->dropIndex(['memberships_trending_status_index']);
            
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
