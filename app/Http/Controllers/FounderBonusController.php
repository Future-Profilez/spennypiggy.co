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

        // Check if current user is in the race (joined this month)
        $userInRace = false;
        $userProgress = null;
        
        if ($user && $user->created_at->isCurrentMonth()) {
            $userInRace = true;
            
            // Find user in leaderboard
            $userEntry = collect($leaderboard)->firstWhere('creator.id', $user->id);
            if ($userEntry) {
                $userProgress = $userEntry;
            } else {
                // User not in top 50, calculate their progress
                $joinDate = $user->created_at;
                $thirtyDaysLater = $joinDate->copy()->addDays(30);
                $calculationEndDate = min($thirtyDaysLater, now());
                
                $earnings = $user->createdDeliverables()
                    ->whereBetween('created_at', [$joinDate, $calculationEndDate])
                    ->sum('transaction_amount');
                    
                $daysRemaining = $thirtyDaysLater->isFuture() ? $thirtyDaysLater->diffInDays(now()) : 0;
                
                $userProgress = [
                    'creator' => $user,
                    'current_earnings' => $earnings,
                    'days_remaining' => $daysRemaining > 0 ? $daysRemaining : 0,
                    'is_qualified' => false,
                    'qualification_progress' => min(100, ($earnings / $minEarnings) * 100),
                ];
            }
        }

        return Inertia::render('FounderBonus/Index', [
            'leaderboard' => $leaderboard,
            'userInRace' => $userInRace,
            'userProgress' => $userProgress,
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
}