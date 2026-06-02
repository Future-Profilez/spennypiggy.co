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
        if (Schema::hasTable('shop_payments') && !Schema::hasColumn('shop_payments', 'expected_delivery_date')) {
            Schema::table('shop_payments', function (Blueprint $table) {
                $table->date('expected_delivery_date')->nullable();
            });
        }

        if (Schema::hasTable('deliverables') && !Schema::hasColumn('deliverables', 'expected_delivery_date')) {
            Schema::table('deliverables', function (Blueprint $table) {
                $table->date('expected_delivery_date')->nullable();
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('shop_payments', function (Blueprint $table) {
            $table->dropColumn('expected_delivery_date');
        });

        Schema::table('deliverables', function (Blueprint $table) {
            $table->dropColumn('expected_delivery_date');
        });
    }
};
