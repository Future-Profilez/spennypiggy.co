<?php

namespace App\Console\Commands;

use App\Helpers;
use App\Models\FinancialTransaction;
use App\Models\StripePaymentItems;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Log;

/**
 * Repair ledger rows whose supporter-facing figures were never written correctly.
 *
 * Two faults produced them:
 *   1. The orphan-checkout recovery path in SyncFinancialTransactions priced a wish
 *      row from the metadata's `tax` key and hardcoded stripe_fee to 0, so
 *      gross_amount was BELOW what the card was actually charged and the fee total
 *      was missing Stripe's cut.
 *   2. Legacy rows written before gross_amount was populated at all.
 *
 * gross_amount is what every buyer-facing surface reports as "you paid", so a low
 * value understates a supporter's spend and makes the Purchase Hub (which reads the
 * payment tables) disagree with Support History (which reads this ledger).
 *
 * Only supporter-facing and fee columns are rewritten. net_amount, reserve_amount
 * and reserve_status are NEVER touched — those drive payouts and are immutable once
 * settled.
 */
class BackfillLedgerGross extends Command
{
    protected $signature = 'finance:backfill-ledger-gross
                            {--dry-run : Report what would change and write nothing}
                            {--limit=0 : Stop after this many rows (0 = no limit)}
                            {--user= : Restrict to one creator id}';

    protected $description = 'Recompute gross_amount / platform_fee / stripe_fee on ledger rows that were written with an incorrect supporter charge';

    public function handle(): int
    {
        $dryRun = (bool) $this->option('dry-run');
        $limit = (int) $this->option('limit');
        $userId = $this->option('user');

        $fixed = 0;
        $skipped = 0;
        $failed = 0;
        $scanned = 0;

        $query = FinancialTransaction::query()
            ->where('type', 'income')
            ->with('source')
            ->orderBy('id');

        if ($userId) {
            $query->where('user_id', $userId);
        }

        $this->info($dryRun ? 'DRY RUN — nothing will be written.' : 'Backfilling ledger gross figures…');

        $stop = false;

        $query->chunkById(200, function ($rows) use (&$fixed, &$skipped, &$failed, &$scanned, &$stop, $dryRun, $limit) {
            foreach ($rows as $ft) {
                if ($stop) {
                    return false;
                }

                $scanned++;

                if (! $this->needsRepair($ft)) {
                    $skipped++;

                    continue;
                }

                try {
                    $changes = $this->recompute($ft);
                } catch (\Throwable $e) {
                    $failed++;
                    Log::warning('finance:backfill-ledger-gross could not reprice a row', [
                        'financial_transaction_id' => $ft->id,
                        'error' => $e->getMessage(),
                    ]);

                    continue;
                }

                if ($changes === null) {
                    $skipped++;

                    continue;
                }

                $this->line(sprintf(
                    '  #%d %s — gross %s → %s, stripe fee %s → %s',
                    $ft->id,
                    class_basename((string) $ft->source_type),
                    number_format((float) $ft->gross_amount, 2),
                    number_format((float) $changes['gross_amount'], 2),
                    number_format((float) $ft->stripe_fee, 2),
                    number_format((float) $changes['stripe_fee'], 2),
                ));

                if (! $dryRun) {
                    $ft->forceFill($changes)->save();
                }

                $fixed++;

                if ($limit > 0 && $fixed >= $limit) {
                    $stop = true;

                    return false;
                }
            }

            return true;
        });

        $this->newLine();
        $this->info("Scanned {$scanned} · repaired {$fixed} · already correct {$skipped} · could not price {$failed}");

        return self::SUCCESS;
    }

    /**
     * A row needs repair when the supporter is recorded as having paid LESS than the
     * creator's own gross. That is arithmetically impossible — the supporter price is
     * the creator's gross plus every fee — so it can only mean the row was priced by
     * the broken path, or gross was never written.
     *
     * A missing Stripe fee on a real charge is the same fault seen from the other side.
     */
    private function needsRepair(FinancialTransaction $ft): bool
    {
        $creatorGross = (float) ($ft->net_amount ?? 0) + (float) ($ft->vat_amount ?? 0);
        if ($creatorGross <= 0) {
            return false;
        }

        $gross = (float) ($ft->gross_amount ?? 0);

        // One penny of slack: the pricing engine rounds up to whole pence, so an
        // exactly-equal row is legitimate and must not be rewritten on every run.
        if ($gross + 0.01 < $creatorGross) {
            return true;
        }

        return $ft->source_type === StripePaymentItems::class && (float) ($ft->stripe_fee ?? 0) <= 0;
    }

    /**
     * @return array<string, mixed>|null null when the row is already correct
     */
    private function recompute(FinancialTransaction $ft): ?array
    {
        $currency = strtoupper((string) ($ft->currency ?: 'GBP'));
        $creatorGross = (float) ($ft->net_amount ?? 0) + (float) ($ft->vat_amount ?? 0);

        $breakdown = Helpers::calculateStripeDirectChargeFlow(
            $creatorGross,
            $currency,
            0,
            $ft->fee_profile ?: 'card',
            null,
            Helpers::storedFeeRates($ft)
        );

        // The charged figure on the payment row beats a recomputed estimate — it is
        // what the card was actually debited.
        $charged = $this->chargedAmount($ft);
        $gross = $charged > 0 ? $charged : (float) $breakdown['total_supporter_pays'];

        $changes = [
            'gross_amount' => round($gross, 2),
            'platform_fee' => round((float) $breakdown['application_fee'], 2),
            'stripe_fee' => round((float) $breakdown['stripe_fee'], 2),
            'compliance_fee' => $breakdown['compliance_fee'] ?? $ft->compliance_fee,
            'admin_fee' => $breakdown['admin_fee'] ?? $ft->admin_fee,
            'fee_profile' => $breakdown['fee_profile'] ?? ($ft->fee_profile ?: 'card'),
        ];

        $unchanged = abs((float) $ft->gross_amount - $changes['gross_amount']) < 0.01
            && abs((float) $ft->stripe_fee - $changes['stripe_fee']) < 0.01
            && abs((float) $ft->platform_fee - $changes['platform_fee']) < 0.01;

        return $unchanged ? null : $changes;
    }

    /**
     * What the payment row says the supporter was charged, when it records one.
     *
     * A cart line item carries its own total_paid; the parent checkout's total covers
     * every item in the basket, so it is deliberately NOT used as a per-item figure.
     */
    private function chargedAmount(FinancialTransaction $ft): float
    {
        $source = $ft->source;
        if (! $source) {
            return 0.0;
        }

        $paid = $source->getAttribute('total_paid');

        return $paid !== null ? (float) $paid : 0.0;
    }
}
