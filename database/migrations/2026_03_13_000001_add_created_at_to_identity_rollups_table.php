<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (!Schema::hasTable('identity_rollups')) {
            return;
        }

        if (Schema::hasColumn('identity_rollups', 'created_at')) {
            return;
        }

        Schema::table('identity_rollups', function (Blueprint $table) {
            $table->timestamp('created_at')->nullable()->after('disputes_30d');
        });
    }

    public function down(): void
    {
        if (!Schema::hasTable('identity_rollups')) {
            return;
        }

        if (!Schema::hasColumn('identity_rollups', 'created_at')) {
            return;
        }

        Schema::table('identity_rollups', function (Blueprint $table) {
            $table->dropColumn('created_at');
        });
    }
};

