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
        Schema::table('task_purchases', function (Blueprint $table) {
            $table->decimal('admin_fee', 10, 2)->default(0)->after('amount');
            $table->decimal('platform_fee', 10, 2)->default(0)->after('admin_fee');
            $table->decimal('vat_amount', 10, 2)->default(0)->after('platform_fee');
            $table->decimal('transfer_amount', 10, 2)->default(0)->after('vat_amount');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('task_purchases', function (Blueprint $table) {
            $table->dropColumn(['admin_fee', 'platform_fee', 'vat_amount', 'transfer_amount']);
        });
    }
};
