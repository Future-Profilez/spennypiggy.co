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
        Schema::create('rye_product_payments', function (Blueprint $table) {
            $table->id();
            $table->uuid('uuid')->unique();
            $table->bigInteger('user_id');
            $table->bigInteger('product_id');
            $table->string('currency', 3); // Store currency code (USD, INR, etc.)
            $table->unsignedDecimal('amount', 10, 2); // Ensure no negative values
            $table->unsignedDecimal('tax', 10, 2)->default(0); // Default 0 to avoid null
            $table->text('message')->nullable();
            $table->boolean('anonymous')->default(false);
            $table->enum('status', ['pending', 'succeeded', 'failed', 'refunded', 'canceled'])->default('pending'); // Use ENUM for predefined statuses
            $table->string('payment_method')->nullable(); // card, upi, wallet, etc.
            $table->string('customer_email')->nullable(); // Store Stripe email
            $table->string('stripe_payment_intent_id')->nullable(); // Intent for tracking
            $table->string('stripe_charge_id')->nullable(); // Charge ID for refund tracking
            $table->string('stripe_payment_intent_client_secret')->nullable();
            $table->string('stripe_payment_intent_status')->nullable();
            $table->string('stripe_payment_intent_last_payment_error')->nullable();
            $table->json('payment_metadata')->nullable(); // Store raw Stripe response if needed
            $table->timestamps();
            $table->softDeletes();
        });
    }


    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('rye_product_payments');
    }
};
