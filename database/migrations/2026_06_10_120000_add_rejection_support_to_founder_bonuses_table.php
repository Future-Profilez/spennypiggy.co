<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Widen the payout_status enum to allow admin rejection (raw SQL: Laravel can't
        // alter enums via change()). sqlite (tests) stores enums as TEXT, so skip there.
        if (DB::getDriverName() === 'mysql') {
            DB::statement("ALTER TABLE founder_bonuses MODIFY payout_status ENUM('pending','paid','rejected') NOT NULL DEFAULT 'pending'");
        }

        Schema::table('founder_bonuses', function (Blueprint $table) {
            if (!Schema::hasColumn('founder_bonuses', 'payout_rejection_reason')) {
                $table->text('payout_rejection_reason')->nullable()->after('payout_status');
            }
        });
    }

    public function down(): void
    {
        Schema::table('founder_bonuses', function (Blueprint $table) {
            if (Schema::hasColumn('founder_bonuses', 'payout_rejection_reason')) {
                $table->dropColumn('payout_rejection_reason');
            }
        });

        if (DB::getDriverName() === 'mysql') {
            DB::statement("ALTER TABLE founder_bonuses MODIFY payout_status ENUM('pending','paid') NOT NULL DEFAULT 'pending'");
        }
    }
};
