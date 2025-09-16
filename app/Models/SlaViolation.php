<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Str;
use Carbon\Carbon;

class SlaViolation extends Model
{
    use HasFactory;

    protected $fillable = [
        'uuid',
        'deliverable_id',
        'creator_id',
        'violation_type',
        'penalty_applied',
        'penalty_start_date',
        'penalty_end_date',
        'admin_override',
        'violation_reason',
        'admin_notes'
    ];

    protected $casts = [
        'penalty_start_date' => 'datetime',
        'penalty_end_date' => 'datetime',
        'admin_override' => 'boolean'
    ];

    protected $dates = [
        'penalty_start_date',
        'penalty_end_date'
    ];

    protected static function boot()
    {
        parent::boot();
        
        static::creating(function ($model) {
            if (empty($model->uuid)) {
                $model->uuid = (string) Str::uuid();
            }
        });
    }

    /**
     * Get the deliverable this violation is for
     */
    public function deliverable(): BelongsTo
    {
        return $this->belongsTo(Deliverable::class);
    }

    /**
     * Get the creator who violated the SLA
     */
    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'creator_id');
    }

    /**
     * Apply penalty based on creator's violation history
     */
    public static function applyPenalty(int $creatorId, int $deliverableId, string $violationType = 'late'): self
    {
        $violationCount = self::where('creator_id', $creatorId)->count();
        
        $penalty = match ($violationCount) {
            0 => 'warning',
            1 => 'restriction_1d',
            2 => 'restriction_3d',
            3 => 'restriction_7d',
            default => 'restriction_10d'
        };

        $penaltyDays = match ($penalty) {
            'restriction_1d' => 1,
            'restriction_3d' => 3,
            'restriction_7d' => 7,
            'restriction_10d' => 10,
            default => 0
        };

        $startDate = $penaltyDays > 0 ? Carbon::now() : null;
        $endDate = $penaltyDays > 0 ? Carbon::now()->addDays($penaltyDays) : null;

        return self::create([
            'deliverable_id' => $deliverableId,
            'creator_id' => $creatorId,
            'violation_type' => $violationType,
            'penalty_applied' => $penalty,
            'penalty_start_date' => $startDate,
            'penalty_end_date' => $endDate,
            'violation_reason' => "Deliverable not provided within SLA timeframe"
        ]);
    }

    /**
     * Check if penalty is currently active
     */
    public function isPenaltyActive(): bool
    {
        if (!$this->penalty_start_date || !$this->penalty_end_date) {
            return false;
        }

        $now = Carbon::now();
        return $now->between($this->penalty_start_date, $this->penalty_end_date);
    }

    /**
     * Get human-readable penalty description
     */
    public function getPenaltyDescriptionAttribute(): string
    {
        return match ($this->penalty_applied) {
            'warning' => 'Warning issued',
            'restriction_1d' => '1-day payout restriction',
            'restriction_3d' => '3-day payout restriction',
            'restriction_7d' => '7-day payout restriction',
            'restriction_10d' => '10-day payout restriction',
            default => 'No penalty'
        };
    }

    /**
     * Get human-readable violation type
     */
    public function getViolationTypeDisplayAttribute(): string
    {
        return match ($this->violation_type) {
            'late' => 'Late Delivery',
            'escalated' => 'Escalated Violation',
            default => ucfirst($this->violation_type)
        };
    }

    /**
     * Scope for active penalties
     */
    public function scopeActivePenalties($query)
    {
        return $query->whereNotNull('penalty_start_date')
                    ->whereNotNull('penalty_end_date')
                    ->where('penalty_start_date', '<=', Carbon::now())
                    ->where('penalty_end_date', '>=', Carbon::now());
    }

    /**
     * Scope for creator's violations
     */
    public function scopeForCreator($query, $creatorId)
    {
        return $query->where('creator_id', $creatorId);
    }

    /**
     * Scope for violations with admin override
     */
    public function scopeAdminOverride($query)
    {
        return $query->where('admin_override', true);
    }
}