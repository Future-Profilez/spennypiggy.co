<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (!Schema::hasTable('payments') || !Schema::hasTable('users')) {
            return;
        }

        if (!Schema::hasColumn('payments', 'creator_id') || !Schema::hasColumn('users', 'uuid')) {
            return;
        }

        $driver = DB::getDriverName();

        if ($driver === 'pgsql') {
            DB::statement(
                "UPDATE payments p
                 SET creator_id = u.uuid
                 FROM users u
                 WHERE p.creator_id ~ '^[0-9]+$'
                   AND u.id = (p.creator_id)::bigint"
            );
        } elseif (in_array($driver, ['mysql', 'mariadb'], true)) {
            DB::statement(
                "UPDATE payments p
                 JOIN users u ON p.creator_id = CAST(u.id AS CHAR)
                 SET p.creator_id = u.uuid
                 WHERE p.creator_id REGEXP '^[0-9]+$'"
            );
        }

        try {
            Schema::table('users', function (Blueprint $table) {
                $table->unique('uuid', 'users_uuid_unique');
            });
        } catch (\Throwable) {
        }

        try {
            Schema::table('payments', function (Blueprint $table) {
                $table->foreign('creator_id', 'payments_creator_uuid_fk')
                    ->references('uuid')
                    ->on('users')
                    ->onDelete('cascade');
            });
        } catch (\Throwable) {
        }
    }

    public function down(): void
    {
        if (!Schema::hasTable('payments') || !Schema::hasTable('users')) {
            return;
        }

        try {
            Schema::table('payments', function (Blueprint $table) {
                $table->dropForeign('payments_creator_uuid_fk');
            });
        } catch (\Throwable) {
        }

        try {
            Schema::table('users', function (Blueprint $table) {
                $table->dropUnique('users_uuid_unique');
            });
        } catch (\Throwable) {
        }
    }
};

