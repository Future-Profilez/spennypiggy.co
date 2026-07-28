<?php

namespace App\Console\Commands;

use App\Http\Controllers\StripeWebhookController;
use App\Models\FinancialTransaction;
use App\Models\PiggyPotContribution;
use App\Models\ShopPayment;
use App\Models\StripePaymentDetail;
use App\Models\TaskPurchase;
use App\Models\TipGoalsPayment;
use App\Models\WishItem;
use App\Models\WishItemSubscription;
use App\StripeControl;
use Carbon\Carbon;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Log;

/**
 * Safety net for DROPPED payment webhooks (self-healing).
 *
 * A bank/SEPA/ACH payment is fulfilled ONLY by checkout.session.async_payment_succeeded — if
 * that webhook is never delivered (endpoint misconfigured, event not subscribed, transient
 * outage), the sale silently vanishes: no ledger, no deliverable, no earnings. This sweep finds
 * product rows that never fulfilled, asks Stripe whether their session actually settled, and
 * replays fulfilment for the ones that did. Never fulfils money Stripe has not confirmed paid;
 * every processor is idempotent, so it is safe to run daily.
 *
 * It does NOT replace fixing the webhook subscription — it is the backstop for when one slips.
 */
class SweepStuckPayments extends Command
{
    protected $signature = 'payments:sweep-stuck
        {--days=2 : Only look at rows older than this (bank debits legitimately take 1-2 days)}
        {--max-age-days=45 : Ignore rows older than this (avoid re-checking ancient abandoned sessions forever)}
        {--max=50 : Max sessions to check per run (each is a Stripe API call)}
        {--dry-run : Report only, change nothing}';

    protected $description = 'Find payments whose fulfilment webhook was dropped and replay the settled ones';

    public function handle(): int
    {
        $dryRun = (bool) $this->option('dry-run');
        $olderThan = Carbon::now()->subDays(max(0, (int) $this->option('days')));
        $notBefore = Carbon::now()->subDays(max(1, (int) $this->option('max-age-days')));
        $max = max(1, (int) $this->option('max'));

        // [label, model, session column, account resolver]
        $tables = [
            ['Wish (one-time)', WishItemSubscription::class, 'session_id',
                fn ($r) => optional(WishItem::find($r->wish_item_id))->user->account_id ?? null],
            ['Wish/checkout', StripePaymentDetail::class, 'session_id',
                fn ($r) => $r->owner->account_id ?? null],
            ['Support/Tip', TipGoalsPayment::class, 'session_id',
                fn ($r) => $r->creator->account_id ?? null],
            ['Shop', ShopPayment::class, 'session_id',
                fn ($r) => $r->shop->user->account_id ?? null],
            ['Task', TaskPurchase::class, 'stripe_session_id',
                fn ($r) => $r->creator->account_id ?? null],
            ['Piggy Pot', PiggyPotContribution::class, 'session_id',
                fn ($r) => $r->creator->account_id ?? null],
        ];

        $checked = 0;
        $replayed = 0;
        $notPaid = 0;
        $skipped = 0;

        foreach ($tables as [$label, $model, $sessionCol, $accountResolver]) {
            if ($checked >= $max) {
                break;
            }

            // Candidates: created in the window, NOT already fully paid, and with a session id.
            $rows = $model::query()
                ->whereNotNull($sessionCol)
                ->whereBetween('created_at', [$notBefore, $olderThan])
                ->latest('created_at')
                ->limit($max)
                ->get();

            foreach ($rows as $row) {
                if ($checked >= $max) {
                    break;
                }

                $sid = $row->{$sessionCol};

                // Already has a ledger FT? Then it fulfilled — skip.
                $ft = FinancialTransaction::where('source_type', $model)->where('source_id', $row->id)->first();
                if ($ft) {
                    continue;
                }

                // A terminal-but-not-paid local status (refunded/failed/expired/canceled) is not stuck.
                $status = strtolower((string) ($row->payment_status ?? $row->status ?? ''));
                if (in_array($status, ['refunded', 'failed', 'expired', 'canceled', 'cancelled'], true)) {
                    continue;
                }

                $checked++;
                $account = $accountResolver($row);

                try {
                    $session = StripeControl::getCheckoutSession($sid, $account);
                } catch (\Throwable $e) {
                    Log::warning("payments:sweep-stuck — could not fetch session {$sid}: ".$e->getMessage());
                    $skipped++;

                    continue;
                }

                $payStatus = $session->payment_status ?? 'unknown';

                if ($payStatus !== 'paid') {
                    // Not settled at Stripe (still clearing, or abandoned) — never fulfil.
                    $notPaid++;

                    continue;
                }

                $this->line("  <info>{$label}</info> id={$row->id} session={$sid} → paid, replaying".($dryRun ? ' (DRY RUN)' : ''));

                if ($dryRun) {
                    $replayed++;

                    continue;
                }

                try {
                    app(StripeWebhookController::class)->handleAsyncPaymentSucceeded($session);
                    $replayed++;
                    Log::info("payments:sweep-stuck — replayed fulfilment for {$label} id={$row->id} session={$sid}");
                } catch (\Throwable $e) {
                    Log::error("payments:sweep-stuck — replay failed for {$label} id={$row->id}: ".$e->getMessage());
                    $skipped++;
                }
            }
        }

        $this->info("Checked {$checked}. Replayed {$replayed}. Not yet paid {$notPaid}. Skipped {$skipped}.");

        if ($replayed > 0 && ! $dryRun) {
            $this->warn('Replayed dropped payments — investigate the Stripe webhook endpoint: is checkout.session.async_payment_succeeded subscribed and delivering?');
        }

        return self::SUCCESS;
    }
}
