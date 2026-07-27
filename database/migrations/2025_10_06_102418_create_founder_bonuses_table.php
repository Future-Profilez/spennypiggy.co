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
        Schema::create('founder_bonuses', function (Blueprint $table) {
            $table->id();
            $table->foreignId('creator_id')->constrained('users')->onDelete('cascade');
            $table->date('qualification_date'); // Date when creator qualified (1st of month)
            $table->decimal('first_30d_earnings', 10, 2); // Earnings in first 30 days
            $table->decimal('bonus_amount', 10, 2); // 10% bonus amount
            $table->date('estimated_payout_date'); // When bonus will be paid
            $table->enum('payout_status', ['pending', 'paid'])->default('pending');
            $table->timestamps();

            // Ensure each creator can only qualify once
            $table->unique('creator_id');

            // Index for efficient queries
            $table->index(['qualification_date', 'payout_status']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('founder_bonuses');
    }
};
