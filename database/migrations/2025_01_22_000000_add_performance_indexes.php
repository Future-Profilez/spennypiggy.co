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
        // Optimize Bills table indexes
        Schema::table('bills', function (Blueprint $table) {
            // Composite index for most common query pattern
            $table->index(['user_id', 'approved', 'deleted_at'], 'bills_user_approved_deleted_idx');
            
            // Index for ordering by created_at (most recent first)
            $table->index(['user_id', 'created_at'], 'bills_user_created_idx');
            
            // Index for status queries
            $table->index(['user_id', 'status'], 'bills_user_status_idx');
            
            // UUID index for quick lookups
            $table->index(['uuid'], 'bills_uuid_idx');
        });

        // Optimize Memberships table indexes  
        Schema::table('memberships', function (Blueprint $table) {
            // Composite index for most common query pattern
            $table->index(['user_id', 'approved', 'deleted_at'], 'memberships_user_approved_deleted_idx');
            
            // Index for ordering by created_at (most recent first)
            $table->index(['user_id', 'created_at'], 'memberships_user_created_idx');
            
            // UUID index for quick lookups
            $table->index(['uuid'], 'memberships_uuid_idx');
        });

        // Optimize Shops table indexes
        Schema::table('shops', function (Blueprint $table) {
            // Composite index for most common query pattern
            $table->index(['user_id', 'approved', 'deleted_at'], 'shops_user_approved_deleted_idx');
            
            // Index for ordering by created_at (most recent first)
            $table->index(['user_id', 'created_at'], 'shops_user_created_idx');
            
            // UUID index for quick lookups
            $table->index(['uuid'], 'shops_uuid_idx');
        });

        // Optimize WishItems table (if exists)
        if (Schema::hasTable('wish_items')) {
            Schema::table('wish_items', function (Blueprint $table) {
                // Check if indexes don't exist before adding
                if (!$this->indexExists('wish_items', 'wish_items_user_approved_deleted_idx')) {
                    $table->index(['user_id', 'is_approved', 'deleted_at'], 'wish_items_user_approved_deleted_idx');
                }
                
                if (!$this->indexExists('wish_items', 'wish_items_user_created_idx')) {
                    $table->index(['user_id', 'created_at'], 'wish_items_user_created_idx');
                }
                
                if (!$this->indexExists('wish_items', 'wish_items_sort_idx')) {
                    $table->index(['user_id', 'sort'], 'wish_items_sort_idx');
                }
            });
        }

        // Optimize Posts table (if exists)
        if (Schema::hasTable('posts')) {
            Schema::table('posts', function (Blueprint $table) {
                if (!$this->indexExists('posts', 'posts_user_approved_deleted_idx')) {
                    $table->index(['user_id', 'approved', 'deleted_at'], 'posts_user_approved_deleted_idx');
                }
                
                if (!$this->indexExists('posts', 'posts_user_created_idx')) {
                    $table->index(['user_id', 'created_at'], 'posts_user_created_idx');
                }
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('bills', function (Blueprint $table) {
            $table->dropIndex('bills_user_approved_deleted_idx');
            $table->dropIndex('bills_user_created_idx');
            $table->dropIndex('bills_user_status_idx');
            $table->dropIndex('bills_uuid_idx');
        });

        Schema::table('memberships', function (Blueprint $table) {
            $table->dropIndex('memberships_user_approved_deleted_idx');
            $table->dropIndex('memberships_user_created_idx');
            $table->dropIndex('memberships_uuid_idx');
        });

        Schema::table('shops', function (Blueprint $table) {
            $table->dropIndex('shops_user_approved_deleted_idx');
            $table->dropIndex('shops_user_created_idx');
            $table->dropIndex('shops_uuid_idx');
        });

        if (Schema::hasTable('wish_items')) {
            Schema::table('wish_items', function (Blueprint $table) {
                $this->dropIndexIfExists($table, 'wish_items_user_approved_deleted_idx');
                $this->dropIndexIfExists($table, 'wish_items_user_created_idx');
                $this->dropIndexIfExists($table, 'wish_items_sort_idx');
            });
        }

        if (Schema::hasTable('posts')) {
            Schema::table('posts', function (Blueprint $table) {
                $this->dropIndexIfExists($table, 'posts_user_approved_deleted_idx');
                $this->dropIndexIfExists($table, 'posts_user_created_idx');
            });
        }
    }

    /**
     * Check if index exists
     */
    private function indexExists(string $table, string $index): bool
    {
        $indexes = Schema::getConnection()
            ->getDoctrineSchemaManager()
            ->listTableIndexes($table);
            
        return array_key_exists($index, $indexes);
    }

    /**
     * Drop index if it exists
     */
    private function dropIndexIfExists($table, string $indexName): void
    {
        if ($this->indexExists($table->getTable(), $indexName)) {
            $table->dropIndex($indexName);
        }
    }
};
