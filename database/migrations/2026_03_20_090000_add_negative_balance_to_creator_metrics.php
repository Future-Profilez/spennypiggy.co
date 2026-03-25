<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('creator_metrics', function (Blueprint $table) {
            $table->bigInteger('negative_balance_minor')->default(0)->after('payout_delay_days');
        });
    }

    public function down(): void
    {
        Schema::table('creator_metrics', function (Blueprint $table) {
            $table->dropColumn('negative_balance_minor');
        });
    }
};

