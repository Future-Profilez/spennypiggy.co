<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Record WHICH fee rate priced each transaction, not just the resulting amount.
 *
 * Today a row stores `platform_fee` as a figure with no rate beside it, so a
 * £1.90 fee cannot be read back as "15%" or "10%", and the compliance and £1
 * admin components are folded into that one number with no breakdown.
 *
 * Storing the rate is what makes history immutable. Every recompute path
 * (SyncFinancialTransactions, the webhook FT syncs, CheckoutMailToUser, renewal
 * mails, payments:verify-creator-net) re-derives fees from the fee profile — so
 * without a stored rate, changing a creator's deal would silently re-price every
 * transaction they have ever taken, with no error and no trace. Exactly the trap
 * `fee_profile` already exists to avoid; these columns are threaded the same way.
 *
 * On the recurring tables the stored rate is also the grandfathering record: a
 * supporter keeps the rate they subscribed at unless a LOWER one is agreed.
 *
 * All columns are nullable, and NULL means "standard config rates" — so nothing
 * needs backfilling and existing rows keep behaving exactly as they do now.
 */
return new class extends Migration
{
    /** Tables that price a charge and therefore must record the rate applied. */
    private array $tables = [
        // One-off payments
        'shop_payments',
        'task_purchases',
        'piggy_pot_contributions',
        'tip_goals_payments',
        'stripe_payment_details',
        // Recurring — the stored rate is also the grandfathered rate
        'wish_item_subscriptions',
        'bill_payments',
        'membership_payments',
        // Canonical ledger
        'financial_transactions',
    ];

    public function up(): void
    {
        foreach ($this->tables as $table) {
            if (! Schema::hasTable($table)) {
                continue;
            }

            Schema::table($table, function (Blueprint $t) use ($table) {
                if (! Schema::hasColumn($table, 'platform_fee_rate')) {
                    $t->decimal('platform_fee_rate', 5, 2)->nullable();
                }

                // Stored even though it is fixed at 2% today: if the compliance
                // rate ever changes, historical rows must still report the rate
                // they were actually charged at.
                if (! Schema::hasColumn($table, 'compliance_fee_rate')) {
                    $t->decimal('compliance_fee_rate', 5, 2)->nullable();
                }

                // 'standard' | 'custom' — lets admin screens flag a bespoke row
                // without joining, and lets reporting separate the two cohorts.
                if (! Schema::hasColumn($table, 'fee_source')) {
                    $t->string('fee_source', 10)->nullable();
                }

                // Which agreement priced this charge. Answers "why was this 8%"
                // six months later, with the admin and the deal note attached.
                if (! Schema::hasColumn($table, 'fee_override_id')) {
                    $t->unsignedBigInteger('fee_override_id')->nullable();
                }
            });
        }

        // The ledger additionally carries the fee BREAKDOWN. `platform_fee` folds
        // platform + compliance + the £1 admin fee into one figure, so admin can
        // see what was taken but never what it was made of.
        if (Schema::hasTable('financial_transactions')) {
            Schema::table('financial_transactions', function (Blueprint $t) {
                if (! Schema::hasColumn('financial_transactions', 'compliance_fee')) {
                    $t->decimal('compliance_fee', 10, 2)->nullable();
                }

                if (! Schema::hasColumn('financial_transactions', 'admin_fee')) {
                    $t->decimal('admin_fee', 10, 2)->nullable();
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

            foreach (['platform_fee_rate', 'compliance_fee_rate', 'fee_source', 'fee_override_id'] as $column) {
                if (Schema::hasColumn($table, $column)) {
                    Schema::table($table, fn (Blueprint $t) => $t->dropColumn($column));
                }
            }
        }

        if (Schema::hasTable('financial_transactions')) {
            foreach (['compliance_fee', 'admin_fee'] as $column) {
                if (Schema::hasColumn('financial_transactions', $column)) {
                    Schema::table('financial_transactions', fn (Blueprint $t) => $t->dropColumn($column));
                }
            }
        }
    }
};
