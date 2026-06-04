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

    public function creator()
    {
        return $this->belongsTo(User::class, 'creator_id');
    }
}
