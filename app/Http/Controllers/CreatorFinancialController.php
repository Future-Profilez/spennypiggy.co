<?php

namespace App\Http\Controllers;

use App\Models\CreatorFinancialProfile;
use App\Models\CreatorMetric;
use App\Models\FinancialTransaction;
use App\Models\UkTaxSetting;
use App\Services\FinancialService;
use App\Services\Risk\PayoutService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Artisan;

class CreatorFinancialController extends Controller
{
    protected $financialService;
    protected $payoutService;

    public function __construct(FinancialService $financialService, PayoutService $payoutService)
    {
        $this->financialService = $financialService;
        $this->payoutService = $payoutService;
    }

    public function index(Request $request, $tab = 'overview')
    {
        $user = Auth::user();
        $year = $request->input('year', $this->financialService->getCurrentTaxYear());
        $dates = $this->financialService->getTaxYearDates($year);
        
        $profile = CreatorFinancialProfile::firstOrCreate(['user_id' => $user->id]);

        // Get Summary
        $displayCurrency = strtoupper($request->cookie('currency', $user->default_currency ?? 'GBP'));
        $summary = $this->financialService->getSummary($user, $dates['start'], $dates['end'], $displayCurrency);
        
        // Calculate Tax
        $estimatedTaxGbp = $this->financialService->calculateEstimatedTax($summary['profit_gbp'] ?? 0);
        $estimatedTax = $summary['currency'] === 'GBP'
            ? $estimatedTaxGbp
            : \App\Helpers::priceFormat('GBP', $estimatedTaxGbp, $summary['currency']);
        
        $taxSettings = UkTaxSetting::where('tax_year_start', (int) $year)->first()
            ?: UkTaxSetting::orderByDesc('tax_year_start')->first();
        $taxBandLabel = $taxSettings?->tax_year_label;

        // Analytics Data (Consistent with Tax Year)
        $displayCurrency = $summary['currency'] ?? $displayCurrency ?? 'GBP';

        $incomeForAnalytics = FinancialTransaction::where('user_id', $user->id)
            ->where('type', 'income')
            ->whereIn('status', ['completed', 'review_hold', 'disputed', 'refunded'])
            ->whereBetween('transaction_date', [$dates['start'], $dates['end']])
            ->get(['transaction_date', 'net_amount', 'currency', 'source_type', 'supporter_id', 'source_id', 'vat_amount']);

        // Collect Shop IDs for analytics shipping
        $analyticsShopIds = $incomeForAnalytics->where('source_type', 'App\Models\ShopPayment')->pluck('source_id')->toArray();
        $analyticsShopShipping = [];
        if (!empty($analyticsShopIds)) {
            $analyticsShopShipping = \App\Models\ShopPayment::whereIn('id', $analyticsShopIds)->pluck('shipping_amount', 'id')->toArray();
        }

        $monthlyStats = $incomeForAnalytics
            ->groupBy(function ($tx) {
                return optional($tx->transaction_date)->format('Y-m');
            })
            ->map(function ($items, $month) use ($displayCurrency, $analyticsShopShipping) {
                $total = $items->sum(function ($tx) use ($displayCurrency) {
                    $from = strtoupper($tx->currency ?? 'GBP');
                    $net = (float) ($tx->net_amount ?? 0);
                    $vat = (float) ($tx->vat_amount ?? 0);
                    $gross = $net + $vat;

                    return $from === $displayCurrency ? $gross : \App\Helpers::priceFormat($from, $gross, $displayCurrency);
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
                    $net = (float) ($tx->net_amount ?? 0);
                    $vat = (float) ($tx->vat_amount ?? 0);
                    $gross = $net + $vat;

                    return $from === $displayCurrency ? $gross : \App\Helpers::priceFormat($from, $gross, $displayCurrency);
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

        // Status breakdown — counts and totals per status for the tax year
        $allStatusTx = FinancialTransaction::where('user_id', $user->id)
            ->where('type', 'income')
            ->whereIn('status', ['completed', 'review_hold', 'disputed', 'refunded'])
            ->whereBetween('transaction_date', [$dates['start'], $dates['end']])
            ->with('source')
            ->get(['status', 'net_amount', 'currency', 'source_type', 'source_id', 'vat_amount']);

        // Collect all Shop IDs for status breakdown shipping
        $allShopIds = $allStatusTx->where('source_type', 'App\Models\ShopPayment')->pluck('source_id')->toArray();
        $allShopShipping = [];
        if (!empty($allShopIds)) {
            $allShopShipping = \App\Models\ShopPayment::whereIn('id', $allShopIds)->pluck('shipping_amount', 'id')->toArray();
        }

        $statusBreakdown = $allStatusTx
            ->groupBy(function($tx) {
                // If payment is succeeded but item is not completed/delivered, treat as 'pending'
                if ($tx->status === 'completed') {
                    if ($tx->source_type === 'App\Models\TaskPurchase' && $tx->source) {
                        if (!in_array($tx->source->status, ['completed', 'completed_accepted', 'paid_out'])) {
                            return 'pending';
                        }
                    }
                    if ($tx->source_type === 'App\Models\ShopPayment' && $tx->source && ($tx->source->shop->type ?? null) === 'physical') {
                        $itemStat = $tx->source->deliverable->status ?? 'processing';
                        if ($itemStat !== 'delivered') {
                            return 'pending';
                        }
                    }
                }
                return $tx->status;
            })
            ->map(function ($items, $status) use ($displayCurrency, $allShopShipping) {
                $total = $items->sum(function ($tx) use ($displayCurrency, $allShopShipping) {
                    $from = strtoupper($tx->currency ?? 'GBP');
                    $net = (float) ($tx->net_amount ?? 0);
                    $vat = (float) ($tx->vat_amount ?? 0);
                    $gross = $net + $vat;

                    return $from === $displayCurrency ? $gross : \App\Helpers::priceFormat($from, $gross, $displayCurrency);
                });
                return ['status' => $status, 'count' => $items->count(), 'total' => $total];
            })
            ->values();

        // Recent Transactions (Filtered by Tax Year for overview, All for payouts)
        $incomeQuery = FinancialTransaction::where('user_id', $user->id)
            ->where('type', 'income')
            ->whereIn('status', ['completed', 'review_hold', 'disputed', 'refunded'])
            ->with(['supporter:id,name,username,email', 'source' => function($morphTo) {
                $morphTo->morphWith([
                    \App\Models\TaskPurchase::class => ['task'],
                    \App\Models\ShopPayment::class => ['shop', 'deliverable'],
                    \App\Models\StripePaymentItems::class => [],
                    \App\Models\TipGoalsPayment::class => ['tipGoal'],
                    \App\Models\MembershipPayment::class => ['membership'],
                    \App\Models\BillPayment::class => ['bill'],
                ]);
            }])
            ->orderBy('transaction_date', 'desc')
            ->orderBy('id', 'desc');
            
        if ($tab !== 'payouts') {
            $incomeQuery->whereBetween('transaction_date', [$dates['start'], $dates['end']])->take(20);
        }
        
        $income = $incomeQuery->get();

        // Collect Shop IDs for shipping info
        $shopIds = $income->where('source_type', 'App\Models\ShopPayment')->pluck('source_id')->toArray();
        $shopShipping = [];
        if (!empty($shopIds)) {
            $shopShipping = \App\Models\ShopPayment::whereIn('id', $shopIds)->pluck('shipping_amount', 'id')->toArray();
        }

        $income = $income->map(function ($tx) use ($shopShipping) {
                $tx->display_date = $tx->transaction_date;
                $tx->id = $tx->id; 
                $tx->reserve_percent = $tx->net_amount > 0 ? round(($tx->reserve_amount / $tx->net_amount) * 100, 1) : 0;

                $base = class_basename($tx->source_type);
                
                // Get Source Title for description
                $sourceTitle = null;
                if ($base === 'TaskPurchase' && isset($tx->source->task)) {
                    $sourceTitle = $tx->source->task->title;
                } elseif ($base === 'ShopPayment' && isset($tx->source->shop)) {
                    $sourceTitle = $tx->source->shop->name;
                } elseif ($base === 'StripePaymentItems' && isset($tx->source)) {
                    $sourceTitle = $tx->source->wish_name ?? $tx->source->name;
                } elseif ($base === 'MembershipPayment' && isset($tx->source->membership)) {
                    $sourceTitle = $tx->source->membership->level;
                } elseif ($base === 'BillPayment' && isset($tx->source->bill)) {
                    $sourceTitle = $tx->source->bill->name;
                } elseif ($base === 'TipGoalsPayment' && isset($tx->source->tipGoal)) {
                    $sourceTitle = $tx->source->tipGoal->name;
                }

                $tx->label = match($base) {
                    'StripePaymentItems' => 'Wish Gift',
                    'ShopPayment' => 'Shop Purchase',
                    'TipGoalsPayment' => 'Support/Tip',
                    'MembershipPayment' => 'Membership',
                    'TaskPurchase' => 'Task',
                    'BillPayment' => 'Bill',
                    default => str_replace(['Payment', 'Purchase'], '', $base)
                };

                // Update description to include title
                if ($sourceTitle) {
                    $tx->description = $tx->label . ': ' . $sourceTitle;
                }

                // Calculate Creator Gross (Net + VAT) instead of Total Paid (Gross from DB)
                // Note: net_amount for Shop already includes shipping_amount
                $shipping = 0;
                if ($base === 'ShopPayment') {
                    $shipping = (float)($shopShipping[$tx->source_id] ?? 0);
                    if ($shipping > 0) {
                        $tx->shipping_amount = $shipping;
                    }
                }
                
                $tx->gross_amount = (float)$tx->net_amount + (float)($tx->vat_amount ?? 0);

                // Add item type (digital/physical/instant/timed)
                if ($base === 'ShopPayment' && $tx->source->shop) {
                    $tx->item_type = $tx->source->shop->type === 'physical' ? 'physical' : 'digital';
                } elseif ($base === 'TaskPurchase' && $tx->source->task) {
                    $tx->item_type = $tx->source->task->type === 'instant' ? 'instant' : 'timed';
                }

                // Handling for Task status display in ledger
                if ($base === 'TaskPurchase' && $tx->source) {
                    $tx->item_status = match($tx->source->status) {
                        'completed', 'completed_accepted', 'paid_out' => 'complete',
                        'delivered' => 'delivered',
                        'pending_review' => 'review_pending',
                        'paid', 'assigned' => 'pending',
                        'escalated' => 'escalated',
                        default => $tx->source->status
                    };

                    // Gray out tasks that are not yet finalized (including escalated)
                    if (!in_array($tx->source->status, ['completed', 'completed_accepted', 'paid_out'])) {
                        $tx->is_grayed_out = true;
                    }
                }

                // Handling for Shop status display in ledger
                if ($base === 'ShopPayment' && $tx->source) {
                    $itemStat = $tx->source->deliverable->status ?? 'processing';
                    $tx->item_status = match($itemStat) {
                        'delivered' => 'complete',
                        'shipped' => 'shipped',
                        'processing' => 'processing',
                        default => $itemStat
                    };

                    // Gray out physical shop items that are not yet delivered
                    if (($tx->source->shop->type ?? null) === 'physical' && $itemStat !== 'delivered') {
                        $tx->is_grayed_out = true;
                    }
                }

                return $tx;
            });

        $expensesQuery = \App\Models\CreatorExpense::where('user_id', $user->id)
            ->orderBy('expense_date', 'desc')
            ->orderBy('id', 'desc');
            
        if ($tab !== 'payouts') {
            $expensesQuery->whereBetween('expense_date', [$dates['start'], $dates['end']])->take(20);
        }
            
        $expenses = $expensesQuery->get()
            ->map(function ($exp) {
                // Mock FinancialTransaction structure for frontend compatibility
                $tx = new \stdClass();
                $tx->id = $exp->id;
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
            ->sortBy([
                ['display_date', 'desc'],
                ['id', 'desc'],
            ]);
            
        if ($tab !== 'payouts') {
            $recentTransactions = $recentTransactions->take(20);
        }
        
        $recentTransactions = $recentTransactions->values();

        // Top Supporters with Category Breakdown
        $supporterTx = FinancialTransaction::where('user_id', $user->id)
            ->where('type', 'income')
            ->whereIn('status', ['completed', 'review_hold', 'disputed', 'refunded'])
            ->whereBetween('transaction_date', [$dates['start'], $dates['end']])
            ->whereNotNull('supporter_id')
            ->with(['supporter:id,name,username,avatar'])
            ->get(['supporter_id', 'net_amount', 'currency', 'source_type', 'transaction_date', 'status', 'source_id', 'vat_amount']);

        // Collect Shop IDs for supporter shipping
        $supporterShopIds = $supporterTx->where('source_type', 'App\Models\ShopPayment')->pluck('source_id')->toArray();
        $supporterShopShipping = [];
        if (!empty($supporterShopIds)) {
            $supporterShopShipping = \App\Models\ShopPayment::whereIn('id', $supporterShopIds)->pluck('shipping_amount', 'id')->toArray();
        }

        $topSupporters = $supporterTx
            ->groupBy('supporter_id')
            ->map(function ($items) use ($displayCurrency) {
                $total = $items->sum(function ($tx) use ($displayCurrency) {
                    $from = strtoupper($tx->currency ?? 'GBP');
                    $net = (float) ($tx->net_amount ?? 0);
                    $vat = (float) ($tx->vat_amount ?? 0);
                    $gross = $net + $vat;

                    return $from === $displayCurrency ? $gross : \App\Helpers::priceFormat($from, $gross, $displayCurrency);
                });

                $breakdown = $items
                    ->groupBy('source_type')
                    ->mapWithKeys(function ($group, $sourceType) use ($displayCurrency) {
                        $amount = $group->sum(function ($tx) use ($displayCurrency) {
                            $from = strtoupper($tx->currency ?? 'GBP');
                            $net = (float) ($tx->net_amount ?? 0);
                            $vat = (float) ($tx->vat_amount ?? 0);
                            $gross = $net + $vat;

                            return $from === $displayCurrency ? $gross : \App\Helpers::priceFormat($from, $gross, $displayCurrency);
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

                $hasHold = $items->contains(fn($tx) => in_array($tx->status, ['review_hold', 'disputed']));

                $first = $items->first();
                return (object) [
                    'supporter_id' => $first->supporter_id,
                    'total_spent' => $total,
                    'supporter' => $first->supporter,
                    'breakdown' => $breakdown,
                    'has_hold' => $hasHold,
                ];
            })
            ->sortByDesc('total_spent')
            ->take(5)
            ->values();

        // Reserve breakdown with release dates
        $reserveBreakdown = $this->payoutService->getHeldReserves($user->uuid);

        // Payout History
        $payoutHistory = \App\Models\PayoutRecord::where('creator_id', $user->uuid)
            ->latest()
            ->get()
            ->map(function ($p) {
                return [
                    'uuid' => $p->uuid,
                    'date' => $p->created_at->format('d M Y'),
                    'amount' => $p->amount_minor / 100,
                    'currency' => $p->currency,
                    'status' => $p->status,
                    'arrival_date' => $p->arrival_date ? $p->arrival_date->format('d M Y') : null,
                    'failure_reason' => in_array($p->status, ['failed', 'skipped']) ? ($p->failure_message ?: ($p->metadata['error'] ?? 'Declined by Stripe')) : null,
                ];
            });

        // Creator risk level for reserve messaging
        $creatorMetric = CreatorMetric::where('creator_id', $user->uuid)->first();
        $reservePolicy = app(\App\Services\Risk\ReservePolicy::class)->getReservePolicySummary($user, $creatorMetric, now());
        $reserveReason = null;
        if (($reservePolicy['effective_percent'] ?? 0) > 0) {
            if (($reservePolicy['onboarding_percent'] ?? 0) > 0 && ($reservePolicy['risk_level'] ?? null) === 'low') {
                $reserveReason = "New creator reserve ({$reservePolicy['effective_percent']}%) until {$reservePolicy['onboarding_ends_at']}.";
            } elseif (($reservePolicy['risk_level'] ?? null) === 'high') {
                $reserveReason = "High risk reserve applied ({$reservePolicy['effective_percent']}%).";
            } elseif (($reservePolicy['risk_level'] ?? null) === 'medium') {
                $reserveReason = "Medium risk reserve applied ({$reservePolicy['effective_percent']}%).";
            } else {
                $reserveReason = "Rolling reserve applied ({$reservePolicy['effective_percent']}%).";
            }
        }

        $tz = config('app.timezone', 'UTC');
        $nowTz = now($tz);
        $day = (int) $nowTz->dayOfWeekIso;
        $daysSinceFriday = $day >= 5 ? $day - 5 : $day + 2;
        $cycleStart = $nowTz->copy()->startOfDay()->subDays($daysSinceFriday)->startOfDay();
        $cycleEnd = $cycleStart->copy()->addDays(6)->endOfDay();
        $nextPayoutAt = $cycleStart->copy()->addDays(7)->startOfDay();

        return Inertia::render('Creator/Financial/Dashboard', [
            'active_tab' => $tab,
            'summary' => $summary,
            'tax_estimate' => $estimatedTax,
            'tax_year' => $dates['label'],
            'date_range' => [
                'start' => $dates['start']->format('d M Y'),
                'end' => $dates['end']->format('d M Y'),
            ],
            'tax_band_label' => $taxBandLabel,
            'display_currency' => $displayCurrency,
            'profile' => $profile,
            'recent_transactions' => $recentTransactions,
            'top_supporters' => $topSupporters,
            'analytics' => [
                'monthly' => $monthlyStats,
                'tribute_types' => $tributeTypes
            ],
            'status_breakdown' => $statusBreakdown,
            'reserve_breakdown' => $reserveBreakdown['breakdown'] ?? [],
            'reserve_reason' => $reserveReason,
            'reserve_policy' => $reservePolicy,
            'payout_cycle' => [
                'timezone' => $tz,
                'window_start' => $cycleStart->toDateTimeString(),
                'window_end' => $cycleEnd->toDateTimeString(),
                'next_payout_at' => $nextPayoutAt->toDateTimeString(),
            ],
            'payout_history' => $payoutHistory,
        ]);
    }

    public function history(Request $request)
    {
        $user = Auth::user();
        $year = $request->input('year', $this->financialService->getCurrentTaxYear());
        $dates = $this->financialService->getTaxYearDates($year);
        
        // Income (Filtered by Tax Year)
        $income = FinancialTransaction::where('user_id', $user->id)
            ->where('type', 'income')
            ->whereIn('status', ['completed', 'review_hold', 'disputed', 'refunded'])
            ->whereBetween('transaction_date', [$dates['start'], $dates['end']])
            ->with(['supporter:id,name,username,email', 'source' => function($morphTo) {
                $morphTo->morphWith([
                    \App\Models\TaskPurchase::class => ['task'],
                    \App\Models\ShopPayment::class => ['shop', 'deliverable'],
                    \App\Models\StripePaymentItems::class => [],
                    \App\Models\TipGoalsPayment::class => ['tipGoal'],
                    \App\Models\MembershipPayment::class => ['membership'],
                    \App\Models\BillPayment::class => ['bill'],
                ]);
            }])
            ->orderBy('transaction_date', 'desc')
            ->orderBy('id', 'desc')
            ->get();

        // Collect Shop IDs for shipping info
        $shopIds = $income->where('source_type', 'App\Models\ShopPayment')->pluck('source_id')->toArray();
        $shopShipping = [];
        if (!empty($shopIds)) {
            $shopShipping = \App\Models\ShopPayment::whereIn('id', $shopIds)->pluck('shipping_amount', 'id')->toArray();
        }

        $income = $income->map(function ($tx) use ($shopShipping) {
                $tx->display_date = $tx->transaction_date;
                $tx->id = $tx->id;
                $tx->reserve_percent = $tx->net_amount > 0 ? round(($tx->reserve_amount / $tx->net_amount) * 100, 1) : 0;
                
                $base = class_basename($tx->source_type);

                // Get Source Title for description
                $sourceTitle = null;
                if ($base === 'TaskPurchase' && isset($tx->source->task)) {
                    $sourceTitle = $tx->source->task->title;
                } elseif ($base === 'ShopPayment' && isset($tx->source->shop)) {
                    $sourceTitle = $tx->source->shop->name;
                } elseif ($base === 'StripePaymentItems' && isset($tx->source)) {
                    $sourceTitle = $tx->source->wish_name ?? $tx->source->name;
                } elseif ($base === 'MembershipPayment' && isset($tx->source->membership)) {
                    $sourceTitle = $tx->source->membership->level;
                } elseif ($base === 'BillPayment' && isset($tx->source->bill)) {
                    $sourceTitle = $tx->source->bill->name;
                } elseif ($base === 'TipGoalsPayment' && isset($tx->source->tipGoal)) {
                    $sourceTitle = $tx->source->tipGoal->name;
                }

                $tx->label = match($base) {
                    'StripePaymentItems' => 'Wish Gift',
                    'ShopPayment' => 'Shop Purchase',
                    'TipGoalsPayment' => 'Support/Tip',
                    'MembershipPayment' => 'Membership',
                    'TaskPurchase' => 'Task',
                    'BillPayment' => 'Bill',
                    default => str_replace(['Payment', 'Purchase'], '', $base)
                };

                // Update description to include title
                if ($sourceTitle) {
                    $tx->description = $tx->label . ': ' . $sourceTitle;
                }

                // Calculate Creator Gross (Net + VAT) instead of Total Paid (Gross from DB)
                // Note: net_amount for Shop already includes shipping_amount
                $shipping = 0;
                if ($base === 'ShopPayment') {
                    $shipping = (float)($shopShipping[$tx->source_id] ?? 0);
                    if ($shipping > 0) {
                        $tx->shipping_amount = $shipping;
                    }
                }

                $tx->gross_amount = (float)$tx->net_amount + (float)($tx->vat_amount ?? 0);

                // Add item type (digital/physical/instant/timed)
                if ($base === 'ShopPayment' && $tx->source->shop) {
                    $tx->item_type = $tx->source->shop->type === 'physical' ? 'physical' : 'digital';
                } elseif ($base === 'TaskPurchase' && $tx->source->task) {
                    $tx->item_type = $tx->source->task->type === 'instant' ? 'instant' : 'timed';
                }

                // Handling for Task status display in ledger
                if ($base === 'TaskPurchase' && $tx->source) {
                    $tx->item_status = match($tx->source->status) {
                        'completed', 'completed_accepted', 'paid_out' => 'complete',
                        'delivered' => 'delivered',
                        'pending_review' => 'review_pending',
                        'paid', 'assigned' => 'pending',
                        'escalated' => 'escalated',
                        default => $tx->source->status
                    };

                    // Gray out tasks that are not yet finalized (including escalated)
                    if (!in_array($tx->source->status, ['completed', 'completed_accepted', 'paid_out'])) {
                        $tx->is_grayed_out = true;
                    }
                }

                // Handling for Shop status display in ledger
                if ($base === 'ShopPayment' && $tx->source) {
                    $itemStat = $tx->source->deliverable->status ?? 'processing';
                    $tx->item_status = match($itemStat) {
                        'delivered' => 'complete',
                        'shipped' => 'shipped',
                        'processing' => 'processing',
                        default => $itemStat
                    };

                    // Gray out physical shop items that are not yet delivered
                    if (($tx->source->shop->type ?? null) === 'physical' && $itemStat !== 'delivered') {
                        $tx->is_grayed_out = true;
                    }
                }

                return $tx;
            });

        // Expenses (Filtered by Tax Year)
        $expenses = \App\Models\CreatorExpense::where('user_id', $user->id)
            ->whereBetween('expense_date', [$dates['start'], $dates['end']])
            ->orderBy('expense_date', 'desc')
            ->orderBy('id', 'desc')
            ->get()
            ->map(function ($exp) {
                $tx = new \stdClass();
                $tx->id = $exp->id;
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

        $allTransactions = $income->concat($expenses)
            ->sortBy([
                ['display_date', 'desc'],
                ['id', 'desc'],
            ])
            ->values();
        
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
        \Illuminate\Support\Facades\Log::info("CreatorFinancialController: Refreshing records for user {$user->id}");

        try {
            Artisan::call('finance:sync-transactions', [
                '--user_id' => $user->id,
            ]);
            
            \Illuminate\Support\Facades\Log::info("CreatorFinancialController: Sync completed for user {$user->id}");
            return redirect()->route('financial.dashboard')->with('success', 'Financial records refreshed.');
        } catch (\Exception $e) {
            \Illuminate\Support\Facades\Log::error("CreatorFinancialController: Sync failed for user {$user->id}: " . $e->getMessage());
            return redirect()->route('financial.dashboard')->with('error', 'Failed to refresh records: ' . $e->getMessage());
        }
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
            ->whereIn('status', ['completed', 'review_hold', 'disputed', 'refunded'])
            ->with(['source' => function($morphTo) {
                $morphTo->morphWith([
                    \App\Models\TaskPurchase::class => ['task'],
                    \App\Models\ShopPayment::class => ['shop'],
                    \App\Models\StripePaymentItems::class => []
                ]);
            }])
            ->get()
            ->map(function ($transaction) {
                $base = class_basename($transaction->source_type);
                $label = match($base) {
                    'StripePaymentItems' => 'Wish Gift',
                    'ShopPayment' => 'Shop Purchase',
                    'TipGoalsPayment' => 'Support/Tip',
                    'MembershipPayment' => 'Membership',
                    'TaskPurchase' => 'Task',
                    'BillPayment' => 'Bill',
                    default => str_replace(['Payment', 'Purchase'], '', $base)
                };

                // Get Source Title for description
                $sourceTitle = null;
                if ($base === 'TaskPurchase' && isset($transaction->source->task)) {
                    $sourceTitle = $transaction->source->task->title;
                } elseif ($base === 'ShopPayment' && isset($transaction->source->shop)) {
                    $sourceTitle = $transaction->source->shop->name;
                } elseif ($base === 'StripePaymentItems' && isset($transaction->source)) {
                    $sourceTitle = $transaction->source->wish_name ?? $transaction->source->name;
                }

                $description = $transaction->description;
                if ($sourceTitle) {
                    $description = $label . ': ' . $sourceTitle;
                }

                return [
                    'date' => $transaction->transaction_date,
                    'type' => $transaction->type,
                    'category' => 'Income',
                    'description' => $description,
                    'gross_amount' => $transaction->type === 'income' ? ((float)$transaction->net_amount + (float)($transaction->vat_amount ?? 0)) : $transaction->gross_amount,
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
        
        // Use the SAME summary logic as dashboard to ensure consistency
        $displayCurrency = strtoupper($user->default_currency ?? 'GBP');
        $summary = $this->financialService->getSummary($user, $dates['start'], $dates['end'], $displayCurrency);
        $profile = CreatorFinancialProfile::firstOrCreate(['user_id' => $user->id]);

        return Inertia::render('Creator/Financial/Statement', [
            'summary' => $summary,
            'dates' => $dates,
            'profile' => $profile,
            'user' => $user
        ]);
    }
}
