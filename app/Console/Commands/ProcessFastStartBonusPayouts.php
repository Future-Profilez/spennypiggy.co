<?php

namespace App\Console\Commands;

use App\Models\AuditLog;
use App\Models\FastStartBonusPayout;
use App\Models\FinancialTransaction;
use App\Models\PayoutRecord;
use App\Models\User;
use App\Models\Currency;
use Carbon\Carbon;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class ProcessFastStartBonusPayouts extends Command
{
    protected $signature = 'bonus:process-fast-start {--dry-run} {--limit=0} {--creator=}';

    protected $description = 'Pay Fast Start bonus as a one-time payout after the 30-day window ends';

    private const SETTLEMENT_BUFFER_DAYS = 7;

    public function handle(): int
    {
        $dryRun = (bool) $this->option('dry-run');
        $limit = (int) $this->option('limit');
        $creatorFilter = trim((string) $this->option('creator'));

        $now = now();

        $query = User::query()
            ->whereNotNull('stripe_connected_at')
            ->where('stripe_details_submitted', 1)
            ->whereNotNull('account_id')
            ->orderBy('id');

        if ($creatorFilter !== '') {
            $query->where(function ($q) use ($creatorFilter) {
                $q->where('uuid', $creatorFilter)
                    ->orWhere('username', $creatorFilter);
            });
        }

        if ($limit > 0) {
            $query->limit($limit);
        }

        $creators = $query->get();

        $processed = 0;
        $skipped = 0;

        foreach ($creators as $creator) {
            $windowStart = Carbon::parse($creator->stripe_connected_at);
            $windowEnd = $windowStart->copy()->addDays(30);
            $eligibleAt = $windowEnd->copy()->addDays(self::SETTLEMENT_BUFFER_DAYS);

            if ($now->lt($windowEnd)) {
                $skipped++;
                continue;
            }

            $existing = FastStartBonusPayout::where('creator_uuid', $creator->uuid)->first();
            if ($existing && in_array($existing->status, ['pending', 'in_transit', 'paid', 'processing'], true)) {
                $skipped++;
                continue;
            }

            $currency = strtoupper((string) ($creator->default_currency ?? 'GBP'));

            $rates = Currency::rates();
            $convert = function (float $amount, string $from, string $to) use ($rates): float {
                $from = strtoupper($from ?: 'GBP');
                $to = strtoupper($to ?: 'GBP');
                if ($from === $to) return $amount;
                if (!isset($rates[$from]) || !isset($rates[$to])) return $amount;
                return ($amount / $rates[$from]) * $rates[$to];
            };

            $txs = FinancialTransaction::query()
                ->where('user_id', $creator->id)
                ->where('type', 'income')
                ->whereBetween('transaction_date', [$windowStart, $windowEnd])
                ->get(['net_amount', 'currency', 'status']);
            $unsettledCount = 0;

            $earningsMinor = 0;
            foreach ($txs as $tx) {
                if (($tx->status ?? null) !== 'completed') {
                    continue;
                }
                $from = strtoupper((string) ($tx->currency ?? 'GBP'));
                $net = (float) ($tx->net_amount ?? 0);
                $converted = $convert($net, $from, $currency);
                $earningsMinor += (int) round($converted * 100);
            }

            $bonusMinor = (int) round($earningsMinor * 0.05);

            if ($dryRun) {
                $this->line($creator->uuid . ' eligible_at=' . $eligibleAt->toDateTimeString() . ' earnings=' . $earningsMinor . ' bonus=' . $bonusMinor . ' ' . $currency);
                $processed++;
                continue;
            }

            $payoutRow = $existing ?: new FastStartBonusPayout();
            $payoutRow->creator_uuid = $creator->uuid;
            $payoutRow->stripe_account_id = $creator->account_id;
            $payoutRow->window_start = $windowStart;
            $payoutRow->window_end = $windowEnd;
            $payoutRow->eligible_at = $eligibleAt;
            $payoutRow->unsettled_count = $unsettledCount;
            $payoutRow->last_calculated_at = now();
            $payoutRow->earnings_minor = $earningsMinor;
            $payoutRow->bonus_minor = $bonusMinor;
            $payoutRow->currency = $currency;
            $payoutRow->status = $now->lt($eligibleAt) ? 'pending_settlement' : 'ready';
            $payoutRow->save();

            if ($payoutRow->status !== 'ready') {
                $skipped++;
                continue;
            }

            if ($creator->payout_paused_at) {
                $payoutRow->status = 'payout_paused';
                $payoutRow->save();
                $skipped++;
                continue;
            }

            if ($bonusMinor <= 0) {
                $payoutRow->status = 'no_bonus';
                $payoutRow->save();
                $skipped++;
                continue;
            }

            DB::transaction(function () use ($creator, $windowStart, $windowEnd, $eligibleAt, $earningsMinor, $bonusMinor, $currency) {
                $payoutRow = FastStartBonusPayout::where('creator_uuid', $creator->uuid)->lockForUpdate()->first();
                if (!$payoutRow) {
                    $payoutRow = new FastStartBonusPayout(['creator_uuid' => $creator->uuid]);
                }
                $payoutRow->stripe_account_id = $creator->account_id;
                $payoutRow->window_start = $windowStart;
                $payoutRow->window_end = $windowEnd;
                $payoutRow->earnings_minor = $earningsMinor;
                $payoutRow->bonus_minor = $bonusMinor;
                $payoutRow->currency = $currency;
                $payoutRow->status = 'processing';
                $payoutRow->save();

                $metadataBase = [
                    'bonus_type' => 'fast_start',
                    'reason' => 'fast_start_bonus',
                    'source' => 'bonus:process-fast-start',
                    'bonus_payout_id' => (string) $payoutRow->id,
                    'creator_id' => (string) $creator->uuid,
                    'creator_username' => (string) $creator->username,
                    'creator_email' => (string) $creator->email,
                    'window_start' => $windowStart->toISOString(),
                    'window_end' => $windowEnd->toISOString(),
                    'eligible_at' => $eligibleAt->toISOString(),
                    'earnings_minor' => (string) $earningsMinor,
                    'bonus_minor' => (string) $bonusMinor,
                    'currency' => strtolower($currency),
                    'env' => (string) config('app.env'),
                ];

                $transferDescription = 'Fast Start Bonus' . (!empty($creator->username) ? (' - ' . $creator->username) : '');

                $transfer = \App\StripeControl::transferToConnectedAccountMinor(
                    $creator->account_id,
                    $bonusMinor,
                    strtolower($currency),
                    $metadataBase,
                    $transferDescription
                );

                $payoutRow->stripe_transfer_id = $transfer->id ?? null;
                $payoutRow->save();

                \App\StripeControl::ensureManualPayoutSchedule($creator->account_id, strtolower($currency));

                $payout = \App\StripeControl::createPayout([
                    'amount' => (int) $bonusMinor,
                    'currency' => strtolower($currency),
                    'method' => 'standard',
                    'metadata' => array_merge($metadataBase, [
                        'transfer_id' => (string) ($transfer->id ?? ''),
                    ]),
                ], $creator->account_id);

                $payoutRow->stripe_payout_id = $payout->id ?? null;
                $payoutRow->status = $payout->status ?? 'pending';
                $payoutRow->save();

                if (!empty($transfer->id) && !empty($payout->id)) {
                    \App\StripeControl::updateTransferMinor((string) $transfer->id, strtolower($currency), array_merge($metadataBase, [
                        'stripe_payout_id' => (string) $payout->id,
                    ]), $transferDescription);
                }

                PayoutRecord::create([
                    'creator_id' => $creator->uuid,
                    'payout_run_id' => null,
                    'stripe_payout_id' => $payout->id,
                    'amount_minor' => (int) $bonusMinor,
                    'currency' => strtolower($currency),
                    'status' => $payout->status ?? 'pending',
                    'arrival_date' => isset($payout->arrival_date) ? Carbon::createFromTimestamp($payout->arrival_date) : null,
                    'metadata' => [
                        'stripe_payout' => method_exists($payout, 'toArray') ? $payout->toArray() : null,
                        'bonus_type' => 'fast_start',
                        'fast_start_bonus_applied_minor' => (int) $bonusMinor,
                        'fast_start_bonus_earnings_minor' => (int) $earningsMinor,
                        'fast_start_window_start' => $windowStart->toISOString(),
                        'fast_start_window_end' => $windowEnd->toISOString(),
                        'fast_start_bonus_transfer_id' => $transfer->id ?? null,
                    ],
                ]);

                AuditLog::create([
                    'actor' => 'system',
                    'action_type' => 'fast_start_bonus_paid',
                    'reference_id' => (string) $creator->uuid,
                    'metadata_json' => [
                        'bonus_payout_id' => (string) $payoutRow->id,
                        'stripe_payout_id' => (string) ($payout->id ?? null),
                        'stripe_transfer_id' => (string) ($transfer->id ?? null),
                        'amount_minor' => (int) $bonusMinor,
                        'currency' => strtolower($currency),
                        'earnings_minor' => (int) $earningsMinor,
                        'window_start' => $windowStart->toISOString(),
                        'window_end' => $windowEnd->toISOString(),
                    ],
                ]);

                Log::info('Fast Start bonus payout created', [
                    'creator_uuid' => $creator->uuid,
                    'bonus_minor' => $bonusMinor,
                    'currency' => $currency,
                    'stripe_payout_id' => $payout->id ?? null,
                    'stripe_transfer_id' => $transfer->id ?? null,
                ]);
            });

            $processed++;
        }

        $this->info('Processed: ' . $processed);
        $this->info('Skipped: ' . $skipped);

        return self::SUCCESS;
    }
}
