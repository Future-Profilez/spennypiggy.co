<?php

namespace App\Http\Controllers;

use App\Models\FounderBonus;
use App\Models\User;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Carbon\Carbon;

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
                        'rejection_reason' => $founderBonus->rejection_reason,
                        'formatted_paid_date' => $founderBonus->formatted_paid_date,
                    ];
                }
            } else {
                // Check if user is within their 30-day qualification window
                $joinDate = $user->created_at;
                $thirtyDaysLater = $joinDate->copy()->addDays(30);
                $isWithin30Days = now()->lessThan($thirtyDaysLater);
                
                if ($isWithin30Days) {
                    $userInRace = true;
                    
                    // Find user in leaderboard
                    $userEntry = collect($leaderboard)->firstWhere('creator.id', $user->id);
                    if ($userEntry) {
                        $userProgress = $userEntry;
                    } else {
                        // User not in top 50, calculate their progress
                        $calculationEndDate = min($thirtyDaysLater, now());
                        
                        $earnings = $user->createdDeliverables()
                            ->whereBetween('created_at', [$joinDate, $calculationEndDate])
                            ->sum('transaction_amount');
                            
                        $daysRemaining = $thirtyDaysLater->isFuture() ? $thirtyDaysLater->diffInDays(now()) : 0;
                        
                        $userProgress = [
                            'creator' => $user,
                            'current_earnings' => $earnings,
                            'days_remaining' => $daysRemaining > 0 ? $daysRemaining : 0,
                            'is_qualified' => $earnings >= $minEarnings,
                            'qualification_progress' => min(100, ($earnings / $minEarnings) * 100),
                        ];
                    }
                }
            }
        }

        return Inertia::render('FounderBonus/Index', [
            'leaderboard' => $leaderboard,
            'userInRace' => $userInRace,
            'userProgress' => $userProgress,
            'founderBonusData' => $founderBonusData,
            'programStats' => [
                'totalFounders' => $totalFounders,
                'availableSeats' => $availableSeats,
                'maxSeats' => $maxSeats,
                'minEarnings' => $minEarnings,
                'bonusPercentage' => $bonusPercentage * 100,
                'qualificationDays' => 30,
                'currentMonth' => now()->format('F Y'),
            ]
        ]);
    }

    /**
     * Calculate current month earnings for a creator
     */
    private function calculateCurrentMonthEarnings($creatorId)
    {
        $startDate = now()->startOfMonth();
        $endDate = now();
        
        // Calculate earnings from deliverables table
        $earnings = \DB::table('deliverables')
            ->where('creator_id', $creatorId)
            ->whereBetween('created_at', [$startDate, $endDate])
            ->whereNotNull('transaction_amount')
            ->where('transaction_amount', '>', 0)
            ->sum('transaction_amount');
        
        return (float) $earnings;
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
            $accountAge = now()->diffInDays($user->created_at);
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
    private function calculateFirst30DayEarnings($userId)
    {
        $user = User::find($userId);
        if (!$user) return 0;

        $qualificationDays = FounderBonus::getQualificationDays();
        $startDate = $user->created_at;
        $endDate = $user->created_at->copy()->addDays($qualificationDays);

        // Calculate earnings from deliverables table
        $earnings = \DB::table('deliverables')
            ->where('creator_id', $userId)
            ->whereBetween('created_at', [$startDate, $endDate])
            ->whereNotNull('transaction_amount')
            ->where('transaction_amount', '>', 0)
            ->sum('transaction_amount');
        
        return (float) $earnings;
    }

    /**
     * Calculate current earnings for a user
     */
    private function calculateCurrentEarnings($userId)
    {
        $user = User::find($userId);
        if (!$user) return 0;

        $startDate = $user->created_at;
        $endDate = now();

        // Calculate earnings from deliverables table
        $earnings = \DB::table('deliverables')
            ->where('creator_id', $userId)
            ->whereBetween('created_at', [$startDate, $endDate])
            ->whereNotNull('transaction_amount')
            ->where('transaction_amount', '>', 0)
            ->sum('transaction_amount');
        
        return (float) $earnings;
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
        
        if ($user && $user->created_at->isCurrentMonth()) {
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
                
                // Get all users who are not already founders
                $eligibleUsers = User::where('is_founder', false)
                    ->whereNotNull('created_at')
                    ->get();

                foreach ($eligibleUsers as $user) {
                    // Calculate first 30-day earnings
                    $first30DayEarnings = $this->calculateFirst30DayEarnings($user->id);
                    
                    // Check if user qualifies for founder status
                    if (FounderBonus::checkFounderQualification($user->id, $first30DayEarnings)) {
                        try {
                            \DB::transaction(function () use ($user, $first30DayEarnings) {
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
                            if (config('founder_bonus.features.email_notifications', true)) {
                                try {
                                    \Mail::to($user->email)->send(new \App\Mail\FounderCongratulations($user, $first30DayEarnings));
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
            $eligibleUsers = User::where('is_founder', false)
                ->whereNotNull('created_at')
                ->get();

            foreach ($eligibleUsers as $user) {
                // Calculate first 30-day earnings
                $first30DayEarnings = $this->calculateFirst30DayEarnings($user->id);
                
                // Check if user qualifies for founder status
                if (FounderBonus::checkFounderQualification($user->id, $first30DayEarnings)) {
                    try {
                        \DB::transaction(function () use ($user, $first30DayEarnings) {
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
                        if (config('founder_bonus.features.email_notifications', true)) {
                            try {
                                \Mail::to($user->email)->send(new \App\Mail\FounderCongratulations($user, $first30DayEarnings));
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
            // Get all pending founder bonuses
            $pendingBonuses = FounderBonus::with('creator')
                ->where('payout_status', FounderBonus::STATUS_PENDING)
                ->where('bonus_amount', '>', 0)
                ->get();

            if ($pendingBonuses->isEmpty()) {
                return response()->json([
                    'success' => true,
                    'message' => 'No pending payouts to process',
                    'processed_count' => 0,
                    'total_amount' => 0,
                ]);
            }

            $processedCount = 0;
            $totalAmount = 0;
            $errors = [];
            $successfulPayouts = [];

            foreach ($pendingBonuses as $bonus) {
                try {
                    $creator = $bonus->creator;
                    
                    // Check if creator has a connected Stripe account
                    if (empty($creator->account_id)) {
                        $errors[] = "Creator {$creator->username} (ID: {$creator->id}) does not have a connected Stripe account";
                        continue;
                    }

                    // Convert bonus amount to cents for Stripe (assuming GBP)
                    $amountInCents = (int) round($bonus->bonus_amount * 100);

                    // Create transfer from platform account to creator's connected account
                    $transfer = \App\StripeControl::createTransfer([
                        'amount' => $amountInCents,
                        'currency' => 'gbp',
                        'destination' => $creator->account_id,
                        'description' => "Founder Bonus Transfer - Qualification Date: {$bonus->qualification_date}",
                        'metadata' => [
                            'founder_bonus_id' => $bonus->id,
                            'creator_id' => $creator->id,
                            'qualification_date' => $bonus->qualification_date,
                            'first_30d_earnings' => $bonus->first_30d_earnings,
                            'payout_type' => 'founder_bonus',
                        ],
                    ]);

                    // Mark bonus as paid
                    $bonus->markAsPaid();
                    
                    $processedCount++;
                    $totalAmount += $bonus->bonus_amount;
                    
                    $successfulPayouts[] = [
                        'creator_id' => $creator->id,
                        'creator_username' => $creator->username,
                        'bonus_amount' => $bonus->bonus_amount,
                        'stripe_transfer_id' => $transfer->id,
                    ];

                } catch (\Exception $e) {
                    $errors[] = "Failed to process payout for creator {$creator->username} (ID: {$creator->id}): " . $e->getMessage();
                }
            }

            return response()->json([
                'success' => true,
                'message' => "Successfully processed {$processedCount} payouts",
                'processed_count' => $processedCount,
                'total_amount' => $totalAmount,
                'total_pending' => $pendingBonuses->count(),
                'successful_payouts' => $successfulPayouts,
                'errors' => $errors,
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to process payouts: ' . $e->getMessage(),
            ], 500);
        }
    }
}