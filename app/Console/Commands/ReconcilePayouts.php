<?php

namespace App\Console\Commands;

use App\Helpers;
use App\Mail\PayoutCompleted;
use App\Models\PayoutRecord;
use App\Models\User;
use App\StripeControl;
use Carbon\Carbon;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;

/**
 * Safety net for DROPPED payout webhooks.
 *
 * Run and reserve-release payouts are recorded 'in_transit' and rely on the Stripe
 * payout.paid / payout.failed webhook to flip them to their final state. If that webhook is
 * never delivered, the record sits 'in_transit' forever: no arrival email, and — worse — a
 * bounced payout is never requeued/reverted.
 *
 * This command re-fetches each stale in_transit payout from Stripe and:
 *   - status 'paid'      → flips the record to paid (idempotent) and emails the creator for
 *                          standard runs. Fully safe to auto-apply.
 *   - status failed/canceled → does NOT auto-apply the revert/requeue (that logic lives in
 *                          the webhook and duplicating it risks double-acting). It raises a
 *                          CRITICAL log so ops can replay the Stripe event. Surfacing beats
 *                          silently mis-handling money.
 *   - still in_transit   → left alone.
 */
class ReconcilePayouts extends Command
{
    protected $signature = 'payout:reconcile {--dry-run} {--days=2 : Only reconcile records older than this many days} {--limit=200}';

    protected $description = 'Reconcile payout records stuck in_transit when a Stripe webhook was dropped';

    public function handle(): int
    {
        $dryRun = (bool) $this->option('dry-run');
        $olderThan = Carbon::now()->subDays(max(0, (int) $this->option('days')));
        $limit = max(1, (int) $this->option('limit'));

        $records = PayoutRecord::where('status', 'in_transit')
            ->where('created_at', '<=', $olderThan)
            ->orderBy('created_at')
            ->limit($limit)
            ->get();

        $this->info("Found {$records->count()} in_transit record(s) older than {$olderThan->toDateString()}".($dryRun ? ' (DRY RUN)' : ''));

        $resolved = 0;
        $failedFound = 0;
        $stillPending = 0;
        $skipped = 0;

        foreach ($records as $record) {
            $creator = User::where('uuid', $record->creator_id)->first();

            if (! $creator || ! $creator->account_id) {
                Log::warning("payout:reconcile — creator {$record->creator_id} missing or has no Stripe account; skipping record {$record->id}.");
                $skipped++;

                continue;
            }

            try {
                $payout = StripeControl::retrievePayout(
                    (string) $record->stripe_payout_id,
                    (string) $creator->account_id,
                    (string) ($record->currency ?: $creator->default_currency ?? 'GBP')
                );
            } catch (\Throwable $e) {
                Log::warning("payout:reconcile — could not fetch Stripe payout {$record->stripe_payout_id} for creator {$record->creator_id}: ".$e->getMessage());
                $skipped++;

                continue;
            }

            $status = strtolower((string) ($payout->status ?? ''));

            if ($status === 'paid') {
                $this->line("  record {$record->id} ({$record->stripe_payout_id}) → paid");
                $resolved++;

                if ($dryRun) {
                    continue;
                }

                $record->update([
                    'status' => 'paid',
                    'arrival_date' => isset($payout->arrival_date) ? Carbon::createFromTimestamp($payout->arrival_date) : $record->arrival_date,
                ]);

                // Email only for standard run payouts — not reserve releases or bonuses (mirrors
                // the webhook's "standard runs only" rule). Idempotent: if the webhook later
                // arrives it sees status already 'paid' and won't re-send.
                $isReserveRelease = ($record->metadata['payout_type'] ?? null) === 'reserve_release';

                if ($record->payout_run_id && ! $isReserveRelease) {
                    try {
                        Mail::to($creator->email)->send(new PayoutCompleted(
                            creator: $creator,
                            amount: (float) Helpers::toMajorUnits($record->amount_minor, $record->currency),
                            currency: (string) $record->currency,
                            status: 'paid',
                            arrivalDate: $record->arrival_date?->format('d M Y'),
                            destination: 'Connected account '.$creator->account_id,
                            reference: $record->stripe_payout_id,
                        ));
                    } catch (\Throwable $mailError) {
                        Log::error('payout:reconcile — PayoutCompleted mail failed: '.$mailError->getMessage());
                    }
                }

                continue;
            }

            if (in_array($status, ['failed', 'canceled'], true)) {
                $failedFound++;
                // Deliberately NOT auto-reverted here — the webhook owns requeue/revert. Raise it
                // loudly so ops can replay the Stripe event rather than have it mis-applied twice.
                Log::critical('payout:reconcile — payout is FAILED/CANCELED at Stripe but its record is still in_transit (dropped webhook). Manual replay of the payout.failed event required.', [
                    'payout_record_id' => $record->id,
                    'stripe_payout_id' => $record->stripe_payout_id,
                    'creator_id' => $record->creator_id,
                    'payout_run_id' => $record->payout_run_id,
                    'stripe_status' => $status,
                    'amount_minor' => $record->amount_minor,
                    'currency' => $record->currency,
                    'is_reserve_release' => ($record->metadata['payout_type'] ?? null) === 'reserve_release',
                ]);

                continue;
            }

            $stillPending++;
        }

        $this->info("Resolved paid: {$resolved}. Failed/canceled surfaced: {$failedFound}. Still pending: {$stillPending}. Skipped: {$skipped}.");

        return self::SUCCESS;
    }
}
