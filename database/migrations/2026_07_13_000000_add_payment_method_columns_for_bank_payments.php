<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Bank payments (Pay by Bank / SEPA / ACH):
 *  - listing tables get a creator-controlled payment_methods_accepted
 *    preference (card | bank | both);
 *  - one-off payment tables record which fee profile priced the charge
 *    (card 21% construction vs bank 15%) for audit/statements.
 */
return new class extends Migration
{
    private array $listingTables = ['shops', 'tasks', 'wish_items', 'piggy_pots', 'tip_goals'];

    private array $paymentTables = ['shop_payments', 'task_purchases', 'piggy_pot_contributions', 'tip_goals_payments', 'stripe_payment_details'];

    public function up(): void
    {
        foreach ($this->listingTables as $table) {
            if (Schema::hasTable($table) && ! Schema::hasColumn($table, 'payment_methods_accepted')) {
                Schema::table($table, function (Blueprint $t) {
                    $t->string('payment_methods_accepted', 10)->default('both');
                });
            }
        }

        foreach ($this->paymentTables as $table) {
            if (Schema::hasTable($table) && ! Schema::hasColumn($table, 'fee_profile')) {
                Schema::table($table, function (Blueprint $t) {
                    $t->string('fee_profile', 10)->nullable();
                });
            }
        }
    }

    public function down(): void
    {
        foreach ($this->listingTables as $table) {
            if (Schema::hasTable($table) && Schema::hasColumn($table, 'payment_methods_accepted')) {
                Schema::table($table, function (Blueprint $t) {
                    $t->dropColumn('payment_methods_accepted');
                });
            }
        }

        foreach ($this->paymentTables as $table) {
            if (Schema::hasTable($table) && Schema::hasColumn($table, 'fee_profile')) {
                Schema::table($table, function (Blueprint $t) {
                    $t->dropColumn('fee_profile');
                });
            }
        }
    }
};
