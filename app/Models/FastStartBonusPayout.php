<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class FastStartBonusPayout extends Model
{
    use HasFactory;

    protected $fillable = [
        'creator_uuid',
        'stripe_account_id',
        'window_start',
        'window_end',
        'eligible_at',
        'unsettled_count',
        'last_calculated_at',
        'earnings_minor',
        'bonus_minor',
        'expected_earnings_minor',
        'expected_bonus_minor',
        'clawback_minor',
        'currency',
        'status',
        'stripe_transfer_id',
        'stripe_payout_id',
        'paid_at',
        'reconciled_at',
    ];

    protected $casts = [
        'window_start' => 'datetime',
        'window_end' => 'datetime',
        'eligible_at' => 'datetime',
        'last_calculated_at' => 'datetime',
        'paid_at' => 'datetime',
        'reconciled_at' => 'datetime',
    ];
}
