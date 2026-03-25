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
        if (!Schema::hasTable('bill_payments')) {
            return;
        }

        Schema::table('bill_payments', function (Blueprint $table){
            if (!Schema::hasColumn('bill_payments', 'creator_currency')) {
                $table->string('creator_currency', 3)->nullable()->after('currency');
            }
            if (!Schema::hasColumn('bill_payments', 'charge_currency')) {
                $table->string('charge_currency', 3)->nullable()->after('creator_currency');
            }
            if (!Schema::hasColumn('bill_payments', 'display_currency')) {
                $table->string('display_currency', 3)->nullable()->after('charge_currency');
            }
            if (!Schema::hasColumn('bill_payments', 'stripe_fee_actual')) {
                $table->decimal('stripe_fee_actual', 10, 2)->nullable()->after('display_currency');
            }
            if (!Schema::hasColumn('bill_payments', 'stripe_fee_expected')) {
                $table->decimal('stripe_fee_expected', 10, 2)->nullable()->after('stripe_fee_actual');
            }
            if (!Schema::hasColumn('bill_payments', 'supporter_country')) {
                $table->string('supporter_country', 3)->nullable()->after('stripe_fee_expected');
            }
            if (!Schema::hasColumn('bill_payments', 'card_country')) {
                $table->string('card_country', 3)->nullable()->after('supporter_country');
            }
            if (!Schema::hasColumn('bill_payments', 'fee_variance')) {
                $table->decimal('fee_variance', 10, 2)->nullable()->after('card_country');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void {
        if (!Schema::hasTable('bill_payments')) {
            return;
        }

        Schema::table('bill_payments', function (Blueprint $table) {
            $columns = [
                'creator_currency',
                'charge_currency',
                'display_currency',
                'stripe_fee_actual',
                'stripe_fee_expected',
                'supporter_country',
                'card_country',
                'fee_variance',
            ];

            $existing = array_values(array_filter($columns, function ($col) {
                return Schema::hasColumn('bill_payments', $col);
            }));

            if (!empty($existing)) {
                $table->dropColumn($existing);
            }
        });
    }
};
