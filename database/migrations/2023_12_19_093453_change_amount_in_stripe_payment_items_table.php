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
        Schema::table('stripe_payment_items', function (Blueprint $table) {
            $table->double('tax', 10, 2)->default(0.00)->change();
            $table->double('amount', 10, 2)->default(0.00)->change();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('stripe_payment_items', function (Blueprint $table) {
            //
        });
    }
};
