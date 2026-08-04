<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Two follow-ups to the bespoke-pricing columns.
 *
 * 1. `fee_override_id` had no index. The whole point of storing it is to answer
 *    "which transactions did agreement #12 price?" — and on `financial_transactions`
 *    that question was a full table scan, on the one table that grows with every
 *    sale the platform makes.
 *
 * 2. `compliance_fee` and `admin_fee` were created `decimal(10,2)` while every
 *    other money column on `financial_transactions` is `decimal(15,2)`. Not a
 *    correctness bug at any realistic fee, but a sibling column with a different
 *    precision is the kind of inconsistency that becomes one later.
 */
return new class extends Migration
{
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
            if (! Schema::hasTable($table) || ! Schema::hasColumn($table, 'fee_override_id')) {
                continue;
            }

            if ($this->hasIndex($table, "{$table}_fee_override_id_index")) {
                continue;
            }

            Schema::table($table, function (Blueprint $t) {
                $t->index('fee_override_id');
            });
        }

        // MySQL only: the raw MODIFY has no portable Blueprint equivalent without
        // doctrine/dbal, and the sqlite test database does not care about precision.
        if (DB::getDriverName() === 'mysql' && Schema::hasTable('financial_transactions')) {
            foreach (['compliance_fee', 'admin_fee'] as $column) {
                if (Schema::hasColumn('financial_transactions', $column)) {
                    DB::statement("ALTER TABLE `financial_transactions` MODIFY `{$column}` DECIMAL(15,2) NULL");
                }
            }
        }
    }

    public function down(): void
    {
        foreach ($this->tables as $table) {
            if (! Schema::hasTable($table) || ! Schema::hasColumn($table, 'fee_override_id')) {
                continue;
            }

            if (! $this->hasIndex($table, "{$table}_fee_override_id_index")) {
                continue;
            }

            Schema::table($table, function (Blueprint $t) {
                $t->dropIndex('fee_override_id');
            });
        }

        // Precision is deliberately NOT narrowed back — shrinking a money column
        // is how data gets truncated.
    }

    private function hasIndex(string $table, string $index): bool
    {
        try {
            if (DB::getDriverName() !== 'mysql') {
                return false;
            }

            return count(DB::select("SHOW INDEX FROM `{$table}` WHERE Key_name = ?", [$index])) > 0;
        } catch (Throwable $e) {
            return false;
        }
    }
};
