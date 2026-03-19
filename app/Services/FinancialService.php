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

    public function getSummary(User $user, $startDate, $endDate)
    {
        $displayCurrency = strtoupper($user->default_currency ?? 'GBP');

        $incomeTx = FinancialTransaction::where('user_id', $user->id)
            ->where('type', 'income')
            ->where('status', 'completed')
            ->whereBetween('transaction_date', [$startDate, $endDate])
            ->get(['gross_amount', 'net_amount', 'platform_fee', 'stripe_fee', 'vat_amount', 'currency']);

        $grossDisplay = 0;
        $feesDisplay = 0;
        $vatDisplay = 0;
        $netDisplay = 0;

        $grossGbp = 0;
        $feesGbp = 0;
        $vatGbp = 0;
        $netGbp = 0;

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

        $rates = Currency::whereIn('ISO', $allCurrencies)->pluck('conversion_rate', 'ISO');

        if (!isset($rates[$displayCurrency]) || (float) $rates[$displayCurrency] <= 0) {
            $displayCurrency = 'GBP';
        }

        $convert = function (string $from, float $amount, string $to) use ($rates) {
            $from = strtoupper($from ?: 'GBP');
            $to = strtoupper($to ?: 'GBP');

            if ($from === $to) {
                return $amount;
            }

            if (!isset($rates[$from]) || !isset($rates[$to])) {
                return null;
            }

            $fromRate = (float) $rates[$from];
            $toRate = (float) $rates[$to];
            if ($fromRate <= 0 || $toRate <= 0) {
                return null;
            }

            $gbp = $amount / $fromRate;
            return $gbp * $toRate;
        };

        foreach ($incomeTx as $tx) {
            $from = strtoupper($tx->currency ?? 'GBP');
            $creatorEarned = (float) ($tx->net_amount ?? 0);
            $fees = (float) (($tx->platform_fee ?? 0) + ($tx->stripe_fee ?? 0));
            $vat = (float) ($tx->vat_amount ?? 0);
            $net = $creatorEarned;

            $grossDisplay += $from === $displayCurrency ? $creatorEarned : ($convert($from, $creatorEarned, $displayCurrency) ?? $creatorEarned);
            $feesDisplay += $from === $displayCurrency ? $fees : ($convert($from, $fees, $displayCurrency) ?? $fees);
            $vatDisplay += $from === $displayCurrency ? $vat : ($convert($from, $vat, $displayCurrency) ?? $vat);
            $netDisplay += $from === $displayCurrency ? $net : ($convert($from, $net, $displayCurrency) ?? $net);

            $grossGbp += $from === 'GBP' ? $creatorEarned : ($convert($from, $creatorEarned, 'GBP') ?? $creatorEarned);
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

        return [
            'currency' => $displayCurrency,
            'gross_income' => $grossDisplay,
            'fees' => $feesDisplay,
            'vat_collected' => $vatDisplay,
            'net_income' => $netDisplay,
            'expenses' => $expensesDisplay,
            'profit' => $netDisplay - $expensesDisplay,

            'gross_income_gbp' => $grossGbp,
            'fees_gbp' => $feesGbp,
            'vat_collected_gbp' => $vatGbp,
            'net_income_gbp' => $netGbp,
            'expenses_gbp' => $expensesGbp,
            'profit_gbp' => $netGbp - $expensesGbp,
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
