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
        if (!Schema::hasColumn('users', 'address_verification_error') || !Schema::hasColumn('users', 'profile_status_lock')) {
            Schema::table('users', function (Blueprint $table) {
                if (!Schema::hasColumn('users', 'address_verification_error')) {
                    $table->text('address_verification_error')->nullable()->after('is_uk');
                }
                if (!Schema::hasColumn('users', 'profile_status_lock')) {
                    $table->tinyInteger('profile_status_lock')->default(0)->after('is_uk')->comment('0: locked, 1: unlocked');
                }
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (Schema::hasColumn('users', 'address_verification_error') || Schema::hasColumn('users', 'profile_status_lock')) {
            Schema::table('users', function (Blueprint $table) {
                if (Schema::hasColumn('users', 'address_verification_error')) {
                    $table->dropColumn('address_verification_error');
                }
                if (Schema::hasColumn('users', 'profile_status_lock')) {
                    $table->dropColumn('profile_status_lock');
                }
            });
        }
    }
};
