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
        Schema::table('user_verification_status', function (Blueprint $table) {
            $table->smallInteger('user_profile_status')
                ->default(0)
                ->comment('0: locked, 1: pending, 2: unlocked, 3: card verification success for gifter users, 4: card verification pending for gifter users')
                ->change();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('user_verification_status', function (Blueprint $table) {
            //
        });
    }
};
