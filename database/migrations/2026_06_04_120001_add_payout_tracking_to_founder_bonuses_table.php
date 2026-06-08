<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('founder_bonuses', function (Blueprint $table) {
            if (!Schema::hasColumn('founder_bonuses', 'stripe_transfer_id')) {
                $table->string('stripe_transfer_id')->nullable()->after('payout_status');
            }

            if (!Schema::hasColumn('founder_bonuses', 'stripe_payout_id')) {
                $table->string('stripe_payout_id')->nullable()->after('stripe_transfer_id');
            }

            if (!Schema::hasColumn('founder_bonuses', 'payout_record_uuid')) {
                $table->uuid('payout_record_uuid')->nullable()->after('stripe_payout_id');
            }

            if (!Schema::hasColumn('founder_bonuses', 'paid_date')) {
                $table->timestamp('paid_date')->nullable()->after('payout_record_uuid');
            }

            if (!$this->indexExists('founder_bonuses', 'founder_bonuses_stripe_payout_id_index')) {
                $table->index('stripe_payout_id');
            }

            if (!$this->indexExists('founder_bonuses', 'founder_bonuses_payout_record_uuid_index')) {
                $table->index('payout_record_uuid');
            }
        });
    }

    public function down(): void
    {
        Schema::table('founder_bonuses', function (Blueprint $table) {
            if ($this->indexExists('founder_bonuses', 'founder_bonuses_stripe_payout_id_index')) {
                $table->dropIndex('founder_bonuses_stripe_payout_id_index');
            }

            if ($this->indexExists('founder_bonuses', 'founder_bonuses_payout_record_uuid_index')) {
                $table->dropIndex('founder_bonuses_payout_record_uuid_index');
            }

            $columnsToDrop = array_values(array_filter([
                Schema::hasColumn('founder_bonuses', 'stripe_transfer_id') ? 'stripe_transfer_id' : null,
                Schema::hasColumn('founder_bonuses', 'stripe_payout_id') ? 'stripe_payout_id' : null,
                Schema::hasColumn('founder_bonuses', 'payout_record_uuid') ? 'payout_record_uuid' : null,
                Schema::hasColumn('founder_bonuses', 'paid_date') ? 'paid_date' : null,
            ]));

            if (count($columnsToDrop) > 0) {
                $table->dropColumn($columnsToDrop);
            }
        });
    }

    private function indexExists(string $table, string $indexName): bool
    {
        // Portable across MySQL + sqlite (raw SHOW INDEX is MySQL-only and broke the test DB).
        if (Schema::getConnection()->getDriverName() === 'mysql') {
            $results = DB::select('SHOW INDEX FROM `' . str_replace('`', '``', $table) . '` WHERE Key_name = ?', [$indexName]);
            return count($results) > 0;
        }

        try {
            foreach (DB::select("PRAGMA index_list('{$table}')") as $index) {
                if (($index->name ?? null) === $indexName) {
                    return true;
                }
            }
        } catch (\Exception $e) {
            // fall through
        }

        return false;
    }
};
