<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('support_tickets', function (Blueprint $table) {
            $table->id();
            $table->string('uuid')->unique();

            $table->string('type');
            $table->string('status')->index();

            $table->unsignedBigInteger('creator_id')->index();
            $table->unsignedBigInteger('supporter_id')->nullable()->index();
            $table->string('guest_email')->nullable()->index();

            $table->string('event_type')->nullable();
            $table->string('source')->nullable();
            $table->string('source_id')->nullable();

            $table->string('stripe_payment_intent_id')->nullable()->index();
            $table->string('stripe_session_id')->nullable()->index();

            $table->text('reason')->nullable();

            $table->timestamp('sla_deadline')->nullable()->index();
            $table->timestamp('reminder_24h_sent_at')->nullable();
            $table->timestamp('reminder_6h_sent_at')->nullable();

            $table->timestamp('last_message_at')->nullable()->index();
            $table->timestamp('last_creator_message_at')->nullable();
            $table->timestamp('last_supporter_message_at')->nullable();
            $table->timestamp('last_admin_message_at')->nullable();

            $table->timestamp('escalated_at')->nullable()->index();
            $table->timestamp('resolved_at')->nullable();

            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('support_tickets');
    }
};

