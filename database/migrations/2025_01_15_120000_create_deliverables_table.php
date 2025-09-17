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
            $table->string('product_id')->index(); // Stripe product.id
            $table->string('price_id')->index(); // Stripe price.id
            $table->unsignedBigInteger('creator_id')->index();
            $table->unsignedBigInteger('gifter_id')->index(); // Buyer/Gifter user
            $table->string('payment_intent_id')->index(); // Stripe payment intent
            $table->string('session_id')->index(); // Stripe checkout.session.id
            $table->enum('deliverable_type', [
                'digital_file',
                'pdf_receipt', 
                'badge',
                'cert',
                'access',
                'post',
                'media_bundle'
            ]);
            $table->text('deliverable_url')->nullable(); // File URL / S3 link / generated PDF path
            $table->json('metadata')->nullable(); // Copy of Stripe metadata payload
            $table->enum('status', [
                'pending', 
                'delivered', 
                'failed'
            ])->default('pending')->index();
            $table->timestamp('delivered_at')->nullable();
            $table->timestamps();
            
            // Foreign key constraints
            $table->foreign('gifter_id')->references('id')->on('users')->onDelete('cascade');
            $table->foreign('creator_id')->references('id')->on('users')->onDelete('cascade');
            
            // Composite indexes for common queries
            $table->index(['creator_id', 'status']);
            $table->index(['gifter_id', 'status']);
            $table->index(['deliverable_type', 'status']);
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