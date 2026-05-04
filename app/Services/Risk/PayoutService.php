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
    private const MINIMUM_PAYOUT_MINOR = 100; // £1.00 / $1.00 minimum threshold

    /**
     * Get all FinancialTransaction records for a Payment record by looking up source models.
     * Returns a collection of FTs.
     */
    public function getAllFinancialTransactionsForPayment(\App\Models\Payment $payment): \Illuminate\Support\Collection
    {
        $sourceModels = [
            \App\Models\TaskPurchase::class         => 'stripe_session_id',
            \App\Models\TipGoalsPayment::class      => 'session_id',
            \App\Models\ShopPayment::class          => 'session_id',
            \App\Models\MembershipPayment::class    => 'session_id',
            \App\Models\BillPayment::class          => 'session_id',
            \App\Models\StripePaymentItems::class   => 'stripe_session_id',
        ];

        foreach ($sourceModels as $modelClass => $sessionColumn) {
            $query = $modelClass::query();

            if ($modelClass === \App\Models\StripePaymentItems::class) {
                if (!$payment->stripe_session_id) continue;
                $detailIds = \App\Models\StripePaymentDetail::where('session_id', $payment->stripe_session_id)->pluck('id');
                if ($detailIds->isEmpty()) continue;
                $query->whereIn('stripe_payment_detail_id', $detailIds);
            } else {
                $query->where(function ($q) use ($payment, $sessionColumn, $modelClass) {
                    if ($payment->stripe_session_id) {
                        $q->orWhere($sessionColumn, $payment->stripe_session_id);
                    }
                    if ($modelClass === \App\Models\TaskPurchase::class && $payment->stripe_payment_intent_id) {
                        $q->orWhere('payment_intent_id', $payment->stripe_payment_intent_id);
                    }
                });
            }

            $items = $query->get(['id']);
            if ($items->isEmpty()) continue;

            $fts = \App\Models\FinancialTransaction::where('source_type', $modelClass)
                ->whereIn('source_id', $items->pluck('id'))
                ->get();
            
            if ($fts->isNotEmpty()) {
                return $fts;
            }
        }

        return collect();
    }

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

        $creators = Payment::query()
            ->where(function ($q) {
                $q->where(function ($q2) {
                    $q2->whereNull('payout_run_id')
                        ->whereIn('status', ['succeeded', 'review_hold']);
                })->orWhere(function ($q2) {
                    $q2->whereNotNull('payout_run_id')
                        ->whereIn('status', ['refunded', 'disputed'])
                        ->whereNull('adjustment_payout_run_id');
                });
            })
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
                ->orderByDesc('created_at')
                ->get();
            
            $holdIntentIds = Payment::where('creator_id', $creatorId)
                ->whereNull('payout_run_id')
                ->whereIn('status', ['review_hold', 'disputed'])
                ->whereNotNull('stripe_payment_intent_id')
                ->pluck('stripe_payment_intent_id')
                ->toArray();
            if (!empty($holdIntentIds)) {
                $payments = $payments
                    ->reject(fn ($p) => $p->stripe_payment_intent_id && in_array($p->stripe_payment_intent_id, $holdIntentIds, true))
                    ->values();
            }

            $payments = $payments
                ->unique(fn ($p) => $p->stripe_payment_intent_id ?: $p->stripe_session_id ?: $p->id)
                ->values();

            // Filter out Physical Shop payments and Timed Tasks that are NOT yet completed
            $payments = $payments->filter(function ($p) {
                $sessionId = $p->stripe_session_id;
                $intentId = $p->stripe_payment_intent_id;

                if ($sessionId || $intentId) {
                    // 1. Shop Payments (Physical)
                    $shopPayment = \App\Models\ShopPayment::with(['shop', 'deliverable'])
                        ->where(function ($q) use ($sessionId) {
                            if ($sessionId) $q->where('session_id', $sessionId);
                            else $q->whereRaw('1=0');
                        })
                        ->first();
                        
                    if ($shopPayment && $shopPayment->shop && $shopPayment->shop->type === 'physical') {
                        // Shop Physical: ONLY include if status is 'delivered' (Completed)
                        if (!$shopPayment->deliverable || $shopPayment->deliverable->status !== 'delivered') {
                            return false; 
                        }
                    }

                    // 2. Paid Tasks (Timed)
                    $taskPurchase = \App\Models\TaskPurchase::where(function ($q) use ($sessionId, $intentId) {
                            if ($sessionId) $q->orWhere('stripe_session_id', $sessionId);
                            if ($intentId) $q->orWhere('payment_intent_id', $intentId);
                        })
                        ->first();

                    if ($taskPurchase) {
                        $taskType = $taskPurchase->task->type ?? 'timed';
                        if ($taskType === 'timed') {
                            // Task Timed: ONLY include if status is completed/accepted/paid_out
                            if (!in_array($taskPurchase->status, ['completed', 'completed_accepted', 'paid_out'])) {
                                return false;
                            }
                        }
                        // Note: Instant tasks are included by default if payment succeeded and not on hold
                    }
                }
                return true;
            });

            // Calculate Net Eligible Base
            $netEarningsMinor = 0;
            foreach ($payments as $p) {
                $fts = $this->getAllFinancialTransactionsForPayment($p);
                if ($fts->isNotEmpty()) {
                    $netEarningsMinor += (int) round($fts->sum('net_amount') * 100);
                } else {
                    \Illuminate\Support\Facades\Log::warning("PayoutService: No FinancialTransactions found for payment {$p->stripe_session_id} — skipping from net earnings.");
                }
            }
            
            $grossAmount = (int) $payments->sum('amount');

            // Use FinancialTransaction.reserve_amount (net-based) instead of Payment.reserve_amount_minor (may be gross-based)
            $totalReservesHeld = 0;
            foreach ($payments as $p) {
                $fts = $this->getAllFinancialTransactionsForPayment($p);
                if ($fts->isNotEmpty() && $fts->sum('reserve_amount') > 0) {
                    $totalReservesHeld += (int) round($fts->sum('reserve_amount') * 100);
                } else {
                    $totalReservesHeld += (int) ($p->reserve_amount_minor ?? 0);
                }
            }

            $adjustments = Payment::where('creator_id', $creatorId)
                ->whereIn('status', ['refunded', 'disputed'])
                ->whereNotNull('payout_run_id')
                ->whereNull('adjustment_payout_run_id')
                ->orderByDesc('created_at')
                ->get()
                ->unique(fn ($p) => $p->stripe_payment_intent_id ?: $p->stripe_session_id ?: $p->id)
                ->values();

            $reviewHold = Payment::where('creator_id', $creatorId)
                ->where('status', 'review_hold')
                ->whereNull('payout_run_id')
                ->where('created_at', '<=', $cutoff)
                ->get();

            // Use FinancialTransaction net_amount (creator's actual earnings) for adjustments,
            // not Payment.amount which may be the gifter total or GBP-normalized risk amount.
            $refundDisputeAmount = 0;
            foreach ($adjustments as $adj) {
                $fts = $this->getAllFinancialTransactionsForPayment($adj);
                if ($fts->isNotEmpty()) {
                    $refundDisputeAmount += (int) round($fts->sum('net_amount') * 100);
                } else {
                    // Fallback to Payment amount if no FT exists
                    $refundDisputeAmount += (int) $adj->amount;
                }
            }
            
            $reviewHoldAmount = (int) $reviewHold->sum('amount');

            // The net payout should be the Net Earnings minus any NEW reserves being held,
            // plus any OLD reserves being released.
            // Note: net_amount in FinancialTransaction is currently the price before reserve subtraction.
            
            $reserveReleaseAmount = (int) ($dueReleases[$creatorId]['amount'] ?? 0);
            $reserveReleaseSources = $dueReleases[$creatorId]['sources'] ?? [];

            $netBeforeBalance = $netEarningsMinor - $totalReservesHeld + $reserveReleaseAmount - $refundDisputeAmount;
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
            
            // Check for minimum payout threshold
            $isBelowThreshold = false;
            if ($netPayout > 0 && $netPayout < self::MINIMUM_PAYOUT_MINOR) {
                $isBelowThreshold = true;
                $netPayout = 0;
            }
            
            if ($payments->isEmpty() && $adjustments->isEmpty() && $reviewHold->isEmpty() && $negativeBalance === 0 && $reserveReleaseAmount === 0) {
                continue;
            }

            $payouts[$creatorId] = [
                'creator_name' => $creator->name,
                'gross_amount' => $grossAmount,
                'net_earnings' => $netEarningsMinor,
                'refund_dispute_amount' => $refundDisputeAmount,
                'reserve_amount' => $totalReservesHeld, // This is what was held from the NEW payments
                'reserve_release_amount' => $reserveReleaseAmount,
                'reserve_release_sources' => $reserveReleaseSources,
                'review_hold_amount' => $reviewHoldAmount,
                'net_payout' => $netPayout,
                'is_below_threshold' => $isBelowThreshold,
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

            $actualPayouts = [];
            $skippedPayouts = [];
            $actualPlatformTotal = 0;
            $actualCreatorCount = 0;

            foreach ($previewData['payouts'] as $creatorId => $data) {
                // Process each creator's payout
                $netPayout = (int) ($data['net_payout'] ?? 0);
                $isBelowThreshold = (bool) ($data['is_below_threshold'] ?? false);
                $paymentIds = $data['payment_ids'] ?? [];
                $adjustmentIds = $data['adjustment_ids'] ?? [];
                $reserveReleaseSources = $data['reserve_release_sources'] ?? [];

                if ($netPayout > 0) {
                    $creator = User::where('uuid', $creatorId)->first();
                    if (!$creator || !$creator->account_id) {
                        $reason = !$creator ? "Creator not found" : "No connected Stripe account";
                        Log::warning("Payout: creator {$creatorId} {$reason} — skipping payout.");
                        $data['failure_reason'] = $reason;
                        $skippedPayouts[$creatorId] = $data;
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
                        \App\StripeControl::ensureManualPayoutSchedule($creator->account_id, $currency);

                        $payout = \App\StripeControl::createPayout([
                            'amount' => (int) $netPayout,
                            'currency' => $currency,
                            'method' => 'standard',
                            'metadata' => [
                                'payout_run_id' => (string) $run->id,
                                'creator_id' => (string) $creatorId,
                            ],
                        ], $creator->account_id);

                        $data['stripe_payout_id'] = $payout->id;
                        Log::info("Payout created for creator {$creatorId}: {$netPayout} {$currency} — payout {$payout->id}");

                        // Record individual payout
                        \App\Models\PayoutRecord::create([
                            'creator_id' => $creatorId,
                            'payout_run_id' => $run->id,
                            'stripe_payout_id' => $payout->id,
                            'amount_minor' => (int) $netPayout,
                            'currency' => $currency,
                            'status' => 'in_transit',
                            'arrival_date' => \Carbon\Carbon::createFromTimestamp($payout->arrival_date),
                            'metadata' => [
                                'stripe_payout' => $payout->toArray()
                            ]
                        ]);

                        if (!empty($paymentIds)) {
                            Payment::whereIn('id', $paymentIds)
                                ->update(['payout_run_id' => $run->id]);
                        }

                        if (!empty($adjustmentIds)) {
                            Payment::whereIn('id', $adjustmentIds)
                                ->update(['adjustment_payout_run_id' => $run->id]);
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

                        // Success - add to actual totals
                        $actualPayouts[$creatorId] = $data;
                        $actualPlatformTotal += $netPayout;
                        $actualCreatorCount++;

                    } catch (\Exception $e) {
                        $errorMsg = $e->getMessage();
                        Log::error("Payout execution failed for creator {$creatorId}: " . $errorMsg);
                        
                        // Record failed payout attempt for creator history
                        try {
                            \App\Models\PayoutRecord::create([
                                'creator_id' => $creatorId,
                                'payout_run_id' => $run->id,
                                'stripe_payout_id' => 'failed_' . uniqid(),
                                'amount_minor' => (int) $netPayout,
                                'currency' => $currency,
                                 'status' => 'failed',
                                 'failure_message' => $errorMsg,
                                 'metadata' => [
                                     'error' => $errorMsg,
                                     'attempted_at' => now()->toDateTimeString()
                                 ]
                            ]);
                        } catch (\Exception $logEx) {
                            Log::error("Failed to record failed payout record: " . $logEx->getMessage());
                        }

                        $data['failure_reason'] = $errorMsg;
                        $skippedPayouts[$creatorId] = $data;
                        continue;
                    }
                } elseif ($isBelowThreshold) {
                    // Skip marking payments as processed if below threshold
                    // They will be picked up in the next run
                    Log::info("Payout skipped for creator {$creatorId}: Amount below threshold — will retry in next run.");
                    $data['failure_reason'] = "Below minimum threshold (£1.00)";
                    $skippedPayouts[$creatorId] = $data;
                    continue;
                } else {
                    // Handle zero payout but mark IDs (e.g. only adjustments or holds processed)
                    if (!empty($paymentIds)) {
                        Payment::whereIn('id', $paymentIds)
                            ->update(['payout_run_id' => $run->id]);
                    }

                    if (!empty($adjustmentIds)) {
                        Payment::whereIn('id', $adjustmentIds)
                            ->update(['adjustment_payout_run_id' => $run->id]);
                    }

                    if (isset($data['negative_balance_after'])) {
                        CreatorMetric::where('creator_id', $creatorId)->update([
                            'negative_balance_minor' => (int) $data['negative_balance_after'],
                            'updated_at' => now(),
                        ]);
                    }

                    // Zero payout is still a processed creator
                    $actualPayouts[$creatorId] = $data;
                    $actualCreatorCount++;
                }
            }

            // Update run totals to reflect only what was actually processed
            $previewData['payouts'] = $actualPayouts;
            $previewData['skipped_payouts'] = $skippedPayouts;
            $previewData['platform_total'] = $actualPlatformTotal;
            $previewData['creator_count'] = $actualCreatorCount;

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
        $rates = \App\Models\Currency::rates();
        $convert = function ($amount, $from, $to = 'GBP') use ($rates) {
            $from = strtoupper($from ?: 'GBP');
            $to = strtoupper($to ?: 'GBP');
            if ($from === $to) return $amount;
            if (!isset($rates[$from]) || !isset($rates[$to])) return $amount;
            $gbpAmount = $amount / $rates[$from];
            return $gbpAmount * $rates[$to];
        };

        // Find executed runs with unreleased reserves for this creator
        $runs = PayoutRun::where('status', 'executed')->get();

        $held = [];
        $totalHeldGbp = 0;

        foreach ($runs as $run) {
            $payouts = $run->totals['payouts'] ?? [];
            $data = $payouts[$creatorId] ?? null;

            if ($data && isset($data['reserve_amount']) && $data['reserve_amount'] > 0 
                && empty($data['reserve_released'])) {
                
                $releaseDate = $data['reserve_release_date'] ?? Carbon::parse($run->run_date)->addDays(self::RESERVE_RELEASE_WINDOW_DAYS)->toDateString();
                $currency = $data['currency'] ?? 'GBP';
                $amountGbp = $convert($data['reserve_amount'], $currency, 'GBP');

                $held[] = [
                    'payout_run_id' => $run->id,
                    'amount' => $data['reserve_amount'],
                    'currency' => $currency,
                    'amount_gbp' => $amountGbp,
                    'run_date' => $run->run_date,
                    'release_date' => $releaseDate,
                    'days_remaining' => max(0, Carbon::now()->diffInDays(Carbon::parse($releaseDate), false)),
                    'source_name' => 'Payout Run Reserve',
                ];
                $totalHeldGbp += $amountGbp;
            }
        }

        // Add pending reserves from recent payments (Excluding Holds/Disputes)
        // Fetch ALL unpaid succeeded payments — filter by FT reserve, not Payment.reserve_amount_minor
        $pendingPayments = \App\Models\Payment::where('creator_id', $creatorId)
            ->whereNull('payout_run_id')
            ->where('status', 'succeeded')
            ->orderByDesc('created_at')
            ->get(['amount', 'reserve_amount_minor', 'status', 'created_at', 'stripe_session_id', 'stripe_payment_intent_id', 'creator_id', 'currency'])
            ->unique(fn ($p) => $p->stripe_payment_intent_id ?: $p->stripe_session_id ?: $p->id)
            ->values();

        $holdIntentIds = \App\Models\Payment::where('creator_id', $creatorId)
            ->whereNull('payout_run_id')
            ->whereIn('status', ['review_hold', 'disputed'])
            ->whereNotNull('stripe_payment_intent_id')
            ->pluck('stripe_payment_intent_id')
            ->toArray();
        if (!empty($holdIntentIds)) {
            $pendingPayments = $pendingPayments
                ->reject(fn ($p) => $p->stripe_payment_intent_id && in_array($p->stripe_payment_intent_id, $holdIntentIds, true))
                ->values();
        }

        foreach ($pendingPayments as $p) {
            // Always use FinancialTransaction.reserve_amount (net-based) as the canonical reserve
            $fts = $this->getAllFinancialTransactionsForPayment($p);

            if ($fts->isNotEmpty()) {
                // Check if this payment is actually "Confirmed/Paid" (included in Gross)
                $isIncludedInGross = true;
                foreach ($fts as $ft) {
                    if ($ft->source_type === \App\Models\TaskPurchase::class) {
                        $task = \App\Models\TaskPurchase::find($ft->source_id);
                        if ($task && ($task->task->type ?? 'timed') === 'timed') {
                            if (!in_array($task->status, ['completed', 'completed_accepted', 'paid_out'])) {
                                $isIncludedInGross = false;
                                break;
                            }
                        }
                    } elseif ($ft->source_type === \App\Models\ShopPayment::class) {
                        $shopPayment = \App\Models\ShopPayment::find($ft->source_id);
                        if ($shopPayment && ($shopPayment->shop->type ?? 'digital') === 'physical') {
                            if (($shopPayment->deliverable->status ?? 'pending') !== 'delivered') {
                                $isIncludedInGross = false;
                                break;
                            }
                        }
                    }
                }

                if (!$isIncludedInGross) {
                    continue; // Skip reserves for unfulfilled tasks/shop items
                }

                if ($fts->sum('reserve_amount') > 0) {
                    $reserveMinor = (int) round($fts->sum('reserve_amount') * 100);
                    $description = $fts->first()->description ?: 'Pending Payment';
                } else {
                    continue;
                }
            } elseif ((int) ($p->reserve_amount_minor ?? 0) > 0) {
                // Legacy fallback: Payment.reserve_amount_minor
                $reserveMinor = (int) $p->reserve_amount_minor;
                $description = 'Pending Payment';
            } else {
                continue; // No reserve on this payment
            }

            $amountGbp = $convert($reserveMinor, $p->currency, 'GBP');

            $held[] = [
                'payout_run_id' => 'Pending',
                'amount' => $reserveMinor,
                'currency' => $p->currency,
                'amount_gbp' => $amountGbp,
                'run_date' => 'Pending',
                'release_date' => $p->created_at ? $p->created_at->addDays(self::RESERVE_RELEASE_WINDOW_DAYS)->toDateString() : Carbon::now()->addDays(self::RESERVE_RELEASE_WINDOW_DAYS)->toDateString(),
                'days_remaining' => max(0, Carbon::now()->diffInDays($p->created_at ? $p->created_at->addDays(self::RESERVE_RELEASE_WINDOW_DAYS) : Carbon::now()->addDays(self::RESERVE_RELEASE_WINDOW_DAYS), false)),
                'source_name' => $description,
            ];
            $totalHeldGbp += $amountGbp;
        }

        // Sort by release date (soonest first)
        usort($held, function($a, $b) {
            return strtotime($a['release_date']) - strtotime($b['release_date']);
        });

        return [
            'total_held' => $totalHeldGbp,
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

        \App\StripeControl::ensureManualPayoutSchedule($creator->account_id, $currency);
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
                    'payout_run_id' => $run->id, // UUID — do not cast to int
                ];
            }
        }

        return $due;
    }

    private function markReserveSourcesReleased(string $creatorId, array $sources): void
    {
        foreach ($sources as $source) {
            $payoutRunId = $source['payout_run_id'] ?? null; // UUID — do not cast to int
            if (empty($payoutRunId)) {
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

     /**
      * Find the FinancialTransaction for a Payment record by looking up source models.
      * Returns the first FT found or null if not found.
      * @deprecated Use getAllFinancialTransactionsForPayment instead
      */
     private function findFinancialTransactionForPayment(\App\Models\Payment $payment): ?\App\Models\FinancialTransaction
     {
         return $this->getAllFinancialTransactionsForPayment($payment)->first();
     }
}
