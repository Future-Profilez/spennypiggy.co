<?php

namespace App\Jobs;

use App\Helpers;
use App\Mail\FounderBonusPayoutInitiated;
use App\Models\Currency;
use App\Models\FinancialTransaction;
use App\Models\FounderBonus;
use App\Models\FounderBonusMonthly;
use App\Models\PayoutRecord;
use App\StripeControl;
use Carbon\Carbon;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Schema;

class ProcessFounderMonthlyBonuses implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public function handle(): void
    {
        if (! Schema::hasTable('founder_bonus')) {
            return;
        }

        $target = now()->subMonthNoOverflow();
        $monthKey = $target->format('Y-m');
        $monthStart = $target->copy()->startOfMonth();
        $monthEnd = $target->copy()->endOfMonth();

        $rates = Currency::rates();
        if ($rates instanceof Collection) {
            $rates = $rates->toArray();
        }

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

        $minMonthly = (float) FounderBonus::getMinMonthlyEarnings();
        $maxMonthly = (float) FounderBonus::getMaxMonthlyEarnings();
        $bonusPercentage = (float) FounderBonus::getBonusPercentage();
        $maxBonus = (float) FounderBonus::getMaxBonusPerMonth();

        $qualifications = FounderBonus::with('creator')
            ->get();

        foreach ($qualifications as $q) {
            $creator = $q->creator;
            if (! $creator) {
                continue;
            }
            if (empty($creator->stripe_connected_at) || (int) ($creator->stripe_details_submitted ?? 0) !== 1 || empty($creator->account_id)) {
                continue;
            }

            $qualifiedAt = $q->qualification_date ? Carbon::parse($q->qualification_date)->startOfDay() : null;
            if (! $qualifiedAt) {
                continue;
            }

            $programEnd = $qualifiedAt->copy()->addMonthsNoOverflow(12)->endOfDay();
            if ($monthEnd->lt($qualifiedAt) || $monthStart->gt($programEnd)) {
                continue;
            }

            $calcStart = $monthStart;
            if ($qualifiedAt->gt($calcStart)) {
                $calcStart = $qualifiedAt;
            }
            $calcEnd = $monthEnd;

            $txs = FinancialTransaction::query()
                ->where('user_id', $creator->id)
                ->where('type', 'income')
                ->where('status', 'completed')
                ->whereBetween('transaction_date', [$calcStart, $calcEnd])
                ->get(['net_amount', 'currency']);

            $earningsGbp = 0.0;
            foreach ($txs as $tx) {
                $from = strtoupper((string) ($tx->currency ?? 'GBP'));
                $net = (float) ($tx->net_amount ?? 0);
                $earningsGbp += $convert($net, $from, 'GBP');
            }

            $bonusAmount = 0.0;
            if ($earningsGbp >= $minMonthly) {
                $earningsForBonus = min($earningsGbp, $maxMonthly);
                $bonusAmount = round(min($earningsForBonus * $bonusPercentage, $maxBonus), 2);
            }

            $row = FounderBonusMonthly::firstOrNew([
                'creator_id' => $creator->id,
                'month' => $monthKey,
            ]);

            $row->fill([
                'first_30d_earnings' => (float) $q->first_30d_earnings,
                'founder_qualified_at' => $qualifiedAt,
                'monthly_earnings' => round($earningsGbp, 2),
                'bonus_amount' => $bonusAmount,
            ]);

            $row->payout_status = $row->payout_status ?: 'pending';
            $row->save();

            if (! empty($creator->payout_paused_at) || $bonusAmount <= 0) {
                continue;
            }
            if (! empty($row->payout_record_uuid) || ! empty($row->stripe_payout_id) || $row->payout_status === 'paid') {
                continue;
            }

            $currency = strtoupper((string) ($creator->default_currency ?? 'GBP'));
            $amount = (float) $convert((float) $bonusAmount, 'GBP', $currency);
            $amountMinor = (int) round($amount * 100);
            if ($amountMinor <= 0) {
                continue;
            }

            $notify = null;

            $metadataBase = [
                'bonus_type' => 'founder_monthly',
                'reason' => 'founder_monthly_bonus',
                'source' => 'job:process-founder-monthly-bonuses',
                'founder_month_key' => (string) $monthKey,
                'founder_monthly_row_id' => (string) $row->id,
                'founder_qualification_id' => (string) $q->id,
                'creator_id' => (string) $creator->uuid,
                'creator_username' => (string) $creator->username,
                'creator_email' => (string) $creator->email,
                'amount_minor' => (string) $amountMinor,
                'currency' => strtolower($currency),
                'env' => (string) config('app.env'),
            ];

            $transferDescription = 'Founder Monthly Bonus'.(! empty($creator->username) ? (' - '.$creator->username) : '');

            // Stripe calls happen OUTSIDE any DB transaction; idempotency keys keyed to the
            // monthly row make a retried run return the same transfer/payout (no double pay).
            $transfer = StripeControl::transferToConnectedAccountMinor(
                $creator->account_id,
                $amountMinor,
                strtolower($currency),
                $metadataBase,
                $transferDescription,
                // Key on the STABLE (creator, month), not $row->id: firstOrNew can create
                // different rows (different ids) in concurrent runs, which would defeat the
                // idempotency and double-pay. (creator, month) is identical across runs.
                'founder_monthly_transfer_'.$creator->id.'_'.$monthKey
            );

            StripeControl::ensureManualPayoutSchedule($creator->account_id, strtolower($currency));

            $payout = StripeControl::createPayout([
                'amount' => (int) $amountMinor,
                'currency' => strtolower($currency),
                'method' => 'standard',
                'metadata' => array_merge($metadataBase, [
                    'transfer_id' => (string) ($transfer->id ?? ''),
                ]),
                'idempotency_key' => 'founder_monthly_payout_'.$creator->id.'_'.$monthKey,
            ], $creator->account_id);

            // Money has moved — commit the marks immediately in their own small transaction.
            DB::transaction(function () use ($creator, $monthKey, $amountMinor, $currency, $transfer, $payout, &$notify) {
                $locked = FounderBonusMonthly::where('creator_id', $creator->id)->where('month', $monthKey)->lockForUpdate()->first();
                if (! $locked || ! empty($locked->payout_record_uuid) || ! empty($locked->stripe_payout_id) || $locked->payout_status === 'paid') {
                    return; // already recorded by another run (same Stripe objects via idempotency)
                }

                $payoutRecord = PayoutRecord::create([
                    'creator_id' => $creator->uuid,
                    'payout_run_id' => null,
                    'stripe_payout_id' => $payout->id ?? null,
                    'amount_minor' => (int) $amountMinor,
                    'currency' => strtolower($currency),
                    'status' => $payout->status ?? 'pending',
                    'arrival_date' => isset($payout->arrival_date) ? Carbon::createFromTimestamp($payout->arrival_date) : null,
                    'metadata' => [
                        'stripe_payout' => method_exists($payout, 'toArray') ? $payout->toArray() : null,
                        'bonus_type' => 'founder_monthly',
                        'founder_month' => $monthKey,
                        'founder_monthly_row_id' => (int) $locked->id,
                        'founder_bonus_amount_minor' => (int) $amountMinor,
                        'founder_bonus_transfer_id' => $transfer->id ?? null,
                    ],
                ]);

                $locked->stripe_transfer_id = $transfer->id ?? null;
                $locked->stripe_payout_id = $payout->id ?? null;
                $locked->payout_record_uuid = $payoutRecord->uuid;
                if (($payout->status ?? null) === 'paid') {
                    $locked->payout_status = 'paid';
                    $locked->payout_date = now();
                }
                $locked->save();

                $notify = [
                    'email' => (string) ($creator->email ?? ''),
                    'amount' => ((int) $amountMinor) / 100,
                    'currency' => strtolower($currency),
                    'arrival_date' => isset($payout->arrival_date) ? Carbon::createFromTimestamp($payout->arrival_date)->toDateString() : null,
                ];
            });

            if (! $notify || empty($notify['email'])) {
                continue;
            }

            try {
                Mail::to($notify['email'])->send(new FounderBonusPayoutInitiated($creator, 'Founder Monthly Bonus', (float) $notify['amount'], (string) $notify['currency'], $notify['arrival_date'], $monthKey));
            } catch (\Throwable $e) {
                Log::error('Failed to send founder monthly payout email', [
                    'creator_id' => $creator->id,
                    'month' => $monthKey,
                    'error' => $e->getMessage(),
                ]);
            }

            try {
                Helpers::sendNotification(
                    'Founder Monthly Bonus payout initiated',
                    "Your Founder Monthly Bonus payout for {$monthKey} has been initiated. Check Payouts for status.",
                    $notify['email']
                );
            } catch (\Throwable $e) {
                Log::error('Failed to send founder monthly payout push', [
                    'creator_id' => $creator->id,
                    'month' => $monthKey,
                    'error' => $e->getMessage(),
                ]);
            }
        }

        Log::info('Founder monthly bonus processing completed', [
            'month' => $monthKey,
        ]);
    }
}
