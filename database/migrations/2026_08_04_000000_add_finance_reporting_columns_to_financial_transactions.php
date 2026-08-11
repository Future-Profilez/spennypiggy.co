<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Finance reporting columns on the canonical ledger.
 *
 * `gbp_amount` / `gbp_rate` freeze the FX at the moment of the charge. Every
 * admin revenue figure used to convert `gross_amount` at TODAY'S rate, so last
 * quarter's revenue changed every morning and no month-end report could ever be
 * reproduced. The rate is written once and never rewritten (see the model's
 * `saving` hook), so history stops moving.
 *
 * `refunded_amount` records a PARTIAL refund. A partial refund deliberately does
 * not cascade — the purchase is still mostly paid — so the row stays `completed`
 * with its full gross, and every revenue figure counted money that had already
 * gone back to the buyer.
 *
 * Every statement is guarded: this table is shared with admin.spennypiggy.co and
 * the column may already exist there.
 */
return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasTable('financial_transactions')) {
            return;
        }

        Schema::table('financial_transactions', function (Blueprint $table) {
            if (! Schema::hasColumn('financial_transactions', 'gbp_amount')) {
                // Gross, converted to GBP at the rate below. Nullable: NULL means
                // the row predates this column and has not been backfilled yet.
                $table->decimal('gbp_amount', 14, 2)->nullable()->after('currency');
            }

            if (! Schema::hasColumn('financial_transactions', 'gbp_rate')) {
                // Units of `currency` per 1 GBP, as `currencies.conversion_rate`
                // states it. 8dp because a few ISOs run to five figures per GBP.
                $table->decimal('gbp_rate', 18, 8)->nullable()->after('gbp_amount');
            }

            if (! Schema::hasColumn('financial_transactions', 'refunded_amount')) {
                $table->decimal('refunded_amount', 14, 2)->default(0)->after('gbp_rate');
            }
        });

        // The finance dashboard's every query is (type, status, transaction_date).
        //
        // ⚠️ The try/catch is around the Schema::table CALL, not inside the closure.
        // A Blueprint only records the operation; it is executed after the closure
        // returns, so a catch inside it can never see a duplicate-index error.
        try {
            Schema::table('financial_transactions', function (Blueprint $table) {
                $table->index(['type', 'status', 'transaction_date'], 'ft_type_status_date_idx');
            });
        } catch (Throwable) {
            // Index already present — nothing to do.
        }
    }

    public function down(): void
    {
        // Deliberately empty. These columns are read by BOTH apps and dropping
        // them would take live reporting data with them.
    }
};
