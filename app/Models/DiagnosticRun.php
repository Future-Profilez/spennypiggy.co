<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class DiagnosticRun extends Model
{
    protected $fillable = [
        'status', 'environment', 'trigger', 'deep',
        'passed_count', 'warning_count', 'failed_count', 'skipped_count', 'duration_ms',
    ];

    protected $casts = [
        'deep' => 'boolean',
        'passed_count' => 'integer',
        'warning_count' => 'integer',
        'failed_count' => 'integer',
        'skipped_count' => 'integer',
        'duration_ms' => 'integer',
    ];

    public function results(): HasMany
    {
        return $this->hasMany(DiagnosticResult::class);
    }
}
