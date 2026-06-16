<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\FounderBonus;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Inertia\Inertia;
use Carbon\Carbon;

class FounderBonusAdminController extends Controller
{
    /**
     * Display the admin dashboard for founder bonuses
     */
    public function index()
    {
        $maxSeats = FounderBonus::getMaxFounderSeats();
        $totalFounders = User::where('is_founder', true)->count();
        $seatsUsed = FounderBonus::whereMonth('qualification_date', now()->month)
            ->whereYear('qualification_date', now()->year)
            ->count();

        $stats = [
            'total_founders'       => $totalFounders,
            'seats_used_this_month'=> $seatsUsed,
            'seats_remaining'      => max(0, $maxSeats - $seatsUsed),
            'max_seats'            => $maxSeats,
            'pending_payouts'      => FounderBonus::where('payout_status', FounderBonus::STATUS_PENDING)->count(),
            'total_bonuses_paid'   => (float) FounderBonus::where('payout_status', FounderBonus::STATUS_PAID)->sum('bonus_amount'),
            'rejected_payouts'     => FounderBonus::where('payout_status', FounderBonus::STATUS_REJECTED)->count(),
            'referral_bonus_count' => FounderBonus::where('referral_multiplier', '>', 1.0)->count(),
            'bonus_percentage'     => round(FounderBonus::getBonusPercentage() * 100, 1),
            'min_earnings'         => FounderBonus::getMinFirst30dEarnings(),
        ];

        $recentBonuses = FounderBonus::with('creator')
            ->orderBy('created_at', 'desc')
            ->limit(10)
            ->get()
            ->map(function ($bonus) {
                return [
                    'id' => $bonus->id,
                    'creator_name' => $bonus->creator?->name,
                    'creator_email' => $bonus->creator?->email,
                    'month' => $bonus->month,
                    'bonus_amount' => $bonus->bonus_amount,
                    'referral_multiplier' => $bonus->referral_multiplier ?? 1.0,
                    'payout_status' => $bonus->payout_status,
                    'paid_date' => $bonus->paid_date,
                    'created_at' => $bonus->created_at,
                ];
            });

        return Inertia::render('Admin/FounderBonus/Index', [
            'stats' => $stats,
            'recentBonuses' => $recentBonuses,
        ]);
    }

    /**
     * Get paginated list of founder bonuses with filters
     */
    public function getBonuses(Request $request)
    {
        $query = FounderBonus::with('creator');

        // Apply filters
        if ($request->has('status') && $request->status !== 'all') {
            $query->where('payout_status', $request->status);
        }

        if ($request->has('month') && $request->month) {
            $query->where('month', $request->month);
        }

        if ($request->has('search') && $request->search) {
            $query->whereHas('creator', function ($q) use ($request) {
                $q->where('name', 'like', '%' . $request->search . '%')
                  ->orWhere('email', 'like', '%' . $request->search . '%');
            });
        }

        $bonuses = $query->orderBy('created_at', 'desc')
            ->paginate(20)
            ->through(function ($bonus) {
                return [
                    'id' => $bonus->id,
                    'creator' => [
                        'id' => $bonus->creator->id,
                        'name' => $bonus->creator->name,
                        'email' => $bonus->creator->email,
                    ],
                    'month' => $bonus->month,
                    'bonus_amount' => $bonus->bonus_amount,
                    'payout_status' => $bonus->payout_status,
                    'paid_date' => $bonus->paid_date,
                    'payout_rejection_reason' => $bonus->payout_rejection_reason,
                    'stripe_transfer_id' => $bonus->stripe_transfer_id,
                    'created_at' => $bonus->created_at,
                ];
            });

        return response()->json($bonuses);
    }

    /**
     * Reject a founder bonus payout
     */
    public function rejectPayout(Request $request, FounderBonus $bonus)
    {
        $request->validate([
            'reason' => 'required|string|max:500',
        ]);

        if ($bonus->payout_status !== FounderBonus::STATUS_PENDING) {
            return response()->json([
                'error' => 'Only pending payouts can be rejected'
            ], 400);
        }

        $bonus->update([
            'payout_status' => FounderBonus::STATUS_REJECTED,
            'payout_rejection_reason' => $request->reason,
        ]);

        // Send rejection email
        $this->sendRejectionEmail($bonus);

        Log::info("Admin rejected founder bonus payout", [
            'bonus_id' => $bonus->id,
            'creator_id' => $bonus->creator_id,
            'reason' => $request->reason,
            'admin_user' => auth()->id(),
        ]);

        return response()->json([
            'message' => 'Payout rejected successfully',
            'bonus' => [
                'id' => $bonus->id,
                'payout_status' => $bonus->payout_status,
                'payout_rejection_reason' => $bonus->payout_rejection_reason,
            ]
        ]);
    }

    /**
     * Update founder bonus settings
     */
    public function updateSettings(Request $request)
    {
        $request->validate([
            'thresholds.min_first_30d_earnings' => 'required|numeric|min:0',
            'thresholds.min_monthly_earnings' => 'required|numeric|min:0',
            'thresholds.max_monthly_earnings' => 'required|numeric|min:0',
            'calculation.qualification_days' => 'required|integer|min:1|max:365',
            'calculation.monthly_calculation_days' => 'required|integer|min:1|max:365',
            'calculation.bonus_percentage' => 'required|numeric|min:0|max:1',
            'limits.max_founder_seats' => 'required|integer|min:1',
            'limits.max_bonus_per_month' => 'required|numeric|min:0',
            'features.enabled' => 'required|boolean',
            'features.auto_qualification' => 'required|boolean',
            'features.email_notifications' => 'required|boolean',
        ]);

        // Settings are env-managed (config/founder_bonus.php reads FOUNDER_* env vars);
        // there is no persistent store for runtime overrides. Say so instead of
        // returning a fake success.
        Log::info("Admin attempted founder bonus settings update (env-managed, not persisted)", [
            'admin_user' => auth()->id(),
            'settings' => $request->all(),
        ]);

        return response()->json([
            'error' => 'Founder bonus settings are managed via environment variables (FOUNDER_*) and cannot be changed from this page. Contact a developer to update them.',
        ], 422);
    }

    /**
     * Get current founder bonus settings
     */
    public function getSettings()
    {
        $settings = [
            'thresholds' => [
                'min_first_30d_earnings' => config('founder_bonus.qualification.min_first_30d_earnings'),
                'min_monthly_earnings' => config('founder_bonus.bonus.min_monthly_earnings'),
                'max_monthly_earnings' => config('founder_bonus.bonus.max_monthly_earnings'),
            ],
            'calculation' => [
                'qualification_days' => config('founder_bonus.qualification.qualification_period_days'),
                'monthly_calculation_days' => config('founder_bonus.qualification.qualification_period_days'),
                'bonus_percentage' => config('founder_bonus.bonus.bonus_percentage'),
            ],
            'limits' => [
                'max_founder_seats' => config('founder_bonus.limits.max_founder_seats'),
                'max_bonus_per_month' => config('founder_bonus.bonus.max_bonus_per_month'),
            ],
            'features' => [
                'enabled' => true,
                'auto_qualification' => true,
                'email_notifications' => config('founder_bonus.features.email_notifications'),
            ],
            'read_only' => true,
        ];

        return response()->json($settings);
    }

    /**
     * Manually trigger founder qualification check
     */
    public function triggerQualificationCheck()
    {
        try {
            // Dispatch the job to check qualifications
            \App\Jobs\CheckFounderQualifications::dispatch();

            Log::info("Admin manually triggered founder qualification check", [
                'admin_user' => auth()->id(),
            ]);

            return response()->json([
                'message' => 'Qualification check triggered successfully'
            ]);
        } catch (\Exception $e) {
            Log::error("Failed to trigger qualification check: " . $e->getMessage());
            
            return response()->json([
                'error' => 'Failed to trigger qualification check'
            ], 500);
        }
    }

    /**
     * Send rejection email to founder
     */
    private function sendRejectionEmail(FounderBonus $bonus)
    {
        if (!$bonus->creator || $bonus->creator->notification_send != 1) {
            return;
        }

        try {
            Mail::send('emails.founder-payout-rejection', [
                'creator' => $bonus->creator,
                'bonus' => $bonus,
                'month' => $bonus->month,
                'amount' => $bonus->bonus_amount,
                'reason' => $bonus->payout_rejection_reason,
            ], function ($message) use ($bonus) {
                $message->to($bonus->creator->email, $bonus->creator->name)
                        ->subject('Founder Bonus Payout Update - ' . $bonus->month);
            });
        } catch (\Exception $e) {
            Log::error("Failed to send rejection email to founder {$bonus->creator_id}: " . $e->getMessage());
        }
    }
}