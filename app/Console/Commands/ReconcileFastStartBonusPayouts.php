<?php

namespace App\Console\Commands;

use App\Models\AuditLog;
use App\Models\CreatorMetric;
use App\Models\Currency;
use App\Models\FastStartBonusPayout;
use App\Models\FinancialTransaction;
use App\Models\User;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

class ReconcileFastStartBonusPayouts extends Command
{
    protected $signature = 'bonus:reconcile-fast-start {--dry-run} {--limit=0}';

    protected $description = 'Recalculate Fast Start bonus after refunds/disputes and apply clawback to creator negative balance if needed';

    public function handle(): int
    {
        $dryRun = (bool) $this->option('dry-run');
        $limit = (int) $this->option('limit');

        $query = FastStartBonusPayout::query()
            ->whereIn('status', ['paid'])
            ->orderByDesc('paid_at')
            ->orderByDesc('id');

        if ($limit > 0) {
            $query->limit($limit);
        }

        $rows = $query->get();

        $rates = Currency::rates();
        $convert = function (float $amount, string $from, string $to) use ($rates): float {
            $from = strtoupper($from ?: 'GBP');
            $to = strtoupper($to ?: 'GBP');
            if ($from === $to) {
                return $amount;
            }
            if (! isset($rates[$from]) || ! isset($rates[$to])) {
                return $amount;
            }

            return ($amount / $rates[$from]) * $rates[$to];
        };

        $processed = 0;
        $skipped = 0;

        foreach ($rows as $row) {
            if (! $row->window_start || ! $row->window_end) {
                $skipped++;

                continue;
            }

            $creator = User::where('uuid', $row->creator_uuid)->first();
            if (! $creator) {
                $skipped++;

                continue;
            }

            $currency = strtoupper((string) ($row->currency ?: ($creator->default_currency ?? 'GBP')));

            $txs = FinancialTransaction::query()
                ->where('user_id', $creator->id)
                ->where('type', 'income')
                ->where('status', 'completed')
                ->whereBetween('transaction_date', [$row->window_start, $row->window_end])
                ->get(['net_amount', 'currency']);

            $expectedEarningsMinor = 0;
            foreach ($txs as $tx) {
                $from = strtoupper((string) ($tx->currency ?? 'GBP'));
                $net = (float) ($tx->net_amount ?? 0);
                $expectedEarningsMinor += (int) round($convert($net, $from, $currency) * 100);
            }

            $previousClawbackMinor = (int) ($row->clawback_minor ?? 0);
            $expectedBonusMinor = (int) round($expectedEarningsMinor * FastStartBonusPayout::resolveRate($expectedEarningsMinor));
            $alreadyPaidBonusMinor = (int) ($row->bonus_minor ?? 0);

            $clawbackMinor = max(0, $alreadyPaidBonusMinor - $expectedBonusMinor);
            $clawbackDelta = max(0, $clawbackMinor - $previousClawbackMinor);

            $row->expected_earnings_minor = $expectedEarningsMinor;
            $row->expected_bonus_minor = $expectedBonusMinor;
            $row->clawback_minor = $clawbackMinor;

            if ($dryRun) {
                $this->line($row->creator_uuid.' paid='.$alreadyPaidBonusMinor.' expected='.$expectedBonusMinor.' clawback='.$clawbackMinor.' delta='.$clawbackDelta.' '.$currency);
                $processed++;

                continue;
            }

            DB::transaction(function () use ($row, $creator, $clawbackDelta, $currency) {
                $row->reconciled_at = now();
                $row->save();

                if ($clawbackDelta <= 0) {
                    return;
                }

                $metric = CreatorMetric::firstOrCreate(['creator_id' => $creator->uuid], [
                    'reserve_percent' => 0,
                    'payout_delay_days' => 7,
                    'negative_balance_minor' => 0,
                    'top_buyer_percent' => 0,
                    'volatility_score' => 0,
                    'risk_level' => 'low',
                    'is_overridden' => false,
                ]);

                $metric->negative_balance_minor = (int) ($metric->negative_balance_minor ?? 0) + $clawbackDelta;
                $metric->save();

                AuditLog::create([
                    'actor' => 'system',
                    'action_type' => 'fast_start_bonus_clawback_applied',
                    'reference_id' => (string) $creator->uuid,
                    'metadata_json' => [
                        'fast_start_bonus_payout_id' => (string) $row->id,
                        'paid_bonus_minor' => (int) ($row->bonus_minor ?? 0),
                        'expected_bonus_minor' => (int) ($row->expected_bonus_minor ?? 0),
                        'clawback_minor' => (int) $row->clawback_minor,
                        'clawback_delta_minor' => (int) $clawbackDelta,
                        'currency' => strtolower($currency),
                    ],
                ]);
            });

            $processed++;
        }

        $this->info('Processed: '.$processed);
        $this->info('Skipped: '.$skipped);

        return self::SUCCESS;
    }
}
