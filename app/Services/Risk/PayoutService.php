<?php

namespace App\Services\Risk;

use App\Models\CreatorMetric;
use App\Models\Payment;
use App\Models\PlatformRiskState;
use App\Models\PayoutRun;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class PayoutService
{
    private const RESERVE_RELEASE_WINDOW_DAYS = 30;

    /**
     * Calculate payouts for all eligible creators.
     * Returns a detailed breakdown for preview.
     */
    public function calculatePayouts($runDate = null)
    {
        // Use endOfDay() if a date string is passed so we don't accidentally exclude today's payments (00:00:00)
        $runDate = $runDate ? Carbon::parse($runDate)->endOfDay() : Carbon::now();
        
        $platformState = PlatformRiskState::latest('started_at')->first();
        $state = $platformState ? $platformState->state : 'NORMAL';

        $creators = Payment::whereNull('payout_run_id')
            ->whereIn('status', ['succeeded', 'refunded', 'disputed', 'review_hold'])
            ->distinct()
            ->pluck('creator_id');

        $payouts = [];
        $platformTotal = 0;

        $dueReleases = $this->getDueReserveReleases($runDate);

        foreach ($creators as $creatorId) {
            $creator = User::where('uuid', $creatorId)->first();
            if (!$creator) continue;

            // Fetch Metrics
            try {
                $metrics = app(\App\Services\Risk\RiskService::class)->recalculateMetrics($creatorId);
            } catch (\Throwable) {
                $metrics = CreatorMetric::firstOrCreate(['creator_id' => $creatorId]);
            }
            
            $delayDays = 0;
            if (in_array($state, ['THROTTLE', 'FREEZE'], true)) {
                $delayDays = (int) $metrics->payout_delay_days;
            }
            $cutoff = $runDate->copy()->subDays($delayDays);

            // Fetch Eligible Payments
            $payments = Payment::where('creator_id', $creatorId)
                ->where('status', 'succeeded')
                ->whereNull('payout_run_id')
                ->where('created_at', '<=', $cutoff)
                ->get();

            $adjustments = Payment::where('creator_id', $creatorId)
                ->whereIn('status', ['refunded', 'disputed'])
                ->where(function($q) use ($cutoff) {
                    $q->whereNull('payout_run_id') // New refunds/disputes
                      ->orWhere('created_at', '<=', $cutoff); // Potential historical ones
                })
                ->get();

            $reviewHold = Payment::where('creator_id', $creatorId)
                ->where('status', 'review_hold')
                ->whereNull('payout_run_id')
                ->where('created_at', '<=', $cutoff)
                ->get();

            $grossAmount = (int) $payments->sum('amount');

            // CRITICAL FIX: Only subtract if the payment was actually paid out before (payout_run_id was NOT null)
            // If it's a NEW dispute/refund that was never paid, we just mark it as "processed" but don't subtract from gross.
            $refundDisputeAmount = (int) $adjustments->filter(function($p) {
                return !is_null($p->payout_run_id);
            })->sum('amount');
            $reviewHoldAmount = (int) $reviewHold->sum('amount');

            $eligibleBase = $grossAmount - $refundDisputeAmount;

            $reservePercent = (int) $metrics->reserve_percent;
            $reserveAmount = $eligibleBase > 0 ? (int) floor(($eligibleBase * $reservePercent) / 100) : 0;

            $reserveReleaseAmount = (int) ($dueReleases[$creatorId]['amount'] ?? 0);
            $reserveReleaseSources = $dueReleases[$creatorId]['sources'] ?? [];

            $netBeforeBalance = $eligibleBase - $reserveAmount + $reserveReleaseAmount;
            $negativeBalance = (int) ($metrics->negative_balance_minor ?? 0);
            $negativeBalanceDelta = 0;

            if ($netBeforeBalance < 0) {
                $negativeBalanceDelta = abs($netBeforeBalance);
                $netPayout = 0;
            } elseif ($negativeBalance > 0) {
                if ($netBeforeBalance >= $negativeBalance) {
                    $netPayout = $netBeforeBalance - $negativeBalance;
                    $negativeBalanceDelta = -$negativeBalance;
                } else {
                    $netPayout = 0;
                    $negativeBalanceDelta = -$netBeforeBalance;
                }
            } else {
                $netPayout = $netBeforeBalance;
            }
            
            if ($payments->isEmpty() && $adjustments->isEmpty() && $reviewHold->isEmpty() && $negativeBalance === 0 && $reserveReleaseAmount === 0) {
                continue;
            }

            $payouts[$creatorId] = [
                'creator_name' => $creator->name, // Assuming name exists
                'gross_amount' => $grossAmount,
                'refund_dispute_amount' => $refundDisputeAmount,
                'reserve_amount' => $reserveAmount,
                'reserve_release_amount' => $reserveReleaseAmount,
                'reserve_release_sources' => $reserveReleaseSources,
                'review_hold_amount' => $reviewHoldAmount,
                'net_payout' => $netPayout,
                'payment_count' => $payments->count(),
                'payment_ids' => $payments->pluck('id')->toArray(),
                'adjustment_ids' => $adjustments->pluck('id')->toArray(),
                'reserve_held' => true, // Flag to track reserve holding
                'reserve_release_date' => $runDate->copy()->addDays(self::RESERVE_RELEASE_WINDOW_DAYS)->toDateString(),
                'negative_balance_before' => $negativeBalance,
                'negative_balance_delta' => $negativeBalanceDelta,
                'negative_balance_after' => max(0, $negativeBalance + $negativeBalanceDelta),
                'state' => $state,
                'cutoff_date' => $cutoff->toDateTimeString(),
            ];
            
            $platformTotal += $netPayout;
        }

        return [
            'run_date' => $runDate->toDateString(),
            'platform_total' => $platformTotal,
            'creator_count' => count($payouts),
            'payouts' => $payouts,
        ];
    }

    /**
     * Release Held Reserves (Rolling Window)
     * Checks for reserves held > 90 days ago and releases them to creator
     */
    public function releaseReserves($runDate = null)
    {
        $runDate = $runDate ? Carbon::parse($runDate) : Carbon::now();
        $due = $this->getDueReserveReleases($runDate);
        $total = 0;
        foreach ($due as $row) {
            $total += (int) ($row['amount'] ?? 0);
        }

        return [
            'due_creator_count' => count($due),
            'due_total' => $total,
        ];
    }

    /**
     * Execute Payouts — triggers Stripe payouts to Creator's bank accounts.
     * All funds go directly to Creator Stripe Accounts (Direct Charges).
     * Review holds and disputes are simply excluded from the net payout calculation here.
     */
    public function executePayouts($previewData, $runId = null)
    {
        DB::beginTransaction();
        try {
            if ($runId) {
                $run = PayoutRun::where('id', $runId)->lockForUpdate()->firstOrFail();
                $run->update([
                    'run_date' => $previewData['run_date'],
                    'status' => 'executed',
                    'totals' => $previewData,
                ]);
            } else {
                $run = PayoutRun::create([
                    'run_date' => $previewData['run_date'],
                    'status' => 'executed',
                    'totals' => $previewData,
                ]);
            }

            foreach ($previewData['payouts'] as $creatorId => $data) {
                // Process each creator's payout
                $netPayout = (int) ($data['net_payout'] ?? 0);
                $paymentIds = $data['payment_ids'] ?? [];
                $adjustmentIds = $data['adjustment_ids'] ?? [];
                $reserveReleaseSources = $data['reserve_release_sources'] ?? [];

                if ($netPayout > 0) {
                    $creator = User::where('uuid', $creatorId)->first();
                    if (!$creator || !$creator->account_id) {
                        Log::warning("Payout: creator {$creatorId} has no connected account — skipping payout.");
                        continue;
                    }

                    // For Direct Charges, funds are already in the connected account.
                    // We only need to trigger a payout from their Stripe balance to their bank account.

                    $currency = strtolower((string) ($creator->default_currency ?? 'gbp'));
                    if (!empty($paymentIds)) {
                        $paymentCurrency = Payment::whereIn('id', $paymentIds)->orderByDesc('created_at')->value('currency');
                        if (!empty($paymentCurrency)) {
                            $currency = strtolower((string) $paymentCurrency);
                        }
                    }

                    try {
                        // Always trigger actual bank payout from connected account balance.
                        \App\StripeControl::ensureManualPayoutSchedule($creator->account_id);

                        $payout = \App\StripeControl::createPayout([
                            'amount' => (int) $netPayout,
                            'currency' => $currency,
                            'method' => 'standard',
                            'metadata' => [
                                'payout_run_id' => (string) $run->id,
                                'creator_id' => (string) $creatorId,
                            ],
                        ], $creator->account_id);

                        $previewData['payouts'][$creatorId]['stripe_payout_id'] = $payout->id;
                        Log::info("Payout created for creator {$creatorId}: {$netPayout} {$currency} — payout {$payout->id}");

                        if (!empty($paymentIds)) {
                            Payment::whereIn('id', $paymentIds)
                                ->update(['payout_run_id' => $run->id]);
                        }

                        if (!empty($adjustmentIds)) {
                            Payment::whereIn('id', $adjustmentIds)
                                ->update(['payout_run_id' => $run->id]);
                        }

                        if (isset($data['negative_balance_after'])) {
                            CreatorMetric::where('creator_id', $creatorId)->update([
                                'negative_balance_minor' => (int) $data['negative_balance_after'],
                                'updated_at' => now(),
                            ]);
                        }

                        if (!empty($reserveReleaseSources)) {
                            $this->markReserveSourcesReleased($creatorId, $reserveReleaseSources);
                        }

                        $isZeroDecimal = \App\Helpers::isZeroDecimalCurrency($currency);
                        $amountMajor = $isZeroDecimal ? (int) $netPayout : round($netPayout / 100, 2);
                        $currencySymbol = \App\Helpers::getCurrency($currency);
                        \App\Helpers::sendNotification(
                            '💰 Payout Sent',
                            "Your payout of {$currencySymbol}{$amountMajor} has been sent to your account.",
                            $creator->email
                        );
                    } catch (\Exception $e) {
                        Log::error("Payout execution failed for creator {$creatorId}: " . $e->getMessage());
                        continue;
                    }
                } else {
                    if (!empty($paymentIds)) {
                        Payment::whereIn('id', $paymentIds)
                            ->update(['payout_run_id' => $run->id]);
                    }

                    if (!empty($adjustmentIds)) {
                        Payment::whereIn('id', $adjustmentIds)
                            ->update(['payout_run_id' => $run->id]);
                    }

                    if (isset($data['negative_balance_after'])) {
                        CreatorMetric::where('creator_id', $creatorId)->update([
                            'negative_balance_minor' => (int) $data['negative_balance_after'],
                            'updated_at' => now(),
                        ]);
                    }
                }
            }

            $run->totals = $previewData;
            $run->save();

            DB::commit();
            return $run;
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error("Payout Execution Failed: " . $e->getMessage());
            throw $e;
        }
    }

    /**
     * Get held reserves for a creator.
     */
    public function getHeldReserves($creatorId)
    {
        // Find executed runs with unreleased reserves for this creator
        // Note: whereJsonContains might be slow on large datasets, consider indexing or separate table for reserves if scaling
        $runs = PayoutRun::where('status', 'executed')
            ->get();

        $held = [];
        $totalHeld = 0;

        foreach ($runs as $run) {
            // Check if this run has data for the creator
            $payouts = $run->totals['payouts'] ?? [];
            $data = $payouts[$creatorId] ?? null;

            if ($data && isset($data['reserve_amount']) && $data['reserve_amount'] > 0 
                && empty($data['reserve_released'])) {
                
                $releaseDate = $data['reserve_release_date'] ?? Carbon::parse($run->run_date)->addDays(90)->toDateString();
                
                $held[] = [
                    'payout_run_id' => $run->id,
                    'amount' => $data['reserve_amount'],
                    'run_date' => $run->run_date,
                    'release_date' => $releaseDate,
                    'days_remaining' => max(0, Carbon::now()->diffInDays(Carbon::parse($releaseDate), false))
                ];
                $totalHeld += $data['reserve_amount'];
            }
        }

        // Sort by release date (soonest first)
        usort($held, function($a, $b) {
            return strtotime($a['release_date']) - strtotime($b['release_date']);
        });

        return [
            'total_held' => $totalHeld,
            'breakdown' => $held
        ];
    }

    /**
     * Manually Release Specific Reserve
     */
    public function releaseSpecificReserve($payoutRunId, $creatorId)
    {
        $run = PayoutRun::findOrFail($payoutRunId);
        $data = $run->totals;
        
        if (!isset($data['payouts'][$creatorId])) {
            throw new \Exception("No payout data found for this creator in this run.");
        }

        $payoutData = $data['payouts'][$creatorId];

        // Check eligibility
        if (!isset($payoutData['reserve_amount']) || $payoutData['reserve_amount'] <= 0) {
            throw new \Exception("No reserve held for this payout.");
        }
        if (!empty($payoutData['reserve_released'])) {
            throw new \Exception("Reserve already released.");
        }

        $amountToRelease = $payoutData['reserve_amount'];

        // Execute Transfer
        $this->transferReserveToCreator($creatorId, $amountToRelease);

        // Update Record
        $payoutData['reserve_released'] = true;
        $payoutData['released_at'] = now()->toDateString();
        $payoutData['released_manually'] = true;
        $payoutData['released_by'] = auth()->id() ?? 'admin';
        
        $data['payouts'][$creatorId] = $payoutData;
        $run->totals = $data;
        $run->save();

        return $amountToRelease;
    }

    /**
     * Manually Release All Reserves for a Creator
     */
    public function releaseAllReserves($creatorId)
    {
        $reserves = $this->getHeldReserves($creatorId);
        $totalReleased = 0;
        $releasedCount = 0;

        foreach ($reserves['breakdown'] as $reserve) {
            try {
                $this->releaseSpecificReserve($reserve['payout_run_id'], $creatorId);
                $totalReleased += $reserve['amount'];
                $releasedCount++;
            } catch (\Exception $e) {
                Log::error("Failed to release reserve {$reserve['payout_run_id']} for creator {$creatorId}: " . $e->getMessage());
            }
        }

        return [
            'count' => $releasedCount,
            'total' => $totalReleased
        ];
    }

    /**
     * Helper to transfer funds and notify
     */
    private function transferReserveToCreator($creatorId, $amount)
    {
        $creator = User::where('uuid', $creatorId)->first();
        if (!$creator || !$creator->account_id) {
            throw new \Exception("Creator not found or not connected to Stripe.");
        }

        $currency = strtolower((string) ($creator->default_currency ?? 'gbp'));
        $isZeroDecimal = \App\Helpers::isZeroDecimalCurrency($currency);
        $amountMajor = $isZeroDecimal ? (int) $amount : ((float) $amount / 100);

        \App\StripeControl::ensureManualPayoutSchedule($creator->account_id);
        \App\StripeControl::createPayout([
            'amount' => (int) $amount,
            'currency' => $currency,
            'method' => 'standard',
            'metadata' => [
                'creator_id' => (string) $creatorId,
                'reason' => 'manual_reserve_release',
            ],
        ], $creator->account_id);
        
        // Notify
        $currencySymbol = \App\Helpers::getCurrency($currency);
        $title = "💰 Reserve Released";
        $content = "Your held reserve of {$currencySymbol}{$amountMajor} has been manually released to your balance.";
        
        \App\Helpers::sendNotification($title, $content, $creator->email);
        
        Log::info("Manual reserve release for creator {$creatorId}: {$amount}");
    }

    private function getDueReserveReleases(Carbon $runDate): array
    {
        $cutoffDate = $runDate->copy()->subDays(self::RESERVE_RELEASE_WINDOW_DAYS);
        $runs = PayoutRun::where('run_date', '<=', $cutoffDate)
            ->where('status', 'executed')
            ->get();

        $due = [];

        foreach ($runs as $run) {
            $payouts = $run->totals['payouts'] ?? [];
            if (empty($payouts)) {
                continue;
            }

            foreach ($payouts as $creatorId => $payoutData) {
                $reserveAmount = (int) ($payoutData['reserve_amount'] ?? 0);
                if ($reserveAmount <= 0 || !empty($payoutData['reserve_released'])) {
                    continue;
                }

                $releaseDate = $payoutData['reserve_release_date'] ?? Carbon::parse($run->run_date)->addDays(self::RESERVE_RELEASE_WINDOW_DAYS)->toDateString();
                if (!Carbon::parse($releaseDate)->lte($runDate)) {
                    continue;
                }

                $due[$creatorId]['amount'] = (int) ($due[$creatorId]['amount'] ?? 0) + $reserveAmount;
                $due[$creatorId]['sources'] = $due[$creatorId]['sources'] ?? [];
                $due[$creatorId]['sources'][] = [
                    'payout_run_id' => (int) $run->id,
                ];
            }
        }

        return $due;
    }

    private function markReserveSourcesReleased(string $creatorId, array $sources): void
    {
        foreach ($sources as $source) {
            $payoutRunId = (int) ($source['payout_run_id'] ?? 0);
            if ($payoutRunId <= 0) {
                continue;
            }

            $run = PayoutRun::find($payoutRunId);
            if (!$run) {
                continue;
            }

            $data = $run->totals;
            if (empty($data['payouts'][$creatorId])) {
                continue;
            }

            $payoutData = $data['payouts'][$creatorId];
            if (!empty($payoutData['reserve_released'])) {
                continue;
            }

            $payoutData['reserve_released'] = true;
            $payoutData['released_at'] = now()->toDateString();
            $payoutData['released_via'] = 'payout_run';

            $data['payouts'][$creatorId] = $payoutData;
            $run->totals = $data;
            $run->save();
        }
    }
}
