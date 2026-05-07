<?php

namespace App\Services;

use App\Models\User;
use App\Models\FinancialTransaction;
use App\Models\CreatorFinancialProfile;
use App\Models\CreatorExpense;
use App\Models\Currency;
use App\Models\UkTaxSetting;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;

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
        
        return ['start' => $start, 'end' => $end, 'label' => "{$year}-" . ($year + 1)];
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
            ->whereIn('status', ['completed', 'review_hold', 'disputed', 'refunded'])
            ->whereBetween('transaction_date', [$startDate, $endDate])
            ->with('source')
            ->get(['gross_amount', 'net_amount', 'platform_fee', 'stripe_fee', 'vat_amount', 'currency', 'status', 'reserve_amount', 'reserve_status', 'source_type', 'source_id']);

        // Fetch Reserves and Review Holds from PayoutService
        $payoutService = app(\App\Services\Risk\PayoutService::class);
        $reserves = $payoutService->getHeldReserves($user->uuid);
        
        // Convert all minor units to major units (GBP)
        // Note: getHeldReserves now includes both executed run reserves and pending payment reserves.
        $heldReservesAmount = ($reserves['total_held'] ?? 0) / 100;

        // Review Holds and Disputed payments
        $reviewHoldsAmount = \App\Models\Payment::where('creator_id', $user->uuid)
            ->where('status', 'review_hold')
            ->sum('amount');
            
        $disputesAmount = \App\Models\Payment::where('creator_id', $user->uuid)
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

        if (!isset($currencyMeta[$displayCurrency]) || (float) ($currencyMeta[$displayCurrency]->conversion_rate ?? 0) <= 0) {
            $displayCurrency = 'GBP';
        }

        $convert = function (string $from, float $amount, string $to) use ($currencyMeta) {
            $from = strtoupper($from ?: 'GBP');
            $to = strtoupper($to ?: 'GBP');

            if ($from === $to) {
                return $amount;
            }

            if (!isset($currencyMeta[$from]) || !isset($currencyMeta[$to])) {
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
        if (!empty($shopPaymentIds)) {
            $shopShippingAmounts = \App\Models\ShopPayment::whereIn('id', $shopPaymentIds)
                ->pluck('shipping_amount', 'id')
                ->toArray();
        }

        foreach ($incomeTx as $tx) {
            // Task Completion Logic: Only count toward Gross/Net if completed
            if ($tx->source_type === 'App\Models\TaskPurchase' && isset($tx->source->status)) {
                if (!in_array($tx->source->status, ['completed', 'completed_accepted', 'paid_out'])) {
                    continue;
                }
            }

            // Shop Completion Logic: Only count toward Gross/Net if delivered (for physical items)
            if ($tx->source_type === 'App\Models\ShopPayment' && isset($tx->source->shop)) {
                if ($tx->source->shop->type === 'physical') {
                    $deliverable = \App\Models\Deliverable::where('session_id', $tx->source->session_id)->first();
                    if (!$deliverable || $deliverable->status !== 'delivered') {
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

        // Convert reserves and review holds to display currency
        $heldReservesDisplay = $convert('GBP', $heldReservesAmount, $displayCurrency) ?? ($heldReservesAmount);
        $reviewHoldsDisplay = $convert('GBP', $reviewHoldsAmount / 100, $displayCurrency) ?? ($reviewHoldsAmount / 100);
        $disputesDisplay = $convert('GBP', $disputesAmount / 100, $displayCurrency) ?? ($disputesAmount / 100);

        // Calculate Expected Next Payout using PayoutService directly
        $payoutData = $payoutService->calculatePayouts();
        $payoutInfo = $payoutData['payouts'][$user->uuid] ?? null;
        $netPayoutMinor = $payoutInfo['net_payout'] ?? 0;
        $netPayoutMajor = $netPayoutMinor / 100;
        $payoutableDisplay = $convert('GBP', $netPayoutMajor, $displayCurrency) ?? $netPayoutMajor;

        $pendingAmountMinor = $payoutInfo['pending_amount'] ?? 0;
        $pendingAmountMajor = $pendingAmountMinor / 100;
        $pendingDisplay = $convert('GBP', $pendingAmountMajor, $displayCurrency) ?? $pendingAmountMajor;

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
            'carry_over_amount' => $carryOverDisplay,
            'has_adjustment' => ($payoutInfo['refund_dispute_amount'] ?? 0) > 0,

            'gross_income_gbp' => $grossGbp,
            'fees_gbp' => $feesGbp,
            'vat_collected_gbp' => $vatGbp,
            'net_income_gbp' => $netGbp,
            'expenses_gbp' => $expensesGbp,
            'profit_gbp' => $netGbp - $expensesGbp,
            'held_reserves_gbp' => $heldReservesAmount,
            'pending_balance_gbp' => $pendingAmountMajor,
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

            if (!isset($rates[$from]) || !isset($rates['GBP'])) {
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
            'status' => $rollingRevenue >= 90000 ? 'breached' : ($rollingRevenue >= 85000 ? 'warning' : 'ok')
        ];
    }
}
