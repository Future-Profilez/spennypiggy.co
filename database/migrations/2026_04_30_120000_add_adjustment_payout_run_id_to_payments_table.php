<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('payments', function (Blueprint $table) {
            if (!Schema::hasColumn('payments', 'adjustment_payout_run_id')) {
                $table->uuid('adjustment_payout_run_id')->nullable()->index();
            }
        });
    }

    public function down(): void
    {
        Schema::table('payments', function (Blueprint $table) {
            if (Schema::hasColumn('payments', 'adjustment_payout_run_id')) {
                $table->dropColumn('adjustment_payout_run_id');
            }
        });
    }
};

