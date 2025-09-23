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
        Schema::create('subscription_events', function (Blueprint $table) {
            $table->id();
            $table->uuid('uuid');
            $table->string('subscription_type', 50)->comment('wish_item, membership, bill'); // Type of subscription
            $table->unsignedBigInteger('subscription_id'); // ID in the respective subscription table
            $table->string('stripe_subscription_id', 255)->nullable(); // Stripe subscription ID
            $table->string('stripe_event_id', 255)->nullable(); // Stripe event ID
            $table->string('event_type', 100)->comment('created, payment_succeeded, payment_failed, canceled, updated, renewed, trial_started, trial_ended');
            $table->string('event_status', 50)->comment('processed, failed, pending');
            $table->decimal('amount', 10, 2)->nullable(); // Event amount if applicable
            $table->string('currency', 3)->nullable(); // Event currency
            $table->timestamp('event_date')->nullable(); // When the event occurred
            $table->json('event_data')->nullable(); // Full event data from Stripe or system
            $table->text('notes')->nullable(); // Additional notes
            $table->timestamps();
            
            // Indexes
            $table->index(['subscription_type', 'subscription_id'], 'idx_subscription_events_ref');
            $table->index(['stripe_subscription_id', 'event_type'], 'idx_stripe_event_type');
            $table->index(['event_type', 'event_date'], 'idx_event_type_date');
            $table->index('event_date');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('subscription_events');
    }
};
