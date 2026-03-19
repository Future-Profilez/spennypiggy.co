<?php

namespace App\Http\Controllers;

use App\Models\CreatorFinancialProfile;
use App\Models\FinancialTransaction;
use App\Models\UkTaxSetting;
use App\Services\FinancialService;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Artisan;

class CreatorFinancialController extends Controller
{
    protected $financialService;

    public function __construct(FinancialService $financialService)
    {
        $this->financialService = $financialService;
    }

    public function index(Request $request)
    {
        $user = Auth::user();
        $year = $request->input('year', $this->financialService->getCurrentTaxYear());
        $dates = $this->financialService->getTaxYearDates($year);
        
        $profile = CreatorFinancialProfile::firstOrCreate(['user_id' => $user->id]);

        // Get Summary
        $summary = $this->financialService->getSummary($user, $dates['start'], $dates['end']);
        
        // Calculate Tax
        $estimatedTaxGbp = $this->financialService->calculateEstimatedTax($summary['profit_gbp'] ?? 0);
        $estimatedTax = $summary['currency'] === 'GBP'
            ? $estimatedTaxGbp
            : \App\Helpers::priceFormat('GBP', $estimatedTaxGbp, $summary['currency']);
        
        $taxSettings = UkTaxSetting::where('tax_year_start', (int) $year)->first()
            ?: UkTaxSetting::orderByDesc('tax_year_start')->first();
        $taxBandLabel = $taxSettings?->tax_year_label;

        // Analytics Data
        $displayCurrency = $summary['currency'] ?? 'GBP';

        $incomeForAnalytics = FinancialTransaction::where('user_id', $user->id)
            ->where('type', 'income')
            ->where('status', 'completed')
            ->whereBetween('transaction_date', [now()->subMonths(6), now()])
            ->get(['transaction_date', 'net_amount', 'currency', 'source_type', 'supporter_id']);

        $monthlyStats = $incomeForAnalytics
            ->groupBy(function ($tx) {
                return optional($tx->transaction_date)->format('Y-m');
            })
            ->map(function ($items, $month) use ($displayCurrency) {
                $total = $items->sum(function ($tx) use ($displayCurrency) {
                    $from = strtoupper($tx->currency ?? 'GBP');
                    $amount = (float) ($tx->net_amount ?? 0);
                    return $from === $displayCurrency ? $amount : \App\Helpers::priceFormat($from, $amount, $displayCurrency);
                });
                return (object) ['month' => $month, 'total' => $total];
            })
            ->sortBy('month')
            ->values();

        $tributeTypes = $incomeForAnalytics
            ->groupBy('source_type')
            ->map(function ($items, $sourceType) use ($displayCurrency) {
                $total = $items->sum(function ($tx) use ($displayCurrency) {
                    $from = strtoupper($tx->currency ?? 'GBP');
                    $amount = (float) ($tx->net_amount ?? 0);
                    return $from === $displayCurrency ? $amount : \App\Helpers::priceFormat($from, $amount, $displayCurrency);
                });
                $count = $items->count();

                $base = class_basename($sourceType);
                $label = match($base) {
                    'StripePaymentItems' => 'Wish Gift',
                    'ShopPayment' => 'Shop Purchase',
                    'TipGoalsPayment' => 'Support/Tip',
                    'MembershipPayment' => 'Membership',
                    'TaskPurchase' => 'Task',
                    'BillPayment' => 'Bill',
                    default => str_replace(['Payment', 'Purchase'], '', $base)
                };

                return (object) [
                    'source_type' => $sourceType,
                    'total' => $total,
                    'count' => $count,
                    'label' => $label,
                ];
            })
            ->sortByDesc('total')
            ->values();

        // Recent Transactions (Income & Expenses)
        $income = FinancialTransaction::where('user_id', $user->id)
            ->where('type', 'income')
            ->where('status', 'completed')
            ->with('supporter:id,name,username,email')
            ->latest('transaction_date')
            ->take(10)
            ->get()
            ->map(function ($tx) {
                $tx->display_date = $tx->transaction_date;
                
                $base = class_basename($tx->source_type);
                $tx->label = match($base) {
                    'StripePaymentItems' => 'Wish Gift',
                    'ShopPayment' => 'Shop Purchase',
                    'TipGoalsPayment' => 'Support/Tip',
                    'MembershipPayment' => 'Membership',
                    'TaskPurchase' => 'Task',
                    'BillPayment' => 'Bill',
                    default => str_replace(['Payment', 'Purchase'], '', $base)
                };
                
                return $tx;
            });

        $expenses = \App\Models\CreatorExpense::where('user_id', $user->id)
            ->latest('expense_date')
            ->take(10)
            ->get()
            ->map(function ($exp) {
                // Mock FinancialTransaction structure for frontend compatibility
                $tx = new \stdClass();
                $tx->uuid = 'exp-' . $exp->id;
                $tx->transaction_date = $exp->expense_date;
                $tx->description = $exp->description;
                $tx->type = 'expense';
                $tx->gross_amount = $exp->amount;
                $tx->net_amount = $exp->amount;
                $tx->vat_amount = 0;
                $tx->status = 'completed';
                $tx->source_type = $exp->category; 
                $tx->currency = $exp->currency;
                
                $tx->display_date = $exp->expense_date;
                
                return $tx;
            });

        $recentTransactions = $income->concat($expenses)
            ->sortByDesc('display_date')
            ->take(10)
            ->values();

        // Top Supporters with Category Breakdown
        $supporterTx = FinancialTransaction::where('user_id', $user->id)
            ->where('type', 'income')
            ->where('status', 'completed')
            ->whereBetween('transaction_date', [$dates['start'], $dates['end']])
            ->whereNotNull('supporter_id')
            ->with(['supporter:id,name,username,avatar'])
            ->get(['supporter_id', 'net_amount', 'currency', 'source_type', 'transaction_date']);

        $topSupporters = $supporterTx
            ->groupBy('supporter_id')
            ->map(function ($items) use ($displayCurrency) {
                $total = $items->sum(function ($tx) use ($displayCurrency) {
                    $from = strtoupper($tx->currency ?? 'GBP');
                    $amount = (float) ($tx->net_amount ?? 0);
                    return $from === $displayCurrency ? $amount : \App\Helpers::priceFormat($from, $amount, $displayCurrency);
                });

                $breakdown = $items
                    ->groupBy('source_type')
                    ->mapWithKeys(function ($group, $sourceType) use ($displayCurrency) {
                        $amount = $group->sum(function ($tx) use ($displayCurrency) {
                            $from = strtoupper($tx->currency ?? 'GBP');
                            $value = (float) ($tx->net_amount ?? 0);
                            return $from === $displayCurrency ? $value : \App\Helpers::priceFormat($from, $value, $displayCurrency);
                        });

                        $base = class_basename($sourceType);
                        $label = match($base) {
                            'StripePaymentItems' => 'Wish',
                            'ShopPayment' => 'Shop',
                            'TipGoalsPayment' => 'Tips',
                            'MembershipPayment' => 'Membership',
                            'TaskPurchase' => 'Task',
                            'BillPayment' => 'Bill',
                            default => str_replace(['Payment', 'Purchase'], '', $base)
                        };

                        return [$label => $amount];
                    });

                $first = $items->first();
                return (object) [
                    'supporter_id' => $first->supporter_id,
                    'total_spent' => $total,
                    'supporter' => $first->supporter,
                    'breakdown' => $breakdown,
                ];
            })
            ->sortByDesc('total_spent')
            ->take(5)
            ->values();

        return Inertia::render('Creator/Financial/Dashboard', [
            'summary' => $summary,
            'tax_estimate' => $estimatedTax,
            'tax_year' => $dates['label'],
            'tax_band_label' => $taxBandLabel,
            'display_currency' => $displayCurrency,
            'profile' => $profile,
            'recent_transactions' => $recentTransactions,
            'top_supporters' => $topSupporters,
            'analytics' => [
                'monthly' => $monthlyStats,
                'tribute_types' => $tributeTypes
            ]
        ]);
    }

    public function history(Request $request)
    {
        $user = Auth::user();
        
        // Income
        $income = FinancialTransaction::where('user_id', $user->id)
            ->where('type', 'income')
            ->where('status', 'completed')
            ->with('supporter:id,name,username,email')
            ->latest('transaction_date')
            ->get()
            ->map(function ($tx) {
                $tx->display_date = $tx->transaction_date;
                $tx->uuid = $tx->uuid ?? $tx->id;
                
                $base = class_basename($tx->source_type);
                $tx->label = match($base) {
                    'StripePaymentItems' => 'Wish Gift',
                    'ShopPayment' => 'Shop Purchase',
                    'TipGoalsPayment' => 'Support/Tip',
                    'MembershipPayment' => 'Membership',
                    'TaskPurchase' => 'Task',
                    'BillPayment' => 'Bill',
                    default => str_replace(['Payment', 'Purchase'], '', $base)
                };
                return $tx;
            });

        // Expenses
        $expenses = \App\Models\CreatorExpense::where('user_id', $user->id)
            ->latest('expense_date')
            ->get()
            ->map(function ($exp) {
                $tx = new \stdClass();
                $tx->uuid = 'exp-' . $exp->id;
                $tx->transaction_date = $exp->expense_date;
                $tx->description = $exp->description;
                $tx->type = 'expense';
                $tx->gross_amount = $exp->amount;
                $tx->vat_amount = 0;
                $tx->status = 'completed';
                $tx->source_type = $exp->category; 
                $tx->currency = $exp->currency;
                $tx->display_date = $exp->expense_date;
                $tx->label = 'Expense';
                $tx->supporter = null;
                return $tx;
            });

        $allTransactions = $income->concat($expenses)->sortByDesc('display_date')->values();
        
        // Pagination
        $perPage = 20;
        $page = $request->input('page', 1);
        $total = $allTransactions->count();
        $paginated = $allTransactions->slice(($page - 1) * $perPage, $perPage)->values();
        
        $transactions = new \Illuminate\Pagination\LengthAwarePaginator(
            $paginated, $total, $perPage, $page, [
                'path' => $request->url(),
                'query' => $request->query()
            ]
        );

        return Inertia::render('Creator/Financial/History', [
            'transactions' => $transactions
        ]);
    }

    public function refresh(Request $request)
    {
        $user = Auth::user();

        Artisan::call('finance:sync-transactions', [
            '--user_id' => $user->id,
        ]);

        return back()->with('success', 'Financial records refreshed.');
    }

    public function certificate(Request $request)
    {
        $user = Auth::user();
        $profile = CreatorFinancialProfile::firstOrCreate(['user_id' => $user->id]);
        
        // Calculate verified metrics for certificate
        $joinDate = $user->created_at;
        $incomeAll = FinancialTransaction::where('user_id', $user->id)
            ->where('type', 'income')
            ->where('status', 'completed')
            ->get(['net_amount', 'currency', 'transaction_date']);

        $displayCurrency = strtoupper($user->default_currency ?? 'GBP');

        $currencies = $incomeAll
            ->pluck('currency')
            ->push($displayCurrency)
            ->filter()
            ->map(fn ($c) => strtoupper($c))
            ->unique()
            ->values();

        $rates = \App\Models\Currency::whereIn('ISO', $currencies)->pluck('conversion_rate', 'ISO');

        $convert = function ($from, $amount, $to) use ($rates) {
            $from = strtoupper($from ?: $to);
            $to = strtoupper($to ?: $from);
            $amount = (float) $amount;
            if ($from === $to) {
                return $amount;
            }
            if (!isset($rates[$from]) || !isset($rates[$to])) {
                return $amount;
            }
            $fromRate = (float) $rates[$from];
            $toRate = (float) $rates[$to];
            if ($fromRate <= 0 || $toRate <= 0) {
                return $amount;
            }
            $gbp = $amount / $fromRate;
            return $gbp * $toRate;
        };

        $totalEarnings = $incomeAll->sum(function ($tx) use ($convert, $displayCurrency) {
            return $convert($tx->currency, $tx->net_amount ?? 0, $displayCurrency);
        });
            
        // Last 12 months for average
        $last12MonthsEarnings = $incomeAll
            ->where('transaction_date', '>=', now()->subMonths(12))
            ->sum(function ($tx) use ($convert, $displayCurrency) {
                return $convert($tx->currency, $tx->net_amount ?? 0, $displayCurrency);
            });
            
        $activeMonths = max(1, min(12, $joinDate->diffInMonths(now()) + 1));
        $averageMonthly = $last12MonthsEarnings / $activeMonths;

        return Inertia::render('Creator/Financial/Certificate', [
            'profile' => $profile,
            'user' => $user,
            'metrics' => [
                'total_earnings' => $totalEarnings,
                'average_monthly' => $averageMonthly,
                'currency' => $displayCurrency,
                'member_since' => $joinDate->format('d M Y'),
                'generated_at' => now()->format('d M Y'),
                'verification_id' => strtoupper(uniqid('SP-VER-')),
            ]
        ]);
    }

    public function updateProfile(Request $request)
    {
        $validated = $request->validate([
            'business_name' => 'nullable|string|max:255',
            'business_address_line1' => 'nullable|string|max:255',
            'business_address_line2' => 'nullable|string|max:255',
            'business_city' => 'nullable|string|max:100',
            'business_postal_code' => 'nullable|string|max:20',
            'business_country' => 'nullable|string|max:100',
            'vat_registered' => 'boolean',
            'vat_registration_number' => 'nullable|string|max:50',
            'tax_percentage' => 'required|numeric|min:0|max:100',
        ]);

        $profile = CreatorFinancialProfile::updateOrCreate(
            ['user_id' => Auth::id()],
            $validated
        );

        return back()->with('success', 'Financial profile updated.');
    }

    public function exportCsv(Request $request)
    {
        $user = Auth::user();
        $year = $request->input('year', $this->financialService->getCurrentTaxYear());
        $dates = $this->financialService->getTaxYearDates($year);

        $transactions = FinancialTransaction::where('user_id', $user->id)
            ->whereBetween('transaction_date', [$dates['start'], $dates['end']])
            ->get()
            ->map(function ($transaction) {
                return [
                    'date' => $transaction->transaction_date,
                    'type' => $transaction->type,
                    'category' => 'Income',
                    'description' => $transaction->description,
                    'gross_amount' => $transaction->type === 'income' ? $transaction->net_amount : $transaction->gross_amount,
                    'net_amount' => $transaction->type === 'income' ? $transaction->net_amount : $transaction->gross_amount,
                    'currency' => $transaction->currency,
                    'status' => $transaction->status,
                ];
            });

        $expenses = \App\Models\CreatorExpense::where('user_id', $user->id)
            ->whereBetween('expense_date', [$dates['start'], $dates['end']])
            ->get()
            ->map(function ($expense) {
                return [
                    'date' => $expense->expense_date,
                    'type' => 'Expense',
                    'category' => $expense->category,
                    'description' => $expense->description,
                    'gross_amount' => $expense->amount,
                    'net_amount' => $expense->amount,
                    'currency' => $expense->currency,
                    'status' => 'completed',
                ];
            });

        $merged = $transactions->concat($expenses)->sortByDesc('date');

        $filename = "financial-report-{$year}.csv";
        $headers = [
            "Content-type"        => "text/csv",
            "Content-Disposition" => "attachment; filename=$filename",
            "Pragma"              => "no-cache",
            "Cache-Control"       => "must-revalidate, post-check=0, pre-check=0",
            "Expires"             => "0"
        ];

        $columns = ['Date', 'Type', 'Category', 'Description', 'Amount', 'Currency', 'Status'];

        $callback = function() use($merged, $columns) {
            $file = fopen('php://output', 'w');
            fputcsv($file, $columns);

            foreach ($merged as $row) {
                fputcsv($file, [
                    $row['date']->format('Y-m-d H:i:s'),
                    $row['type'],
                    $row['category'],
                    $row['description'],
                    $row['gross_amount'],
                    $row['currency'],
                    $row['status']
                ]);
            }

            fclose($file);
        };

        return response()->stream($callback, 200, $headers);
    }
    
    public function generateIncomeStatement(Request $request)
    {
        // For PDF generation, we would use a library like dompdf.
        // For now, we'll return a view that the user can print.
        $user = Auth::user();
        $year = $request->input('year', $this->financialService->getCurrentTaxYear());
        $dates = $this->financialService->getTaxYearDates($year);
        $summary = $this->financialService->getSummary($user, $dates['start'], $dates['end']);
        $profile = CreatorFinancialProfile::firstOrCreate(['user_id' => $user->id]);

        return Inertia::render('Creator/Financial/Statement', [
            'summary' => $summary,
            'dates' => $dates,
            'profile' => $profile,
            'user' => $user
        ]);
    }
}
