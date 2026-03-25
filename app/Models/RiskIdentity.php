<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class RiskIdentity extends Model
{
    use HasFactory, HasUuids;

    protected $fillable = [
        'card_fingerprint',
        'email_hash',
        'device_id_hash',
        'ip_hash',
        'is_guest',
        'cooldown_until',
        'is_blocked',
        'new_creator_restrict_until',
    ];

    protected $casts = [
        'is_guest' => 'boolean',
        'is_blocked' => 'boolean',
        'cooldown_until' => 'datetime',
        'new_creator_restrict_until' => 'datetime',
    ];

    public function rollup()
    {
        return $this->hasOne(IdentityRollup::class);
    }

    public function payments()
    {
        return $this->hasMany(Payment::class);
    }
}
