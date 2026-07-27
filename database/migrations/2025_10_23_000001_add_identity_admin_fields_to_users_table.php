<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            if (! Schema::hasColumn('users', 'identity_admin_status')) {
                $table->tinyInteger('identity_admin_status')
                    ->default(0)
                    ->comment('0=pending, 1=approved, 2=rejected')
                    ->after('identity_status');
            }
            if (! Schema::hasColumn('users', 'identity_admin_reviewed_at')) {
                $table->timestamp('identity_admin_reviewed_at')
                    ->nullable()
                    ->after('identity_admin_status');
            }
            if (! Schema::hasColumn('users', 'identity_admin_notes')) {
                $table->text('identity_admin_notes')
                    ->nullable()
                    ->after('identity_admin_reviewed_at');
            }

            // Index for faster admin filtering (safe to call; will error if duplicate name)
            $table->index('identity_admin_status', 'idx_identity_admin_status');
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            // Drop index, then columns
            $table->dropIndex('idx_identity_admin_status');
            if (Schema::hasColumn('users', 'identity_admin_status')) {
                $table->dropColumn('identity_admin_status');
            }
            if (Schema::hasColumn('users', 'identity_admin_reviewed_at')) {
                $table->dropColumn('identity_admin_reviewed_at');
            }
            if (Schema::hasColumn('users', 'identity_admin_notes')) {
                $table->dropColumn('identity_admin_notes');
            }
        });
    }
};
