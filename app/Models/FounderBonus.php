<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Carbon\Carbon;

class FounderBonus extends Model
{
    use HasFactory;

    protected $table = 'founder_bonuses';

    protected $fillable = [
        'creator_id',
        'qualification_date',
        'first_30d_earnings',
        'bonus_amount',
        'estimated_payout_date',
        'payout_status',
    ];

    protected $casts = [
        'qualification_date' => 'date',
        'first_30d_earnings' => 'decimal:2',
        'bonus_amount' => 'decimal:2',
        'estimated_payout_date' => 'date',
    ];

    // Payout status constants
    const STATUS_PENDING = 'pending';
    const STATUS_PAID = 'paid';

    /**
     * Get minimum first 30 days earnings from config
     */
    public static function getMinFirst30dEarnings()
    {
        return config('founder_bonus.qualification.min_first_30d_earnings', 2500.00);
    }

    /**
     * Get bonus percentage from config
     */
    public static function getBonusPercentage()
    {
        return config('founder_bonus.bonus.bonus_percentage', 0.10);
    }

    /**
     * Get maximum founder seats from config
     */
    public static function getMaxFounderSeats()
    {
        return config('founder_bonus.limits.max_founder_seats', 150);
    }

    /**
     * Get minimum monthly earnings from config
     */
    public static function getMinMonthlyEarnings()
    {
        return config('founder_bonus.bonus.min_monthly_earnings', 2500.00);
    }

    /**
     * Get maximum monthly earnings from config
     */
    public static function getMaxMonthlyEarnings()
    {
        return config('founder_bonus.bonus.max_monthly_earnings', 10000.00);
    }

    /**
     * Get maximum bonus per month from config
     */
    public static function getMaxBonusPerMonth()
    {
        return config('founder_bonus.bonus.max_bonus_per_month', 1000.00);
    }

    /**
     * Get qualification days from config
     */
    public static function getQualificationDays()
    {
        return config('founder_bonus.qualification.qualification_days', 30);
    }

    /**
     * Relationship with User (creator)
     */
    public function creator()
    {
        return $this->belongsTo(User::class, 'creator_id');
    }

    /**
     * Scope for pending payouts
     */
    public function scopePendingPayouts($query)
    {
        return $query->where('payout_status', self::STATUS_PENDING);
    }

    /**
     * Scope for qualified founders this month
     */
    public function scopeQualifiedThisMonth($query)
    {
        $startOfMonth = now()->startOfMonth();
        $endOfMonth = now()->endOfMonth();
        
        return $query->whereBetween('qualification_date', [$startOfMonth, $endOfMonth]);
    }

    /**
     * Calculate bonus amount based on first 30 days earnings
     */
    public static function calculateBonusAmount($first30dEarnings)
    {
        $bonusPercentage = self::getBonusPercentage();
        return round($first30dEarnings * $bonusPercentage, 2);
    }

    /**
     * Check if creator qualifies for founder status
     */
    public static function checkFounderQualification($creatorId, $first30dEarnings)
    {
        // Check if already qualified
        if (self::where('creator_id', $creatorId)->exists()) {
            return false;
        }

        // Check earnings threshold
        $minEarnings = self::getMinFirst30dEarnings();
        if ($first30dEarnings < $minEarnings) {
            return false;
        }

        // Check available seats for current month
        $currentMonthFounders = self::qualifiedThisMonth()->count();
        $maxSeats = self::getMaxFounderSeats();
        if ($currentMonthFounders >= $maxSeats) {
            return false;
        }

        return true;
    }

    /**
     * Get total number of qualified founders
     */
    public static function getTotalFounderCount()
    {
        return self::count();
    }

    /**
     * Get available founder seats for current month
     */
    public static function getAvailableSeats()
    {
        $maxSeats = self::getMaxFounderSeats();
        $currentMonthFounders = self::qualifiedThisMonth()->count();
        return $maxSeats - $currentMonthFounders;
    }

    /**
     * Get current month's leaderboard showing creators' first 30 days progress
     */
    public static function getCurrentMonthLeaderboard($limit = 50)
    {
        // Get all creators excluding test/dummy users and those who already became founders
        $existingFounderIds = self::pluck('creator_id')->toArray();
        
        $creators = User::where('name', 'NOT LIKE', '%Test%')
            ->where('name', 'NOT LIKE', '%Founder%')
            ->where('name', 'NOT LIKE', '%test%')
            ->where('name', 'NOT LIKE', '%dummy%')
            ->whereNotIn('id', $existingFounderIds)
            ->with(['createdDeliverables' => function($query) {
                $query->where('status', 'delivered');
            }])
            ->get();

        $leaderboard = [];
        $minEarnings = self::getMinFirst30dEarnings();

        foreach ($creators as $creator) {
            $joinDate = $creator->created_at;
            $thirtyDaysLater = $joinDate->copy()->addDays(30);
            $calculationEndDate = min($thirtyDaysLater, now());
            
            // Calculate earnings in their first 30 days (or up to now if less than 30 days)
            $earnings = $creator->createdDeliverables()
                ->whereBetween('created_at', [$joinDate, $calculationEndDate])
                ->where('status', 'delivered')
                ->sum('transaction_amount');
                
            // Only include users who have earned at least £2500 in their first 30 days
            if ($earnings >= $minEarnings) {
                $daysRemaining = max(0, $thirtyDaysLater->diffInDays(now(), false));
                $isQualified = $earnings >= $minEarnings && $daysRemaining <= 0;
                
                $leaderboard[] = [
                    'creator' => $creator,
                    'current_earnings' => (float) $earnings,
                    'days_remaining' => $daysRemaining > 0 ? $daysRemaining : 0,
                    'is_qualified' => $isQualified,
                    'qualification_progress' => min(100, ($earnings / $minEarnings) * 100),
                ];
            }
        }

        // Sort by earnings (highest first)
        usort($leaderboard, function($a, $b) {
            return $b['current_earnings'] <=> $a['current_earnings'];
        });

        return array_slice($leaderboard, 0, $limit);
    }

    /**
     * Mark payout as paid
     */
    public function markAsPaid()
    {
        $this->update([
            'payout_status' => self::STATUS_PAID,
        ]);
    }

    /**
     * Get formatted bonus amount
     */
    public function getFormattedBonusAttribute()
    {
        return '£' . number_format($this->bonus_amount, 2);
    }

    /**
     * Get formatted first 30 days earnings
     */
    public function getFormattedFirst30dEarningsAttribute()
    {
        return '£' . number_format($this->first_30d_earnings, 2);
    }

    /**
     * Check if bonus is eligible for payout
     */
    public function isEligibleForPayout()
    {
        return $this->payout_status === self::STATUS_PENDING;
    }
}
