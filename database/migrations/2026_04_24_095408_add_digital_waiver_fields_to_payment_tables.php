<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * The tables to add waiver fields to.
     */
    protected $tables = [
        'wish_item_subscriptions',
        'membership_payments',
        'bill_payments',
        'task_purchases',
        'stripe_payment_details',
        'monthly_charges',
        'tip_goals_payments',
        'shop_payments',
        'deliverables',
    ];

    /**
     * Run the migrations.
     */
    public function up(): void
    {
        foreach ($this->tables as $table) {
            if (Schema::hasTable($table)) {
                Schema::table($table, function (Blueprint $table) {
                    $table->timestamp('digital_waiver_confirmed_at')->nullable();
                    $table->text('digital_waiver_text')->nullable();
                });
            }
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        foreach ($this->tables as $table) {
            if (Schema::hasTable($table)) {
                Schema::table($table, function (Blueprint $table) {
                    $table->dropColumn(['digital_waiver_confirmed_at', 'digital_waiver_text']);
                });
            }
        }
    }
};
