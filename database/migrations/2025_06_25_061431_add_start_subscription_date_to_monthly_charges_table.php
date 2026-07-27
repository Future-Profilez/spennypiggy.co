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
        if (! Schema::hasTable('monthly_charges')) {
            return;
        }

        Schema::table('monthly_charges', function (Blueprint $table) {
            $table->timestamp('current_end_trial_date')->nullable()->after('tax');
            $table->timestamp('current_start_trial_date')->nullable()->after('tax');
            $table->timestamp('current_end_subscription_date')->nullable()->after('tax');
            $table->timestamp('current_start_subscription_date')->nullable()->after('tax');
            $table->timestamp('cancelled_at')->nullable()->after('tax');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('monthly_charges', function (Blueprint $table) {
            //
        });
    }
};
