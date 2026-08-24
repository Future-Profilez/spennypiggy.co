<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Drops indexes that no query can ever prefer, because another index on the same
 * table already answers everything they answer.
 *
 * Two kinds, both verified against the live schema (24 Aug 2026) rather than read
 * off the migrations:
 *
 *  1. ONE EXACT DUPLICATE. `ft_type_status_date_idx` (added 4 Aug 2026 by
 *     add_finance_reporting_columns_to_financial_transactions) is column-for-column
 *     identical to `idx_ft_type_status_date` (added 23 Jul 2026 by
 *     add_query_performance_indexes). The earlier one is kept; two copies of one
 *     index never speed a read up and both have to be written on every insert.
 *
 *  2. TEN NON-UNIQUE INDEXES THAT ARE A LEFT-PREFIX OF A UNIQUE INDEX ON THE SAME
 *     TABLE. A UNIQUE index serves every lookup its own prefix would — including
 *     `users_id_index`, which indexes the PRIMARY KEY. This is the strictly-safe
 *     subset: a wider NON-unique covering index is left alone, because MySQL can
 *     legitimately prefer a narrower index there and that call is not obvious.
 *
 * ⚠️ Shared database. The indexes below all sit on tables whose migrations live in
 * THIS app — `marketing_spend` has the same fault and is owned by
 * admin.spennypiggy.co, so its drop ships as that app's own migration.
 *
 * ⚠️ Guarded by name. `indexExists` reads SHOW INDEX rather than trusting the
 * migration history: a fresh database built by `migrate:fresh` may never have had
 * some of these, and an unguarded DROP INDEX on a missing name is a hard error that
 * takes a deploy down.
 *
 * 🚨 MySQL ONLY, and that guard is load-bearing. The test suite runs on SQLite
 * in-memory (`phpunit.xml`: `DB_CONNECTION=sqlite`), where `SHOW INDEX` is a syntax
 * error — an unguarded version of this migration failed 1451 tests at once, because
 * every `RefreshDatabase` test runs the whole migration set. Index bloat is a
 * production-MySQL concern and there is nothing to win on a throwaway in-memory
 * database, so the whole migration no-ops off MySQL rather than growing a second
 * SQLite code path that nothing would ever exercise.
 */
return new class extends Migration
{
    /**
     * table => [index name => columns, in order], for both directions.
     *
     * @var array<string, array<string, string[]>>
     */
    private array $indexes = [
        'financial_transactions' => [
            'ft_type_status_date_idx' => ['type', 'status', 'transaction_date'],
        ],
        'creator_bio_items' => [
            'creator_bio_items_user_id_index' => ['user_id'],
        ],
        'creator_bio_links' => [
            'creator_bio_links_user_id_index' => ['user_id'],
        ],
        'engagement_notifications' => [
            'engagement_notifications_user_id_index' => ['user_id'],
        ],
        'item_view_stats' => [
            'item_view_stats_item_idx' => ['item_type', 'item_id', 'date'],
        ],
        'site_visit_stats' => [
            'site_visit_stats_date_index' => ['date'],
        ],
        'stock_waitlists' => [
            'stock_waitlists_shop_id_index' => ['shop_id'],
        ],
        'support_story_reactions' => [
            'support_story_reactions_creator_id_gifter_id_index' => ['creator_id', 'gifter_id'],
        ],
        'task_purchases' => [
            'idx_task_purchases_session' => ['stripe_session_id'],
        ],
        'users' => [
            'users_id_index' => ['id'],
            'users_email_index' => ['email'],
        ],
    ];

    public function up(): void
    {
        if (! $this->onMySql()) {
            return;
        }

        foreach ($this->indexes as $table => $names) {
            if (! Schema::hasTable($table)) {
                continue;
            }

            foreach (array_keys($names) as $name) {
                if ($this->indexExists($table, $name)) {
                    DB::statement("ALTER TABLE `{$table}` DROP INDEX `{$name}`");
                }
            }
        }
    }

    public function down(): void
    {
        if (! $this->onMySql()) {
            return;
        }

        foreach ($this->indexes as $table => $names) {
            if (! Schema::hasTable($table)) {
                continue;
            }

            foreach ($names as $name => $columns) {
                if ($this->indexExists($table, $name)) {
                    continue;
                }

                Schema::table($table, function ($t) use ($columns, $name) {
                    $t->index($columns, $name);
                });
            }
        }
    }

    private function onMySql(): bool
    {
        return DB::connection()->getDriverName() === 'mysql';
    }

    private function indexExists(string $table, string $name): bool
    {
        // 🚨 `SHOW INDEX` is MySQL-only, and the test suite runs on sqlite —
        // where this threw `near "SHOW": syntax error` and took EVERY
        // RefreshDatabase test in the app down with it, not just this
        // migration's own.
        //
        // Answering `false` off MySQL is correct rather than merely quiet: the
        // indexes listed here were created by MySQL-specific migrations, so on
        // any other driver there is nothing to drop and nothing to report.
        if (DB::connection()->getDriverName() !== 'mysql') {
            return false;
        }

        return DB::select("SHOW INDEX FROM `{$table}` WHERE Key_name = ?", [$name]) !== [];
    }
};
