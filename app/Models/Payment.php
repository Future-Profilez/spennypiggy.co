<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Payment extends Model
{
    use HasFactory, HasUuids;

    protected $fillable = [
        'creator_id',
        'risk_identity_id',
        'amount',
        'reserve_amount_minor',
        'platform_holds_funds',
        'stripe_transfer_id',
        'currency',
        'stripe_session_id',
        'stripe_payment_intent_id',
        'status',
        'confirmation_log_id',
        'reason_codes',
    ];

    protected $casts = [
        'reason_codes' => 'array',
        'amount' => 'integer',
        'reserve_amount_minor' => 'integer',
        'platform_holds_funds' => 'boolean',
    ];

    public function riskIdentity()
    {
        return $this->belongsTo(RiskIdentity::class);
    }
    
    public function creator()
    {
        return $this->belongsTo(User::class, 'creator_id', 'uuid'); // Assuming User has uuid column
    }

    public function confirmationLog()
    {
        return $this->belongsTo(ConfirmationLog::class);
    }
}
