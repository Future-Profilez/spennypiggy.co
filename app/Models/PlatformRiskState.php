<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class PlatformRiskState extends Model
{
    use HasFactory, HasUuids;

    protected $fillable = [
        'state',
        'reason_codes',
        'reason_detail',
        'set_by',
        'set_by_user_id',
        'started_at',
        'expires_at',
        'metrics_snapshot',
    ];

    protected $casts = [
        'reason_codes' => 'array',
        'metrics_snapshot' => 'array',
        'started_at' => 'datetime',
        'expires_at' => 'datetime',
    ];
}
