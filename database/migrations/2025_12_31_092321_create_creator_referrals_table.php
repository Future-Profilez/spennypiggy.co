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
        Schema::create('creator_referrals', function (Blueprint $table) {
            $table->id();

            $table->unsignedBigInteger('referrer_creator_id');
            $table->unsignedBigInteger('referred_creator_id');

            $table->decimal('lifetime_gmv', 10, 2)->default(0);

            $table->enum('status', [
                'IN_PROGRESS',   // not qualified
                'QUALIFIED',     // £1000 GMV reached
                'PAYOUT_REQUESTED',
                'PAID',
                'REVOKED'
            ])->default('IN_PROGRESS');

            $table->timestamp('qualified_at')->nullable();

            $table->timestamps();

            $table->unique('referred_creator_id');

            $table->foreign('referrer_creator_id')->references('id')->on('users');
            $table->foreign('referred_creator_id')->references('id')->on('users');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('creator_referrals');
    }
};
