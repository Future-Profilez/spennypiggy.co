<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Str;

class EarlyFraudWarning extends Model
{
    protected $table = 'early_fraud_warnings';

    public $timestamps = false;

    protected $keyType = 'string';

    public $incrementing = false;

    protected static function booted(): void
    {
        static::creating(function (self $model): void {
            if (empty($model->id)) {
                $model->id = (string) Str::uuid();
            }
        });
    }

    protected $fillable = [
        'id',
        'payment_id',
        'stripe_efw_id',
        'stripe_charge_id',
        'fraud_type',
        'risk_level',
        'action',
        'reason_codes',
        'score',
        'stripe_payment_intent',
        'created_at',
        'closed_at',
    ];

    protected $casts = [
        'created_at' => 'datetime',
        'closed_at' => 'datetime',
        'reason_codes' => 'array',
    ];

    public function payment(): BelongsTo
    {
        return $this->belongsTo(Payment::class, 'payment_id', 'id');
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'creator_id', 'uuid');
    }
}
