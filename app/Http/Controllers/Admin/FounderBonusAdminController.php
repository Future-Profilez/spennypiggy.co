<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Jobs\CheckFounderQualifications;
use App\Jobs\ProcessFounderMonthlyBonuses;
use App\Mail\FounderPayoutRejection;
use App\Models\AuditLog;
use App\Models\FounderBonus;
use App\Models\FounderBonusMonthly;
use App\Models\Setting;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Inertia\Inertia;
use Symfony\Component\HttpFoundation\StreamedResponse;

class FounderBonusAdminController extends Controller
{
    /**
     * Display the admin dashboard for founder bonuses
     */
    public function index()
    {
        $maxSeats = FounderBonus::getMaxFounderSeats();
        $totalFounders = User::where('is_founder', true)->count();
        $seatsUsed = FounderBonus::count();
        $seatsRemaining = max(0, $maxSeats - $seatsUsed);

        // Qualification bonuses stats
        $pendingQualPayouts = FounderBonus::whereIn('payout_status', [FounderBonus::STATUS_PENDING, FounderBonus::STATUS_APPROVED])->count();
        $paidQualBonuses = (float) FounderBonus::where('payout_status', FounderBonus::STATUS_PAID)->sum('bonus_amount');

        // Monthly bonuses stats
        $targetMonth = now()->subMonthNoOverflow()->format('Y-m');
        $confirmedMonthlyLiability = (float) FounderBonusMonthly::where('month', $targetMonth)->sum('bonus_amount');
        $monthlyBonusesPaid = (float) FounderBonusMonthly::where('payout_status', FounderBonusMonthly::STATUS_PAID)->sum('bonus_amount');
        $pendingMonthlyPayouts = FounderBonusMonthly::whereIn('payout_status', [FounderBonusMonthly::STATUS_PENDING, FounderBonusMonthly::STATUS_APPROVED])
            ->where('bonus_amount', '>', 0)
            ->count();

        // Potential liability for current month based on active qualified founders
        $potentialMonthlyLiability = $this->calculatePotentialCurrentMonthLiability();

        $stats = [
            'total_founders' => $totalFounders,
            'max_seats' => $maxSeats,
            'seats_used' => $seatsUsed,
            'seats_remaining' => $seatsRemaining,
            'potential_monthly_liability' => $potentialMonthlyLiability,
            'confirmed_monthly_liability' => $confirmedMonthlyLiability,
            'target_month' => $targetMonth,
            'monthly_bonuses_paid' => $monthlyBonusesPaid,
            'monthly_bonuses_pending' => $pendingMonthlyPayouts,
            'qualification_bonuses_pending' => $pendingQualPayouts,
            'qualification_bonuses_paid' => $paidQualBonuses,
            'total_bonuses_paid' => round($paidQualBonuses + $monthlyBonusesPaid, 2),
            'total_pending_payouts' => $pendingQualPayouts + $pendingMonthlyPayouts,
            'rejected_payouts' => FounderBonus::where('payout_status', FounderBonus::STATUS_REJECTED)->count() +
                FounderBonusMonthly::where('payout_status', FounderBonusMonthly::STATUS_REJECTED)->count(),
            'referral_bonus_count' => FounderBonus::where('referral_multiplier', '>', 1.0)->count(),
            'bonus_percentage' => round(FounderBonus::getBonusPercentage() * 100, 1),
            'min_earnings' => FounderBonus::getMinFirst30dEarnings(),
            'min_monthly_earnings' => FounderBonus::getMinMonthlyEarnings(),
            'max_bonus_per_month' => FounderBonus::getMaxBonusPerMonth(),
            'current_month_label' => now()->format('F Y'),
        ];

        // Available months list for dropdown filtering
        $monthlyMonths = FounderBonusMonthly::distinct()->pluck('month')->toArray();
        $qualMonths = FounderBonus::selectRaw("SUBSTR(qualification_date, 1, 7) as m")
            ->distinct()
            ->pluck('m')
            ->toArray();
        $currentMonthKey = now()->format('Y-m');
        $allMonths = array_values(array_unique(array_filter(array_merge([$currentMonthKey, $targetMonth], $monthlyMonths, $qualMonths))));
        rsort($allMonths);

        // Initial monthly bonuses (top 10)
        $initialMonthlyBonuses = FounderBonusMonthly::with('creator')
            ->orderBy('month', 'desc')
            ->orderBy('created_at', 'desc')
            ->limit(10)
            ->get()
            ->map(function ($b) {
                return [
                    'id' => $b->id,
                    'type' => 'monthly',
                    'creator_id' => $b->creator_id,
                    'creator_name' => $b->creator?->name ?? 'Unknown',
                    'creator_email' => $b->creator?->email ?? '—',
                    'creator_username' => $b->creator?->username ?? '—',
                    'month' => $b->month,
                    'qualifying_amount' => (float) $b->monthly_earnings,
                    'bonus_amount' => (float) $b->bonus_amount,
                    'payout_status' => $b->payout_status,
                    'payment_reference' => $b->payment_reference,
                    'payout_rejection_reason' => $b->payout_rejection_reason,
                    'stripe_transfer_id' => $b->stripe_transfer_id,
                    'stripe_payout_id' => $b->stripe_payout_id,
                    'paid_date' => $b->payout_date ? Carbon::parse($b->payout_date)->format('M j, Y') : null,
                    'created_at' => $b->created_at?->format('M j, Y'),
                ];
            });

        // Initial qualification bonuses (top 10)
        $initialQualificationBonuses = FounderBonus::with('creator')
            ->orderBy('qualification_date', 'desc')
            ->orderBy('created_at', 'desc')
            ->limit(10)
            ->get()
            ->map(function ($b) {
                return [
                    'id' => $b->id,
                    'type' => 'qualification',
                    'creator_id' => $b->creator_id,
                    'creator_name' => $b->creator?->name ?? 'Unknown',
                    'creator_email' => $b->creator?->email ?? '—',
                    'creator_username' => $b->creator?->username ?? '—',
                    'month' => $b->qualification_date ? Carbon::parse($b->qualification_date)->format('Y-m') : '—',
                    'qualification_date' => $b->qualification_date ? Carbon::parse($b->qualification_date)->format('M j, Y') : '—',
                    'qualifying_amount' => (float) $b->first_30d_earnings,
                    'bonus_amount' => (float) $b->bonus_amount,
                    'referral_multiplier' => (float) ($b->referral_multiplier ?? 1.0),
                    'payout_status' => $b->payout_status,
                    'payment_reference' => $b->payment_reference,
                    'payout_rejection_reason' => $b->payout_rejection_reason,
                    'stripe_transfer_id' => $b->stripe_transfer_id,
                    'stripe_payout_id' => $b->stripe_payout_id,
                    'paid_date' => $b->paid_date ? Carbon::parse($b->paid_date)->format('M j, Y') : null,
                    'created_at' => $b->created_at?->format('M j, Y'),
                ];
            });

        return Inertia::render('Admin/FounderBonus/Index', [
            'stats' => $stats,
            'availableMonths' => $allMonths,
            'initialMonthlyBonuses' => $initialMonthlyBonuses,
            'initialQualificationBonuses' => $initialQualificationBonuses,
        ]);
    }

    /**
     * Get paginated list of founder bonuses with filters
     */
    public function getBonuses(Request $request): JsonResponse
    {
        $type = $request->query('type', 'monthly');
        $status = $request->query('status', 'all');
        $month = $request->query('month');
        $search = $request->query('search');

        if ($type === 'monthly') {
            $query = FounderBonusMonthly::with('creator');

            if ($status && $status !== 'all') {
                $query->where('payout_status', $status);
            }

            if ($month && $month !== 'all') {
                $query->where('month', $month);
            }

            if ($search) {
                $query->whereHas('creator', function ($q) use ($search) {
                    $q->where('name', 'like', "%{$search}%")
                        ->orWhere('email', 'like', "%{$search}%")
                        ->orWhere('username', 'like', "%{$search}%");
                });
            }

            $bonuses = $query->orderBy('month', 'desc')
                ->orderBy('created_at', 'desc')
                ->paginate(20)
                ->through(function ($b) {
                    return [
                        'id' => $b->id,
                        'type' => 'monthly',
                        'creator' => [
                            'id' => $b->creator?->id,
                            'name' => $b->creator?->name ?? 'Unknown',
                            'email' => $b->creator?->email ?? '—',
                            'username' => $b->creator?->username ?? '—',
                            'avatar_url' => $b->creator?->avatar_url,
                        ],
                        'month' => $b->month,
                        'qualifying_amount' => (float) $b->monthly_earnings,
                        'bonus_amount' => (float) $b->bonus_amount,
                        'payout_status' => $b->payout_status,
                        'payment_reference' => $b->payment_reference,
                        'payout_rejection_reason' => $b->payout_rejection_reason,
                        'stripe_transfer_id' => $b->stripe_transfer_id,
                        'stripe_payout_id' => $b->stripe_payout_id,
                        'paid_date' => $b->payout_date ? Carbon::parse($b->payout_date)->format('M j, Y') : null,
                        'created_at' => $b->created_at?->format('M j, Y'),
                    ];
                });

            return response()->json($bonuses);
        }

        // Qualification bonuses
        $query = FounderBonus::with('creator');

        if ($status && $status !== 'all') {
            $query->where('payout_status', $status);
        }

        if ($month && $month !== 'all') {
            $query->where('qualification_date', 'like', "{$month}%");
        }

        if ($search) {
            $query->whereHas('creator', function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('email', 'like', "%{$search}%")
                    ->orWhere('username', 'like', "%{$search}%");
            });
        }

        $bonuses = $query->orderBy('qualification_date', 'desc')
            ->orderBy('created_at', 'desc')
            ->paginate(20)
            ->through(function ($b) {
                return [
                    'id' => $b->id,
                    'type' => 'qualification',
                    'creator' => [
                        'id' => $b->creator?->id,
                        'name' => $b->creator?->name ?? 'Unknown',
                        'email' => $b->creator?->email ?? '—',
                        'username' => $b->creator?->username ?? '—',
                        'avatar_url' => $b->creator?->avatar_url,
                    ],
                    'month' => $b->qualification_date ? Carbon::parse($b->qualification_date)->format('Y-m') : '—',
                    'qualification_date' => $b->qualification_date ? Carbon::parse($b->qualification_date)->format('M j, Y') : '—',
                    'qualifying_amount' => (float) $b->first_30d_earnings,
                    'bonus_amount' => (float) $b->bonus_amount,
                    'referral_multiplier' => (float) ($b->referral_multiplier ?? 1.0),
                    'payout_status' => $b->payout_status,
                    'payment_reference' => $b->payment_reference,
                    'payout_rejection_reason' => $b->payout_rejection_reason,
                    'stripe_transfer_id' => $b->stripe_transfer_id,
                    'stripe_payout_id' => $b->stripe_payout_id,
                    'paid_date' => $b->paid_date ? Carbon::parse($b->paid_date)->format('M j, Y') : null,
                    'created_at' => $b->created_at?->format('M j, Y'),
                ];
            });

        return response()->json($bonuses);
    }

    /**
     * Approve a founder bonus payout (mark as approved)
     */
    public function approvePayout(Request $request, string $type, int $id): JsonResponse
    {
        $bonus = $this->resolveBonusModel($type, $id);
        if (! $bonus) {
            return response()->json(['error' => 'Bonus record not found'], 404);
        }

        if ($bonus->payout_status !== FounderBonus::STATUS_PENDING) {
            return response()->json([
                'error' => 'Only pending payouts can be approved',
            ], 400);
        }

        $bonus->update([
            'payout_status' => FounderBonus::STATUS_APPROVED,
        ]);

        AuditLog::create([
            'actor' => 'admin:'.(auth()->id() ?? 'system'),
            'action_type' => 'FOUNDER_BONUS_APPROVED',
            'entity_type' => get_class($bonus),
            'entity_id' => (string) $bonus->id,
            'reference_id' => (string) $bonus->id,
            'reason_code' => $request->input('reason', 'ADMIN_APPROVAL'),
            'metadata_json' => [
                'type' => $type,
                'creator_id' => $bonus->creator_id,
                'bonus_amount' => (float) $bonus->bonus_amount,
                'month' => $bonus->month ?? ($bonus->qualification_date ? Carbon::parse($bonus->qualification_date)->format('Y-m') : null),
            ],
        ]);

        Log::info('Admin approved founder bonus payout', [
            'type' => $type,
            'bonus_id' => $bonus->id,
            'creator_id' => $bonus->creator_id,
            'admin_user' => auth()->id(),
        ]);

        return response()->json([
            'message' => 'Payout approved successfully',
            'bonus' => [
                'id' => $bonus->id,
                'type' => $type,
                'payout_status' => $bonus->payout_status,
            ],
        ]);
    }

    /**
     * Reject a founder bonus payout
     */
    public function rejectPayout(Request $request, string $type, int $id): JsonResponse
    {
        $request->validate([
            'reason' => 'required|string|max:500',
        ]);

        $bonus = $this->resolveBonusModel($type, $id);
        if (! $bonus) {
            return response()->json(['error' => 'Bonus record not found'], 404);
        }

        if ($bonus->payout_status === FounderBonus::STATUS_PAID) {
            return response()->json([
                'error' => 'Paid payouts cannot be rejected',
            ], 400);
        }

        $bonus->update([
            'payout_status' => FounderBonus::STATUS_REJECTED,
            'payout_rejection_reason' => $request->reason,
        ]);

        // Send rejection email via robust Mailable
        $this->sendRejectionEmail($bonus);

        AuditLog::create([
            'actor' => 'admin:'.(auth()->id() ?? 'system'),
            'action_type' => 'FOUNDER_BONUS_REJECTED',
            'entity_type' => get_class($bonus),
            'entity_id' => (string) $bonus->id,
            'reference_id' => (string) $bonus->id,
            'reason_code' => 'ADMIN_REJECTION',
            'metadata_json' => [
                'type' => $type,
                'creator_id' => $bonus->creator_id,
                'bonus_amount' => (float) $bonus->bonus_amount,
                'reason' => $request->reason,
            ],
        ]);

        Log::info('Admin rejected founder bonus payout', [
            'type' => $type,
            'bonus_id' => $bonus->id,
            'creator_id' => $bonus->creator_id,
            'reason' => $request->reason,
            'admin_user' => auth()->id(),
        ]);

        return response()->json([
            'message' => 'Payout rejected successfully',
            'bonus' => [
                'id' => $bonus->id,
                'type' => $type,
                'payout_status' => $bonus->payout_status,
                'payout_rejection_reason' => $bonus->payout_rejection_reason,
            ],
        ]);
    }

    /**
     * Mark a payout as paid with a payment reference (manual wire / Stripe ref)
     */
    public function markAsPaid(Request $request, string $type, int $id): JsonResponse
    {
        $request->validate([
            'payment_reference' => 'required|string|max:255',
            'reason' => 'nullable|string|max:255',
        ]);

        $bonus = $this->resolveBonusModel($type, $id);
        if (! $bonus) {
            return response()->json(['error' => 'Bonus record not found'], 404);
        }

        if ($bonus->payout_status === FounderBonus::STATUS_PAID) {
            return response()->json([
                'error' => 'This payout is already marked as paid',
            ], 400);
        }

        $paymentRef = trim($request->payment_reference);
        $bonus->markAsPaid($paymentRef);

        AuditLog::create([
            'actor' => 'admin:'.(auth()->id() ?? 'system'),
            'action_type' => 'FOUNDER_BONUS_MARKED_PAID',
            'entity_type' => get_class($bonus),
            'entity_id' => (string) $bonus->id,
            'reference_id' => (string) $bonus->id,
            'payment_refs' => [$paymentRef],
            'reason_code' => $request->input('reason', 'MANUAL_PAYMENT_SETTLED'),
            'metadata_json' => [
                'type' => $type,
                'creator_id' => $bonus->creator_id,
                'bonus_amount' => (float) $bonus->bonus_amount,
                'payment_reference' => $paymentRef,
            ],
        ]);

        Log::info('Admin marked founder bonus as paid', [
            'type' => $type,
            'bonus_id' => $bonus->id,
            'creator_id' => $bonus->creator_id,
            'payment_reference' => $paymentRef,
            'admin_user' => auth()->id(),
        ]);

        return response()->json([
            'message' => 'Payout marked as paid successfully',
            'bonus' => [
                'id' => $bonus->id,
                'type' => $type,
                'payout_status' => $bonus->payout_status,
                'payment_reference' => $bonus->payment_reference,
            ],
        ]);
    }

    /**
     * Manually trigger founder qualification check
     */
    public function triggerQualificationCheck(): JsonResponse
    {
        try {
            $beforeCount = FounderBonus::count();

            // Run synchronously so admin receives instant feedback on how many new founders qualified
            (new CheckFounderQualifications)->handle();

            $afterCount = FounderBonus::count();
            $newQualified = max(0, $afterCount - $beforeCount);

            AuditLog::create([
                'actor' => 'admin:'.(auth()->id() ?? 'system'),
                'action_type' => 'FOUNDER_QUALIFICATION_CHECK_TRIGGERED',
                'reason_code' => 'MANUAL_TRIGGER',
                'metadata_json' => [
                    'new_qualified_count' => $newQualified,
                ],
            ]);

            return response()->json([
                'message' => "Qualification check completed. New founders qualified: {$newQualified}",
                'new_qualified_count' => $newQualified,
            ]);
        } catch (\Exception $e) {
            Log::error('Failed to trigger qualification check: '.$e->getMessage());

            return response()->json([
                'error' => 'Failed to trigger qualification check: '.$e->getMessage(),
            ], 500);
        }
    }

    /**
     * Manually trigger founder monthly bonus calculation
     */
    public function triggerMonthlyCalculation(): JsonResponse
    {
        try {
            $target = now()->subMonthNoOverflow();
            $monthKey = $target->format('Y-m');

            ProcessFounderMonthlyBonuses::dispatch();

            AuditLog::create([
                'actor' => 'admin:'.(auth()->id() ?? 'system'),
                'action_type' => 'FOUNDER_MONTHLY_CALCULATION_TRIGGERED',
                'reason_code' => 'MANUAL_TRIGGER',
                'metadata_json' => [
                    'target_month' => $monthKey,
                ],
            ]);

            return response()->json([
                'message' => "Monthly bonus calculation dispatched for month {$monthKey}.",
                'target_month' => $monthKey,
            ]);
        } catch (\Exception $e) {
            Log::error('Failed to trigger monthly calculation: '.$e->getMessage());

            return response()->json([
                'error' => 'Failed to trigger monthly calculation: '.$e->getMessage(),
            ], 500);
        }
    }

    /**
     * Export Founder Bonus Report to CSV per Spec Section 7
     */
    public function exportCsv(Request $request): StreamedResponse
    {
        $type = $request->query('type', 'all');
        $status = $request->query('status', 'all');
        $month = $request->query('month');

        $filename = 'founder-bonuses-'.now()->format('Y-m-d-His').'.csv';

        return response()->streamDownload(function () use ($type, $status, $month) {
            $handle = fopen('php://output', 'w');
            fputcsv($handle, [
                'Creator Name',
                'Creator Username',
                'Creator Email',
                'Bonus Type',
                'Period / Date',
                'Qualifying Amount (£)',
                'Bonus Amount (£)',
                'Payout Status',
                'Payment Reference',
                'Paid Date',
                'Created At',
            ]);

            // Monthly bonuses
            if ($type === 'all' || $type === 'monthly') {
                $q = FounderBonusMonthly::with('creator');
                if ($status && $status !== 'all') {
                    $q->where('payout_status', $status);
                }
                if ($month && $month !== 'all') {
                    $q->where('month', $month);
                }

                $q->orderBy('month', 'desc')->chunk(100, function ($rows) use ($handle) {
                    foreach ($rows as $r) {
                        fputcsv($handle, [
                            $r->creator?->name ?? 'Unknown',
                            $r->creator?->username ?? '—',
                            $r->creator?->email ?? '—',
                            'Monthly Bonus',
                            $r->month,
                            number_format((float) $r->monthly_earnings, 2, '.', ''),
                            number_format((float) $r->bonus_amount, 2, '.', ''),
                            ucfirst($r->payout_status),
                            $r->payment_reference ?? $r->stripe_payout_id ?? '—',
                            $r->payout_date ? Carbon::parse($r->payout_date)->format('Y-m-d H:i') : '—',
                            $r->created_at?->format('Y-m-d H:i') ?? '—',
                        ]);
                    }
                });
            }

            // Qualification bonuses
            if ($type === 'all' || $type === 'qualification') {
                $q = FounderBonus::with('creator');
                if ($status && $status !== 'all') {
                    $q->where('payout_status', $status);
                }
                if ($month && $month !== 'all') {
                    $q->where('qualification_date', 'like', "{$month}%");
                }

                $q->orderBy('qualification_date', 'desc')->chunk(100, function ($rows) use ($handle) {
                    foreach ($rows as $r) {
                        fputcsv($handle, [
                            $r->creator?->name ?? 'Unknown',
                            $r->creator?->username ?? '—',
                            $r->creator?->email ?? '—',
                            'Qualification Bonus',
                            $r->qualification_date ? Carbon::parse($r->qualification_date)->format('Y-m-d') : '—',
                            number_format((float) $r->first_30d_earnings, 2, '.', ''),
                            number_format((float) $r->bonus_amount, 2, '.', ''),
                            ucfirst($r->payout_status),
                            $r->payment_reference ?? $r->stripe_payout_id ?? '—',
                            $r->paid_date ? Carbon::parse($r->paid_date)->format('Y-m-d H:i') : '—',
                            $r->created_at?->format('Y-m-d H:i') ?? '—',
                        ]);
                    }
                });
            }

            fclose($handle);
        }, $filename, [
            'Content-Type' => 'text/csv; charset=UTF-8',
        ]);
    }

    /**
     * Update founder bonus settings with persistence in Setting model
     */
    public function updateSettings(Request $request): JsonResponse
    {
        $request->validate([
            'thresholds.min_first_30d_earnings' => 'required|numeric|min:0',
            'thresholds.min_monthly_earnings' => 'required|numeric|min:0',
            'thresholds.max_monthly_earnings' => 'required|numeric|min:0',
            'calculation.qualification_days' => 'required|integer|min:1|max:365',
            'calculation.bonus_percentage' => 'required|numeric|min:0|max:1',
            'limits.max_founder_seats' => 'required|integer|min:1',
            'limits.max_bonus_per_month' => 'required|numeric|min:0',
            'features.email_notifications' => 'required|boolean',
        ]);

        // Save runtime overrides using Spenny Piggy's Setting model
        Setting::setValue('founder_min_first_30d_earnings', (string) $request->input('thresholds.min_first_30d_earnings'));
        Setting::setValue('founder_min_monthly_earnings', (string) $request->input('thresholds.min_monthly_earnings'));
        Setting::setValue('founder_max_monthly_earnings', (string) $request->input('thresholds.max_monthly_earnings'));
        Setting::setValue('founder_qualification_days', (string) $request->input('calculation.qualification_days'));
        Setting::setValue('founder_bonus_percentage', (string) $request->input('calculation.bonus_percentage'));
        Setting::setValue('founder_max_seats', (string) $request->input('limits.max_founder_seats'));
        Setting::setValue('founder_max_bonus_per_month', (string) $request->input('limits.max_bonus_per_month'));
        Setting::setValue('founder_email_notifications', $request->boolean('features.email_notifications') ? '1' : '0');

        AuditLog::create([
            'actor' => 'admin:'.(auth()->id() ?? 'system'),
            'action_type' => 'FOUNDER_SETTINGS_UPDATED',
            'reason_code' => 'ADMIN_SETTINGS_UPDATE',
            'metadata_json' => $request->all(),
        ]);

        Log::info('Admin updated founder bonus settings', [
            'admin_user' => auth()->id(),
            'settings' => $request->all(),
        ]);

        return response()->json([
            'message' => 'Founder bonus settings updated and saved successfully.',
            'settings' => $this->getSettingsArray(),
        ]);
    }

    /**
     * Get current founder bonus settings
     */
    public function getSettings(): JsonResponse
    {
        return response()->json($this->getSettingsArray());
    }

    /**
     * Build settings array
     */
    private function getSettingsArray(): array
    {
        return [
            'thresholds' => [
                'min_first_30d_earnings' => FounderBonus::getMinFirst30dEarnings(),
                'min_monthly_earnings' => FounderBonus::getMinMonthlyEarnings(),
                'max_monthly_earnings' => FounderBonus::getMaxMonthlyEarnings(),
            ],
            'calculation' => [
                'qualification_days' => FounderBonus::getQualificationDays(),
                'monthly_calculation_days' => FounderBonus::getQualificationDays(),
                'bonus_percentage' => FounderBonus::getBonusPercentage(),
            ],
            'limits' => [
                'max_founder_seats' => FounderBonus::getMaxFounderSeats(),
                'max_bonus_per_month' => FounderBonus::getMaxBonusPerMonth(),
            ],
            'features' => [
                'enabled' => true,
                'auto_qualification' => true,
                'email_notifications' => (bool) Setting::getValue('founder_email_notifications', config('founder_bonus.features.email_notifications', true)),
            ],
            'read_only' => false,
        ];
    }

    /**
     * Calculate potential bonus liability for current month
     */
    private function calculatePotentialCurrentMonthLiability(): float
    {
        $startOfMonth = now()->startOfMonth();
        $now = now();
        $minMonthly = FounderBonus::getMinMonthlyEarnings();
        $maxMonthly = FounderBonus::getMaxMonthlyEarnings();
        $bonusPercentage = FounderBonus::getBonusPercentage();
        $maxBonus = FounderBonus::getMaxBonusPerMonth();

        $founderUserIds = User::where('is_founder', true)->pluck('id');
        if ($founderUserIds->isEmpty()) {
            return 0.0;
        }

        $liability = 0.0;
        $founders = User::whereIn('id', $founderUserIds)->get();

        foreach ($founders as $founder) {
            $earnings = FounderBonus::calculateCompletedNetEarnings($founder, $startOfMonth, $now, 'GBP');
            if ($earnings >= $minMonthly) {
                $capped = min($earnings, $maxMonthly);
                $liability += round(min($capped * $bonusPercentage, $maxBonus), 2);
            }
        }

        return round($liability, 2);
    }

    /**
     * Resolve bonus model instance by type and ID
     */
    private function resolveBonusModel(string $type, int $id)
    {
        if ($type === 'monthly') {
            return FounderBonusMonthly::with('creator')->find($id);
        }

        if ($type === 'qualification') {
            return FounderBonus::with('creator')->find($id);
        }

        return null;
    }

    /**
     * Send rejection email to founder
     */
    private function sendRejectionEmail($bonus): void
    {
        if (! $bonus->creator || ($bonus->creator->notification_send ?? 1) != 1) {
            return;
        }

        try {
            Mail::to($bonus->creator->email)->send(new FounderPayoutRejection($bonus));
        } catch (\Exception $e) {
            Log::error("Failed to send rejection email to founder {$bonus->creator_id}: ".$e->getMessage());
        }
    }
}
