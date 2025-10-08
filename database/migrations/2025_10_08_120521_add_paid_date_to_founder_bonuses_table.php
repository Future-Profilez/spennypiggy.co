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
        Schema::table('founder_bonuses', function (Blueprint $table) {
            $table->timestamp('paid_date')->nullable()->after('payout_status');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('founder_bonuses', function (Blueprint $table) {
            $table->dropColumn('paid_date');
        });
    }
};
