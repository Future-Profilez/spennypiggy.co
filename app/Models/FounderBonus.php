<?php

namespace App\Models;

use Carbon\Carbon;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Collection;

class FounderBonus extends Model
{
    use HasFactory;

    protected $table = 'founder_bonuses';

    protected $fillable = [
        'creator_id',
        'qualification_date',
        'first_30d_earnings',
        'bonus_amount',
        'referral_multiplier',
        'estimated_payout_date',
        'payout_status',
        'payout_rejection_reason',
        'paid_date',
        'stripe_transfer_id',
        'stripe_payout_id',
        'payout_record_uuid',
    ];

    protected $casts = [
        'qualification_date' => 'date',
        'first_30d_earnings' => 'decimal:2',
        'bonus_amount' => 'decimal:2',
        'referral_multiplier' => 'decimal:4',
        'estimated_payout_date' => 'date',
        'paid_date' => 'datetime',
    ];

    // Payout status constants
    const STATUS_PENDING = 'pending';

    const STATUS_PAID = 'paid';

    const STATUS_REJECTED = 'rejected';

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
        return config('founder_bonus.qualification.qualification_period_days', 30);
    }

    /**
     * Relationship with User (creator)
     */
    public function creator()
    {
        return $this->belongsTo(User::class, 'creator_id');
    }

    public static function calculateCompletedNetEarnings(User $creator, Carbon $start, Carbon $end, string $currency = 'GBP'): float
    {
        $currency = strtoupper($currency ?: 'GBP');
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

        // eager-load source: a TaskPurchase-backed income row flips FT.status to
        // 'completed' as soon as the buyer pays (see SyncFinancialTransactions),
        // but a timed task is still in escrow until the buyer accepts. Counting
        // that as earned let a creator qualify for a real cash Founder bonus on
        // money that could still be refunded — and it disagreed with getSummary,
        // PayoutService and ReleaseReserves, which all apply this same gate.
        $txs = FinancialTransaction::query()
            ->where('user_id', $creator->id)
            ->where('type', 'income')
            ->where('status', 'completed')
            ->whereBetween('transaction_date', [$start, $end])
            // Full source, not a column-constrained select: this is a morphTo and
            // some source types (ShopPayment, StripePaymentItems) have no `status`
            // column, so `source:id,status` would error on them. Mirrors getSummary.
            ->with('source')
            ->get(['id', 'net_amount', 'currency', 'source_type', 'source_id']);

        $total = 0.0;
        foreach ($txs as $tx) {
            if ($tx->source_type === 'App\Models\TaskPurchase'
                && isset($tx->source->status)
                && ! in_array($tx->source->status, ['completed', 'completed_accepted', 'paid_out'], true)) {
                continue;
            }

            $from = strtoupper((string) ($tx->currency ?? 'GBP'));
            $net = (float) ($tx->net_amount ?? 0);
            $total += $convert($net, $from, $currency);
        }

        return $total;
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

        // Get creators who joined in the last 60 days to show recent joiners
        $cutoffDate = now()->subDays(60);

        $creators = User::where('name', 'NOT LIKE', '%Test%')
            ->where('name', 'NOT LIKE', '%Founder%')
            ->where('name', 'NOT LIKE', '%test%')
            ->where('name', 'NOT LIKE', '%dummy%')
            ->where('role', 1) // Only include creators (role 1), not gifters (role 0)
            ->whereNotNull('stripe_connected_at')
            ->where('stripe_connected_at', '>=', $cutoffDate)
            ->whereNull('founder_missed_at')
            ->whereNotIn('id', $existingFounderIds)
            ->get();

        $leaderboard = [];
        $minEarnings = self::getMinFirst30dEarnings();
        $qualificationDays = self::getQualificationDays();

        foreach ($creators as $creator) {
            $joinDate = $creator->stripe_connected_at;
            if (! $joinDate) {
                continue;
            }
            $thirtyDaysLater = $joinDate->copy()->addDays($qualificationDays);
            $calculationEndDate = min($thirtyDaysLater, now());

            $earnings = (float) self::calculateCompletedNetEarnings($creator, $joinDate, $calculationEndDate, 'GBP');

            $daysRemaining = $thirtyDaysLater->isFuture() ? max(1, (int) ceil(now()->diffInSeconds($thirtyDaysLater) / 86400)) : 0;
            $isQualified = $earnings >= $minEarnings;

            $leaderboard[] = [
                // Explicit whitelist, not the whole model. /founder/bonus is a
                // public page, and User::$hidden does NOT cover email, date_of_birth,
                // ip_address or identity_* — passing the model shipped all of those
                // for up to 50 creators to anonymous visitors. Mirror the shape
                // recentWinners already uses in the controller.
                'creator' => [
                    'id' => $creator->id,
                    'name' => $creator->name,
                    'username' => $creator->username,
                    'avatar_url' => $creator->avatar_url,
                    'profile_status_lock' => $creator->profile_status_lock,
                    'role' => $creator->role,
                ],
                'current_earnings' => (float) $earnings,
                'days_remaining' => $daysRemaining,
                'is_qualified' => $isQualified,
                'qualification_progress' => min(100, ($earnings / $minEarnings) * 100),
            ];
        }

        // Sort by qualification progress (highest first), then by earnings
        usort($leaderboard, function ($a, $b) {
            // First sort by qualification status (qualified first)
            if ($a['is_qualified'] !== $b['is_qualified']) {
                return $b['is_qualified'] <=> $a['is_qualified'];
            }
            // Then by qualification progress
            if ($a['qualification_progress'] !== $b['qualification_progress']) {
                return $b['qualification_progress'] <=> $a['qualification_progress'];
            }

            // Finally by earnings
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
            'paid_date' => now(),
        ]);
    }

    /**
     * Get formatted bonus amount
     */
    public function getFormattedBonusAttribute()
    {
        return '£'.number_format($this->bonus_amount, 2);
    }

    /**
     * Get formatted first 30 days earnings
     */
    public function getFormattedFirst30dEarningsAttribute()
    {
        return '£'.number_format($this->first_30d_earnings, 2);
    }

    /**
     * Check if bonus is eligible for payout
     */
    public function isEligibleForPayout()
    {
        return $this->payout_status === self::STATUS_PENDING;
    }

    /**
     * Get formatted paid date
     */
    public function getFormattedPaidDateAttribute()
    {
        return $this->paid_date ? $this->paid_date->format('M j, Y \a\t g:i A') : null;
    }

    /**
     * Check if bonus has been paid
     */
    public function isPaid()
    {
        return $this->payout_status === self::STATUS_PAID && $this->paid_date !== null;
    }
}
