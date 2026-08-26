<?php

namespace Tests\Feature;

use App\Models\HelpArticle;
use App\Models\HelpArticleSlugHistory;
use App\Models\HelpCategory;
use App\Models\HelpSearchMiss;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Cache;
use Tests\TestCase;

/**
 * `/help/inline/{slug}` — the JSON one contextual help panels read.
 *
 * The panel is dropped beside the thing that confuses people, so the whole
 * feature rests on the endpoint answering the EXACT article the component names
 * and degrading to a link rather than an error when it cannot.
 */
class HelpInlineEndpointTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        Cache::flush();
    }

    private function category(array $attrs = []): HelpCategory
    {
        return HelpCategory::create(array_merge([
            'slug' => 'money-and-payouts',
            'title' => 'Money and payouts',
            'summary' => 'When you are paid.',
            'icon' => '💷',
            'audience' => 'both',
            'sort_order' => 0,
            'is_published' => true,
        ], $attrs));
    }

    private function article(HelpCategory $category, array $attrs = []): HelpArticle
    {
        return HelpArticle::create(array_merge([
            'help_category_id' => $category->id,
            'slug' => 'why-is-some-of-my-money-held',
            'title' => 'Why is some of my money held?',
            'summary' => 'A reserve.',
            'body' => 'A reserve is held for 30 days.',
            'keywords' => 'reserve, held',
            'audience' => 'creator',
            'status' => HelpArticle::STATUS_PUBLISHED,
            'published_at' => now()->subDay(),
        ], $attrs));
    }

    /** "inline" must not be matched as a category slug. */
    public function test_inline_is_not_matched_as_a_category(): void
    {
        $this->article($this->category());

        $this->getJson('/help/inline/why-is-some-of-my-money-held')
            ->assertOk()
            ->assertJsonPath('article.slug', 'why-is-some-of-my-money-held')
            ->assertJsonPath('article.category_slug', 'money-and-payouts')
            ->assertJsonStructure(['status', 'article' => ['slug', 'title', 'category_slug', 'body_html']]);
    }

    /** Markdown is rendered — the panel injects this string as HTML. */
    public function test_the_body_comes_back_rendered(): void
    {
        $this->article($this->category(), ['body' => '## Heading']);

        $body = $this->getJson('/help/inline/why-is-some-of-my-money-held')->json('article.body_html');

        $this->assertStringContainsString('<h2', $body);
    }

    /**
     * 🚨 A creator-audience answer must still open for a signed-out reader. The
     * component decided the answer belongs on that screen; filtering by viewer
     * audience would blank contextual help on exactly the guest surfaces
     * (checkout, a public listing) where it is needed most.
     */
    public function test_a_creator_article_opens_for_a_guest(): void
    {
        $this->article($this->category(), ['audience' => 'creator']);

        $this->getJson('/help/inline/why-is-some-of-my-money-held')->assertOk();
    }

    /** A renamed article keeps answering the slug already written into a prop. */
    public function test_a_retired_slug_still_resolves(): void
    {
        $article = $this->article($this->category(), ['slug' => 'reserve-explained']);

        HelpArticleSlugHistory::create([
            'help_article_id' => $article->id,
            'slug' => 'why-is-some-of-my-money-held',
        ]);

        $this->getJson('/help/inline/why-is-some-of-my-money-held')
            ->assertOk()
            ->assertJsonPath('article.slug', 'reserve-explained');
    }

    /** An unknown slug is a JSON 404, never an exception page. */
    public function test_an_unknown_slug_is_a_json_404(): void
    {
        $this->category();

        $this->getJson('/help/inline/no-such-article')
            ->assertNotFound()
            ->assertJsonPath('status', false);
    }

    /** A draft answer must not be readable before it is published. */
    public function test_an_unpublished_article_is_not_returned(): void
    {
        $this->article($this->category(), [
            'status' => HelpArticle::STATUS_DRAFT,
            'published_at' => null,
        ]);

        $this->getJson('/help/inline/why-is-some-of-my-money-held')->assertNotFound();
    }

    /**
     * 🚨 The reason this endpoint exists rather than reusing /help/search: a
     * failed contextual lookup must not write a synthetic question into the
     * backlog the team reads to find real documentation gaps.
     */
    public function test_a_miss_here_does_not_pollute_the_search_backlog(): void
    {
        $this->category();

        $this->getJson('/help/inline/no-such-article')->assertNotFound();

        $this->assertSame(0, HelpSearchMiss::query()->count());
    }
}
