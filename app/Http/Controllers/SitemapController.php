<?php

namespace App\Http\Controllers;

use App\Models\HelpArticle;
use App\Models\HelpCategory;
use App\Models\Post;
use App\Models\Shop;
use App\Models\Task;
use App\Models\User;
use App\Models\WishItem;
use Carbon\Carbon;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;

class SitemapController extends Controller
{
    /**
     * URLs per child sitemap. The protocol caps a sitemap at 50,000 URLs / 50MB;
     * smaller chunks also keep each Lambda response fast.
     */
    public const CHUNK = 5000;

    /**
     * Generated sitemaps are cached. Every response used to be `no-store`, so each
     * crawl re-ran the queries on Lambda.
     */
    public const CACHE_TTL = 3600;

    /**
     * Static + marketing pages. Login/register are deliberately absent — noindex.
     */
    public const STATIC_PAGES = [
        ['url' => '/', 'priority' => '1.0', 'changefreq' => 'daily'],
        ['url' => '/discover', 'priority' => '0.9', 'changefreq' => 'daily'],
        ['url' => '/creators', 'priority' => '0.9', 'changefreq' => 'weekly'],
        ['url' => '/leaderboard', 'priority' => '0.8', 'changefreq' => 'daily'],
        ['url' => '/creators/stripe-safe', 'priority' => '0.8', 'changefreq' => 'monthly'],
        ['url' => '/creators/keep-100', 'priority' => '0.8', 'changefreq' => 'monthly'],
        ['url' => '/creators/features', 'priority' => '0.8', 'changefreq' => 'monthly'],
        ['url' => '/creators/disputes', 'priority' => '0.8', 'changefreq' => 'monthly'],
        ['url' => '/creators/founder-bonus', 'priority' => '0.8', 'changefreq' => 'monthly'],
        ['url' => '/how-spenny-piggy-works', 'priority' => '0.7', 'changefreq' => 'monthly'],
        ['url' => '/founder-program', 'priority' => '0.7', 'changefreq' => 'monthly'],
        ['url' => '/pricing', 'priority' => '0.7', 'changefreq' => 'monthly'],
        ['url' => '/features', 'priority' => '0.7', 'changefreq' => 'monthly'],
        ['url' => '/pride', 'priority' => '0.7', 'changefreq' => 'monthly'],
        ['url' => '/giftstore', 'priority' => '0.7', 'changefreq' => 'monthly'],
        ['url' => '/about', 'priority' => '0.6', 'changefreq' => 'monthly'],
        ['url' => '/contact', 'priority' => '0.6', 'changefreq' => 'monthly'],
        ['url' => '/terms-and-conditions', 'priority' => '0.4', 'changefreq' => 'yearly'],
        ['url' => '/privacy-policy', 'priority' => '0.4', 'changefreq' => 'yearly'],
        ['url' => '/cookies-policy', 'priority' => '0.4', 'changefreq' => 'yearly'],
        ['url' => '/creator-agreement', 'priority' => '0.4', 'changefreq' => 'yearly'],
        ['url' => '/supporter-terms', 'priority' => '0.4', 'changefreq' => 'yearly'],
        ['url' => '/return-policy', 'priority' => '0.4', 'changefreq' => 'yearly'],
        ['url' => '/paid-tasks-terms', 'priority' => '0.4', 'changefreq' => 'yearly'],
        ['url' => '/reserves-and-payments-policy', 'priority' => '0.4', 'changefreq' => 'yearly'],
        ['url' => '/mor-agreement', 'priority' => '0.4', 'changefreq' => 'yearly'],
        ['url' => '/us-addendum', 'priority' => '0.4', 'changefreq' => 'yearly'],
        ['url' => '/copyright-policy', 'priority' => '0.4', 'changefreq' => 'yearly'],
        ['url' => '/content-payment-policy', 'priority' => '0.4', 'changefreq' => 'yearly'],
        ['url' => '/creator-supporter-contract', 'priority' => '0.4', 'changefreq' => 'yearly'],
    ];

    /**
     * `/sitemap.xml` — the URL named in robots.txt and submitted to Search Console.
     *
     * It used to be a flat urlset of static pages only, while the creator, wishlist
     * and post sitemaps sat at URLs that nothing linked to. None of the real content
     * URLs were reachable through a sitemap at all. It is now the index itself, so
     * every child is discoverable from the one submitted URL.
     */
    public function customSitemap()
    {
        return $this->index();
    }

    /**
     * `max('updated_at')` returns a raw string, not a Carbon instance — calling
     * ->toW3cString() on it fatalled, so the whole sitemap index returned a 500
     * and no sub-sitemap was ever discovered.
     */
    private function w3c($value): string
    {
        try {
            return $value instanceof \DateTimeInterface
                ? Carbon::instance($value)->toW3cString()
                : Carbon::parse((string) $value)->toW3cString();
        } catch (\Throwable $e) {
            return now()->toW3cString();
        }
    }

    /**
     * Generate the main sitemap index
     */
    public function index()
    {
        $content = Cache::remember('sitemap:index', self::CACHE_TTL, function () {
            $now = now();

            $entries = [
                ['loc' => url('/seo/sitemap-static.xml'), 'lastmod' => $this->deployedAt()],
            ];

            $children = [
                ['path' => '/seo/sitemap-creators.xml', 'query' => fn () => $this->creatorQuery()],
                ['path' => '/seo/sitemap-wishlists.xml', 'query' => fn () => $this->wishQuery()],
                ['path' => '/seo/sitemap-posts.xml', 'query' => fn () => $this->postQuery()],
                ['path' => '/seo/sitemap-shop-items.xml', 'query' => fn () => $this->shopQuery()],
                ['path' => '/seo/sitemap-tasks.xml', 'query' => fn () => $this->taskQuery()],
                ['path' => '/seo/sitemap-help.xml', 'query' => fn () => $this->helpQuery()],
            ];

            foreach ($children as $child) {
                $count = (int) ($this->safely(fn () => $child['query']()->count()) ?? 0);
                $lastmod = $this->safely(fn () => $child['query']()->max('updated_at')) ?? $now;

                // Always at least one chunk, so an empty table still publishes a
                // valid (empty) child rather than dropping out of the index.
                $chunks = max(1, (int) ceil($count / self::CHUNK));
                for ($page = 1; $page <= $chunks; $page++) {
                    $entries[] = [
                        'loc' => url($child['path']).($page > 1 ? '?page='.$page : ''),
                        'lastmod' => $lastmod,
                    ];
                }
            }

            $xml = '<?xml version="1.0" encoding="UTF-8"?>'."\n"
                .'<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">'."\n";

            foreach ($entries as $entry) {
                $xml .= '  <sitemap>'."\n"
                    .'    <loc>'.htmlspecialchars($entry['loc'], ENT_XML1).'</loc>'."\n"
                    .'    <lastmod>'.$this->w3c($entry['lastmod']).'</lastmod>'."\n"
                    .'  </sitemap>'."\n";
            }

            return $xml.'</sitemapindex>';
        });

        return $this->xml($content);
    }

    /**
     * Generate static pages sitemap
     */
    public function static()
    {
        $content = Cache::remember('sitemap:static', self::CACHE_TTL, function () {
            $urls = [];
            foreach (self::STATIC_PAGES as $page) {
                $urls[] = [
                    'loc' => url($page['url']),
                    // A static page has no per-row timestamp; the deploy is the closest
                    // honest signal. now() on every request claims "changed just now"
                    // forever, which Google learns to ignore.
                    'lastmod' => $this->deployedAt(),
                    'changefreq' => $page['changefreq'],
                    'priority' => $page['priority'],
                ];
            }

            return $this->urlset($urls);
        });

        return $this->xml($content);
    }

    /**
     * Generate creators sitemap
     */
    public function creators()
    {
        $page = $this->page();

        $content = Cache::remember('sitemap:creators:'.$page, self::CACHE_TTL, function () use ($page) {
            $creators = $this->safely(fn () => $this->creatorQuery()
                ->select('id', 'username', 'updated_at')
                // Ordered by id, not updated_at: paging over a column that changes
                // under you skips and repeats rows between chunks.
                ->orderBy('id')
                ->forPage($page, self::CHUNK)
                ->get()) ?? collect();

            $urls = [];
            foreach ($creators as $creator) {
                if (empty($creator->username)) {
                    continue;
                }
                $urls[] = [
                    'loc' => url('/'.$creator->username),
                    'lastmod' => $creator->updated_at,
                    'changefreq' => 'weekly',
                    'priority' => '0.8',
                ];
            }

            return $this->urlset($urls);
        });

        return $this->xml($content);
    }

    /**
     * Generate wishlists sitemap
     */
    public function wishlists()
    {
        $page = $this->page();

        $content = Cache::remember('sitemap:wishlists:'.$page, self::CACHE_TTL, function () use ($page) {
            $wishlists = $this->safely(fn () => $this->wishQuery()
                ->select('id', 'user_id', 'updated_at')
                ->with('user:id,username')
                ->orderBy('id')
                ->forPage($page, self::CHUNK)
                ->get()) ?? collect();

            $urls = [];
            foreach ($wishlists as $wishlist) {
                // WishItem::user() scopes out suspended creators, so this is null for
                // them — the old code dereferenced it and 500'd the whole sitemap.
                if (empty($wishlist->user?->username)) {
                    continue;
                }
                $urls[] = [
                    'loc' => url('/'.$wishlist->user->username.'/wish/'.$wishlist->id),
                    'lastmod' => $wishlist->updated_at,
                    'changefreq' => 'weekly',
                    'priority' => '0.6',
                ];
            }

            return $this->urlset($urls);
        });

        return $this->xml($content);
    }

    /**
     * Shop listings that anyone can open.
     *
     * They only became worth submitting once they carried real meta — before
     * ItemShareService these pages had no title, description or image of their own,
     * so an indexed one was a blank entry.
     */
    public function shopItems()
    {
        $page = $this->page();

        $content = Cache::remember('sitemap:shop-items:'.$page, self::CACHE_TTL, function () use ($page) {
            $items = $this->safely(fn () => $this->shopQuery()
                ->select('id', 'uuid', 'name', 'updated_at')
                // Ordered by id, never updated_at: paging over a column that changes
                // under you skips and repeats rows.
                ->orderBy('id')
                ->forPage($page, self::CHUNK)
                ->get()) ?? collect();

            $urls = [];
            foreach ($items as $item) {
                if (empty($item->uuid)) {
                    continue;
                }

                $urls[] = [
                    'loc' => route('single-shop-list', [
                        'slug' => Str::slug((string) $item->name) ?: 'item',
                        'uuid' => $item->uuid,
                    ]),
                    'lastmod' => $item->updated_at,
                    'changefreq' => 'weekly',
                    'priority' => '0.6',
                ];
            }

            return $this->urlset($urls);
        });

        return $this->xml($content);
    }

    /** Paid tasks that anyone can open. */
    public function tasks()
    {
        $page = $this->page();

        $content = Cache::remember('sitemap:tasks:'.$page, self::CACHE_TTL, function () use ($page) {
            $tasks = $this->safely(fn () => $this->taskQuery()
                ->select('id', 'uuid', 'updated_at')
                ->orderBy('id')
                ->forPage($page, self::CHUNK)
                ->get()) ?? collect();

            $urls = [];
            foreach ($tasks as $task) {
                if (empty($task->uuid)) {
                    continue;
                }

                $urls[] = [
                    'loc' => route('task.show', ['uuid' => $task->uuid]),
                    'lastmod' => $task->updated_at,
                    'changefreq' => 'weekly',
                    'priority' => '0.6',
                ];
            }

            return $this->urlset($urls);
        });

        return $this->xml($content);
    }

    /**
     * Generate creator posts sitemap.
     *
     * Public posts only: a members/subscribers/supporters post renders as a
     * locked teaser, so listing it would send crawlers to a page with nothing
     * to index. Approval and profile visibility mirror the noindex rule in
     * PostsController::applyPostDetailSeo — the two must agree.
     */
    public function posts()
    {
        $page = $this->page();

        $content = Cache::remember('sitemap:posts:'.$page, self::CACHE_TTL, function () use ($page) {
            $posts = $this->safely(fn () => $this->postQuery()
                ->select('id', 'slug', 'user_id', 'updated_at')
                ->with('user:id,username')
                ->orderBy('id')
                ->forPage($page, self::CHUNK)
                ->get()) ?? collect();

            $urls = [];
            foreach ($posts as $post) {
                if (empty($post->user?->username) || empty($post->slug)) {
                    continue;
                }
                $urls[] = [
                    'loc' => url('/'.$post->user->username.'/post/'.$post->slug),
                    'lastmod' => $post->updated_at,
                    'changefreq' => 'weekly',
                    'priority' => '0.6',
                ];
            }

            return $this->urlset($urls);
        });

        return $this->xml($content);
    }

    /**
     * Generate the help centre sitemap — the directory, every published
     * section, and every published article.
     *
     * ⚠️ Listed in BOTH the index above AND robots.txt. A child sitemap in
     * neither is unreachable, which is the bug that left the creator, wishlist
     * and post sitemaps unread for months.
     *
     * Feature-flagged articles are dropped: submitting a URL that 404s because
     * the feature behind it is switched off is a crawl error we chose to create.
     */
    public function help()
    {
        $page = $this->page();

        $content = Cache::remember('sitemap:help:'.$page, self::CACHE_TTL, function () use ($page) {
            $urls = [];

            // Only the first chunk carries the directory and the section pages;
            // repeating them on every page would duplicate them in the index.
            if ($page === 1) {
                $urls[] = [
                    'loc' => url('/help'),
                    'lastmod' => $this->safely(fn () => HelpArticle::query()->visible()->max('updated_at')) ?? $this->deployedAt(),
                    'changefreq' => 'weekly',
                    'priority' => '0.7',
                ];

                $categories = $this->safely(fn () => HelpCategory::query()
                    ->where('is_published', true)
                    ->orderBy('id')
                    ->get(['id', 'slug', 'updated_at'])) ?? collect();

                foreach ($categories as $category) {
                    $urls[] = [
                        'loc' => url('/help/'.$category->slug),
                        'lastmod' => $category->updated_at,
                        'changefreq' => 'weekly',
                        'priority' => '0.6',
                    ];
                }
            }

            $articles = $this->safely(fn () => $this->helpQuery()
                ->with('category:id,slug')
                ->orderBy('id')
                ->forPage($page, self::CHUNK)
                ->get(['id', 'help_category_id', 'slug', 'feature_flag', 'updated_at'])) ?? collect();

            foreach ($articles as $article) {
                if (empty($article->slug) || empty($article->category?->slug) || ! $article->featureIsLive()) {
                    continue;
                }

                $urls[] = [
                    'loc' => url('/help/'.$article->category->slug.'/'.$article->slug),
                    'lastmod' => $article->updated_at,
                    'changefreq' => 'monthly',
                    'priority' => '0.6',
                ];
            }

            return $this->urlset($urls);
        });

        return $this->xml($content);
    }

    /**
     * Manual trigger to clear sitemap cache
     * This route can be called after deployment to regenerate sitemaps
     */
    public function clearCache()
    {
        Cache::forget('sitemap:index');
        Cache::forget('sitemap:static');
        for ($i = 1; $i <= 50; $i++) {
            Cache::forget('sitemap:creators:'.$i);
            Cache::forget('sitemap:wishlists:'.$i);
            Cache::forget('sitemap:posts:'.$i);
            Cache::forget('sitemap:shop-items:'.$i);
            Cache::forget('sitemap:tasks:'.$i);
            Cache::forget('sitemap:help:'.$i);
        }

        return response()->json([
            'success' => true,
            'message' => 'Sitemap cache cleared successfully',
            'timestamp' => now()->toISOString(),
        ]);
    }

    /**
     * ⚠️ This filtered on `users.is_public_profile`, a column that does not exist.
     * The query threw, the catch swallowed it, and the creator sitemap returned an
     * empty urlset on every request — silently, for as long as it has existed. Every
     * creator profile on the platform was missing from the sitemap.
     *
     * `role` 1 = creator, 0 = fan (see the domain model). A fan has no public profile
     * worth indexing, and a suspended account must not be crawled at all.
     */
    private function creatorQuery()
    {
        return User::query()
            ->where('role', 1)
            ->where('suspended_account', 0)
            ->whereNotNull('username');
    }

    /**
     * Published help articles whose scheduled publish time has arrived.
     *
     * The feature-flag check cannot be expressed in SQL (it reads config), so it
     * is applied per row in help() — a flagged article is a handful of rows, and
     * dropping them at query level is not possible.
     */
    private function helpQuery()
    {
        return HelpArticle::query()->visible();
    }

    private function wishQuery()
    {
        $query = WishItem::query()->where('is_approved', 1);

        // is_suspended arrived later than this table; a database without it must
        // still produce a sitemap rather than a 500.
        if (Schema::hasColumn('wish_items', 'is_suspended')) {
            $query->where('is_suspended', 0);
        }

        return $query;
    }

    /**
     * Publicly buyable shop listings.
     *
     * ⚠️ `status` has no migration — it exists on the deployed database and not on a
     * freshly migrated one (see TASKS). Guarding it keeps the sitemap working on both
     * rather than throwing into `safely()` and silently publishing an empty urlset,
     * which is indistinguishable from "this creator sells nothing".
     */
    private function shopQuery()
    {
        $query = Shop::query()
            ->where('approved', 1)
            ->whereHas('user', fn ($q) => $q->where('role', 1)->where('suspended_account', 0));

        foreach (['status' => 1, 'is_suspended' => 0] as $column => $value) {
            if (Schema::hasColumn('shops', $column)) {
                $query->where($column, $value);
            }
        }

        return $query;
    }

    /**
     * Publicly viewable paid tasks. An unapproved task 404s for everyone but its
     * creator, so listing one would send crawlers to a dead page.
     */
    private function taskQuery()
    {
        $query = Task::query()
            ->where('is_approved', 1)
            ->whereHas('creator', fn ($q) => $q->where('role', 1)->where('suspended_account', 0));

        if (Schema::hasColumn('tasks', 'is_suspended')) {
            $query->where('is_suspended', 0);
        }

        return $query;
    }

    private function postQuery()
    {
        return Post::query()
            ->where('approved', 1)
            ->where('for_module', 'public')
            ->whereNotNull('slug')
            // Same `is_public_profile` trap as creatorQuery() — the column does not
            // exist, so this whereHas threw and the post sitemap was always empty.
            ->whereHas('user', fn ($q) => $q->where('role', 1)->where('suspended_account', 0));
    }

    private function page(): int
    {
        return max(1, (int) request()->query('page', 1));
    }

    /**
     * A sitemap must never 500 — Search Console drops a broken one wholesale.
     */
    private function safely(callable $fn)
    {
        try {
            return $fn();
        } catch (\Throwable $e) {
            return null;
        }
    }

    private function deployedAt(): Carbon
    {
        $manifest = public_path('build/manifest.json');
        if (is_file($manifest)) {
            return Carbon::createFromTimestamp(filemtime($manifest));
        }

        return now()->startOfDay();
    }

    /**
     * @param  array<int,array{loc:string,lastmod:mixed,changefreq:string,priority:string}>  $urls
     */
    private function urlset(array $urls): string
    {
        $xml = '<?xml version="1.0" encoding="UTF-8"?>'."\n"
            .'<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">'."\n";

        foreach ($urls as $url) {
            $xml .= '  <url>'."\n"
                .'    <loc>'.htmlspecialchars($url['loc'], ENT_XML1).'</loc>'."\n"
                .'    <lastmod>'.$this->w3c($url['lastmod']).'</lastmod>'."\n"
                .'    <changefreq>'.$url['changefreq'].'</changefreq>'."\n"
                .'    <priority>'.$url['priority'].'</priority>'."\n"
                .'  </url>'."\n";
        }

        return $xml.'</urlset>';
    }

    private function xml(string $content)
    {
        return response($content, 200, [
            'Content-Type' => 'application/xml; charset=UTF-8',
            'Cache-Control' => 'public, max-age='.self::CACHE_TTL,
        ]);
    }
}
