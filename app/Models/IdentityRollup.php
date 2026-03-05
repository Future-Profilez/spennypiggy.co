<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class IdentityRollup extends Model
{
    use HasFactory; // No HasUuids as PK is foreign key and not auto-generated usually, but here it is PK.
    // Actually, PK is risk_identity_id which is UUID. But it's not auto-generated, it's set from RiskIdentity.
    // So we don't need HasUuids trait if we manually set it, or use it if we want auto-generation (but we don't want new UUID).
    
    protected $primaryKey = 'risk_identity_id';
    public $incrementing = false;
    protected $keyType = 'string';

    protected $fillable = [
        'risk_identity_id',
        'spend_10m',
        'spend_1h',
        'spend_2h',
        'spend_24h',
        'spend_48h',
        'spend_7d',
        'payment_count_10m',
        'creators_paid_24h',
        'creators_paid_48h',
        'new_creators_24h',
        'disputes_30d',
    ];

    public function riskIdentity()
    {
        return $this->belongsTo(RiskIdentity::class, 'risk_identity_id');
    }
}
