<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Backfill the `deleted_at` column three payment models have always assumed.
 *
 * 🚨 `2024_01_03_000001_create_shop_payments_table` wraps every CREATE in
 * `if (! Schema::hasTable(...))`. All three tables already existed in production
 * from an earlier schema that had no `softDeletes()`, so the create never ran and
 * the column never appeared — while App\Models\ShopPayment, BillPayment and
 * MembershipPayment all `use SoftDeletes`, which appends
 * `where deleted_at is null` to EVERY query they make.
 *
 * The result in production was
 * `SQLSTATE[42S22]: Unknown column 'shop_payments.deleted_at' in 'where clause'`
 * on /shop/orders-list — a guarded create is invisible until a model reaches for
 * what it skipped.
 *
 * Guarded per column, not per table: the column is present on a fresh database
 * (the create DID run there) and adding it twice is a hard failure.
 */
return new class extends Migration
{
    private array $tables = ['shop_payments', 'bill_payments', 'membership_payments'];

    public function up(): void
    {
        foreach ($this->tables as $table) {
            if (! Schema::hasTable($table) || Schema::hasColumn($table, 'deleted_at')) {
                continue;
            }

            Schema::table($table, function (Blueprint $blueprint) {
                $blueprint->softDeletes();
            });
        }
    }

    public function down(): void
    {
        foreach ($this->tables as $table) {
            if (! Schema::hasTable($table) || ! Schema::hasColumn($table, 'deleted_at')) {
                continue;
            }

            Schema::table($table, function (Blueprint $blueprint) {
                $blueprint->dropSoftDeletes();
            });
        }
    }
};
