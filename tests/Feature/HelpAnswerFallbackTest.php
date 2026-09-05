<?php

namespace Tests\Feature;

use App\Models\HelpArticle;
use App\Models\HelpCategory;
use App\Services\Help\HelpAnswer;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

/**
 * 🚨 WHEN THE ANSWERING SERVICE IS DOWN, THE READER STILL GETS THE ARTICLES.
 *
 * The whole point of `/help/ask` degrading rather than failing is that a reader
 * who asks a question during an outage is handed the articles that answer it,
 * instead of a sentence telling them the help centre has nothing. Two things
 * used to break that, and neither was visible from a browser on a good day:
 *
 *   1. `HelpAnswer::ask` cached through `Cache::remember`, which cannot tell a
 *      DECISION from a FAILURE — so one timeout or one rotated key was stored
 *      as "no answer" for the full TTL, a whole day, for every later asker.
 *   2. `HelpSearchBar`'s catch branch set `results: []`, discarding the keyword
 *      results already in state for the same query.
 *
 * The endpoint's own fallback (keyword results returned on every path) was
 * always correct and is pinned here too, because it is the thing the other two
 * were quietly undoing.
 */
class HelpAnswerFallbackTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        $category = HelpCategory::create([
            'slug' => 'money-and-payouts',
            'title' => 'Money and payouts',
            'summary' => 'When you are paid.',
            'audience' => HelpArticle::AUDIENCE_CREATOR,
            'sort_order' => 0,
            'is_published' => true,
        ]);

        $article = HelpArticle::create([
            'help_category_id' => $category->id,
            'slug' => 'when-do-i-get-paid',
            'title' => 'When do I get paid?',
            'summary' => 'Payouts run weekly.',
            'body' => 'Payouts run weekly on a fixed day.',
            'keywords' => 'payout, paid, when, weekly, money',
            'audience' => HelpArticle::AUDIENCE_CREATOR,
            'status' => HelpArticle::STATUS_PUBLISHED,
            'published_at' => now(),
            'sort_order' => 0,
        ]);

        // ⚠️ WITHOUT A STORED EMBEDDING `rank()` RETURNS NOTHING and every path
        // below stops at `no_articles_embedded` — which is a pass for the wrong
        // reason on all three of these tests. It is the same vector the fakes
        // return for the question, so similarity is 1 and the threshold is
        // genuinely cleared rather than sidestepped.
        $article->forceFill([
            'embedding' => self::VECTOR,
            'embedding_hash' => 'test',
            'embedded_at' => now(),
        ])->saveQuietly();
    }

    /** The one vector both the article and the faked question embedding use. */
    private const VECTOR = [0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5];

    /** Switch the feature on with a key so the failure paths are reachable. */
    private function enableAi(): void
    {
        config([
            'help.ai.enabled' => true,
            'help.ai.api_key' => 'sk-test-not-a-real-key',
        ]);
    }

    /**
     * 🚨 The reason the whole feature is allowed to be public: a failure hands
     * over the search results rather than an apology.
     */
    public function test_the_endpoint_returns_articles_even_when_generation_fails(): void
    {
        $this->enableAi();
        Http::fake(['api.openai.com/*' => Http::response(['error' => ['message' => 'nope']], 500)]);

        $response = $this->postJson('/help/ask', ['q' => 'when do I get paid'])
            ->assertOk()
            ->assertJsonPath('answered', false);

        $this->assertNotEmpty(
            $response->json('results'),
            'A failed generation must still return the keyword results.'
        );
    }

    /**
     * 🚨 THE ONE THAT BIT. A transient failure cached for the full TTL means the
     * service recovers and the help centre does not — same question, same stored
     * "no answer", for a day, with nothing in any log connecting the two.
     */
    public function test_a_transient_failure_is_never_cached(): void
    {
        $this->enableAi();
        Cache::flush();

        /*
         * ⚠️ ONE closure fake, flipped by a variable — NOT two Http::fake()
         * calls. The second call MERGES its stubs into the first's and earlier
         * stubs win the match, so a "recovery" registered afterwards never fires
         * and the test fails for a reason that has nothing to do with the cache.
         */
        $healthy = false;

        Http::fake(function ($request) use (&$healthy) {
            if (! $healthy) {
                return Http::response(['error' => ['message' => 'nope']], 500);
            }

            return str_contains($request->url(), '/embeddings')
                ? Http::response(['data' => [['index' => 0, 'embedding' => self::VECTOR]]], 200)
                : Http::response(['choices' => [['message' => ['content' => 'Payouts run weekly.']]]], 200);
        });

        $first = HelpAnswer::ask('when do I get paid');

        $this->assertFalse($first['answered']);
        $this->assertContains($first['reason'], ['request_failed', 'exception', 'embedding_unavailable']);

        // The service recovers. Nothing about the question changed, so a cached
        // failure would answer here instead of a fresh request being made.
        $healthy = true;

        $second = HelpAnswer::ask('when do I get paid');

        // 🚨 ANSWERED, not merely "a different reason". The failure modes share
        // a shape, so asserting the reason moved is a test that passes against
        // the bug — the thing that must be true is that the recovered service is
        // actually used.
        $this->assertTrue(
            $second['answered'],
            'A failure was cached, so the help centre stayed down after the service came back.'
        );
    }

    /**
     * ⚠️ The other half: a genuine miss IS stable and IS what the TTL is for.
     * Without this, removing the cache entirely would look like a fix.
     */
    public function test_a_genuine_miss_is_still_cached(): void
    {
        $this->enableAi();
        Cache::flush();

        $healthy = true;

        Http::fake(function ($request) use (&$healthy) {
            if (! $healthy) {
                return Http::response(['error' => ['message' => 'nope']], 500);
            }

            return str_contains($request->url(), '/embeddings')
                ? Http::response(['data' => [['index' => 0, 'embedding' => self::VECTOR]]], 200)
                : Http::response(['choices' => [['message' => ['content' => HelpAnswer::NO_ANSWER]]]], 200);
        });

        $first = HelpAnswer::ask('what is the capital of France');

        // Only a cached result can survive the service being taken away.
        $healthy = false;

        $second = HelpAnswer::ask('what is the capital of France');

        // ⚠️ Named explicitly. `no_articles_embedded` and `request_failed` are
        // also unanswered-with-a-reason, so comparing the two calls to each
        // other would pass even if neither had reached the model.
        $this->assertSame('not_in_articles', $first['reason']);
        $this->assertSame('not_in_articles', $second['reason']);
        $this->assertFalse($second['answered']);
    }

    /**
     * 🚨 A TWO-LANGUAGE PIN. The component decides between "the service is down"
     * and "we have no answer for that" by matching the server's `reason` against
     * its own list, and neither the build nor any scanner can see that the two
     * halves agree — a renamed reason silently goes back to blaming the corpus
     * for an outage, with the articles listed underneath contradicting it.
     */
    public function test_the_component_still_recognises_every_technical_reason(): void
    {
        $jsx = file_get_contents(resource_path('js/Components/Help/HelpSearchBar.jsx'));

        foreach (['request_failed', 'exception', 'embedding_unavailable', 'no_articles_embedded', 'rate_limited'] as $reason) {
            $this->assertStringContainsString(
                '"'.$reason.'"',
                $jsx,
                "HelpSearchBar no longer recognises the [{$reason}] reason, so it will tell the reader the answer does not exist."
            );
        }

        // And it must hand over the results it already has rather than [].
        $this->assertStringContainsString('resultsRef.current ?? []', $jsx);
        $this->assertStringNotContainsString('results: [], reason: "request_failed"', $jsx);
    }
}
