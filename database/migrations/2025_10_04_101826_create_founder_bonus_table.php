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
        Schema::create('founder_bonus', function (Blueprint $table) {
            $table->id();
            $table->foreignId('creator_id')->constrained('users')->onDelete('cascade');
            $table->string('month', 7); // Format: YYYY-MM
            $table->decimal('first_30d_earnings', 10, 2)->default(0.00);
            $table->timestamp('founder_qualified_at')->nullable();
            $table->decimal('monthly_earnings', 10, 2)->default(0.00);
            $table->decimal('bonus_amount', 10, 2)->default(0.00);
            $table->enum('payout_status', ['pending', 'approved', 'paid', 'rejected'])->default('pending');
            $table->timestamp('payout_date')->nullable();
            $table->text('payout_rejection_reason')->nullable();
            $table->timestamps();

            // Indexes for performance
            $table->unique(['creator_id', 'month'], 'unique_creator_month');
            $table->index('month');
            $table->index('payout_status');
            $table->index('founder_qualified_at');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('founder_bonus');
    }
};
