<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('fast_start_bonus_payouts', function (Blueprint $table) {
            if (! Schema::hasColumn('fast_start_bonus_payouts', 'eligible_at')) {
                $table->timestamp('eligible_at')->nullable()->after('window_end');
            }
            if (! Schema::hasColumn('fast_start_bonus_payouts', 'unsettled_count')) {
                $table->integer('unsettled_count')->default(0)->after('eligible_at');
            }
            if (! Schema::hasColumn('fast_start_bonus_payouts', 'last_calculated_at')) {
                $table->timestamp('last_calculated_at')->nullable()->after('unsettled_count');
            }
        });
    }

    public function down(): void
    {
        Schema::table('fast_start_bonus_payouts', function (Blueprint $table) {
            $cols = [];
            foreach (['eligible_at', 'unsettled_count', 'last_calculated_at'] as $c) {
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
