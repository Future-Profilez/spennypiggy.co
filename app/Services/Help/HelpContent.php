<?php

namespace App\Services\Help;

use App\Models\HelpArticle;
use App\Models\HelpArticleStat;
use App\Models\HelpCategory;
use App\Support\HelpMarkdown;
use App\Support\HelpTokens;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

/**
 * The ONE definition of what the help centre shows and to whom.
 *
 * Everything — the index, a category page, an article page, the search endpoint
 * and the deflection suggestions inside the support forms — reads this class.
 * Two copies of "is this article visible" is how an unpublished draft ends up on
 * one surface and not another.
 *
 * ⚠️ AUDIENCE IS A DEFAULT FILTER, NEVER A GATE. A supporter who follows a link
 * to a creator article reads it in full. Hiding it would 404 a URL that is in
 * the sitemap, in search results, and possibly in an email we sent.
 */
class HelpContent
{
    /** Nothing here is per-user, so the whole tree is safe to cache for everyone. */
    public const CACHE_TTL = 600;

    public const CACHE_KEY = 'help:tree:v1';

    /** How many suggestions a support form is offered. Three is a glance; ten is a maze. */
    public const SUGGESTION_LIMIT = 3;

    /**
     * Which audience a viewer defaults to.
     *
     * Guests see everything: a stranger arriving from a search result may be
     * either, and guessing wrong hides the answer they came for.
     */
    public static function viewerAudience(): ?string
    {
        $user = Auth::user();

        if (! $user) {
            return null;
        }

        return ((int) $user->role === 1)
            ? HelpArticle::AUDIENCE_CREATOR
            : HelpArticle::AUDIENCE_SUPPORTER;
    }

    /**
     * Does this article belong in a list filtered to $audience?
     *
     * `both` always passes. A null filter means "no filter".
     */
    public static function matchesAudience(HelpArticle|HelpCategory $row, ?string $audience): bool
    {
        if (! $audience || $audience === HelpArticle::AUDIENCE_BOTH) {
            return true;
        }

        return in_array($row->audience, [$audience, HelpArticle::AUDIENCE_BOTH], true);
    }

    /**
     * The full published tree — categories, each with its visible articles.
     *
     * Cached across every viewer because it contains nothing viewer-specific.
     * Audience filtering happens AFTER the cache, in PHP, so one cache entry
     * serves creators, supporters and guests alike.
     */
    public static function tree(): Collection
    {
        $tree = Cache::remember(self::CACHE_KEY, self::CACHE_TTL, function () {
            return HelpCategory::query()
                ->where('is_published', true)
                ->with(['publishedArticles' => fn ($q) => $q
                    ->select('id', 'uuid', 'help_category_id', 'slug', 'title', 'summary', 'audience', 'sort_order', 'feature_flag', 'updated_at')
                    ->orderBy('sort_order')
                    ->orderBy('title'),
                ])
                ->orderBy('sort_order')
                ->orderBy('title')
                ->get();
        });

        // Feature flags are read from config, which is not cacheable alongside
        // the rows — a kill-switch flipped after the cache was written must take
        // effect on the next request, not ten minutes later.
        return $tree->map(function (HelpCategory $category) {
            $category->setRelation(
                'publishedArticles',
                $category->publishedArticles->filter(fn (HelpArticle $a) => $a->featureIsLive())->values()
            );

            return $category;
        });
    }

    /** The index payload: categories with counts and a short article preview each. */
    public static function indexPayload(?string $audience): array
    {
        return self::tree()
            ->filter(fn (HelpCategory $c) => self::matchesAudience($c, $audience))
            ->map(function (HelpCategory $category) use ($audience) {
                $articles = $category->publishedArticles
                    ->filter(fn (HelpArticle $a) => self::matchesAudience($a, $audience))
                    ->values();

                return [
                    'slug' => $category->slug,
                    'title' => $category->title,
                    'summary' => HelpTokens::render($category->summary),
                    'icon' => $category->icon,
                    'audience' => $category->audience,
                    'article_count' => $articles->count(),
                    // A directory tile with no examples says nothing about what
                    // is inside it; four titles is enough to recognise the shelf.
                    'preview' => $articles->take(4)->map(fn (HelpArticle $a) => [
                        'slug' => $a->slug,
                        'title' => $a->title,
                    ])->values()->all(),
                ];
            })
            // A category with nothing in it for this viewer is a dead tile.
            ->filter(fn (array $c) => $c['article_count'] > 0)
            ->values()
            ->all();
    }

    /** One category and every article in it. */
    public static function categoryPayload(HelpCategory $category, ?string $audience): array
    {
        $all = $category->publishedArticles;

        $matching = $all->filter(fn (HelpArticle $a) => self::matchesAudience($a, $audience))->values();

        return [
            'slug' => $category->slug,
            'title' => $category->title,
            'summary' => HelpTokens::render($category->summary),
            'icon' => $category->icon,
            'articles' => $matching->map(fn (HelpArticle $a) => self::card($a))->all(),
            // 🚨 The only way out of a section used to be the browser's Back
            // button. A reader who opened the wrong shelf is one tap from the
            // right one now, without returning to the directory and re-scanning
            // nine tiles. Audience-filtered like everything else on the page.
            'siblings' => self::siblingSections($category, $audience),
            // ⚠️ Reported so the page can offer "show the N written for creators"
            // rather than silently hiding them. A filter the reader cannot see is
            // indistinguishable from missing content.
            'hidden_by_audience' => $all->count() - $matching->count(),
        ];
    }

    /**
     * Every OTHER published section, for the "keep looking" strip.
     *
     * ⚠️ Reads the same cached `tree()` the directory reads, so it costs no
     * extra query, and an empty-for-this-viewer section is dropped for the same
     * reason the directory drops it: a tile leading to "nothing filed here" is a
     * dead end wearing a signpost.
     *
     * @return array<int, array{slug: string, title: string, icon: ?string, article_count: int}>
     */
    public static function siblingSections(HelpCategory $category, ?string $audience): array
    {
        return self::tree()
            ->reject(fn (HelpCategory $c) => $c->id === $category->id)
            ->filter(fn (HelpCategory $c) => self::matchesAudience($c, $audience))
            ->map(function (HelpCategory $c) use ($audience) {
                $count = $c->publishedArticles
                    ->filter(fn (HelpArticle $a) => self::matchesAudience($a, $audience))
                    ->count();

                return [
                    'slug' => $c->slug,
                    'title' => $c->title,
                    'icon' => $c->icon,
                    'audience' => $c->audience,
                    'article_count' => $count,
                ];
            })
            ->filter(fn (array $c) => $c['article_count'] > 0)
            ->values()
            ->all();
    }

    /** The list shape used by cards, search results and suggestions. */
    public static function card(HelpArticle $article): array
    {
        return [
            'slug' => $article->slug,
            'title' => $article->title,
            'summary' => HelpTokens::render($article->summary),
            'audience' => $article->audience,
            'category_slug' => $article->category?->slug ?? $article->getRelationValue('category')?->slug,
            // The search dropdown prints this as the row's eyebrow, so a reader
            // scanning results sees WHICH part of the help centre each answer
            // sits in before reading the title. Additive; nothing keys on it.
            'category_title' => $article->category?->title ?? $article->getRelationValue('category')?->title,
        ];
    }

    /** The full article: tokens resolved, Markdown rendered, headings anchored. */
    public static function articlePayload(HelpArticle $article): array
    {
        $article->loadMissing('category');

        // 🚨 Raw HTML is stripped and unsafe links refused inside HelpMarkdown —
        // this string is injected with dangerouslySetInnerHTML on a public page.
        $rendered = HelpMarkdown::render($article->body);

        return [
            'uuid' => $article->uuid,
            'slug' => $article->slug,
            'title' => $article->title,
            'summary' => HelpTokens::render($article->summary),
            'body_html' => $rendered['html'],
            'toc' => $rendered['toc'],
            'audience' => $article->audience,
            'updated_at' => $article->updated_at?->toIso8601String(),
            // How long the answer takes to read. A reader deciding whether to
            // open this now or contact support instead is answering exactly that
            // question, and "4 min" settles it before they scroll.
            'reading_minutes' => self::readingMinutes($article->body),
            'category' => [
                'slug' => $article->category->slug,
                'title' => $article->category->title,
                'icon' => $article->category->icon,
            ],
            'related' => self::related($article),
            // 🚨 The pager is the SECTION's own order (`sort_order`), not
            // relevance — a help section is written to be read through, and
            // `related` already answers "what else is like this". Without it the
            // only way on from an answer is Back, which is where a reader stops.
            'pager' => self::pager($article),
        ];
    }

    /**
     * Reading time in whole minutes, floor 1.
     *
     * ⚠️ Counted on the MARKDOWN SOURCE, not the rendered HTML — `strip_tags` on
     * the render would still count link URLs and heading anchors as words, and
     * the difference on a link-heavy article is a minute.
     *
     * 200 words a minute is the usual figure for screen prose and is deliberately
     * not tuned: an estimate that claims precision it does not have is worse than
     * a round one.
     */
    public static function readingMinutes(?string $body): int
    {
        $words = str_word_count(strip_tags((string) $body));

        return max(1, (int) ceil($words / 200));
    }

    /**
     * The previous and next article in this article's own category.
     *
     * ⚠️ Live features only, same as every other list — an article documenting a
     * kill-switched feature 404s at its own URL, so linking to it from a pager
     * would be a next step into a 404.
     *
     * ⚠️ Ordered by `sort_order` then id, matching `categoryPayload` exactly. If
     * the two ever disagree, the pager walks a different sequence than the list
     * the reader just came from, which reads as articles going missing.
     *
     * @return array{prev: ?array, next: ?array}
     */
    public static function pager(HelpArticle $article): array
    {
        $siblings = HelpArticle::withLiveFeatures(
            HelpArticle::query()
                ->visible()
                ->with('category:id,slug,title')
                ->where('help_category_id', $article->help_category_id)
                ->orderBy('sort_order')
                ->orderBy('id')
                ->get()
        )->values();

        $index = $siblings->search(fn (HelpArticle $a) => $a->id === $article->id);

        // The article itself is not live-feature filtered out of its own list
        // (it rendered), but a false here would silently make both ends null.
        if ($index === false) {
            return ['prev' => null, 'next' => null];
        }

        $at = fn (int $i) => $siblings->get($i) ? self::card($siblings->get($i)) : null;

        return [
            'prev' => $index > 0 ? $at($index - 1) : null,
            'next' => $at($index + 1),
        ];
    }

    /**
     * Curated related articles, falling back to siblings in the same category.
     *
     * An article that answers one question and offers no next step is where a
     * reader gives up and opens a ticket.
     */
    public static function related(HelpArticle $article): array
    {
        $slugs = collect($article->related_slugs ?? [])->filter()->take(6)->all();

        $curated = $slugs
            ? HelpArticle::query()->visible()->with('category:id,slug')->whereIn('slug', $slugs)->get()
            : collect();

        $curated = HelpArticle::withLiveFeatures($curated);

        if ($curated->count() >= 3) {
            return $curated->take(4)->map(fn (HelpArticle $a) => self::card($a))->all();
        }

        $siblings = HelpArticle::query()
            ->visible()
            ->with('category:id,slug')
            ->where('help_category_id', $article->help_category_id)
            ->where('id', '!=', $article->id)
            ->whereNotIn('slug', $curated->pluck('slug')->all())
            ->orderBy('sort_order')
            ->limit(6)
            ->get();

        return HelpArticle::withLiveFeatures($curated->concat($siblings))
            ->take(4)
            ->map(fn (HelpArticle $a) => self::card($a))
            ->all();
    }

    /**
     * Record one read, one vote, one deflection or one escalation.
     *
     * Never throws — analytics must never be why a help page fails to render,
     * and this runs on the public path.
     *
     * @param  string  $metric  views|helpful_yes|helpful_no|deflected|escalated
     */
    public static function bump(int $articleId, string $metric): void
    {
        $allowed = ['views', 'helpful_yes', 'helpful_no', 'deflected', 'escalated'];

        if (! in_array($metric, $allowed, true)) {
            return;
        }

        try {
            $date = now()->toDateString();

            // Insert-then-increment, so two concurrent reads cannot both read the
            // same value and write it back. Matches ItemViewTracker.
            HelpArticleStat::query()->firstOrCreate(
                ['help_article_id' => $articleId, 'date' => $date],
                ['views' => 0, 'helpful_yes' => 0, 'helpful_no' => 0, 'deflected' => 0, 'escalated' => 0]
            );

            HelpArticleStat::query()
                ->where('help_article_id', $articleId)
                ->where('date', $date)
                ->update([$metric => DB::raw("`{$metric}` + 1")]);
        } catch (\Throwable $e) {
            Log::warning('Help centre stat write failed', [
                'article' => $articleId,
                'metric' => $metric,
                'error' => $e->getMessage(),
            ]);
        }
    }

    /** Drop the cached tree. Called whenever an article or category is written. */
    public static function forget(): void
    {
        Cache::forget(self::CACHE_KEY);
    }
}
