<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Discovery Phase 1 — carry the source ON THE PAYMENT ROW, not in ambient state.
 *
 * 🚨 THIS IS WHAT MAKES A QUEUED LEDGER WRITE ATTRIBUTABLE. Shop, task, bill,
 * membership and wish ledger rows are not written by the checkout or the webhook
 * at all — they are written by `finance:sync-transactions`, in a worker with
 * neither the visitor's cookie nor the Stripe event's metadata. Propagating the
 * ambient metadata across the queue was rejected deliberately: that command
 * rebuilds EVERY row belonging to a creator in one pass, so one payment's source
 * would leak onto every other row it touched.
 *
 * Persisting the key per payment removes the ambiguity entirely — the sync reads
 * back the source of THAT payment, from THAT row, however long afterwards it
 * runs. Same reasoning as `fee_profile` and the fee-rate columns beside it: a
 * value that priced (or, here, earned) a specific charge belongs on the charge.
 *
 * ⚠️ ONLY THE KEY IS STORED — the class is DERIVED. `DiscoverySources::classFor()`
 * is the one definition of which class a key belongs to, and a second copy of it
 * on nine tables is nine places for it to drift. (`financial_transactions` keeps
 * its denormalised `discovery_class` on purpose: the monthly report groups by it
 * on every read, and a key moving class later must not rewrite history there.)
 *
 * ⚠️ Nullable everywhere, NULL meaning "not attributed" — which is exactly how
 * every historical row already reads. Nothing needs backfilling, and there is no
 * backfill possible anyway: attribution is recorded at the moment of the click.
 *
 * 🚨 SHARED DATABASE. The admin app declares its own copies of these models but
 * never inserts a payment row (verified: no `*Payment::create` anywhere in it),
 * and its copies do not even carry `fee_profile` in `$fillable`. Reads are
 * unaffected by `$fillable`, so nothing is needed there. The migration lives in
 * THIS app only — do not add a second copy.
 */
return new class extends Migration
{
    /**
     * Every table `SyncFinancialTransactions` reads to build a ledger row.
     *
     * ⚠️ This is a LONGER list than the `fee_profile` one: bills, memberships and
     * Rye do not choose a payment method (recurring is card-only, Rye is
     * kill-switched) but they DO produce ledger rows the sync writes, which is
     * the whole reason this column exists. Follow `SyncFinancialTransactions`,
     * not the fee-profile list, if a source is ever added.
     */
    private array $tables = [
        // One-off payments, created with a browser present.
        'shop_payments',
        'task_purchases',
        'piggy_pot_contributions',
        'tip_goals_payments',
        // The wish/basket checkout. `syncWishes` reads the source through
        // `StripePaymentItems->payment`, so it lives on the parent detail row.
        'stripe_payment_details',
        // Recurring — the stored source is also the inheritance record: a
        // renewal is earned by whatever introduced the original sale.
        'wish_item_subscriptions',
        'bill_payments',
        'membership_payments',
        // Physical goods (RYE). Kill-switched today, still synced by the command.
        'rye_product_payments',
    ];

    public function up(): void
    {
        foreach ($this->tables as $table) {
            if (! Schema::hasTable($table) || Schema::hasColumn($table, 'discovery_source')) {
                continue;
            }

            Schema::table($table, function (Blueprint $t) {
                // 40 chars matches `discovery_events.source` and
                // `financial_transactions.discovery_source` — the same reserved
                // key is written to all three and must never truncate in one.
                $t->string('discovery_source', 40)->nullable();
            });
        }
    }

    public function down(): void
    {
        foreach ($this->tables as $table) {
            if (! Schema::hasTable($table) || ! Schema::hasColumn($table, 'discovery_source')) {
                continue;
            }

            Schema::table($table, function (Blueprint $t) {
                $t->dropColumn('discovery_source');
            });
        }
    }
};
