<?php

namespace App\Console\Commands;

use App\Models\Payment;
use App\Models\User;
use App\StripeControl;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Log;

/**
 * Backfill `stripe_session_id` on risk-ledger Payment rows that only carry a
 * PaymentIntent id.
 *
 * Why this exists: PayoutService::getAllFinancialTransactionsForPayment() links
 * a Payment to its FinancialTransactions by walking the product tables on
 * `session_id`. Payment rows auto-created by the webhook safety net
 * (StripeWebhookController "Risk Ledger: Auto-created missing Payment record")
 * have no session id, so that walk finds nothing, the creator's net comes out
 * as 0, and calculatePayouts() skips them entirely — silently, with no error.
 *
 * Resolving the session id from Stripe restores the link so the normal weekly
 * run can pick the earnings up. This only ever writes `stripe_session_id`; it
 * never touches amounts, statuses, or payout state.
 */
class BackfillPaymentSessionIds extends Command
{
    protected $signature = 'payments:backfill-session-id
                            {--dry-run : Report what would change without writing}
                            {--user= : Limit to one creator (uuid or numeric id)}
                            {--limit=200 : Maximum payments to inspect}';

    protected $description = 'Resolve missing stripe_session_id on Payment rows from their PaymentIntent';

    public function handle(): int
    {
        $dryRun = (bool) $this->option('dry-run');

        $query = Payment::query()
            ->whereNull('stripe_session_id')
            ->whereNotNull('stripe_payment_intent_id')
            ->whereNull('payout_run_id')
            ->whereIn('status', ['succeeded', 'review_hold']);

        if ($user = $this->option('user')) {
            $creator = User::where('uuid', $user)->orWhere('id', $user)->first();
            if (! $creator) {
                $this->error("Creator not found: {$user}");

                return self::FAILURE;
            }
            $query->where('creator_id', $creator->uuid);
        }

        $payments = $query->limit((int) $this->option('limit'))->get();

        if ($payments->isEmpty()) {
            $this->info('Nothing to backfill.');

            return self::SUCCESS;
        }

        $this->info(($dryRun ? '[DRY RUN] ' : '')."Inspecting {$payments->count()} payment(s)...");
        $this->newLine();

        $resolved = 0;
        $unresolved = 0;

        foreach ($payments as $payment) {
            $creator = User::where('uuid', $payment->creator_id)->first();
            $account = $creator->account_id ?? null;

            if (! $account) {
                $this->line("  <fg=yellow>skip</> {$payment->id} — creator has no connected account");
                $unresolved++;

                continue;
            }

            $sessionId = $this->resolveSessionId($payment->stripe_payment_intent_id, $account);

            if (! $sessionId) {
                $this->line("  <fg=yellow>miss</> {$payment->id} — no Checkout Session for {$payment->stripe_payment_intent_id}");
                $unresolved++;

                continue;
            }

            // Guard: never point two Payment rows at the same session.
            $clash = Payment::where('stripe_session_id', $sessionId)
                ->where('id', '!=', $payment->id)
                ->exists();

            if ($clash) {
                $this->line("  <fg=yellow>skip</> {$payment->id} — session {$sessionId} already used by another payment");
                $unresolved++;

                continue;
            }

            $this->line("  <fg=green>ok</>   {$payment->id} → {$sessionId}");

            if (! $dryRun) {
                $payment->update(['stripe_session_id' => $sessionId]);
                Log::info('Backfilled stripe_session_id on Payment', [
                    'payment_id' => $payment->id,
                    'session_id' => $sessionId,
                ]);
            }

            $resolved++;
        }

        $this->newLine();
        $this->info(($dryRun ? '[DRY RUN] ' : '')."Resolved: {$resolved}. Unresolved: {$unresolved}.");

        if ($dryRun && $resolved > 0) {
            $this->comment('Re-run without --dry-run to write these.');
        }

        return self::SUCCESS;
    }

    /**
     * Ask Stripe which Checkout Session produced this PaymentIntent.
     */
    private function resolveSessionId(string $paymentIntentId, string $account): ?string
    {
        try {
            $sessions = StripeControl::getClientForAccount($account)
                ->checkout
                ->sessions
                ->all(
                    ['payment_intent' => $paymentIntentId, 'limit' => 1],
                    ['stripe_account' => $account]
                );

            return $sessions->data[0]->id ?? null;
        } catch (\Throwable $e) {
            $this->line("  <fg=red>err</>  {$paymentIntentId} — {$e->getMessage()}");

            return null;
        }
    }
}
