<?php

namespace App\Http\Controllers;

use App\Helpers;
use App\Models\BillPayment;
use App\Models\CreatorExpense;
use App\Models\CreatorFinancialProfile;
use App\Models\CreatorMetric;
use App\Models\Currency;
use App\Models\FastStartBonusPayout;
use App\Models\FinancialTransaction;
use App\Models\FounderBonus;
use App\Models\FounderBonusMonthly;
use App\Models\MembershipPayment;
use App\Models\PayoutRecord;
use App\Models\PiggyPotContribution;
use App\Models\ShopPayment;
use App\Models\StripePaymentItems;
use App\Models\TaskPurchase;
use App\Models\TipGoalsPayment;
use App\Models\UkTaxSetting;
use App\Services\CreatorOpportunityService;
use App\Services\FinancialService;
use App\Services\Risk\PayoutService;
use App\Services\Risk\ReservePolicy;
use Barryvdh\DomPDF\Facade\Pdf;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Schema;
use Inertia\Inertia;

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
            : Helpers::priceFormat('GBP', $estimatedTaxGbp, $summary['currency']);

        $taxSettings = UkTaxSetting::where('tax_year_start', (int) $year)->first()
            ?: UkTaxSetting::orderByDesc('tax_year_start')->first();
        $taxBandLabel = $taxSettings?->tax_year_label;

        // Analytics Data (Consistent with Tax Year)
        $displayCurrency = $summary['currency'] ?? $displayCurrency ?? 'GBP';

        // Income by Type + Earnings Trend must reflect REALIZED income only — exclude refunded,
        // disputed, review_hold and pending (those are reversed or not-yet-earned). Matches Gross.
        $incomeForAnalytics = FinancialTransaction::where('user_id', $user->id)
            ->where('type', 'income')
            ->where('status', 'completed')
            ->whereBetween('transaction_date', [$dates['start'], $dates['end']])
            ->get(['transaction_date', 'net_amount', 'currency', 'source_type', 'supporter_id', 'source_id', 'vat_amount']);

        // Collect Shop IDs for analytics shipping
        $analyticsShopIds = $incomeForAnalytics->where('source_type', 'App\Models\ShopPayment')->pluck('source_id')->toArray();
        $analyticsShopShipping = [];
        if (! empty($analyticsShopIds)) {
            $analyticsShopShipping = ShopPayment::whereIn('id', $analyticsShopIds)->pluck('shipping_amount', 'id')->toArray();
        }

        $monthlyStats = $incomeForAnalytics
            ->groupBy(function ($tx) {
                return optional($tx->transaction_date)->format('Y-m');
            })
            ->map(function ($items, $month) use ($displayCurrency) {
                $total = $items->sum(function ($tx) use ($displayCurrency) {
                    $from = strtoupper($tx->currency ?? 'GBP');
                    $net = (float) ($tx->net_amount ?? 0);
                    $vat = (float) ($tx->vat_amount ?? 0);
                    $gross = $net + $vat;

                    return $from === $displayCurrency ? $gross : Helpers::priceFormat($from, $gross, $displayCurrency);
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

                    return $from === $displayCurrency ? $gross : Helpers::priceFormat($from, $gross, $displayCurrency);
                });
                $count = $items->count();

                $base = class_basename($sourceType);
                $label = match ($base) {
                    'StripePaymentItems' => 'Wish Content',
                    'ShopPayment' => 'Shop Purchase',
                    'TipGoalsPayment' => 'Content Unlock',
                    'PiggyPotContribution' => 'Piggy Pot',
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
        if (! empty($allShopIds)) {
            $allShopShipping = ShopPayment::whereIn('id', $allShopIds)->pluck('shipping_amount', 'id')->toArray();
        }

        $statusBreakdown = $allStatusTx
            ->groupBy(function ($tx) {
                // If payment is succeeded but item is not completed/delivered, treat as 'pending'
                if ($tx->status === 'completed') {
                    if ($tx->source_type === 'App\Models\TaskPurchase' && $tx->source) {
                        if (! in_array($tx->source->status, ['completed', 'completed_accepted', 'paid_out'])) {
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

                if ($tx->status === 'pending') {
                    if ($tx->source_type === 'App\Models\BillPayment') {
                        return 'unpaid';
                    }
                }

                return $tx->status;
            })
            ->map(function ($items, $status) use ($displayCurrency) {
                $total = $items->sum(function ($tx) use ($displayCurrency) {
                    $from = strtoupper($tx->currency ?? 'GBP');
                    $net = (float) ($tx->net_amount ?? 0);
                    $vat = (float) ($tx->vat_amount ?? 0);
                    $gross = $net + $vat;

                    return $from === $displayCurrency ? $gross : Helpers::priceFormat($from, $gross, $displayCurrency);
                });

                return ['status' => $status, 'count' => $items->count(), 'total' => $total];
            })
            ->values();

        // Recent Transactions (Filtered by Tax Year for overview, All for payouts)
        $incomeQuery = FinancialTransaction::where('user_id', $user->id)
            ->where('type', 'income')
            ->whereIn('status', ['completed', 'review_hold', 'disputed', 'refunded'])
            ->with(['supporter:id,name,username,email', 'source' => function ($morphTo) {
                $morphTo->morphWith([
                    TaskPurchase::class => ['task'],
                    ShopPayment::class => ['shop', 'deliverable'],
                    StripePaymentItems::class => [],
                    TipGoalsPayment::class => ['tipGoal'],
                    PiggyPotContribution::class => ['piggyPot'],
                    MembershipPayment::class => ['membership'],
                    BillPayment::class => ['bill'],
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
        if (! empty($shopIds)) {
            $shopShipping = ShopPayment::whereIn('id', $shopIds)->pluck('shipping_amount', 'id')->toArray();
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
            } elseif ($base === 'PiggyPotContribution' && isset($tx->source->piggyPot)) {
                $sourceTitle = $tx->source->piggyPot->title ?? 'Piggy Pot';
            } elseif ($base === 'TipGoalsPayment' && isset($tx->source->tipGoal)) {
                $sourceTitle = $tx->source->tipGoal->name;
            }

            $tx->label = match ($base) {
                'StripePaymentItems' => 'Wish Content',
                'ShopPayment' => 'Shop Purchase',
                'TipGoalsPayment' => 'Content Unlock',
                'PiggyPotContribution' => 'Piggy Pot',
                'MembershipPayment' => 'Membership',
                'TaskPurchase' => 'Task',
                'BillPayment' => 'Bill',
                default => str_replace(['Payment', 'Purchase'], '', $base)
            };

            // Update description to include title
            if ($sourceTitle) {
                $tx->description = $tx->label.': '.$sourceTitle;
            }

            // Calculate Creator Gross (Net + VAT) instead of Total Paid (Gross from DB)
            // Note: net_amount for Shop already includes shipping_amount
            $shipping = 0;
            if ($base === 'ShopPayment') {
                $shipping = (float) ($shopShipping[$tx->source_id] ?? 0);
                if ($shipping > 0) {
                    $tx->shipping_amount = $shipping;
                }
            }

            $tx->gross_amount = (float) $tx->net_amount + (float) ($tx->vat_amount ?? 0);

            // Add item type (digital/physical/instant/timed)
            if ($base === 'ShopPayment' && $tx->source->shop) {
                $tx->item_type = $tx->source->shop->type === 'physical' ? 'physical' : 'digital';
            } elseif ($base === 'TaskPurchase' && $tx->source->task) {
                $tx->item_type = $tx->source->task->type === 'instant' ? 'instant' : 'timed';
            }

            // Handling for Task status display in ledger
            if ($base === 'TaskPurchase' && $tx->source) {
                $tx->item_status = match ($tx->source->status) {
                    'completed', 'completed_accepted', 'paid_out' => 'complete',
                    'delivered' => 'delivered',
                    'pending_review' => 'review_pending',
                    'paid', 'assigned' => 'pending',
                    'escalated' => 'escalated',
                    default => $tx->source->status
                };

                // Gray out tasks that are not yet finalized (including escalated)
                if (! in_array($tx->source->status, ['completed', 'completed_accepted', 'paid_out'])) {
                    $tx->is_grayed_out = true;
                }
            }

            // Handling for Shop status display in ledger
            if ($base === 'ShopPayment' && $tx->source) {
                $itemStat = $tx->source->deliverable->status ?? 'processing';
                $tx->item_status = match ($itemStat) {
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

        $this->applyPayoutBadges($income);

        $expensesQuery = CreatorExpense::where('user_id', $user->id)
            ->orderBy('expense_date', 'desc')
            ->orderBy('id', 'desc');

        if ($tab !== 'payouts') {
            $expensesQuery->whereBetween('expense_date', [$dates['start'], $dates['end']])->take(20);
        }

        $expenses = $expensesQuery->get()
            ->map(function ($exp) {
                // Mock FinancialTransaction structure for frontend compatibility
                $tx = new \stdClass;
                $tx->id = $exp->id;
                $tx->uuid = 'exp-'.$exp->id;
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

        // Top Supporters = realized contributions only. Exclude refunded/disputed/held/pending so a
        // reversed payment never inflates a supporter's total (matches Gross Earnings).
        $supporterTx = FinancialTransaction::where('user_id', $user->id)
            ->where('type', 'income')
            ->where('status', 'completed')
            ->whereBetween('transaction_date', [$dates['start'], $dates['end']])
            ->whereNotNull('supporter_id')
            ->with(['supporter:id,name,username,avatar'])
            ->get(['supporter_id', 'net_amount', 'currency', 'source_type', 'transaction_date', 'status', 'source_id', 'vat_amount']);

        // Collect Shop IDs for supporter shipping
        $supporterShopIds = $supporterTx->where('source_type', 'App\Models\ShopPayment')->pluck('source_id')->toArray();
        $supporterShopShipping = [];
        if (! empty($supporterShopIds)) {
            $supporterShopShipping = ShopPayment::whereIn('id', $supporterShopIds)->pluck('shipping_amount', 'id')->toArray();
        }

        $topSupporters = $supporterTx
            ->groupBy('supporter_id')
            ->map(function ($items) use ($displayCurrency) {
                $total = $items->sum(function ($tx) use ($displayCurrency) {
                    $from = strtoupper($tx->currency ?? 'GBP');
                    $net = (float) ($tx->net_amount ?? 0);
                    $vat = (float) ($tx->vat_amount ?? 0);
                    $gross = $net + $vat;

                    return $from === $displayCurrency ? $gross : Helpers::priceFormat($from, $gross, $displayCurrency);
                });

                $breakdown = $items
                    ->groupBy('source_type')
                    ->mapWithKeys(function ($group, $sourceType) use ($displayCurrency) {
                        $amount = $group->sum(function ($tx) use ($displayCurrency) {
                            $from = strtoupper($tx->currency ?? 'GBP');
                            $net = (float) ($tx->net_amount ?? 0);
                            $vat = (float) ($tx->vat_amount ?? 0);
                            $gross = $net + $vat;

                            return $from === $displayCurrency ? $gross : Helpers::priceFormat($from, $gross, $displayCurrency);
                        });

                        $base = class_basename($sourceType);
                        $label = match ($base) {
                            'StripePaymentItems' => 'Wish',
                            'ShopPayment' => 'Shop',
                            'TipGoalsPayment' => 'Tips',
                            'PiggyPotContribution' => 'Piggy Pot',
                            'MembershipPayment' => 'Membership',
                            'TaskPurchase' => 'Task',
                            'BillPayment' => 'Bill',
                            default => str_replace(['Payment', 'Purchase'], '', $base)
                        };

                        return [$label => $amount];
                    });

                $hasHold = $items->contains(fn ($tx) => in_array($tx->status, ['review_hold', 'disputed']));

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

        // Reserve breakdown with release dates. Pass displayCurrency so all figures are in the
        // currency the UI labels them with (matches summary.* which are already display-converted).
        $reserveBreakdown = $this->payoutService->getHeldReserves($user->uuid, $displayCurrency);
        $releasedReserves = $this->payoutService->getReleasedReserves($user->uuid, 100, $displayCurrency);
        $upcomingPayout = $this->payoutService->getUpcomingPayoutPreview($user->uuid, $displayCurrency);

        $fastStartBonus = null;
        if ($user->stripe_connected_at) {
            $windowStart = Carbon::parse($user->stripe_connected_at);
            $windowEnd = $windowStart->copy()->addDays((int) config('fast_start_bonus.bonus.window_days', 30));
            $now = now();
            $currency = strtoupper($displayCurrency ?: ($user->default_currency ?? 'GBP'));

            $rates = Currency::rates();
            if ($rates instanceof Collection) {
                $rates = $rates->toArray();
            }
            $convert = function (float $amount, string $from, string $to) use ($rates): float {
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

            if ($now->lt($windowEnd)) {
                $txs = FinancialTransaction::query()
                    ->where('user_id', $user->id)
                    ->where('type', 'income')
                    ->where('status', 'completed')
                    ->whereBetween('transaction_date', [$windowStart, $now])
                    ->get(['net_amount', 'currency']);

                $earnings = 0.0;
                foreach ($txs as $tx) {
                    $from = strtoupper((string) ($tx->currency ?? 'GBP'));
                    $net = (float) ($tx->net_amount ?? 0);
                    $earnings += $convert($net, $from, $currency);
                }

                $earningsMinor = (int) round($earnings * 100);
                $bonusRate = FastStartBonusPayout::resolveRate($earningsMinor);
                $bonus = round($earnings * $bonusRate, 2);
                $fastStartBonus = [
                    'status' => 'active',
                    'currency' => $currency,
                    'window_start' => $windowStart->toDateTimeString(),
                    'window_end' => $windowEnd->toDateTimeString(),
                    'days_remaining' => max(0, $now->diffInDays($windowEnd)),
                    'earnings_so_far' => $earnings,
                    'bonus_so_far' => $bonus,
                    'bonus_rate' => $bonusRate,
                    'tiered_enabled' => (bool) config('fast_start_bonus.bonus.enable_tiered'),
                ];
            } else {
                $row = FastStartBonusPayout::where('creator_uuid', $user->uuid)->latest()->first();
                $fastStartBonus = [
                    'status' => $row?->status ?? 'ready',
                    'currency' => $currency,
                    'window_start' => $windowStart->toDateTimeString(),
                    'window_end' => $windowEnd->toDateTimeString(),
                    'earnings_so_far' => $row ? ($row->earnings_minor / 100) : 0,
                    'bonus_so_far' => $row ? ($row->bonus_minor / 100) : 0,
                ];
            }
        }

        $founderBonus = null;
        $founderQualification = FounderBonus::where('creator_id', $user->id)->latest('qualification_date')->first();
        if ($founderQualification || $user->is_founder) {
            $currency = strtoupper($displayCurrency ?: ($user->default_currency ?? 'GBP'));
            $rates = Currency::rates();
            if ($rates instanceof Collection) {
                $rates = $rates->toArray();
            }
            $convert = function (float $amount, string $from, string $to) use ($rates): float {
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

            $qualifiedAt = $founderQualification?->qualification_date ? Carbon::parse($founderQualification->qualification_date) : null;
            $programEnd = $qualifiedAt ? $qualifiedAt->copy()->addMonthsNoOverflow(12)->endOfDay() : null;
            $isPaused = ! empty($user->payout_paused_at);

            $monthStart = now()->startOfMonth();
            $monthEnd = now()->endOfMonth();
            $calcStart = $monthStart;
            if ($qualifiedAt && $qualifiedAt->gt($calcStart)) {
                $calcStart = $qualifiedAt->copy()->startOfDay();
            }
            $calcEnd = min(now(), $monthEnd);

            $earnings = 0.0;
            if ($calcStart->lte($calcEnd) && (! $programEnd || now()->lte($programEnd))) {
                $txs = FinancialTransaction::query()
                    ->where('user_id', $user->id)
                    ->where('type', 'income')
                    ->where('status', 'completed')
                    ->whereBetween('transaction_date', [$calcStart, $calcEnd])
                    ->get(['net_amount', 'currency']);

                foreach ($txs as $tx) {
                    $from = strtoupper((string) ($tx->currency ?? 'GBP'));
                    $net = (float) ($tx->net_amount ?? 0);
                    $earnings += $convert($net, $from, $currency);
                }
            }

            $minMonthly = (float) FounderBonus::getMinMonthlyEarnings();
            $maxMonthly = (float) FounderBonus::getMaxMonthlyEarnings();
            $bonusPercentage = (float) FounderBonus::getBonusPercentage();
            $maxBonus = (float) FounderBonus::getMaxBonusPerMonth();

            $minMonthlyInCurrency = $convert($minMonthly, 'GBP', $currency);
            $maxMonthlyInCurrency = $convert($maxMonthly, 'GBP', $currency);
            $maxBonusInCurrency = $convert($maxBonus, 'GBP', $currency);

            $bonusSoFar = 0.0;
            if ($earnings >= $minMonthlyInCurrency) {
                $earningsForBonus = min($earnings, $maxMonthlyInCurrency);
                $bonusSoFar = round(min($earningsForBonus * $bonusPercentage, $maxBonusInCurrency), 2);
            }

            $monthsLeft = null;
            if ($qualifiedAt) {
                $endMonth = $qualifiedAt->copy()->addMonthsNoOverflow(12)->startOfMonth();
                $monthsLeft = now()->startOfMonth()->lt($endMonth) ? now()->startOfMonth()->diffInMonths($endMonth) : 0;
            }

            $lastMonthKey = now()->subMonthNoOverflow()->format('Y-m');
            $lastRow = null;
            if (Schema::hasTable('founder_bonus')) {
                $lastRow = FounderBonusMonthly::where('creator_id', $user->id)->where('month', $lastMonthKey)->first();
            }
            $lastPayoutRecord = null;
            if ($lastRow && ! empty($lastRow->payout_record_uuid)) {
                $lastPayoutRecord = PayoutRecord::where('uuid', $lastRow->payout_record_uuid)->first();
            }
            $qualificationPayoutRecord = null;
            if ($founderQualification && ! empty($founderQualification->payout_record_uuid)) {
                $qualificationPayoutRecord = PayoutRecord::where('uuid', $founderQualification->payout_record_uuid)->first();
            }

            $status = 'active';
            if ($isPaused) {
                $status = 'payout_paused';
            } elseif ($programEnd && now()->gt($programEnd)) {
                $status = 'ended';
            }

            $founderBonus = [
                'status' => $status,
                'currency' => $currency,
                'qualified_at' => $qualifiedAt ? $qualifiedAt->toDateString() : null,
                'program_end' => $programEnd ? $programEnd->toDateString() : null,
                'month_start' => $monthStart->toDateString(),
                'month_end' => $monthEnd->toDateString(),
                'earnings_so_far' => $earnings,
                'bonus_so_far' => $bonusSoFar,
                'bonus_percentage' => $bonusPercentage,
                'min_monthly_earnings' => $minMonthlyInCurrency,
                'max_monthly_earnings' => $maxMonthlyInCurrency,
                'max_bonus_per_month' => $maxBonusInCurrency,
                'months_left' => $monthsLeft,
                'last_month' => $lastRow ? [
                    'month' => $lastRow->month,
                    'monthly_earnings' => (float) $convert((float) $lastRow->monthly_earnings, 'GBP', $currency),
                    'bonus_amount' => (float) $convert((float) $lastRow->bonus_amount, 'GBP', $currency),
                    'payout_status' => $lastPayoutRecord?->status ?? $lastRow->payout_status,
                    'payout_date' => $lastPayoutRecord?->arrival_date?->toDateString() ?? ($lastRow->payout_date ? Carbon::parse($lastRow->payout_date)->toDateString() : null),
                    'stripe_payout_id' => $lastPayoutRecord?->stripe_payout_id ?? $lastRow->stripe_payout_id ?? null,
                ] : null,
                'qualification_payout' => $founderQualification ? [
                    'status' => $qualificationPayoutRecord?->status ?? $founderQualification->payout_status,
                    'estimated_payout_date' => $qualificationPayoutRecord?->arrival_date?->toDateString() ?? $founderQualification->estimated_payout_date?->toDateString(),
                    'bonus_amount' => (float) $convert((float) $founderQualification->bonus_amount, 'GBP', $currency),
                    'stripe_payout_id' => $qualificationPayoutRecord?->stripe_payout_id ?? $founderQualification->stripe_payout_id ?? null,
                ] : null,
            ];
        }

        // Payout History
        $payoutHistory = PayoutRecord::where('creator_id', $user->uuid)
            ->latest()
            ->get()
            ->map(function ($p) {
                $bonusMinor = (int) ($p->metadata['fast_start_bonus_applied_minor'] ?? 0);
                $founderBonusMinor = (int) ($p->metadata['founder_bonus_amount_minor'] ?? 0);
                $bonusType = $p->metadata['bonus_type'] ?? null;
                $payoutType = $p->metadata['payout_type'] ?? null;

                // Resolve a friendly payout "type" for the creator.
                if ($payoutType === 'reserve_release') {
                    $typeKey = 'reserve_release';
                    $typeLabel = 'Reserve Release';
                } elseif ($bonusType === 'fast_start') {
                    $typeKey = 'fast_start';
                    $typeLabel = 'Fast Start Bonus';
                } elseif ($bonusType && str_starts_with((string) $bonusType, 'founder')) {
                    $typeKey = 'founder';
                    $typeLabel = $bonusType === 'founder_monthly' ? 'Founder Monthly Bonus' : 'Founder Bonus';
                } else {
                    $typeKey = 'weekly';
                    $typeLabel = 'Weekly Payout';
                }

                // Humanise common Stripe failure messages; keep the raw text too.
                $rawFailure = $p->failure_message ?: ($p->metadata['error'] ?? null);
                $friendlyFailure = null;
                if (in_array($p->status, ['failed', 'skipped'], true)) {
                    $code = (string) ($p->failure_code ?? '');
                    $raw = strtolower((string) $rawFailure);
                    if ($code === 'insufficient_funds' || str_contains($raw, 'insufficient funds')) {
                        $friendlyFailure = 'Payout could not be sent due to a temporary balance issue on our side. No action needed — it will retry automatically.';
                    } elseif ($code === 'account_closed' || str_contains($raw, 'account closed')) {
                        $friendlyFailure = 'Your bank account appears to be closed. Please update your payout details in Stripe.';
                    } elseif ($code === 'no_account' || str_contains($raw, 'no account') || str_contains($raw, 'bank account could not be found')) {
                        $friendlyFailure = 'We couldn\'t find your bank account. Please re-check your payout details in Stripe.';
                    } elseif ($code === 'debit_not_authorized' || str_contains($raw, 'debit_not_authorized')) {
                        $friendlyFailure = 'The payout was not authorised by your bank. Please contact your bank or update your details.';
                    } else {
                        $friendlyFailure = 'This payout failed. Our team has been notified and will look into it.';
                    }
                }

                $ref = $p->stripe_payout_id ?: null;

                return [
                    'uuid' => $p->uuid,
                    'date' => $p->created_at->format('d M Y'),
                    'time' => $p->created_at->format('H:i'),
                    'amount' => $p->amount_minor / 100,
                    'base_amount' => max(0, ($p->amount_minor - $bonusMinor - $founderBonusMinor)) / 100,
                    'fast_start_bonus' => $bonusMinor / 100,
                    'founder_bonus' => $founderBonusMinor / 100,
                    'bonus_type' => $bonusType,
                    'type_key' => $typeKey,
                    'type_label' => $typeLabel,
                    'currency' => $p->currency,
                    'status' => $p->status,
                    'arrival_date' => $p->arrival_date ? $p->arrival_date->format('d M Y') : null,
                    'reference' => $ref,
                    'failure_reason' => $friendlyFailure,
                    'failure_detail' => in_array($p->status, ['failed', 'skipped'], true) ? $rawFailure : null,
                    'failure_code' => $p->failure_code ?? null,
                ];
            });

        // Surface a qualified-but-not-yet-paid Founder Bonus as a scheduled payout row,
        // so the creator can see it in Payout History before the payout is issued.
        // (No PayoutRecord exists until the founder payout job runs on the due date.)
        if (
            $founderQualification
            && in_array((string) $founderQualification->payout_status, [FounderBonus::STATUS_PENDING], true)
            && empty($founderQualification->payout_record_uuid)
            && empty($founderQualification->stripe_payout_id)
        ) {
            $fc = strtoupper($displayCurrency ?: ($user->default_currency ?? 'GBP'));
            $rates = Currency::rates();
            if ($rates instanceof Collection) {
                $rates = $rates->toArray();
            }
            $convertGbp = function (float $amount) use ($rates, $fc): float {
                if ($fc === 'GBP' || ! isset($rates['GBP']) || ! isset($rates[$fc])) {
                    return $amount;
                }

                return ($amount / $rates['GBP']) * $rates[$fc];
            };
            $founderBonusAmt = round($convertGbp((float) ($founderQualification->bonus_amount ?? 0)), 2);
            $est = $founderQualification->estimated_payout_date
                ? Carbon::parse($founderQualification->estimated_payout_date)
                : null;

            $scheduledFounder = [
                'uuid' => 'founder-scheduled-'.$founderQualification->id,
                'date' => $founderQualification->qualification_date
                    ? Carbon::parse($founderQualification->qualification_date)->format('d M Y')
                    : now()->format('d M Y'),
                'time' => null,
                'amount' => $founderBonusAmt,
                'base_amount' => 0,
                'fast_start_bonus' => 0,
                'founder_bonus' => $founderBonusAmt,
                'bonus_type' => 'founder_qualification',
                'type_key' => 'founder',
                'type_label' => 'Founder Bonus',
                'currency' => strtolower($fc),
                'status' => 'scheduled',
                'arrival_date' => $est ? $est->format('d M Y') : null,
                'reference' => null,
                'failure_reason' => null,
                'failure_detail' => null,
                'failure_code' => null,
            ];

            $payoutHistory = collect([$scheduledFounder])->concat($payoutHistory)->values();
        }

        // Creator risk level for reserve messaging
        $creatorMetric = CreatorMetric::where('creator_id', $user->uuid)->first();
        $reservePolicy = app(ReservePolicy::class)->getReservePolicySummary($user, $creatorMetric, now());
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
            // Numeric tax-year start for the statement download endpoint ('year' must
            // validate as integer — the display label above is "2025-2026" and would 422).
            'tax_year_number' => (int) $year,
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
                'tribute_types' => $tributeTypes,
            ],
            'status_breakdown' => $statusBreakdown,
            'reserve_breakdown' => $reserveBreakdown['breakdown'] ?? [],
            'reserve_total_held' => $reserveBreakdown['total_held'] ?? 0,
            'reserve_released_breakdown' => $releasedReserves['breakdown'] ?? [],
            'reserve_total_released' => $releasedReserves['total_released'] ?? 0,
            'upcoming_payout' => $upcomingPayout,
            'reserve_reason' => $reserveReason,
            'reserve_policy' => $reservePolicy,
            'payout_cycle' => [
                'timezone' => $tz,
                'window_start' => $cycleStart->toDateTimeString(),
                'window_end' => $cycleEnd->toDateTimeString(),
                'next_payout_at' => $nextPayoutAt->toDateTimeString(),
            ],
            'payout_history' => $payoutHistory,
            'fast_start_bonus' => $fastStartBonus,
            'founder_bonus' => $founderBonus,
        ]);
    }

    public function fastStartBonus(Request $request)
    {
        $user = Auth::user();

        if (! $user->stripe_connected_at) {
            return Inertia::render('Creator/Financial/FastStartBonus', [
                'fast_start_bonus' => null,
            ]);
        }

        $windowDays = (int) config('fast_start_bonus.bonus.window_days', 30);
        $settlementBuffer = (int) config('fast_start_bonus.bonus.settlement_buffer_days', 7);
        $windowStart = Carbon::parse($user->stripe_connected_at);
        $windowEnd = $windowStart->copy()->addDays($windowDays);
        $eligibleAt = $windowEnd->copy()->addDays($settlementBuffer);
        $now = now();

        $currency = strtoupper($user->default_currency ?? 'GBP');

        $rates = Currency::rates();
        if ($rates instanceof Collection) {
            $rates = $rates->toArray();
        }
        $convert = function (float $amount, string $from, string $to) use ($rates): float {
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

        $row = FastStartBonusPayout::where('creator_uuid', $user->uuid)->latest()->first();

        $windowActive = $now->lt($windowEnd);

        // Compute live earnings (used when window is open or no row yet)
        $liveEarningsMinor = 0;
        if ($windowActive || ! $row) {
            $txs = FinancialTransaction::query()
                ->where('user_id', $user->id)
                ->where('type', 'income')
                ->where('status', 'completed')
                ->whereBetween('transaction_date', [$windowStart, $windowActive ? $now : $windowEnd])
                ->get(['net_amount', 'currency']);

            foreach ($txs as $tx) {
                $from = strtoupper((string) ($tx->currency ?? 'GBP'));
                $liveEarningsMinor += (int) round($convert((float) $tx->net_amount, $from, $currency) * 100);
            }
        }

        $earningsMinor = $row ? (int) $row->earnings_minor : $liveEarningsMinor;
        $bonusRate = FastStartBonusPayout::resolveRate($earningsMinor);
        $bonusMinor = (int) round($earningsMinor * $bonusRate);

        // Tiered info for display
        $tieredRates = config('fast_start_bonus.bonus.tiered_rates', []);
        $tieredEnabled = (bool) config('fast_start_bonus.bonus.enable_tiered');
        $tiers = [];
        if ($tieredEnabled) {
            foreach ($tieredRates as $idx => $tier) {
                $nextThreshold = $tieredRates[$idx + 1]['threshold'] ?? null;
                $tiers[] = [
                    'threshold_minor' => $tier['threshold'],
                    'threshold' => $tier['threshold'] / 100,
                    'next_threshold' => $nextThreshold ? $nextThreshold / 100 : null,
                    'rate' => $tier['rate'],
                    'rate_pct' => round($tier['rate'] * 100, 1),
                    'active' => $earningsMinor >= $tier['threshold'] && (! $nextThreshold || $earningsMinor < $nextThreshold),
                    'reached' => $earningsMinor >= $tier['threshold'],
                ];
            }
        }

        $data = [
            'status' => $windowActive ? 'active' : ($row?->status ?? 'pending_settlement'),
            'currency' => $currency,
            'window_start' => $windowStart->toDateTimeString(),
            'window_end' => $windowEnd->toDateTimeString(),
            'eligible_at' => $eligibleAt->toDateTimeString(),
            'days_remaining' => $windowActive ? max(0, (int) $now->diffInDays($windowEnd)) : 0,
            'hours_remaining' => $windowActive ? max(0, (int) $now->diffInHours($windowEnd)) : 0,
            'window_active' => $windowActive,
            'earnings_so_far' => $earningsMinor / 100,
            'bonus_so_far' => $bonusMinor / 100,
            'bonus_rate' => $bonusRate,
            'bonus_rate_pct' => round($bonusRate * 100, 1),
            'tiered_enabled' => $tieredEnabled,
            'tiers' => $tiers,
            'stripe_transfer_id' => $row?->stripe_transfer_id,
            'stripe_payout_id' => $row?->stripe_payout_id,
            'paid_at' => $row?->paid_at?->toDateTimeString(),
            'final_earnings' => $row ? ($row->earnings_minor / 100) : null,
            'final_bonus' => $row ? ($row->bonus_minor / 100) : null,
            'expected_bonus' => $row ? ($row->expected_bonus_minor / 100) : null,
            'clawback' => $row ? ($row->clawback_minor / 100) : null,
        ];

        return Inertia::render('Creator/Financial/FastStartBonus', [
            'fast_start_bonus' => $data,
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
            ->with(['supporter:id,name,username,email', 'source' => function ($morphTo) {
                $morphTo->morphWith([
                    TaskPurchase::class => ['task'],
                    ShopPayment::class => ['shop', 'deliverable'],
                    StripePaymentItems::class => [],
                    TipGoalsPayment::class => ['tipGoal'],
                    PiggyPotContribution::class => ['piggyPot'],
                    MembershipPayment::class => ['membership'],
                    BillPayment::class => ['bill'],
                ]);
            }])
            ->orderBy('transaction_date', 'desc')
            ->orderBy('id', 'desc')
            ->get();

        // Collect Shop IDs for shipping info
        $shopIds = $income->where('source_type', 'App\Models\ShopPayment')->pluck('source_id')->toArray();
        $shopShipping = [];
        if (! empty($shopIds)) {
            $shopShipping = ShopPayment::whereIn('id', $shopIds)->pluck('shipping_amount', 'id')->toArray();
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
            } elseif ($base === 'PiggyPotContribution' && isset($tx->source->piggyPot)) {
                $sourceTitle = $tx->source->piggyPot->title ?? 'Piggy Pot';
            } elseif ($base === 'TipGoalsPayment' && isset($tx->source->tipGoal)) {
                $sourceTitle = $tx->source->tipGoal->name;
            }

            $tx->label = match ($base) {
                'StripePaymentItems' => 'Wish Content',
                'ShopPayment' => 'Shop Purchase',
                'TipGoalsPayment' => 'Content Unlock',
                'PiggyPotContribution' => 'Piggy Pot',
                'MembershipPayment' => 'Membership',
                'TaskPurchase' => 'Task',
                'BillPayment' => 'Bill',
                default => str_replace(['Payment', 'Purchase'], '', $base)
            };

            // Update description to include title
            if ($sourceTitle) {
                $tx->description = $tx->label.': '.$sourceTitle;
            }

            // Calculate Creator Gross (Net + VAT) instead of Total Paid (Gross from DB)
            // Note: net_amount for Shop already includes shipping_amount
            $shipping = 0;
            if ($base === 'ShopPayment') {
                $shipping = (float) ($shopShipping[$tx->source_id] ?? 0);
                if ($shipping > 0) {
                    $tx->shipping_amount = $shipping;
                }
            }

            $tx->gross_amount = (float) $tx->net_amount + (float) ($tx->vat_amount ?? 0);

            // Add item type (digital/physical/instant/timed)
            if ($base === 'ShopPayment' && $tx->source->shop) {
                $tx->item_type = $tx->source->shop->type === 'physical' ? 'physical' : 'digital';
            } elseif ($base === 'TaskPurchase' && $tx->source->task) {
                $tx->item_type = $tx->source->task->type === 'instant' ? 'instant' : 'timed';
            }

            // Handling for Task status display in ledger
            if ($base === 'TaskPurchase' && $tx->source) {
                $tx->item_status = match ($tx->source->status) {
                    'completed', 'completed_accepted', 'paid_out' => 'complete',
                    'delivered' => 'delivered',
                    'pending_review' => 'review_pending',
                    'paid', 'assigned' => 'pending',
                    'escalated' => 'escalated',
                    default => $tx->source->status
                };

                // Gray out tasks that are not yet finalized (including escalated)
                if (! in_array($tx->source->status, ['completed', 'completed_accepted', 'paid_out'])) {
                    $tx->is_grayed_out = true;
                }
            }

            // Handling for Shop status display in ledger
            if ($base === 'ShopPayment' && $tx->source) {
                $itemStat = $tx->source->deliverable->status ?? 'processing';
                $tx->item_status = match ($itemStat) {
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

        $this->applyPayoutBadges($income);

        // Expenses (Filtered by Tax Year)
        $expenses = CreatorExpense::where('user_id', $user->id)
            ->whereBetween('expense_date', [$dates['start'], $dates['end']])
            ->orderBy('expense_date', 'desc')
            ->orderBy('id', 'desc')
            ->get()
            ->map(function ($exp) {
                $tx = new \stdClass;
                $tx->id = $exp->id;
                $tx->uuid = 'exp-'.$exp->id;
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

        $transactions = new LengthAwarePaginator(
            $paginated, $total, $perPage, $page, [
                'path' => $request->url(),
                'query' => $request->query(),
            ]
        );

        return Inertia::render('Creator/Financial/History', [
            'transactions' => $transactions,
        ]);
    }

    public function refresh(Request $request)
    {
        $user = Auth::user();
        Log::info("CreatorFinancialController: Refreshing records for user {$user->id}");

        try {
            Artisan::call('finance:sync-transactions', [
                '--user_id' => $user->id,
            ]);

            Log::info("CreatorFinancialController: Sync completed for user {$user->id}");

            return redirect()->route('financial.dashboard')->with('success', 'Financial records refreshed.');
        } catch (\Exception $e) {
            Log::error("CreatorFinancialController: Sync failed for user {$user->id}: ".$e->getMessage());

            return redirect()->route('financial.dashboard')->with('error', 'Failed to refresh records: '.$e->getMessage());
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

        $rates = Currency::whereIn('ISO', $currencies)->pluck('conversion_rate', 'ISO');

        $convert = function ($from, $amount, $to) use ($rates) {
            $from = strtoupper($from ?: $to);
            $to = strtoupper($to ?: $from);
            $amount = (float) $amount;
            if ($from === $to) {
                return $amount;
            }
            if (! isset($rates[$from]) || ! isset($rates[$to])) {
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
            ],
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
            ->with(['source' => function ($morphTo) {
                $morphTo->morphWith([
                    TaskPurchase::class => ['task'],
                    ShopPayment::class => ['shop'],
                    StripePaymentItems::class => [],
                ]);
            }])
            ->get()
            ->map(function ($transaction) {
                $base = class_basename($transaction->source_type);
                $label = match ($base) {
                    'StripePaymentItems' => 'Wish Content',
                    'ShopPayment' => 'Shop Purchase',
                    'TipGoalsPayment' => 'Content Unlock',
                    'PiggyPotContribution' => 'Piggy Pot',
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
                    $description = $label.': '.$sourceTitle;
                }

                return [
                    'date' => $transaction->transaction_date,
                    'type' => $transaction->type,
                    'category' => 'Income',
                    'description' => $description,
                    'gross_amount' => $transaction->type === 'income' ? ((float) $transaction->net_amount + (float) ($transaction->vat_amount ?? 0)) : $transaction->gross_amount,
                    'net_amount' => $transaction->net_amount,
                    'currency' => $transaction->currency,
                    'status' => $transaction->status,
                ];
            });

        $expenses = CreatorExpense::where('user_id', $user->id)
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
            'Content-type' => 'text/csv',
            'Content-Disposition' => "attachment; filename=$filename",
            'Pragma' => 'no-cache',
            'Cache-Control' => 'must-revalidate, post-check=0, pre-check=0',
            'Expires' => '0',
        ];

        $columns = ['Date', 'Type', 'Category', 'Description', 'Amount', 'Currency', 'Status'];

        $callback = function () use ($merged, $columns) {
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
                    $row['status'],
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
            'user' => $user,
        ]);
    }

    /**
     * Revenue Opportunity Centre — who a creator's best supporters are, who is
     * drifting, and what to do next. Read-only; every suggestion is advisory.
     */
    public function opportunities(Request $request)
    {
        $user = Auth::user();
        $displayCurrency = strtoupper($request->cookie('currency', $user->default_currency ?? 'GBP'));

        $data = app(CreatorOpportunityService::class)->for($user, $displayCurrency);

        if ($request->wantsJson()) {
            return response()->json($data);
        }

        return Inertia::render('Creator/Financial/Opportunities', $data);
    }

    /**
     * One-Click Earnings Statement download (PDF or CSV).
     *
     * Periods: month (YYYY-MM), tax_year (existing UK tax-year format),
     * or custom (from/to, max 366 days). Totals reuse FinancialService::getSummary()
     * so the statement always matches the dashboard numbers.
     */
    public function downloadStatement(Request $request)
    {
        $validated = $request->validate([
            'period' => 'required|in:month,tax_year,custom',
            'month' => 'required_if:period,month|date_format:Y-m',
            'year' => 'required_if:period,tax_year|integer|min:2020|max:2100',
            'from' => 'required_if:period,custom|date_format:Y-m-d',
            'to' => 'required_if:period,custom|date_format:Y-m-d|after_or_equal:from',
            'format' => 'required|in:pdf,csv',
        ]);

        $user = Auth::user();

        [$start, $end, $periodLabel] = $this->resolveStatementRange($validated);

        // Guard: cap custom ranges at 366 days so a bad request can't build a giant document.
        if ($start->diffInDays($end) > 366) {
            return response()->json(['message' => 'Date range cannot exceed 12 months.'], 422);
        }

        $data = $this->buildStatementData($user, $start, $end, $periodLabel);

        $slug = $start->format('Y-m-d').'_'.$end->format('Y-m-d');

        if ($validated['format'] === 'csv') {
            return $this->streamStatementCsv($data, "earnings-statement-{$slug}.csv");
        }

        $pdf = Pdf::loadView('pdf.earnings-statement', $data)
            ->setPaper('a4', 'portrait');

        return $pdf->download("earnings-statement-{$slug}.pdf");
    }

    /** Resolve the requested statement period into [start, end, label]. */
    private function resolveStatementRange(array $validated): array
    {
        switch ($validated['period']) {
            case 'month':
                // Parse with an explicit day: 'Y-m' alone inherits the CURRENT day-of-month,
                // which overflows short months (requesting Feb on Jan 31 would yield March).
                $start = Carbon::createFromFormat('Y-m-d', $validated['month'].'-01')->startOfMonth();
                $end = $start->copy()->endOfMonth();

                return [$start, $end, $start->format('F Y')];

            case 'tax_year':
                $dates = $this->financialService->getTaxYearDates($validated['year']);
                $start = Carbon::parse($dates['start']);
                $end = Carbon::parse($dates['end']);

                return [$start, $end, 'Tax Year '.$validated['year'].'/'.(substr((string) ($validated['year'] + 1), -2))];

            default: // custom
                $start = Carbon::parse($validated['from'])->startOfDay();
                $end = Carbon::parse($validated['to'])->endOfDay();

                return [$start, $end, $start->format('d M Y').' – '.$end->format('d M Y')];
        }
    }

    /**
     * Assemble everything the statement needs. Summary totals come from
     * FinancialService::getSummary (single source of truth — matches dashboard).
     */
    private function buildStatementData($user, Carbon $start, Carbon $end, string $periodLabel): array
    {
        $displayCurrency = strtoupper($user->default_currency ?? 'GBP');
        $summary = $this->financialService->getSummary($user, $start, $end, $displayCurrency);
        $currency = $summary['currency'] ?? $displayCurrency;

        // Refunds in the period (shown as their own statement line; getSummary counts completed income only).
        $refundTx = FinancialTransaction::where('user_id', $user->id)
            ->where('type', 'income')
            ->where('status', 'refunded')
            ->whereBetween('transaction_date', [$start, $end])
            ->get(['net_amount', 'vat_amount', 'currency']);

        $refundsTotal = 0.0;
        foreach ($refundTx as $tx) {
            $from = strtoupper($tx->currency ?? 'GBP');
            $amount = (float) ($tx->net_amount ?? 0) + (float) ($tx->vat_amount ?? 0);
            $refundsTotal += $from === $currency ? $amount : (float) Helpers::priceFormat($from, $amount, $currency);
        }

        // Payouts whose Stripe payout was created in the period.
        $payouts = PayoutRecord::where('creator_id', $user->uuid)
            ->whereBetween('created_at', [$start, $end])
            ->orderBy('created_at')
            ->get()
            ->map(fn ($p) => [
                'date' => $p->created_at?->format('d M Y'),
                'amount' => ((int) $p->amount_minor) / 100,
                'currency' => strtoupper($p->currency ?? 'GBP'),
                'status' => $p->status,
                'arrival_date' => $p->arrival_date?->format('d M Y'),
            ]);

        $rows = $this->statementTransactionRows($user, $start, $end);

        $profile = CreatorFinancialProfile::firstOrCreate(['user_id' => $user->id]);

        return [
            'user' => $user,
            'entity_name' => $profile->business_name ?: $user->name,
            'period_label' => $periodLabel,
            'range' => ['start' => $start->format('d M Y'), 'end' => $end->format('d M Y')],
            'generated_at' => now()->format('d M Y H:i').' UTC',
            'currency' => $currency,
            'summary' => [
                'gross' => (float) ($summary['gross_income'] ?? 0),
                'fees' => (float) ($summary['fees'] ?? 0),
                'vat' => (float) ($summary['vat_collected'] ?? 0),
                'net' => (float) ($summary['net_income'] ?? 0),
                'refunds' => $refundsTotal,
                'expenses' => (float) ($summary['expenses'] ?? 0),
                'profit' => (float) ($summary['profit'] ?? 0),
            ],
            'payouts' => $payouts,
            'transactions' => $rows['rows'],
            'transactions_truncated' => $rows['truncated'],
        ];
    }

    /**
     * Transaction rows for the statement appendix. Same labelling as exportCsv;
     * kept separate so the existing tax-year CSV export is untouched.
     * Capped at 500 rows to keep the PDF renderable.
     */
    private function statementTransactionRows($user, Carbon $start, Carbon $end): array
    {
        $limit = 500;

        $query = FinancialTransaction::where('user_id', $user->id)
            ->whereBetween('transaction_date', [$start, $end])
            ->whereIn('status', ['completed', 'review_hold', 'disputed', 'refunded'])
            ->orderByDesc('transaction_date');

        $total = (clone $query)->count();

        $rows = $query->limit($limit)->get()
            ->map(function ($transaction) {
                $base = class_basename($transaction->source_type);
                $label = match ($base) {
                    'StripePaymentItems' => 'Wish Content',
                    'ShopPayment' => 'Shop Purchase',
                    'TipGoalsPayment' => 'Content Unlock',
                    'PiggyPotContribution' => 'Piggy Pot',
                    'MembershipPayment' => 'Membership',
                    'TaskPurchase' => 'Task',
                    'BillPayment' => 'Bill',
                    default => str_replace(['Payment', 'Purchase'], '', $base)
                };

                return [
                    'date' => $transaction->transaction_date?->format('Y-m-d'),
                    'type' => $label,
                    'gross' => $transaction->type === 'income'
                        ? ((float) $transaction->net_amount + (float) ($transaction->vat_amount ?? 0))
                        : (float) $transaction->gross_amount,
                    'net' => (float) $transaction->net_amount,
                    'currency' => strtoupper($transaction->currency ?? 'GBP'),
                    'status' => $transaction->status,
                ];
            })
            ->values();

        return ['rows' => $rows, 'truncated' => $total > $limit];
    }

    /** Stream the statement as CSV: summary block, payouts, then transactions. */
    private function streamStatementCsv(array $data, string $filename)
    {
        $headers = [
            'Content-type' => 'text/csv',
            'Content-Disposition' => "attachment; filename=$filename",
            'Pragma' => 'no-cache',
            'Cache-Control' => 'must-revalidate, post-check=0, pre-check=0',
            'Expires' => '0',
        ];

        $callback = function () use ($data) {
            $file = fopen('php://output', 'w');
            $s = $data['summary'];
            $c = $data['currency'];

            fputcsv($file, ['Spenny Piggy Earnings Statement']);
            fputcsv($file, ['Creator', $data['entity_name']]);
            fputcsv($file, ['Period', $data['period_label']]);
            fputcsv($file, ['From', $data['range']['start'], 'To', $data['range']['end']]);
            fputcsv($file, ['Currency', $c]);
            fputcsv($file, ['Generated', $data['generated_at']]);
            fputcsv($file, []);

            fputcsv($file, ['Summary']);
            fputcsv($file, ['Gross earnings', number_format($s['gross'], 2, '.', '')]);
            fputcsv($file, ['Fees (platform + processing)', number_format($s['fees'], 2, '.', '')]);
            fputcsv($file, ['VAT collected', number_format($s['vat'], 2, '.', '')]);
            fputcsv($file, ['Net earnings', number_format($s['net'], 2, '.', '')]);
            fputcsv($file, ['Refunds', number_format($s['refunds'], 2, '.', '')]);
            fputcsv($file, ['Expenses / adjustments', number_format($s['expenses'], 2, '.', '')]);
            fputcsv($file, ['Profit', number_format($s['profit'], 2, '.', '')]);
            fputcsv($file, []);

            fputcsv($file, ['Payouts']);
            fputcsv($file, ['Date', 'Amount', 'Currency', 'Status', 'Arrival date']);
            foreach ($data['payouts'] as $p) {
                fputcsv($file, [$p['date'], number_format($p['amount'], 2, '.', ''), $p['currency'], $p['status'], $p['arrival_date']]);
            }
            fputcsv($file, []);

            fputcsv($file, ['Transactions'.($data['transactions_truncated'] ? ' (first 500 shown)' : '')]);
            fputcsv($file, ['Date', 'Type', 'Gross', 'Net', 'Currency', 'Status']);
            foreach ($data['transactions'] as $row) {
                fputcsv($file, [
                    $row['date'],
                    $row['type'],
                    number_format($row['gross'], 2, '.', ''),
                    number_format($row['net'], 2, '.', ''),
                    $row['currency'],
                    $row['status'],
                ]);
            }

            fclose($file);
        };

        return response()->stream($callback, 200, $headers);
    }

    /**
     * Tag each income transaction with a payout badge:
     *   - 'paid_out'  : already included in an executed payout run (FT.payout_run_id set).
     *   - 'this_week' : eligible for the upcoming weekly run (succeeded, past the 7-day hold,
     *                   fulfilled — i.e. not grayed out).
     * Expenses and non-income rows get no badge.
     */
    private function applyPayoutBadges($income): void
    {
        $payoutCutoff = now()->subDays(7);

        $income->each(function ($tx) use ($payoutCutoff) {
            $tx->payout_badge = null;

            if (! empty($tx->payout_run_id)) {
                $tx->payout_badge = 'paid_out';
            } elseif (($tx->reserve_status ?? null) === 'released') {
                // Reserve releases 30 days AFTER the transaction — the base earning was
                // necessarily paid out before that. A released reserve therefore proves the
                // earning is already paid, even if payout_run_id was never linked (legacy/
                // requeue data gap). Never label it 'this week'.
                $tx->payout_badge = 'paid_out';
            } elseif (
                ($tx->type ?? null) === 'income'
                && ($tx->status ?? null) === 'completed'
                && empty($tx->is_grayed_out)
                && $tx->transaction_date
                && Carbon::parse($tx->transaction_date)->lte($payoutCutoff)
            ) {
                $tx->payout_badge = 'this_week';
            }
        });
    }
}
