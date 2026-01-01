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
        Schema::create('creator_referral_payouts', function (Blueprint $table) {
            $table->id();

            $table->unsignedBigInteger('creator_referral_id');
            $table->unsignedBigInteger('creator_id'); // referrer

            $table->decimal('amount', 8, 2)->default(50);

            // Creator action
            $table->timestamp('requested_at')->nullable();

            // Admin approval
            $table->enum('approval_status', [
                'PENDING',
                'APPROVED',
                'REJECTED'
            ])->default('PENDING');

            $table->unsignedBigInteger('approved_by_admin_id')->nullable();
            $table->timestamp('approved_at')->nullable();
            $table->text('rejection_reason')->nullable();

            // Stripe payout
            $table->string('stripe_payout_id')->nullable();
            $table->timestamp('paid_at')->nullable();

            $table->timestamps();

            $table->foreign('creator_referral_id')
                ->references('id')
                ->on('creator_referrals')
                ->onDelete('cascade');

            $table->foreign('creator_id')->references('id')->on('users');
            $table->foreign('approved_by_admin_id')->references('id')->on('users');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('creator_referral_payouts');
    }
};
