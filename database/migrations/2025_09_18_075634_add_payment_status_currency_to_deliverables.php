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
        Schema::table('deliverables', function (Blueprint $table) {
            $table->string('payment_status')->nullable()->after('customer_name');
            $table->string('payment_currency')->nullable()->after('payment_status');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('deliverables', function (Blueprint $table) {
            $table->dropColumn(['payment_status', 'payment_currency']);
        });
    }
};
