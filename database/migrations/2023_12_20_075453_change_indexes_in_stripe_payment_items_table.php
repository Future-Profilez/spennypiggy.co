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
            $table->renameColumn('stripe_payment_id', 'stripe_payment_detail_id');
            $table->index('stripe_payment_detail_id');
            $table->index('user_cart_id');
            $table->index('wish_item_id');
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
