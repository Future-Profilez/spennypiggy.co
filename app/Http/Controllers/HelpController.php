<?php

namespace App\Http\Controllers;

use App\Models\HelpArticle;
use App\Models\HelpArticleSlugHistory;
use App\Models\HelpArticleStat;
use App\Models\HelpCategory;
use App\SeoMeta;
use App\Services\Help\HelpAnswer;
use App\Services\Help\HelpContent;
use App\Services\Help\HelpSearch;
use App\Support\HelpMarkdown;
use App\Support\HelpTokens;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\Str;
use Inertia\Inertia;

/**
 * Public help centre.
 *
 * ⚠️ Every route here is declared ABOVE `require auth.php` in web.php. That file
 * ends with the `/{username}/{page?}` profile catch-all and Laravel matches in
 * registration order, so `/help` declared below it is read as a creator called
 * "help" and answered with the profile 404. `route:list` shows the route either
 * way, which is what makes this hard to see.
 *
 * ⚠️ SSR is off (INERTIA_SSR_ENABLED=false) and a link unfurler never runs the
 * page's JavaScript, so meta MUST be applied server-side here. An Inertia
 * <Head> alone leaves every shared help link with the generic site card.
 */
class HelpController extends Controller
{
    /** The directory. */
    public function index(Request $request)
    {
        $audience = $this->requestedAudience($request);

        $categories = HelpContent::indexPayload($audience);

        $this->applyIndexSeo();

        return Inertia::render('Help/Index', [
            'categories' => $categories,
            'audience' => $audience,
            'viewer_audience' => HelpContent::viewerAudience(),
            'escalation' => $this->escalation(),
            'popular' => $this->popular($audience),
            // ⚠️ The ask box is only offered when it can actually answer.
            // Promising "ask in your own words" and then running a keyword
            // search behind it is worse than not offering it: a long, natural
            // question is precisely what keyword search handles badly.
            'ai_enabled' => HelpAnswer::enabled(),
            'ai_max_question' => (int) config('help.ai.max_question_length', 200),
        ]);
    }

    /** One section. */
    public function category(Request $request, string $category)
    {
        $model = HelpCategory::query()
            ->where('slug', $category)
            ->where('is_published', true)
            ->first();

        // 404, never a 200 rendering an empty state: a soft-404 gets indexed and
        // then every junk URL is a page in the search results.
        abort_if(! $model, 404);

        $audience = $this->requestedAudience($request);
        $payload = HelpContent::categoryPayload($model, $audience);

        $this->applyCategorySeo($model, count($payload['articles']));

        return Inertia::render('Help/Category', [
            'category' => $payload,
            'audience' => $audience,
            'viewer_audience' => HelpContent::viewerAudience(),
            'escalation' => $this->escalation(),
            'ai_enabled' => HelpAnswer::enabled(),
            'ai_max_question' => (int) config('help.ai.max_question_length', 200),
        ]);
    }

    /** One answer. */
    public function article(Request $request, string $category, string $article)
    {
        $model = HelpArticle::query()
            ->visible()
            ->with('category')
            ->where('slug', $article)
            ->first();

        // A retitled article keeps answering its old URL. Without this, every
        // link already shared and everything already indexed 404s.
        if (! $model) {
            $history = HelpArticleSlugHistory::query()->where('slug', $article)->first();

            if ($history) {
                $current = HelpArticle::query()->visible()->with('category')->find($history->help_article_id);

                if ($current && $current->featureIsLive()) {
                    return redirect()->route('help.article', [
                        'category' => $current->category->slug,
                        'article' => $current->slug,
                    ], 301);
                }
            }

            abort(404);
        }

        // An article documenting a kill-switched feature must not be readable —
        // it describes something nobody can reach.
        abort_if(! $model->featureIsLive(), 404);

        // The category in the URL is part of the article's identity; a mismatched
        // one is a stale link, not a different page. Redirect rather than 404.
        if ($model->category->slug !== $category) {
            return redirect()->route('help.article', [
                'category' => $model->category->slug,
                'article' => $model->slug,
            ], 301);
        }

        $payload = HelpContent::articlePayload($model);

        // ⚠️ Deferred. A help page is exactly what a bad week hammers, and
        // counting a read must never sit between the visitor and the answer.
        $id = $model->id;
        dispatch(function () use ($id) {
            HelpContent::bump($id, 'views');
        })->afterResponse();

        $this->applyArticleSeo($model, $payload);

        return Inertia::render('Help/Article', [
            'article' => $payload,
            'viewer_audience' => HelpContent::viewerAudience(),
            'escalation' => $this->escalation(),
            'ai_enabled' => HelpAnswer::enabled(),
            'ai_max_question' => (int) config('help.ai.max_question_length', 200),
        ]);
    }

    /**
     * Search. JSON only — the page fetches it as you type.
     *
     * `with_body=1` is for the suggestions rendered INSIDE a support form, where
     * making the reader leave the page to read the answer defeats the purpose.
     * It is capped hard because it ships whole articles.
     */
    public function search(Request $request): JsonResponse
    {
        $data = $request->validate([
            'q' => ['required', 'string', 'max:191'],
            'with_body' => ['nullable', 'boolean'],
            'limit' => ['nullable', 'integer', 'min:1', 'max:12'],
            'audience' => ['nullable', 'in:creator,supporter,both'],
        ]);

        $withBody = (bool) ($data['with_body'] ?? false);
        $limit = (int) ($data['limit'] ?? HelpSearch::LIMIT);

        if ($withBody) {
            $limit = min($limit, HelpContent::SUGGESTION_LIMIT);
        }

        $audience = $data['audience'] ?? HelpContent::viewerAudience();

        $result = HelpSearch::run($data['q'], $audience, $withBody, $limit);

        return response()->json([
            'status' => true,
            'query' => $result['query'],
            'results' => $result['results'],
            'total' => $result['total'],
            // 🚨 A zero-result search must never be a dead end. The caller shows
            // these instead — browsing beats an empty box, and a contact route
            // beats giving up.
            'fallback' => $result['total'] === 0
                ? [
                    'categories' => collect(HelpContent::indexPayload($audience))
                        ->map(fn ($c) => ['slug' => $c['slug'], 'title' => $c['title'], 'icon' => $c['icon']])
                        ->all(),
                    'escalation' => $this->escalation(),
                ]
                : null,
        ]);
    }

    /**
     * Ask a question in ordinary language.
     *
     * 🚨 The answer is generated ONLY from help articles — see HelpAnswer's
     * docblock for why every guardrail there is load-bearing rather than
     * stylistic. This endpoint's own contribution is the honest failure path:
     * whenever an answer cannot be grounded, it returns keyword results and says
     * so, rather than returning a confident sentence nobody can check.
     */
    public function ask(Request $request): JsonResponse
    {
        // ⚠️ The length cap is enforced HERE, not only in the browser. The
        // endpoint is public, and a pasted essay is both an expensive embedding
        // and an expensive prompt.
        $maxQuestion = max(20, (int) config('help.ai.max_question_length', 200));

        $data = $request->validate([
            'q' => ['required', 'string', 'min:3', 'max:'.$maxQuestion],
            'audience' => ['nullable', 'in:creator,supporter,both'],
        ]);

        $audience = $data['audience'] ?? HelpContent::viewerAudience();

        // Keyword results are computed either way. They are the answer when the
        // model declines, and the "read the full article" list when it does not.
        $keyword = HelpSearch::run($data['q'], $audience);

        if (! HelpAnswer::enabled()) {
            return response()->json([
                'status' => true,
                'ai' => false,
                'answered' => false,
                'answer' => null,
                'sources' => [],
                'results' => $keyword['results'],
            ]);
        }

        // Generation costs money on a public endpoint, so it is capped per
        // caller on top of the route's own throttle.
        $key = 'help:ai:'.sha1((string) $request->ip());
        $limit = (int) config('help.ai.rate_limit_per_hour', 30);

        if (RateLimiter::tooManyAttempts($key, $limit)) {
            return response()->json([
                'status' => true,
                'ai' => false,
                'answered' => false,
                'answer' => null,
                'sources' => [],
                'results' => $keyword['results'],
                'reason' => 'rate_limited',
            ]);
        }

        RateLimiter::hit($key, 3600);

        $result = HelpAnswer::ask($data['q'], $audience);

        return response()->json([
            'status' => true,
            'ai' => true,
            'answered' => $result['answered'],
            'answer' => $result['answer'],
            // 🚨 Model output rendered through the same Markdown pipeline as an
            // article, which STRIPS raw HTML and refuses unsafe links. The model
            // is instructed to return Markdown, but instructions are not a
            // security boundary — a model that emits a <script> tag must not be
            // able to put it on our page.
            'answer_html' => $result['answered']
                ? HelpMarkdown::render($result['answer'])['html']
                : null,
            // Always returned when an answer is: the reader must be able to
            // check the source, and a generated sentence with nothing behind it
            // is exactly what this feature must not produce.
            'sources' => $result['sources'],
            'confidence' => $result['confidence'],
            'reason' => $result['reason'],
            'results' => $keyword['results'],
            'escalation' => $result['answered'] ? null : $this->escalation(),
        ]);
    }

    /**
     * "Was this helpful?" and the deflection counters.
     *
     * Public and unauthenticated by design — a guest reading a help article is
     * exactly who this feature exists for, and nothing here identifies them.
     * Aggregate counters only.
     */
    public function feedback(Request $request): JsonResponse
    {
        $data = $request->validate([
            'slug' => ['required', 'string', 'max:191'],
            'helpful' => ['required', 'boolean'],
            // Set when the article was read from inside a support form, so
            // "answered it" can be counted as a ticket that was not opened.
            'context' => ['nullable', 'in:page,support_form'],
        ]);

        $article = HelpArticle::query()->visible()->where('slug', $data['slug'])->first();

        if (! $article || ! $article->featureIsLive()) {
            // Deliberately not 404: this is fire-and-forget analytics from a
            // page that has already rendered, and an error toast about a vote
            // is worse than a lost vote.
            return response()->json(['status' => true]);
        }

        $helpful = (bool) $data['helpful'];
        $context = $data['context'] ?? 'page';

        HelpContent::bump($article->id, $helpful ? 'helpful_yes' : 'helpful_no');

        if ($context === 'support_form') {
            HelpContent::bump($article->id, $helpful ? 'deflected' : 'escalated');
        } elseif (! $helpful) {
            HelpContent::bump($article->id, 'escalated');
        }

        return response()->json([
            'status' => true,
            // A "no" is the moment to offer the next step, not to say thank you.
            'escalation' => $helpful ? null : $this->escalation(),
        ]);
    }

    // ---------------------------------------------------------------- helpers

    /**
     * `?for=creator|supporter|all`, defaulting to the viewer's own role.
     *
     * Explicit `all` is honoured so the filter is escapable — a creator
     * genuinely may want to read what their supporters are told.
     */
    private function requestedAudience(Request $request): ?string
    {
        $requested = $request->query('for');

        if ($requested === 'all') {
            return null;
        }

        if (in_array($requested, [HelpArticle::AUDIENCE_CREATOR, HelpArticle::AUDIENCE_SUPPORTER], true)) {
            return $requested;
        }

        return HelpContent::viewerAudience();
    }

    /**
     * Where someone goes when the help centre did not answer them.
     *
     * ⚠️ There is no general "contact us" form on this platform — a ticket is
     * always attached to a payment (SupportTicketController needs a creator and
     * a source; GuestSupportTicketController needs a payment id). So this hands
     * back what is genuinely available to THIS viewer rather than linking a
     * form that will refuse them.
     */
    private function escalation(): array
    {
        $user = Auth::user();

        return [
            'signed_in' => (bool) $user,
            'email' => config('support.contact_email'),
            // Intercom's provider is loaded for guests as well in IntercomProvider,
            // so we can offer chat to all visitors if configured.
            'chat' => (bool) config('services.intercom.enabled') && (bool) config('services.intercom.app_id'),
            // The ticket flow lives behind a purchase; this is the screen that
            // lists them.
            'purchases_url' => $user ? route('gifter.hub') : null,
        ];
    }

    /**
     * The most-read articles over the last 30 days, so the index leads with what
     * people actually come for rather than with whatever sorts first.
     */
    private function popular(?string $audience): array
    {
        $ids = Cache::remember(
            'help:popular:v1',
            HelpContent::CACHE_TTL,
            fn () => HelpArticleStat::query()
                ->where('date', '>=', now()->subDays(30)->toDateString())
                ->selectRaw('help_article_id, SUM(views) as v')
                ->groupBy('help_article_id')
                ->orderByDesc('v')
                ->limit(8)
                ->pluck('help_article_id')
                ->all()
        );

        if (empty($ids)) {
            return [];
        }

        $articles = HelpArticle::query()
            ->visible()
            ->with('category:id,slug')
            ->whereIn('id', $ids)
            ->get()
            ->sortBy(fn ($a) => array_search($a->id, $ids, true));

        return HelpArticle::withLiveFeatures($articles)
            ->filter(fn (HelpArticle $a) => HelpContent::matchesAudience($a, $audience))
            ->take(6)
            ->map(fn (HelpArticle $a) => HelpContent::card($a))
            ->values()
            ->all();
    }

    private function applyIndexSeo(): void
    {
        $url = rtrim(config('app.url'), '/').'/help';

        SeoMeta::addTag('title', 'Help Centre — Spenny Piggy');
        SeoMeta::addTag('meta', [
            'name' => 'description',
            // ⚠️ Stripe-facing copy. No gift / tip / donation / fundraise / bill
            // wording anywhere in a meta description — it is printed in search
            // results and social cards.
            'content' => 'Answers for creators and supporters — selling content, payouts and fees, checkout, content rules, and your purchases.',
        ]);
        SeoMeta::setCanonical($url);
        SeoMeta::setRobots('index,follow,max-snippet:-1');
        SeoMeta::setOgData('website', 'Help Centre — Spenny Piggy', 'Answers for creators and supporters on Spenny Piggy.', null, $url);
        SeoMeta::addBreadcrumbJsonLd([
            ['name' => 'Home', 'url' => rtrim(config('app.url'), '/')],
            ['name' => 'Help Centre', 'url' => $url],
        ]);
    }

    private function applyCategorySeo(HelpCategory $category, int $count): void
    {
        $base = rtrim(config('app.url'), '/');
        $url = $base.'/help/'.$category->slug;

        $description = Str::limit(
            trim(strip_tags(HelpTokens::render($category->summary ?? ''))) ?: $category->title.' — help and answers on Spenny Piggy.',
            155
        );

        SeoMeta::addTag('title', $category->title.' — Help Centre — Spenny Piggy');
        SeoMeta::addTag('meta', ['name' => 'description', 'content' => $description]);
        SeoMeta::setCanonical($url);
        // A section with nothing published in it is a thin page; keep the crawl
        // going through it but keep it out of the index.
        SeoMeta::setRobots($count > 0 ? 'index,follow,max-snippet:-1' : 'noindex,follow');
        SeoMeta::setOgData('website', $category->title.' — Spenny Piggy Help', $description, null, $url);
        SeoMeta::addBreadcrumbJsonLd([
            ['name' => 'Home', 'url' => $base],
            ['name' => 'Help Centre', 'url' => $base.'/help'],
            ['name' => $category->title, 'url' => $url],
        ]);
    }

    private function applyArticleSeo(HelpArticle $article, array $payload): void
    {
        $base = rtrim(config('app.url'), '/');
        $url = $base.'/help/'.$article->category->slug.'/'.$article->slug;

        $description = Str::limit(trim(strip_tags($payload['summary'])), 155);

        SeoMeta::addTag('title', $article->title.' — Spenny Piggy Help');
        SeoMeta::addTag('meta', ['name' => 'description', 'content' => $description]);
        SeoMeta::setCanonical($url);
        SeoMeta::setRobots('index,follow,max-snippet:-1');
        SeoMeta::setOgData('article', $article->title, $description, null, $url);
        SeoMeta::setTwitterCard('summary', $article->title, $description);

        SeoMeta::addJsonLd([
            '@context' => 'https://schema.org',
            '@type' => 'Article',
            'headline' => $article->title,
            'description' => $description,
            'articleSection' => $article->category->title,
            'inLanguage' => 'en',
            'datePublished' => optional($article->published_at ?? $article->created_at)->toIso8601String(),
            'dateModified' => optional($article->updated_at)->toIso8601String(),
            'mainEntityOfPage' => ['@type' => 'WebPage', '@id' => $url],
            'publisher' => [
                '@type' => 'Organization',
                'name' => 'Spenny Piggy',
                'url' => $base,
            ],
        ]);

        SeoMeta::addBreadcrumbJsonLd([
            ['name' => 'Home', 'url' => $base],
            ['name' => 'Help Centre', 'url' => $base.'/help'],
            ['name' => $article->category->title, 'url' => $base.'/help/'.$article->category->slug],
            ['name' => $article->title, 'url' => $url],
        ]);
    }
}
