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
        $tables = [
            'shop_payments',
            'bill_payments',
            'task_purchases',
            'membership_payments',
            'rye_product_payments',
            'stripe_payment_items',
            'user_payments',
            'wish_item_subscriptions',
        ];

        foreach ($tables as $tableName) {
            if (Schema::hasTable($tableName) && !Schema::hasColumn($tableName, 'total_paid')) {
                Schema::table($tableName, function (Blueprint $table) use ($tableName) {
                    $column = $table->double('total_paid', 15, 2)->default(0.00);
                    
                    if (Schema::hasColumn($tableName, 'amount')) {
                        $column->after('amount');
                    }
                });
            }
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        $tables = [
            'shop_payments',
            'bill_payments',
            'task_purchases',
            'membership_payments',
            'rye_product_payments',
            'stripe_payment_items',
            'user_payments',
        ];

        foreach ($tables as $tableName) {
            if (Schema::hasTable($tableName) && Schema::hasColumn($tableName, 'total_paid')) {
                Schema::table($tableName, function (Blueprint $table) {
                    $table->dropColumn('total_paid');
                });
            }
        }
    }
};
