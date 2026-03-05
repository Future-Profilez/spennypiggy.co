<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ConfirmationLog extends Model
{
    use HasFactory, HasUuids;

    protected $fillable = [
        'payment_id',
        'risk_identity_id',
        'ip_hash',
        'device_id_hash',
        'otp_verified',
        'typed_confirmation',
        'spend_snapshot',
    ];

    protected $casts = [
        'otp_verified' => 'boolean',
        'spend_snapshot' => 'array',
    ];
}
