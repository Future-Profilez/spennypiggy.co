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
        Schema::create('deliverables', function (Blueprint $table) {
            $table->id();
            $table->uuid('uuid')->unique();
            $table->string('transaction_id')->index();
            $table->string('stripe_session_id')->nullable()->index();
            $table->unsignedBigInteger('buyer_id')->index();
            $table->unsignedBigInteger('creator_id')->index();
            $table->enum('product_type', [
                'piggy_bank', 
                'membership', 
                'wish_subscription', 
                'bill_subscription', 
                'wish', 
                'shop_item'
            ]);
            $table->string('product_id')->nullable();
            $table->text('deliverable_url')->nullable();
            $table->text('receipt_url')->nullable();
            $table->text('certificate_url')->nullable();
            $table->enum('status', [
                'pending', 
                'delivered', 
                'late', 
                'escalated', 
                'revoked'
            ])->default('pending')->index();
            $table->timestamp('sla_deadline')->nullable()->index();
            $table->enum('sla_status', [
                'on_time', 
                'late', 
                'escalated'
            ])->default('on_time')->index();
            $table->timestamp('delivered_at')->nullable();
            $table->json('metadata')->nullable(); // Store additional product-specific data
            $table->timestamps();
            
            // Foreign key constraints
            $table->foreign('buyer_id')->references('id')->on('users')->onDelete('cascade');
            $table->foreign('creator_id')->references('id')->on('users')->onDelete('cascade');
            
            // Composite indexes for common queries
            $table->index(['creator_id', 'status']);
            $table->index(['buyer_id', 'status']);
            $table->index(['sla_deadline', 'status']);
            $table->index(['product_type', 'status']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('deliverables');
    }
};