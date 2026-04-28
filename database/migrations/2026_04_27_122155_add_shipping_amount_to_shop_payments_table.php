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
        if (Schema::hasTable('shop_payments') && !Schema::hasColumn('shop_payments', 'shipping_amount')) {
            Schema::table('shop_payments', function (Blueprint $table) {
                $table->decimal('shipping_amount', 15, 2)->default(0)->after('vat_tax_amount');
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (Schema::hasTable('shop_payments') && Schema::hasColumn('shop_payments', 'shipping_amount')) {
            Schema::table('shop_payments', function (Blueprint $table) {
                $table->dropColumn('shipping_amount');
            });
        }
    }
};
