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
        Schema::create('task_purchases', function (Blueprint $table) {
            $table->id();
            $table->uuid('uuid')->unique();
            $table->foreignId('task_id')->constrained('tasks')->onDelete('cascade');
            $table->foreignId('supporter_id')->constrained('users')->onDelete('cascade');
            $table->foreignId('creator_id')->constrained('users')->onDelete('cascade');
            
            $table->string('stripe_session_id')->nullable();
            $table->string('payment_intent_id')->nullable();
            $table->decimal('amount', 10, 2);
            
            // Status: 'initiated', 'paid', 'delivered', 'assigned', 'pending_review', 'completed_accepted', 'rejected_once', 'escalated', 'sla_missed', 'refunded'
            $table->string('status')->default('initiated');
            
            // Timed Task Specifics
            $table->text('proof_content')->nullable(); // JSON or Text path to proof
            $table->text('rejection_reason')->nullable();
            $table->timestamp('sla_deadline')->nullable();
            $table->timestamp('reviewed_at')->nullable();
            $table->timestamp('completed_at')->nullable();
            
            $table->timestamps();
            $table->softDeletes();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('task_purchases');
    }
};
