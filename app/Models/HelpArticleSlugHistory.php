<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * Every slug an article has ever had. A retitle answers the old URL with a 301
 * instead of a 404 — without it, retitling breaks every link already shared and
 * everything already indexed.
 */
class HelpArticleSlugHistory extends Model
{
    protected $table = 'help_article_slug_history';

    protected $fillable = ['help_article_id', 'slug'];

    public function article(): BelongsTo
    {
        return $this->belongsTo(HelpArticle::class, 'help_article_id');
    }
}
