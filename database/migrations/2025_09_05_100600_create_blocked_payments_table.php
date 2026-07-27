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
        Schema::create('blocked_payments', function (Blueprint $table) {
            $table->id();
            $table->string('uuid')->unique();
            $table->unsignedBigInteger('creator_id');
            $table->unsignedBigInteger('payer_id')->nullable();
            $table->decimal('amount', 10, 2);
            $table->string('currency', 3)->default('USD');
            $table->string('payment_type'); // 'tip', 'bill', 'membership', 'wish', 'shop'
            $table->string('payment_method')->nullable(); // 'stripe', 'paypal', etc.
            $table->string('blocked_reason'); // 'insufficient_content', 'grace_period_ended', etc.
            $table->json('activity_data')->nullable(); // Activity validation response
            $table->json('payer_info')->nullable(); // Payer details (name, email, etc.)
            $table->json('payment_metadata')->nullable(); // Additional payment context
            $table->string('ip_address')->nullable();
            $table->string('user_agent')->nullable();
            $table->timestamp('blocked_at');
            $table->timestamps();

            // Indexes
            $table->index(['creator_id', 'blocked_at']);
            $table->index(['payment_type', 'blocked_at']);
            $table->index(['blocked_reason', 'blocked_at']);
            $table->index('blocked_at');

            // Foreign key
            $table->foreign('creator_id')->references('id')->on('users')->onDelete('cascade');
            $table->foreign('payer_id')->references('id')->on('users')->onDelete('set null');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('blocked_payments');
    }
};
