<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Freeze the STRIPE fee estimate onto each row, the same way the platform and
 * compliance rates already are (migration 2026_08_03_100002).
 *
 * 🚨 Why this has to land BEFORE the card estimate is raised.
 *
 * The supporter's price is grossed up from an estimate of Stripe's fee, and
 * `Helpers::storedFeeRates()` freezes the platform and compliance rates onto the
 * row so a later rate change can never re-price history. The Stripe rate was
 * left out of that fix — it is read live from `config/payments.php` on every
 * recompute.
 *
 * `finance:sync-transactions` runs EVERY 30 MINUTES and rewrites `platform_fee`
 * and `stripe_fee` on existing ledger rows from a freshly computed breakdown. So
 * raising the card estimate from 2.9% to 3.4% would, on the next sync, silently
 * restate the recorded fees on every historical transaction — and the admin
 * revenue dashboards read exactly those columns. No error, no trace, and the
 * platform's own reported margin would move for months of past sales.
 *
 * With the rate stored, a recompute costs a row at the rate it was actually
 * charged at, and today's config only ever prices new charges.
 *
 * NULL means "this row predates these columns". `storedFeeRates()` reads that as
 * the historical 2.9% + 30p rather than as today's config — so nothing needs
 * backfilling, and no past row moves when the estimate changes.
 */
return new class extends Migration
{
    /** Mirrors 2026_08_03_100002 — every table that prices a charge. */
    private array $tables = [
        'shop_payments',
        'task_purchases',
        'piggy_pot_contributions',
        'tip_goals_payments',
        'stripe_payment_details',
        'wish_item_subscriptions',
        'bill_payments',
        'membership_payments',
        'financial_transactions',
    ];

    public function up(): void
    {
        foreach ($this->tables as $table) {
            if (! Schema::hasTable($table)) {
                continue;
            }

            Schema::table($table, function (Blueprint $t) use ($table) {
                // 5,3 not 5,2: Stripe rates are quoted to two decimals today
                // (2.90, 3.25) but the gross-up divides by them, and a market
                // priced at 1.375% should not be rounded into a shortfall.
                if (! Schema::hasColumn($table, 'stripe_fee_rate')) {
                    $t->decimal('stripe_fee_rate', 5, 3)->nullable();
                }

                // The fixed per-charge component, in the charge currency. Stored
                // beside the rate because the two are one estimate: 3.4% + 30p
                // and 3.4% + 20p are different prices, and reading one without
                // the other cannot reproduce what the supporter was charged.
                if (! Schema::hasColumn($table, 'stripe_fixed_fee')) {
                    $t->decimal('stripe_fixed_fee', 8, 2)->nullable();
                }
            });
        }
    }

    public function down(): void
    {
        foreach ($this->tables as $table) {
            if (! Schema::hasTable($table)) {
                continue;
            }

            Schema::table($table, function (Blueprint $t) use ($table) {
                foreach (['stripe_fee_rate', 'stripe_fixed_fee'] as $column) {
                    if (Schema::hasColumn($table, $column)) {
                        $t->dropColumn($column);
                    }
                }
            });
        }
    }
};
