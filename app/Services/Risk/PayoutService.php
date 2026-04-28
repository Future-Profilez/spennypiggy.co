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
    /**
     * Calculate payouts for all eligible creators.
     * Returns a detailed breakdown for preview.
     */
    public function calculatePayouts($runDate = null)
    {
        $runDate = $runDate ? Carbon::parse($runDate) : Carbon::now();
        
        $platformState = PlatformRiskState::latest('started_at')->first();
        $state = $platformState ? $platformState->state : 'NORMAL';

        $creators = Payment::whereNull('payout_run_id')
            ->whereIn('status', ['succeeded', 'refunded', 'disputed', 'review_hold'])
            ->distinct()
            ->pluck('creator_id');

        $payouts = [];
        $platformTotal = 0;

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
                ->whereNull('payout_run_id')
                ->where('created_at', '<=', $cutoff)
                ->get();

            $reviewHold = Payment::where('creator_id', $creatorId)
                ->where('status', 'review_hold')
                ->whereNull('payout_run_id')
                ->where('created_at', '<=', $cutoff)
                ->get();

            $grossAmount = (int) $payments->sum('amount');
            $refundDisputeAmount = (int) $adjustments->sum('amount');
            $reviewHoldAmount = (int) $reviewHold->sum('amount');

            $eligibleBase = $grossAmount - $refundDisputeAmount;

            $reservePercent = (int) $metrics->reserve_percent;
            $reserveAmount = $eligibleBase > 0 ? (int) floor(($eligibleBase * $reservePercent) / 100) : 0;

            $netBeforeBalance = $eligibleBase - $reserveAmount;
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
            
            if ($payments->isEmpty() && $adjustments->isEmpty() && $reviewHold->isEmpty() && $negativeBalance === 0) {
                continue;
            }

            $payouts[$creatorId] = [
                'creator_name' => $creator->name, // Assuming name exists
                'gross_amount' => $grossAmount,
                'refund_dispute_amount' => $refundDisputeAmount,
                'reserve_amount' => $reserveAmount,
                'review_hold_amount' => $reviewHoldAmount,
                'net_payout' => $netPayout,
                'payment_count' => $payments->count(),
                'payment_ids' => $payments->pluck('id')->toArray(),
                'adjustment_ids' => $adjustments->pluck('id')->toArray(),
                'reserve_held' => true, // Flag to track reserve holding
                'reserve_release_date' => $runDate->copy()->addDays(90)->toDateString(), // Rolling 90 days
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
        $releaseWindow = 90; // Days to hold reserve
        
        // Find old payout runs where reserve was held
        $cutoffDate = $runDate->copy()->subDays($releaseWindow);
        
        $oldRuns = PayoutRun::where('run_date', '<=', $cutoffDate)
            ->where('status', 'executed')
            ->get();

        $releasedTotal = 0;
        $releases = [];

        foreach ($oldRuns as $run) {
            $data = $run->totals;
            if (empty($data['payouts'])) continue;

            $runUpdated = false;

            foreach ($data['payouts'] as $creatorId => $payoutData) {
                // Check if reserve was held and not yet released
                if (isset($payoutData['reserve_amount']) && $payoutData['reserve_amount'] > 0 
                    && empty($payoutData['reserve_released'])) {
                    
                    $creator = User::where('uuid', $creatorId)->first();
                    if (!$creator) continue;

                    $amountToRelease = $payoutData['reserve_amount'];
                    
                    // Add to release list
                    $releases[$creatorId] = ($releases[$creatorId] ?? 0) + $amountToRelease;
                    
                    // Mark as released in the old run record (Update JSON)
                    $payoutData['reserve_released'] = true;
                    $payoutData['released_at'] = $runDate->toDateString();
                    $data['payouts'][$creatorId] = $payoutData;
                    $runUpdated = true;
                }
            }
            
            // Save updated run data to mark reserves as released
            if ($runUpdated) {
                $run->totals = $data;
                $run->save();
            }
        }

        // Process Transfers for Released Amounts
        foreach ($releases as $creatorId => $amount) {
            if ($amount <= 0) continue;
            
            $creator = User::where('uuid', $creatorId)->first();
            if (!$creator || !$creator->account_id) continue;

            try {
                $currency = 'gbp';
                $isZeroDecimal = \App\Helpers::isZeroDecimalCurrency($currency);
                $amountMajor = $isZeroDecimal ? (int) $amount : ((float) $amount / 100);

                // Transfer funds from Platform to Creator Connected Account
                \App\StripeControl::transferToConnectedAccount(
                    $creator->account_id, 
                    $amountMajor, 
                    $currency
                );
                
                $releasedTotal += $amount;
                
                // Notify Creator via PWA/Email
                $currencySymbol = \App\Helpers::getCurrency($currency);
                $title = "💰 Reserve Released";
                $content = "Your held reserve of {$currencySymbol}{$amountMajor} has been released to your balance.";
                
                // Send PWA Notification
                \App\Helpers::sendNotification($title, $content, $creator->email);
                
                Log::info("Reserve released for creator {$creatorId}: {$amount}");
                
            } catch (\Exception $e) {
                Log::error("Failed to release reserve for {$creatorId}: " . $e->getMessage());
            }
        }

        return [
            'released_count' => count($releases),
            'released_total' => $releasedTotal,
            'details' => $releases
        ];
    }

    /**
     * Execute Payouts — marks records and triggers Stripe transfers for platform-held funds.
     * Payments created via the risk engine (platform_holds_funds = true) stay on the platform
     * account until this method transfers the net amount to each creator's connected account.
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
                Payment::whereIn('id', $data['payment_ids'])
                    ->update(['payout_run_id' => $run->id]);

                if (!empty($data['adjustment_ids'])) {
                    Payment::whereIn('id', $data['adjustment_ids'])
                        ->update(['payout_run_id' => $run->id]);
                }

                if (isset($data['negative_balance_after'])) {
                    CreatorMetric::where('creator_id', $creatorId)->update([
                        'negative_balance_minor' => (int) $data['negative_balance_after'],
                        'updated_at' => now(),
                    ]);
                }

                $netPayout = (int) ($data['net_payout'] ?? 0);
                if ($netPayout <= 0) {
                    continue;
                }

                // Only transfer if at least one of the included payments has platform_holds_funds.
                // Payments using transfer_data already moved money to the creator directly.
                $needsTransfer = Payment::whereIn('id', $data['payment_ids'])
                    ->where('platform_holds_funds', true)
                    ->exists();

                if (!$needsTransfer) {
                    continue;
                }

                $creator = User::where('uuid', $creatorId)->first();
                if (!$creator || !$creator->account_id) {
                    Log::warning("Payout: creator {$creatorId} has no connected account — skipping transfer.");
                    continue;
                }

                try {
                    $currency = $creator->default_currency ?? 'gbp';
                    $isZeroDecimal = \App\Helpers::isZeroDecimalCurrency($currency);
                    $amountMajor = $isZeroDecimal ? $netPayout : round($netPayout / 100, 2);

                    $transfer = \App\StripeControl::transferToConnectedAccount(
                        $creator->account_id,
                        $amountMajor,
                        $currency
                    );

                    // Store transfer ID on the most recent payment in the batch for traceability
                    Payment::whereIn('id', $data['payment_ids'])
                        ->where('platform_holds_funds', true)
                        ->orderByDesc('created_at')
                        ->limit(1)
                        ->update(['stripe_transfer_id' => $transfer->id]);

                    Log::info("Payout transfer executed for creator {$creatorId}: {$netPayout} {$currency} — transfer {$transfer->id}");

                    $currencySymbol = \App\Helpers::getCurrency($currency);
                    \App\Helpers::sendNotification(
                        '💰 Payout Sent',
                        "Your payout of {$currencySymbol}{$amountMajor} has been sent to your account.",
                        $creator->email
                    );
                } catch (\Exception $e) {
                    Log::error("Payout transfer failed for creator {$creatorId}: " . $e->getMessage());
                    // Continue with remaining creators rather than rolling back everything
                }
            }

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

        $currency = $creator->default_currency ?? 'gbp';
        $isZeroDecimal = \App\Helpers::isZeroDecimalCurrency($currency);
        $amountMajor = $isZeroDecimal ? (int) $amount : ((float) $amount / 100);

        // Transfer funds
        \App\StripeControl::transferToConnectedAccount(
            $creator->account_id, 
            $amountMajor, 
            $currency
        );
        
        // Notify
        $currencySymbol = \App\Helpers::getCurrency($currency);
        $title = "💰 Reserve Released";
        $content = "Your held reserve of {$currencySymbol}{$amountMajor} has been manually released to your balance.";
        
        \App\Helpers::sendNotification($title, $content, $creator->email);
        
        Log::info("Manual reserve release for creator {$creatorId}: {$amount}");
    }
}
