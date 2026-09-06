<?php

namespace App\Services\Help;

use App\Models\HelpArticle;
use App\Models\HelpSearchMiss;
use App\Support\HelpMarkdown;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

/**
 * Help centre search.
 *
 * 🚨 A search box that returns nothing and says nothing is worse than no search
 * box — the reader concludes the platform has no answer and opens a ticket.
 * Every zero-result query is RECORDED (help_search_misses) and the caller is
 * expected to offer category browse plus a contact route in its place.
 *
 * ⚠️ ONE SCORER, TWO CANDIDATE QUERIES. MySQL narrows with FULLTEXT, sqlite (the
 * test database, which has no FULLTEXT) narrows with LIKE — but both hand the
 * same rows to the same PHP scorer. A ranking that differed by driver would mean
 * the test suite asserts an order production never produces.
 */
class HelpSearch
{
    public const CACHE_TTL = 900;

    public const MIN_QUERY_LENGTH = 2;

    /** Below this we do not record a miss — two characters is a typo, not a gap. */
    public const MIN_MISS_LENGTH = 3;

    public const LIMIT = 12;

    /**
     * Dropped before scoring so "how do I get paid" ranks on "paid", not on
     * "how". Kept if a query is nothing but these, so a search still runs.
     */
    private const STOPWORDS = [
        'a', 'an', 'and', 'are', 'as', 'at', 'be', 'but', 'by', 'can', 'do', 'does',
        'for', 'from', 'get', 'has', 'have', 'how', 'i', 'if', 'in', 'is', 'it', 'my',
        'no', 'not', 'of', 'on', 'or', 'so', 'that', 'the', 'this', 'to', 'was', 'what',
        'when', 'where', 'which', 'who', 'why', 'will', 'with', 'you', 'your',
    ];

    /**
     * Lowercase, strip punctuation, collapse whitespace, cap at the unique
     * index width. "Where's my payout?" and "wheres my payout" become one row.
     */
    public static function normalise(string $query): string
    {
        $q = mb_strtolower(trim($query));

        // ⚠️ Apostrophes are REMOVED, not turned into spaces. Replacing them
        // splits every contraction — "where's my payout" became "where s my
        // payout", which is a different row from "wheres my payout", so the
        // backlog fragmented one real question across several entries and each
        // one looked too rare to act on. Covers the straight and curly forms.
        $q = str_replace(["'", '’', '`', '´'], '', $q);

        $q = preg_replace('/[^\p{L}\p{N}\s]+/u', ' ', $q) ?? '';
        $q = preg_replace('/\s+/u', ' ', $q) ?? '';

        return mb_substr(trim($q), 0, 191);
    }

    /** Meaningful terms for scoring. */
    public static function terms(string $normalised): array
    {
        $words = array_values(array_filter(explode(' ', $normalised)));

        $meaningful = array_values(array_filter($words, fn ($w) => ! in_array($w, self::STOPWORDS, true) && mb_strlen($w) > 1));

        // A query made entirely of stopwords ("how do I") still has to search
        // something — falling through to an empty term list returns everything.
        return array_map([self::class, 'stem'], $meaningful ?: $words);
    }

    /**
     * Light stemming on the QUERY side only. Every match is `str_contains`, so
     * shortening the term is what lets "reserving" find "reserve", "reserved"
     * and "reserves" — the first question this help centre was ever asked
     * ("why everymonth 10% is reserving") found nothing for exactly this
     * reason. Article text is never stemmed: a shorter needle matches a longer
     * haystack, never the other way round.
     *
     * ⚠️ Deliberately crude — three suffixes and a length floor. A real stemmer
     * over-strips ("payout" → "pay") and pulls unrelated articles into the
     * retriever's context, which is worse than missing one.
     */
    public static function stem(string $word): string
    {
        if (mb_strlen($word) < 5) {
            return $word;
        }

        foreach (['ing', 'ed', 'es', 's'] as $suffix) {
            if (str_ends_with($word, $suffix) && mb_strlen($word) - mb_strlen($suffix) >= 4) {
                return mb_substr($word, 0, -mb_strlen($suffix));
            }
        }

        return $word;
    }

    /**
     * The ranked ARTICLES for a question — the keyword retriever behind Ask AI.
     *
     * Same normalisation, candidates and scorer as the search box, so the
     * articles the model answers from are the ones the reader would have found
     * themselves. Returns models (with category), not cards: the answer needs
     * the body.
     *
     * @return Collection<int, HelpArticle>
     */
    public static function rankArticles(string $query, ?string $audience, int $limit): Collection
    {
        $normalised = self::normalise($query);

        if (mb_strlen($normalised) < self::MIN_QUERY_LENGTH) {
            return collect();
        }

        return self::score(self::candidates($normalised), $normalised, $audience)->take(max(1, $limit))->values();
    }

    /**
     * Run a search.
     *
     * @param  string|null  $audience  re-RANKS results, never filters them: a
     *                                 creator searching "refund" wants the
     *                                 creator article first, not the supporter
     *                                 article hidden.
     * @return array{query:string, normalised:string, results:array, total:int}
     */
    public static function run(string $query, ?string $audience = null, bool $withBody = false, int $limit = self::LIMIT): array
    {
        $normalised = self::normalise($query);

        if (mb_strlen($normalised) < self::MIN_QUERY_LENGTH) {
            return ['query' => $query, 'normalised' => $normalised, 'results' => [], 'total' => 0];
        }

        $cacheKey = 'help:search:'.md5($normalised.'|'.($audience ?? 'all').'|'.($withBody ? 'b' : '').'|'.$limit);

        $results = Cache::remember($cacheKey, self::CACHE_TTL, function () use ($normalised, $audience, $withBody, $limit) {
            $scored = self::score(self::candidates($normalised), $normalised, $audience);

            return $scored->take($limit)->map(function (HelpArticle $a) use ($withBody) {
                $row = HelpContent::card($a);

                if ($withBody) {
                    // Only ever requested for the handful of suggestions shown
                    // inline in a support form, so the reader answers their own
                    // question without leaving the page they are on.
                    // Raw HTML is stripped by HelpMarkdown — see its docblock.
                    $row['body_html'] = HelpMarkdown::render($a->body)['html'];
                }

                return $row;
            })->values()->all();
        });

        // ⚠️ Outside the cache on purpose. A miss recorded once and then served
        // from cache for fifteen minutes under-counts exactly the queries the
        // backlog is built from.
        if (empty($results)) {
            self::recordMiss($query, $normalised);
        }

        return [
            'query' => $query,
            'normalised' => $normalised,
            'results' => $results,
            'total' => count($results),
        ];
    }

    /**
     * Narrow the corpus. Driver-specific; both branches return HelpArticle rows
     * and neither decides the order.
     */
    private static function candidates(string $normalised): Collection
    {
        $terms = self::terms($normalised);

        $base = HelpArticle::query()
            ->visible()
            ->with('category:id,slug,title');

        $driver = DB::connection()->getDriverName();

        try {
            if (in_array($driver, ['mysql', 'mariadb'], true)) {
                $rows = (clone $base)
                    ->where(function ($q) use ($normalised, $terms) {
                        $q->whereRaw(
                            'MATCH(title, summary, keywords, body) AGAINST (? IN NATURAL LANGUAGE MODE)',
                            [$normalised]
                        );

                        // FULLTEXT ignores tokens below innodb_ft_min_token_size
                        // (3 by default), so "vat" or "2fa" would find nothing on
                        // their own. LIKE covers the short-word case.
                        foreach ($terms as $term) {
                            $q->orWhere('title', 'like', '%'.$term.'%')
                                ->orWhere('keywords', 'like', '%'.$term.'%');
                        }
                    })
                    ->limit(200)
                    ->get();

                if ($rows->isNotEmpty()) {
                    return HelpArticle::withLiveFeatures($rows);
                }
            }
        } catch (\Throwable $e) {
            // A missing FULLTEXT index (a database built before the migration's
            // guarded ALTER, or one where it failed) must degrade to LIKE, not
            // take the search endpoint down.
            Log::warning('Help centre FULLTEXT search failed, falling back to LIKE', ['error' => $e->getMessage()]);
        }

        $rows = $base
            ->where(function ($q) use ($terms, $normalised) {
                foreach (array_unique(array_merge($terms, [$normalised])) as $term) {
                    $q->orWhere('title', 'like', '%'.$term.'%')
                        ->orWhere('summary', 'like', '%'.$term.'%')
                        ->orWhere('keywords', 'like', '%'.$term.'%')
                        ->orWhere('body', 'like', '%'.$term.'%');
                }
            })
            ->limit(200)
            ->get();

        return HelpArticle::withLiveFeatures($rows);
    }

    /**
     * The single ranking definition.
     *
     * Weights are deliberate: a curated keyword is a human saying "this article
     * answers that question", which beats the same word appearing once in a
     * paragraph.
     */
    private static function score(Collection $articles, string $normalised, ?string $audience): Collection
    {
        $terms = self::terms($normalised);

        return $articles
            ->map(function (HelpArticle $a) use ($terms, $normalised, $audience) {
                $title = mb_strtolower($a->title);
                $keywords = mb_strtolower((string) $a->keywords);
                $summary = mb_strtolower((string) $a->summary);
                $body = mb_strtolower((string) $a->body);

                $score = 0;

                // Whole-phrase hits first — they are the strongest signal there is.
                if ($title === $normalised) {
                    $score += 200;
                } elseif (str_contains($title, $normalised)) {
                    $score += 100;
                }
                if (str_contains($keywords, $normalised)) {
                    $score += 60;
                }
                if (str_contains($summary, $normalised)) {
                    $score += 25;
                }

                foreach ($terms as $term) {
                    if (str_contains($title, $term)) {
                        $score += 20;
                    }
                    if (str_contains($keywords, $term)) {
                        $score += 14;
                    }
                    if (str_contains($summary, $term)) {
                        $score += 6;
                    }
                    if (str_contains($body, $term)) {
                        $score += 2;
                    }
                }

                // Re-rank, never filter. `both` is neutral; the other audience is
                // pushed down but stays reachable.
                if ($audience && $a->audience !== HelpArticle::AUDIENCE_BOTH) {
                    $score += $a->audience === $audience ? 15 : -12;
                }

                $a->setAttribute('search_score', $score);

                return $a;
            })
            ->filter(fn (HelpArticle $a) => $a->getAttribute('search_score') > 0)
            ->sortByDesc(fn (HelpArticle $a) => $a->getAttribute('search_score'))
            ->values();
    }

    /**
     * Record a query that found nothing. Never throws.
     *
     * The claim is an atomic increment, so two people searching the same missing
     * thing at once produce one row with a count of two rather than a duplicate
     * key error on the unique index.
     */
    public static function recordMiss(string $raw, string $normalised): void
    {
        if (mb_strlen($normalised) < self::MIN_MISS_LENGTH) {
            return;
        }

        try {
            HelpSearchMiss::query()->firstOrCreate(
                ['query_normalised' => $normalised],
                ['query_sample' => mb_substr(trim($raw), 0, 255), 'hits' => 0, 'last_seen_at' => now()]
            );

            HelpSearchMiss::query()
                ->where('query_normalised', $normalised)
                ->update([
                    'hits' => DB::raw('`hits` + 1'),
                    'query_sample' => mb_substr(trim($raw), 0, 255),
                    'last_seen_at' => now(),
                ]);
        } catch (\Throwable $e) {
            Log::warning('Help centre search-miss write failed', [
                'query' => $normalised,
                'error' => $e->getMessage(),
            ]);
        }
    }
}
