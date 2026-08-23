<?php

namespace Tests\Feature;

use App\Models\User;
use App\Services\Discovery\CollectionService;
use App\Support\DiscoverySources;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Cache;
use Inertia\Testing\AssertableInertia;
use Tests\TestCase;

/**
 * Discovery Phase 6 — collections on the platform's own surfaces.
 * Developer Master Plan, 19 Aug 2026, §C.
 *
 * The first surface is the one the brief names by itself: payment success,
 * "Discover someone else". `payment-success` has been a RESERVED source key
 * since Phase 1 and tagged nothing, because the prompt did not exist.
 */
class DiscoveryPhase6Test extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        Cache::flush();
    }

    /**
     * 🚨 THE SOURCE BELONGS TO THE SURFACE. The same "Similar Creators" row runs
     * beside search, on a profile and after a checkout. If the collection's own
     * default won, every checkout sale would be reported as having come from
     * search — and attribution has no backfill, so it would be wrong for ever.
     */
    public function test_a_surface_can_own_the_attribution_key(): void
    {
        $creator = User::factory()->create(['role' => 1, 'username' => 'ctx']);

        $row = app(CollectionService::class)
            ->get('similar_creators', 4, null, $creator, 'payment-success');

        $this->assertSame('payment-success', $row['source']);
    }

    /**
     * ⚠️ A surface cannot invent a key. An unrecognised one falls back to the
     * collection's default rather than being carried into a link the server
     * will silently refuse — which looks exactly like a tagged link that works.
     */
    public function test_an_unrecognised_surface_key_falls_back(): void
    {
        $creator = User::factory()->create(['role' => 1, 'username' => 'ctx2']);

        $row = app(CollectionService::class)
            ->get('similar_creators', 4, null, $creator, 'not-a-real-surface');

        $this->assertSame(
            CollectionService::COLLECTIONS['similar_creators']['source'],
            $row['source']
        );
    }

    /** The key the brief names for this surface is one the server accepts. */
    public function test_payment_success_is_a_reserved_sp_source(): void
    {
        $this->assertSame('payment-success', DiscoverySources::normalise('payment-success'));

        $this->assertSame(
            DiscoverySources::CLASS_SP,
            DiscoverySources::classFor('payment-success'),
            'A creator did not bring this visitor — the platform showed them the prompt.'
        );
    }

    /**
     * 🚨 THE ORDER OF THE TWO OFFERS IS A DECISION, NOT A LAYOUT DETAIL.
     * The membership upsell sells more of the creator the buyer just backed;
     * the discovery row sends them to somebody else. Putting the second first
     * spends the platform's best moment on the smaller outcome.
     */
    public function test_the_discovery_row_sits_below_the_membership_offer(): void
    {
        $page = (string) file_get_contents(resource_path('js/Pages/Profile/Thankyou.jsx'));

        $offer = strpos($page, '<MembershipOffer');
        $row = strpos($page, '<CollectionRow');

        $this->assertNotFalse($offer, 'The membership upsell is gone from the thank-you page.');
        $this->assertNotFalse($row, 'The discovery row is gone from the thank-you page.');
        $this->assertLessThan(
            $row,
            $offer,
            'Deepen before widening: the membership offer must come first.'
        );
    }

    /**
     * 🚨 THE HOMEPAGE MUST NOT SHOW THE SAME CREATORS TWICE UNDER TWO HEADINGS.
     * `CreatorShowcase` already draws Trending and New as its own tabs, so the
     * homepage takes only the collections it does NOT already have.
     */
    public function test_the_homepage_takes_only_the_collections_it_lacks(): void
    {
        $routes = (string) file_get_contents(base_path('routes/web.php'));

        $call = substr($routes, strpos($routes, "'collections' => app(CollectionService::class)->many("), 260);

        $this->assertStringContainsString("'hidden_gems'", $call);
        $this->assertStringContainsString("'almost_funded'", $call);
        $this->assertStringNotContainsString("'trending'", $call,
            'Trending is already on the homepage as its own tab — this would draw it twice.');
        $this->assertStringNotContainsString("'new_creators'", $call,
            'New creators are already on the homepage as their own tab.');
    }

    /**
     * ⚠️ The row is drawn on a DARK field there, so the heading has to change
     * with it. A black heading on the homepage is simply not visible.
     */
    public function test_the_homepage_rows_are_drawn_for_a_dark_ground(): void
    {
        $showcase = (string) file_get_contents(
            resource_path('js/Pages/home/CreatorShowcase.jsx')
        );

        $this->assertStringContainsString('tone="dark"', $showcase);
    }

    /**
     * 🚨 THE CHECKOUT ROW MUST NOT BE EMPTY HALF THE TIME.
     *
     * "Similar Creators" needs the creator to have categories, and on this
     * platform only about half of them do — so a single-collection row would
     * have shown nothing on roughly half of all checkouts, which is the one
     * moment where a supporter has just proved they will pay. The chain asks a
     * different question rather than giving up.
     */
    public function test_the_checkout_row_falls_back_rather_than_showing_nothing(): void
    {
        // A creator with no categories: "similar" can find nobody.
        $creator = User::factory()->create([
            'role' => 1,
            'suspended_account' => 0,
            'profile_status_lock' => 2,
            'avatar' => 'a.jpg',
            'avatar_approved' => 1,
            'name' => 'Context',
            'username' => 'context',
        ]);

        // Somebody eligible for the fallback to find.
        User::factory()->create([
            'role' => 1,
            'suspended_account' => 0,
            'profile_status_lock' => 2,
            'avatar' => 'b.jpg',
            'avatar_approved' => 1,
            'name' => 'Findable',
            'username' => 'findable',
        ]);

        $service = app(CollectionService::class);

        $this->assertCount(
            0,
            $service->get('similar_creators', 4, null, $creator)['cards'],
            'The fixture is wrong: similar should find nobody here, or this test proves nothing.'
        );

        $row = $service->firstNonEmpty(
            ['similar_creators', 'hidden_gems', 'new_creators'],
            4,
            null,
            $creator,
            'payment-success'
        );

        $this->assertNotEmpty($row['cards'], 'The chain gave up instead of asking the next question.');

        // ⚠️ And the SURFACE still owns the key, whichever collection filled it.
        $this->assertSame('payment-success', $row['source']);
    }

    /**
     * 🚨 A SEARCH THAT FINDS NOTHING IS THE WORST DEAD END ON THE PLATFORM.
     *
     * That visitor is not browsing — they came looking for something specific
     * and were answered with "No matches found. Try adjusting your search",
     * which is an instruction to work harder with no idea what would work.
     * Discovery Phase 6 names this surface twice ("search recs", "empty
     * states").
     */
    public function test_a_search_carries_collections_so_it_is_never_a_dead_end(): void
    {
        User::factory()->create([
            'role' => 1,
            'suspended_account' => 0,
            'profile_status_lock' => 2,
            'avatar' => 'a.jpg',
            'avatar_approved' => 1,
            'name' => 'Findable',
            'username' => 'findable',
        ]);

        $this->get('/discover?search=zzzznothingmatchesthis')
            ->assertOk()
            ->assertInertia(function (AssertableInertia $page) {
                $collections = $page->toArray()['props']['collections'];

                $this->assertNotEmpty(
                    $collections,
                    'A search with no results offered nothing to do next.'
                );
            });
    }

    /**
     * ⚠️ And NOT while simply browsing. The rest of that page already has its
     * own sections; adding more would be noise, and it would cost the query on
     * every visit rather than only on the visits that need it.
     */
    public function test_browsing_discover_is_not_given_the_extra_rows(): void
    {
        $this->get('/discover')
            ->assertOk()
            ->assertInertia(
                fn (AssertableInertia $page) => $page->where('collections', [])
            );
    }

    /**
     * 🚨 A CREATOR IS NEVER SHOWN A RAW SOURCE KEY. `hidden-gems` is an internal
     * name for a placement; on a dashboard it reads as a leak rather than an
     * answer to "where did these people come from?".
     */
    public function test_every_source_has_a_creator_facing_label(): void
    {
        foreach (array_keys(DiscoverySources::KEYS) as $key) {
            $label = DiscoverySources::label($key);

            $this->assertNotSame($key, $label, "Source '{$key}' has no creator-facing label.");
            $this->assertStringNotContainsString('-', $label, "Label for '{$key}' still looks like a key.");
        }
    }

    /**
     * 🚨 THE CREATOR'S OWN TRAFFIC IS MARKED AS THEIRS. Folding `bio-link` into
     * the Discovery total would be the platform taking credit for the creator's
     * own audience — and the whole promise of the feature is the distinction
     * between what they brought and what we added.
     */
    public function test_the_creators_own_link_is_labelled_as_their_own(): void
    {
        $this->assertSame(
            DiscoverySources::CLASS_CREATOR,
            DiscoverySources::classFor('bio-link')
        );

        $this->assertStringContainsStringIgnoringCase(
            'your own',
            DiscoverySources::label('bio-link')
        );
    }

    /**
     * ⚠️ The breakdown only draws against REAL figures. The marketing surfaces
     * hand this component `config('discovery.mock_stats')`, which has no
     * `by_source` key at all — an invented breakdown would read as data, and a
     * bare `.map` on a missing key would take the landing page down.
     */
    public function test_the_breakdown_is_guarded_against_the_mock_figures(): void
    {
        $panel = (string) file_get_contents(
            resource_path('js/Components/discovery/DiscoveryStatsPanel.jsx')
        );

        $this->assertStringContainsString(
            'Array.isArray(stats?.by_source) ? stats.by_source : []',
            $panel,
            'The breakdown must not assume the key exists — marketing passes mock stats without it.'
        );

        $this->assertStringContainsString(
            '{live && sources.length > 0 && (',
            $panel,
            'The breakdown must be gated on real figures.'
        );

        $this->assertArrayNotHasKey(
            'by_source',
            config('discovery.mock_stats'),
            'If the mock figures ever gain this key, the guard above stops being the protection it is.'
        );
    }

    /**
     * ⚠️ Every card in a row carries the surface key AND the collection key, so
     * a sale is traceable to both. The reusable component is the only thing that
     * builds these links — a surface drawing its own cards is a placement that
     * records nothing.
     */
    public function test_the_reusable_row_tags_every_link(): void
    {
        $component = (string) file_get_contents(
            resource_path('js/Components/discovery/CollectionRow.jsx')
        );

        $this->assertStringContainsString('discoveryLink(card.username, source, campaign)', $component);

        $this->assertSame(
            2,
            substr_count($component, 'discoveryLink(card.username, source, campaign)'),
            'Both the creator card and the item card must build a tagged link.'
        );

        $this->assertStringNotContainsString(
            'href={`/${card.username}`}',
            $component,
            'An untagged profile link in this component is a placement that never appears '
            .'in any creator\'s numbers, and there is no backfill.'
        );
    }
}
