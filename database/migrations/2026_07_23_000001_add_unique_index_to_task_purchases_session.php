<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * The redirect success page (createTaskPurchaseSync) and the checkout.session.completed
 * webhook (createTaskPurchaseRecord) both did a check-then-insert on stripe_session_id
 * with no unique constraint. Stripe commonly delivers the webhook around the same time
 * as the browser redirect, so both passed the "not found" check and each created its own
 * TaskPurchase + Deliverable — doubling GMV, SLA deadlines and emails. This unique index
 * makes the DB the arbiter: the second insert fails and the code re-fetches the winner.
 *
 * Guarded: skips if the index already exists, and refuses to add it while duplicate
 * session ids remain (so it never fails against shared production data — clean those
 * first, then re-run). MySQL allows multiple NULLs in a unique index, so legacy rows
 * with a null session id are unaffected.
 */
return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasTable('task_purchases') || ! Schema::hasColumn('task_purchases', 'stripe_session_id')) {
            return;
        }

        if ($this->indexExists('task_purchases', 'task_purchases_stripe_session_id_unique')) {
            return;
        }

        $dupes = DB::table('task_purchases')
            ->whereNotNull('stripe_session_id')
            ->where('stripe_session_id', '!=', '')
            ->select('stripe_session_id')
            ->groupBy('stripe_session_id')
            ->havingRaw('COUNT(*) > 1')
            ->count();

        if ($dupes > 0) {
            // Do not enforce over dirty data — that would abort the whole deploy.
            logger()->warning("Skipping task_purchases unique index: {$dupes} duplicate stripe_session_id groups exist. Reconcile them, then re-run.");

            return;
        }

        Schema::table('task_purchases', function (Blueprint $table) {
            $table->unique('stripe_session_id');
        });
    }

    public function down(): void
    {
        if (! Schema::hasTable('task_purchases')) {
            return;
        }

        if (! $this->indexExists('task_purchases', 'task_purchases_stripe_session_id_unique')) {
            return;
        }

        Schema::table('task_purchases', function (Blueprint $table) {
            $table->dropUnique('task_purchases_stripe_session_id_unique');
        });
    }

    private function indexExists(string $table, string $index): bool
    {
        if (DB::getDriverName() === 'sqlite') {
            $rows = DB::select("PRAGMA index_list('{$table}')");

            foreach ($rows as $row) {
                if (($row->name ?? null) === $index) {
                    return true;
                }
            }

            return false;
        }

        $rows = DB::select(
            'SELECT 1 FROM information_schema.statistics WHERE table_schema = DATABASE() AND table_name = ? AND index_name = ? LIMIT 1',
            [$table, $index]
        );

        return ! empty($rows);
    }
};
