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
        Schema::create('deliverable_notifications', function (Blueprint $table) {
            $table->id();
            $table->uuid('uuid')->unique();
            $table->unsignedBigInteger('deliverable_id')->index();
            $table->unsignedBigInteger('user_id')->index(); // Recipient of notification
            $table->enum('notification_type', [
                'purchase_confirmation',
                'deliverable_pending',
                'deliverable_delivered',
                'sla_warning',
                'sla_violation',
                'penalty_applied',
                'refund_processed',
            ]);
            $table->enum('channel', ['email', 'dashboard', 'sms'])->default('email');
            $table->string('subject')->nullable();
            $table->text('message');
            $table->enum('status', ['pending', 'sent', 'failed'])->default('pending');
            $table->timestamp('sent_at')->nullable();
            $table->json('metadata')->nullable(); // Store additional notification data
            $table->timestamps();

            // Foreign key constraints
            $table->foreign('deliverable_id')->references('id')->on('deliverables')->onDelete('cascade');
            $table->foreign('user_id')->references('id')->on('users')->onDelete('cascade');

            // Indexes for common queries
            $table->index(['user_id', 'notification_type']);
            $table->index(['status', 'created_at']);
            $table->index(['deliverable_id', 'notification_type']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('deliverable_notifications');
    }
};
