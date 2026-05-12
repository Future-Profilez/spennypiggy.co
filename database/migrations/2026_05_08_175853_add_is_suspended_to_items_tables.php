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
        if (! Schema::hasColumn('shops', 'is_suspended')) {
            Schema::table('shops', function (Blueprint $table) {
                $table->boolean('is_suspended')->default(false)->after('status');
            });
        }

        if (! Schema::hasColumn('wish_items', 'is_suspended')) {
            Schema::table('wish_items', function (Blueprint $table) {
                $table->boolean('is_suspended')->default(false)->after('is_approved');
            });
        }

        if (! Schema::hasColumn('bills', 'is_suspended')) {
            Schema::table('bills', function (Blueprint $table) {
                $table->boolean('is_suspended')->default(false)->after('status');
            });
        }

        if (! Schema::hasColumn('memberships', 'is_suspended')) {
            Schema::table('memberships', function (Blueprint $table) {
                $table->boolean('is_suspended')->default(false)->after('status');
            });
        }

        if (! Schema::hasColumn('tasks', 'is_suspended')) {
            Schema::table('tasks', function (Blueprint $table) {
                $table->boolean('is_suspended')->default(false)->after('status');
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (Schema::hasColumn('shops', 'is_suspended')) {
            Schema::table('shops', function (Blueprint $table) {
                $table->dropColumn('is_suspended');
            });
        }

        if (Schema::hasColumn('wish_items', 'is_suspended')) {
            Schema::table('wish_items', function (Blueprint $table) {
                $table->dropColumn('is_suspended');
            });
        }

        if (Schema::hasColumn('bills', 'is_suspended')) {
            Schema::table('bills', function (Blueprint $table) {
                $table->dropColumn('is_suspended');
            });
        }

        if (Schema::hasColumn('memberships', 'is_suspended')) {
            Schema::table('memberships', function (Blueprint $table) {
                $table->dropColumn('is_suspended');
            });
        }

        if (Schema::hasColumn('tasks', 'is_suspended')) {
            Schema::table('tasks', function (Blueprint $table) {
                $table->dropColumn('is_suspended');
            });
        }
    }
};
