<?php

namespace App\Console\Commands;

use App\Http\Controllers\StripeWebhookController;
use App\Models\Deliverable;
use App\Models\FinancialTransaction;
use App\Models\PiggyPotContribution;
use App\Models\ShopPayment;
use App\Models\StripePaymentDetail;
use App\Models\TaskPurchase;
use App\Models\TipGoalsPayment;
use App\Models\WishItem;
use App\Models\WishItemSubscription;
use App\StripeControl;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

/**
 * Recovery tool: replay fulfilment for a Stripe Checkout Session whose webhook
 * was missed or dropped (e.g. a bank/SEPA/ACH payment that settled while the
 * endpoint was misconfigured, so no deliverable / notification / email fired).
 *
 * Pulls the live session from Stripe and only completes when Stripe itself says
 * the payment is paid — never fulfils unconfirmed money. Processors are
 * idempotent, so running it twice is safe.
 */
class ReconcileStripeSession extends Command
{
    protected $signature = 'payments:reconcile {session_id : Stripe Checkout Session id (cs_...)} {--dry-run : Report state only, change nothing}';

    protected $description = 'Replay fulfilment for a settled Stripe session the webhook missed';

    public function handle(): int
    {
        $sid = $this->argument('session_id');

        // Resolve the payment row + creator's connected account from the session.
        [$label, $row, $accountId] = $this->locate($sid);

        if (! $row) {
            $this->error("No payment row found for session {$sid}.");

            return self::FAILURE;
        }

        $this->line("Found: <info>{$label}</info> id={$row->id} account=".($accountId ?: 'platform'));
        $this->diagnose($row, $sid);

        try {
            $session = StripeControl::getCheckoutSession($sid, $accountId);
        } catch (\Throwable $e) {
            $this->error('Could not retrieve the session from Stripe: '.$e->getMessage());

            return self::FAILURE;
        }

        if (! $session) {
            $this->error('Stripe returned no session for that id.');

            return self::FAILURE;
        }

        $status = $session->payment_status ?? 'unknown';
        $this->line("Stripe payment_status: <info>{$status}</info>");

        if ($status !== 'paid') {
            $this->warn('Not paid at Stripe — nothing to fulfil. (Bank debits can take days to clear.)');

            return self::SUCCESS;
        }

        if ($this->option('dry-run')) {
            $this->info('Dry run: session is paid and would be fulfilled now.');

            return self::SUCCESS;
        }

        // Run the FULL async-settlement path (maps the risk-ledger Payment, syncs the
        // FinancialTransaction by payment intent, creates the deliverable, and marks the product
        // row paid) — not just the deliverable step. This is what the dropped webhook would have
        // done; every processor is idempotent, so re-running is safe.
        app(StripeWebhookController::class)->handleAsyncPaymentSucceeded($session);

        $this->info('Fulfilment replayed. Deliverable, ledger, notification and email should now be queued.');
        $this->line('If the ledger FT is still missing (some wish flows sync separately), run:');
        $this->line('  php artisan finance:sync-transactions --user_id=<creator_user_id>');
        $this->line('Reminder: emails only send with a queue worker running.');

        return self::SUCCESS;
    }

    /**
     * Print where fulfilment stopped: payment row → ledger → deliverable →
     * notification → email. Pinpoints whether the webhook/redirect never ran,
     * or it ran and only the queued email is outstanding.
     */
    private function diagnose($row, string $sid): void
    {
        $this->newLine();
        $this->line('<comment>Fulfilment state</comment>');

        $status = $row->payment_status ?? $row->status ?? '?';
        $this->line('  payment row status : '.$status.'   fee_profile: '.($row->fee_profile ?? 'card'));

        $ft = FinancialTransaction::where('source_type', get_class($row))
            ->where('source_id', $row->id)->first();
        $this->line('  ledger (FT)        : '.($ft ? "yes (status={$ft->status}, net={$ft->net_amount})" : '<fg=red>MISSING</>'));

        $deliverable = Deliverable::where('session_id', $sid)->first();
        if (! $deliverable && method_exists($row, 'getKey')) {
            $deliverable = Deliverable::where('item_id', $row->id)->first();
        }
        $this->line('  deliverable        : '.($deliverable ? "yes (status={$deliverable->status})" : '<fg=red>MISSING</>'));

        // NB: use hasAttribute-style checks, not isset() — isset() is false for a
        // NULL column, which would hide the very case we're looking for.
        $attrs = $row->getAttributes();
        if (array_key_exists('creator_notified_at', $attrs) || array_key_exists('supporter_notified_at', $attrs)) {
            $this->line('  notified (creator) : '.($row->creator_notified_at ?: '<fg=red>never</>'));
            $this->line('  notified (buyer)   : '.($row->supporter_notified_at ?: '<fg=red>never</>'));
        }

        // Email is a queued job — it only sends with a worker running.
        $this->newLine();
        $this->line('<comment>Email delivery (queued jobs)</comment>');
        $this->line('  queue connection   : '.config('queue.default'));

        try {
            $failed = DB::table('failed_jobs')->count();
            $this->line('  failed_jobs        : '.($failed > 0 ? "<fg=red>{$failed}</>" : '0'));
        } catch (\Throwable $e) {
            $this->line('  failed_jobs        : (table unavailable)');
        }

        if (config('queue.default') === 'sync') {
            $this->line('  <fg=yellow>sync driver — mail sends inline, no worker needed</>');
        } else {
            try {
                $pending = DB::table('jobs')->count();
                $this->line('  pending jobs       : '.$pending.($pending > 0 ? '  <fg=yellow>← worker may not be running</>' : ''));
            } catch (\Throwable $e) {
                $this->line('  pending jobs       : (not a database queue — check your queue dashboard)');
            }
        }

        $this->newLine();
    }

    /**
     * @return array{0:string,1:mixed,2:?string}
     */
    private function locate(string $sid): array
    {
        if ($row = PiggyPotContribution::where('session_id', $sid)->first()) {
            return ['Piggy Pot contribution', $row, $row->creator->account_id ?? null];
        }

        if ($row = TipGoalsPayment::where('session_id', $sid)->first()) {
            return ['Support payment (Piggy Bank)', $row, $row->creator->account_id ?? null];
        }

        if ($row = ShopPayment::where('session_id', $sid)->first()) {
            return ['Shop payment', $row, $row->shop->user->account_id ?? null];
        }

        if ($row = TaskPurchase::where('stripe_session_id', $sid)->first()) {
            return ['Task purchase', $row, $row->creator->account_id ?? null];
        }

        // Wish (one-time) — its account lives on the wished item's creator.
        if ($row = WishItemSubscription::where('session_id', $sid)->first()) {
            $account = optional(WishItem::find($row->wish_item_id))->user->account_id ?? null;

            return ['Wish subscription', $row, $account];
        }

        // Cart/basket wish (StripePaymentDetail). owner_id is the creator.
        if ($row = StripePaymentDetail::where('session_id', $sid)->first()) {
            return ['Wish / checkout (StripePaymentDetail)', $row, $row->owner->account_id ?? null];
        }

        return ['', null, null];
    }
}
