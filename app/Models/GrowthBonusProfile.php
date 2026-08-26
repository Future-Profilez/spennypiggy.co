<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

/**
 * Per-creator eligibility record for the Creator Growth Bonus (first 150).
 *
 * Status: pending (inside 30-day activation window) → active (reached £100,
 * seat claimed) → expired (12 months from activation elapsed), or
 * pending → missed (window closed under £100, or seats were full).
 *
 * ⚠️ Mirrored in admin.spennypiggy.co (shared DB, separate code). Keep the
 * two models in step by hand.
 */
class GrowthBonusProfile extends Model
{
    use HasFactory;

    const STATUS_PENDING = 'pending';

    const STATUS_ACTIVE = 'active';

    const STATUS_MISSED = 'missed';

    const STATUS_EXPIRED = 'expired';

    protected $fillable = [
        'creator_id',
        'status',
        'missed_reason',
        'activation_deadline',
        'activated_at',
        'seat_claimed_at',
        'expires_at',
        'qualifying_gmv',
        'gmv_adjustment',
        'current_milestone',
        'unconverted_rows',
        'last_evaluated_at',
    ];

    protected $casts = [
        'activation_deadline' => 'datetime',
        'activated_at' => 'datetime',
        'seat_claimed_at' => 'datetime',
        'expires_at' => 'datetime',
        'last_evaluated_at' => 'datetime',
        'qualifying_gmv' => 'decimal:2',
        'gmv_adjustment' => 'decimal:2',
        'current_milestone' => 'decimal:2',
    ];

    public function creator()
    {
        return $this->belongsTo(User::class, 'creator_id');
    }

    public function rewards()
    {
        return $this->hasMany(GrowthBonusReward::class, 'profile_id');
    }

    /**
     * Seats consumed so far. Counts seat_claimed_at, NEVER status — a creator
     * whose 12 months ran out still holds their place among the first 150.
     */
    public static function seatsClaimed(): int
    {
        return static::whereNotNull('seat_claimed_at')->count();
    }
}
