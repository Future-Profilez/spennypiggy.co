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
        // Add FX fields to user_payments table
        if (Schema::hasTable('user_payments')) {
            Schema::table('user_payments', function (Blueprint $table) {
                if (! Schema::hasColumn('user_payments', 'creator_currency')) {
                    $table->string('creator_currency', 3)->nullable()->after('currency');
                    $table->string('charge_currency', 3)->nullable()->after('creator_currency');
                    $table->string('display_currency', 3)->nullable()->after('charge_currency');
                    $table->decimal('stripe_fee_actual', 10, 2)->nullable()->after('display_currency');
                    $table->decimal('stripe_fee_expected', 10, 2)->nullable()->after('stripe_fee_actual');
                    $table->string('supporter_country', 3)->nullable()->after('stripe_fee_expected');
                    $table->string('card_country', 3)->nullable()->after('supporter_country');
                    $table->decimal('fee_variance', 10, 2)->nullable()->after('card_country');
                }
            });
        }

        // Add FX fields to membership_payments table
        if (Schema::hasTable('membership_payments')) {
            Schema::table('membership_payments', function (Blueprint $table) {
                if (! Schema::hasColumn('membership_payments', 'creator_currency')) {
                    $table->string('creator_currency', 3)->nullable()->after('currency');
                    $table->string('charge_currency', 3)->nullable()->after('creator_currency');
                    $table->string('display_currency', 3)->nullable()->after('charge_currency');
                    $table->decimal('stripe_fee_actual', 10, 2)->nullable()->after('display_currency');
                    $table->decimal('stripe_fee_expected', 10, 2)->nullable()->after('stripe_fee_actual');
                    $table->string('supporter_country', 3)->nullable()->after('stripe_fee_expected');
                    $table->string('card_country', 3)->nullable()->after('supporter_country');
                    $table->decimal('fee_variance', 10, 2)->nullable()->after('card_country');
                }
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('user_payments', function (Blueprint $table) {
            $table->dropColumn([
                'creator_currency',
                'charge_currency',
                'display_currency',
                'stripe_fee_actual',
                'stripe_fee_expected',
                'supporter_country',
                'card_country',
                'fee_variance',
            ]);
        });

        Schema::table('membership_payments', function (Blueprint $table) {
            $table->dropColumn([
                'creator_currency',
                'charge_currency',
                'display_currency',
                'stripe_fee_actual',
                'stripe_fee_expected',
                'supporter_country',
                'card_country',
                'fee_variance',
            ]);
        });
    }
};
