<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class LeaderboardSnapshot extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'period',
        'rank',
        'score',
        'supporters',
        'captured_on',
    ];

    /**
     * `captured_on` deliberately has NO date cast. With one, Eloquent writes
     * `Y-m-d H:i:s`; MySQL's DATE column truncates it but SQLite keeps the
     * time, so the same column ends up holding two formats — the daily
     * command's upsert key stops matching and every rank lookup misses.
     * (Same reason `SiteVisitStat` has no cast on its date column.)
     */
    protected $casts = [
        'rank' => 'integer',
        'supporters' => 'integer',
        'score' => 'float',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
