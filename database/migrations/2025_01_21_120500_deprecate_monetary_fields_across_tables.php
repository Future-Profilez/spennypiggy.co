<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     *
     * This migration adds comments to existing monetary fields to mark them as deprecated.
     * We don't actually drop the columns to maintain data integrity and backwards compatibility,
     * but we mark them as deprecated in favor of the new social engagement fields.
     */
    public function up(): void
    {
        if (DB::connection()->getDriverName() !== 'mysql') {
            return;
        }
        if (config('database.default') === 'sqlite') {
            return;
        }

        // Add deprecation comments to wish_items table
        if (Schema::hasColumn('wish_items', 'price')) {
            DB::statement('ALTER TABLE wish_items MODIFY COLUMN price DOUBLE(10,2) DEFAULT 0.00 COMMENT "DEPRECATED: Use supporter_count and social metrics instead"');
        }
        if (Schema::hasColumn('wish_items', 'currency')) {
            DB::statement('ALTER TABLE wish_items MODIFY COLUMN currency VARCHAR(255) COMMENT "DEPRECATED: Use supporter_count and social metrics instead"');
        }
        if (Schema::hasColumn('wish_items', 'fullfill_amount')) {
            DB::statement('ALTER TABLE wish_items MODIFY COLUMN fullfill_amount DOUBLE(8,2) COMMENT "DEPRECATED: Use supporter_count and social metrics instead"');
        }
        if (Schema::hasColumn('wish_items', 'tax_amount')) {
            DB::statement('ALTER TABLE wish_items MODIFY COLUMN tax_amount DOUBLE(8,2) COMMENT "DEPRECATED: Use supporter_count and social metrics instead"');
        }

        // Add deprecation comments to bills table
        if (Schema::hasColumn('bills', 'price')) {
            DB::statement('ALTER TABLE bills MODIFY COLUMN price DOUBLE(8,2) COMMENT "DEPRECATED: Use supporter_count and social metrics instead"');
        }
        if (Schema::hasColumn('bills', 'currency')) {
            DB::statement('ALTER TABLE bills MODIFY COLUMN currency VARCHAR(255) COMMENT "DEPRECATED: Use supporter_count and social metrics instead"');
        }
        if (Schema::hasColumn('bills', 'tax_amount')) {
            DB::statement('ALTER TABLE bills MODIFY COLUMN tax_amount DOUBLE(8,2) COMMENT "DEPRECATED: Use supporter_count and social metrics instead"');
        }

        // Add deprecation comments to tip_goals table
        if (Schema::hasColumn('tip_goals', 'target')) {
            DB::statement('ALTER TABLE tip_goals MODIFY COLUMN target DOUBLE(8,2) COMMENT "DEPRECATED: Use supporter_count and social metrics instead"');
        }
        if (Schema::hasColumn('tip_goals', 'default_price')) {
            DB::statement('ALTER TABLE tip_goals MODIFY COLUMN default_price DOUBLE(8,2) COMMENT "DEPRECATED: Use supporter_count and social metrics instead"');
        }
        if (Schema::hasColumn('tip_goals', 'fullfilled')) {
            DB::statement('ALTER TABLE tip_goals MODIFY COLUMN fullfilled DOUBLE(8,2) DEFAULT 0.00 COMMENT "DEPRECATED: Use supporter_count and social metrics instead"');
        }
        if (Schema::hasColumn('tip_goals', 'currency')) {
            DB::statement('ALTER TABLE tip_goals MODIFY COLUMN currency VARCHAR(255) DEFAULT "GBP" COMMENT "DEPRECATED: Use supporter_count and social metrics instead"');
        }
        if (Schema::hasColumn('tip_goals', 'tax_amount')) {
            DB::statement('ALTER TABLE tip_goals MODIFY COLUMN tax_amount DOUBLE(8,2) COMMENT "DEPRECATED: Use supporter_count and social metrics instead"');
        }

        // Add deprecation comments to shops table
        if (Schema::hasColumn('shops', 'price')) {
            DB::statement('ALTER TABLE shops MODIFY COLUMN price DOUBLE(8,2) COMMENT "DEPRECATED: Use supporter_count and social metrics instead"');
        }
        if (Schema::hasColumn('shops', 'currency')) {
            DB::statement('ALTER TABLE shops MODIFY COLUMN currency VARCHAR(255) COMMENT "DEPRECATED: Use supporter_count and social metrics instead"');
        }
        if (Schema::hasColumn('shops', 'special_member_price')) {
            DB::statement('ALTER TABLE shops MODIFY COLUMN special_member_price DOUBLE(8,2) COMMENT "DEPRECATED: Use supporter_count and social metrics instead"');
        }

        // Add deprecation comments to memberships table
        if (Schema::hasColumn('memberships', 'price')) {
            DB::statement('ALTER TABLE memberships MODIFY COLUMN price DOUBLE(8,2) COMMENT "DEPRECATED: Use supporter_count and social metrics instead"');
        }
    }

    /**
     * Reverse the migrations.
     *
     * This would remove the deprecation comments, but since we're not actually
     * modifying the structure significantly, we'll leave this empty for now.
     */
    public function down(): void
    {
        if (DB::connection()->getDriverName() !== 'mysql') {
            return;
        }
        // Rollback would be complex and potentially destructive
        // For now, we'll leave the deprecated fields as-is
        // In a real production environment, you might want to remove the comments
    }
};
