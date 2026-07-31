<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

/**
 * One row per listing per day per source. Written only by ItemViewTracker.
 */
class ItemViewStat extends Model
{
    use HasFactory;

    protected $fillable = [
        'item_type',
        'item_id',
        'date',
        'source',
        'views',
        'unique_views',
    ];

    /**
     * ⚠️ No `date` cast, deliberately.
     *
     * With one, Eloquent writes `Y-m-d H:i:s`. MySQL's DATE column truncates that but
     * SQLite keeps the time, so the column ends up holding two formats — the unique
     * bucket stops matching and every day fragments into separate rows. Same trap as
     * `SiteVisitStat` and `LeaderboardSnapshot`.
     */
    protected $casts = [
        'views' => 'integer',
        'unique_views' => 'integer',
    ];
}
