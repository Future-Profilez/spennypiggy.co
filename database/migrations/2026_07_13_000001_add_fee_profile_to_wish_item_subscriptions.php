<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Records which pricing profile (card 21% construction vs bank 15%) priced a
 * one-time wish purchase, so resyncs and statements never recompute a
 * bank-paid row with card rates.
 */
return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('wish_item_subscriptions') && ! Schema::hasColumn('wish_item_subscriptions', 'fee_profile')) {
            Schema::table('wish_item_subscriptions', function (Blueprint $t) {
                $t->string('fee_profile', 10)->nullable();
            });
        }
    }

    public function down(): void
    {
        if (Schema::hasTable('wish_item_subscriptions') && Schema::hasColumn('wish_item_subscriptions', 'fee_profile')) {
            Schema::table('wish_item_subscriptions', function (Blueprint $t) {
                $t->dropColumn('fee_profile');
            });
        }
    }
};
