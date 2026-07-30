<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class DiagnosticResult extends Model
{
    protected $fillable = [
        'diagnostic_run_id', 'check_key', 'status', 'severity', 'message', 'meta', 'duration_ms',
    ];

    protected $casts = [
        'meta' => 'array',
        'duration_ms' => 'integer',
    ];

    public function run(): BelongsTo
    {
        return $this->belongsTo(DiagnosticRun::class, 'diagnostic_run_id');
    }
}
