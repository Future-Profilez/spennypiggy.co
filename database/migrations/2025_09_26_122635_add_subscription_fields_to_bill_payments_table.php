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
        Schema::table('bill_payments', function (Blueprint $table) {
            $table->timestamp('current_period_start')->nullable()->after('upcoming_payment')->comment('Current subscription period start');
            $table->timestamp('current_period_end')->nullable()->after('current_period_start')->comment('Current subscription period end');
            $table->string('stripe_status')->nullable()->after('current_period_end')->comment('Stripe subscription status (active, canceled, etc.)');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('bill_payments', function (Blueprint $table) {
            $table->dropColumn(['current_period_start', 'current_period_end', 'stripe_status']);
        });
    }
};
