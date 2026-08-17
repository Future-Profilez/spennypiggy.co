<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * One row per article per day. AGGREGATE ONLY — no IP, no cookie id, no
 * per-visitor row, matching site_visit_stats and item_view_stats.
 *
 * ⚠️ `date` deliberately has NO cast. With one, Eloquent writes Y-m-d H:i:s;
 * MySQL's DATE column truncates it but SQLite keeps the time, so the unique
 * bucket stops matching and each day fragments into rows nothing can find again.
 * Same trap as SiteVisitStat, ItemViewStat and LeaderboardSnapshot.
 */
class HelpArticleStat extends Model
{
    protected $fillable = [
        'help_article_id',
        'date',
        'views',
        'helpful_yes',
        'helpful_no',
        'deflected',
        'escalated',
    ];

    public function article(): BelongsTo
    {
        return $this->belongsTo(HelpArticle::class, 'help_article_id');
    }
}
