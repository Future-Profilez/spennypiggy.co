<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Tags each ledger row with the pricing profile that produced its fees
 * (card 21% construction vs bank 15%), so the admin finance dashboard and
 * any resync can always use the correct rates. NULL = card (historical).
 */
return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('financial_transactions') && ! Schema::hasColumn('financial_transactions', 'fee_profile')) {
            Schema::table('financial_transactions', function (Blueprint $t) {
                $t->string('fee_profile', 10)->nullable();
            });
        }
    }

    public function down(): void
    {
        if (Schema::hasTable('financial_transactions') && Schema::hasColumn('financial_transactions', 'fee_profile')) {
            Schema::table('financial_transactions', function (Blueprint $t) {
                $t->dropColumn('fee_profile');
            });
        }
    }
};
