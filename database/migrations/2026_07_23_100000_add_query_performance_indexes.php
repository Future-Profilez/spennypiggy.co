<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Query performance indexes (phase 1 of the July 2026 optimisation pass).
 *
 * Both apps share one database, so every index here serves BOTH the website and the
 * admin back office — it is added in this repo only (never run twice).
 *
 * The pattern below is deliberately paranoid: each index is skipped unless the table
 * exists, every column exists, and the index is not already present. A migration that
 * touches this many shared tables must never be able to half-apply.
 *
 * Nothing here changes behaviour — indexes only affect how MySQL reaches the same rows.
 */
return new class extends Migration
{
    /**
     * name => [table, columns]
     *
     * Ordered by the cost of the scan they remove.
     */
    private function indexes(): array
    {
        return [
            // ---- financial_transactions -------------------------------------------------
            // The admin dashboards (finance, intelligence, funnels, supporter/creator health)
            // filter on type/status/date with NO user_id, so the existing (user_id, ...)
            // indexes cannot be used and every one of those ~20 queries is a full scan.
            'idx_ft_type_status_date' => ['financial_transactions', ['type', 'status', 'transaction_date']],
            // Loss/refund breakdowns and month-on-month windows filter status + date only.
            'idx_ft_status_date' => ['financial_transactions', ['status', 'transaction_date']],
            // Supporter Intelligence + the "sent" tab of the support history feed.
            'idx_ft_supporter_date' => ['financial_transactions', ['supporter_id', 'transaction_date']],
            // VipScoreService / LeaderBoardController exclude refunded+disputed rows per
            // source table. The existing morph index leads with source_id, wrong prefix.
            'idx_ft_source_type_status' => ['financial_transactions', ['source_type', 'status']],
            // Creator dashboard + statements: user_id + type + status + date window.
            'idx_ft_user_type_status_date' => ['financial_transactions', ['user_id', 'type', 'status', 'transaction_date']],
            // Reserve release / held-reserve views.
            'idx_ft_user_type_reserve' => ['financial_transactions', ['user_id', 'type', 'status', 'reserve_status']],

            // ---- notifications ----------------------------------------------------------
            // This table had NO index at all beyond the primary key, and it is read on
            // every profile render (unread count) and every bell open (paginate = 2 scans).
            'idx_notifications_notifiable_read' => ['notifications', ['notifiable_id', 'is_read']],
            'idx_notifications_notifiable_created' => ['notifications', ['notifiable_id', 'created_at']],

            // ---- payments ---------------------------------------------------------------
            'idx_payments_creator_status_created' => ['payments', ['creator_id', 'status', 'created_at']],
            'idx_payments_creator_payout_run' => ['payments', ['creator_id', 'payout_run_id']],

            // ---- per-source payment tables ----------------------------------------------
            // PayoutService and FinancialService look these up by session id per payment.
            'idx_shop_payments_session' => ['shop_payments', ['session_id']],
            'idx_shop_payments_shop' => ['shop_payments', ['shop_id']],
            'idx_task_purchases_session' => ['task_purchases', ['stripe_session_id']],
            'idx_task_purchases_intent' => ['task_purchases', ['payment_intent_id']],
            'idx_tip_payments_creator_status' => ['tip_goals_payments', ['creator_id', 'status']],
            'idx_pot_contrib_creator_status' => ['piggy_pot_contributions', ['creator_id', 'status']],

            // Guest checkout: the profile entitlement gates OR on guest_email, which
            // otherwise defeats the user_id index and scans the whole table.
            'idx_tip_payments_guest_email' => ['tip_goals_payments', ['guest_email']],
            'idx_bill_payments_guest_email' => ['bill_payments', ['guest_email']],
            'idx_membership_payments_guest_email' => ['membership_payments', ['guest_email']],
            'idx_wish_subs_guest_email' => ['wish_item_subscriptions', ['guest_email']],

            // ---- content / social --------------------------------------------------------
            'idx_posts_user_module_approved' => ['posts', ['user_id', 'for_module', 'approved']],
            'idx_follows_followed_created' => ['follows', ['followed_id', 'created_at']],
            'idx_support_tickets_source' => ['support_tickets', ['source', 'source_id']],
            // Admin content review queue.
            'idx_piggy_pots_status' => ['piggy_pots', ['status']],
            'idx_tasks_is_approved' => ['tasks', ['is_approved']],

            // ---- admin dashboard --------------------------------------------------------
            // ~130 date-bounded sums/counts per admin dashboard load, none indexed.
            'idx_spi_created' => ['stripe_payment_items', ['created_at']],
            // Attribution + the campaign dropdown scan users by utm_source.
            'idx_users_utm_source' => ['users', ['utm_source']],
            // Plain role=1 creator counts: the existing role indexes lead with a date.
            'idx_users_role_deleted' => ['users', ['role', 'deleted_at']],
            // Dispute badges / evidence-deadline alerts.
            'idx_disputes_status_resolved' => ['disputes', ['status', 'resolved_at']],
            'idx_disputes_evidence_due' => ['disputes', ['evidence_due_by']],
        ];
    }

    public function up(): void
    {
        foreach ($this->indexes() as $name => [$table, $columns]) {
            if (! $this->canIndex($table, $columns) || $this->indexExists($table, $name)) {
                continue;
            }

            Schema::table($table, function (Blueprint $blueprint) use ($columns, $name) {
                $blueprint->index($columns, $name);
            });
        }
    }

    public function down(): void
    {
        foreach ($this->indexes() as $name => [$table, $columns]) {
            if (! Schema::hasTable($table) || ! $this->indexExists($table, $name)) {
                continue;
            }

            Schema::table($table, function (Blueprint $blueprint) use ($name) {
                $blueprint->dropIndex($name);
            });
        }
    }

    private function canIndex(string $table, array $columns): bool
    {
        if (! Schema::hasTable($table)) {
            return false;
        }

        foreach ($columns as $column) {
            if (! Schema::hasColumn($table, $column)) {
                return false;
            }
        }

        return true;
    }

    private function indexExists(string $table, string $index): bool
    {
        $connection = Schema::getConnection();

        // information_schema.statistics is MySQL-only; on sqlite (the test database)
        // query the sqlite_master catalog instead so the whole test suite can migrate.
        if ($connection->getDriverName() === 'sqlite') {
            return (bool) $connection->selectOne(
                "SELECT 1 FROM sqlite_master WHERE type = 'index' AND name = ? LIMIT 1",
                [$index]
            );
        }

        return (bool) $connection->selectOne(
            'SELECT 1 FROM information_schema.statistics WHERE table_schema = ? AND table_name = ? AND index_name = ? LIMIT 1',
            [$connection->getDatabaseName(), $table, $index]
        );
    }
};
