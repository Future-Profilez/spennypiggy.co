<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        $driver = DB::getDriverName();

        if (in_array($driver, ['mysql', 'mariadb'], true) && Schema::hasColumn('users', 'identity_admin_reviewed_at')) {
            DB::statement(
                "UPDATE users
                 SET identity_admin_reviewed_at = NULL
                 WHERE identity_admin_reviewed_at IS NOT NULL
                   AND YEAR(identity_admin_reviewed_at) = 0"
            );
        }

        if (!Schema::hasColumn('users', 'crm_creator_id')) {
            Schema::table('users', function (Blueprint $table) {
                $table->unsignedBigInteger('crm_creator_id')->nullable()->after('id');
            });
        }

        try {
            Schema::table('users', function (Blueprint $table) {
                $table->index('crm_creator_id');
            });
        } catch (\Throwable) {
        }

        try {
            Schema::table('users', function (Blueprint $table) {
                $table->foreign('crm_creator_id')->references('id')->on('crm_creators')->nullOnDelete();
            });
        } catch (\Throwable) {
        }
    }

    public function down(): void
    {
        try {
            Schema::table('users', function (Blueprint $table) {
                $table->dropForeign(['crm_creator_id']);
            });
        } catch (\Throwable) {
        }

        if (Schema::hasColumn('users', 'crm_creator_id')) {
            Schema::table('users', function (Blueprint $table) {
                $table->dropColumn('crm_creator_id');
            });
        }
    }
};
