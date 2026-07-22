<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

/**
 * One row per day, per source, per page type. Aggregate only — see the
 * migration for why there is no per-person data here.
 *
 * Written by the website (VisitTracker), read by the admin app's funnel
 * dashboard. Both apps share the database; only the website has this model.
 */
class SiteVisitStat extends Model
{
    protected $table = 'site_visit_stats';

    protected $fillable = [
        'date',
        'source',
        'page_type',
        'visits',
        'unique_visitors',
    ];

    /**
     * `date` is deliberately NOT cast.
     *
     * With a date cast, Eloquent writes a full 'Y-m-d H:i:s' value. MySQL's DATE
     * column truncates it back to 'Y-m-d', but SQLite stores the whole string —
     * so the next `firstOrNew(['date' => '2026-07-22'])` finds nothing, tries to
     * insert, and hits the unique index. The bucket is a plain 'Y-m-d' string on
     * both engines; keep it that way.
     */
    protected $casts = [
        'visits' => 'integer',
        'unique_visitors' => 'integer',
    ];
}
