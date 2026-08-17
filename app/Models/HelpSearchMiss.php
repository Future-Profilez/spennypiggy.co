<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

/**
 * A search that found nothing. This table IS the backlog of articles to write
 * next — it is the most valuable thing the help centre produces.
 *
 * Aggregate only: the normalised query and a count. Nothing identifies who
 * searched.
 */
class HelpSearchMiss extends Model
{
    protected $fillable = [
        'query_normalised',
        'query_sample',
        'hits',
        'last_seen_at',
    ];

    protected $casts = [
        'last_seen_at' => 'datetime',
        'hits' => 'integer',
    ];
}
