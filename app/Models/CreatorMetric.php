<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class CreatorMetric extends Model
{
    use HasFactory;

    protected $primaryKey = 'creator_id';
    public $incrementing = false;
    protected $keyType = 'string';

    protected $fillable = [
        'creator_id',
        'tx_30d',
        'disputes_30d',
        'dispute_rate_30d',
        'refunds_30d',
        'refund_rate_30d',
        'reserve_percent',
        'payout_delay_days',
        'negative_balance_minor',
        'top_buyer_percent',
        'volatility_score',
        'risk_level',
        'is_overridden'
    ];

    protected $casts = [
        'dispute_rate_30d' => 'decimal:3',
        'refund_rate_30d' => 'decimal:3',
        'top_buyer_percent' => 'decimal:3',
    ];

    public function creator()
    {
        return $this->belongsTo(User::class, 'creator_id', 'uuid');
    }
}
