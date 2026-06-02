<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('fast_start_bonus_payouts', function (Blueprint $table) {
            $table->id();
            $table->uuid('creator_uuid')->unique();
            $table->string('stripe_account_id')->nullable()->index();
            $table->timestamp('window_start')->nullable();
            $table->timestamp('window_end')->nullable();
            $table->bigInteger('earnings_minor')->default(0);
            $table->bigInteger('bonus_minor')->default(0);
            $table->string('currency', 3)->default('GBP');
            $table->string('status')->default('pending');
            $table->string('stripe_transfer_id')->nullable()->index();
            $table->string('stripe_payout_id')->nullable()->index();
            $table->timestamp('paid_at')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('fast_start_bonus_payouts');
    }
};

