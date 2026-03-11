<?php

namespace App\Http\Controllers;

use App\Models\CreatorFinancialProfile;
use App\Models\FinancialTransaction;
use App\Services\FinancialService;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Response;

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

        // Sync VAT Threshold
        $vatStatus = $this->financialService->checkVatThreshold($user);

        // Get Summary
        $summary = $this->financialService->getSummary($user, $dates['start'], $dates['end']);
        
        // Calculate Tax
        $estimatedTax = $this->financialService->calculateEstimatedTax($summary['profit']);

        // Analytics Data
        $monthlyStats = FinancialTransaction::where('user_id', $user->id)
            ->where('type', 'income')
            ->whereBetween('transaction_date', [now()->subMonths(6), now()])
            ->selectRaw('DATE_FORMAT(transaction_date, "%Y-%m") as month, SUM(gross_amount) as total')
            ->groupBy('month')
            ->orderBy('month')
            ->get();

        $tributeTypes = FinancialTransaction::where('user_id', $user->id)
            ->where('type', 'income')
            ->selectRaw('source_type, SUM(gross_amount) as total, COUNT(*) as count')
            ->groupBy('source_type')
            ->orderByDesc('total')
            ->get()
            ->map(function ($type) {
                $base = class_basename($type->source_type);
                $label = match($base) {
                    'StripePaymentItems' => 'Wish Gift',
                    'ShopPayment' => 'Shop Purchase',
                    'TipGoalsPayment' => 'Support/Tip',
                    'MembershipPayment' => 'Membership',
                    'TaskPurchase' => 'Task',
                    'BillPayment' => 'Bill',
                    default => str_replace(['Payment', 'Purchase'], '', $base)
                };
                $type->label = $label;
                return $type;
            });

        // Recent Transactions (Income & Expenses)
        $income = FinancialTransaction::where('user_id', $user->id)
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
        $topSupporters = FinancialTransaction::where('user_id', $user->id)
            ->where('type', 'income')
            ->whereNotNull('supporter_id')
            ->selectRaw('supporter_id, SUM(gross_amount) as total_spent')
            ->with(['supporter:id,name,username,avatar'])
            ->groupBy('supporter_id')
            ->orderByDesc('total_spent')
            ->take(5)
            ->get()
            ->map(function ($supporter) use ($user) {
                $breakdown = FinancialTransaction::where('user_id', $user->id)
                    ->where('supporter_id', $supporter->supporter_id)
                    ->where('type', 'income')
                    ->selectRaw('source_type, SUM(gross_amount) as amount')
                    ->groupBy('source_type')
                    ->get()
                    ->mapWithKeys(function ($item) {
                        $base = class_basename($item->source_type);
                        $label = match($base) {
                            'StripePaymentItems' => 'Wish',
                            'ShopPayment' => 'Shop',
                            'TipGoalsPayment' => 'Tips',
                            'MembershipPayment' => 'Membership',
                            'TaskPurchase' => 'Task',
                            'BillPayment' => 'Bill',
                            default => str_replace(['Payment', 'Purchase'], '', $base)
                        };
                        return [$label => $item->amount];
                    });
                
                $supporter->breakdown = $breakdown;
                return $supporter;
            })
            ->values();

        return Inertia::render('Creator/Financial/Dashboard', [
            'summary' => $summary,
            'tax_estimate' => $estimatedTax,
            'vat_status' => $vatStatus,
            'tax_year' => $dates['label'],
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

    public function certificate(Request $request)
    {
        $user = Auth::user();
        $profile = CreatorFinancialProfile::firstOrCreate(['user_id' => $user->id]);
        
        // Calculate verified metrics for certificate
        $joinDate = $user->created_at;
        $totalEarnings = FinancialTransaction::where('user_id', $user->id)
            ->where('type', 'income')
            ->sum('gross_amount');
            
        // Last 12 months for average
        $last12MonthsEarnings = FinancialTransaction::where('user_id', $user->id)
            ->where('type', 'income')
            ->where('transaction_date', '>=', now()->subMonths(12))
            ->sum('gross_amount');
            
        $activeMonths = max(1, min(12, $joinDate->diffInMonths(now()) + 1));
        $averageMonthly = $last12MonthsEarnings / $activeMonths;

        return Inertia::render('Creator/Financial/Certificate', [
            'profile' => $profile,
            'user' => $user,
            'metrics' => [
                'total_earnings' => $totalEarnings,
                'average_monthly' => $averageMonthly,
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
                    'gross_amount' => $transaction->gross_amount,
                    'platform_fee' => $transaction->platform_fee,
                    'stripe_fee' => $transaction->stripe_fee,
                    'vat_amount' => $transaction->vat_amount,
                    'net_amount' => $transaction->net_amount,
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
                    'platform_fee' => 0,
                    'stripe_fee' => 0,
                    'vat_amount' => 0,
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

        $columns = ['Date', 'Type', 'Category', 'Description', 'Gross Amount', 'Platform Fee', 'Stripe Fee', 'VAT', 'Net Amount', 'Currency', 'Status'];

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
                    $row['platform_fee'],
                    $row['stripe_fee'],
                    $row['vat_amount'],
                    $row['net_amount'],
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
