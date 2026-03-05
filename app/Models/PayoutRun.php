<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class PayoutRun extends Model
{
    use HasFactory, HasUuids;

    protected $fillable = [
        'run_date',
        'status',
        'totals',
    ];

    protected $casts = [
        'run_date' => 'date',
        'totals' => 'array',
    ];
}
