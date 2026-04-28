<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class AuditLog extends Model
{
    use HasFactory, HasUuids;

    public $timestamps = false;

    protected $fillable = [
        'actor',
        'action_type',
        'reference_id',
        'metadata_json',
    ];

    protected $casts = [
        'metadata_json' => 'array',
    ];
}
