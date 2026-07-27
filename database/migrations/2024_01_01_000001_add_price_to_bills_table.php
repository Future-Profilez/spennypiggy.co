<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * create_bills_table defines only a subset of the columns the Bills model and
 * BillsController actually use. Several fillable columns (price, currency,
 * tax_amount, period, edited_reason, edited_status) have no migration at all, so
 * a fresh database (CI/tests, new deploys) fails on inserts/reads that touch them
 * ("table bills has no column named ..."). Each add is hasColumn-guarded so
 * existing environments that already have the columns are untouched.
 */
return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasTable('bills')) {
            return;
        }

        Schema::table('bills', function (Blueprint $table) {
            if (! Schema::hasColumn('bills', 'price')) {
                $table->double('price', 8, 2)->default(0)->after('name');
            }
            if (! Schema::hasColumn('bills', 'currency')) {
                $table->string('currency')->default('GBP')->after('price');
            }
            if (! Schema::hasColumn('bills', 'tax_amount')) {
                $table->double('tax_amount', 8, 2)->default(0)->after('currency');
            }
            if (! Schema::hasColumn('bills', 'period')) {
                $table->string('period')->nullable()->after('tax_amount');
            }
            if (! Schema::hasColumn('bills', 'edited_reason')) {
                $table->text('edited_reason')->nullable();
            }
            if (! Schema::hasColumn('bills', 'edited_status')) {
                $table->string('edited_status')->nullable();
            }
        });
    }

    public function down(): void
    {
        if (! Schema::hasTable('bills')) {
            return;
        }

        Schema::table('bills', function (Blueprint $table) {
            foreach (['price', 'currency', 'tax_amount', 'period', 'edited_reason', 'edited_status'] as $col) {
                if (Schema::hasColumn('bills', $col)) {
                    $table->dropColumn($col);
                }
            }
        });
    }
};
