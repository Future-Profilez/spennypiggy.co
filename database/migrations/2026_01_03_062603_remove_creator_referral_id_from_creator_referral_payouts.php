<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (config('database.default') === 'sqlite') {
            return;
        }

        Schema::table('creator_referral_payouts', function (Blueprint $table) {
            // 1️⃣ Drop foreign key constraint FIRST
            $table->dropForeign(['creator_referral_id']);

            // 2️⃣ Drop the column
            $table->dropColumn('creator_referral_id');
        });
    }

    public function down(): void
    {
        Schema::table('creator_referral_payouts', function (Blueprint $table) {
            // Recreate column (nullable to avoid old issue)
            $table->unsignedBigInteger('creator_referral_id')->nullable();

            // Recreate foreign key
            $table->foreign('creator_referral_id')
                ->references('id')
                ->on('creator_referrals')
                ->onDelete('cascade');
        });
    }
};
