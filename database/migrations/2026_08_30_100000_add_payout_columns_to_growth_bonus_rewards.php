<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Growth Bonus Phase 3 — the columns the automatic payout needs.
 *
 * 🚨 `scheduled_payout_date` IS STORED, NEVER RECOMPUTED AT RENDER TIME. The
 * creator is TOLD this date in an email and on their dashboard, so it has to be
 * the same date the payment command later acts on. Computing "the next Friday"
 * separately in the notification and again in the payer means a bonus approved
 * late on a Thursday is announced for one Friday and paid on another — a broken
 * promise about money, in writing, that nothing would catch.
 *
 * ⚠️ Guarded per column: this table is young, but the house rule is that a
 * migration must be a no-op on a database that already has the column.
 *
 * ⚠️ Shared database. `growth_bonus_rewards` belongs to spennypiggy.co, so the
 * migration ships here only — but the admin app's mirror model must gain the
 * same casts by hand.
 */
return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasTable('growth_bonus_rewards')) {
            return;
        }

        Schema::table('growth_bonus_rewards', function (Blueprint $table) {
            if (! Schema::hasColumn('growth_bonus_rewards', 'scheduled_payout_date')) {
                // The date the creator was told the money would be sent.
                $table->date('scheduled_payout_date')->nullable()->after('approved_at');
            }

            if (! Schema::hasColumn('growth_bonus_rewards', 'payout_record_uuid')) {
                // Links the reward to the row the creator's payout history lists.
                $table->string('payout_record_uuid', 64)->nullable()->after('payout_reference');
            }

            if (! Schema::hasColumn('growth_bonus_rewards', 'stripe_transfer_id')) {
                $table->string('stripe_transfer_id', 64)->nullable()->after('payout_record_uuid');
            }

            if (! Schema::hasColumn('growth_bonus_rewards', 'stripe_payout_id')) {
                $table->string('stripe_payout_id', 64)->nullable()->after('stripe_transfer_id');
            }

            if (! Schema::hasColumn('growth_bonus_rewards', 'payout_failure_message')) {
                $table->string('payout_failure_message', 500)->nullable()->after('stripe_payout_id');
            }

            if (! Schema::hasColumn('growth_bonus_rewards', 'announced_at')) {
                // When the creator was FIRST told the bonus was approved. The
                // announce sweep claims work on this, not on the date column -
                // an approved-but-unpayable reward is announced once (no date)
                // and must not be re-processed every 15 minutes forever.
                $table->timestamp('announced_at')->nullable()->after('scheduled_payout_date');
            }
        });

        /*
         * ⚠️ The payer selects on (status, scheduled_payout_date) every run, and
         * the webhook looks a reward up by its Stripe payout id. Both are narrow
         * lookups on a table that only grows.
         */
        $existing = self::indexNames();

        Schema::table('growth_bonus_rewards', function (Blueprint $table) use ($existing) {
            if (! in_array('gbr_status_scheduled_idx', $existing, true)) {
                $table->index(['status', 'scheduled_payout_date'], 'gbr_status_scheduled_idx');
            }

            if (! in_array('gbr_stripe_payout_idx', $existing, true)) {
                $table->index('stripe_payout_id', 'gbr_stripe_payout_idx');
            }
        });
    }

    public function down(): void
    {
        if (! Schema::hasTable('growth_bonus_rewards')) {
            return;
        }

        $indexes = self::indexNames();

        Schema::table('growth_bonus_rewards', function (Blueprint $table) use ($indexes) {
            if (in_array('gbr_status_scheduled_idx', $indexes, true)) {
                $table->dropIndex('gbr_status_scheduled_idx');
            }

            if (in_array('gbr_stripe_payout_idx', $indexes, true)) {
                $table->dropIndex('gbr_stripe_payout_idx');
            }
        });

        foreach ([
            'scheduled_payout_date',
            'payout_record_uuid',
            'stripe_transfer_id',
            'stripe_payout_id',
            'payout_failure_message',
            'announced_at',
        ] as $column) {
            if (Schema::hasColumn('growth_bonus_rewards', $column)) {
                Schema::table('growth_bonus_rewards', fn (Blueprint $t) => $t->dropColumn($column));
            }
        }
    }

    /**
     * ⚠️ `SHOW INDEX` IS MySQL-ONLY and the test database is sqlite, where it is
     * a hard syntax error — so an unguarded read here takes the whole suite down
     * rather than one migration. Same trap as the `ALTER … MODIFY` in
     * `2026_07_13_000003`.
     *
     * On any other driver an empty list is the right answer: those databases are
     * built from these migrations, so the index cannot already exist.
     *
     * @return array<int, string>
     */
    private static function indexNames(): array
    {
        if (DB::getDriverName() !== 'mysql') {
            return [];
        }

        return collect(DB::select('SHOW INDEX FROM growth_bonus_rewards'))
            ->pluck('Key_name')
            ->unique()
            ->all();
    }
};
