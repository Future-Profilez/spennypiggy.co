<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('founder_bonuses', function (Blueprint $table) {
            $table->string('stripe_transfer_id')->nullable()->after('payout_status');
            $table->string('stripe_payout_id')->nullable()->after('stripe_transfer_id');
            $table->uuid('payout_record_uuid')->nullable()->after('stripe_payout_id');
            $table->timestamp('paid_date')->nullable()->after('payout_record_uuid');

            $table->index('stripe_payout_id');
            $table->index('payout_record_uuid');
        });
    }

    public function down(): void
    {
        Schema::table('founder_bonuses', function (Blueprint $table) {
            $table->dropIndex('founder_bonuses_stripe_payout_id_index');
            $table->dropIndex('founder_bonuses_payout_record_uuid_index');
            $table->dropColumn(['stripe_transfer_id', 'stripe_payout_id', 'payout_record_uuid', 'paid_date']);
        });
    }
};

