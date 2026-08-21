<?php

namespace App\Services\Discovery;

use App\Models\DiscoveryCollectionSetting;
use App\Models\PiggyPot;
use App\Models\User;
use App\Models\WishItem;
use App\Support\CatalogueRegistry;
use App\Support\DiscoveryEligibility;
use App\Support\DiscoverySources;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;

/**
 * Discovery Phase 5 — the ten collections, as reusable components.
 *
 * Client brief, 19 Aug 2026, §C: "New to Spenny Piggy · Hidden Gems · Trending ·
 * Almost Funded · New Wishes · Creator Spotlight · Popular Right Now ·
 * Memberships to Discover · Similar Creators · Recommended for You — as
 * reusable components across Discover, homepage, profiles, emails, landing
 * pages." (Birthdays This Week shipped in Phase 4 and lives in its own service,
 * because it carries a consent rule none of these have.)
 *
 * 🚨 ONE DEFINITION, MANY SURFACES — THAT IS THE WHOLE REQUIREMENT. The brief
 * does not ask for ten queries; it asks for ten COMPONENTS that the homepage,
 * Discover, a profile, an email and a landing page all render from the same
 * place. So a surface asks for a collection by key and gets cards; it never
 * writes its own selection, or "Trending" means something different depending on
 * which page you are reading.
 *
 * 🚨 NO COLLECTION IS RANKED BY MONEY, AND NO CARD CARRIES A CREATOR'S
 * EARNINGS. "Popular" and "Trending" are COUNTS OF DISTINCT SUPPORTERS, never
 * sums; "Hidden Gems" ranks on how little a creator has been SHOWN, never on how
 * little they have made. `card()` whitelists six keys by name, so no column can
 * reach a public card by being added to the users table — the same structural
 * guard `CreatorRecommendationService::card()` carries, asserted by test.
 *
 * ⚠️ A LISTING'S OWN PRICE IS NOT THAT. A wish card carries `price` because that
 * is the creator's LISTED price — the public price of the product, shown on
 * every item card on the platform, and a "New Wishes" row without it would be a
 * shop with no prices. What may never appear is what the creator EARNED, their
 * totals, or any internal ranking signal.
 *
 * 🚨 EVERY COLLECTION HAS ITS OWN ATTRIBUTION SOURCE. A card links through
 * `DiscoverySources::profileUrl()` / the JS `discoveryLink()` helper carrying
 * this collection's key, so a sale traces back to the collection that produced
 * it. An untagged collection is a placement that never appears in any creator's
 * numbers and there is NO BACKFILL — attribution is recorded at the moment of
 * the visit or not at all.
 *
 * ⚠️ ELIGIBILITY IS `DiscoveryEligibility`, NOT A LOCAL COPY. Phase 3 and Phase
 * 4 each wrote their own and needed a test to catch them drifting; these ten
 * would have been a third. See that class.
 *
 * ⚠️ FEWER THAN ASKED FOR IS A CORRECT ANSWER. A collection returns what it
 * genuinely has and never pads with an ineligible creator to fill a row — the
 * caller decides whether a short row is worth drawing. `MIN_TO_DRAW` is the
 * advice, not a floor this class enforces.
 */
class CollectionService
{
    /** A collection of creators. */
    public const KIND_CREATOR = 'creator';

    /** A collection of things to buy. */
    public const KIND_ITEM = 'item';

    /**
     * 🚨 THE ONE DEFINITION. Title is the client's own name for the collection —
     * these are the words that appear on the surfaces, so they are transcribed,
     * not paraphrased.
     *
     * ⚠️ `source` must be a key `DiscoverySources::normalise()` accepts, or the
     * server refuses the tag and the collection is invisible in attribution for
     * ever.
     */
    public const COLLECTIONS = [
        'new_creators' => [
            'title' => 'New to Spenny Piggy',
            'kind' => self::KIND_CREATOR,
            'source' => 'new-creators',
            'blurb' => 'Creators who have just arrived.',
        ],
        'hidden_gems' => [
            'title' => 'Hidden Gems',
            'kind' => self::KIND_CREATOR,
            'source' => 'hidden-gems',
            'blurb' => 'Worth finding before everyone else does.',
        ],
        'trending' => [
            'title' => 'Trending',
            'kind' => self::KIND_CREATOR,
            'source' => 'trending',
            'blurb' => 'Picking up supporters this week.',
        ],
        'almost_funded' => [
            'title' => 'Almost Funded',
            'kind' => self::KIND_ITEM,
            'source' => 'almost-funded',
            'blurb' => 'Content goals close to their target.',
        ],
        'new_wishes' => [
            'title' => 'New Wishes',
            'kind' => self::KIND_ITEM,
            'source' => 'new-wishes',
            'blurb' => 'Just listed by creators.',
        ],
        'spotlight' => [
            'title' => 'Creator Spotlight',
            'kind' => self::KIND_CREATOR,
            'source' => 'spotlight',
            'blurb' => 'One creator, chosen this hour.',
        ],
        'popular' => [
            'title' => 'Popular Right Now',
            'kind' => self::KIND_CREATOR,
            'source' => 'popular',
            'blurb' => 'The most supported creators on the platform.',
        ],
        'memberships' => [
            'title' => 'Memberships to Discover',
            'kind' => self::KIND_CREATOR,
            'source' => 'memberships',
            'blurb' => 'Creators you can join, not just buy from.',
        ],
        'similar_creators' => [
            'title' => 'Similar Creators',
            'kind' => self::KIND_CREATOR,
            'source' => 'search-recs',
            'blurb' => 'Close to what you were just looking at.',
        ],
        'personalised' => [
            'title' => 'Recommended for You',
            'kind' => self::KIND_CREATOR,
            'source' => 'personalised',
            'blurb' => 'Based on the creators you support.',
        ],
    ];

    /** Below this a row reads as broken rather than curated. Advice to callers. */
    public const MIN_TO_DRAW = 3;

    private const DEFAULT_LIMIT = 12;

    /**
     * ⚠️ SHORT, AND THE ROTATING ONES CARRY THE BUCKET IN THE KEY.
     *
     * 15 minutes matches Phase 3's pool. "Trending" that is an hour stale is
     * simply wrong, and a collection nobody can refresh is one an admin cannot
     * fix — Phase 6's admin controls will need `forget()` to mean something.
     */
    private const TTL = 900;

    private const ROTATION_SECONDS = 3600;

    /** Trending looks at the last week; longer and it stops being trending. */
    private const TRENDING_DAYS = 7;

    /** "New" means the last month, matching the brief's own framing. */
    private const NEW_DAYS = 30;

    /**
     * @return array{key:string,title:string,kind:string,source:string,blurb:string,cards:array}
     */
    /**
     * @param  User|null  $viewer  the person looking, when there is one
     * @param  User|null  $context  the creator this SURFACE is about — a profile
     *                              being viewed, or the creator just bought from.
     *                              "Similar Creators" beside a checkout means
     *                              similar to WHO THEY JUST BACKED, which is a
     *                              different question from what the viewer has
     *                              bought before.
     */
    /**
     * @param  string|null  $source  the SURFACE's attribution key, when it differs
     *                               from the collection's own.
     *
     * 🚨 THE SOURCE BELONGS TO THE SURFACE, NOT THE COLLECTION. The same
     * "Similar Creators" row appears beside search, on a profile and after a
     * checkout, and those are three different placements — a sale from the
     * checkout row must report as `payment-success`, or the collection's default
     * would tell us it came from search. The collection's own `source` is the
     * default for a surface that has no opinion.
     *
     * ⚠️ Passed through `DiscoverySources::normalise()`, so a surface cannot
     * invent a key: an unrecognised one falls back to the collection's default
     * rather than being stored and silently dropped by the server later.
     */
    public function get(
        string $key,
        int $limit = self::DEFAULT_LIMIT,
        ?User $viewer = null,
        ?User $context = null,
        ?string $source = null
    ): array {
        $meta = self::COLLECTIONS[$key] ?? null;

        if ($meta === null) {
            return $this->empty($key);
        }

        /*
         * 🚨 A SWITCHED-OFF COLLECTION RETURNS NOTHING, AND IT IS CHECKED HERE
         * — before the cache, before the query. Checking it at the call site
         * would mean every future surface has to remember to; checking it after
         * the cache would keep serving a disabled collection for up to fifteen
         * minutes, which is exactly the window in which somebody switches one
         * off because it is showing something it should not.
         */
        if (! $this->isEnabled($key)) {
            return $this->empty($key) + ['title' => $meta['title'], 'disabled' => true];
        }

        $limit = max(1, min($limit, 24));

        /*
         * ⚠️ The viewer is in the cache key ONLY for the two collections that
         * actually read them. Keying every collection per viewer would give a
         * platform-wide list a cache entry per person, which is the same as
         * having no cache at all on the busiest surfaces.
         */
        $scope = in_array($key, ['similar_creators', 'personalised'], true)
            ? 'v'.($viewer?->id ?? 0).'c'.($context?->id ?? 0)
            : 'all';

        $bucket = $key === 'spotlight'
            ? (int) floor(Carbon::now()->getTimestamp() / self::ROTATION_SECONDS)
            : 0;

        $cards = Cache::remember(
            "discovery_collection_v1_{$key}_{$scope}_{$limit}_{$bucket}",
            self::TTL,
            fn () => $this->select($key, $limit, $viewer, $bucket, $context)
        );

        return [
            'key' => $key,
            'title' => $meta['title'],
            'kind' => $meta['kind'],
            'source' => ($source ? DiscoverySources::normalise($source) : null) ?? $meta['source'],
            'blurb' => $meta['blurb'],
            'cards' => $cards,
        ];
    }

    /**
     * Several collections at once, for a surface that draws a stack of them.
     *
     * ⚠️ A collection with nothing in it is DROPPED, not drawn empty. An empty
     * titled row is a dead end wearing a heading — the same reasoning that keeps
     * `MoreCreators` from rendering a "no recommendations" placeholder.
     */
    public function many(
        array $keys,
        int $limit = self::DEFAULT_LIMIT,
        ?User $viewer = null,
        ?User $context = null
    ): array {
        $out = [];

        foreach ($keys as $key) {
            $collection = $this->get($key, $limit, $viewer, $context);

            if (count($collection['cards']) > 0) {
                $out[] = $collection;
            }
        }

        return $out;
    }

    /**
     * Whether an admin has switched this collection off.
     *
     * ⚠️ A MISSING ROW MEANS ENABLED — see the migration. The table ships empty
     * and everything works; turning one off is what creates a row.
     *
     * ⚠️ Cached for a minute, not for the collection TTL. An admin switching a
     * collection off is usually doing it because it is showing something it
     * should not, and waiting fifteen minutes for that to take effect is not a
     * control. One database row per minute per collection is not a load problem.
     *
     * ⚠️ `Schema::hasTable` guard: the admin app's test database has no copy of
     * this table, and a missing table must fail OPEN — a Discovery surface that
     * vanished because a migration had not run yet would look like a bug in the
     * feature rather than in the deploy.
     */
    private function isEnabled(string $key): bool
    {
        return Cache::remember(
            "discovery_collection_enabled_v1_{$key}",
            60,
            function () use ($key) {
                if (! Schema::hasTable('discovery_collection_settings')) {
                    return true;
                }

                $row = DiscoveryCollectionSetting::query()
                    ->where('collection_key', $key)
                    ->first();

                return $row === null ? true : (bool) $row->is_enabled;
            }
        );
    }

    /**
     * The first of these collections that actually has something in it.
     *
     * 🚨 A SURFACE WITH ONE COLLECTION IS A SURFACE THAT IS OFTEN EMPTY.
     * "Similar Creators" needs the creator to have categories, and on this
     * platform only about half of them do — so the checkout's "Discover someone
     * else" prompt, which is the single best moment the platform gets, would
     * have shown nothing roughly half the time. Measured, not assumed: 62
     * creators, 30 accounts with any category at all.
     *
     * ⚠️ THE ORDER IS THE POINT: most relevant first, most likely to exist
     * last. A fallback is not a lower-quality answer, it is a different question
     * that still has one — and a row that appears is worth more than a better
     * row that does not.
     *
     * ⚠️ Returns the LAST key's empty shape when nothing has anything, so a
     * caller still gets a well-formed payload to render nothing from. The row
     * component drops an empty collection itself.
     */
    public function firstNonEmpty(
        array $keys,
        int $limit = self::DEFAULT_LIMIT,
        ?User $viewer = null,
        ?User $context = null,
        ?string $source = null
    ): array {
        $last = $this->empty($keys[count($keys) - 1] ?? '');

        foreach ($keys as $key) {
            $collection = $this->get($key, $limit, $viewer, $context, $source);

            if (count($collection['cards']) > 0) {
                return $collection;
            }

            $last = $collection;
        }

        return $last;
    }

    /** Phase 6's admin controls need this to mean something. */
    public function forget(?string $key = null): void
    {
        foreach ($key ? [$key] : array_keys(self::COLLECTIONS) as $k) {
            Cache::forget("discovery_collection_v1_{$k}_all_".self::DEFAULT_LIMIT.'_0');

            // The switch has its own short cache; an admin toggling a collection
            // must not then wait a minute to see it take effect on a re-run.
            Cache::forget("discovery_collection_enabled_v1_{$k}");
        }
    }

    private function empty(string $key): array
    {
        return [
            'key' => $key,
            'title' => '',
            'kind' => self::KIND_CREATOR,
            'source' => '',
            'blurb' => '',
            'cards' => [],
        ];
    }

    private function select(string $key, int $limit, ?User $viewer, int $bucket, ?User $context = null): array
    {
        return match ($key) {
            'new_creators' => $this->newCreators($limit),
            'hidden_gems' => $this->hiddenGems($limit),
            'trending' => $this->trending($limit),
            'popular' => $this->popular($limit),
            'memberships' => $this->memberships($limit),
            'spotlight' => $this->spotlight($bucket),
            'similar_creators' => $this->similar($limit, $context ?? $viewer, $context !== null),
            'personalised' => $this->personalised($limit, $viewer),
            'almost_funded' => $this->almostFunded($limit),
            'new_wishes' => $this->newWishes($limit),
            default => [],
        };
    }

    /* ------------------------------------------------------- creator sets --- */

    private function eligible()
    {
        return DiscoveryEligibility::scope(User::query());
    }

    private function newCreators(int $limit): array
    {
        return $this->eligible()
            ->where('created_at', '>=', Carbon::now()->subDays(self::NEW_DAYS))
            ->orderByDesc('created_at')
            ->limit($limit)
            ->get(DiscoveryEligibility::CARD_COLUMNS)
            ->map(fn ($u) => $this->card($u))
            ->all();
    }

    /**
     * 🚨 "HIDDEN" IS ABOUT EXPOSURE, NOT EARNINGS. A gem is a creator with
     * something live who has been SHOWN little — measured from
     * `discovery_events`, which is what this platform actually controls. Ranking
     * by low earnings instead would publish a poverty list, and would put the
     * creators least able to convert in front of the most people.
     */
    private function hiddenGems(int $limit): array
    {
        $sellers = $this->creatorsWithSomethingLive();

        if ($sellers === []) {
            return [];
        }

        $shown = Schema::hasTable('discovery_events')
            ? DB::table('discovery_events')
                ->whereIn('creator_id', $sellers)
                ->where('occurred_at', '>=', Carbon::now()->subDays(14))
                ->groupBy('creator_id')
                ->pluck(DB::raw('COUNT(*)'), 'creator_id')
                ->all()
            : [];

        return $this->eligible()
            ->whereIn('id', $sellers)
            ->limit(200)
            ->get(DiscoveryEligibility::CARD_COLUMNS)
            ->sortBy(fn ($u) => (int) ($shown[$u->id] ?? 0))
            ->take($limit)
            ->values()
            ->map(fn ($u) => $this->card($u))
            ->all();
    }

    /** Most distinct supporters in the last week. A COUNT, never a sum. */
    private function trending(int $limit): array
    {
        return $this->bySupporterCount($limit, Carbon::now()->subDays(self::TRENDING_DAYS));
    }

    /** Most distinct supporters, all time. Still a count. */
    private function popular(int $limit): array
    {
        return $this->bySupporterCount($limit, null);
    }

    private function bySupporterCount(int $limit, ?Carbon $since): array
    {
        if (! Schema::hasTable('financial_transactions')) {
            return [];
        }

        $query = DB::table('financial_transactions')
            ->whereNotNull('user_id')
            ->groupBy('user_id')
            /*
             * 🚨 `supporter_id`, NEVER `source_id`. `source` is a nullable MORPH
             * to the payment row (`source_type` + `source_id`), so counting
             * distinct `source_id` counts PAYMENTS, not people — and it silently
             * collides ids across the seven payment tables. "Popular" would then
             * rank by transaction volume while claiming to rank by supporters.
             * Written wrong here first; caught against the real schema.
             */
            ->whereNotNull('supporter_id')
            ->select('user_id', DB::raw('COUNT(DISTINCT supporter_id) as supporters'))
            ->orderByDesc('supporters')
            ->limit($limit * 4);

        if ($since) {
            $query->where('transaction_date', '>=', $since);
        }

        $ranked = $query->pluck('supporters', 'user_id')->all();

        if ($ranked === []) {
            return [];
        }

        return $this->eligible()
            ->whereIn('id', array_keys($ranked))
            ->get(DiscoveryEligibility::CARD_COLUMNS)
            ->sortByDesc(fn ($u) => (int) ($ranked[$u->id] ?? 0))
            ->take($limit)
            ->values()
            ->map(fn ($u) => $this->card($u))
            ->all();
    }

    /** Creators with a live membership level — something to JOIN, not just buy. */
    private function memberships(int $limit): array
    {
        if (! Schema::hasTable('memberships')) {
            return [];
        }

        $ids = DB::table('memberships')
            ->where('is_suspended', 0)
            ->whereNotNull('user_id')
            ->distinct()
            ->limit(500)
            ->pluck('user_id')
            ->all();

        if ($ids === []) {
            return [];
        }

        return $this->eligible()
            ->whereIn('id', $ids)
            ->inRandomOrder()
            ->limit($limit)
            ->get(DiscoveryEligibility::CARD_COLUMNS)
            ->map(fn ($u) => $this->card($u))
            ->all();
    }

    /**
     * One creator, rotating hourly.
     *
     * ⚠️ Seeded by the BUCKET, not by `rand()`. Every visitor in the same hour
     * sees the same spotlight — a "Creator Spotlight" that differs per page load
     * is not a spotlight, and it would make the placement impossible to report
     * on or to explain to the creator who was in it.
     */
    private function spotlight(int $bucket): array
    {
        $pool = $this->eligible()
            ->whereIn('id', $this->creatorsWithSomethingLive() ?: [0])
            ->limit(200)
            ->get(DiscoveryEligibility::CARD_COLUMNS);

        if ($pool->isEmpty()) {
            return [];
        }

        $chosen = $pool->values()->get($bucket % $pool->count());

        return $chosen ? [$this->card($chosen)] : [];
    }

    /** Shares a category with something the viewer already supports. */
    /**
     * @param  User|null  $subject  whose categories to match on
     * @param  bool  $isContext  true when the subject is the creator the surface
     *                           is about rather than the person reading it — the
     *                           subject is then EXCLUDED from its own row, which
     *                           would otherwise recommend the creator whose page
     *                           you are already on.
     */
    private function similar(int $limit, ?User $subject, bool $isContext = false): array
    {
        $viewer = $subject;

        if (! $viewer || ! Schema::hasTable('user_categories')) {
            return [];
        }

        /*
         * ⚠️ `user_categories.category` IS A STRING, and there is no
         * `category_id` — the same column `CreatorRecommendationService`
         * already reads. Assumed an id column; the schema says otherwise.
         */
        $categories = DB::table('user_categories')
            ->where('user_id', $viewer->id)
            ->pluck('category')
            ->all();

        if ($categories === []) {
            return [];
        }

        $ids = DB::table('user_categories')
            ->whereIn('category', $categories)
            ->where('user_id', '!=', $viewer->id)
            ->distinct()
            ->limit(300)
            ->pluck('user_id')
            ->all();

        if ($ids === []) {
            return [];
        }

        return $this->eligible()
            ->whereIn('id', $ids)
            ->limit($limit)
            ->get(DiscoveryEligibility::CARD_COLUMNS)
            ->map(fn ($u) => $this->card($u))
            ->all();
    }

    /**
     * ⚠️ RECOMMENDED FOR YOU NEEDS A "YOU". A signed-out visitor gets nothing
     * rather than a platform-wide list wearing a personalised heading — a row
     * that claims to know you and does not is worse than one fewer row. Phase 7
     * is where this becomes a real model; this is the honest interim.
     */
    private function personalised(int $limit, ?User $viewer): array
    {
        if (! $viewer || ! Schema::hasTable('financial_transactions')) {
            return [];
        }

        $supported = DB::table('financial_transactions')
            // Same correction as above: the person who paid is `supporter_id`.
            ->where('supporter_id', $viewer->id)
            ->whereNotNull('user_id')
            ->distinct()
            ->pluck('user_id')
            ->all();

        if ($supported === []) {
            return [];
        }

        $categories = Schema::hasTable('user_categories')
            ? DB::table('user_categories')->whereIn('user_id', $supported)->pluck('category')->all()
            : [];

        $query = $this->eligible()->whereNotIn('id', array_merge($supported, [$viewer->id]));

        if ($categories !== [] && Schema::hasTable('user_categories')) {
            $query->whereIn('id', DB::table('user_categories')
                ->whereIn('category', $categories)
                ->distinct()
                ->pluck('user_id')
                ->all() ?: [0]);
        }

        return $query->limit($limit)
            ->get(DiscoveryEligibility::CARD_COLUMNS)
            ->map(fn ($u) => $this->card($u))
            ->all();
    }

    /* ---------------------------------------------------------- item sets --- */

    /**
     * Content goals closest to their target.
     *
     * ⚠️ A PERCENTAGE, NOT A SHORTFALL IN POUNDS. "£40 to go" ranks big pots
     * first and reads as a fundraising appeal; "82% there" is progress on a
     * content product, which is what a Piggy Pot is under the content-first
     * rule. A pot with no target has no progress and is not in this collection.
     */
    /**
     * The floor a pot must clear to be called "almost funded".
     *
     * Deliberately a round, defensible number rather than a tuned one: the claim
     * the label makes is qualitative, so the threshold only has to be high enough
     * that a reader who checks the percentage is not contradicted by it.
     */
    private const ALMOST_FUNDED_MIN_PERCENT = 25;

    private function almostFunded(int $limit): array
    {
        if (! Schema::hasTable('piggy_pots')) {
            return [];
        }

        /*
         * ⚠️ `piggy_pots` HAS NO RAISED COLUMN. Progress is summed from PAID
         * contributions — the same `withSum` BioPageService uses, and the same
         * `status = paid` filter, so a pot's percentage is identical wherever it
         * is drawn. Assumed a `raised_amount` column existed when writing this;
         * checking the schema said otherwise.
         */
        return PiggyPot::query()
            ->where('status', 'active')
            ->whereNotNull('target_amount')
            ->where('target_amount', '>', 0)
            ->withSum(
                ['contributions as total_raised' => fn ($q) => $q->where('status', 'paid')],
                'amount'
            )
            ->with('user:id,name,username,role,suspended_account,avatar,avatar_approved,avatar_cdn_modifier')
            ->limit(120)
            ->get()
            ->filter(fn ($pot) => $this->isDiscoverable($pot->user))
            ->map(function ($pot) {
                $raised = (float) ($pot->total_raised ?: 0);
                $target = (float) $pot->target_amount;

                return [
                    'uuid' => $pot->uuid,
                    'title' => $pot->title,
                    'username' => $pot->user?->username,
                    'creator' => $pot->user?->name,
                    'percent' => $target > 0 ? min(100, (int) round(($raised / $target) * 100)) : null,
                ];
            })
            /*
             * 🚨 A COLLECTION CALLED "ALMOST FUNDED" MUST NOT CONTAIN A POT AT 0%.
             * The filter was `percent < 100`, which admits everything from zero
             * up — so on a platform where few pots are funded, the homepage
             * rendered a card reading "ALMOST FUNDED · Studio Setup · 0% there".
             * That is the strongest claim on the page's proof chapter, disproved
             * by the number printed directly under it.
             *
             * ⚠️ Renders FEWER cards rather than padding with an ineligible one —
             * the same rule `CreatorRecommendationService` follows for a small
             * pool. An empty collection is a correct answer here.
             */
            ->filter(fn ($c) => $c['percent'] !== null
                && $c['percent'] >= self::ALMOST_FUNDED_MIN_PERCENT
                && $c['percent'] < 100
                && $c['username'])
            ->sortByDesc('percent')
            ->take($limit)
            ->values()
            ->all();
    }

    private function newWishes(int $limit): array
    {
        if (! Schema::hasTable('wish_items')) {
            return [];
        }

        return WishItem::query()
            ->where('is_suspended', 0)
            ->whereNotNull('user_id')
            ->with('user:id,name,username,role,suspended_account,avatar,avatar_approved,avatar_cdn_modifier')
            ->orderByDesc('id')
            ->limit(120)
            ->get()
            ->filter(fn ($w) => $this->isDiscoverable($w->user))
            ->map(fn ($w) => [
                'uuid' => $w->uuid,
                // ⚠️ `wishname`, which is what `CatalogueRegistry` already
                // records as this type's title column. There is no `name`.
                'title' => (string) ($w->wishname ?? ''),
                'username' => $w->user?->username,
                'creator' => $w->user?->name,
                'price' => $w->price !== null ? (float) $w->price : null,
            ])
            ->filter(fn ($c) => $c['username'] && $c['title'] !== '')
            ->take($limit)
            ->values()
            ->all();
    }

    /* ------------------------------------------------------------ shared --- */

    /**
     * 🚨 SIX KEYS BY NAME. Never a spread of the model, never `toArray()`. A
     * column added to `users` — or an accessor appended to the model — cannot
     * reach a public card by being added upstream. This is the same guard
     * `CreatorRecommendationService::card()` carries and it is asserted by test.
     */
    private function card(User $creator): array
    {
        return [
            'id' => $creator->id,
            'name' => $creator->name,
            'username' => $creator->username,
            'avatar_url' => $creator->avatar_url,
            'cover_url' => $creator->cover_approved ? $creator->cover_url : null,
            'line' => $creator->bio_approved ? Str::limit((string) $creator->bio, 90) : null,
        ];
    }

    /**
     * The item collections join to a creator, so they need the same gate the
     * creator collections get from `DiscoveryEligibility` — otherwise a wish by
     * a suspended or excluded creator reaches Discover through the back door.
     */
    private function isDiscoverable(?User $user): bool
    {
        if (! $user) {
            return false;
        }

        return (int) $user->role === 1
            && (int) ($user->suspended_account ?? 0) === 0
            && (int) ($user->avatar_approved ?? 0) === 1
            && filled($user->username)
            && filled($user->name)
            && ! (Schema::hasColumn('users', 'exclude_from_discovery')
                && (int) ($user->exclude_from_discovery ?? 0) === 1);
    }

    /** Creator ids with at least one live sellable thing, via the registry. */
    private function creatorsWithSomethingLive(): array
    {
        $ids = [];

        foreach (CatalogueRegistry::TYPES as $type => $config) {
            $table = $config['table'] ?? null;

            if (! $table || ! Schema::hasTable($table)) {
                continue;
            }

            $ownerColumn = $config['owner'] ?? 'user_id';

            if (! Schema::hasColumn($table, $ownerColumn)) {
                continue;
            }

            $ids = array_merge(
                $ids,
                DB::table($table)->whereNotNull($ownerColumn)->distinct()->limit(1000)->pluck($ownerColumn)->all()
            );
        }

        return array_values(array_unique(array_filter($ids)));
    }

    /** Whether a key is one this service knows. Used by the admin controls. */
    public static function isKnown(string $key): bool
    {
        return array_key_exists($key, self::COLLECTIONS);
    }

    /** Every collection's attribution source, for the admin attribution view. */
    public static function sources(): array
    {
        $out = [];

        foreach (self::COLLECTIONS as $key => $meta) {
            $out[$key] = DiscoverySources::normalise($meta['source']);
        }

        return $out;
    }
}
