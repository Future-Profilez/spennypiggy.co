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
        Schema::create('financial_transactions', function (Blueprint $table) {
            $table->id();
            $table->uuid('uuid')->unique();
            $table->foreignId('user_id')->constrained()->onDelete('cascade'); // Creator
            $table->foreignId('supporter_id')->nullable()->constrained('users')->onDelete('set null');
            $table->nullableMorphs('source'); // source_type, source_id
            $table->string('type'); // income, expense, refund, payout
            $table->decimal('gross_amount', 15, 2);
            $table->decimal('platform_fee', 15, 2)->default(0);
            $table->decimal('stripe_fee', 15, 2)->default(0);
            $table->decimal('vat_amount', 15, 2)->default(0);
            $table->decimal('net_amount', 15, 2);
            $table->string('currency', 3)->default('GBP');
            $table->string('status')->default('completed');
            $table->string('description')->nullable();
            $table->timestamp('transaction_date');
            $table->timestamps();
            $table->softDeletes();

            $table->index(['user_id', 'transaction_date']);
            $table->index(['user_id', 'type']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('financial_transactions');
    }
};
