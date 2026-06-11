<?php

namespace App\Http\Controllers;

use App\Models\FounderBonus;
use App\Models\User;
use Illuminate\Http\Request;
use Inertia\Inertia;

class FounderBonusController extends Controller
{
    /**
     * Display the founder bonus leaderboard
     */
    public function index(Request $request)
    {
        $user = $request->user();
        
        // Get current month's leaderboard data
        $leaderboard = FounderBonus::getCurrentMonthLeaderboard(50);

        $lastMonth = now()->subMonthNoOverflow();
        $previousMonthStart = $lastMonth->copy()->startOfMonth()->toDateString();
        $previousMonthEnd = $lastMonth->copy()->endOfMonth()->toDateString();

        $previousMonthQualifiedCount = FounderBonus::whereBetween('qualification_date', [$previousMonthStart, $previousMonthEnd])->count();
        $previousMonthTotalBonusAmount = (float) FounderBonus::whereBetween('qualification_date', [$previousMonthStart, $previousMonthEnd])->sum('bonus_amount');

        $previousMonthBonuses = FounderBonus::with('creator')
            ->whereBetween('qualification_date', [$previousMonthStart, $previousMonthEnd])
            ->orderByDesc('first_30d_earnings')
            ->limit(50)
            ->get();

        $previousMonthTop = $previousMonthBonuses->first();

        $previousMonthStats = [
            'month' => $lastMonth->format('F Y'),
            'qualified_count' => (int) $previousMonthQualifiedCount,
            'total_bonus_amount' => (float) $previousMonthTotalBonusAmount,
            'top_earnings' => (float) ($previousMonthTop?->first_30d_earnings ?? 0),
            'top_bonus_amount' => (float) ($previousMonthTop?->bonus_amount ?? 0),
            'top_creator' => $previousMonthTop?->creator ? [
                'id' => $previousMonthTop->creator->id,
                'name' => $previousMonthTop->creator->name,
                'username' => $previousMonthTop->creator->username,
                'avatar_url' => $previousMonthTop->creator->avatar_url ?? null,
                'profile_status_lock' => $previousMonthTop->creator->profile_status_lock ?? null,
                'role' => $previousMonthTop->creator->role ?? null,
            ] : null,
        ];

        $recentWinners = FounderBonus::with('creator')
            ->where('qualification_date', '>=', now()->subDays(7)->toDateString())
            ->orderByDesc('qualification_date')
            ->limit(10)
            ->get()
            ->map(function ($bonus) {
                return [
                    'id' => $bonus->id,
                    'qualification_date' => $bonus->qualification_date,
                    'first_30d_earnings' => (float) $bonus->first_30d_earnings,
                    'bonus_amount' => (float) $bonus->bonus_amount,
                    'payout_status' => $bonus->payout_status,
                    'creator' => $bonus->creator ? [
                        'id' => $bonus->creator->id,
                        'name' => $bonus->creator->name,
                        'username' => $bonus->creator->username,
                        'avatar_url' => $bonus->creator->avatar_url ?? null,
                        'profile_status_lock' => $bonus->creator->profile_status_lock ?? null,
                        'role' => $bonus->creator->role ?? null,
                    ] : null,
                ];
            });
        
        // Get program statistics
        $totalFounders = FounderBonus::getTotalFounderCount();
        $availableSeats = FounderBonus::getAvailableSeats();
        $maxSeats = FounderBonus::getMaxFounderSeats();
        $minEarnings = FounderBonus::getMinFirst30dEarnings();
        $bonusPercentage = FounderBonus::getBonusPercentage();

        // Initialize user status variables
        $userInRace = false;
        $userProgress = null;
        $founderBonusData = null;
        $userMissed = null;
        
        if ($user) {
            // Check if user is already a founder
            if ($user->is_founder) {
                // Get founder bonus data
                $founderBonus = FounderBonus::where('creator_id', $user->id)->first();
                if ($founderBonus) {
                    $founderBonusData = [
                        'qualification_date' => $founderBonus->qualification_date,
                        'first_30d_earnings' => $founderBonus->first_30d_earnings,
                        'bonus_amount' => $founderBonus->bonus_amount,
                        'estimated_payout_date' => $founderBonus->estimated_payout_date,
                        'paid_date' => $founderBonus->paid_date,
                        'payout_status' => $founderBonus->payout_status,
                        'rejection_reason' => $founderBonus->payout_rejection_reason,
                        'formatted_paid_date' => $founderBonus->formatted_paid_date,
                    ];
                }
            } else {
                // Check if user is within their 30-day qualification window
                $qualificationDays = FounderBonus::getQualificationDays();
                $joinDate = $user->stripe_connected_at;
                $thirtyDaysLater = $joinDate ? $joinDate->copy()->addDays($qualificationDays) : null;
                $isWithin30Days = $thirtyDaysLater ? now()->lessThan($thirtyDaysLater) : false;
                
                if ($isWithin30Days) {
                    $userInRace = true;

                    // Find user in leaderboard
                    $userEntry = collect($leaderboard)->firstWhere('creator.id', $user->id);
                    if ($userEntry) {
                        $userProgress = $userEntry;
                    } else {
                        // User not in top 50, calculate their progress
                        $earnings = $this->calculateFirst30DayEarnings($user->id);

                        $daysRemaining = $thirtyDaysLater && $thirtyDaysLater->isFuture() ? $thirtyDaysLater->diffInDays(now()) : 0;

                        $userProgress = [
                            'creator' => $user,
                            'current_earnings' => $earnings,
                            'days_remaining' => $daysRemaining > 0 ? $daysRemaining : 0,
                            'is_qualified' => $earnings >= $minEarnings,
                            'qualification_progress' => min(100, ($earnings / $minEarnings) * 100),
                        ];
                    }
                } elseif ($thirtyDaysLater && $user->founder_missed_at) {
                    // Window over without qualifying (outcome recorded by the daily
                    // qualification job) — show the missed state instead of silently
                    // dropping all founder UI
                    $finalEarnings = $this->calculateFirst30DayEarnings($user->id);
                    $userMissed = [
                        'window_ended_at' => $thirtyDaysLater->toDateString(),
                        'final_earnings' => $finalEarnings,
                        'min_earnings' => $minEarnings,
                        'qualification_progress' => $minEarnings > 0 ? min(100, ($finalEarnings / $minEarnings) * 100) : 0,
                        'reason' => $finalEarnings >= $minEarnings ? 'seats_full' : 'earnings_below_threshold',
                    ];
                }
            }
        }

        return Inertia::render('FounderBonus/Index', [
            'leaderboard' => $leaderboard,
            'userInRace' => $userInRace,
            'userProgress' => $userProgress,
            'userMissed' => $userMissed,
            'founderBonusData' => $founderBonusData,
            'previousMonthStats' => $previousMonthStats,
            'previousMonthWinners' => $previousMonthBonuses->map(function ($bonus) {
                return [
                    'id' => $bonus->id,
                    'qualification_date' => $bonus->qualification_date,
                    'first_30d_earnings' => (float) $bonus->first_30d_earnings,
                    'bonus_amount' => (float) $bonus->bonus_amount,
                    'payout_status' => $bonus->payout_status,
                    'creator' => $bonus->creator ? [
                        'id' => $bonus->creator->id,
                        'name' => $bonus->creator->name,
                        'username' => $bonus->creator->username,
                        'avatar_url' => $bonus->creator->avatar_url ?? null,
                        'profile_status_lock' => $bonus->creator->profile_status_lock ?? null,
                        'role' => $bonus->creator->role ?? null,
                    ] : null,
                ];
            }),
            'recentWinners' => $recentWinners,
            'programStats' => [
                'totalFounders' => $totalFounders,
                'availableSeats' => $availableSeats,
                'maxSeats' => $maxSeats,
                'minEarnings' => $minEarnings,
                'bonusPercentage' => $bonusPercentage * 100,
                'qualificationDays' => FounderBonus::getQualificationDays(),
                'currentMonth' => now()->format('F Y'),
            ]
        ]);
    }

    public function getAllTimeWinners(Request $request)
    {
        $limit = (int) $request->query('limit', 10);
        $limit = max(1, min(100, $limit));

        $winners = FounderBonus::with('creator')
            ->orderByDesc('first_30d_earnings')
            ->limit($limit)
            ->get()
            ->map(function ($bonus) {
                return [
                    'id' => $bonus->id,
                    'qualification_date' => $bonus->qualification_date,
                    'first_30d_earnings' => (float) $bonus->first_30d_earnings,
                    'bonus_amount' => (float) $bonus->bonus_amount,
                    'payout_status' => $bonus->payout_status,
                    'creator' => $bonus->creator ? [
                        'id' => $bonus->creator->id,
                        'name' => $bonus->creator->name,
                        'username' => $bonus->creator->username,
                        'avatar_url' => $bonus->creator->avatar_url ?? null,
                        'profile_status_lock' => $bonus->creator->profile_status_lock ?? null,
                        'role' => $bonus->creator->role ?? null,
                    ] : null,
                ];
            });

        return response()->json([
            'winners' => $winners,
        ]);
    }

    /**
     * Get founder program information for non-founders
     */
    public function programInfo(Request $request)
    {
        $user = $request->user();
        
        // Get configurable qualification days
        $qualificationDays = FounderBonus::getQualificationDays();
        
        // Calculate user's first qualification period earnings if they're eligible
        $first30DayEarnings = 0;
        $daysActive = 0;
        
        if ($user && !$user->is_founder) {
            if (!$user->stripe_connected_at) {
                $accountAge = 0;
            } else {
                $accountAge = now()->diffInDays($user->stripe_connected_at);
            }
            $daysActive = min($accountAge, $qualificationDays);
            
            if ($accountAge >= $qualificationDays) {
                // Calculate their first qualification period earnings
                $first30DayEarnings = $this->calculateFirst30DayEarnings($user->id);
            } else {
                // Calculate current earnings for active period
                $first30DayEarnings = $this->calculateCurrentEarnings($user->id);
            }
        }

        $totalFounders = User::where('is_founder', true)->count();
        $availableSeats = FounderBonus::getAvailableSeats();

        return Inertia::render('FounderBonus/Index', [
            'user' => $user,
            'userStats' => [
                'first30DayEarnings' => $first30DayEarnings,
                'daysActive' => $daysActive,
                'isEligible' => $first30DayEarnings >= FounderBonus::getMinFirst30dEarnings() && $availableSeats > 0,
            ],
            'programStats' => [
                'totalFounders' => $totalFounders,
                'availableSeats' => $availableSeats,
                'maxSeats' => FounderBonus::getMaxFounderSeats(),
                'minEarnings' => FounderBonus::getMinFirst30dEarnings(),
                'bonusPercentage' => FounderBonus::getBonusPercentage() * 100,
                'minMonthlyEarnings' => FounderBonus::getMinMonthlyEarnings(),
                'maxMonthlyEarnings' => FounderBonus::getMaxMonthlyEarnings(),
                'qualificationDays' => FounderBonus::getQualificationDays(),
            ]
        ]);
    }

    /**
     * Calculate first 30-day earnings for a user
     */
    private function calculateFirst30DayEarnings(int $userId)
    {
        $user = User::find($userId);
        if (!$user) return 0;
        if (!$user->stripe_connected_at) return 0;

        $qualificationDays = FounderBonus::getQualificationDays();
        $startDate = $user->stripe_connected_at;
        $endDate = $user->stripe_connected_at->copy()->addDays($qualificationDays);
        return (float) FounderBonus::calculateCompletedNetEarnings($user, $startDate, $endDate, 'GBP');
    }

    /**
     * Calculate current earnings for a user
     */
    private function calculateCurrentEarnings(int $userId)
    {
        $user = User::find($userId);
        if (!$user) return 0;
        if (!$user->stripe_connected_at) return 0;

        $startDate = $user->stripe_connected_at;
        $endDate = min($user->stripe_connected_at->copy()->addDays(FounderBonus::getQualificationDays()), now());
        return (float) FounderBonus::calculateCompletedNetEarnings($user, $startDate, $endDate, 'GBP');
    }

    /**
     * Get leaderboard data for current month's race - creators' first 30 days progress
     */
    public function getLeaderboard(Request $request)
    {
        $user = $request->user();
        
        // Get current month's leaderboard data
        $leaderboard = FounderBonus::getCurrentMonthLeaderboard(50);
        
        // Find current user's position if they're in the race
        $userPosition = null;
        $userInRace = false;
        
        if ($user && $user->stripe_connected_at && $user->stripe_connected_at->isCurrentMonth()) {
            $userInRace = true;
            $userEntry = collect($leaderboard)->firstWhere('creator.id', $user->id);
            if ($userEntry) {
                $userPosition = collect($leaderboard)->search(function($item) use ($user) {
                    return $item['creator']->id === $user->id;
                }) + 1;
            }
        }

        return response()->json([
            'leaderboard' => $leaderboard,
            'userInRace' => $userInRace,
            'userPosition' => $userPosition,
            'totalCreators' => count($leaderboard),
            'currentMonth' => now()->format('F Y'),
            'programStats' => [
                'totalFounders' => FounderBonus::getTotalFounderCount(),
                'availableSeats' => FounderBonus::getAvailableSeats(),
                'maxSeats' => FounderBonus::getMaxFounderSeats(),
                'minEarnings' => FounderBonus::getMinFirst30dEarnings(),
                'bonusPercentage' => FounderBonus::getBonusPercentage() * 100,
            ]
        ]);
    }

    /**
     * Qualify winners for founder bonus program
     * This method checks all eligible users and qualifies them as founders
     */
    public function qualifyWinners()
    {
        // For testing purposes, allow access without authentication in development
        if (app()->environment('local') && !auth()->check()) {
            // Actually run the qualification process in test mode
            try {
                $qualifiedCount = 0;
                $errors = [];
                
                $qualificationDays = FounderBonus::getQualificationDays();
                // Get all users who are not already founders
                $eligibleUsers = User::where('is_founder', false)
                    ->whereNotNull('stripe_connected_at')
                    ->where('stripe_connected_at', '<=', now()->subDays($qualificationDays))
                    ->get();

                foreach ($eligibleUsers as $user) {
                    // Calculate first 30-day earnings
                    $first30DayEarnings = $this->calculateFirst30DayEarnings($user->id);
                    
                    // Check if user qualifies for founder status
                    if (FounderBonus::checkFounderQualification($user->id, $first30DayEarnings)) {
                        try {
                            \Illuminate\Support\Facades\DB::transaction(function () use ($user, $first30DayEarnings) {
                                // Update is_founder field in users table
                                $user->update(['is_founder' => true]);
                                
                                // Create entry in founder_bonuses table (correct table name)
                                FounderBonus::create([
                                    'creator_id' => $user->id,
                                    'qualification_date' => now()->toDateString(),
                                    'first_30d_earnings' => $first30DayEarnings,
                                    'bonus_amount' => FounderBonus::calculateBonusAmount($first30DayEarnings),
                                    'estimated_payout_date' => now()->addMonth()->startOfMonth()->addDays(6), // 7th of next month
                                    'payout_status' => FounderBonus::STATUS_PENDING,
                                ]);
                            });
                            
                            $qualifiedCount++;
                            
                            // Send congratulations email if enabled
                            if (config('founder_bonus.features.email_notifications', true) && $user->notification_send == 1) {
                                try {
                                    \App\EmailService::sendMarketingEmail($user, new \App\Mail\FounderCongratulations($user, $first30DayEarnings));
                                } catch (\Exception $e) {
                                    $errors[] = "Failed to send email to {$user->email}: " . $e->getMessage();
                                }
                            }
                            
                        } catch (\Exception $e) {
                            $errors[] = "Failed to qualify user {$user->id}: " . $e->getMessage();
                        }
                    }
                }
                
                return response()->json([
                    'message' => 'Founder qualification process completed',
                    'status' => 'success',
                    'environment' => app()->environment(),
                    'qualified_count' => $qualifiedCount,
                    'total_eligible' => $eligibleUsers->count(),
                    'errors' => $errors
                ]);
                
            } catch (\Exception $e) {
                return response()->json([
                    'message' => 'Error during qualification process',
                    'status' => 'error',
                    'environment' => app()->environment(),
                    'error' => $e->getMessage()
                ], 500);
            }
        }
        
        try {
            $qualifiedCount = 0;
            $errors = [];
            
            // Get all users who are not already founders
            $qualificationDays = FounderBonus::getQualificationDays();
            $eligibleUsers = User::where('is_founder', false)
                ->whereNotNull('stripe_connected_at')
                ->where('stripe_connected_at', '<=', now()->subDays($qualificationDays))
                ->get();

            foreach ($eligibleUsers as $user) {
                // Calculate first 30-day earnings
                $first30DayEarnings = $this->calculateFirst30DayEarnings($user->id);
                
                // Check if user qualifies for founder status
                if (FounderBonus::checkFounderQualification($user->id, $first30DayEarnings)) {
                    try {
                        \Illuminate\Support\Facades\DB::transaction(function () use ($user, $first30DayEarnings) {
                            // Update is_founder field in users table
                            $user->update(['is_founder' => true]);
                            
                            // Create entry in founder_bonus table
                            FounderBonus::create([
                                'creator_id' => $user->id,
                                'qualification_date' => now()->toDateString(),
                                'first_30d_earnings' => $first30DayEarnings,
                                'bonus_amount' => FounderBonus::calculateBonusAmount($first30DayEarnings),
                                'estimated_payout_date' => now()->addMonth()->startOfMonth()->addDays(6), // 7th of next month
                                'payout_status' => FounderBonus::STATUS_PENDING,
                            ]);
                        });
                        
                        $qualifiedCount++;
                        
                        // Send congratulations email if enabled
                        if (config('founder_bonus.features.email_notifications', true) && $user->notification_send == 1) {
                            try {
                                \App\EmailService::sendMarketingEmail($user, new \App\Mail\FounderCongratulations($user, $first30DayEarnings));
                            } catch (\Exception $e) {
                                $errors[] = "Failed to send email to {$user->email}: " . $e->getMessage();
                            }
                        }
                        
                    } catch (\Exception $e) {
                        $errors[] = "Failed to qualify user {$user->id}: " . $e->getMessage();
                    }
                }
            }
            
            return response()->json([
                'success' => true,
                'message' => "Successfully qualified {$qualifiedCount} users as founders",
                'qualified_count' => $qualifiedCount,
                'errors' => $errors,
                'total_checked' => $eligibleUsers->count(),
            ]);
            
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to qualify winners: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Settle all pending founder bonus payouts
     * 
     * @return \Illuminate\Http\JsonResponse
     */
    public function settlePayouts()
    {
        try {
            $duePendingCount = FounderBonus::where('payout_status', FounderBonus::STATUS_PENDING)
                ->where('bonus_amount', '>', 0)
                ->where('estimated_payout_date', '<=', now()->toDateString())
                ->count();

            if ($duePendingCount === 0) {
                return response()->json([
                    'success' => true,
                    'message' => 'No due pending payouts to process',
                    'processed_count' => 0,
                ]);
            }

            // Run the real payout job synchronously — it issues Stripe transfer + payout
            // (idempotent) and creates the PayoutRecord that the creator's finance page shows.
            (new \App\Jobs\ProcessFounderPayouts())->handle();

            $stillPending = FounderBonus::where('payout_status', FounderBonus::STATUS_PENDING)
                ->where('bonus_amount', '>', 0)
                ->where('estimated_payout_date', '<=', now()->toDateString())
                ->whereNull('stripe_payout_id')
                ->count();

            return response()->json([
                'success' => true,
                'message' => 'Founder payout run completed',
                'due_before' => $duePendingCount,
                'still_unpaid' => $stillPending,
                'processed_count' => $duePendingCount - $stillPending,
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to process payouts: ' . $e->getMessage(),
            ], 500);
        }
    }
}
