<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('creator_referral_payouts', function (Blueprint $table) {
            $table->enum('status', [
                'PENDING',        // request created
                'UNDER_REVIEW',   // admin reviewing
                'APPROVED',       // admin approved
                'REJECTED',       // admin rejected
                'PAID'            // Stripe payout completed
            ])->default('PENDING')->after('requested_at');
        });
    }

    public function down(): void
    {
        Schema::table('creator_referral_payouts', function (Blueprint $table) {
            $table->dropColumn('status');
        });
    }
};
