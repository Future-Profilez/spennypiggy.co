<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {

    public function up(): void
    {
        Schema::table('creator_referral_payouts', function (Blueprint $table) {

            // Rename stripe_payout_id → stripe_transfer_id
            if (Schema::hasColumn('creator_referral_payouts', 'stripe_payout_id')) {
                $table->renameColumn('stripe_payout_id', 'stripe_transfer_id');
            }

            // Drop approval_status
            if (Schema::hasColumn('creator_referral_payouts', 'approval_status')) {
                $table->dropColumn('approval_status');
            }
        });
    }

    public function down(): void
    {
        Schema::table('creator_referral_payouts', function (Blueprint $table) {

            // Re-add approval_status
            if (!Schema::hasColumn('creator_referral_payouts', 'approval_status')) {
                $table->string('approval_status')->default('PENDING');
            }

            // Rename back if needed
            if (Schema::hasColumn('creator_referral_payouts', 'stripe_transfer_id')) {
                $table->renameColumn('stripe_transfer_id', 'stripe_payout_id');
            }
        });
    }
};
