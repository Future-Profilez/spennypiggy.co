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
        Schema::create('connected_account_customers', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade'); // Fan
            $table->foreignId('creator_id')->constrained('users')->onDelete('cascade'); // Creator
            $table->string('connected_account_id');
            $table->string('stripe_customer_id');
            $table->string('product_type')->nullable();
            $table->string('product_id')->nullable();
            $table->string('price_id')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('connected_account_customers');
    }
};
