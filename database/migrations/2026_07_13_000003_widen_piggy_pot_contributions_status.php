<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * The `status` enum only allowed pending/paid/refunded/disputed, but the
 * payment flow now also uses `processing` (bank/SEPA/ACH in-flight),
 * `succeeded`, `failed`, and `initiated`. A tight enum truncated those and
 * threw "Data truncated for column 'status'", surfacing as
 * "Something went wrong while verifying the payment." Widen to varchar so
 * every status fits. Existing values are unaffected.
 */
return new class extends Migration
{
    public function up(): void
    {
        // sqlite (test DB) is dynamically typed — no enum/length enforcement,
        // so the raw MySQL ALTERs are neither valid nor needed there.
        if (DB::getDriverName() !== 'mysql') {
            return;
        }

        if (Schema::hasTable('piggy_pot_contributions')) {
            DB::statement("ALTER TABLE `piggy_pot_contributions` MODIFY `status` VARCHAR(20) NOT NULL DEFAULT 'pending'");
        }

        // Risk-ledger Payment enum lacked 'processing' (bank in-flight state
        // the delayed-settlement gate sets) — add it so the webhook doesn't
        // truncate-and-throw when a bank session completes unpaid.
        if (Schema::hasTable('payments')) {
            DB::statement("ALTER TABLE `payments` MODIFY `status` ENUM('initiated','step_up','review_hold','processing','succeeded','refunded','disputed','blocked','failed') NOT NULL");
        }
    }

    public function down(): void
    {
        if (DB::getDriverName() !== 'mysql') {
            return;
        }

        if (Schema::hasTable('piggy_pot_contributions')) {
            DB::statement("ALTER TABLE `piggy_pot_contributions` MODIFY `status` ENUM('pending','paid','refunded','disputed') NOT NULL DEFAULT 'pending'");
        }
        if (Schema::hasTable('payments')) {
            DB::statement("ALTER TABLE `payments` MODIFY `status` ENUM('initiated','step_up','review_hold','succeeded','refunded','disputed','blocked','failed') NOT NULL");
        }
    }
};
