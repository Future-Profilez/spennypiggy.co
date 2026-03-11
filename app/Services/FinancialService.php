<?php

namespace App\Services;

use App\Models\User;
use App\Models\FinancialTransaction;
use App\Models\CreatorFinancialProfile;
use App\Models\CreatorExpense;
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
        $income = FinancialTransaction::where('user_id', $user->id)
            ->where('type', 'income')
            ->whereBetween('transaction_date', [$startDate, $endDate])
            ->select(
                DB::raw('SUM(gross_amount) as total_gross'),
                DB::raw('SUM(platform_fee) as total_platform_fee'),
                DB::raw('SUM(stripe_fee) as total_stripe_fee'),
                DB::raw('SUM(vat_amount) as total_vat'),
                DB::raw('SUM(net_amount) as total_net')
            )->first();

        $expenses = CreatorExpense::where('user_id', $user->id)
            ->whereBetween('expense_date', [$startDate, $endDate])
            ->sum('amount');

        $totalGross = $income->total_gross ?? 0;
        $totalVat = $income->total_vat ?? 0;
        $totalFees = ($income->total_platform_fee ?? 0) + ($income->total_stripe_fee ?? 0);
        
        // Calculate net income dynamically to ensure consistency with gross - fees - vat
        $totalNet = $totalGross - $totalFees - $totalVat;

        return [
            'gross_income' => $totalGross,
            'fees' => $totalFees,
            'vat_collected' => $totalVat,
            'net_income' => $totalNet,
            'expenses' => $expenses,
            'profit' => $totalNet - $expenses
        ];
    }

    public function calculateEstimatedTax($profit)
    {
        // Simple UK Tax Bands (2024/25 rates)
        // Personal Allowance: £12,570
        // Basic Rate (20%): £12,571 to £50,270
        // Higher Rate (40%): £50,271 to £125,140
        // Additional Rate (45%): over £125,140

        $personalAllowance = 12570;
        $basicRateLimit = 50270;
        $higherRateLimit = 125140;

        $tax = 0;

        if ($profit <= $personalAllowance) {
            return 0;
        }

        // Calculate taxable amount above allowance
        $taxable = $profit - $personalAllowance;

        // Basic Rate
        $basicBand = $basicRateLimit - $personalAllowance;
        if ($taxable <= $basicBand) {
            $tax += $taxable * 0.20;
        } else {
            $tax += $basicBand * 0.20;
            $remaining = $taxable - $basicBand;

            // Higher Rate
            $higherBand = $higherRateLimit - $basicRateLimit;
            if ($remaining <= $higherBand) {
                $tax += $remaining * 0.40;
            } else {
                $tax += $higherBand * 0.40;
                $remaining -= $higherBand;

                // Additional Rate
                $tax += $remaining * 0.45;
            }
        }
        
        return $tax;
    }

    public function checkVatThreshold(User $user)
    {
        // Rolling 12 months
        $endDate = Carbon::now();
        $startDate = Carbon::now()->subMonths(12);

        $rollingRevenue = FinancialTransaction::where('user_id', $user->id)
            ->where('type', 'income')
            ->whereBetween('transaction_date', [$startDate, $endDate])
            ->sum('gross_amount');
            
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
