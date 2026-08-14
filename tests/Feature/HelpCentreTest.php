<?php

namespace Tests\Feature;

use App\Console\Commands\ReleaseReserves;
use App\Helpers;
use App\Http\Controllers\CatalogueController;
use App\Models\HelpArticle;
use App\Models\HelpArticleSlugHistory;
use App\Models\HelpArticleStat;
use App\Models\HelpCategory;
use App\Models\HelpSearchMiss;
use App\Models\RiskSetting;
use App\Models\User;
use App\Services\Help\HelpContent;
use App\Services\Help\HelpSearch;
use App\Support\HelpMarkdown;
use App\Support\HelpTokens;
use Database\Seeders\HelpCentreSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Cache;
use Tests\TestCase;

class HelpCentreTest extends TestCase
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
            'slug' => 'when-do-i-get-paid',
            'title' => 'When do I get paid?',
            'summary' => 'Every Friday.',
            'body' => 'Payouts run every Friday.',
            'keywords' => 'payout, friday',
            'audience' => 'both',
            'status' => HelpArticle::STATUS_PUBLISHED,
            'published_at' => now()->subDay(),
        ], $attrs));
    }

    // ---------------------------------------------------------------- routing

    /**
     * 🚨 The single highest-value assertion here. `/{username}/{page?}` in
     * auth.php is a catch-all, so a help route declared BELOW that require is
     * answered by the profile 404 — and `route:list` shows the route either way,
     * which is exactly what makes it invisible in review.
     */
    public function test_help_routes_are_not_eaten_by_the_username_catch_all(): void
    {
        $category = $this->category();
        $this->article($category);

        $this->get('/help')->assertOk();
        $this->get('/help/money-and-payouts')->assertOk();
        $this->get('/help/money-and-payouts/when-do-i-get-paid')->assertOk();
    }

    /** "search" must not be matched as a category slug. */
    public function test_search_is_not_matched_as_a_category(): void
    {
        $this->getJson('/help/search?q=payout')
            ->assertOk()
            ->assertJsonStructure(['status', 'results', 'total']);
    }

    /**
     * A soft-404 is a 200 rendering an empty state, and Google indexes it — then
     * every junk URL under /help is a page in the search results.
     */
    public function test_unknown_category_and_article_return_404(): void
    {
        $this->category();

        $this->get('/help/nope')->assertNotFound();
        $this->get('/help/money-and-payouts/nope')->assertNotFound();
    }

    // ------------------------------------------------------------- visibility

    public function test_a_draft_article_is_not_publicly_readable(): void
    {
        $category = $this->category();
        $this->article($category, ['slug' => 'draft-one', 'status' => HelpArticle::STATUS_DRAFT]);

        $this->get('/help/money-and-payouts/draft-one')->assertNotFound();
    }

    /**
     * Publication is decided by TIME, not by a command — a scheduled article
     * goes live at its minute with no worker running.
     */
    public function test_a_scheduled_article_is_hidden_until_its_time(): void
    {
        $category = $this->category();
        $this->article($category, [
            'slug' => 'future-one',
            'published_at' => now()->addHour(),
        ]);

        $this->get('/help/money-and-payouts/future-one')->assertNotFound();

        $this->travel(2)->hours();

        $this->get('/help/money-and-payouts/future-one')->assertOk();
    }

    /** An article about a kill-switched feature documents something nobody can reach. */
    public function test_an_article_behind_an_off_feature_flag_is_hidden(): void
    {
        config(['services.rye.enabled' => false]);

        $category = $this->category();
        $this->article($category, ['slug' => 'gift-store', 'feature_flag' => 'services.rye.enabled']);

        $this->get('/help/money-and-payouts/gift-store')->assertNotFound();

        config(['services.rye.enabled' => true]);
        HelpContent::forget();

        $this->get('/help/money-and-payouts/gift-store')->assertOk();
    }

    /**
     * ⚠️ Audience is a DEFAULT FILTER, never a gate. A supporter following a link
     * to a creator article must read it in full — hiding it would 404 a URL that
     * is in the sitemap and in search results.
     */
    public function test_audience_never_gates_an_article(): void
    {
        $category = $this->category();
        $this->article($category, ['slug' => 'creator-only', 'audience' => 'creator']);

        $supporter = User::factory()->create(['role' => 0]);

        $this->actingAs($supporter)
            ->get('/help/money-and-payouts/creator-only')
            ->assertOk();
    }

    public function test_audience_filters_the_category_listing_and_reports_what_it_hid(): void
    {
        $category = $this->category();
        $this->article($category, ['slug' => 'for-creators', 'audience' => 'creator']);
        $this->article($category, ['slug' => 'for-everyone', 'audience' => 'both']);

        $supporter = User::factory()->create(['role' => 0]);

        $this->actingAs($supporter)
            ->get('/help/money-and-payouts')
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->where('category.articles', fn ($articles) => count($articles) === 1)
                // The count is stated rather than silently hidden: a filter the
                // reader cannot see is indistinguishable from missing content.
                ->where('category.hidden_by_audience', 1)
            );
    }

    // ------------------------------------------------------------ slug history

    public function test_a_retitled_article_301s_from_its_old_url(): void
    {
        $category = $this->category();
        $article = $this->article($category);

        $article->update(['slug' => 'when-am-i-paid']);

        $this->assertDatabaseHas('help_article_slug_history', ['slug' => 'when-do-i-get-paid']);

        $this->get('/help/money-and-payouts/when-do-i-get-paid')
            ->assertRedirect('/help/money-and-payouts/when-am-i-paid');
    }

    /** A stale category in the URL is a moved article, not a different page. */
    public function test_a_wrong_category_in_the_url_redirects_rather_than_404s(): void
    {
        $category = $this->category();
        $other = $this->category(['slug' => 'selling', 'title' => 'Selling']);
        $this->article($category);

        $this->get('/help/selling/when-do-i-get-paid')
            ->assertRedirect('/help/money-and-payouts/when-do-i-get-paid');

        $this->assertNotNull($other);
    }

    // ----------------------------------------------------------------- tokens

    /**
     * 🚨 The reason a help article can never publish a stale price. Typing the
     * figure is what left the homepage FAQ advertising an 8% fee for a year.
     */
    public function test_tokens_resolve_from_config_not_from_typed_text(): void
    {
        config(['creator_subscription.price' => 8.99]);

        $rendered = HelpTokens::render('It costs {{subscription.price}} a month.');

        $this->assertStringContainsString('£8.99', $rendered);
        $this->assertStringNotContainsString('{{', $rendered);
    }

    /** An unknown token is a blank, never a literal {{foo}} on a public page. */
    public function test_an_unknown_token_renders_as_nothing_and_is_reported(): void
    {
        $this->assertSame('It costs  a month.', HelpTokens::render('It costs {{nope.nope}} a month.'));
        $this->assertSame(['nope.nope'], HelpTokens::unknown('{{nope.nope}}'));
        $this->assertSame([], HelpTokens::unknown('{{subscription.price}}'));
    }

    /**
     * 🚨 Load-bearing security. This HTML is injected with
     * dangerouslySetInnerHTML on a public page, and article bodies become
     * admin-authored text once the CMS ships.
     */
    public function test_markdown_strips_raw_html_and_unsafe_links(): void
    {
        $rendered = HelpMarkdown::render(
            "Hello <script>alert(1)</script> world\n\n[click](javascript:alert(1))"
        );

        $this->assertStringNotContainsString('<script', $rendered['html']);
        $this->assertStringNotContainsString('javascript:', $rendered['html']);
    }

    public function test_headings_get_stable_unique_anchors(): void
    {
        $rendered = HelpMarkdown::render("## Fees\n\ntext\n\n## Fees\n\nmore");

        $this->assertSame(['fees', 'fees-2'], array_column($rendered['toc'], 'id'));
        $this->assertStringContainsString('id="fees-2"', $rendered['html']);
    }

    // ----------------------------------------------------------------- search

    public function test_search_finds_an_article_by_its_curated_keywords(): void
    {
        $category = $this->category();
        $this->article($category, [
            'slug' => 'reserve-explained',
            'title' => 'Held funds',
            'summary' => 'Some earnings wait.',
            'body' => 'A portion waits before release.',
            'keywords' => 'rolling reserve, withheld',
        ]);

        $result = HelpSearch::run('rolling reserve');

        $this->assertSame('reserve-explained', $result['results'][0]['slug'] ?? null);
    }

    /**
     * 🚨 A zero-result search is the list of articles to write next. Recorded
     * OUTSIDE the response cache, or a miss is counted once and then served from
     * cache for the window while people keep searching for it.
     */
    public function test_a_search_that_finds_nothing_is_recorded_once_per_query(): void
    {
        $this->category();

        HelpSearch::run("Where's my payout??");
        HelpSearch::run('wheres my payout');

        $this->assertDatabaseCount('help_search_misses', 1);
        $this->assertSame(2, (int) HelpSearchMiss::first()->hits);
    }

    /** Re-ranks, never filters — a creator's result set still contains everything. */
    public function test_audience_reranks_search_without_removing_results(): void
    {
        $category = $this->category();
        $this->article($category, [
            'slug' => 'refund-supporter', 'title' => 'Refund a purchase',
            'summary' => 'refund', 'body' => 'refund', 'keywords' => 'refund',
            'audience' => 'supporter',
        ]);
        $this->article($category, [
            'slug' => 'refund-creator', 'title' => 'Refund a sale',
            'summary' => 'refund', 'body' => 'refund', 'keywords' => 'refund',
            'audience' => 'creator',
        ]);

        $creatorFirst = HelpSearch::run('refund', 'creator');

        $this->assertSame('refund-creator', $creatorFirst['results'][0]['slug']);
        $this->assertCount(2, $creatorFirst['results']);
    }

    /** `reward_body`-style paid content is not at stake here, but bodies are heavy. */
    public function test_search_only_returns_bodies_when_asked_and_caps_the_count(): void
    {
        $category = $this->category();
        foreach (range(1, 6) as $i) {
            $this->article($category, [
                'slug' => 'payout-'.$i,
                'title' => 'Payout question '.$i,
                'keywords' => 'payout',
            ]);
        }

        $plain = $this->getJson('/help/search?q=payout')->json('results');
        $this->assertArrayNotHasKey('body_html', $plain[0]);

        $withBody = $this->getJson('/help/search?q=payout&with_body=1&limit=12')->json('results');
        $this->assertArrayHasKey('body_html', $withBody[0]);
        // Whole articles are shipped, so the suggestion form is capped hard.
        $this->assertLessThanOrEqual(HelpContent::SUGGESTION_LIMIT, count($withBody));
    }

    /** 🚨 Never a dead end — browsing beats an empty box. */
    public function test_a_zero_result_search_returns_a_fallback(): void
    {
        $category = $this->category();
        $this->article($category);

        $response = $this->getJson('/help/search?q=zzzzqqqq')->assertOk();

        $this->assertSame(0, $response->json('total'));
        $this->assertNotNull($response->json('fallback.escalation.email'));
        $this->assertNotEmpty($response->json('fallback.categories'));
    }

    // ------------------------------------------------------------- deflection

    public function test_feedback_records_a_vote(): void
    {
        $category = $this->category();
        $article = $this->article($category);

        $this->postJson('/help/feedback', ['slug' => $article->slug, 'helpful' => true])
            ->assertOk();

        $stat = HelpArticleStat::where('help_article_id', $article->id)->firstOrFail();
        $this->assertSame(1, (int) $stat->helpful_yes);
    }

    /**
     * The whole point of the deflection work: a "yes" from inside a support form
     * is a ticket that was not opened, and it is counted separately from an
     * ordinary vote on the article page.
     */
    public function test_a_yes_from_a_support_form_counts_as_a_deflection(): void
    {
        $category = $this->category();
        $article = $this->article($category);

        $this->postJson('/help/feedback', [
            'slug' => $article->slug,
            'helpful' => true,
            'context' => 'support_form',
        ])->assertOk();

        $stat = HelpArticleStat::where('help_article_id', $article->id)->firstOrFail();

        $this->assertSame(1, (int) $stat->deflected);
        $this->assertSame(0, (int) $stat->escalated);
    }

    /** A "no" is the moment to offer the next step, not to say thank you. */
    public function test_a_no_returns_the_escalation_routes(): void
    {
        $category = $this->category();
        $article = $this->article($category);

        $this->postJson('/help/feedback', ['slug' => $article->slug, 'helpful' => false])
            ->assertOk()
            ->assertJsonPath('escalation.signed_in', false)
            ->assertJsonStructure(['escalation' => ['email', 'chat', 'purchases_url']]);

        $stat = HelpArticleStat::where('help_article_id', $article->id)->firstOrFail();
        $this->assertSame(1, (int) $stat->escalated);
    }

    /**
     * A vote is fire-and-forget analytics from a page that already rendered — an
     * error toast about a vote is worse than a lost vote.
     */
    public function test_feedback_on_an_unknown_article_is_silently_accepted(): void
    {
        $this->postJson('/help/feedback', ['slug' => 'nope', 'helpful' => true])
            ->assertOk()
            ->assertJsonPath('status', true);

        $this->assertDatabaseCount('help_article_stats', 0);
    }

    // ---------------------------------------------------------------- sitemap

    /**
     * A child sitemap in neither the index nor robots.txt is unreachable — the
     * bug that left the creator, wishlist and post sitemaps unread for months.
     */
    public function test_the_help_sitemap_is_reachable_and_advertised(): void
    {
        config(['seo.indexable' => true]);

        $category = $this->category();
        $this->article($category);

        $sitemap = $this->get('/seo/sitemap-help.xml')->assertOk()->getContent();

        $this->assertStringContainsString('/help/money-and-payouts/when-do-i-get-paid', $sitemap);
        $this->assertStringContainsString('<loc>'.url('/help').'</loc>', $sitemap);

        $this->get('/sitemap.xml')
            ->assertOk()
            ->assertSee('sitemap-help.xml', false);

        $this->get('/robots.txt')
            ->assertOk()
            ->assertSee('sitemap-help.xml', false);
    }

    /** A flagged-off article must not be submitted to a crawler that will 404. */
    public function test_the_sitemap_drops_articles_behind_an_off_feature_flag(): void
    {
        config(['services.rye.enabled' => false]);

        $category = $this->category();
        $this->article($category, ['slug' => 'gift-store', 'feature_flag' => 'services.rye.enabled']);

        $this->get('/seo/sitemap-help.xml')
            ->assertOk()
            ->assertDontSee('gift-store', false);
    }

    // ----------------------------------------------------------------- seeder

    /**
     * 🚨 The seeder must never overwrite words a human wrote in the CMS, or
     * every deploy silently reverts the client's edits.
     */
    public function test_the_seeder_is_idempotent_and_never_overwrites_an_edited_article(): void
    {
        $this->seed(HelpCentreSeeder::class);

        $before = HelpArticle::count();
        $this->assertGreaterThan(0, $before);

        $edited = HelpArticle::first();
        $edited->forceFill([
            'title' => 'A human wrote this',
            'edited_at' => now(),
        ])->saveQuietly();

        $this->seed(HelpCentreSeeder::class);

        $this->assertSame($before, HelpArticle::count());
        $this->assertSame('A human wrote this', $edited->fresh()->title);
    }

    /**
     * 🚨 Seeded copy is a Stripe-facing public surface. A single "help with your
     * bills" line here is a compliance violation on an indexed page.
     *
     * ⚠️ The bare word "bill" is deliberately NOT banned — it is the name of the
     * recurring content product, exactly as NoExpenseOrBrandName treats it.
     */
    public function test_seeded_copy_carries_no_banned_vocabulary(): void
    {
        $this->seed(HelpCentreSeeder::class);

        $banned = [
            'donation', 'donate', 'fundraise', 'fundraising', 'gifting',
            'buy me a coffee', 'spoil me', 'pay my bill', 'help with my bill',
            'cover my rent', 'pesky bill', 'fund your lifestyle',
        ];

        $corpus = mb_strtolower(
            HelpArticle::query()->get(['title', 'summary', 'body', 'keywords'])->toJson()
            .HelpCategory::query()->get(['title', 'summary'])->toJson()
        );

        foreach ($banned as $term) {
            $this->assertStringNotContainsString($term, $corpus, "Banned term '{$term}' is in seeded help copy.");
        }
    }

    /** Every seeded token must be one the whitelist knows, or it renders blank. */
    public function test_no_seeded_article_uses_an_unknown_token(): void
    {
        $this->seed(HelpCentreSeeder::class);

        $unknown = [];

        foreach (HelpArticle::all() as $article) {
            $unknown = array_merge(
                $unknown,
                HelpTokens::unknown($article->body),
                HelpTokens::unknown($article->summary)
            );
        }

        $this->assertSame([], array_values(array_unique($unknown)));
    }

    /**
     * ⚠️ Titles are printed into page titles, breadcrumbs, JSON-LD and search
     * results — none of which render tokens. A {{token}} in a title leaks the
     * literal braces into all four.
     */
    public function test_no_seeded_title_contains_a_token(): void
    {
        $this->seed(HelpCentreSeeder::class);

        foreach (HelpArticle::all() as $article) {
            $this->assertStringNotContainsString('{{', $article->title, "Article '{$article->slug}' has a token in its title.");
        }

        foreach (HelpCategory::all() as $category) {
            $this->assertStringNotContainsString('{{', $category->title);
        }
    }

    /**
     * 🚨 TWO SEPARATE CLOCKS, and a reader caught them being conflated.
     *
     * `reserve.window_days` is how long each reserve is HELD (from its own sale,
     * fixed). `reserve.onboarding_days` is how long a creator stays on the
     * new-creator RATE (a setting). An earlier summary read "held for 30 days…
     * new creators are on 10% for their first 2 days", which reads as the money
     * being held for two days — wrong on both counts.
     *
     * They resolve from different sources, so this asserts they are wired to the
     * right ones rather than to each other.
     */
    public function test_the_reserve_hold_window_and_the_rate_window_are_different_tokens(): void
    {
        // Set the two to values that cannot be confused.
        // ⚠️ `value` is cast to `array` — pass an array, never json_encode(). A
        // string is double-encoded and reads back as nothing, which then falls
        // through to the default and makes the assertion look like a code bug.
        RiskSetting::updateOrCreate(
            ['key' => 'creator_rules'],
            ['value' => ['new_creator_age_days' => 7]]
        );

        $this->assertSame(
            (string) ReleaseReserves::RESERVE_RELEASE_WINDOW_DAYS,
            HelpTokens::render('{{reserve.window_days}}'),
            'The hold window must come from ReleaseReserves, not from the onboarding setting.'
        );

        $this->assertSame('7', HelpTokens::render('{{reserve.onboarding_days}}'));
        $this->assertSame('10%', HelpTokens::render('{{reserve.onboarding_pct}}'));
    }

    /**
     * The published copy must state which window is which. "held for X days…
     * on 10% for their first Y days" without labelling them is the sentence a
     * reader read as "the money is held for Y days".
     */
    public function test_the_reserve_articles_label_which_window_is_which(): void
    {
        $this->seed(HelpCentreSeeder::class);

        $article = HelpArticle::where('slug', 'why-is-some-of-my-money-held')->firstOrFail();
        $body = HelpTokens::render($article->body);

        $this->assertStringContainsString('How long money is held', $body);
        $this->assertStringContainsString('How much is reserved', $body);
        $this->assertStringContainsString(
            'not how long the money is held',
            $body,
            'The article must say the rate window is not the hold window.'
        );
    }

    /**
     * 🚨 THE ANTI-DRIFT CHECK, and the reason the help centre is worth having.
     *
     * If a token can produce a figure, no article may type that figure by hand.
     * A hand-typed one is correct on the day it is written and silently wrong
     * the day the setting changes — which is exactly how the homepage FAQ came
     * to advertise an 8% fee and £29.99/mo for a year.
     *
     * ⚠️ Deliberately checks the RAW body (before token resolution). After
     * resolution every token IS the literal, so the check would pass trivially.
     */
    public function test_no_article_hardcodes_a_figure_a_token_already_provides(): void
    {
        $this->seed(HelpCentreSeeder::class);

        // Only the distinctive values. Something like "30" or "3" appears
        // legitimately in prose and in list numbering; a check that flagged
        // those would be noise nobody reads.
        $distinctive = [];

        foreach (HelpTokens::names() as $token) {
            $value = trim(HelpTokens::render('{{'.$token.'}}'));

            // A bare small number is too common in ordinary prose to match on.
            if ($value === '' || preg_match('/^\d{1,2}$/', $value)) {
                continue;
            }

            $distinctive[$token] = $value;
        }

        $this->assertNotEmpty($distinctive, 'No distinctive token values to check against.');

        $offences = [];

        foreach (HelpArticle::get(['slug', 'summary', 'body']) as $article) {
            // Raw text with the tokens themselves removed, so only hand-typed
            // literals remain.
            $raw = preg_replace('/\{\{[a-z0-9_.]+\}\}/i', '', $article->summary."\n".$article->body);

            foreach ($distinctive as $token => $value) {
                if (str_contains($raw, $value)) {
                    $offences[] = "{$article->slug} types \"{$value}\" — use {{{$token}}}";
                }
            }
        }

        $this->assertSame([], $offences, "Hand-typed figures found:\n  ".implode("\n  ", $offences));
    }

    /**
     * Figures that have no token because they live in a controller constant.
     * Asserted against the constant so the article cannot drift from the code.
     */
    public function test_hand_written_limits_match_the_code(): void
    {
        $this->seed(HelpCentreSeeder::class);

        $body = fn (string $slug) => HelpArticle::where('slug', $slug)->firstOrFail()->body;

        $this->assertStringContainsString(
            'Up to '.CatalogueController::MAX_SCHEDULE_DAYS.' days ahead',
            $body('schedule-a-listing')
        );

        // Digital-content waiver: the article tells a buyer what they gave up,
        // and the exact wording they agreed to is a legal record.
        $this->assertStringContainsString('14-day', Helpers::DIGITAL_WAIVER_TEXT);
        $this->assertStringContainsString('14-day', $body('refunds-and-cancellations'));
    }

    /** A related link that points nowhere is a 404 we shipped ourselves. */
    public function test_every_seeded_related_slug_exists(): void
    {
        $this->seed(HelpCentreSeeder::class);

        $slugs = HelpArticle::pluck('slug')->all();

        foreach (HelpArticle::whereNotNull('related_slugs')->get() as $article) {
            foreach ($article->related_slugs as $slug) {
                $this->assertContains($slug, $slugs, "Related slug '{$slug}' does not exist.");
            }
        }
    }

    /** History exists so a retitle does not break links; nothing else uses it. */
    public function test_slug_history_is_cleaned_when_a_slug_is_reused(): void
    {
        $category = $this->category();
        $article = $this->article($category);

        $article->update(['slug' => 'renamed']);
        $article->update(['slug' => 'when-do-i-get-paid']);

        $this->assertDatabaseMissing('help_article_slug_history', ['slug' => 'when-do-i-get-paid']);
        $this->assertDatabaseHas('help_article_slug_history', ['slug' => 'renamed']);
        $this->assertSame(1, HelpArticleSlugHistory::count());
    }
}
