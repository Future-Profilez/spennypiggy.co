<?php

namespace App\Services\Risk;

use App\Helpers;
use App\Mail\PayoutInitiated;
use App\Models\BillPayment;
use App\Models\CreatorMetric;
use App\Models\Currency;
use App\Models\FinancialTransaction;
use App\Models\MembershipPayment;
use App\Models\Payment;
use App\Models\PayoutRecord;
use App\Models\PayoutRun;
use App\Models\PiggyPotContribution;
use App\Models\PlatformRiskState;
use App\Models\ShopPayment;
use App\Models\StripePaymentDetail;
use App\Models\StripePaymentItems;
use App\Models\TaskPurchase;
use App\Models\TipGoalsPayment;
use App\Models\User;
use App\StripeControl;
use App\Support\PayoutLock;
use Carbon\Carbon;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;

class PayoutService
{
    private const RESERVE_RELEASE_WINDOW_DAYS = 30;

    private const MINIMUM_PAYOUT_MINOR = 100; // £1.00 / $1.00 minimum threshold

    /**
     * Get all FinancialTransaction records for a Payment record by looking up source models.
     * Returns a collection of FTs.
     */
    public function getAllFinancialTransactionsForPayment(Payment $payment): Collection
    {
        $sourceModels = [
            TaskPurchase::class => 'stripe_session_id',
            ShopPayment::class => 'session_id',
            PiggyPotContribution::class => 'session_id',
            TipGoalsPayment::class => 'session_id',
            MembershipPayment::class => 'session_id',
            BillPayment::class => 'session_id',
            StripePaymentItems::class => 'stripe_session_id',
        ];

        foreach ($sourceModels as $modelClass => $sessionColumn) {
            $query = $modelClass::query();

            if ($modelClass === StripePaymentItems::class) {
                if (! $payment->stripe_session_id && ! $payment->stripe_payment_intent_id) {
                    continue;
                }
                $detailQuery = StripePaymentDetail::query();
                if ($payment->stripe_session_id) {
                    $detailQuery->orWhere('session_id', $payment->stripe_session_id);
                }
                if ($payment->stripe_payment_intent_id) {
                    $detailQuery->orWhere('session_id', $payment->stripe_payment_intent_id);
                }
                $detailIds = $detailQuery->pluck('id');
                if ($detailIds->isEmpty()) {
                    continue;
                }
                $query->whereIn('stripe_payment_detail_id', $detailIds);
            } else {
                $query->where(function ($q) use ($payment, $sessionColumn, $modelClass) {
                    // 1. Check by session ID
                    if ($payment->stripe_session_id) {
                        $q->orWhere($sessionColumn, $payment->stripe_session_id);
                    }

                    // 2. Check by payment intent ID
                    if ($payment->stripe_payment_intent_id) {
                        if (in_array($modelClass, [TaskPurchase::class, PiggyPotContribution::class])) {
                            $q->orWhere('payment_intent_id', $payment->stripe_payment_intent_id);
                        } elseif (in_array($modelClass, [MembershipPayment::class, BillPayment::class])) {
                            $q->orWhere('stripe_id', $payment->stripe_payment_intent_id);
                        } else {
                            $q->orWhere($sessionColumn, $payment->stripe_payment_intent_id);
                        }
                    }
                });
            }

            $items = $query->get(['id']);

            if ($items->isEmpty()) {
                continue;
            }

            $fts = FinancialTransaction::where('source_type', $modelClass)
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
     *
     * @param  array|null  $creatorUuids  Restrict the calculation to these creators. Each
     *                                    creator's figures are computed independently, so a
     *                                    scoped call returns byte-identical entries for the
     *                                    creators asked for — only `platform_total` and the
     *                                    other creators' entries are omitted. A creator's own
     *                                    dashboard passes their uuid instead of making the
     *                                    whole platform's payout run to read one row.
     */
    public function calculatePayouts($runDate = null, ?array $creatorUuids = null)
    {
        // Default to end of current day if no date passed, so "Expected Payout" includes today's full day.
        $runDate = $runDate ? Carbon::parse($runDate)->endOfDay() : Carbon::now()->endOfDay();

        $platformState = PlatformRiskState::latest('started_at')->first();
        $state = $platformState ? $platformState->state : 'NORMAL';

        $creators = Payment::query()
            ->select('payments.creator_id')
            ->join('users', 'users.uuid', '=', 'payments.creator_id')
            ->whereNull('users.payout_paused_at')
            ->when($creatorUuids !== null, fn ($q) => $q->whereIn('payments.creator_id', $creatorUuids))
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
            ->pluck('payments.creator_id');

        $payouts = [];
        $platformTotal = 0;

        $rates = Currency::rates();
        $convert = function ($amount, $from, $to = 'GBP') use ($rates) {
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

        // One lookup for the whole run instead of one per creator. The join above already
        // guarantees the user row exists, but the null-guard stays for safety.
        $creatorRecords = User::whereIn('uuid', $creators->all())->get()->keyBy('uuid');

        foreach ($creators as $creatorId) {
            $creator = $creatorRecords->get($creatorId);
            if (! $creator) {
                continue;
            }

            // Fetch Metrics
            try {
                $metrics = app(RiskService::class)->recalculateMetrics($creator->uuid);
            } catch (\Throwable) {
                $metrics = CreatorMetric::firstOrCreate(['creator_id' => $creator->uuid]);
            }

            $delayDays = 7;
            if (in_array($state, ['THROTTLE', 'FREEZE'], true)) {
                $delayDays = max($delayDays, (int) $metrics->payout_delay_days);
            }
            $cutoff = $runDate->copy()->subDays($delayDays);

            // Fetch Eligible Payments
            $payments = Payment::where('creator_id', $creator->uuid)
                ->where('status', 'succeeded')
                ->whereNull('payout_run_id')
                ->where('created_at', '<=', $cutoff)
                ->orderByDesc('created_at')
                ->get();

            $holdIntentIds = Payment::where('creator_id', $creator->uuid)
                ->whereNull('payout_run_id')
                ->whereIn('status', ['review_hold', 'disputed'])
                ->whereNotNull('stripe_payment_intent_id')
                ->pluck('stripe_payment_intent_id')
                ->toArray();
            if (! empty($holdIntentIds)) {
                $payments = $payments
                    ->reject(fn ($p) => $p->stripe_payment_intent_id && in_array($p->stripe_payment_intent_id, $holdIntentIds, true))
                    ->values();
            }

            $payments = $payments
                ->sortByDesc(function ($p) {
                    $score = 0;
                    if ($p->stripe_session_id) {
                        $score += 2;
                    }
                    if ($p->stripe_payment_intent_id) {
                        $score += 1;
                    }

                    return $score;
                })
                ->unique(fn ($p) => $p->stripe_payment_intent_id ?: $p->stripe_session_id ?: $p->id)
                ->values();

            $pendingDeliverablesMinor = 0;

            Log::info("Creator: {$creator->uuid}, Payments before filter: ".$payments->count());

            // Resolve the shop/task rows for this creator's whole payment set up front. These
            // used to be two queries per payment inside the filter below, so a creator with 200
            // eligible payments cost 400 round trips before a single amount was added up.
            $sessionIds = $payments->pluck('stripe_session_id')->filter()->unique()->values()->all();
            $intentIds = $payments->pluck('stripe_payment_intent_id')->filter()->unique()->values()->all();

            // Keyed by session_id only — matching the original lookup, which never matched a
            // shop payment on the intent id. orderBy('id') + first() keeps the same row an
            // unordered ->first() returned.
            $shopPaymentsBySession = empty($sessionIds)
                ? collect()
                : ShopPayment::with(['shop', 'deliverable'])
                    ->whereIn('session_id', $sessionIds)
                    ->orderBy('id')
                    ->get()
                    ->groupBy('session_id')
                    ->map
                    ->first();

            $taskPurchases = (empty($sessionIds) && empty($intentIds))
                ? collect()
                : TaskPurchase::with('task')
                    ->where(function ($q) use ($sessionIds, $intentIds) {
                        if (! empty($sessionIds)) {
                            $q->orWhereIn('stripe_session_id', $sessionIds);
                        }
                        if (! empty($intentIds)) {
                            $q->orWhereIn('payment_intent_id', $intentIds);
                        }
                    })
                    ->orderBy('id')
                    ->get();

            $taskPurchasesBySession = $taskPurchases->whereNotNull('stripe_session_id')
                ->groupBy('stripe_session_id')->map->first();
            $taskPurchasesByIntent = $taskPurchases->whereNotNull('payment_intent_id')
                ->groupBy('payment_intent_id')->map->first();

            // Filter out Physical Shop payments and Timed Tasks that are NOT yet completed
            $payments = $payments->filter(function ($p) use (&$pendingDeliverablesMinor, $shopPaymentsBySession, $taskPurchasesBySession, $taskPurchasesByIntent) {
                $sessionId = $p->stripe_session_id;
                $intentId = $p->stripe_payment_intent_id;

                if ($sessionId || $intentId) {
                    // 1. Shop Payments (Physical)
                    $shopPayment = $sessionId ? $shopPaymentsBySession->get($sessionId) : null;

                    if ($shopPayment && $shopPayment->shop && $shopPayment->shop->type === 'physical') {
                        // Shop Physical: ONLY include if status is 'delivered' (Completed)
                        if (! $shopPayment->deliverable || $shopPayment->deliverable->status !== 'delivered') {
                            $fts = $this->getAllFinancialTransactionsForPayment($p);
                            if ($fts->isNotEmpty()) {
                                $pendingDeliverablesMinor += (int) round($fts->sum('net_amount') * 100);
                            }

                            return false;
                        }
                    }

                    // 2. Paid Tasks (Timed)
                    $taskPurchase = ($sessionId ? $taskPurchasesBySession->get($sessionId) : null)
                        ?: ($intentId ? $taskPurchasesByIntent->get($intentId) : null);

                    if ($taskPurchase) {
                        $taskType = $taskPurchase->task->type ?? 'timed';
                        if ($taskType === 'timed') {
                            // Task Timed: ONLY include if status is completed/accepted/paid_out
                            if (! in_array($taskPurchase->status, ['completed', 'completed_accepted', 'paid_out'])) {
                                $fts = $this->getAllFinancialTransactionsForPayment($p);
                                if ($fts->isNotEmpty()) {
                                    $pendingDeliverablesMinor += (int) round($fts->sum('net_amount') * 100);
                                }

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
            $totalReservesHeld = 0;
            $eligiblePayments = collect();
            $eligibleFtIds = [];

            $creatorCurrency = strtolower((string) ($creator->default_currency ?? 'gbp'));

            foreach ($payments as $p) {
                // Only completed income rows are payable. getHeldReserves() and
                // getUpcomingPayoutPreview() both filter on this; without it here, an FT
                // flipped to refunded/disputed/review_hold whose parent Payment row was never
                // matched by the webhook is paid out in full.
                $fts = $this->getAllFinancialTransactionsForPayment($p)
                    ->where('type', 'income')
                    ->where('status', 'completed');

                if ($fts->isNotEmpty()) {
                    foreach ($fts as $ft) {
                        $ftCurrency = strtolower((string) ($ft->currency ?? 'gbp'));
                        $netAmt = (float) $ft->net_amount;
                        $resAmt = (float) $ft->reserve_amount;

                        $convertedNet = $convert($netAmt, $ftCurrency, $creatorCurrency);
                        $convertedRes = $convert($resAmt, $ftCurrency, $creatorCurrency);

                        // Minor units must respect zero-decimal currencies (JPY/KRW have no
                        // minor unit) — a blind ×100 submits a payout 100x too large to Stripe.
                        $netEarningsMinor += Helpers::toMinorUnits($convertedNet, $creatorCurrency);
                        $totalReservesHeld += Helpers::toMinorUnits($convertedRes, $creatorCurrency);
                        $eligibleFtIds[] = $ft->id;
                    }
                    $eligiblePayments->push($p);
                } else {
                    Log::warning("PayoutService: No FinancialTransactions found for payment {$p->id} ({$p->stripe_session_id}) — skipping from payout calculation.");
                }
            }

            $payments = $eligiblePayments;
            $grossAmount = (int) $payments->sum('amount');

            $adjustments = Payment::where('creator_id', $creator->uuid)
                ->whereIn('status', ['refunded', 'disputed'])
                ->whereNotNull('payout_run_id')
                ->whereNull('adjustment_payout_run_id')
                ->orderByDesc('created_at')
                ->get()
                ->unique(fn ($p) => $p->stripe_payment_intent_id ?: $p->stripe_session_id ?: $p->id)
                ->values();

            $reviewHold = Payment::where('creator_id', $creator->uuid)
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
                    foreach ($fts as $ft) {
                        $ftCurrency = strtolower((string) ($ft->currency ?? 'gbp'));
                        $netAmt = (float) $ft->net_amount;
                        $convertedNet = $convert($netAmt, $ftCurrency, $creatorCurrency);
                        $refundDisputeAmount += Helpers::toMinorUnits($convertedNet, $creatorCurrency);
                    }
                } else {
                    // Fallback to Payment amount if no FT exists (assumed already in GBP/creator currency)
                    $refundDisputeAmount += (int) $adj->amount;
                }
            }

            $reviewHoldAmount = (int) $reviewHold->sum('amount');

            // The net payout should be the Net Earnings minus any NEW reserves being held,
            // plus any OLD reserves being released.
            // Note: net_amount in FinancialTransaction is currently the price before reserve subtraction.

            // Reserve release is no longer coupled to the weekly run. Each transaction's
            // reserve is released 30 days after its OWN transaction_date by the dedicated
            // `reserve:release` command (per-transaction rolling window). Kept at 0 here so
            // the weekly run only pays out base earnings minus newly-held reserves.
            $reserveReleaseAmount = 0;
            $reserveReleaseSources = [];

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

            $isBelowThreshold = false;
            if ($netPayout > 0 && $netPayout < self::MINIMUM_PAYOUT_MINOR) {
                $isBelowThreshold = true;
                $netPayout = 0;
            }

            if ($payments->isEmpty() && $adjustments->isEmpty() && $reviewHold->isEmpty() && $negativeBalance === 0 && $reserveReleaseAmount === 0 && $pendingDeliverablesMinor === 0) {
                continue;
            }

            if ($payments->isNotEmpty()) {
                // Keep the creator's default currency as the payout currency
            }

            $payouts[$creator->uuid] = [
                'creator_name' => $creator->name,
                'currency' => strtoupper($creatorCurrency),
                'gross_amount' => $grossAmount,
                'net_earnings' => $netEarningsMinor,
                'pending_amount' => $pendingDeliverablesMinor,
                'refund_dispute_amount' => $refundDisputeAmount,
                'reserve_amount' => $totalReservesHeld, // This is what was held from the NEW payments
                'reserve_release_amount' => $reserveReleaseAmount,
                'reserve_release_sources' => $reserveReleaseSources,
                'review_hold_amount' => $reviewHoldAmount,
                'net_payout' => $netPayout,
                'is_below_threshold' => $isBelowThreshold,
                'payment_count' => $payments->count(),
                'payment_ids' => $payments->pluck('id')->toArray(),
                'financial_transaction_ids' => $eligibleFtIds,
                'adjustment_ids' => $adjustments->pluck('id')->toArray(),
                'reserve_held' => true, // Flag to track reserve holding
                'reserve_release_date' => $runDate->copy()->addDays(self::RESERVE_RELEASE_WINDOW_DAYS)->toDateString(),
                'negative_balance_before' => $negativeBalance,
                'negative_balance_delta' => $negativeBalanceDelta,
                'negative_balance_after' => max(0, $negativeBalance + $negativeBalanceDelta),
                'state' => $state,
                'cutoff_date' => $cutoff->toDateTimeString(),
            ];

            $platformTotal += Helpers::toMinorUnits(
                $convert(Helpers::toMajorUnits($netPayout, $creatorCurrency), $creatorCurrency, 'GBP'),
                'GBP'
            );
        }

        return [
            'run_date' => $runDate->toDateString(),
            'platform_total' => $platformTotal,
            'creator_count' => count($payouts),
            'payouts' => $payouts,
        ];
    }

    /**
     * Execute Payouts — triggers Stripe payouts to Creator's bank accounts.
     * All funds go directly to Creator Stripe Accounts (Direct Charges).
     * Review holds and disputes are simply excluded from the net payout calculation here.
     */
    public function executePayouts($previewData, $runId = null)
    {
        // A payout run must never overlap another one. The scheduler's withoutOverlapping()
        // only guards the cron against itself — an admin triggering a run from the panel (or
        // from the SEPARATE admin app, which shares this database) while the cron is mid-run
        // would produce two PayoutRun ids over the same still-unstamped payments, and therefore
        // two Stripe payouts with two different idempotency keys. PayoutLock is held in MySQL
        // precisely so it is visible to both applications.
        $lock = PayoutLock::acquire();

        if (! $lock) {
            throw new \RuntimeException('A payout run is already executing. Refusing to start a second one.');
        }

        try {
            return $this->runPayouts($previewData, $runId);
        } finally {
            PayoutLock::release($lock);
        }
    }

    /**
     * Execute the run. Only ever called from executePayouts(), which holds the run lock.
     */
    protected function runPayouts($previewData, $runId = null)
    {
        // The Stripe payout for each creator is an irreversible external side effect.
        // We therefore DO NOT wrap the whole run in one DB transaction (a late rollback
        // would un-mark payments whose money already left Stripe → duplicate payout next
        // run). Instead: the run row is committed up front, each creator's DB state is
        // committed in its own small transaction immediately after its Stripe payout
        // succeeds, and every payout carries an idempotency key so a network retry / re-run
        // can never create a duplicate.
        $run = DB::transaction(function () use ($previewData, $runId) {
            if ($runId) {
                $existing = PayoutRun::where('id', $runId)->lockForUpdate()->firstOrFail();
                $existing->update([
                    'run_date' => $previewData['run_date'],
                    'status' => 'executing',
                    'totals' => $previewData,
                ]);

                return $existing;
            }

            return PayoutRun::create([
                'run_date' => $previewData['run_date'],
                'status' => 'executing',
                'totals' => $previewData,
            ]);
        });

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
            $ftIds = $data['financial_transaction_ids'] ?? [];

            // Resolved once per creator: the zero-payout branch below also records a
            // PayoutRecord with a currency, and previously read a $currency that was only
            // ever assigned inside the $netPayout > 0 branch — so the first zero-payout
            // creator hit an undefined variable and every later one silently inherited the
            // previous creator's currency.
            $currency = strtolower((string) ($data['currency'] ?? 'gbp'));

            if ($netPayout > 0) {
                $creator = User::where('uuid', $creatorId)->first();

                // A previous run paid this creator via Stripe but could not stamp their
                // payments (see the paid_unmarked escalation below). Their payments are
                // therefore still eligible and would be paid a SECOND time. Refuse until
                // an operator reconciles.
                $unreconciled = PayoutRecord::where('creator_id', $creatorId)
                    ->where('status', 'paid_unmarked')
                    ->exists();

                if ($unreconciled) {
                    $reason = 'Awaiting manual reconciliation — a previous payout was sent but not recorded against these payments';
                    Log::critical("Payout: creator {$creatorId} {$reason} — skipping payout.");
                    $data['failure_reason'] = $reason;
                    $skippedPayouts[$creatorId] = $data;

                    continue;
                }

                if (! $creator || $creator->payout_paused_at) {
                    $reason = ! $creator
                        ? 'Creator not found'
                        : ('Payouts paused'.($creator->payout_pause_reason ? (': '.$creator->payout_pause_reason) : ''));
                    Log::warning("Payout: creator {$creatorId} {$reason} — skipping payout.");
                    $data['failure_reason'] = $reason;
                    $skippedPayouts[$creatorId] = $data;

                    continue;
                }

                if (! $creator->account_id) {
                    $reason = 'No connected Stripe account';
                    Log::warning("Payout: creator {$creatorId} {$reason} — skipping payout.");
                    $data['failure_reason'] = $reason;
                    $skippedPayouts[$creatorId] = $data;

                    continue;
                }

                // For Direct Charges, funds are already in the connected account.
                // We only need to trigger a payout from their Stripe balance to their bank account.

                // Payout currency MUST match the basis the amount was computed in. calculatePayouts
                // converts every eligible FT into the creator's default currency and returns
                // $netPayout in THAT currency (preview['currency'] === creatorCurrency). Using the
                // last payment's currency here would label a default-currency amount as a different
                // currency (e.g. £10 sent as "10 USD") — wrong money out. Always use the preview basis.
                $currency = strtolower((string) ($data['currency'] ?? $creator->default_currency ?? 'gbp'));

                try {
                    // Always trigger actual bank payout from connected account balance.
                    StripeControl::ensureManualPayoutSchedule($creator->account_id, $currency);

                    $payout = StripeControl::createPayout([
                        'amount' => (int) $netPayout,
                        'currency' => $currency,
                        'method' => 'standard',
                        // Deterministic key — a retry of THIS run for THIS creator returns the
                        // same Stripe payout instead of creating a second one.
                        'idempotency_key' => 'payout_run_'.$run->id.'_'.$creatorId,
                        'metadata' => [
                            'reason' => 'weekly_earnings_payout',
                            'payout_type' => 'weekly_run',
                            'payout_run_id' => (string) $run->id,
                            'run_date' => (string) ($run->run_date ?? ''),
                            'creator_id' => (string) $creatorId,
                            'creator_username' => (string) ($creator->username ?? ''),
                            'creator_email' => (string) ($creator->email ?? ''),
                            'payment_count' => (string) count($paymentIds),
                            'net_payout_minor' => (string) $netPayout,
                            'currency' => $currency,
                            'env' => (string) config('app.env'),
                        ],
                    ], $creator->account_id);

                    $data['stripe_payout_id'] = $payout->id;
                    Log::info("Payout created for creator {$creatorId}: {$netPayout} {$currency} — payout {$payout->id}");

                    // Commit this creator's DB state immediately. If anything later in the
                    // run fails, this commit stands — the money already moved.
                    //
                    // The money has ALREADY left Stripe at this point, so a failure here must
                    // never be treated as "payout failed, retry next run" — that is a double
                    // payout. Retry the write, and if it still will not commit, escalate to
                    // paid_unmarked so the next run refuses this creator (see the guard above).
                    $marked = false;
                    $markError = null;

                    for ($attempt = 1; $attempt <= 3 && ! $marked; $attempt++) {
                        try {
                            DB::transaction(function () use ($run, $creatorId, $netPayout, $currency, $payout, $paymentIds, $adjustmentIds, $ftIds, $data) {
                                PayoutRecord::updateOrCreate(
                                    ['stripe_payout_id' => $payout->id],
                                    [
                                        'creator_id' => $creatorId,
                                        'payout_run_id' => $run->id,
                                        'amount_minor' => (int) $netPayout,
                                        'currency' => $currency,
                                        'status' => 'in_transit',
                                        // Stripe may omit arrival_date. Carbon::createFromTimestamp(null)
                                        // raises a TypeError — an \Error, not an \Exception — which would
                                        // escape the per-creator catch and abort the whole run AFTER money
                                        // moved, leaving every remaining creator unpaid.
                                        'arrival_date' => isset($payout->arrival_date)
                                            ? Carbon::createFromTimestamp($payout->arrival_date)
                                            : null,
                                        'metadata' => [
                                            'stripe_payout' => $payout->toArray(),
                                        ],
                                    ]
                                );

                                if (! empty($paymentIds)) {
                                    Payment::whereIn('id', $paymentIds)->update(['payout_run_id' => $run->id]);
                                }
                                if (! empty($adjustmentIds)) {
                                    Payment::whereIn('id', $adjustmentIds)->update(['adjustment_payout_run_id' => $run->id]);
                                }
                                // Stamp the canonical ledger so the "paid out" badge and reserve logic
                                // can rely on the FinancialTransaction directly.
                                if (! empty($ftIds)) {
                                    FinancialTransaction::whereIn('id', $ftIds)->update(['payout_run_id' => $run->id]);
                                }
                                if (isset($data['negative_balance_after'])) {
                                    CreatorMetric::where('creator_id', $creatorId)->update([
                                        'negative_balance_minor' => (int) $data['negative_balance_after'],
                                        'updated_at' => now(),
                                    ]);
                                }
                            });

                            $marked = true;
                        } catch (\Throwable $markException) {
                            $markError = $markException->getMessage();
                            Log::error("Payout: marking attempt {$attempt} failed for creator {$creatorId} (payout {$payout->id}): ".$markError);
                            usleep(250000 * $attempt);
                        }
                    }

                    if (! $marked) {
                        Log::critical('Payout: money SENT but payments could not be marked — manual reconciliation required.', [
                            'creator_id' => $creatorId,
                            'payout_run_id' => $run->id,
                            'stripe_payout_id' => $payout->id,
                            'amount_minor' => (int) $netPayout,
                            'currency' => $currency,
                            'payment_ids' => $paymentIds,
                            'financial_transaction_ids' => $ftIds,
                            'error' => $markError,
                        ]);

                        try {
                            PayoutRecord::updateOrCreate(
                                ['stripe_payout_id' => $payout->id],
                                [
                                    'creator_id' => $creatorId,
                                    'payout_run_id' => $run->id,
                                    'amount_minor' => (int) $netPayout,
                                    'currency' => $currency,
                                    'status' => 'paid_unmarked',
                                    'failure_message' => 'Stripe payout succeeded but payments/ledger could not be stamped: '.$markError,
                                    'metadata' => [
                                        'stripe_payout' => $payout->toArray(),
                                        'payment_ids' => $paymentIds,
                                        'adjustment_ids' => $adjustmentIds,
                                        'financial_transaction_ids' => $ftIds,
                                    ],
                                ]
                            );
                        } catch (\Throwable $recordError) {
                            Log::critical('Payout: could not even record the paid_unmarked state: '.$recordError->getMessage());
                        }

                        $data['failure_reason'] = 'PAID but not recorded — manual reconciliation required';
                        $skippedPayouts[$creatorId] = $data;

                        continue;
                    }

                    $isZeroDecimal = Helpers::isZeroDecimalCurrency($currency);
                    $amountMajor = $isZeroDecimal ? (int) $netPayout : round($netPayout / 100, 2);
                    $currencySymbol = Helpers::getCurrency($currency);
                    Helpers::sendNotification(
                        '💰 Payout Sent',
                        "Your payout of {$currencySymbol}{$amountMajor} has been sent to your account.",
                        $creator->email
                    );

                    // Transactional email alongside the push — a creator should have a
                    // written record of money leaving the platform, with the amount,
                    // date and Stripe reference. Never blocks the payout itself.
                    try {
                        Mail::to($creator->email)->send(
                            new PayoutInitiated(
                                creator: $creator,
                                amount: (float) $amountMajor,
                                currency: $currency,
                                sentAt: now()->format('d M Y'),
                                destination: $creator->account_id ? 'Connected account '.$creator->account_id : null,
                                reference: $payout->id ?? null,
                            )
                        );
                    } catch (\Throwable $mailError) {
                        Log::error('PayoutService: failed to send payout-initiated email', [
                            'creator_id' => $creatorId,
                            'error' => $mailError->getMessage(),
                        ]);
                    }

                    // Success - add to actual totals
                    $actualPayouts[$creatorId] = $data;
                    $actualPlatformTotal += $netPayout;
                    $actualCreatorCount++;

                } catch (\Throwable $e) {
                    // \Throwable, not \Exception: a TypeError/ValueError from the Stripe payload
                    // would otherwise escape and abort the entire run mid-loop.
                    $errorMsg = $e->getMessage();
                    Log::error("Payout execution failed for creator {$creatorId}: ".$errorMsg);

                    // Record failed payout attempt for creator history. Payments are NOT marked,
                    // so they stay eligible and are retried automatically in the next run.
                    try {
                        PayoutRecord::create([
                            'creator_id' => $creatorId,
                            'payout_run_id' => $run->id,
                            'stripe_payout_id' => 'failed_'.uniqid(),
                            'amount_minor' => (int) $netPayout,
                            'currency' => $currency,
                            'status' => 'failed',
                            'failure_message' => $errorMsg,
                            'metadata' => [
                                'error' => $errorMsg,
                                'attempted_at' => now()->toDateTimeString(),
                            ],
                        ]);
                    } catch (\Exception $logEx) {
                        Log::error('Failed to record failed payout record: '.$logEx->getMessage());
                    }

                    $data['failure_reason'] = $errorMsg;
                    $skippedPayouts[$creatorId] = $data;

                    continue;
                }
            } elseif ($isBelowThreshold) {
                // Skip marking payments as processed if below threshold
                // They will be picked up in the next run
                Log::info("Payout skipped for creator {$creatorId}: Amount below threshold — will retry in next run.");
                $data['failure_reason'] = 'Below minimum threshold (£1.00)';
                $skippedPayouts[$creatorId] = $data;

                continue;
            } else {
                // Handle zero payout but mark IDs (e.g. only adjustments or holds processed)
                DB::transaction(function () use ($run, $creatorId, $paymentIds, $adjustmentIds, $ftIds, $data) {
                    if (! empty($paymentIds)) {
                        Payment::whereIn('id', $paymentIds)->update(['payout_run_id' => $run->id]);
                    }
                    if (! empty($adjustmentIds)) {
                        Payment::whereIn('id', $adjustmentIds)->update(['adjustment_payout_run_id' => $run->id]);
                    }
                    if (! empty($ftIds)) {
                        FinancialTransaction::whereIn('id', $ftIds)->update(['payout_run_id' => $run->id]);
                    }
                    if (isset($data['negative_balance_after'])) {
                        CreatorMetric::where('creator_id', $creatorId)->update([
                            'negative_balance_minor' => (int) $data['negative_balance_after'],
                            'updated_at' => now(),
                        ]);
                    }
                });

                // Record a zero-value payout entry so each run has a consistent
                // per-creator audit trail. No Stripe payout was issued here (only
                // adjustments/holds/negative-balance absorption ran), so no
                // payout.failed webhook will ever fire for it — this record gives
                // the run a handle for reconciliation without one.
                try {
                    PayoutRecord::create([
                        'creator_id' => $creatorId,
                        'payout_run_id' => $run->id,
                        'stripe_payout_id' => 'zero_'.uniqid(),
                        'amount_minor' => 0,
                        'currency' => $currency,
                        'status' => 'zero_payout',
                        'metadata' => [
                            'reason' => 'No net payout (adjustments/holds/negative-balance only)',
                            'processed_at' => now()->toDateTimeString(),
                        ],
                    ]);
                } catch (\Exception $logEx) {
                    Log::error("Failed to record zero payout record for creator {$creatorId}: ".$logEx->getMessage());
                }

                // Zero payout is still a processed creator
                $actualPayouts[$creatorId] = $data;
                $actualCreatorCount++;
            }
        }

        // Finalize run totals to reflect only what was actually processed.
        $previewData['payouts'] = $actualPayouts;
        $previewData['skipped_payouts'] = $skippedPayouts;
        $previewData['platform_total'] = $actualPlatformTotal;
        $previewData['creator_count'] = $actualCreatorCount;

        DB::transaction(function () use ($run, $previewData) {
            $fresh = PayoutRun::where('id', $run->id)->lockForUpdate()->firstOrFail();
            $fresh->totals = $previewData;
            $fresh->status = 'executed';
            $fresh->save();
        });

        return $run->refresh();
    }

    /**
     * Get held reserves for a creator.
     */
    public function getHeldReserves($creatorId, $targetCurrency = null)
    {
        $creator = User::where('uuid', $creatorId)->orWhere('id', $creatorId)->first();
        if (! $creator) {
            return [
                'total_held' => 0,
                'breakdown' => [],
                'currency' => strtoupper($targetCurrency ?: 'GBP'),
            ];
        }

        $rates = Currency::rates();
        // Convert into the requested display currency when given, otherwise the creator's default.
        // The UI labels these with the display currency, so they MUST be in that currency.
        $creatorCurrency = strtolower((string) ($targetCurrency ?: $creator->default_currency ?? 'gbp'));

        $convert = function ($amount, $from, $to = 'GBP') use ($rates) {
            $from = strtoupper($from ?: 'GBP');
            $to = strtoupper($to ?: 'GBP');
            if ($from === $to) {
                return $amount;
            }
            if (! isset($rates[$from]) || ! isset($rates[$to])) {
                return $amount;
            }
            $gbpAmount = $amount / $rates[$from];

            return $gbpAmount * $rates[$to];
        };

        $held = [];
        $totalHeld = 0;

        // FinancialTransaction is the single source of truth for held reserves.
        // A reserve stays held until 30 days after its OWN transaction_date — regardless of
        // whether the base earning has already been paid out (payout_run_id set) — and is then
        // released by the `reserve:release` command which flips reserve_status to 'released'.
        // EXCLUDE: review_hold, disputed, refunded; and unfulfilled physical shop / timed tasks.
        $pendingFts = FinancialTransaction::where('user_id', $creator->id)
            ->where('type', 'income')
            ->where('status', 'completed')
            ->where(function ($q) {
                $q->where('reserve_status', '!=', 'released')
                    ->orWhereNull('reserve_status');
            })
            ->where('reserve_amount', '>', 0)
            ->with(['supporter:id,name,username', 'source' => function ($morphTo) {
                $morphTo->morphWith([
                    TaskPurchase::class => ['task'],
                    ShopPayment::class => ['shop', 'deliverable'],
                ]);
            }])
            ->orderByDesc('transaction_date')
            ->orderByDesc('id')
            ->get();

        foreach ($pendingFts as $ft) {
            // Check fulfillment status for Shop and Task
            if ($ft->source_type === TaskPurchase::class && $ft->source) {
                $taskType = $ft->source->task->type ?? 'timed';
                if ($taskType === 'timed' && ! in_array($ft->source->status, ['completed', 'completed_accepted', 'paid_out'])) {
                    continue; // Skip reserve calculation for unfulfilled timed tasks
                }
            }
            if ($ft->source_type === ShopPayment::class && $ft->source && $ft->source->shop) {
                if ($ft->source->shop->type === 'physical') {
                    if (! $ft->source->deliverable || $ft->source->deliverable->status !== 'delivered') {
                        continue; // Skip reserve calculation for unfulfilled physical shop items
                    }
                }
            }

            $reserveMajor = (float) ($ft->reserve_amount ?? 0);
            if ($reserveMajor <= 0) {
                continue;
            }

            $reserveMinor = (int) round($reserveMajor * 100);
            $currency = strtoupper((string) ($ft->currency ?: 'GBP'));
            $convertedMajor = $convert($reserveMajor, $currency, $creatorCurrency);
            $txDate = $ft->transaction_date ? Carbon::parse($ft->transaction_date) : Carbon::now();
            $releaseAt = $txDate->copy()->addDays(self::RESERVE_RELEASE_WINDOW_DAYS);

            $base = class_basename((string) ($ft->source_type ?? ''));
            $label = match ($base) {
                'StripePaymentItems' => 'Wish Content',
                'ShopPayment' => 'Shop Purchase',
                'TipGoalsPayment' => 'Content Unlock',
                'MembershipPayment' => 'Membership',
                'PiggyPotContribution' => 'Piggy Pot',
                'TaskPurchase' => 'Task',
                'BillPayment' => 'Bill',
                default => $base ? str_replace(['Payment', 'Purchase'], '', $base) : null
            };

            $netAmount = (float) ($ft->net_amount ?? 0);
            $reservePercent = $netAmount > 0 ? round(($reserveMajor / $netAmount) * 100, 1) : 0;

            $held[] = [
                'source_type' => 'transaction',
                'payout_run_id' => 'Pending',
                'amount' => $reserveMinor,
                'currency' => $currency,
                'amount_converted' => $convertedMajor,
                'run_date' => 'Pending',
                'release_date' => $releaseAt->toDateString(),
                'days_remaining' => max(0, Carbon::now()->diffInDays($releaseAt, false)),
                'source_name' => (string) ($ft->description ?: 'Pending Payment'),
                'financial_transaction_id' => $ft->id,
                'financial_transaction_uuid' => $ft->uuid ?? null,
                'transaction_date' => $txDate->toIso8601String(),
                'supporter' => $ft->supporter ? [
                    'id' => $ft->supporter->id,
                    'name' => $ft->supporter->name,
                    'username' => $ft->supporter->username,
                ] : null,
                'status' => $ft->status,
                'type' => $ft->type,
                'gross_amount' => (float) ($ft->gross_amount ?? 0),
                'net_amount' => $netAmount,
                'reserve_amount' => $reserveMajor,
                'reserve_status' => $ft->reserve_status,
                'reserve_percent' => $reservePercent,
                'label' => $label,
            ];
            $totalHeld += $convertedMajor;
        }

        // Sort by release date (soonest first)
        usort($held, function ($a, $b) {
            return strtotime($a['release_date']) - strtotime($b['release_date']);
        });

        return [
            'total_held' => $totalHeld,
            'breakdown' => $held,
            'currency' => strtoupper($creatorCurrency),
        ];
    }

    /**
     * Reserves that have already been released (paid back to the creator) — the settled
     * history. Mirrors getHeldReserves but for reserve_status = 'released', newest first.
     *
     * `verified` flags whether the release is backed by a real Stripe payout
     * (reserve_payout_id set). A released row with no reserve_payout_id is a legacy/data-gap
     * release (flipped without a standalone payout) — surfaced so the creator is not told the
     * money landed when it may not have.
     */
    public function getReleasedReserves($creatorId, int $limit = 100, $targetCurrency = null)
    {
        $creator = User::where('uuid', $creatorId)->orWhere('id', $creatorId)->first();
        if (! $creator) {
            return ['total_released' => 0, 'breakdown' => [], 'currency' => strtoupper($targetCurrency ?: 'GBP')];
        }

        $rates = Currency::rates();
        // Display currency when provided (UI labels with it), otherwise creator default.
        $creatorCurrency = strtolower((string) ($targetCurrency ?: $creator->default_currency ?? 'gbp'));

        $convert = function ($amount, $from, $to) use ($rates) {
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

        $releasedFts = FinancialTransaction::where('user_id', $creator->id)
            ->where('type', 'income')
            ->where('reserve_status', 'released')
            ->where('reserve_amount', '>', 0)
            ->with(['supporter:id,name,username'])
            ->orderByDesc('reserve_released_at')
            ->orderByDesc('id')
            ->limit($limit)
            ->get();

        $released = [];
        $totalReleased = 0;

        foreach ($releasedFts as $ft) {
            $reserveMajor = (float) ($ft->reserve_amount ?? 0);
            if ($reserveMajor <= 0) {
                continue;
            }

            $currency = strtoupper((string) ($ft->currency ?: 'GBP'));
            $convertedMajor = $convert($reserveMajor, $currency, strtoupper($creatorCurrency));
            $txDate = $ft->transaction_date ? Carbon::parse($ft->transaction_date) : null;
            $releasedAt = $ft->reserve_released_at ? Carbon::parse($ft->reserve_released_at) : null;

            $base = class_basename((string) ($ft->source_type ?? ''));
            $label = match ($base) {
                'StripePaymentItems' => 'Wish Content',
                'ShopPayment' => 'Shop Purchase',
                'TipGoalsPayment' => 'Content Unlock',
                'MembershipPayment' => 'Membership',
                'PiggyPotContribution' => 'Piggy Pot',
                'TaskPurchase' => 'Task',
                'BillPayment' => 'Bill',
                default => $base ? str_replace(['Payment', 'Purchase'], '', $base) : null
            };

            $released[] = [
                'source_type' => 'transaction',
                'amount' => (int) round($reserveMajor * 100),
                'currency' => $currency,
                'amount_converted' => $convertedMajor,
                'reserve_amount' => $reserveMajor,
                'reserve_status' => 'released',
                'released_at' => $releasedAt ? $releasedAt->toIso8601String() : null,
                'released_date' => $releasedAt ? $releasedAt->toDateString() : null,
                'reserve_payout_id' => $ft->reserve_payout_id,
                'verified' => ! empty($ft->reserve_payout_id),
                'transaction_date' => $txDate ? $txDate->toIso8601String() : null,
                'source_name' => (string) ($ft->description ?: 'Payment'),
                'financial_transaction_id' => $ft->id,
                'supporter' => $ft->supporter ? [
                    'id' => $ft->supporter->id,
                    'name' => $ft->supporter->name,
                    'username' => $ft->supporter->username,
                ] : null,
                'net_amount' => (float) ($ft->net_amount ?? 0),
                'label' => $label,
            ];
            $totalReleased += $convertedMajor;
        }

        return [
            'total_released' => $totalReleased,
            'breakdown' => $released,
            'currency' => strtoupper($creatorCurrency),
        ];
    }

    /**
     * Creator-facing preview of the NEXT weekly payout: which income transactions are eligible
     * for the upcoming Friday run, their net total, and the reserve held on them. FT-based and
     * self-contained — mirrors the same eligibility gate as CreatorFinancialController::
     * applyPayoutBadges ('this_week'): income, completed, not yet paid out, past the 7-day hold,
     * and fulfilled (same physical-shop / timed-task gate used by getHeldReserves).
     *
     * This is a lightweight estimate for display, NOT the authoritative run — that is
     * calculatePayouts(), which is platform-wide and recomputes risk. Amounts are converted to
     * the creator's default currency.
     */
    public function getUpcomingPayoutPreview($creatorId, $targetCurrency = null)
    {
        $creator = User::where('uuid', $creatorId)->orWhere('id', $creatorId)->first();
        if (! $creator) {
            return ['total_net' => 0, 'total_reserve' => 0, 'count' => 0, 'transactions' => [], 'currency' => strtoupper($targetCurrency ?: 'GBP')];
        }

        $rates = Currency::rates();
        // Display currency when provided (UI labels with it), otherwise creator default.
        $creatorCurrency = strtoupper((string) ($targetCurrency ?: $creator->default_currency ?? 'gbp'));
        $convert = function ($amount, $from, $to) use ($rates) {
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

        $cutoff = Carbon::now()->subDays(7);

        $fts = FinancialTransaction::where('user_id', $creator->id)
            ->where('type', 'income')
            ->where('status', 'completed')
            ->whereNull('payout_run_id')
            ->whereNotNull('transaction_date')
            ->where('transaction_date', '<=', $cutoff)
            ->with(['supporter:id,name,username', 'source' => function ($morphTo) {
                $morphTo->morphWith([
                    TaskPurchase::class => ['task'],
                    ShopPayment::class => ['shop', 'deliverable'],
                ]);
            }])
            ->orderByDesc('transaction_date')
            ->orderByDesc('id')
            ->get();

        $transactions = [];
        $totalNet = 0;
        $totalReserve = 0;

        foreach ($fts as $ft) {
            // Same fulfillment gate as getHeldReserves: unfulfilled physical shop / timed tasks
            // are not yet payable.
            if ($ft->source_type === TaskPurchase::class && $ft->source) {
                $taskType = $ft->source->task->type ?? 'timed';
                if ($taskType === 'timed' && ! in_array($ft->source->status, ['completed', 'completed_accepted', 'paid_out'])) {
                    continue;
                }
            }
            if ($ft->source_type === ShopPayment::class && $ft->source && $ft->source->shop) {
                if ($ft->source->shop->type === 'physical') {
                    if (! $ft->source->deliverable || $ft->source->deliverable->status !== 'delivered') {
                        continue;
                    }
                }
            }

            $currency = strtoupper((string) ($ft->currency ?: 'GBP'));
            $net = (float) ($ft->net_amount ?? 0);
            $reserve = (float) ($ft->reserve_amount ?? 0);
            // Reserve is held back 30 days post-transaction — it is NOT part of this Friday's
            // payout. We surface it for context, but the payable figure excludes it.
            $reserveStillHeld = ($ft->reserve_status ?? null) !== 'released' ? $reserve : 0.0;
            $netConverted = $convert($net, $currency, $creatorCurrency);
            $reserveConverted = $convert($reserveStillHeld, $currency, $creatorCurrency);
            $payableConverted = max(0, $netConverted - $reserveConverted);

            $base = class_basename((string) ($ft->source_type ?? ''));
            $label = match ($base) {
                'StripePaymentItems' => 'Wish Content',
                'ShopPayment' => 'Shop Purchase',
                'TipGoalsPayment' => 'Content Unlock',
                'MembershipPayment' => 'Membership',
                'PiggyPotContribution' => 'Piggy Pot',
                'TaskPurchase' => 'Task',
                'BillPayment' => 'Bill',
                default => $base ? str_replace(['Payment', 'Purchase'], '', $base) : null
            };

            $transactions[] = [
                'financial_transaction_id' => $ft->id,
                'transaction_date' => Carbon::parse($ft->transaction_date)->toIso8601String(),
                'description' => (string) ($ft->description ?: 'Payment'),
                'label' => $label,
                'currency' => $currency,
                'net_amount' => $net,
                'net_converted' => $netConverted,
                'reserve_amount' => $reserveStillHeld,
                'reserve_converted' => $reserveConverted,
                'payable_converted' => $payableConverted,
                'supporter' => $ft->supporter ? [
                    'id' => $ft->supporter->id,
                    'name' => $ft->supporter->name,
                    'username' => $ft->supporter->username,
                ] : null,
            ];
            $totalNet += $payableConverted;
            $totalReserve += $reserveConverted;
        }

        return [
            'total_net' => $totalNet,       // payable this Friday (reserve already excluded)
            'total_reserve' => $totalReserve, // reserve held back on these txns (released later)
            'count' => count($transactions),
            'transactions' => $transactions,
            'currency' => $creatorCurrency,
        ];
    }
}
