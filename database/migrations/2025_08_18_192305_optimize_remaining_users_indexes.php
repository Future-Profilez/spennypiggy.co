<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

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

        // Check which indexes already exist
        $existingIndexes = collect(DB::select('SHOW INDEX FROM users'))
            ->pluck('Key_name')
            ->unique()
            ->toArray();

        Schema::table('users', function (Blueprint $table) use ($existingIndexes) {
            // Add missing composite indexes for performance
            if (!in_array('idx_subscribed_account', $existingIndexes)) {
                $table->index(['is_subscribed', 'account_id'], 'idx_subscribed_account');
            }
            if (!in_array('idx_suspended_deleted', $existingIndexes)) {
                $table->index(['suspended_account', 'deleted_at'], 'idx_suspended_deleted');
            }
            if (!in_array('idx_created_role', $existingIndexes) && Schema::hasColumn('users', 'role')) {
                $table->index(['created_at', 'role'], 'idx_created_role');
            }
            if (!in_array('idx_updated_role', $existingIndexes) && Schema::hasColumn('users', 'role')) {
                $table->index(['updated_at', 'role'], 'idx_updated_role');
            }
            
            // Single column indexes for frequently queried fields
            if (!in_array('idx_stripe_id', $existingIndexes)) {
                $table->index('stripe_id', 'idx_stripe_id');
            }
            if (!in_array('idx_account_id', $existingIndexes)) {
                $table->index('account_id', 'idx_account_id');
            }
            if (!in_array('idx_identity_status', $existingIndexes)) {
                $table->index('identity_status', 'idx_identity_status');
            }
            if (!in_array('idx_country', $existingIndexes)) {
                $table->index('country', 'idx_country');
            }
            if (!in_array('idx_charges_enabled', $existingIndexes)) {
                $table->index('charges_enabled', 'idx_charges_enabled');
            }
        });
        
        // Handle TEXT column index separately
        if (!in_array('idx_creator_category', $existingIndexes) && Schema::hasColumn('users', 'creator_category')) {
            // For TEXT columns, specify key length (using first 255 characters)
            DB::statement('ALTER TABLE `users` ADD INDEX `idx_creator_category` (`creator_category`(255))');
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropIndex('idx_subscribed_account');
            $table->dropIndex('idx_suspended_deleted');
            $table->dropIndex('idx_created_role');
            $table->dropIndex('idx_updated_role');
            $table->dropIndex('idx_stripe_id');
            $table->dropIndex('idx_account_id');
            $table->dropIndex('idx_identity_status');
            $table->dropIndex('idx_country');
            $table->dropIndex('idx_creator_category');
            $table->dropIndex('idx_charges_enabled');
        });
    }
};
