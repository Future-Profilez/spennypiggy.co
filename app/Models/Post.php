<?php

namespace App\Models;

use App\Models\Concerns\HasCreatorWatermark;
use App\Support\MediaUrl;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Str;
use Ramsey\Uuid\Uuid;

class Post extends Model
{
    use HasCreatorWatermark, HasFactory, SoftDeletes;

    protected $fillable = [
        'uuid',
        'user_id',
        'type',
        'for_module',
        'title',
        'content',
        'image',
        'media',
        'ai_generated',
        'status',
        'approved',
        'approved_at',
        'can_delete_until',
        'slug',
        'is_pinned',
        'scheduled_at',
        'schedule_released_at',
    ];

    protected $hidden = [
        'id',
        // 'user_id',
    ];

    protected $casts = [
        'approved_at' => 'datetime',
        'can_delete_until' => 'datetime',
        'ai_generated' => 'boolean',
        'is_pinned' => 'boolean',
        'media' => 'array',
        'scheduled_at' => 'datetime',
        'schedule_released_at' => 'datetime',
    ];

    protected $appends = [
        'image_url',
        'likes_count',
        'liked',
        'comments_count',
        'pending_items_count',
        'is_scheduled',
    ];

    public static function boot()
    {
        parent::boot();
        static::creating(function ($w) {
            $w->uuid = Uuid::uuid4();
            if (empty($w->slug)) {
                // ⚠️ The creator's id, not their username — the lookup only runs if the
                // plain slug is already taken, which is rare, so an untitled post does
                // not cost a query on every create.
                $w->slug = static::generateUniqueSlug($w->title ?: 'post', null, $w->user_id);
            }
        });

        /*
        | A post scheduled for the future is not published yet.
        |
        | ⚠️ This is a GLOBAL scope on purpose. Post visibility is decided in a
        | dozen places — the profile feed, the module feeds, the post detail page,
        | the sitemap, the posting-cadence count, the creator-journey "have you
        | posted yet" step — and a scheduled post leaking into any one of them is
        | a paid post published early. Adding the predicate to each site would
        | have meant finding every site, and being wrong once is silent.
        |
        | Surfaces that must see unpublished posts (the creator's own feed, the
        | scheduled list, the publisher) opt out with `Post::withScheduled()`.
        |
        | Deliberately NOT viewer-aware: a scope that let the owner through would
        | also let the posting-cadence count through, and a post nobody can read
        | must not hold a creator's subscription income open.
        */
        static::addGlobalScope('published', function ($query) {
            $query->where(function ($q) {
                $q->whereNull('posts.scheduled_at')
                    ->orWhere('posts.scheduled_at', '<=', now());
            });
        });
    }

    /** Include posts whose publish time has not arrived yet. */
    public function scopeWithScheduled($query)
    {
        return $query->withoutGlobalScope('published');
    }

    /** Only posts still waiting on their publish time. */
    public function scopeOnlyScheduled($query)
    {
        return $query->withoutGlobalScope('published')
            ->whereNotNull('scheduled_at')
            ->where('scheduled_at', '>', now());
    }

    /**
     * Is this post still waiting to go live?
     *
     * Appended so a card can label itself without every caller re-deriving the
     * comparison — and getting the timezone wrong in one of them.
     */
    public function getIsScheduledAttribute(): bool
    {
        return $this->scheduled_at !== null && $this->scheduled_at->isFuture();
    }

    /**
     * @param  int|null  $ignoreId  Post to exclude from the uniqueness check — a
     *                              retitled post must not collide with its own
     *                              current slug and end up as "my-post-1".
     */
    /**
     * A slug that is free across the WHOLE table, not just the rows the current
     * viewer may read.
     *
     * 🚨 `posts.slug` carries a UNIQUE index, so every predicate that hides a row from
     * this check is a production 500 on the creator's own post button. Three hid rows
     * here, and all three must stay lifted:
     *
     *  - the `published` global scope (a post waiting on its publish time),
     *  - SoftDeletes (a TRASHED post still occupies the index — this is what produced
     *    `Duplicate entry 'post' for key 'posts.posts_slug_unique'` in production: an
     *    untitled post fell back to the literal `post`, the deleted row holding it was
     *    invisible, the loop never ran, and the insert died),
     *  - `post_slug_history`, whose own slug column is unique and is what serves the
     *    301 for a retitled post. A new post taking a retired slug both collides there
     *    and shadows the redirect for the post that used to own it.
     *
     * The ladder, in order: the title's own slug → the same plus the creator's
     * username (what the platform asks for, and it reads as a real URL) → a numeric
     * suffix → a random token, which cannot collide twice.
     */
    public static function generateUniqueSlug($title, $ignoreId = null, $userId = null)
    {
        $base = Str::slug($title);
        if ($base === '') {
            $base = 'post';
        }

        if (! static::slugTaken($base, $ignoreId)) {
            return $base;
        }

        // Only now is the creator worth a query — most posts never get here.
        $stem = $base;
        if ($userId) {
            $username = Str::slug((string) User::whereKey($userId)->value('username'));
            if ($username !== '') {
                $stem = $base.'-'.$username;
                if (! static::slugTaken($stem, $ignoreId)) {
                    return $stem;
                }
            }
        }

        for ($n = 2; $n <= 50; $n++) {
            $candidate = $stem.'-'.$n;
            if (! static::slugTaken($candidate, $ignoreId)) {
                return $candidate;
            }
        }

        // ⚠️ Never fall out of this method with a slug that was not checked. Fifty
        // collisions means something is wrong with the input, not with the creator —
        // give them a working URL rather than a failed post.
        do {
            $candidate = $stem.'-'.Str::lower(Str::random(6));
        } while (static::slugTaken($candidate, $ignoreId));

        return $candidate;
    }

    /** True when any row — live, scheduled, trashed, or retired — already holds this slug. */
    protected static function slugTaken(string $slug, $ignoreId = null): bool
    {
        $onPost = static::withTrashed()
            ->withoutGlobalScope('published')
            ->where('slug', $slug)
            ->when($ignoreId, fn ($q) => $q->where('id', '!=', $ignoreId))
            ->exists();

        if ($onPost) {
            return true;
        }

        return PostSlugHistory::where('slug', $slug)
            ->when($ignoreId, fn ($q) => $q->where('post_id', '!=', $ignoreId))
            ->exists();
    }

    public function user()
    {
        return $this->belongsTo(User::class, 'user_id')->where('suspended_account', 0);
    }

    public function mentions()
    {
        return $this->hasMany(PostMention::class);
    }

    /**
     * The creators this post mentions. Rendered as links in the post body — a
     * handle that is not in here stays plain text, so `@notarealname` never
     * becomes a dead link.
     */
    public function mentionedUsers()
    {
        return $this->belongsToMany(User::class, 'post_mentions', 'post_id', 'user_id')
            ->select('users.id', 'users.name', 'users.username', 'users.avatar', 'users.avatar_approved', 'users.avatar_cdn_modifier');
    }

    public function getImageUrlAttribute()
    {
        $url = false;
        if (! empty($this->image)) {
            // Check if this is a thank you image with existing transformations (contains /-/text/ or /-/font/)
            if (str_contains($this->image, '/-/text/') || str_contains($this->image, '/-/font/')) {
                // This is a dynamic thank you image - use as-is with domain
                $url = 'https://ucarecdn.com/'.$this->image.'/-/preview/';
                // replace + with %20 for spaces
                $url = str_replace('+', '%20', $url);
            } else {
                // Format conversion AND a size cap. A post image is a full
                // camera photo; uncapped it decodes to tens of MB of bitmap per
                // post, and a feed holds many at once. See MediaUrl::POST_WIDTH.
                $url = MediaUrl::thumb($this->image, MediaUrl::POST_WIDTH);
            }
        }

        // Creator attribution watermark. Returns $url untouched unless the
        // feature is on, the owner relation is loaded, and the URL is a plain
        // image path — a generated thank-you image (the branch above) is
        // refused by MediaUrl because it already carries text operations.
        return MediaUrl::watermark($url, $this->creatorWatermarkUuid());
    }

    /**
     * Get optimized image URL with modern format support
     */
    public function getOptimizedImageUrl(string $format = 'webp', int $quality = 85, array $options = []): string
    {
        if (empty($this->image)) {
            return '';
        }

        $baseUrl = 'https://ucarecdn.com/'.$this->image;
        $transformations = [];

        // Add format transformation
        if (in_array($format, ['webp', 'avif', 'jpeg', 'png'])) {
            $transformations[] = "format/{$format}";
        }

        // Add quality transformation
        $transformations[] = "quality/{$quality}";

        // Add resize if specified
        if (isset($options['width'])) {
            $width = $options['width'];
            $height = $options['height'] ?? '';
            $transformations[] = "resize/{$width}x{$height}";
        }

        // Add other transformations
        if (isset($options['progressive']) && $options['progressive']) {
            $transformations[] = 'progressive/yes';
        }

        return $baseUrl.'/-/'.implode('/-/', $transformations).'/';
    }

    /**
     * Get responsive image data for modern formats
     */
    public function getResponsiveImageData(): array
    {
        if (empty($this->image)) {
            return [];
        }

        $baseUrl = 'https://ucarecdn.com/'.$this->image;
        $sizes = [320, 640, 768, 1024, 1280, 1920];
        $formats = ['original', 'webp', 'avif'];

        $data = [
            'original' => $baseUrl.'/-/format/jpeg/-/quality/85/',
            'formats' => [
                'webp' => $baseUrl.'/-/format/webp/-/quality/85/',
                'avif' => $baseUrl.'/-/format/avif/-/quality/85/',
            ],
            'responsive' => [],
        ];

        foreach ($formats as $format) {
            $formatUrl = $format === 'original' ? $data['original'] : $data['formats'][$format];
            $data['responsive'][$format] = [];

            foreach ($sizes as $size) {
                $data['responsive'][$format][$size] = str_replace('/-/quality/', "/-/resize/{$size}x/-/quality/", $formatUrl);
            }
        }

        return $data;
    }

    public function likes()
    {
        return $this->hasMany(PostLike::class, 'post_id');
    }

    public function getLikesCountAttribute()
    {
        if (array_key_exists('likes_count', $this->attributes)) {
            return $this->attributes['likes_count'];
        }

        return $this->likes()->where('status', 1)->count();
    }

    public function comments()
    {
        return $this->hasMany(PostComment::class, 'post_id');
    }

    public function getCommentsCountAttribute()
    {
        if (array_key_exists('comments_count', $this->attributes)) {
            return $this->attributes['comments_count'];
        }

        $userId = Auth::id();
        $isCreator = (int) $this->user_id === (int) $userId;

        // The creator sees everything on their own post; everyone else sees approved
        // comments plus their own pending ones.
        $applyVisibility = function ($query) use ($userId, $isCreator) {
            if ($isCreator) {
                return $query;
            }

            return $query->where(function ($q) use ($userId) {
                $q->where('is_approved', 1);
                // A guest has no id — `orWhere('user_id', null)` would match every row
                // whose author column is null rather than none of them.
                if ($userId) {
                    $q->orWhere('user_id', $userId);
                }
            });
        };

        // Two counts, not one-per-comment. This used to load every comment and run a
        // replies count for each of them, so a feed of 20 posts issued hundreds of queries.
        $comments = $applyVisibility($this->comments())->count();

        $replies = $applyVisibility(
            PostCommentReplies::whereHas('post_comment', function ($q) {
                $q->where('post_id', $this->id);
            })
        )->count();

        return $comments + $replies;
    }

    public function getLikedAttribute()
    {
        if (array_key_exists('liked_exists', $this->attributes)) {
            return (bool) $this->attributes['liked_exists'];
        }

        $like = null;
        if (Auth::check()) {
            $like = PostLike::where('post_id', $this->id)->where('user_id', Auth::id())->where('status', 1)->first();
        }

        if (! empty($like)) {
            return true;
        }

        return false;
    }

    public function getPendingItemsCountAttribute()
    {
        if (! Auth::check() || Auth::id() !== $this->user_id) {
            return 0;
        }

        $pendingCommentsCount = $this->comments()->where('is_approved', 0)->count();
        $pendingRepliesCount = PostCommentReplies::whereHas('post_comment', function ($q) {
            $q->where('post_id', $this->id);
        })->where('is_approved', 0)->count();

        return $pendingCommentsCount + $pendingRepliesCount;
    }

    /**
     * Scope to filter posts by module type
     */
    public function scopeForModule($query, $module)
    {
        if ($module === 'all') {
            return $query;
        }

        // Map filter names to for_module values
        $moduleMap = [
            'supporters' => 'support',
            'members' => 'membership',
            'subscribers' => 'subscription',
            'shoutouts' => 'public',
        ];

        $moduleValue = $moduleMap[$module] ?? $module;

        return $query->where('for_module', $moduleValue);
    }
}
