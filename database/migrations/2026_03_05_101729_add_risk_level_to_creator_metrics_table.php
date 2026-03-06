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
        Schema::table('creator_metrics', function (Blueprint $table) {
            $table->string('risk_level')->default('low')->after('volatility_score');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('creator_metrics', function (Blueprint $table) {
            $table->dropColumn('risk_level');
        });
    }
};
