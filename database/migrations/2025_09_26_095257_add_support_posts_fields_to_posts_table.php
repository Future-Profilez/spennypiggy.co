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
        Schema::table('posts', function (Blueprint $table) {
            // Only add fields that don't exist yet
            
            // Check if approved_at column doesn't exist and add it
            if (!Schema::hasColumn('posts', 'approved_at')) {
                $table->timestamp('approved_at')->nullable()->after('approved');
            }
            
            // Check if can_delete_until column doesn't exist and add it
            if (!Schema::hasColumn('posts', 'can_delete_until')) {
                $table->timestamp('can_delete_until')->nullable()->after('approved_at');
            }
            
            // Add indexes for better performance (only if columns exist)
            if (Schema::hasColumn('posts', 'type')) {
                $table->index('type');
            }
            if (Schema::hasColumn('posts', 'for_module')) {
                $table->index('for_module');
            }
            if (Schema::hasColumn('posts', 'status')) {
                $table->index('status');
            }
            if (Schema::hasColumn('posts', 'can_delete_until')) {
                $table->index('can_delete_until');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('posts', function (Blueprint $table) {
            // Drop indexes if they exist
            try {
                $table->dropIndex(['type']);
            } catch (\Exception $e) {}
            
            try {
                $table->dropIndex(['for_module']);
            } catch (\Exception $e) {}
            
            try {
                $table->dropIndex(['status']);
            } catch (\Exception $e) {}
            
            try {
                $table->dropIndex(['can_delete_until']);
            } catch (\Exception $e) {}
            
            // Only drop columns that were added by this migration
            if (Schema::hasColumn('posts', 'approved_at')) {
                $table->dropColumn('approved_at');
            }
            
            if (Schema::hasColumn('posts', 'can_delete_until')) {
                $table->dropColumn('can_delete_until');
            }
        });
    }
};
