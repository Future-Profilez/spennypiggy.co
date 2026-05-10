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
        Schema::table('shops', function (Blueprint $table) {
            $table->boolean('is_suspended')->default(false)->after('status');
        });
        Schema::table('wish_items', function (Blueprint $table) {
            $table->boolean('is_suspended')->default(false)->after('is_approved');
        });
        Schema::table('bills', function (Blueprint $table) {
            $table->boolean('is_suspended')->default(false)->after('status');
        });
        Schema::table('memberships', function (Blueprint $table) {
            $table->boolean('is_suspended')->default(false)->after('status');
        });
        Schema::table('tasks', function (Blueprint $table) {
            $table->boolean('is_suspended')->default(false)->after('status');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('shops', function (Blueprint $table) {
            $table->dropColumn('is_suspended');
        });
        Schema::table('wish_items', function (Blueprint $table) {
            $table->dropColumn('is_suspended');
        });
        Schema::table('bills', function (Blueprint $table) {
            $table->dropColumn('is_suspended');
        });
        Schema::table('memberships', function (Blueprint $table) {
            $table->dropColumn('is_suspended');
        });
        Schema::table('tasks', function (Blueprint $table) {
            $table->dropColumn('is_suspended');
        });
    }
};
