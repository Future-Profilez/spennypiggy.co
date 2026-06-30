<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Pre-renewal reminder dedup: store the upcoming_payment value we last reminded
 * the buyer about, so each renewal window triggers exactly one heads-up.
 */
return new class extends Migration
{
    public function up(): void
    {
        foreach (['bill_payments', 'membership_payments'] as $table) {
            Schema::table($table, function (Blueprint $t) {
                $t->dateTime('renewal_reminded_for')->nullable()->after('upcoming_payment');
            });
        }
    }

    public function down(): void
    {
        foreach (['bill_payments', 'membership_payments'] as $table) {
            Schema::table($table, function (Blueprint $t) {
                $t->dropColumn('renewal_reminded_for');
            });
        }
    }
};
