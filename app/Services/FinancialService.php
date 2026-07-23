<?php

namespace App\Services;

use App\Helpers;
use App\Models\CreatorExpense;
use App\Models\CreatorFinancialProfile;
use App\Models\Currency;
use App\Models\Deliverable;
use App\Models\FinancialTransaction;
use App\Models\Payment;
use App\Models\ShopPayment;
use App\Models\UkTaxSetting;
use App\Models\User;
use App\Services\Risk\PayoutService;
use Carbon\Carbon;

class FinancialService
{
    /**
     * Get the start and end dates for a UK tax year.
     * The tax year is identified by the starting year. e.g., Tax Year 2025-2026 starts 6 April 2025.
     */
    public function getTaxYearDates($year = null)
    {
        $year = $year ?? $this->getCurrentTaxYear();

        $start = Carbon::createFromDate($year, 4, 6)->startOfDay();
        $end = Carbon::createFromDate($year + 1, 4, 5)->endOfDay();

        return ['start' => $start, 'end' => $end, 'label' => "{$year}-".($year + 1)];
    }

    public function getCurrentTaxYear()
    {
        $now = Carbon::now();
        if ($now->month < 4 || ($now->month == 4 && $now->day < 6)) {
            return $now->year - 1;
        }

        return $now->year;
    }

    public function getSummary(User $user, $startDate, $endDate, $displayCurrency = null)
    {
        $displayCurrency = strtoupper($displayCurrency ?: ($user->default_currency ?? 'GBP'));

        $incomeTx = FinancialTransaction::where('user_id', $user->id)
            ->where('type', 'income')
            ->where('status', 'completed')
            ->whereBetween('transaction_date', [$startDate, $endDate])
            // morphWith so the shop branch below reads an already-loaded shop instead of
            // firing a query per shop row.
            ->with(['source' => function ($morph) {
                $morph->morphWith([
                    ShopPayment::class => ['shop'],
                ]);
            }])
            ->get(['gross_amount', 'net_amount', 'platform_fee', 'stripe_fee', 'vat_amount', 'currency', 'status', 'reserve_amount', 'reserve_status', 'source_type', 'source_id']);

        // Fetch Reserves and Review Holds from PayoutService
        $payoutService = app(PayoutService::class);
        // Ask for the display currency explicitly. getHeldReserves() returns its total in the
        // currency requested (creator default when omitted), NOT GBP — treating it as GBP and
        // re-converting inflated a non-GBP creator's held reserve by the exchange rate.
        $reserves = $payoutService->getHeldReserves($user->uuid, $displayCurrency);
        $reservesGbpData = $displayCurrency === 'GBP'
            ? $reserves
            : $payoutService->getHeldReserves($user->uuid, 'GBP');
        $heldReservesGbp = (float) ($reservesGbpData['total_held'] ?? 0);

        // getHeldReserves returns totals in major units (display currency)
        // Note: includes both executed payout-run reserves and pending (unreleased) reserves.
        $heldReservesAmount = (float) ($reserves['total_held'] ?? 0);

        // Review Holds and Disputed payments
        $reviewHoldsAmount = Payment::where('creator_id', $user->uuid)
            ->where('status', 'review_hold')
            ->sum('amount');

        $disputesAmount = Payment::where('creator_id', $user->uuid)
            ->where('status', 'disputed')
            ->sum('amount');

        $grossDisplay = 0;
        $feesDisplay = 0;
        $vatDisplay = 0;
        $netDisplay = 0;

        $grossGbp = 0;
        $feesGbp = 0;
        $vatGbp = 0;
        $netGbp = 0;
        $reservesHeldGbp = 0;

        $expensesCollection = CreatorExpense::where('user_id', $user->id)
            ->whereBetween('expense_date', [$startDate, $endDate])
            ->get(['amount', 'currency']);

        $allCurrencies = $incomeTx
            ->pluck('currency')
            ->merge($expensesCollection->pluck('currency'))
            ->push($displayCurrency)
            ->push('GBP')
            ->filter()
            ->map(fn ($c) => strtoupper($c))
            ->unique()
            ->values();

        $currencyMeta = Currency::whereIn('ISO', $allCurrencies)
            ->get(['ISO', 'conversion_rate', 'ISOdigits'])
            ->keyBy('ISO');

        if (! isset($currencyMeta[$displayCurrency]) || (float) ($currencyMeta[$displayCurrency]->conversion_rate ?? 0) <= 0) {
            $displayCurrency = 'GBP';
        }

        $convert = function (string $from, float $amount, string $to) use ($currencyMeta) {
            $from = strtoupper($from ?: 'GBP');
            $to = strtoupper($to ?: 'GBP');

            if ($from === $to) {
                return $amount;
            }

            if (! isset($currencyMeta[$from]) || ! isset($currencyMeta[$to])) {
                return null;
            }

            $fromRate = (float) ($currencyMeta[$from]->conversion_rate ?? 0);
            $toRate = (float) ($currencyMeta[$to]->conversion_rate ?? 0);
            if ($fromRate <= 0 || $toRate <= 0) {
                return null;
            }

            $gbp = $amount / $fromRate;
            $converted = $gbp * $toRate;
            $decimalPlaces = (int) ($currencyMeta[$to]->ISOdigits ?? 2);

            return round($converted, $decimalPlaces, PHP_ROUND_HALF_UP);
        };

        $netDisplay = 0;
        $reservesHeldDisplay = 0;

        // Collect Shop IDs to fetch shipping amounts
        $shopPaymentIds = $incomeTx->where('source_type', 'App\Models\ShopPayment')->pluck('source_id')->toArray();
        $shopShippingAmounts = [];
        if (! empty($shopPaymentIds)) {
            $shopShippingAmounts = ShopPayment::whereIn('id', $shopPaymentIds)
                ->pluck('shipping_amount', 'id')
                ->toArray();
        }

        // Deliverable status per shop session, resolved in one query instead of one per
        // physical-shop transaction inside the loop below.
        $shopSessionIds = $incomeTx->where('source_type', 'App\Models\ShopPayment')
            ->pluck('source.session_id')
            ->filter()
            ->unique()
            ->values()
            ->all();

        $deliverableStatusBySession = empty($shopSessionIds)
            ? []
            : Deliverable::whereIn('session_id', $shopSessionIds)
                ->orderBy('id')
                ->get(['session_id', 'status'])
                ->groupBy('session_id')
                ->map(fn ($rows) => $rows->first()->status)
                ->all();

        foreach ($incomeTx as $tx) {
            // Task Completion Logic: Only count toward Gross/Net if completed
            if ($tx->source_type === 'App\Models\TaskPurchase' && isset($tx->source->status)) {
                if (! in_array($tx->source->status, ['completed', 'completed_accepted', 'paid_out'])) {
                    continue;
                }
            }

            // Shop Completion Logic: Only count toward Gross/Net if delivered (for physical items)
            if ($tx->source_type === 'App\Models\ShopPayment' && isset($tx->source->shop)) {
                if ($tx->source->shop->type === 'physical') {
                    $status = $deliverableStatusBySession[$tx->source->session_id] ?? null;
                    if ($status !== 'delivered') {
                        continue;
                    }
                }
            }

            $from = strtoupper($tx->currency ?? 'GBP');
            $net = (float) ($tx->net_amount ?? 0);
            $vat = (float) ($tx->vat_amount ?? 0);
            $reserve = (float) ($tx->reserve_amount ?? 0);

            // Creator's Gross = Net (Price + Shipping) + VAT
            // Note: net_amount for Shop already includes shipping_amount
            $gross = $net + $vat;

            $fees = (float) (($tx->platform_fee ?? 0) + ($tx->stripe_fee ?? 0));

            $grossDisplay += $from === $displayCurrency ? $gross : ($convert($from, $gross, $displayCurrency) ?? $gross);
            $feesDisplay += $from === $displayCurrency ? $fees : ($convert($from, $fees, $displayCurrency) ?? $fees);
            $vatDisplay += $from === $displayCurrency ? $vat : ($convert($from, $vat, $displayCurrency) ?? $vat);

            // Net for Profit calculation
            $netDisplay += $from === $displayCurrency ? $net : ($convert($from, $net, $displayCurrency) ?? $net);

            if ($tx->reserve_status === 'held') {
                $reservesHeldDisplay += $from === $displayCurrency ? $reserve : ($convert($from, $reserve, $displayCurrency) ?? $reserve);
                $reservesHeldGbp += $from === 'GBP' ? $reserve : ($convert($from, $reserve, 'GBP') ?? $reserve);
            }

            $grossGbp += $from === 'GBP' ? $gross : ($convert($from, $gross, 'GBP') ?? $gross);
            $feesGbp += $from === 'GBP' ? $fees : ($convert($from, $fees, 'GBP') ?? $fees);
            $vatGbp += $from === 'GBP' ? $vat : ($convert($from, $vat, 'GBP') ?? $vat);
            $netGbp += $from === 'GBP' ? $net : ($convert($from, $net, 'GBP') ?? $net);
        }

        $expensesDisplay = 0;
        $expensesGbp = 0;
        foreach ($expensesCollection as $expense) {
            $from = strtoupper($expense->currency ?? 'GBP');
            $amount = (float) ($expense->amount ?? 0);
            $expensesDisplay += $from === $displayCurrency ? $amount : ($convert($from, $amount, $displayCurrency) ?? $amount);
            $expensesGbp += $from === 'GBP' ? $amount : ($convert($from, $amount, 'GBP') ?? $amount);
        }

        // Already in display currency — do NOT re-convert.
        $heldReservesDisplay = $heldReservesAmount;
        $reviewHoldsDisplay = $convert('GBP', $reviewHoldsAmount / 100, $displayCurrency) ?? ($reviewHoldsAmount / 100);
        $disputesDisplay = $convert('GBP', $disputesAmount / 100, $displayCurrency) ?? ($disputesAmount / 100);

        // Calculate Expected Next Payout using PayoutService directly.
        // Scoped to this creator: the platform-wide call walked every creator on the
        // platform to read a single entry, and each creator's figures are independent.
        $payoutData = $payoutService->calculatePayouts(null, [$user->uuid]);
        $payoutInfo = $payoutData['payouts'][$user->uuid] ?? null;
        $netPayoutMinor = $payoutInfo['net_payout'] ?? 0;
        $netPayoutMajor = $netPayoutMinor / 100;

        // Use user's default currency directly for payoutable calculation
        $payoutCurrency = strtoupper($payoutInfo['currency'] ?? $user->default_currency ?? 'GBP');

        // Payoutable display should just format the major amount based on the payout currency (since the payout engine computes in the creator's currency)
        $payoutableDisplay = $payoutCurrency === $displayCurrency ? $netPayoutMajor : ($convert($payoutCurrency, $netPayoutMajor, $displayCurrency) ?? $netPayoutMajor);

        $pendingAmountMinor = $payoutInfo['pending_amount'] ?? 0;
        $pendingAmountMajor = $pendingAmountMinor / 100;
        $pendingDisplay = $payoutCurrency === $displayCurrency ? $pendingAmountMajor : ($convert($payoutCurrency, $pendingAmountMajor, $displayCurrency) ?? $pendingAmountMajor);

        $clearingDisplay = 0;
        $clearingGbp = 0;
        try {
            $runDate = Carbon::now()->endOfDay();
            $cutoff = $runDate->copy()->subDays(7);

            $unclearedPayments = Payment::where('creator_id', $user->uuid)
                ->where('status', 'succeeded')
                ->whereNull('payout_run_id')
                ->where('created_at', '>', $cutoff)
                ->orderByDesc('created_at')
                ->get();

            $holdIntentIds = Payment::where('creator_id', $user->uuid)
                ->whereNull('payout_run_id')
                ->whereIn('status', ['review_hold', 'disputed'])
                ->whereNotNull('stripe_payment_intent_id')
                ->pluck('stripe_payment_intent_id')
                ->toArray();
            if (! empty($holdIntentIds)) {
                $unclearedPayments = $unclearedPayments
                    ->reject(fn ($p) => $p->stripe_payment_intent_id && in_array($p->stripe_payment_intent_id, $holdIntentIds, true))
                    ->values();
            }

            $unclearedPayments = $unclearedPayments
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

            foreach ($unclearedPayments as $p) {
                $fts = $payoutService->getAllFinancialTransactionsForPayment($p);
                foreach ($fts as $ft) {
                    $from = strtoupper($ft->currency ?? 'GBP');
                    $net = (float) ($ft->net_amount ?? 0);
                    $clearingDisplay += $from === $displayCurrency ? $net : Helpers::priceFormat($from, $net, $displayCurrency);
                    $clearingGbp += $from === 'GBP' ? $net : Helpers::priceFormat($from, $net, 'GBP');
                }
            }
        } catch (\Throwable) {
        }

        $payoutPreview = null;
        if ($payoutInfo) {
            $netEarningsMajor = ((int) ($payoutInfo['net_earnings'] ?? 0)) / 100;
            $reserveHeldMajor = ((int) ($payoutInfo['reserve_amount'] ?? 0)) / 100;
            $reserveReleaseMajor = ((int) ($payoutInfo['reserve_release_amount'] ?? 0)) / 100;
            $refundDisputeMajor = ((int) ($payoutInfo['refund_dispute_amount'] ?? 0)) / 100;
            $reviewHoldMajor = ((int) ($payoutInfo['review_hold_amount'] ?? 0)) / 100;
            $negativeBeforeMajor = ((int) ($payoutInfo['negative_balance_before'] ?? 0)) / 100;
            $negativeAfterMajor = ((int) ($payoutInfo['negative_balance_after'] ?? 0)) / 100;

            $payoutPreview = [
                'run_date' => $payoutData['run_date'] ?? null,
                'state' => $payoutInfo['state'] ?? null,
                'cutoff_date' => $payoutInfo['cutoff_date'] ?? null,
                'payment_count' => (int) ($payoutInfo['payment_count'] ?? 0),
                'is_below_threshold' => (bool) ($payoutInfo['is_below_threshold'] ?? false),

                'net_earnings' => $payoutCurrency === $displayCurrency ? $netEarningsMajor : ($convert($payoutCurrency, $netEarningsMajor, $displayCurrency) ?? $netEarningsMajor),
                'reserve_held' => $payoutCurrency === $displayCurrency ? $reserveHeldMajor : ($convert($payoutCurrency, $reserveHeldMajor, $displayCurrency) ?? $reserveHeldMajor),
                'reserve_released' => $payoutCurrency === $displayCurrency ? $reserveReleaseMajor : ($convert($payoutCurrency, $reserveReleaseMajor, $displayCurrency) ?? $reserveReleaseMajor),
                'refund_disputes' => $payoutCurrency === $displayCurrency ? $refundDisputeMajor : ($convert($payoutCurrency, $refundDisputeMajor, $displayCurrency) ?? $refundDisputeMajor),
                'review_holds' => $payoutCurrency === $displayCurrency ? $reviewHoldMajor : ($convert($payoutCurrency, $reviewHoldMajor, $displayCurrency) ?? $reviewHoldMajor),
                'pending' => $pendingDisplay,
                'negative_balance_before' => $payoutCurrency === $displayCurrency ? $negativeBeforeMajor : ($convert($payoutCurrency, $negativeBeforeMajor, $displayCurrency) ?? $negativeBeforeMajor),
                'negative_balance_after' => $payoutCurrency === $displayCurrency ? $negativeAfterMajor : ($convert($payoutCurrency, $negativeAfterMajor, $displayCurrency) ?? $negativeAfterMajor),

                'net_payout' => $payoutableDisplay,
            ];
        }

        // Calculate if there's a difference between current tax year earnings and total payoutable balance
        // The payoutable balance includes EVERYTHING. If it's higher than the current period's payoutable net (Net - Reserves),
        // it means there's carry-over from previous periods.
        $currentPeriodPayoutable = $netDisplay - $reservesHeldDisplay;
        $carryOverDisplay = 0;
        if ($payoutableDisplay > $currentPeriodPayoutable) {
            $carryOverDisplay = $payoutableDisplay - $currentPeriodPayoutable;
        }

        return [
            'currency' => $displayCurrency,
            'gross_income' => $grossDisplay,
            'fees' => $feesDisplay,
            'vat_collected' => $vatDisplay,
            'net_income' => $netDisplay,
            'expenses' => $expensesDisplay,
            'profit' => $netDisplay - $expensesDisplay,
            'held_reserves' => $heldReservesDisplay,
            'review_holds' => $reviewHoldsDisplay,
            'disputes' => $disputesDisplay,
            'payoutable_balance' => $payoutableDisplay,
            'pending_balance' => $pendingDisplay,
            'clearing_balance' => $clearingDisplay,
            'carry_over_amount' => $carryOverDisplay,
            'has_adjustment' => ($payoutInfo['refund_dispute_amount'] ?? 0) > 0,
            'payout_preview' => $payoutPreview,

            'gross_income_gbp' => $grossGbp,
            'fees_gbp' => $feesGbp,
            'vat_collected_gbp' => $vatGbp,
            'net_income_gbp' => $netGbp,
            'expenses_gbp' => $expensesGbp,
            'profit_gbp' => $netGbp - $expensesGbp,
            'held_reserves_gbp' => $heldReservesGbp,
            'pending_balance_gbp' => $pendingAmountMajor,
            'clearing_balance_gbp' => $clearingGbp,
            'review_holds_gbp' => $reviewHoldsAmount / 100,
            'disputes_gbp' => $disputesAmount / 100,
        ];
    }

    public function calculateEstimatedTax($profit)
    {
        $taxYearStart = $this->getCurrentTaxYear();
        $settings = UkTaxSetting::where('tax_year_start', $taxYearStart)->first()
            ?: UkTaxSetting::orderByDesc('tax_year_start')->first();

        $personalAllowance = (float) ($settings->personal_allowance ?? 12570);
        $basicRateLimit = (float) ($settings->basic_rate_limit ?? 50270);
        $higherRateLimit = (float) ($settings->higher_rate_limit ?? 125140);
        $basicRate = (float) ($settings->basic_rate ?? 0.20);
        $higherRate = (float) ($settings->higher_rate ?? 0.40);
        $additionalRate = (float) ($settings->additional_rate ?? 0.45);

        $tax = 0;

        if ($profit <= $personalAllowance) {
            return 0;
        }

        // Calculate taxable amount above allowance
        $taxable = $profit - $personalAllowance;

        // Basic Rate
        $basicBand = $basicRateLimit - $personalAllowance;
        if ($taxable <= $basicBand) {
            $tax += $taxable * $basicRate;
        } else {
            $tax += $basicBand * $basicRate;
            $remaining = $taxable - $basicBand;

            // Higher Rate
            $higherBand = $higherRateLimit - $basicRateLimit;
            if ($remaining <= $higherBand) {
                $tax += $remaining * $higherRate;
            } else {
                $tax += $higherBand * $higherRate;
                $remaining -= $higherBand;

                // Additional Rate
                $tax += $remaining * $additionalRate;
            }
        }

        return $tax;
    }

    public function checkVatThreshold(User $user)
    {
        // Rolling 12 months
        $endDate = Carbon::now();
        $startDate = Carbon::now()->subMonths(12);

        $revenueTx = FinancialTransaction::where('user_id', $user->id)
            ->where('type', 'income')
            ->where('status', 'completed')
            ->whereBetween('transaction_date', [$startDate, $endDate])
            ->get(['net_amount', 'currency']);

        $currencies = $revenueTx
            ->pluck('currency')
            ->push('GBP')
            ->filter()
            ->map(fn ($c) => strtoupper($c))
            ->unique()
            ->values();

        $rates = Currency::whereIn('ISO', $currencies)->pluck('conversion_rate', 'ISO');

        $rollingRevenue = $revenueTx->sum(function ($tx) use ($rates) {
            $from = strtoupper($tx->currency ?? 'GBP');
            $amount = (float) ($tx->net_amount ?? 0);

            if ($from === 'GBP') {
                return $amount;
            }

            if (! isset($rates[$from]) || ! isset($rates['GBP'])) {
                return $amount;
            }

            $fromRate = (float) $rates[$from];
            $gbpRate = (float) $rates['GBP'];
            if ($fromRate <= 0 || $gbpRate <= 0) {
                return $amount;
            }

            $gbp = $amount / $fromRate;

            return $gbp * $gbpRate;
        });

        // Update profile
        $profile = CreatorFinancialProfile::firstOrCreate(['user_id' => $user->id]);
        $profile->rolling_revenue = $rollingRevenue;
        $profile->last_revenue_check_at = Carbon::now();
        $profile->save();

        return [
            'revenue' => $rollingRevenue,
            'threshold' => 90000,
            'status' => $rollingRevenue >= 90000 ? 'breached' : ($rollingRevenue >= 85000 ? 'warning' : 'ok'),
        ];
    }
}
