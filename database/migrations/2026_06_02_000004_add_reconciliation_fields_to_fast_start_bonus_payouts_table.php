<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('fast_start_bonus_payouts', function (Blueprint $table) {
            if (! Schema::hasColumn('fast_start_bonus_payouts', 'expected_earnings_minor')) {
                $table->bigInteger('expected_earnings_minor')->nullable()->after('bonus_minor');
            }
            if (! Schema::hasColumn('fast_start_bonus_payouts', 'expected_bonus_minor')) {
                $table->bigInteger('expected_bonus_minor')->nullable()->after('expected_earnings_minor');
            }
            if (! Schema::hasColumn('fast_start_bonus_payouts', 'clawback_minor')) {
                $table->bigInteger('clawback_minor')->default(0)->after('expected_bonus_minor');
            }
            if (! Schema::hasColumn('fast_start_bonus_payouts', 'reconciled_at')) {
                $table->timestamp('reconciled_at')->nullable()->after('paid_at');
            }
        });
    }

    public function down(): void
    {
        Schema::table('fast_start_bonus_payouts', function (Blueprint $table) {
            $cols = [];
            foreach (['expected_earnings_minor', 'expected_bonus_minor', 'clawback_minor', 'reconciled_at'] as $c) {
                if (Schema::hasColumn('fast_start_bonus_payouts', $c)) {
                    $cols[] = $c;
                }
            }
            if (! empty($cols)) {
                $table->dropColumn($cols);
            }
        });
    }
};
