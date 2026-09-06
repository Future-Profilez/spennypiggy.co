<?php

namespace Tests\Feature;

use App\Models\HelpArticle;
use App\Models\HelpCategory;
use App\Services\Help\HelpAiClient;
use App\Services\Help\HelpAiKeyPool;
use App\Services\Help\HelpAnswer;
use App\Services\Help\HelpSearch;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\Client\ConnectionException;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Tests\TestCase;

/**
 * The AI key pool: N credentials, shared cooldowns, in-request failover.
 *
 * 🚨 Every rule here exists so that a spent free-tier quota costs a visitor
 * nothing — the request moves to another key, and the NEXT visitor is never
 * sent to the spent one. The pool is not hardcoded to two keys anywhere; the
 * tests use two or three so the arithmetic is visible.
 */
class HelpAiKeyPoolTest extends TestCase
{
    use RefreshDatabase;

    private const KEY_A = 'gsk_alpha_secret_0001';

    private const KEY_B = 'gsk_beta_secret_0002';

    private const KEY_C = 'gsk_gamma_secret_0003';

    protected function setUp(): void
    {
        parent::setUp();

        Cache::flush();

        config([
            'help.ai.enabled' => true,
            'help.ai.api_key' => null,
            'help.ai.keys' => [self::KEY_A, self::KEY_B],
            'help.ai.base_url' => 'https://api.openai.com/v1',
            'help.ai.cache_ttl' => 604800,
            'help.ai.min_similarity' => 0.0,
            // ⚠️ Named so the two ledgers are visible in every assertion — a
            // cooldown belongs to a key AND a model, not to a key.
            'help.ai.answer_model' => 'chat-model',
            'help.ai.embedding_model' => 'embed-model',
        ]);
    }

    /** The model every chat-side test in this file posts. */
    private const CHAT = 'chat-model';

    private function fp(string $key): string
    {
        return substr(sha1($key), 0, 12);
    }

    /** Which key a faked request carried. */
    private function keyOf($request): string
    {
        return str_replace('Bearer ', '', $request->header('Authorization')[0] ?? '');
    }

    /** Fake the host so each key gets its own scripted response. */
    private function fakeByKey(array $byKey): void
    {
        Http::fake(function ($request) use ($byKey) {
            $key = $this->keyOf($request);
            $handler = $byKey[$key] ?? fn () => Http::response(['error' => ['message' => 'unknown key in test']], 500);

            return $handler($request);
        });
    }

    private function ok(array $json = ['choices' => [['message' => ['content' => 'Fine.']]]]): \Closure
    {
        return fn () => Http::response($json, 200);
    }

    /**
     * The FIRST request fails as $first says; every later one succeeds.
     *
     * ⚠️ Written this way because the pool ROTATES — which key is tried first
     * depends on the shared cursor, and a test that scripts "key A fails" is
     * asserting an order the pool deliberately does not promise. What the pool
     * does promise: whichever key failed is stood down, and the request moves
     * on. `$firstKey` captures who that was.
     */
    private function fakeFirstFails(\Closure $first, ?string &$firstKey): void
    {
        $calls = 0;

        Http::fake(function ($request) use ($first, &$calls, &$firstKey) {
            $calls++;

            if ($calls === 1) {
                $firstKey = $this->keyOf($request);

                return $first($request);
            }

            return Http::response(['choices' => [['message' => ['content' => 'Fine.']]]], 200);
        });
    }

    // ------------------------------------------------------------- registry

    public function test_the_pool_is_any_number_of_keys_and_never_logs_one(): void
    {
        config(['help.ai.keys' => [self::KEY_A, self::KEY_B, self::KEY_C]]);

        $keys = HelpAiKeyPool::keys();

        $this->assertCount(3, $keys);
        $this->assertSame('#1 (…0001)', $keys[0]['label']);
        $this->assertSame('#3 (…0003)', $keys[2]['label']);

        foreach ($keys as $k) {
            $this->assertStringNotContainsString('secret', $k['label'], 'A label must never reveal the key.');
        }
    }

    /** The same string twice is ONE account — it must not look like failover. */
    public function test_duplicate_keys_collapse_to_one(): void
    {
        config(['help.ai.keys' => [self::KEY_A, ' '.self::KEY_A.' ', self::KEY_B, '']]);

        $this->assertSame(2, HelpAiKeyPool::count());
    }

    /** An existing single-key environment needs no change at all. */
    public function test_a_single_api_key_is_a_pool_of_one(): void
    {
        config(['help.ai.keys' => [], 'help.ai.api_key' => self::KEY_C]);

        $this->assertSame(1, HelpAiKeyPool::count());
        $this->assertTrue(HelpAiKeyPool::configured());
        $this->assertSame(self::KEY_C, HelpAiKeyPool::available(self::CHAT)[0]['key']);
    }

    // ------------------------------------------------------------- rotation

    public function test_consecutive_requests_alternate_keys_exactly(): void
    {
        $firsts = [];

        for ($i = 0; $i < 4; $i++) {
            $firsts[] = HelpAiKeyPool::available(self::CHAT)[0]['key'];
        }

        // Two of each, and never the same key twice running — an even split, not
        // a probable one.
        $this->assertSame(2, count(array_keys($firsts, self::KEY_A, true)));
        $this->assertSame(2, count(array_keys($firsts, self::KEY_B, true)));
        $this->assertNotSame($firsts[0], $firsts[1]);
        $this->assertNotSame($firsts[1], $firsts[2]);
    }

    // ------------------------------------------------------------- cooldowns

    public function test_a_429_stands_the_key_down_for_the_providers_retry_after(): void
    {
        $spent = null;
        $this->fakeFirstFails(
            fn () => Http::response(['error' => ['message' => 'Rate limit reached']], 429, ['Retry-After' => '90']),
            $spent
        );

        $result = HelpAiClient::post('chat/completions', ['model' => self::CHAT]);

        $this->assertTrue($result['ok'], 'The request must succeed on the other key in the SAME request.');
        Http::assertSentCount(2);

        $other = $spent === self::KEY_A ? self::KEY_B : self::KEY_A;
        $this->assertStringEndsWith(substr($other, -4).')', $result['key'], 'The answer came from the key that was NOT spent.');

        $until = HelpAiKeyPool::coolingUntil($this->fp($spent), self::CHAT);
        $this->assertNotNull($until);
        $this->assertEqualsWithDelta(time() + 90, $until, 3, 'Retry-After is the provider telling us when; we honour it.');
        $this->assertFalse(HelpAiKeyPool::isCooling($this->fp($other), self::CHAT));
    }

    /** The point of the whole thing: the NEXT visitor never touches the spent key. */
    public function test_a_cooled_key_is_skipped_by_later_requests(): void
    {
        HelpAiKeyPool::cool(HelpAiKeyPool::keys()[0], 600, HelpAiKeyPool::REASON_RATE_LIMITED, self::CHAT);

        for ($i = 0; $i < 3; $i++) {
            $available = HelpAiKeyPool::available(self::CHAT);
            $this->assertCount(1, $available);
            $this->assertSame(self::KEY_B, $available[0]['key']);
        }
    }

    public function test_without_retry_after_the_configured_default_applies(): void
    {
        config(['help.ai.cooldown.rate_limited' => 777]);

        $this->assertSame(777, HelpAiKeyPool::cooldownFor(HelpAiKeyPool::REASON_RATE_LIMITED, null));
        $this->assertSame(777, HelpAiKeyPool::cooldownFor(HelpAiKeyPool::REASON_RATE_LIMITED, 'not-a-date'));
        // A provider's "1" is true and useless; the floor stops a retry storm.
        $this->assertSame(5, HelpAiKeyPool::cooldownFor(HelpAiKeyPool::REASON_RATE_LIMITED, '1'));
    }

    /** A cooldown is bounded — "retry in a month" must not take Ask AI out for a month. */
    public function test_a_cooldown_is_capped(): void
    {
        config(['help.ai.cooldown.max' => 3600]);

        HelpAiKeyPool::cool(HelpAiKeyPool::keys()[0], 999999, HelpAiKeyPool::REASON_RATE_LIMITED, self::CHAT);

        $this->assertLessThanOrEqual(time() + 3600 + 2, HelpAiKeyPool::coolingUntil($this->fp(self::KEY_A), self::CHAT));
    }

    public function test_an_expired_cooldown_reads_as_healthy(): void
    {
        // The cache key is part of the contract — `help:ai-status --reset` and a
        // curious operator both address it by this name.
        Cache::put('help:ai:cooldown:'.$this->fp(self::KEY_A).':'.self::CHAT, time() - 1, 60);

        $this->assertFalse(HelpAiKeyPool::isCooling($this->fp(self::KEY_A), self::CHAT));
        $this->assertCount(2, HelpAiKeyPool::available(self::CHAT));
    }

    public function test_reset_brings_every_key_back(): void
    {
        foreach (HelpAiKeyPool::keys() as $k) {
            HelpAiKeyPool::cool($k, 600, HelpAiKeyPool::REASON_RATE_LIMITED, self::CHAT);
        }
        $this->assertSame([], HelpAiKeyPool::available(self::CHAT));

        HelpAiKeyPool::reset();

        $this->assertCount(2, HelpAiKeyPool::available(self::CHAT));
    }

    // -------------------------------------------------------- failure classes

    /** A refused credential is a config fault: long stand-down, and an ERROR someone is told about. */
    public function test_a_refused_key_is_stood_down_for_an_hour_and_reported_as_an_error(): void
    {
        Log::spy();
        config(['help.ai.cooldown.auth' => 3600]);

        $refused = null;
        $this->fakeFirstFails(fn () => Http::response(['error' => ['message' => 'Invalid API Key']], 401), $refused);

        $result = HelpAiClient::post('chat/completions', ['model' => self::CHAT]);

        $this->assertTrue($result['ok']);
        $this->assertEqualsWithDelta(time() + 3600, HelpAiKeyPool::coolingUntil($this->fp($refused), self::CHAT), 3);
        Log::shouldHaveReceived('error')->once();
    }

    /**
     * A connection failure or a 5xx moves on to the next key and remembers
     * NOTHING — it is the provider's bad minute, not the credential's. With a
     * pool of one, remembering it would turn one dropped packet into a minute
     * of search-only answers.
     */
    public function test_a_connection_failure_fails_over_without_a_cooldown(): void
    {
        $dropped = null;
        $this->fakeFirstFails(fn () => throw new ConnectionException('timed out'), $dropped);

        $result = HelpAiClient::post('chat/completions', ['model' => self::CHAT]);

        $this->assertTrue($result['ok']);
        // ⚠️ Not Http::assertSentCount(2): a request whose stub THROWS is never
        // recorded by the fake, so the count reads 1 however many were tried.
        // The captured key proves the first attempt happened; the answer coming
        // from the OTHER key proves the failover did.
        $this->assertNotNull($dropped);
        $this->assertStringNotContainsString(substr($dropped, -4), (string) $result['key']);
        $this->assertFalse(HelpAiKeyPool::isCooling($this->fp($dropped), self::CHAT));
        $this->assertCount(2, HelpAiKeyPool::available(self::CHAT));
    }

    /**
     * ⚠️ Its own test, not a second half of the one above: a second Http::fake()
     * STACKS onto the first and every stub runs on every request, so two
     * scripts in one test answer for each other. (The documented trap.)
     */
    public function test_a_5xx_fails_over_without_a_cooldown(): void
    {
        $dropped = null;
        $this->fakeFirstFails(fn () => Http::response(['error' => ['message' => 'upstream']], 502), $dropped);

        $result = HelpAiClient::post('chat/completions', ['model' => self::CHAT]);

        $this->assertTrue($result['ok']);
        Http::assertSentCount(2);
        $this->assertFalse(HelpAiKeyPool::isCooling($this->fp($dropped), self::CHAT));
        $this->assertCount(2, HelpAiKeyPool::available(self::CHAT), 'A 5xx must not stand any key down.');
    }

    /**
     * 🚨 A 400 is OUR request. Every key would answer the same, so trying them
     * all burns the pool to be told one thing N times — and standing them down
     * would take Ask AI out over a typo in a model name.
     */
    public function test_a_bad_request_neither_burns_nor_retries_the_pool(): void
    {
        $this->fakeByKey([
            self::KEY_A => fn () => Http::response(['error' => ['message' => 'model `nope` does not exist']], 400),
            self::KEY_B => fn () => Http::response(['error' => ['message' => 'model `nope` does not exist']], 400),
        ]);

        $result = HelpAiClient::post('chat/completions', ['model' => 'nope']);

        $this->assertFalse($result['ok']);
        $this->assertSame('bad_request', $result['reason']);
        $this->assertStringContainsString('does not exist', $result['error']);
        Http::assertSentCount(1);
        $this->assertCount(2, HelpAiKeyPool::available(self::CHAT), 'No key may be stood down for our own mistake.');
    }

    // ----------------------------------------------------- every key is spent

    public function test_when_every_key_is_spent_the_answer_is_rate_limited_and_not_cached(): void
    {
        $category = HelpCategory::create(['slug' => 'money', 'title' => 'Money', 'audience' => 'both', 'sort_order' => 0, 'is_published' => true]);
        $article = HelpArticle::create([
            'help_category_id' => $category->id, 'slug' => 'payouts', 'title' => 'Payouts',
            'summary' => 'When you get paid.', 'body' => 'Payouts run weekly.', 'audience' => 'both',
            'status' => HelpArticle::STATUS_PUBLISHED, 'published_at' => now()->subDay(),
        ]);
        $article->forceFill(['embedding' => [1.0, 0.0], 'embedded_at' => now()])->saveQuietly();

        // Embeddings still answer; both chat keys are out of quota.
        Http::fake(function ($request) {
            if (str_ends_with($request->url(), '/embeddings')) {
                return Http::response(['data' => [['index' => 0, 'embedding' => [1.0, 0.0]]]], 200);
            }

            return Http::response(['error' => ['message' => 'Rate limit reached']], 429, ['Retry-After' => '120']);
        });

        $result = HelpAnswer::ask('when do i get paid');

        $this->assertFalse($result['answered']);
        $this->assertSame('rate_limited', $result['reason'], 'The reason must say QUOTA, not "request failed" — only one of those is a reason to add a key.');

        // Both keys are now standing down…
        $this->assertSame([], HelpAiKeyPool::available(self::CHAT));

        // …and the refusal is NOT remembered for the week. When a key frees up,
        // the next asker gets a real answer.
        $cacheKey = 'help:ai:'.md5(HelpSearch::normalise('when do i get paid').'|all');
        $this->assertNull(Cache::get($cacheKey));

        // Nothing configured is a different fact from everything spent.
        HelpAiKeyPool::reset();
        config(['help.ai.keys' => [], 'help.ai.api_key' => null]);
        $this->assertSame('no_keys', HelpAiClient::post('chat/completions', [])['reason']);
    }

    // -------------------------------------------------------- the status view

    public function test_status_reports_each_key_and_counts_stand_downs_for_today(): void
    {
        $a = HelpAiKeyPool::keys()[0];
        HelpAiKeyPool::cool($a, 300, HelpAiKeyPool::REASON_RATE_LIMITED, self::CHAT);
        HelpAiKeyPool::reset();
        HelpAiKeyPool::cool($a, 300, HelpAiKeyPool::REASON_RATE_LIMITED, self::CHAT);

        $status = HelpAiKeyPool::status();

        // 2 keys × 2 models.
        $this->assertCount(4, $status);

        $find = fn (int $i, string $model) => collect($status)
            ->firstWhere(fn ($r) => $r['index'] === $i && $r['model'] === $model);

        $chatA = $find(0, self::CHAT);
        $embedA = $find(0, 'embed-model');
        $chatB = $find(1, self::CHAT);

        $this->assertFalse($chatA['healthy']);
        $this->assertSame('rate_limited', $chatA['reason']);
        $this->assertSame(2, $chatA['cooldowns_today'], 'The count survives a reset — it is history, not state.');
        $this->assertTrue($embedA['healthy'], 'The SAME key is untouched for the other model.');
        $this->assertTrue($chatB['healthy']);
        $this->assertSame(0, $chatB['cooldowns_today']);

        $this->artisan('help:ai-status')
            ->expectsOutputToContain('standing down')
            ->assertSuccessful();
    }

    // ------------------------------------------------- per-model, not per-key

    /**
     * 🚨 The providers meter each MODEL separately: an account out of embedding
     * tokens still has chat tokens. Standing the whole key down on an embedding
     * 429 would throw away capacity that exists, on the one feature built to
     * stretch a free tier.
     */
    public function test_a_spent_embedding_quota_leaves_chat_working_on_the_same_key(): void
    {
        config(['help.ai.keys' => [self::KEY_A]]);

        Http::fake(function ($request) {
            if (str_ends_with($request->url(), '/embeddings')) {
                return Http::response(['error' => ['message' => 'Rate limit reached']], 429, ['Retry-After' => '600']);
            }

            return Http::response(['choices' => [['message' => ['content' => 'Fine.']]]], 200);
        });

        $embed = HelpAiClient::post('embeddings', ['model' => 'embed-model']);
        $this->assertFalse($embed['ok']);
        $this->assertSame('rate_limited', $embed['reason']);

        $this->assertTrue(HelpAiKeyPool::isCooling($this->fp(self::KEY_A), 'embed-model'));
        $this->assertFalse(HelpAiKeyPool::isCooling($this->fp(self::KEY_A), self::CHAT));

        $chat = HelpAiClient::post('chat/completions', ['model' => self::CHAT]);
        $this->assertTrue($chat['ok'], 'The only key still has chat quota and must be used.');
    }

    // ------------------------------------------------------------ the budget

    /**
     * 🚨 ONE BUDGET FOR THE LOOP. Without it the worst case is
     * `timeout × keys`, so adding a key made the page SLOWER — and HelpAnswer
     * makes two pooled calls, so three keys at 12s each is 72s against a
     * 60-second Lambda: a hard timeout instead of the search fallback.
     */
    public function test_the_whole_call_is_bounded_however_many_keys_there_are(): void
    {
        config([
            'help.ai.keys' => [self::KEY_A, self::KEY_B, self::KEY_C],
            'help.ai.timeout' => 12,
            'help.ai.request_budget' => 3,
        ]);

        // Each attempt burns real wall time, as a slow provider would.
        Http::fake(function () {
            usleep(700_000);

            return Http::response(['error' => ['message' => 'upstream']], 502);
        });

        $started = microtime(true);
        $result = HelpAiClient::post('chat/completions', ['model' => self::CHAT]);
        $elapsed = microtime(true) - $started;

        $this->assertFalse($result['ok']);
        $this->assertLessThan(5, $elapsed, 'The loop must stop at the budget, not run timeout × keys.');
        $this->assertLessThan(3, Http::recorded()->count(), 'The third key must not be tried once the budget is gone.');
    }

    /** The control: a healthy first key is never delayed by the budget. */
    public function test_the_budget_does_not_slow_a_healthy_call(): void
    {
        config(['help.ai.request_budget' => 3]);

        Http::fake(['*' => Http::response(['choices' => [['message' => ['content' => 'Fine.']]]], 200)]);

        $started = microtime(true);
        $result = HelpAiClient::post('chat/completions', ['model' => self::CHAT]);

        $this->assertTrue($result['ok']);
        $this->assertLessThan(1, microtime(true) - $started);
        Http::assertSentCount(1);
    }

    /**
     * ⚠️ The budget is a CEILING, not a floor. `max($perAttempt, $budget)` — the
     * shape "at least one attempt must fit" — lets a large `timeout` override
     * the budget entirely, which is the bug the budget exists to prevent. This
     * pins the direction, and it failed against exactly that version.
     */
    public function test_a_large_per_attempt_timeout_cannot_override_the_budget(): void
    {
        config([
            'help.ai.keys' => [self::KEY_A, self::KEY_B, self::KEY_C],
            'help.ai.timeout' => 30,
            'help.ai.request_budget' => 2,
        ]);

        Http::fake(function () {
            usleep(700_000);

            return Http::response(['error' => ['message' => 'upstream']], 502);
        });

        $started = microtime(true);
        HelpAiClient::post('chat/completions', ['model' => self::CHAT]);

        $this->assertLessThan(3, microtime(true) - $started);
        $this->assertLessThan(3, Http::recorded()->count());
    }

    // ------------------------------------------------------- reason ranking

    /**
     * A spent quota is the ONE signal that means "add an account". A later 5xx
     * on a different key must not bury it — the reason is ranked, not last-wins.
     */
    public function test_a_rate_limit_outranks_a_later_server_error(): void
    {
        $calls = 0;

        Http::fake(function () use (&$calls) {
            $calls++;

            return $calls === 1
                ? Http::response(['error' => ['message' => 'Rate limit reached']], 429, ['Retry-After' => '600'])
                : Http::response(['error' => ['message' => 'upstream']], 502);
        });

        $result = HelpAiClient::post('chat/completions', ['model' => self::CHAT]);

        $this->assertFalse($result['ok']);
        $this->assertSame('rate_limited', $result['reason']);
    }

    // ------------------------------------------------- the parity lock (A)

    /**
     * 🚨 One shared cursor with an EVEN number of keys locks into a fixed split:
     * an ask is two pooled calls (embed, chat), so embed always lands on A and
     * chat — the ~1,800-token call that spends the quota — always on B. Key A's
     * chat quota is never touched and "two accounts doubles capacity" is false.
     * The cursor is per model now; this failed against the shared one.
     */
    public function test_two_full_asks_on_two_keys_spread_the_chat_calls(): void
    {
        $category = HelpCategory::create(['slug' => 'money', 'title' => 'Money', 'sort_order' => 1, 'is_published' => true, 'audience' => 'both']);
        HelpArticle::create([
            'help_category_id' => $category->id, 'slug' => 'payouts', 'title' => 'Payouts',
            'summary' => 'When you get paid.', 'body' => 'Payouts run weekly.', 'audience' => 'both',
            'status' => HelpArticle::STATUS_PUBLISHED, 'published_at' => now()->subDay(), 'sort_order' => 1,
            'embedding' => [1.0, 0.0, 0.0], 'embedding_hash' => 'x', 'embedded_at' => now(),
        ]);

        Http::fake(function ($request) {
            if (str_ends_with($request->url(), '/embeddings')) {
                return Http::response(['data' => [['index' => 0, 'embedding' => [1.0, 0.0, 0.0]]]]);
            }

            return Http::response(['choices' => [['message' => ['content' => 'Weekly.']]]]);
        });

        // Two DIFFERENT questions — a repeat would be served from cache.
        HelpAnswer::ask('when do i get paid');
        HelpAnswer::ask('how often are payouts');

        $chatKeys = Http::recorded()
            ->filter(fn ($pair) => str_ends_with($pair[0]->url(), '/chat/completions'))
            ->map(fn ($pair) => $pair[0]->header('Authorization')[0] ?? null)
            ->unique()
            ->values();

        $this->assertCount(2, $chatKeys, 'Both keys must carry chat calls, or one account\'s chat quota is never used.');
    }

    // --------------------------------------- an embedding 429 keeps its name (C)

    public function test_a_spent_quota_on_the_embedding_call_reports_rate_limited(): void
    {
        config(['help.ai.keys' => [self::KEY_A]]);

        Http::fake([
            'api.openai.com/v1/embeddings' => Http::response(['error' => ['message' => 'Rate limit reached']], 429, ['Retry-After' => '600']),
        ]);

        $result = HelpAnswer::ask('why is money held');

        $this->assertFalse($result['answered']);
        $this->assertSame('rate_limited', $result['reason'], 'An embedding-side 429 must not be flattened into embedding_unavailable.');
    }

    // ------------------------------------------- a dead key alerts once a day (D)

    /**
     * A revoked key re-cools every hour for as long as it sits in the env. At
     * error level every time, that is 24 Sentry issues a day per dead key.
     */
    public function test_a_refused_key_is_reported_at_error_level_once_per_day(): void
    {
        Log::spy();

        $key = HelpAiKeyPool::keys()[0];

        HelpAiKeyPool::cool($key, 3600, HelpAiKeyPool::REASON_AUTH, self::CHAT);
        HelpAiKeyPool::reset();
        HelpAiKeyPool::cool($key, 3600, HelpAiKeyPool::REASON_AUTH, self::CHAT);
        HelpAiKeyPool::reset();
        HelpAiKeyPool::cool($key, 3600, HelpAiKeyPool::REASON_AUTH, self::CHAT);

        Log::shouldHaveReceived('error')->once();
        Log::shouldHaveReceived('warning')->twice();
    }

    // ------------------------------------------------ the wrong host (found live)

    /**
     * Four Groq keys pasted in with HELP_AI_BASE_URL left at OpenAI: every one
     * 401'd and stood down as "refused", and the provider's message — "Incorrect
     * API key provided" — sent the person to re-paste keys that were fine.
     */
    public function test_a_key_from_another_provider_is_named_before_it_is_sent(): void
    {
        config(['help.ai.keys' => ['gsk_groqkey1234567890'], 'help.ai.base_url' => 'https://api.openai.com/v1']);

        $problems = HelpAiKeyPool::hostMismatches();

        $this->assertCount(1, $problems);
        $this->assertStringContainsString('looks like a Groq', $problems[0]);
        $this->assertStringContainsString('api.groq.com', $problems[0]);
        $this->assertStringNotContainsString('groqkey1234567890', $problems[0], 'Never the key itself.');

        config(['help.ai.base_url' => 'https://api.groq.com/openai/v1']);
        $this->assertSame([], HelpAiKeyPool::hostMismatches());

        // An unknown prefix says nothing either way.
        config(['help.ai.keys' => ['test-key'], 'help.ai.base_url' => 'https://api.openai.com/v1']);
        $this->assertSame([], HelpAiKeyPool::hostMismatches());
    }
}
