<?php

namespace App\Models;

use App\Services\Help\HelpContent;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * A help centre section. Nothing here is per-user, so it is safe to cache
 * across viewers.
 */
class HelpCategory extends Model
{
    use HasFactory;

    protected $fillable = [
        'slug',
        'title',
        'summary',
        'icon',
        'audience',
        'sort_order',
        'is_published',
    ];

    protected $casts = [
        'is_published' => 'boolean',
        'sort_order' => 'integer',
    ];

    protected static function booted(): void
    {
        // The tree is cached across every viewer; a write has to drop it or a
        // renamed or newly published section is invisible for the cache window.
        $forget = fn () => HelpContent::forget();
        static::saved($forget);
        static::deleted($forget);
    }

    public function articles(): HasMany
    {
        return $this->hasMany(HelpArticle::class);
    }

    /** Only the articles a stranger is allowed to see. */
    public function publishedArticles(): HasMany
    {
        return $this->articles()->visible();
    }

    public function getRouteKeyName(): string
    {
        return 'slug';
    }
}
