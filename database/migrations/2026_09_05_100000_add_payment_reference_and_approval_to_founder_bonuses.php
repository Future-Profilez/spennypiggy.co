<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // 1. founder_bonuses table: add payment_reference and widen payout_status enum
        if (Schema::hasTable('founder_bonuses')) {
            if (DB::getDriverName() === 'mysql') {
                DB::statement("ALTER TABLE founder_bonuses MODIFY payout_status ENUM('pending','approved','paid','rejected') NOT NULL DEFAULT 'pending'");
            }

            Schema::table('founder_bonuses', function (Blueprint $table) {
                if (! Schema::hasColumn('founder_bonuses', 'payment_reference')) {
                    $table->string('payment_reference', 255)->nullable()->after('payout_rejection_reason');
                }
            });
        }

        // 2. founder_bonus table: add payment_reference and widen payout_status enum
        if (Schema::hasTable('founder_bonus')) {
            if (DB::getDriverName() === 'mysql') {
                DB::statement("ALTER TABLE founder_bonus MODIFY payout_status ENUM('pending','approved','paid','rejected') NOT NULL DEFAULT 'pending'");
            }

            Schema::table('founder_bonus', function (Blueprint $table) {
                if (! Schema::hasColumn('founder_bonus', 'payment_reference')) {
                    $table->string('payment_reference', 255)->nullable()->after('payout_rejection_reason');
                }
            });
        }
    }

    public function down(): void
    {
        if (Schema::hasTable('founder_bonuses')) {
            Schema::table('founder_bonuses', function (Blueprint $table) {
                if (Schema::hasColumn('founder_bonuses', 'payment_reference')) {
                    $table->dropColumn('payment_reference');
                }
            });

            if (DB::getDriverName() === 'mysql') {
                DB::statement("ALTER TABLE founder_bonuses MODIFY payout_status ENUM('pending','paid','rejected') NOT NULL DEFAULT 'pending'");
            }
        }

        if (Schema::hasTable('founder_bonus')) {
            Schema::table('founder_bonus', function (Blueprint $table) {
                if (Schema::hasColumn('founder_bonus', 'payment_reference')) {
                    $table->dropColumn('payment_reference');
                }
            });

            if (DB::getDriverName() === 'mysql') {
                DB::statement("ALTER TABLE founder_bonus MODIFY payout_status ENUM('pending','paid','rejected') NOT NULL DEFAULT 'pending'");
            }
        }
    }
};
