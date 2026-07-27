<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     *
     * financial_transactions is the canonical ledger, so it now carries the payout
     * run that paid out the base earning, plus the timestamp the held reserve was
     * released. This makes the "paid out" badge and per-transaction reserve release
     * reliable without re-deriving the Payment <-> FinancialTransaction link.
     */
    public function up(): void
    {
        Schema::table('financial_transactions', function (Blueprint $table) {
            if (! Schema::hasColumn('financial_transactions', 'payout_run_id')) {
                $table->string('payout_run_id')->nullable()->after('reserve_status')->index();
            }
            if (! Schema::hasColumn('financial_transactions', 'reserve_released_at')) {
                $table->timestamp('reserve_released_at')->nullable()->after('payout_run_id');
            }
            // Stripe payout id of the reserve-release payout — lets a later payout.failed
            // webhook revert the reserve back to 'held' if the bank rejects it.
            if (! Schema::hasColumn('financial_transactions', 'reserve_payout_id')) {
                $table->string('reserve_payout_id')->nullable()->after('reserve_released_at')->index();
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('financial_transactions', function (Blueprint $table) {
            if (Schema::hasColumn('financial_transactions', 'payout_run_id')) {
                $table->dropColumn('payout_run_id');
            }
            if (Schema::hasColumn('financial_transactions', 'reserve_released_at')) {
                $table->dropColumn('reserve_released_at');
            }
            if (Schema::hasColumn('financial_transactions', 'reserve_payout_id')) {
                $table->dropColumn('reserve_payout_id');
            }
        });
    }
};
