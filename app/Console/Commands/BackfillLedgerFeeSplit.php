<?php

namespace App\Console\Commands;

use App\Helpers;
use App\Models\FinancialTransaction;
use Illuminate\Console\Command;

/**
 * Splits the ledger's application fee into its parts on rows written before the
 * breakdown columns existed.
 *
 * 🚨 `financial_transactions.platform_fee` is NOT the platform's own cut — every write
 * path stores `$breakdown['application_fee']` there, which is platform + compliance +
 * the fixed admin fee combined. Newer rows ALSO carry `compliance_fee` / `admin_fee`;
 * older ones carry only the lump. Admin reporting therefore had no way to say what the
 * platform's own rate actually earned without re-deriving it from gross — which is how
 * the finance dashboard came to disagree with the ledger by £654.
 *
 * 🚨 `platform_fee` IS NEVER TOUCHED. It is what the platform actually took and the
 * payout engine reads it; this command only fills the two NULL detail columns, and it
 * scales them so `compliance_fee + admin_fee` can never exceed the lump. The platform's
 * own cut is then `platform_fee - compliance_fee - admin_fee`, and the total is preserved
 * exactly. A split that changed the total would be a rewrite of history, not a backfill.
 */
class BackfillLedgerFeeSplit extends Command
{
    protected $signature = 'finance:split-fees
                            {--dry-run : Report what would change and write nothing}
                            {--chunk=500 : Rows per batch}';

    protected $description = 'Fill compliance_fee/admin_fee on ledger rows that only carry the combined application fee';

    public function handle(): int
    {
        $dryRun = (bool) $this->option('dry-run');
        $chunk = max(1, (int) $this->option('chunk'));

        $profiles = config('payments.fee_profiles', []);

        $query = fn () => FinancialTransaction::whereNull('compliance_fee')->whereNotNull('platform_fee');

        $pending = $query()->count();

        if ($pending === 0) {
            $this->info('Nothing to split — every row already carries its fee breakdown.');

            return self::SUCCESS;
        }

        $this->info(($dryRun ? '[DRY RUN] ' : '').number_format($pending).' row(s) carry only the combined fee.');

        $lumpBefore = 0.0;
        $lumpAfter = 0.0;
        $written = 0;
        $skipped = 0;

        $query()->orderBy('id')->chunkById($chunk, function ($rows) use ($dryRun, $profiles, &$written, &$skipped, &$lumpBefore, &$lumpAfter) {
            foreach ($rows as $row) {
                $lump = round((float) $row->platform_fee, 2);
                $gross = (float) $row->gross_amount;
                $currency = strtoupper((string) ($row->currency ?: 'GBP'));

                if ($lump <= 0 || $gross <= 0) {
                    // Nothing was charged, so there is nothing to apportion. Writing
                    // explicit zeroes stops the row being re-examined on every run.
                    if (! $dryRun) {
                        FinancialTransaction::whereKey($row->id)->update([
                            'compliance_fee' => 0,
                            'admin_fee' => 0,
                        ]);
                    }
                    $skipped++;

                    continue;
                }

                $profile = $profiles[$row->fee_profile ?? 'card'] ?? ($profiles['card'] ?? []);

                // The rate the charge was ACTUALLY priced at wins over the config
                // profile — a bespoke-rate creator was never charged the standard rate.
                $platformRate = (float) ($row->platform_fee_rate ?? ($profile['platform_rate'] ?? 17));
                $complianceRate = (float) ($row->compliance_fee_rate ?? ($profile['compliance_rate'] ?? 2));
                $adminFee = Helpers::administrationFeeInCurrency($currency);

                $expectedPlatform = $gross * ($platformRate / 100);
                $expectedCompliance = $gross * ($complianceRate / 100);
                $expectedTotal = $expectedPlatform + $expectedCompliance + $adminFee;

                if ($expectedTotal <= 0) {
                    $skipped++;

                    continue;
                }

                // Scale to the lump that was actually taken, so rounding, a legacy
                // rate or the platform absorbing a shortfall all stay accounted for.
                $factor = $lump / $expectedTotal;

                $compliance = round($expectedCompliance * $factor, 2);
                $admin = round($adminFee * $factor, 2);

                // Belt and braces: the platform's own cut may never go negative.
                if ($compliance + $admin > $lump) {
                    $shrink = $lump / ($compliance + $admin);
                    $compliance = round($compliance * $shrink, 2);
                    $admin = round(max(0, $lump - $compliance), 2);
                }

                $lumpBefore += $lump;
                $lumpAfter += round($lump - $compliance - $admin, 2) + $compliance + $admin;

                if (! $dryRun) {
                    FinancialTransaction::whereKey($row->id)->update([
                        'compliance_fee' => $compliance,
                        'admin_fee' => $admin,
                    ]);
                }

                $written++;
            }
        });

        $this->info(($dryRun ? 'Would split ' : 'Split ').number_format($written).' row(s); '.number_format($skipped).' had nothing to apportion.');

        // The invariant this command exists to preserve, asserted out loud rather
        // than assumed: the parts must still add up to what was charged.
        $drift = round($lumpAfter - $lumpBefore, 2);
        if (abs($drift) > 0.01) {
            $this->error("TOTAL DRIFT {$drift} — the split did not preserve the application fee. Investigate before trusting reports.");

            return self::FAILURE;
        }

        $this->info('Application-fee total preserved exactly.');

        return self::SUCCESS;
    }
}
