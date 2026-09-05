<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class FounderBonusMonthly extends Model
{
    use HasFactory;

    protected $table = 'founder_bonus';

    protected $fillable = [
        'creator_id',
        'month',
        'first_30d_earnings',
        'founder_qualified_at',
        'monthly_earnings',
        'bonus_amount',
        'payout_status',
        'payout_date',
        'payout_rejection_reason',
        'payment_reference',
        'stripe_transfer_id',
        'stripe_payout_id',
        'payout_record_uuid',
    ];

    protected $casts = [
        'first_30d_earnings' => 'decimal:2',
        'monthly_earnings' => 'decimal:2',
        'bonus_amount' => 'decimal:2',
        'founder_qualified_at' => 'datetime',
        'payout_date' => 'datetime',
    ];

    // Payout status constants
    const STATUS_PENDING = 'pending';

    const STATUS_APPROVED = 'approved';

    const STATUS_PAID = 'paid';

    const STATUS_REJECTED = 'rejected';

    public function creator()
    {
        return $this->belongsTo(User::class, 'creator_id');
    }

    public function scopePendingPayouts($query)
    {
        return $query->where('payout_status', self::STATUS_PENDING);
    }

    public function scopeApprovedPayouts($query)
    {
        return $query->where('payout_status', self::STATUS_APPROVED);
    }

    public function scopePaidPayouts($query)
    {
        return $query->where('payout_status', self::STATUS_PAID);
    }

    public function markAsPaid(?string $paymentReference = null)
    {
        $data = [
            'payout_status' => self::STATUS_PAID,
            'payout_date' => now(),
        ];
        if ($paymentReference) {
            $data['payment_reference'] = $paymentReference;
        }
        $this->update($data);
    }

    public function isPaid(): bool
    {
        return $this->payout_status === self::STATUS_PAID;
    }

    public function isEligibleForPayout(): bool
    {
        return in_array($this->payout_status, [self::STATUS_PENDING, self::STATUS_APPROVED], true);
    }

    public function getFormattedBonusAttribute(): string
    {
        return '£'.number_format((float) $this->bonus_amount, 2);
    }

    public function getFormattedEarningsAttribute(): string
    {
        return '£'.number_format((float) $this->monthly_earnings, 2);
    }
}
