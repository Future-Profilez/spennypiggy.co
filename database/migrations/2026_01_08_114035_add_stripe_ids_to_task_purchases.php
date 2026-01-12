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
        Schema::table('task_purchases', function (Blueprint $table) {
            $table->string('charge_id')->nullable()->after('payment_intent_id');
            $table->string('transfer_id')->nullable()->after('charge_id');
            $table->string('refund_id')->nullable()->after('refunded_at');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('task_purchases', function (Blueprint $table) {
            $table->dropColumn(['charge_id', 'transfer_id', 'refund_id']);
        });
    }
};
