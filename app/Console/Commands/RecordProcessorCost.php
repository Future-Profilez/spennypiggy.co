<?php

namespace App\Console\Commands;

use App\Helpers;
use App\Models\BillPayment;
use App\Models\FinancialTransaction;
use App\Models\MembershipPayment;
use App\Models\PiggyPotContribution;
use App\Models\RyeProductPayment;
use App\Models\ShopPayment;
use App\Models\TaskPurchase;
use App\Models\TipGoalsPayment;
use App\Models\User;
use App\StripeControl;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

/**
 * Record what processing a charge ACTUALLY cost, from Stripe's balance
 * transaction — §15's "actual processor cost", and the only thing that turns
 * "SP net contribution after processing" from a guess into a figure.
 *
 * 🚨 EVERY STRIPE FIGURE ON THE LEDGER UNTIL NOW WAS THE ESTIMATE. The
 * supporter's price is grossed up from `config/payments.php` →
 * `fee_profiles.*.stripe_rate`, that same estimate is written to
 * `financial_transactions.stripe_fee`, and nothing has ever compared it with
 * the bill. The two differ in the direction that costs the CREATOR, because the
 * platform's cut is a fixed application fee: a £15 listing charged £19.05 where
 * Stripe took a flat £0.30 against an assumed £0.19 paid the creator £14.89.
 * `payments:verify-creator-net` already reads the real number to report that —
 * and then throws it away. This keeps it.
 *
 * ── WHY THIS IS A COMMAND AND NOT PART OF CHECKOUT ──────────────────────────
 * 🚨 IT IS ONE STRIPE ROUND TRIP PER CHARGE, AND FOR MOST MODULES IT IS TWO.
 * The balance transaction does not exist when the supporter is redirected — the
 * charge has to settle first — so there is nothing to read on the checkout path
 * even if it were free. Worse, only `task_purchases`, `piggy_pot_contributions`
 * and `rye_product_payments` store a payment-intent id; the other five modules
 * store a Checkout Session id, which has to be retrieved first to find the
 * intent. Putting either on the checkout path would add a billable, failable
 * network call to the one code path that must not acquire one. It runs out of
 * band, bounded, and a row it cannot read is simply left NULL for the next run.
 *
 * ⚠️ RETRIEVING is free; only CREATING a session or a charge is billable. The
 * cost here is latency and rate limit, not money.
 *
 * 🚨 NOTHING IS EVER GUESSED. A charge Stripe cannot answer for leaves
 * `processor_cost` NULL, which `App\Support\TransactionEconomics` renders as
 * "not measured" and falls back to the estimate WITH A FLAG. Writing the
 * estimate into this column would make the guess permanent and unrecognisable.
 *
 *   php artisan finance:record-processor-cost            # dry run, reports only
 *   php artisan finance:record-processor-cost --apply
 */
class RecordProcessorCost extends Command
{
    protected $signature = 'finance:record-processor-cost
                            {--apply : Write the costs. Without it nothing is stored.}
                            {--days=30 : Only look at transactions this recent}
                            {--max=200 : Most ledger rows to read from Stripe in one run}
                            {--id= : One financial_transactions id, for checking a single charge}';

    protected $description = "Store Stripe's real fee for settled charges, so platform margin is measured rather than estimated";

    /**
     * Where each module keeps the thing that leads to a payment intent.
     *
     * ⚠️ `intent` is one Stripe read; `session` is two. A module missing from
     * here is a module whose real cost is never recorded — add it when its
     * ledger rows start appearing with a permanent NULL.
     */
    private const SOURCES = [
        TaskPurchase::class => ['intent' => 'payment_intent_id'],
        PiggyPotContribution::class => ['intent' => 'payment_intent_id'],
        RyeProductPayment::class => ['intent' => 'stripe_payment_intent_id'],
        MembershipPayment::class => ['session' => 'session_id'],
        BillPayment::class => ['session' => 'session_id'],
        ShopPayment::class => ['session' => 'session_id'],
        TipGoalsPayment::class => ['session' => 'session_id'],
    ];

    public function handle(): int
    {
        $apply = (bool) $this->option('apply');

        $rows = FinancialTransaction::query()
            ->where('type', 'income')
            ->whereNull('processor_cost')
            ->when($this->option('id'), fn ($q) => $q->whereKey((int) $this->option('id')))
            ->when(! $this->option('id'), fn ($q) => $q
                ->where('transaction_date', '>=', now()->subDays((int) $this->option('days'))))
            ->whereIn('source_type', array_keys(self::SOURCES))
            ->orderByDesc('id')
            ->limit((int) $this->option('max'))
            ->get();

        if ($rows->isEmpty()) {
            $this->info('Nothing to record — every ledger row in that window already carries a measured cost.');

            return self::SUCCESS;
        }

        $this->info(($apply ? 'Recording' : 'DRY RUN — would record').' for '.$rows->count().' transaction(s).');

        $recorded = 0;
        $unreadable = 0;
        $table = [];

        foreach ($rows as $row) {
            // The creator first: a direct-charge session and its charge BOTH
            // live on the connected account, so without it every read answers
            // "no such object" and every row reports as unmeasurable.
            $creator = User::find($row->user_id);

            if (! $creator || empty($creator->account_id)) {
                $unreadable++;

                continue;
            }

            $intentId = $this->paymentIntentFor($row, $creator->account_id);

            if ($intentId === null) {
                $unreadable++;

                continue;
            }

            $facts = StripeControl::getChargeFactsForPaymentIntent($intentId, $creator->account_id);

            /*
             * 🚨 null means the charge could not be READ — no charge yet, an API
             * error, a revoked account. It does not mean Stripe took nothing,
             * and a zero written here would report the platform keeping its
             * whole fee on a sale it did not.
             */
            if ($facts === null || ($facts['fee_minor'] ?? 0) <= 0) {
                $unreadable++;

                continue;
            }

            $currency = (string) ($facts['currency'] ?: $row->currency);
            $divisor = Helpers::isZeroDecimalCurrency($currency) ? 1 : 100;
            $actual = round($facts['fee_minor'] / $divisor, 2);

            $estimate = (float) $row->stripe_fee;

            $table[] = [
                $row->id,
                $row->fee_profile ?: 'card',
                $currency,
                number_format($estimate, 2),
                number_format($actual, 2),
                $actual > $estimate ? '+'.number_format($actual - $estimate, 2) : 'ok',
            ];

            if (! $apply) {
                continue;
            }

            /*
             * 🚨 THE QUERY BUILDER, NEVER `save()` OR `update()`.
             *
             * Both stamp `updated_at`, and this table is read by reconciliation
             * and reporting that order on it — a routine cost sweep must not
             * re-date every ledger row it touches. Same rule as
             * `StripeChargesFlag::sync()` and `setup_celebrated_at`.
             *
             * ⚠️ `processor_cost` is cast but NOT fillable in either app, which
             * is exactly why this cannot be a mass assignment.
             */
            DB::table('financial_transactions')
                ->where('id', $row->id)
                ->update([
                    'processor_cost' => $actual,
                    'processor_cost_source' => 'balance_transaction',
                    'processor_cost_recorded_at' => now(),
                ]);

            $recorded++;
        }

        if ($table !== []) {
            $this->table(['FT', 'Rail', 'Ccy', 'Estimate', 'Actual', 'Over'], $table);
        }

        $this->info(($apply ? "Recorded: {$recorded}" : 'Recorded: 0 (dry run)')." · Could not read: {$unreadable}");

        if ($unreadable > 0) {
            /*
             * Logged, because a row that can never be read is a row whose margin
             * is permanently an estimate — and the reason is usually structural
             * (a module missing from SOURCES, a disconnected account), not
             * transient.
             */
            Log::info('Processor cost could not be read for some transactions', [
                'unreadable' => $unreadable,
                'checked' => $rows->count(),
            ]);
        }

        return self::SUCCESS;
    }

    /**
     * The payment intent behind a ledger row.
     *
     * ⚠️ Returns null rather than throwing on anything unexpected: this walks a
     * window of live ledger rows, and one deleted source row must not stop the
     * rest of the run from being measured.
     */
    private function paymentIntentFor(FinancialTransaction $row, ?string $connectedAccountId = null): ?string
    {
        $map = self::SOURCES[$row->source_type] ?? null;

        if ($map === null || ! class_exists($row->source_type)) {
            return null;
        }

        $source = $row->source_type::find($row->source_id);

        if (! $source) {
            return null;
        }

        if (isset($map['intent'])) {
            $id = $source->{$map['intent']} ?? null;

            return is_string($id) && $id !== '' ? $id : null;
        }

        $sessionId = $source->{$map['session']} ?? null;

        if (! is_string($sessionId) || $sessionId === '') {
            return null;
        }

        // The second round trip, and the reason this is not on the checkout path.
        return StripeControl::paymentIntentIdForSession($sessionId, $connectedAccountId);
    }
}
