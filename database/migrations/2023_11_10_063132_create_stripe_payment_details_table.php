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
        Schema::create('stripe_payment_details', function (Blueprint $table) {
            $table->id();
            $table->uuid();
            $table->string('session_id')->nullable();
            $table->bigInteger('amount_subtotal')->nullable();
            $table->bigInteger('amount_total')->nullable();
            $table->string('currency')->nullable();
            $table->string('payment_method_config_detail_id')->nullable();
            $table->string('payment_method_type')->nullable();
            $table->foreignId('user_id')->nullable();
            $table->foreignId('owner_id')->nullable();
            $table->string('payment_status')->nullable();
            $table->string('session_created')->nullable();
            $table->string('session_expires_at')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('stripe_payment_details');
    }
};
