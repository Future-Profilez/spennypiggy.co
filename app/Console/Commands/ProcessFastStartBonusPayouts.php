<?php

namespace App\Console\Commands;

use App\Helpers;
use App\Mail\FastStartBonusPayoutInitiated;
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
use Illuminate\Support\Facades\Mail;

class ProcessFastStartBonusPayouts extends Command
{
    protected $signature = 'bonus:process-fast-start {--dry-run} {--limit=0} {--creator=}';

    protected $description = 'Pay Fast Start bonus as a one-time payout after the 30-day window ends';

    private function windowDays(): int
    {
        return (int) config('fast_start_bonus.bonus.window_days', 30);
    }

    private function settlementBufferDays(): int
    {
        return (int) config('fast_start_bonus.bonus.settlement_buffer_days', 7);
    }

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
            $windowEnd = $windowStart->copy()->addDays($this->windowDays());
            $eligibleAt = $windowEnd->copy()->addDays($this->settlementBufferDays());

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
                $statusVal = $tx->status ?? null;
                if ($statusVal === 'completed') {
                    $from = strtoupper((string) ($tx->currency ?? 'GBP'));
                    $net = (float) ($tx->net_amount ?? 0);
                    $converted = $convert($net, $from, $currency);
                    $earningsMinor += (int) round($converted * 100);
                } elseif (in_array($statusVal, ['pending', 'review_hold', 'disputed'], true)) {
                    $unsettledCount++;
                }
            }

            $bonusRate = FastStartBonusPayout::resolveRate($earningsMinor);
            $bonusMinor = (int) round($earningsMinor * $bonusRate);

            if ($dryRun) {
                $this->line($creator->uuid . ' eligible_at=' . $eligibleAt->toDateTimeString() . ' earnings=' . $earningsMinor . ' bonus=' . $bonusMinor . ' rate=' . $bonusRate . ' ' . $currency);
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
            $payoutRow->status = ($now->lt($eligibleAt) || $unsettledCount > 0) ? 'pending_settlement' : 'ready';
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

            // Claim the row in its own small transaction so a concurrent run can't double-process
            $payoutRow = DB::transaction(function () use ($creator, $windowStart, $windowEnd, $earningsMinor, $bonusMinor, $currency) {
                $row = FastStartBonusPayout::where('creator_uuid', $creator->uuid)->lockForUpdate()->first();
                if (!$row) {
                    $row = new FastStartBonusPayout(['creator_uuid' => $creator->uuid]);
                } elseif (in_array($row->status, ['pending', 'in_transit', 'paid', 'processing'], true)) {
                    return null;
                }
                $row->stripe_account_id = $creator->account_id;
                $row->window_start = $windowStart;
                $row->window_end = $windowEnd;
                $row->earnings_minor = $earningsMinor;
                $row->bonus_minor = $bonusMinor;
                $row->currency = $currency;
                $row->status = 'processing';
                $row->save();

                return $row;
            });

            if (!$payoutRow) {
                $skipped++;
                continue;
            }

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
                'bonus_rate' => (string) $bonusRate,
                'currency' => strtolower($currency),
                'env' => (string) config('app.env'),
            ];

            $transferDescription = 'Fast Start Bonus' . (!empty($creator->username) ? (' - ' . $creator->username) : '');

            // Stripe calls happen OUTSIDE any DB transaction; idempotency keys make a re-run safe
            try {
                $transfer = \App\StripeControl::transferToConnectedAccountMinor(
                    $creator->account_id,
                    $bonusMinor,
                    strtolower($currency),
                    $metadataBase,
                    $transferDescription,
                    'fast_start_transfer_' . $creator->uuid . '_' . $payoutRow->id
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
                    'idempotency_key' => 'fast_start_payout_' . $creator->uuid . '_' . $payoutRow->id,
                ], $creator->account_id);
            } catch (\Exception $e) {
                $payoutRow->status = 'failed';
                $payoutRow->save();
                Log::error('Fast Start bonus payout failed', [
                    'creator_uuid' => $creator->uuid,
                    'bonus_minor' => $bonusMinor,
                    'currency' => $currency,
                    'error' => $e->getMessage(),
                ]);
                $this->error($creator->uuid . ' payout failed: ' . $e->getMessage());
                $skipped++;
                continue;
            }

            if (!empty($transfer->id) && !empty($payout->id)) {
                \App\StripeControl::updateTransferMinor((string) $transfer->id, strtolower($currency), array_merge($metadataBase, [
                    'stripe_payout_id' => (string) $payout->id,
                ]), $transferDescription);
            }

            // Money has moved — commit the marks immediately in their own small transaction
            DB::transaction(function () use ($creator, $payoutRow, $windowStart, $windowEnd, $earningsMinor, $bonusMinor, $currency, $transfer, $payout) {
                $payoutRow->stripe_payout_id = $payout->id ?? null;
                $payoutRow->status = $payout->status ?? 'pending';
                $payoutRow->save();

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
            });

            Log::info('Fast Start bonus payout created', [
                'creator_uuid' => $creator->uuid,
                'bonus_minor' => $bonusMinor,
                'currency' => $currency,
                'stripe_payout_id' => $payout->id ?? null,
                'stripe_transfer_id' => $transfer->id ?? null,
            ]);

            // Push notification + email
            $bonusFormatted = number_format($bonusMinor / 100, 2);
            $currencySymbol = strtoupper($currency);
            $arrivalDate = isset($payout->arrival_date)
                ? Carbon::createFromTimestamp($payout->arrival_date)->format('D, d M Y')
                : null;

            Helpers::sendNotification(
                '🚀 Fast Start Bonus Payout Initiated!',
                "Your {$currencySymbol} {$bonusFormatted} Fast Start Bonus is on its way!" . ($arrivalDate ? " Expected: {$arrivalDate}." : ''),
                $creator->email
            );

            if (config('fast_start_bonus.notifications.email')) {
                try {
                    Mail::to($creator->email)->send(new FastStartBonusPayoutInitiated(
                        $creator,
                        $bonusMinor / 100,
                        $currency,
                        $earningsMinor / 100,
                        $arrivalDate
                    ));
                } catch (\Exception $e) {
                    Log::warning('Fast Start bonus initiated email failed', [
                        'creator_uuid' => $creator->uuid,
                        'error' => $e->getMessage(),
                    ]);
                }
            }

            $processed++;
        }

        $this->info('Processed: ' . $processed);
        $this->info('Skipped: ' . $skipped);

        return self::SUCCESS;
    }
}
