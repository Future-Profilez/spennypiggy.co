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
        Schema::create('tasks', function (Blueprint $table) {
            $table->id();
            $table->uuid('uuid')->unique();
            $table->foreignId('creator_id')->constrained('users')->onDelete('cascade');
            $table->string('title');
            $table->text('description')->nullable();
            $table->decimal('price', 10, 2);
            $table->string('category')->nullable();
            $table->string('type')->default('instant'); // 'instant', 'timed'
            $table->string('status')->default('active'); // 'draft', 'pending_review', 'active', 'rejected', 'archived'
            $table->string('media_url')->nullable(); // Cover image

            // Phase 1 Deliverables (Stored on Task for Instant)
            $table->string('deliverable_content_type')->nullable(); // 'text', 'image', 'voice', 'pdf', 'badge'
            $table->text('deliverable_content')->nullable(); // URL or Text

            // Phase 2
            $table->integer('sla_hours')->nullable();

            // Stripe
            $table->string('stripe_product_id')->nullable();
            $table->string('stripe_price_id')->nullable();

            $table->timestamps();
            $table->softDeletes();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('tasks');
    }
};
