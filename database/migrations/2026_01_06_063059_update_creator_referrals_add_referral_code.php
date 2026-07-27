<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('creator_referrals', function (Blueprint $table) {

            // Link to referral_codes table
            $table->foreignId('referral_code_id')
                ->nullable()
                ->after('referred_creator_id')
                ->constrained('referral_codes')
                ->nullOnDelete();
        });

        // Clean & final status flow
        if (config('database.default') !== 'sqlite') {
            DB::statement("
                ALTER TABLE creator_referrals
                MODIFY status ENUM(
                    'IN_PROGRESS',
                    'QUALIFIED',
                    'PAYOUT_REQUESTED',
                    'PAID'
                ) NOT NULL DEFAULT 'IN_PROGRESS'
            ");
        }
    }

    public function down(): void
    {
        Schema::table('creator_referrals', function (Blueprint $table) {
            $table->dropForeign(['referral_code_id']);
            $table->dropColumn(['referral_code_id']);
        });

        DB::statement("
            ALTER TABLE creator_referrals
            MODIFY status ENUM(
                'IN_PROGRESS',
                'QUALIFIED',
                'PAYOUT_REQUESTED'
            ) NOT NULL DEFAULT 'IN_PROGRESS'
        ");
    }
};
