<?php

namespace Tests\Feature;

use App\Models\HelpArticle;
use App\Models\HelpCategory;
use App\Services\Help\HelpAnswer;
use App\Services\Help\HelpSearch;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

/**
 * The keyword retriever — Ask AI on a host with no embedding model (Groq).
 *
 * 🚨 The grounding rules do not change with the retriever. The model still
 * answers only from the articles it is handed; what changes is WHO hands them
 * over. These tests pin that no embedding call is ever made, that the articles
 * come from the help centre's own search, and that the light stemming that
 * makes "reserving" find "reserve" does not over-strip.
 */
class HelpKeywordRetrieverTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        Cache::flush();

        config([
            'help.ai.enabled' => true,
            'help.ai.api_key' => 'test-key',
            'help.ai.retriever' => 'keyword',
            'help.ai.cache_ttl' => 0,
        ]);
    }

    private function article(string $slug, string $title, string $body, string $keywords = ''): HelpArticle
    {
        $category = HelpCategory::firstOrCreate(
            ['slug' => 'money-and-payouts'],
            ['title' => 'Money and payouts', 'audience' => 'both', 'sort_order' => 0, 'is_published' => true]
        );

        return HelpArticle::create([
            'help_category_id' => $category->id,
            'slug' => $slug,
            'title' => $title,
            'summary' => $title,
            'body' => $body,
            'keywords' => $keywords,
            'audience' => 'both',
            'status' => HelpArticle::STATUS_PUBLISHED,
            'published_at' => now()->subDay(),
        ]);
    }

    public function test_no_embedding_call_is_ever_made(): void
    {
        $this->article('why-is-some-of-my-money-held', 'Why is some of my money held back?', 'A reserve is held on each sale.');

        Http::fake([
            'api.openai.com/v1/chat/completions' => Http::response(['choices' => [['message' => ['content' => 'A reserve is held.']]]]),
            'api.openai.com/v1/embeddings' => Http::response(['error' => 'must not be called'], 500),
        ]);

        $result = HelpAnswer::ask('why is my money held');

        $this->assertTrue($result['answered']);
        Http::assertNotSent(fn ($r) => str_ends_with($r->url(), '/embeddings'));
        Http::assertSentCount(1);
    }

    public function test_the_articles_come_from_the_help_centre_search(): void
    {
        $this->article('why-is-some-of-my-money-held', 'Why is some of my money held back?', 'A reserve is held on each sale.', 'reserve, held');
        $this->article('how-do-i-cancel-a-membership', 'How do I cancel a membership?', 'Open the membership and choose cancel.', 'cancel');

        Http::fake(['api.openai.com/v1/chat/completions' => Http::response(['choices' => [['message' => ['content' => 'Held.']]]])]);

        $result = HelpAnswer::ask('why is money held');

        $this->assertTrue($result['answered']);
        $this->assertSame('why-is-some-of-my-money-held', $result['sources'][0]['slug']);

        Http::assertSent(function ($request) {
            $user = $request->data()['messages'][1]['content'];

            return str_contains($user, 'Why is some of my money held back?')
                && ! str_contains($user, 'cancel a membership');
        });
    }

    /** A question search cannot match at all is a corpus verdict, and costs no chat call. */
    public function test_nothing_found_is_a_verdict_and_makes_no_call(): void
    {
        $this->article('why-is-some-of-my-money-held', 'Why is some of my money held back?', 'A reserve is held on each sale.');

        Http::fake();

        $result = HelpAnswer::ask('zebra quantum trombone');

        $this->assertFalse($result['answered']);
        $this->assertSame('below_similarity_threshold', $result['reason']);
        Http::assertNothingSent();
    }

    /** NO_ANSWER still guards relevance — keyword matches are looser than vectors. */
    public function test_no_answer_from_the_model_is_still_honoured(): void
    {
        $this->article('why-is-some-of-my-money-held', 'Why is some of my money held back?', 'A reserve is held on each sale.', 'reserve');

        Http::fake(['api.openai.com/v1/chat/completions' => Http::response(['choices' => [['message' => ['content' => HelpAnswer::NO_ANSWER]]]])]);

        $result = HelpAnswer::ask('is a reserve the capital of France');

        $this->assertFalse($result['answered']);
        $this->assertSame('not_in_articles', $result['reason']);
    }

    // ----------------------------------------------------------- stemming

    /** The first question this help centre was ever asked, and it found nothing. */
    public function test_reserving_finds_reserve(): void
    {
        $this->article('why-is-some-of-my-money-held', 'Why is some of my money held back?', 'New creators carry a reserve on each sale.', 'reserve, held');

        $ranked = HelpSearch::rankArticles('why everymonth 10% is reserving', null, 3);

        $this->assertCount(1, $ranked);
        $this->assertSame('why-is-some-of-my-money-held', $ranked[0]->slug);
    }

    public function test_stemming_is_crude_on_purpose(): void
    {
        $this->assertSame('reserv', HelpSearch::stem('reserving'));
        $this->assertSame('reserv', HelpSearch::stem('reserved'));
        // 'es' strips before 's': "reserv" is the better needle anyway — it
        // matches reserve, reserved, reserves and reserving alike.
        $this->assertSame('reserv', HelpSearch::stem('reserves'));
        // Short words are left alone — "fees" must not become "fe".
        $this->assertSame('fees', HelpSearch::stem('fees'));
        $this->assertSame('paid', HelpSearch::stem('paid'));
        // "payout" is never touched: no suffix, and a real stemmer's "pay" would
        // pull every payment article into the context.
        $this->assertSame('payout', HelpSearch::stem('payout'));
        $this->assertSame('payout', HelpSearch::stem('payouts'));
    }

    /** `help:embed` is quiet and green on this retriever — it runs hourly. */
    public function test_the_embed_command_is_a_quiet_no_op(): void
    {
        $this->artisan('help:embed')
            ->expectsOutputToContain('nothing to embed')
            ->assertExitCode(0);
    }
}
