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
        Schema::create('stripe_payment_items', function (Blueprint $table) {
            $table->id();
            $table->uuid();
            $table->foreignId('stripe_payment_id')->nullable();
            $table->foreignId('wish_item_id')->nullable();
            $table->foreignId('user_cart_id')->nullable();
            $table->bigInteger('amount')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('stripe_payment_items');
    }
};
