<?php

namespace App\Console\Commands;

use App\Models\FinancialTransaction;
use Illuminate\Console\Command;

/**
 * Fills `gbp_amount` / `gbp_rate` on ledger rows written before those columns existed.
 *
 * ⚠️ Historical rows are backfilled at TODAY'S rate, because the rate that applied on the
 * day of the charge was never recorded and cannot be recovered. That is the best available
 * answer, not the right one — but once written it never moves again, which is the whole
 * point. Run it ONCE, soon; every day it is delayed makes the backfilled figures further
 * from the truth.
 *
 * Rows whose currency is not in the currencies table are left NULL rather than assumed 1:1
 * — the reports count and name them instead of silently absorbing a wrong figure.
 */
class BackfillLedgerGbpAmounts extends Command
{
    protected $signature = 'finance:backfill-gbp
                            {--dry-run : Report what would change and write nothing}
                            {--chunk=500 : Rows per batch}';

    protected $description = 'Backfill gbp_amount/gbp_rate on financial_transactions rows that predate the columns';

    public function handle(): int
    {
        $dryRun = (bool) $this->option('dry-run');
        $chunk = max(1, (int) $this->option('chunk'));

        $pending = FinancialTransaction::whereNull('gbp_rate')->count();

        if ($pending === 0) {
            $this->info('Nothing to backfill — every row already carries a frozen rate.');

            return self::SUCCESS;
        }

        $this->info(($dryRun ? '[DRY RUN] ' : '').number_format($pending).' row(s) without a frozen rate.');

        $written = 0;
        $unconverted = [];

        FinancialTransaction::whereNull('gbp_rate')
            ->orderBy('id')
            ->chunkById($chunk, function ($rows) use ($dryRun, &$written, &$unconverted) {
                foreach ($rows as $row) {
                    $currency = strtoupper((string) ($row->currency ?: 'GBP'));
                    $rate = FinancialTransaction::ledgerFxRate($currency);

                    if ($rate === null) {
                        $unconverted[$currency] = ($unconverted[$currency] ?? 0) + 1;

                        continue;
                    }

                    if (! $dryRun) {
                        // Query builder, not save(): this must not fire the ledger's
                        // reserve-immunity guards or touch updated_at on 100k rows.
                        FinancialTransaction::whereKey($row->id)->update([
                            'gbp_rate' => $rate,
                            'gbp_amount' => round((float) $row->gross_amount / $rate, 2),
                        ]);
                    }

                    $written++;
                }
            });

        $this->info(($dryRun ? 'Would write ' : 'Wrote ').number_format($written).' row(s).');

        if ($unconverted !== []) {
            $this->warn('Left NULL — currency not in the currencies table:');
            foreach ($unconverted as $iso => $count) {
                $this->warn("  {$iso}: {$count} row(s)");
            }
        }

        return self::SUCCESS;
    }
}
