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
        Schema::create('payout_records', function (Blueprint $table) {
            $table->id();
            $table->uuid('uuid')->unique();
            $table->string('creator_id')->index(); // UUID of user
            $table->foreignUuid('payout_run_id')->nullable()->constrained('payout_runs')->onDelete('set null');
            $table->string('stripe_payout_id')->nullable()->index();
            $table->integer('amount_minor');
            $table->string('currency', 3);
            $table->string('status')->default('pending'); // pending, in_transit, paid, failed, canceled
            $table->timestamp('arrival_date')->nullable();
            $table->text('failure_code')->nullable();
            $table->text('failure_message')->nullable();
            $table->json('metadata')->nullable();
            $table->timestamps();
            $table->softDeletes();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('payout_records');
    }
};
