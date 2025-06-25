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
        Schema::table('monthly_charges', function (Blueprint $table) {
            $table->date('current_end_trial_date')->nullable()->after('tax');
            $table->date('current_start_trial_date')->nullable()->after('tax');
            $table->date('current_end_subscription_date')->nullable()->after('tax');
            $table->date('current_start_subscription_date')->nullable()->after('tax');
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
