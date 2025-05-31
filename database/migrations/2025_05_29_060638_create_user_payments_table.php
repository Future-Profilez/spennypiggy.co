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
        Schema::create('user_payments', function (Blueprint $table) {
            $table->id();
            $table->bigInteger('from_user_id')->unsigned();
            $table->bigInteger('to_user_id')->unsigned();
            $table->string('product_type')->nullable();
            $table->bigInteger('amount')->unsigned();
            $table->string('currency', 3)->default('USD');
            $table->string('payment_method')->nullable(); // e.g., credit_card, paypal
            $table->longText('payment_details')->nullable();
            $table->timestamp('paid_at')->nullable();
            $table->string('status')->default('completed'); // pending, completed, failed
            $table->foreign('from_user_id')->references('id')->on('users')->onDelete('cascade');
            $table->foreign('to_user_id')->references('id')->on('users')->onDelete('cascade');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('user_payments');
    }
};
