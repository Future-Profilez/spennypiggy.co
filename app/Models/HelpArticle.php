<?php

namespace App\Models;

use App\Services\Help\HelpContent;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Collection;
use Illuminate\Support\Str;

/**
 * One help centre answer.
 *
 * ⚠️ `audience` is a DEFAULT FILTER, never an access gate. A supporter following
 * a link to a creator article reads it in full — hiding it would 404 a URL that
 * is in the sitemap and in search results.
 *
 * ⚠️ `body` may contain {{tokens}} (see App\Support\HelpTokens). NEVER retype a
 * price, rate or threshold into it: the homepage FAQ published an 8% fee and a
 * £29.99/mo price for a year because it was typed rather than read from config.
 */
class HelpArticle extends Model
{
    use HasFactory, SoftDeletes;

    public const STATUS_DRAFT = 'draft';

    public const STATUS_PUBLISHED = 'published';

    public const AUDIENCE_CREATOR = 'creator';

    public const AUDIENCE_SUPPORTER = 'supporter';

    public const AUDIENCE_BOTH = 'both';

    public const AUDIENCES = [self::AUDIENCE_CREATOR, self::AUDIENCE_SUPPORTER, self::AUDIENCE_BOTH];

    protected $fillable = [
        'help_category_id',
        'slug',
        'title',
        'summary',
        'body',
        'keywords',
        'audience',
        'sort_order',
        'status',
        'published_at',
        'edited_at',
        'feature_flag',
        'related_slugs',
        'embedding',
        'embedding_hash',
        'embedded_at',
    ];

    protected $casts = [
        'published_at' => 'datetime',
        'edited_at' => 'datetime',
        'embedded_at' => 'datetime',
        'related_slugs' => 'array',
        'embedding' => 'array',
        'sort_order' => 'integer',
    ];

    /**
     * ⚠️ `embedding` is a ~1,500-float array and is HIDDEN. Without this it
     * serialises into every Inertia payload that carries an article — the
     * category listing, the search results, the suggestions inside a support
     * form — and each page would ship megabytes of numbers nothing renders.
     */
    protected $hidden = ['embedding'];

    protected static function booted(): void
    {
        static::creating(function (self $article) {
            if (empty($article->uuid)) {
                $article->uuid = (string) Str::uuid();
            }
        });

        // A retitle changes the URL. Keep the old slug so it answers with a 301
        // instead of a 404 — otherwise every link already shared and everything
        // already indexed breaks the moment a title is tidied up.
        static::updating(function (self $article) {
            if (! $article->isDirty('slug')) {
                return;
            }

            $old = $article->getOriginal('slug');

            if (! $old || $old === $article->slug) {
                return;
            }

            HelpArticleSlugHistory::firstOrCreate(
                ['slug' => $old],
                ['help_article_id' => $article->id]
            );

            // A slug being reused from an earlier edit must leave the history, or
            // the live URL would 301 to itself.
            HelpArticleSlugHistory::where('slug', $article->slug)->delete();
        });

        // The tree is cached across every viewer, so any write has to drop it —
        // otherwise a newly published article is invisible for the cache window
        // and looks like a failed save.
        $forget = fn () => HelpContent::forget();
        static::saved($forget);
        static::deleted($forget);
    }

    public function category(): BelongsTo
    {
        return $this->belongsTo(HelpCategory::class, 'help_category_id');
    }

    public function stats(): HasMany
    {
        return $this->hasMany(HelpArticleStat::class);
    }

    public function slugHistory(): HasMany
    {
        return $this->hasMany(HelpArticleSlugHistory::class);
    }

    public function getRouteKeyName(): string
    {
        return 'slug';
    }

    /**
     * Publicly visible: published, its publish time has arrived, and its feature
     * flag (if any) is on.
     *
     * ⚠️ Publication is decided by TIME, never by a command. A scheduled article
     * goes live at its minute whether or not any queue worker is running — the
     * same rule as scheduled listings and posts.
     *
     * The feature-flag filter is applied in PHP because config is not readable
     * from SQL; the set is small (one row per flagged article) and every caller
     * pages afterwards.
     */
    public function scopeVisible(Builder $query): Builder
    {
        return $query
            ->where('status', self::STATUS_PUBLISHED)
            ->where(function (Builder $q) {
                $q->whereNull('published_at')->orWhere('published_at', '<=', now());
            });
    }

    /**
     * Drop rows whose feature flag is switched off. Called after the query, so a
     * kill-switched feature never has documentation nobody can act on.
     */
    public static function withLiveFeatures(iterable $articles): Collection
    {
        return collect($articles)->filter(fn (self $a) => $a->featureIsLive())->values();
    }

    public function featureIsLive(): bool
    {
        if (empty($this->feature_flag)) {
            return true;
        }

        return (bool) config($this->feature_flag, false);
    }

    /**
     * Slug uniqueness is a property of the TABLE, not of what the viewer may
     * read — so this must see soft-deleted and draft rows, and must exclude the
     * article being renamed or it collides with itself.
     */
    public static function generateUniqueSlug(string $title, ?int $ignoreId = null): string
    {
        $base = Str::slug($title) ?: 'article';
        $slug = $base;
        $i = 1;

        while (
            self::withTrashed()
                ->where('slug', $slug)
                ->when($ignoreId, fn ($q) => $q->where('id', '!=', $ignoreId))
                ->exists()
            || HelpArticleSlugHistory::where('slug', $slug)
                ->when($ignoreId, fn ($q) => $q->where('help_article_id', '!=', $ignoreId))
                ->exists()
        ) {
            $slug = $base.'-'.(++$i);
        }

        return $slug;
    }
}
