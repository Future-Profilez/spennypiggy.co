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
            if (! Schema::hasColumn('users', 'bio_approved')) {
                $table->smallInteger('bio_approved')->default(0)->after('bio');
            }
            if (! Schema::hasColumn('users', 'is_500_limit_exceeded')) {
                // Check if profile_reject_reason column exists, otherwise add at end
                if (Schema::hasColumn('users', 'profile_reject_reason')) {
                    $table->smallInteger('is_500_limit_exceeded')->default(0)->comment('this is for the gifter')->after('profile_reject_reason');
                } else {
                    $table->smallInteger('is_500_limit_exceeded')->default(0)->comment('this is for the gifter');
                }
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            //
        });
    }
};
