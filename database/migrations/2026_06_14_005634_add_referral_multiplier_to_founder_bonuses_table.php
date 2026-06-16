<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('founder_bonuses', function (Blueprint $table) {
            // Multiplicative factor applied to bonus_amount when the creator was referred.
            // Default 1.0000 = no multiplier. E.g. 1.0100 = +1%.
            $table->decimal('referral_multiplier', 5, 4)->default(1.0000)->after('bonus_amount');
        });
    }

    public function down(): void
    {
        Schema::table('founder_bonuses', function (Blueprint $table) {
            $table->dropColumn('referral_multiplier');
        });
    }
};
