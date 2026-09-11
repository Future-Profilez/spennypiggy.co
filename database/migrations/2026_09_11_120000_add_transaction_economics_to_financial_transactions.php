<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * §15 transaction economics — the ACTUAL cost of processing a charge.
 *
 * `financial_transactions` already carries the listed amount (net_amount +
 * vat_amount), the creator payout (net_amount), the total checkout amount
 * (gross_amount), the payment rail (fee_profile), SP's gross fee revenue
 * (platform_fee IS the Stripe application fee — what the platform actually
 * receives) and refunds (refunded_amount). These four it could not:
 *
 *   · `processor_cost` 🚨 THE ACTUAL STRIPE FEE. Everything stored until now is
 *                      the ESTIMATE the supporter's price was grossed up from
 *                      (config `fee_profiles.*.stripe_rate`). `stripe_fee_actual`
 *                      columns exist on three payment models and are written by
 *                      NOTHING — measured 4 Sep 2026 style: 0 of 26 rows. Without
 *                      a real cost, "SP net contribution after processing" cannot
 *                      be stated, only guessed at.
 *   · provenance       `processor_cost_source` + `_recorded_at`, because a cost
 *                      with no source is indistinguishable from an estimate and
 *                      would be reported as fact.
 *
 * 🚨 EVERY COLUMN IS NULLABLE AND NOTHING IS BACKFILLED. A historic row keeps
 * the economics that applied at the time, and NULL means "not recorded" —
 * never a figure computed from today's rates, and never Stripe's estimate
 * quietly stored as though it were Stripe's bill. `finance:record-processor-cost`
 * fills a row in only when Stripe itself has answered for that charge.
 *
 * ⚠️ `fee_model` and `supporter_rate` were drafted here and DELIBERATELY LEFT
 * OUT. Nothing can write them truthfully yet: every ledger write re-costs the
 * charge through `Helpers::storedFeeRates()`, which reads the payment-source
 * row, and no payment table carries the model — so a live all-in charge of
 * £112.01 re-costs as legacy at £113.13 and the only value available to store
 * would have been the wrong one. A column nothing writes is a dead column; a
 * column written with a guess is worse. The fix belongs with the stored fee
 * rates (the `stripe_fee_rate` pattern, eight payment tables).
 *
 * Guarded on every column: this table is shared, and `migrate:fresh` in one app
 * and a partial state in another are both normal here.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('financial_transactions', function (Blueprint $table) {
            if (! Schema::hasColumn('financial_transactions', 'processor_cost')) {
                // What Stripe REALLY took, in the row's own currency. Never an estimate.
                $table->decimal('processor_cost', 12, 2)->nullable()->after('stripe_fixed_fee');
            }
            if (! Schema::hasColumn('financial_transactions', 'processor_cost_source')) {
                // 'balance_transaction' today. A cost with no source is an estimate.
                $table->string('processor_cost_source', 32)->nullable()->after('processor_cost');
            }
            if (! Schema::hasColumn('financial_transactions', 'processor_cost_recorded_at')) {
                $table->timestamp('processor_cost_recorded_at')->nullable()->after('processor_cost_source');
            }
        });
    }

    public function down(): void
    {
        Schema::table('financial_transactions', function (Blueprint $table) {
            foreach ([
                'processor_cost_recorded_at',
                'processor_cost_source',
                'processor_cost',
            ] as $column) {
                if (Schema::hasColumn('financial_transactions', $column)) {
                    $table->dropColumn($column);
                }
            }
        });
    }
};
