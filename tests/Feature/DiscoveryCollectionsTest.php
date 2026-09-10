<?php

namespace Tests\Feature;

use App\Models\User;
use App\Models\WishItem;
use App\Services\Discovery\BirthdayDiscoveryService;
use App\Services\Discovery\CollectionService;
use App\Services\Discovery\CreatorRecommendationService;
use App\Support\DiscoveryEligibility;
use App\Support\DiscoverySources;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Cache;
use Tests\TestCase;

/**
 * Discovery Phase 5 — the ten collections. Developer Master Plan, 19 Aug 2026, §C.
 *
 * What these pin, in order of what would cost most if it broke:
 *   1. No collection ranks on money and no card leaks an earning.
 *   2. Every collection is attribution-tagged with a key the SERVER accepts —
 *      an untagged placement records nothing and has no backfill.
 *   3. An ineligible creator cannot reach a card, including through the item
 *      collections, which join to a creator from the other side.
 */
class DiscoveryCollectionsTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        Cache::flush();
    }

    private function creator(array $overrides = []): User
    {
        // ⚠️ array_merge, NEVER `+`. The union operator keeps the LEFT value, so
        // every "this creator should be excluded" fixture would silently build a
        // perfectly eligible creator and then assert it was excluded. That exact
        // fault is recorded in the website's CLAUDE.md.
        return User::factory()->create(array_merge([
            'role' => 1,
            'suspended_account' => 0,
            'profile_status_lock' => 2,
            'avatar' => 'avatar.jpg',
            'avatar_approved' => 1,
            'name' => 'Test Creator',
        ], $overrides));
    }

    /** @test */
    public function every_collection_is_tagged_with_a_source_the_server_accepts(): void
    {
        foreach (CollectionService::sources() as $key => $source) {
            $this->assertNotNull(
                $source,
                "Collection '{$key}' carries a source key DiscoverySources::normalise() refuses. "
                .'An untagged placement records nothing and attribution has no backfill.'
            );
        }
    }

    /** @test */
    public function the_ten_collections_the_brief_names_all_exist(): void
    {
        foreach ([
            'new_creators', 'hidden_gems', 'trending', 'almost_funded', 'new_wishes',
            'spotlight', 'popular', 'memberships', 'similar_creators', 'personalised',
        ] as $key) {
            $this->assertTrue(
                CollectionService::isKnown($key),
                "The brief names this collection and it is missing: {$key}"
            );
        }

        $this->assertCount(10, CollectionService::COLLECTIONS);
    }

    /**
     * 🚨 THE MONEY RULE. A creator card carries exactly six keys, and none of
     * them is an amount. A column added to `users` must not be able to reach a
     * public card by existing.
     */
    public function test_a_creator_card_can_never_carry_an_earning(): void
    {
        $this->creator(['username' => 'gemma']);

        $cards = app(CollectionService::class)->get('new_creators', 5)['cards'];

        $this->assertNotEmpty($cards, 'A brand-new eligible creator should appear in "New to Spenny Piggy".');

        $this->assertSame(
            ['id', 'name', 'username', 'avatar_url', 'cover_url', 'line'],
            array_keys($cards[0]),
            'The creator card whitelist changed. Every key here reaches a public surface.'
        );

        foreach (['earnings', 'net', 'total', 'revenue', 'balance', 'supporters', 'score'] as $forbidden) {
            $this->assertArrayNotHasKey($forbidden, $cards[0]);
        }
    }

    /** @test */
    public function an_unknown_collection_returns_empty_rather_than_throwing(): void
    {
        $result = app(CollectionService::class)->get('a_collection_nobody_defined');

        $this->assertSame([], $result['cards']);
    }

    /**
     * ⚠️ "Recommended for You" needs a "you". A signed-out visitor gets nothing
     * rather than a platform-wide list wearing a personalised heading.
     */
    public function test_personalised_gives_a_signed_out_visitor_nothing(): void
    {
        $this->creator(['username' => 'someone']);

        $this->assertSame(
            [],
            app(CollectionService::class)->get('personalised', 5, null)['cards']
        );
    }

    /**
     * 🚨 THE ADMIN SWITCH IS ABSOLUTE, ON EVERY COLLECTION. It is the one control
     * a human uses to take a creator off Discovery, and a collection that ignored
     * it would be a way back on that nobody could see.
     */
    public function test_an_excluded_creator_is_in_no_creator_collection(): void
    {
        $shown = $this->creator(['username' => 'visible']);
        $hidden = $this->creator(['username' => 'hidden']);
        $hidden->forceFill(['exclude_from_discovery' => 1])->save();

        $service = app(CollectionService::class);

        foreach (['new_creators', 'hidden_gems', 'popular', 'memberships', 'spotlight'] as $key) {
            $usernames = array_column($service->get($key, 20)['cards'], 'username');

            $this->assertNotContains(
                'hidden',
                $usernames,
                "An excluded creator reached the '{$key}' collection."
            );
        }

        $this->assertContains(
            'visible',
            array_column($service->get('new_creators', 20)['cards'], 'username'),
            'The control fixture should still be shown, or this test proves nothing.'
        );
    }

    /** A suspended account is never promoted. */
    public function test_a_suspended_creator_is_never_shown(): void
    {
        $this->creator(['username' => 'suspended', 'suspended_account' => 1]);

        $this->assertNotContains(
            'suspended',
            array_column(app(CollectionService::class)->get('new_creators', 20)['cards'], 'username')
        );
    }

    /**
     * 🚨 THE EXTRACTION THIS PHASE DEPENDED ON. Phase 3 and Phase 4 each held
     * their own copy of the eligibility clauses, and `BirthdayDiscoveryTest`
     * carries a test whose only job is catching them drift. Ten more collections
     * would have been a third copy, so the rule moved to
     * `DiscoveryEligibility`. This asserts the extraction actually happened —
     * a service that quietly retyped the clauses would pass every other test
     * here while re-creating the drift.
     */
    public function test_the_services_share_one_eligibility_rule(): void
    {
        foreach ([
            CreatorRecommendationService::class,
            BirthdayDiscoveryService::class,
            CollectionService::class,
        ] as $class) {
            $source = (string) file_get_contents((new \ReflectionClass($class))->getFileName());

            $this->assertStringContainsString(
                'DiscoveryEligibility',
                $source,
                basename(str_replace('\\', '/', $class)).' no longer uses the shared eligibility rule. '
                .'Three copies of these clauses is what the extraction removed.'
            );

            $this->assertStringNotContainsString(
                "->where('profile_status_lock', 2)",
                $source,
                basename(str_replace('\\', '/', $class)).' has retyped a shared clause locally.'
            );
        }
    }

    /**
     * 🚨 "RE-RUN" MUST ACTUALLY RE-RUN, WHATEVER LIMIT THE SURFACE ASKED FOR.
     *
     * A selection is cached per limit, per viewer, per context creator and per
     * rotation bucket, so clearing "this collection" is a FAMILY of keys. The
     * first `forget()` deleted one hardcoded key built from `DEFAULT_LIMIT`
     * (12) — a limit no surface actually uses: the checkout row asks for 4 and
     * the homepage and Discover ask for 8. So the admin screen's Re-run button
     * cleared a key nothing reads and did nothing, while appearing to work.
     *
     * A generation bump makes every existing entry unreachable in one write.
     */
    public function test_forget_invalidates_every_cached_variant_not_one_key(): void
    {
        $this->creator(['username' => 'gen_probe']);

        $service = app(CollectionService::class);

        // Two different limits, as two different surfaces would ask.
        $service->get('new_creators', 8);
        $service->get('new_creators', 4);

        $before = (int) (Cache::get(CollectionService::generationKey('new_creators')) ?: 1);

        $service->forget('new_creators');

        $this->assertSame(
            $before + 1,
            (int) Cache::get(CollectionService::generationKey('new_creators')),
            'Re-run did not bump the generation, so every cached variant survived it.'
        );
    }

    /**
     * ⚠️ Bumping one collection must not dump the others — an admin hiding a
     * misbehaving row should not cost the whole platform its warm cache.
     */
    public function test_forgetting_one_collection_leaves_the_others_alone(): void
    {
        $service = app(CollectionService::class);

        $service->forget('new_creators');

        $this->assertNull(
            Cache::get(CollectionService::generationKey('hidden_gems')),
            'Forgetting one collection moved another collection’s generation.'
        );
    }

    /** The shared rule keeps the birth year out of scope, by omission. */
    public function test_the_card_columns_never_select_a_birth_date(): void
    {
        $this->assertNotContains('date_of_birth', DiscoveryEligibility::CARD_COLUMNS);
    }

    /** Every declared source is one of the reserved keys, not an invention. */
    public function test_the_new_phase_five_keys_are_reserved_on_both_sides(): void
    {
        foreach (['spotlight', 'popular', 'memberships'] as $key) {
            $this->assertSame(
                $key,
                DiscoverySources::normalise($key),
                "'{$key}' is not a reserved source key on the server."
            );
        }

        $js = (string) file_get_contents(resource_path('js/lib/discoveryLink.js'));

        foreach (['spotlight', 'popular', 'memberships'] as $key) {
            $this->assertStringContainsString(
                "'{$key}'",
                $js,
                "discoveryLink.js is missing '{$key}'. A key the server accepts but the helper "
                .'cannot build is a collection nobody can tag.'
            );
        }
    }

    /**
     * 🚨 A WISH HELD BY MODERATION MUST NOT REACH A PUBLIC COLLECTION.
     *
     * `newWishes()` gated on `is_suspended` and NOT on `is_approved`, so an item
     * `CheckMediaModeration` is still holding would have been published the moment
     * anything requested the key. It never bit only because nothing did — which is
     * why the gate had to be closed BEFORE the collection was wired to a route,
     * not after. A dead collection is not a safe collection; it is an unreviewed one.
     *
     * ⚠️ `is_suspended` is the CREATOR-or-admin takedown flag and answers a
     * different question. Both clauses are load-bearing and neither implies the
     * other — this asserts the approval one specifically.
     */
    /** @test */
    public function test_new_wishes_never_shows_an_unapproved_wish(): void
    {
        $creator = $this->creator(['username' => 'wishcreator']);

        WishItem::factory()->create([
            'user_id' => $creator->id,
            'wishname' => 'An approved wish',
            'price' => 10,
            'currency' => 'GBP',
            'is_approved' => 1,
            'is_suspended' => 0,
        ]);

        WishItem::factory()->create([
            'user_id' => $creator->id,
            'wishname' => 'A wish still under review',
            'price' => 10,
            'currency' => 'GBP',
            'is_approved' => 0,
            'is_suspended' => 0,
        ]);

        $titles = array_column(
            app(CollectionService::class)->get('new_wishes', 12)['cards'],
            'title'
        );

        $this->assertContains('An approved wish', $titles);
        $this->assertNotContains(
            'A wish still under review',
            $titles,
            'newWishes() published a wish that is still held by moderation. `is_suspended` '
            .'is not the approval gate — `is_approved` is, and DiscoveryService applies it to '
            .'every other public wish surface.'
        );
    }

    /**
     * 🚨 THE CARD CARRIES THE LISTING'S OWN CURRENCY.
     *
     * `ItemCard` formatted every price as hardcoded GBP, and that branch had never
     * run in production because the only live item collection (`almost_funded`)
     * draws a percentage instead. Wiring this key on without the currency would
     * have printed a JPY creator's wish in pounds, on a public browse surface,
     * with nothing wrong in any log.
     */
    /** @test */
    public function test_a_new_wish_card_carries_its_own_currency(): void
    {
        $creator = $this->creator(['username' => 'yencreator']);

        WishItem::factory()->create([
            'user_id' => $creator->id,
            'wishname' => 'A wish priced in yen',
            'price' => 1500,
            'currency' => 'JPY',
            'is_approved' => 1,
            'is_suspended' => 0,
        ]);

        $card = collect(app(CollectionService::class)->get('new_wishes', 12)['cards'])
            ->firstWhere('title', 'A wish priced in yen');

        $this->assertNotNull($card, 'The approved wish did not reach the collection.');
        $this->assertSame('JPY', $card['currency']);
    }
}
