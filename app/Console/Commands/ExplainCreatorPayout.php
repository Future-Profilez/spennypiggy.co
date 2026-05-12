<?php

namespace App\Console\Commands;

use App\Models\CreatorMetric;
use App\Models\Payment;
use App\Models\PlatformRiskState;
use App\Models\PayoutRun;
use App\Models\User;
use App\Services\Risk\PayoutService;
use Carbon\Carbon;
use Illuminate\Console\Command;

class ExplainCreatorPayout extends Command
{
    protected $signature = 'finance:explain-payout {creator} {--run_date=}';
    protected $description = 'Explain creator payout preview inputs and why estimated payout is 0 or reduced';

    public function handle(): int
    {
        $input = (string) $this->argument('creator');

        $creator = null;
        if (is_numeric($input)) {
            $creator = User::find((int) $input);
        }
        if (!$creator) {
            $creator = User::where('uuid', $input)
                ->orWhere('username', $input)
                ->first();
        }
        if (!$creator) {
            $creator = User::where('name', $input)->first();
        }

        if (!$creator) {
            $this->error("Creator not found: {$input}");
            return self::FAILURE;
        }

        $runDateInput = $this->option('run_date');
        $runDate = $runDateInput ? Carbon::parse((string) $runDateInput)->endOfDay() : Carbon::now();

        $platformState = PlatformRiskState::latest('started_at')->first();
        $state = $platformState ? $platformState->state : 'NORMAL';

        try {
            $metrics = app(\App\Services\Risk\RiskService::class)->recalculateMetrics($creator->uuid);
        } catch (\Throwable) {
            $metrics = CreatorMetric::firstOrCreate(['creator_id' => $creator->uuid]);
        }

        $delayDays = 0;
        if (in_array($state, ['THROTTLE', 'FREEZE'], true)) {
            $delayDays = (int) ($metrics->payout_delay_days ?? 0);
        }
        $cutoff = $runDate->copy()->subDays($delayDays);

        $this->line("Creator: {$creator->name} (@{$creator->username})");
        $this->line("Creator ID: {$creator->id}");
        $this->line("Creator UUID: {$creator->uuid}");
        $this->line("Run date: {$runDate->toDateTimeString()}");
        $this->line("Platform state: {$state}");
        $this->line("Delay days: {$delayDays}");
        $this->line("Eligibility cutoff: {$cutoff->toDateTimeString()}");
        $this->newLine();

        $negativeBefore = (int) ($metrics->negative_balance_minor ?? 0);
        $reservePercent = (int) ($metrics->reserve_percent ?? 0);
        $payoutDelayDays = (int) ($metrics->payout_delay_days ?? 0);
        $metricsUpdated = method_exists($metrics, 'getAttribute') ? ($metrics->updated_at ? $metrics->updated_at->toDateTimeString() : null) : null;
        $this->line("Metrics: reserve_percent={$reservePercent}, payout_delay_days={$payoutDelayDays}, updated_at=" . ($metricsUpdated ?: 'n/a'));
        $this->line("Negative balance (before): " . $this->money($negativeBefore));

        $unadjustedRefundDispute = Payment::whereIn('creator_id', [(string) $creator->id, $creator->uuid])
            ->whereIn('status', ['refunded', 'disputed'])
            ->whereNotNull('payout_run_id')
            ->whereNull('adjustment_payout_run_id')
            ->count();
        $this->line("Refund/dispute adjustments pending: {$unadjustedRefundDispute}");

        $hasAnyRun = PayoutRun::query()->exists();
        $this->line("Any payout runs exist: " . ($hasAnyRun ? 'yes' : 'no'));

        $creatorRuns = Payment::whereIn('creator_id', [(string) $creator->id, $creator->uuid])
            ->whereNotNull('payout_run_id')
            ->distinct()
            ->count('payout_run_id');
        $this->line("Payout runs referenced by this creator payments: {$creatorRuns}");
        $this->newLine();

        $payments = Payment::whereIn('creator_id', [(string) $creator->id, $creator->uuid])
            ->where('status', 'succeeded')
            ->whereNull('payout_run_id')
            ->where('created_at', '<=', $cutoff)
            ->orderByDesc('created_at')
            ->get();

        $holdIntentIds = Payment::whereIn('creator_id', [(string) $creator->id, $creator->uuid])
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

        $pendingDeliverablesMinor = 0;

        $payments = $payments->filter(function ($p) use (&$pendingDeliverablesMinor) {
            $sessionId = $p->stripe_session_id;
            $intentId = $p->stripe_payment_intent_id;

            if ($sessionId || $intentId) {
                $shopPayment = \App\Models\ShopPayment::with(['shop', 'deliverable'])
                    ->where(function ($q) use ($sessionId) {
                        if ($sessionId) $q->where('session_id', $sessionId);
                        else $q->whereRaw('1=0');
                    })
                    ->first();

                if ($shopPayment && $shopPayment->shop && $shopPayment->shop->type === 'physical') {
                    if (!$shopPayment->deliverable || $shopPayment->deliverable->status !== 'delivered') {
                        $fts = app(PayoutService::class)->getAllFinancialTransactionsForPayment($p);
                        if ($fts->isNotEmpty()) {
                            $pendingDeliverablesMinor += (int) round($fts->sum('net_amount') * 100);
                        }
                        return false;
                    }
                }

                $taskPurchase = \App\Models\TaskPurchase::where(function ($q) use ($sessionId, $intentId) {
                        if ($sessionId) $q->orWhere('stripe_session_id', $sessionId);
                        if ($intentId) $q->orWhere('payment_intent_id', $intentId);
                    })
                    ->first();

                if ($taskPurchase) {
                    $taskType = $taskPurchase->task->type ?? 'timed';
                    if ($taskType === 'timed') {
                        if (!in_array($taskPurchase->status, ['completed', 'completed_accepted', 'paid_out'])) {
                            $fts = app(PayoutService::class)->getAllFinancialTransactionsForPayment($p);
                            if ($fts->isNotEmpty()) {
                                $pendingDeliverablesMinor += (int) round($fts->sum('net_amount') * 100);
                            }
                            return false;
                        }
                    }
                }
            }
            return true;
        });

        $this->line("Eligible succeeded payments (after holds/cutoff/fulfilment): {$payments->count()}");
        if (!empty($holdIntentIds)) {
            $this->line("Hold intent IDs blocking eligibility: " . count($holdIntentIds));
            $sample = array_slice($holdIntentIds, 0, 3);
            if (!empty($sample)) {
                $this->line("Hold intent sample: " . implode(', ', $sample));
            }
        }
        $this->line("Pending fulfilment (minor): " . $this->money($pendingDeliverablesMinor));
        $this->newLine();

        $netEarningsMinor = 0;
        $totalReservesHeld = 0;
        $missingFts = 0;

        foreach ($payments as $p) {
            $fts = app(PayoutService::class)->getAllFinancialTransactionsForPayment($p);
            if ($fts->isNotEmpty()) {
                $netEarningsMinor += (int) round($fts->sum('net_amount') * 100);
                if ((float) $fts->sum('reserve_amount') > 0) {
                    $totalReservesHeld += (int) round($fts->sum('reserve_amount') * 100);
                } else {
                    $totalReservesHeld += (int) ($p->reserve_amount_minor ?? 0);
                }
            } else {
                $missingFts++;
                $totalReservesHeld += (int) ($p->reserve_amount_minor ?? 0);
            }
        }

        $this->line("Eligible net earnings (minor): " . $this->money($netEarningsMinor));
        $this->line("New reserve held from eligible (minor): " . $this->money($totalReservesHeld));
        $this->line("Eligible payments missing financial_transactions link: {$missingFts}");
        if ($missingFts > 0) {
            foreach ($payments as $p) {
                $fts = app(PayoutService::class)->getAllFinancialTransactionsForPayment($p);
                if ($fts->isEmpty()) {
                    $this->line("Missing link payment_id={$p->id}, created_at={$p->created_at}, session_id={$p->stripe_session_id}, intent_id={$p->stripe_payment_intent_id}, amount={$this->money((int) ($p->amount ?? 0))}, reserve={$this->money((int) ($p->reserve_amount_minor ?? 0))}");
                }
            }
        }
        $this->newLine();

        $adjustments = Payment::whereIn('creator_id', [(string) $creator->id, $creator->uuid])
            ->whereIn('status', ['refunded', 'disputed'])
            ->whereNotNull('payout_run_id')
            ->whereNull('adjustment_payout_run_id')
            ->orderByDesc('created_at')
            ->get()
            ->unique(fn ($p) => $p->stripe_payment_intent_id ?: $p->stripe_session_id ?: $p->id)
            ->values();

        $refundDisputeAmount = 0;
        foreach ($adjustments as $adj) {
            $fts = app(PayoutService::class)->getAllFinancialTransactionsForPayment($adj);
            if ($fts->isNotEmpty()) {
                $refundDisputeAmount += (int) round($fts->sum('net_amount') * 100);
            } else {
                $refundDisputeAmount += (int) ($adj->amount ?? 0);
            }
        }

        $this->line("Refund/dispute clawbacks (minor): " . $this->money($refundDisputeAmount));

        $reviewHold = Payment::whereIn('creator_id', [(string) $creator->id, $creator->uuid])
            ->where('status', 'review_hold')
            ->whereNull('payout_run_id')
            ->where('created_at', '<=', $cutoff)
            ->count();
        $this->line("Review hold payments (unpaid): {$reviewHold}");

        $netBeforeBalance = $netEarningsMinor - $totalReservesHeld - $refundDisputeAmount;
        $this->newLine();
        $this->line("Net before negative balance (minor): " . $this->money($netBeforeBalance));

        $negativeBalance = $negativeBefore;
        $negativeBalanceDelta = 0;
        $netPayout = 0;

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

        $isBelowThreshold = $netPayout > 0 && $netPayout < 100;
        if ($isBelowThreshold) {
            $netPayout = 0;
        }

        $negativeAfter = max(0, $negativeBalance + $negativeBalanceDelta);

        $this->line("Estimated payout (minor): " . $this->money($netPayout));
        $this->line("Negative balance (after): " . $this->money($negativeAfter));
        $this->line("Below minimum threshold (<£1): " . ($isBelowThreshold ? 'yes' : 'no'));

        return self::SUCCESS;
    }

    private function money(int $minor): string
    {
        $major = number_format(((float) $minor) / 100, 2, '.', '');
        return "£{$major}";
    }
}
