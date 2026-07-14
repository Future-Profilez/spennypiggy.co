<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * The risk-ledger payments.status enum never carried 'processing' (which the
     * delayed-settlement bank flow already writes) or 'expired' (abandoned
     * checkout sessions). Add both.
     */
    public function up(): void
    {
        if (DB::getDriverName() !== 'mysql') {
            return;
        }

        DB::statement("ALTER TABLE payments MODIFY COLUMN status ENUM(
            'initiated', 'step_up', 'review_hold', 'processing', 'succeeded',
            'refunded', 'disputed', 'blocked', 'failed', 'expired'
        ) NOT NULL");
    }

    public function down(): void
    {
        if (DB::getDriverName() !== 'mysql') {
            return;
        }

        DB::statement("UPDATE payments SET status = 'failed' WHERE status IN ('processing', 'expired')");

        DB::statement("ALTER TABLE payments MODIFY COLUMN status ENUM(
            'initiated', 'step_up', 'review_hold', 'succeeded',
            'refunded', 'disputed', 'blocked', 'failed'
        ) NOT NULL");
    }
};
