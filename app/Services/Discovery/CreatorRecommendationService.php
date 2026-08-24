<?php

namespace App\Services\Discovery;

use App\Models\DiscoveryEvent;
use App\Models\FinancialTransaction;
use App\Models\User;
use App\Models\UserCategory;
use App\Support\CatalogueRegistry;
use App\Support\DiscoveryEligibility;
use Carbon\Carbon;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Schema;

/**
 * Discovery Phase 3 — "More creators to support".
 *
 * Four creator cards at the foot of every public creator profile: one SIMILAR,
 * one EMERGING, one POPULAR and one rotating DISCOVERY PICK. Reference:
 * Developer Master Plan, 19 Aug 2026, §C Phase 3.
 *
 * 🚨 CREATOR EARNINGS ARE NEVER SHOWN PUBLICLY, AND NOTHING HERE READS AN
 * AMOUNT. Popularity is a COUNT of distinct supporters and conversion is a COUNT
 * of transactions — `financial_transactions` is queried for `supporter_id` and
 * `COUNT(*)` and for nothing else. No column of this service's output carries a
 * figure, a currency or a rank, so there is no path by which a number computed
 * here can reach a card. Adding a money column to the payload is the one change
 * that would break the brief outright.
 *
 * 🚨 THE BANDS ARE INTERNAL. Exposure balancing produces a band per candidate
 * and it is used for ordering only — `card()` is the single place a candidate
 * becomes public, and it copies five presentational fields by name rather than
 * spreading the candidate array. That whitelist is what stops an internal signal
 * from leaking onto a page by accident.
 *
 * ⚠️ THIS RUNS ON EVERY PROFILE VIEW, so it must cost nothing per view. Two
 * caches do that: one PLATFORM-WIDE pool (every eligible creator plus their
 * signals, ~10 queries, rebuilt every 15 minutes) and one PER-PROFILE selection
 * (pure PHP over the pool, no queries at all). A cold cache is ~10 queries for
 * the whole platform; a warm one is zero. There is deliberately no per-card
 * query anywhere in this file.
 */
class CreatorRecommendationService
{
    /** The four slots, in the order the row renders them. */
    public const SLOT_SIMILAR = 'similar';

    public const SLOT_EMERGING = 'emerging';

    public const SLOT_POPULAR = 'popular';

    public const SLOT_PICK = 'pick';

    public const SLOTS = [self::SLOT_SIMILAR, self::SLOT_EMERGING, self::SLOT_POPULAR, self::SLOT_PICK];

    /**
     * How long the platform-wide candidate pool lives.
     *
     * 15 minutes. The pool is the only thing here that touches the database, and
     * its inputs — who is approved, who has something live, who converted — move
     * on the scale of a creator finishing an upload, not of a page load. Shorter
     * would put a ten-query rebuild in front of real visitors for no visible
     * gain; longer would leave a creator who has just gone live invisible for
     * most of an hour.
     */
    private const POOL_TTL = 900;

    /**
     * How long one profile's chosen four live.
     *
     * Also 15 minutes, matched to the pool: a selection outliving the pool it was
     * computed from is a selection that can name a creator the pool has already
     * dropped. The ROTATION BUCKET is in the cache key as well, so the Discovery
     * Pick changes on the hour regardless of when the entry was written.
     */
    private const SELECTION_TTL = 900;

    /** The rotating slot re-draws every hour. */
    private const ROTATION_SECONDS = 3600;

    /**
     * The most creators the pool will hold.
     *
     * ⚠️ Ordered newest-first, so if the eligible set ever exceeds this the
     * OLDEST accounts fall out — which starves the Popular slot of exactly the
     * established creators it exists to show. At that point the pool needs a
     * second pass (top-N by supporters, unioned in) rather than a bigger number.
     * Until then 750 is comfortably the whole platform and the cap is a guard
     * against an unbounded `IN (…)` list, not a filter.
     */
    private const POOL_LIMIT = 750;

    /** Days of SP-generated exposure that count as "recent". */
    private const EXPOSURE_WINDOW_DAYS = 14;

    /**
     * The exposure level at which a creator starts being held back.
     *
     * ⚠️ Not a hard cut-off. A creator on 25 SP-generated visits in a fortnight
     * keeps ~77% of their weight, one on 250 keeps ~49%; nobody is ever excluded
     * for being popular. The brief asks that heavy exposure make a creator LESS
     * LIKELY to fill the two discovery slots — a ban would empty the row on a
     * small platform, which is the failure this softness avoids.
     */
    private const EXPOSURE_SOFT_CAP = 25;

    /** Days of transaction history behind the popularity and conversion signals. */
    private const CONVERSION_WINDOW_DAYS = 90;

    /** An account this young is a candidate for the Emerging slot. */
    private const EMERGING_MAX_AGE_DAYS = 120;

    /**
     * The four cards for one profile.
     *
     * 🚨 NEVER THE PROFILE BEING VIEWED. The viewed creator is removed from the
     * pool before a single slot is filled — not filtered afterwards — so there is
     * no ordering of the code in which they can survive into a card, however
     * small the pool gets.
     *
     * ⚠️ FEWER THAN FOUR IS A CORRECT ANSWER. With three eligible creators this
     * returns three cards, with none it returns an empty array and the row does
     * not render at all. A slot is never padded with an ineligible creator and
     * the same creator never appears twice — each pick is removed from the
     * remaining pool as it is made. On a young platform the honest short row is
     * the requirement; a fourth card showing a suspended or empty profile is not.
     *
     * @return array<int, array{slot: string, name: string, username: string, avatar_url: ?string, cover_url: ?string, line: string}>
     */
    public function forProfile(User $creator): array
    {
        if ((int) $creator->role !== 1) {
            return [];
        }

        $bucket = (int) floor(Carbon::now()->getTimestamp() / self::ROTATION_SECONDS);

        return Cache::remember(
            'discovery_more_creators_v1_'.$creator->id.'_'.$bucket,
            self::SELECTION_TTL,
            fn () => $this->select($creator, $bucket),
        );
    }

    /** Drop both caches for a creator — used by tests and by any admin action that changes eligibility. */
    public function forget(?int $creatorId = null): void
    {
        Cache::forget('discovery_pool_v1');

        if ($creatorId !== null) {
            $bucket = (int) floor(Carbon::now()->getTimestamp() / self::ROTATION_SECONDS);
            Cache::forget('discovery_more_creators_v1_'.$creatorId.'_'.$bucket);
        }
    }

    /**
     * Fill the four slots. Pure PHP over the cached pool — no queries.
     */
    private function select(User $creator, int $bucket): array
    {
        $pool = $this->pool();

        /*
         * The viewed creator's own categories drive the Similar slot. Read from
         * the pool when they are in it; a profile that is not itself eligible
         * (brand new, nothing live yet) still gets a relevant row, at the cost of
         * one small query behind the 15-minute per-profile cache.
         */
        $viewerCategories = $pool[$creator->id]['categories'] ?? $this->categoriesFor($creator->id);

        // 🚨 The viewed creator leaves the pool here and cannot re-enter it.
        unset($pool[$creator->id]);

        if ($pool === []) {
            return [];
        }

        $cards = [];

        foreach (self::SLOTS as $slot) {
            if ($pool === []) {
                break;
            }

            $pick = match ($slot) {
                self::SLOT_SIMILAR => $this->pickSimilar($pool, $viewerCategories),
                self::SLOT_EMERGING => $this->pickEmerging($pool),
                self::SLOT_POPULAR => $this->pickPopular($pool),
                self::SLOT_PICK => $this->pickRotating($pool, $viewerCategories, $creator->id, $bucket),
            };

            if ($pick === null) {
                continue;
            }

            // Removed before the next slot runs: one creator, one card.
            unset($pool[$pick['id']]);

            $cards[] = $this->card($pick, $slot);
        }

        return $cards;
    }

    /**
     * SIMILAR — the creator who overlaps this profile's categories most.
     *
     * A shared explicit category is worth far more than a shared `creator_category`
     * (the single onboarding answer), so the two are weighted an order of
     * magnitude apart rather than summed as equals.
     *
     * ⚠️ Falls back to the best-quality candidate when NOTHING overlaps — a
     * profile with no categories set, or the only creator in its niche, still
     * gets a first card. Exposure balancing is deliberately NOT applied: the
     * brief scopes it to Emerging and Discovery Pick, and holding back a
     * genuinely similar creator because they are being shown elsewhere would make
     * the most relevant slot the least relevant one.
     */
    private function pickSimilar(array $pool, array $viewerCategories): ?array
    {
        $viewer = array_flip($viewerCategories);
        $best = null;
        $bestScore = -1.0;

        foreach ($pool as $c) {
            $shared = 0;
            foreach ($c['categories'] as $cat) {
                if (isset($viewer[$cat])) {
                    $shared++;
                }
            }

            $score = ($shared * 10.0) + ($c['quality'] * 2.0);

            if ($score > $bestScore) {
                $bestScore = $score;
                $best = $c;
            }
        }

        return $best;
    }

    /**
     * EMERGING — a young account with something to show, held back by exposure.
     *
     * ⚠️ "Young" widens rather than empties. Accounts under 120 days are
     * preferred; if none qualify the whole pool is considered and the age term in
     * `emergingScore` still puts the youngest first. An empty Emerging slot on a
     * platform where every creator happens to be six months old would be a bug,
     * not a purist reading of the word.
     */
    private function pickEmerging(array $pool): ?array
    {
        $young = array_filter($pool, fn ($c) => $c['age_days'] <= self::EMERGING_MAX_AGE_DAYS);

        return $this->best($young !== [] ? $young : $pool, fn ($c) => $c['emerging_score']);
    }

    /**
     * POPULAR — most distinct supporters in the last 90 days.
     *
     * 🚨 A COUNT OF PEOPLE, NEVER A SUM OF MONEY. "Popular" and "top earning" are
     * one join apart and only one of them may be computed here; the same rule
     * already governs the Piggy Pot leaderboard, which ranks by purchase count
     * and not by amount. Ties break on conversions, then on how much the creator
     * has live — never on value.
     *
     * ⚠️ NOT exposure-balanced, on purpose. The brief scopes balancing to
     * Emerging and Discovery Pick; damping this slot would turn "Popular" into a
     * second discovery slot and leave the row with nothing that is simply, safely
     * a good place to start.
     */
    private function pickPopular(array $pool): ?array
    {
        return $this->best($pool, fn ($c) => ($c['supporters'] * 1000.0)
            + ($c['conversions'] * 10.0)
            + min($c['live_items'], 20)
            + $c['quality']);
    }

    /**
     * DISCOVERY PICK — a weighted draw that changes every hour.
     *
     * Deterministic weighted sampling (A-Res: key = r^(1/w), highest key wins),
     * seeded from the viewed creator's id and the hour bucket. Deterministic
     * matters twice over — the same visitor reloading the page must not see the
     * row shuffle under them, and the result has to be cacheable at all.
     *
     * ⚠️ Weight is quality × exposure factor × a 1.15 nudge for a creator who
     * shares NO category with this profile. The pick is the row's one chance to
     * leave the niche the visitor is already in; four cards from one category is
     * a row that has technically filled itself and discovered nobody.
     */
    private function pickRotating(array $pool, array $viewerCategories, int $viewedId, int $bucket): ?array
    {
        $viewer = array_flip($viewerCategories);
        $seed = $viewedId.':'.$bucket;

        $best = null;
        $bestKey = -1.0;

        foreach ($pool as $c) {
            $overlaps = false;
            foreach ($c['categories'] as $cat) {
                if (isset($viewer[$cat])) {
                    $overlaps = true;
                    break;
                }
            }

            $weight = max($c['quality'] * $c['exposure_factor'] * ($overlaps ? 1.0 : 1.15), 0.001);

            // Deterministic uniform in (0,1] from the seed and the candidate id.
            $r = ((crc32($seed.':'.$c['id']) % 100000) + 1) / 100000;

            $key = $r ** (1 / $weight);

            if ($key > $bestKey) {
                $bestKey = $key;
                $best = $c;
            }
        }

        return $best;
    }

    /** @param callable(array): float $score */
    private function best(array $pool, callable $score): ?array
    {
        $best = null;
        $bestScore = -INF;

        foreach ($pool as $c) {
            $s = $score($c);
            if ($s > $bestScore) {
                $bestScore = $s;
                $best = $c;
            }
        }

        return $best;
    }

    /**
     * The public shape of one card — an explicit whitelist, never a spread.
     *
     * 🚨 THE BRIEF NAMES EXACTLY THESE: image, display name, @username, a short
     * line, "View profile". Everything the pool carries besides these — quality,
     * exposure, band, supporter and conversion counts, account age — is internal
     * and stays internal. The link itself is built on the client by
     * `discoveryLink(username, 'more-creators', slot)`, so the slot travels as
     * the campaign and the row can be read back per slot.
     */
    private function card(array $c, string $slot): array
    {
        return [
            'slot' => $slot,
            'name' => $c['name'],
            'username' => $c['username'],
            'avatar_url' => $c['avatar_url'],
            'cover_url' => $c['cover_url'],
            'line' => $c['line'],
        ];
    }

    /**
     * Every eligible creator on the platform, with their signals. Cached 15 min.
     *
     * @return array<int, array<string, mixed>> keyed by user id
     */
    private function pool(): array
    {
        return Cache::remember('discovery_pool_v1', self::POOL_TTL, function () {
            $rows = $this->eligibleCreators();

            if ($rows->isEmpty()) {
                return [];
            }

            $ids = $rows->pluck('id')->all();

            $liveItems = $this->liveItemCounts($ids);
            $categories = $this->categoryMap($ids);
            $exposure = $this->exposureCounts($ids);
            $commerce = $this->commerceCounts($ids);

            $pool = [];

            foreach ($rows as $u) {
                $live = (int) ($liveItems[$u->id] ?? 0);

                /*
                 * 🚨 "At least one thing live to buy or join" is a HARD gate, not
                 * a score. A recommendation card that lands a supporter on a
                 * profile with nothing on it is the exact dead end this row was
                 * built to remove.
                 */
                if ($live < 1) {
                    continue;
                }

                $cats = $categories[$u->id] ?? [];
                $ageDays = $u->created_at ? max(0, (int) $u->created_at->diffInDays(Carbon::now())) : 0;
                $exposureCount = (int) ($exposure[$u->id] ?? 0);
                $supporters = (int) ($commerce[$u->id]['supporters'] ?? 0);
                $conversions = (int) ($commerce[$u->id]['conversions'] ?? 0);

                /*
                 * ⚠️ The accessors are viewer-dependent — `profileMediaVisible()`
                 * returns true for the OWNER of an unapproved asset — and this
                 * array goes into a cache shared by every visitor. Safe only
                 * because eligibility already requires `avatar_approved = 1`, and
                 * the cover is read through its own flag rather than the
                 * accessor's judgement. Never relax the avatar gate without
                 * building these URLs by hand.
                 */
                $completeness = $this->completeness($u, $cats, $live);
                $standing = $this->standing($u);
                $exposureFactor = $this->exposureFactor($exposureCount);

                $quality = (0.30 * $completeness)
                    + (0.25 * min($live / 5, 1.0))
                    + (0.20 * min($conversions / 10, 1.0))
                    + (0.15 * $standing)
                    + (0.10 * $this->recency($ageDays));

                $pool[$u->id] = [
                    'id' => (int) $u->id,
                    'name' => $u->name,
                    'username' => $u->username,
                    'avatar_url' => $u->avatar_url,
                    'cover_url' => (int) $u->cover_approved === 1 ? ($u->cover_url ?: null) : null,
                    'line' => $this->line($u, $cats),
                    'categories' => $cats,
                    'age_days' => $ageDays,
                    'live_items' => $live,
                    'supporters' => $supporters,
                    'conversions' => $conversions,
                    'exposure' => $exposureCount,
                    'exposure_factor' => $exposureFactor,
                    'quality' => $quality,
                    // Emerging wants the young, the complete and the under-shown.
                    'emerging_score' => $quality * $exposureFactor * $this->youthFactor($ageDays),
                    /*
                     * ⚠️ INTERNAL ONLY — the brief is explicit that bands are
                     * never shown. It exists so the balancing can be reasoned
                     * about in a tinker session or a log line, and `card()`
                     * never copies it.
                     */
                    'band' => $exposureFactor >= 0.85 ? 'under_shown' : ($exposureFactor >= 0.6 ? 'normal' : 'over_shown'),
                ];
            }

            return $pool;
        });
    }

    /**
     * Good standing, publicly visible, and not switched off by an admin.
     *
     * 🚨 THE CLAUSES NOW LIVE IN `App\Support\DiscoveryEligibility`. They were
     * written here first and copied into `BirthdayDiscoveryService`, which is
     * why `BirthdayDiscoveryTest` carries a test whose whole job is to catch the
     * two drifting apart. Phase 5's collections would have made a third copy, so
     * the rule was extracted instead. Change it there, once.
     *
     * ⚠️ `exclude_from_discovery` is read through `Schema::hasColumn` — the same
     * defensive pattern `DiscoveryService` already uses. Both apps share one
     * database and this column arrived with Phase 3; a missing column here would
     * throw on EVERY profile page rather than degrade, which is not a trade this
     * surface is worth.
     */
    private function eligibleCreators()
    {
        return DiscoveryEligibility::scope(User::query())
            ->orderByDesc('id')
            ->limit(self::POOL_LIMIT)
            ->get(DiscoveryEligibility::CARD_COLUMNS);
    }

    /**
     * "Has something live to buy or join", counted once per sellable type.
     *
     * ⚠️ Six grouped queries, driven by `CatalogueRegistry::TYPES` rather than by
     * six hand-written conditions. That registry exists precisely because the six
     * modules each have their own idea of what "live" means (`approved` vs
     * `is_approved` vs a status string, `user_id` vs Task's `creator_id`,
     * `is_suspended` absent on Piggy Pot), and a seventh sellable type must not
     * need an edit here.
     *
     * @return array<int, int>
     */
    private function liveItemCounts(array $ids): array
    {
        $counts = [];

        foreach (CatalogueRegistry::TYPES as $type => $cfg) {
            $model = $cfg['model'];
            $owner = $cfg['owner'];
            $table = $cfg['table'];

            $query = $model::query()->whereIn($owner, $ids);

            if ($cfg['approval']) {
                $query->where($cfg['approval'], 1);
            }

            // A pot has no boolean approval column; `moderation_hold` is its held state.
            if ($type === 'piggy_pot') {
                $query->where('status', 'active');
            }

            if ($cfg['suspend']) {
                $query->where(function ($q) use ($cfg) {
                    $q->where($cfg['suspend'], 0)->orWhereNull($cfg['suspend']);
                });
            }

            /*
             * ⚠️ `whereNotIn` on a NULLable column drops the NULL rows too — SQL
             * says NULL NOT IN (…) is NULL, not true. Most rows have no status at
             * all, so the naive form would report the whole platform as having
             * nothing live.
             */
            if ($cfg['active'] && Schema::hasColumn($table, $cfg['active'])) {
                $query->where(function ($q) use ($cfg) {
                    $q->whereNull($cfg['active'])
                        ->orWhereNotIn($cfg['active'], ['paused', 'archived', 'inactive', 'draft', 'deleted']);
                });
            }

            // A scheduled listing is not on sale yet.
            if (Schema::hasColumn($table, 'publish_at')) {
                $query->where(function ($q) {
                    $q->whereNull('publish_at')->orWhere('publish_at', '<=', Carbon::now());
                });
            }

            $rows = $query->selectRaw($owner.' as owner_id, COUNT(*) as total')
                ->groupBy($owner)
                ->pluck('total', 'owner_id');

            foreach ($rows as $ownerId => $total) {
                $counts[(int) $ownerId] = ($counts[(int) $ownerId] ?? 0) + (int) $total;
            }
        }

        return $counts;
    }

    /** @return array<int, array<int, string>> */
    private function categoryMap(array $ids): array
    {
        $map = [];

        UserCategory::query()
            ->whereIn('user_id', $ids)
            ->get(['user_id', 'category'])
            ->each(function ($row) use (&$map) {
                $category = trim((string) $row->category);
                if ($category !== '') {
                    $map[(int) $row->user_id][] = $category;
                }
            });

        return array_map(fn ($c) => array_values(array_unique($c)), $map);
    }

    private function categoriesFor(int $userId): array
    {
        return $this->categoryMap([$userId])[$userId] ?? [];
    }

    /**
     * Recent SP-generated exposure — the input the whole balancing rests on.
     *
     * ⚠️ SP-GENERATED VISITS ONLY. `bio-link` is the creator's own audience
     * arriving under their own steam, and counting it here would penalise a
     * creator for promoting themselves — the precise opposite of what exposure
     * balancing is for. `spGenerated()` is the same scope every published
     * Discovery figure uses.
     *
     * @return array<int, int>
     */
    private function exposureCounts(array $ids): array
    {
        return DiscoveryEvent::query()
            ->spGenerated()
            ->whereIn('creator_id', $ids)
            ->where('event_type', DiscoveryEvent::TYPE_VISIT)
            ->where('occurred_at', '>=', Carbon::now()->subDays(self::EXPOSURE_WINDOW_DAYS))
            ->selectRaw('creator_id, COUNT(*) as total')
            ->groupBy('creator_id')
            ->pluck('total', 'creator_id')
            ->map(fn ($v) => (int) $v)
            ->all();
    }

    /**
     * Distinct supporters and completed purchases in the last 90 days.
     *
     * 🚨 NO AMOUNT COLUMN IS SELECTED, SUMMED OR RETURNED. This is the one query
     * in Phase 3 that touches the ledger, and it reads `supporter_id` and
     * `COUNT(*)`. The refunded/failed/cancelled/disputed exclusion mirrors
     * `UserProfileService::getProfileSocialProof()` so "supporters" means the
     * same thing on the card as it does on the profile it points to.
     *
     * @return array<int, array{supporters: int, conversions: int}>
     */
    private function commerceCounts(array $ids): array
    {
        $rows = FinancialTransaction::query()
            ->whereIn('user_id', $ids)
            ->where('type', 'income')
            ->whereNotIn('status', ['refunded', 'failed', 'cancelled', 'disputed'])
            ->whereNotNull('supporter_id')
            ->where('transaction_date', '>=', Carbon::now()->subDays(self::CONVERSION_WINDOW_DAYS))
            ->selectRaw('user_id, COUNT(DISTINCT supporter_id) as supporters, COUNT(*) as conversions')
            ->groupBy('user_id')
            ->get();

        $map = [];

        foreach ($rows as $row) {
            $map[(int) $row->user_id] = [
                'supporters' => (int) $row->supporters,
                'conversions' => (int) $row->conversions,
            ];
        }

        return $map;
    }

    /**
     * How finished the profile looks, 0..1.
     *
     * The avatar is already a hard gate, so what is left is what makes a card
     * worth clicking: something written, a banner, a stated category, and more
     * than one thing on sale.
     */
    private function completeness($u, array $categories, int $liveItems): float
    {
        $score = 0.0;

        if (filled($u->bio) && (int) $u->bio_approved === 1) {
            $score += 0.4;
        }

        if (filled($u->cover) && (int) $u->cover_approved === 1) {
            $score += 0.25;
        }

        if ($categories !== []) {
            $score += 0.15;
        }

        if ($liveItems >= 3) {
            $score += 0.2;
        } elseif ($liveItems >= 2) {
            $score += 0.1;
        }

        return min($score, 1.0);
    }

    /**
     * Standing beyond the hard eligibility gate, 0..1.
     *
     * ⚠️ A creator whose recurring subscriptions are paused for missed posting
     * cadence (`content_posting_paused_at`) is not excluded — they are simply
     * ranked below an active one. They still have live listings a supporter can
     * buy; the pause governs renewals, not the shopfront, and treating it as a
     * ban would quietly delete creators from Discovery for a reason the brief
     * never lists.
     */
    private function standing($u): float
    {
        $score = 0.55;

        if ((int) $u->identity_status === 1) {
            $score += 0.3;
        }

        if ($u->content_posting_paused_at === null) {
            $score += 0.15;
        }

        return min($score, 1.0);
    }

    /** Newer accounts score higher, flattening out after roughly a year. */
    private function recency(int $ageDays): float
    {
        return max(0.0, 1.0 - min($ageDays, 365) / 365);
    }

    /** The Emerging slot's age preference: full weight under 120 days, tapering after. */
    private function youthFactor(int $ageDays): float
    {
        if ($ageDays <= self::EMERGING_MAX_AGE_DAYS) {
            return 1.0;
        }

        return max(0.25, self::EMERGING_MAX_AGE_DAYS / max($ageDays, 1));
    }

    /**
     * Exposure balancing v1, as a multiplier in (0, 1].
     *
     * `1 / (1 + log10(1 + exposure / 25))` — 0 visits keeps full weight, 25 keeps
     * ~0.77, 250 keeps ~0.49, 2,500 keeps ~0.33. Logarithmic on purpose: a linear
     * penalty would bench a creator entirely after one good week, and the brief
     * asks for LESS LIKELY, not excluded.
     */
    private function exposureFactor(int $exposure): float
    {
        if ($exposure <= 0) {
            return 1.0;
        }

        return 1 / (1 + log10(1 + ($exposure / self::EXPOSURE_SOFT_CAP)));
    }

    /**
     * The short line under the name.
     *
     * ⚠️ CONTENT-FIRST, AND NO NUMBERS. The creator's own approved bio first;
     * their stated categories next; a neutral line last. Nothing derived from
     * money, supporters or rank ever reaches this string — see the class note.
     * An unapproved bio is never used: it has not passed review, and this row
     * publishes it on somebody else's profile.
     */
    private function line($u, array $categories): string
    {
        if (filled($u->bio) && (int) $u->bio_approved === 1) {
            $bio = trim(preg_replace('/\s+/', ' ', strip_tags((string) $u->bio)));

            if ($bio !== '') {
                return mb_strimwidth($bio, 0, 96, '…');
            }
        }

        if ($categories !== []) {
            return mb_strimwidth(implode(' · ', array_slice($categories, 0, 3)), 0, 96, '…');
        }

        return 'Creating on Spenny Piggy';
    }
}
