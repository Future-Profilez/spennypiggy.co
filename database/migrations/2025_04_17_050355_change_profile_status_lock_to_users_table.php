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
        Schema::table('users', function (Blueprint $table) {
            $table->renameColumn('is_add_matched', 'profile_status_lock');
        });

        // Now add the comment
        Schema::table('users', function (Blueprint $table) {
            $table->tinyInteger('profile_status_lock')->comment('0: unlocked, 1: locked')->change();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->renameColumn('profile_status_lock', 'is_add_matched');
        });

        // Restore the comment if needed
        Schema::table('users', function (Blueprint $table) {
            $table->tinyInteger('is_add_matched')->comment('0: unlocked, 1: locked')->change();
        });
    }
};
