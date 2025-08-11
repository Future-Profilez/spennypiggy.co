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
        // Skip index creation during testing
        if (app()->environment('testing')) {
            return;
        }
        
        Schema::table('users', function (Blueprint $table) {
            // Check if required columns exist before creating composite indexes
            if ($this->columnExists('users', 'role') && 
                $this->columnExists('users', 'avatar_approved') && 
                $this->columnExists('users', 'bio_approved') &&
                $this->columnExists('users', 'profile_status_lock') &&
                $this->columnExists('users', 'is_subscribed')) {
                
                // Composite indexes for pending creator profile queries
                if (!$this->indexExists('users', 'idx_users_pending_creator_profiles')) {
                    $table->index(['role', 'avatar_approved', 'bio_approved', 'profile_status_lock', 'is_subscribed'], 'idx_users_pending_creator_profiles');
                }
            }
            
            if ($this->columnExists('users', 'role') && 
                $this->columnExists('users', 'is_500_limit_exceeded') && 
                $this->columnExists('users', 'is_subscribed') &&
                $this->columnExists('users', 'profile_status_lock')) {
                
                // Composite index for pending gifter profile queries  
                if (!$this->indexExists('users', 'idx_users_pending_gifter_profiles')) {
                    $table->index(['role', 'is_500_limit_exceeded', 'is_subscribed', 'profile_status_lock'], 'idx_users_pending_gifter_profiles');
                }
            }
            
            // Individual indexes for commonly queried columns if not already present
            if ($this->columnExists('users', 'avatar_approved') && !$this->indexExists('users', 'users_avatar_approved_index')) {
                $table->index('avatar_approved');
            }
            
            if ($this->columnExists('users', 'bio_approved') && !$this->indexExists('users', 'users_bio_approved_index')) {
                $table->index('bio_approved');
            }
            
            if ($this->columnExists('users', 'profile_status_lock') && !$this->indexExists('users', 'users_profile_status_lock_index')) {
                $table->index('profile_status_lock');
            }
            
            if ($this->columnExists('users', 'is_subscribed') && !$this->indexExists('users', 'users_is_subscribed_index')) {
                $table->index('is_subscribed');
            }
        });

        // Only modify user_verification_status table if it exists
        if (Schema::hasTable('user_verification_status')) {
            Schema::table('user_verification_status', function (Blueprint $table) {
                // Composite index for user_id and role (commonly queried together)
                if (!$this->indexExists('user_verification_status', 'idx_verification_user_role')) {
                    $table->index(['user_id', 'role'], 'idx_verification_user_role');
                }
                
                // Individual index on role if not already present
                if (!$this->indexExists('user_verification_status', 'user_verification_status_role_index')) {
                    $table->index('role');
                }
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Skip during testing
        if (app()->environment('testing')) {
            return;
        }
        
        Schema::table('users', function (Blueprint $table) {
            if ($this->indexExists('users', 'idx_users_pending_creator_profiles')) {
                $table->dropIndex('idx_users_pending_creator_profiles');
            }
            
            if ($this->indexExists('users', 'idx_users_pending_gifter_profiles')) {
                $table->dropIndex('idx_users_pending_gifter_profiles');
            }
            
            if ($this->indexExists('users', 'users_avatar_approved_index')) {
                $table->dropIndex('users_avatar_approved_index');
            }
            
            if ($this->indexExists('users', 'users_bio_approved_index')) {
                $table->dropIndex('users_bio_approved_index');
            }
            
            if ($this->indexExists('users', 'users_profile_status_lock_index')) {
                $table->dropIndex('users_profile_status_lock_index');
            }
            
            if ($this->indexExists('users', 'users_is_subscribed_index')) {
                $table->dropIndex('users_is_subscribed_index');
            }
        });

        Schema::table('user_verification_status', function (Blueprint $table) {
            if ($this->indexExists('user_verification_status', 'idx_verification_user_role')) {
                $table->dropIndex('idx_verification_user_role');
            }
            
            if ($this->indexExists('user_verification_status', 'user_verification_status_role_index')) {
                $table->dropIndex('user_verification_status_role_index');
            }
        });
    }

    /**
     * Check if a column exists on a table.
     */
    private function columnExists(string $table, string $column): bool
    {
        return Schema::hasColumn($table, $column);
    }

    /**
     * Check if an index exists on a table.
     */
    private function indexExists(string $table, string $indexName): bool
    {
        try {
            $indexes = Schema::getConnection()
                ->getDoctrineSchemaManager()
                ->listTableIndexes($table);
                
            return array_key_exists($indexName, $indexes);
        } catch (\Exception $e) {
            return false;
        }
    }
};
