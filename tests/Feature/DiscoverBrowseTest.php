<?php

namespace Tests\Feature;

use App\Models\Shop;
use App\Models\User;
use App\Models\WishItem;
use App\Services\DiscoveryService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Inertia\Testing\AssertableInertia;
use Tests\TestCase;

/**
 * Discover as a shop front.
 *
 * Each test here pins a failure that shipped: a "trending" rail ordered by id,
 * a result count that reported the page size, a "load more" that returned the
 * same page, a suggestions route that never existed, and a price plate that
 * could have advertised a cheaper number than the checkout charges.
 */
class DiscoverBrowseTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        Cache::flush();
    }

    private function creator(array $attrs = []): User
    {
        return User::factory()->create(array_merge([
            'role' => 1,
            'profile_status_lock' => 2,
            'suspended_account' => 0,
        ], $attrs));
    }

    private function wish(User $owner, float $price, string $currency = 'GBP'): WishItem
    {
        return WishItem::factory()->create([
            'user_id' => $owner->id,
            'price' => $price,
            'currency' => $currency,
            'is_approved' => 1,
            'is_suspended' => 0,
        ]);
    }

    /** A purchase row, in the one table every paid feature writes to. */
    private function deliverable(User $creator, int $itemId, int $minutesAgo, ?User $buyer = null): void
    {
        DB::table('deliverables')->insert([
            'uuid' => (string) Str::uuid(),
            'product_id' => 'prod_test',
            'product_type' => 'wish',
            'deliverable_type' => 'digital_file',
            'item_id' => $itemId,
            'creator_id' => $creator->id,
            // A real row: gifter_id is a foreign key. It is written here and
            // must never come back OUT of the feed — see the privacy test.
            'gifter_id' => ($buyer ?? User::factory()->create(['role' => 0]))->id,
            'transaction_amount' => 15,
            'status' => 'delivered',
            'created_at' => now()->subMinutes($minutesAgo),
            'updated_at' => now()->subMinutes($minutesAgo),
        ]);
    }

    /**
     * 🚨 The card's whole job is answering "what does it cost to buy in" before
     * the click. `price_from` is the cheapest LISTED price the creator sells at.
     */
    public function test_a_creator_card_carries_the_cheapest_listed_price(): void
    {
        $creator = $this->creator(['username' => 'pricey']);
        $this->wish($creator, 40);
        $this->wish($creator, 12.5);

        $meta = app(DiscoveryService::class)->creatorMeta([$creator->id]);

        $this->assertSame(12.5, $meta[$creator->id]['price_from']);
        $this->assertSame(2, $meta[$creator->id]['items_count']);
        $this->assertContains('instant', $meta[$creator->id]['unlock_types']);
    }

    /**
     * ⚠️ A creator with nothing for sale is a dead end while BROWSING, so the
     * grid leaves them out — but a visitor who typed their name asked for them
     * by name, and "no results" for an account that exists is the worse answer.
     */
    public function test_browsing_hides_a_creator_with_nothing_listed_but_search_finds_them(): void
    {
        $empty = $this->creator(['username' => 'nothinglisted', 'name' => 'Nothing Listed']);
        $selling = $this->creator(['username' => 'sellsstuff']);
        $this->wish($selling, 9.99);

        $service = app(DiscoveryService::class);

        $browse = $service->rankedCreatorIds(['sortBy' => 'Trending'])['ids'];
        $this->assertNotContains($empty->id, $browse);
        $this->assertContains($selling->id, $browse);

        $found = $service->rankedCreatorIds(['search' => 'Nothing Listed'])['ids'];
        $this->assertContains($empty->id, $found);
    }

    /**
     * 🚨 A price band is a GBP-equivalent question. Filtering the raw column
     * would put a listing priced 12 in another currency into "Under £10".
     */
    public function test_a_price_band_excludes_a_creator_whose_cheapest_listing_is_outside_it(): void
    {
        $cheap = $this->creator(['username' => 'cheapseats']);
        $this->wish($cheap, 6);

        $dear = $this->creator(['username' => 'topshelf']);
        $this->wish($dear, 80);

        $ids = app(DiscoveryService::class)->rankedCreatorIds(['priceBand' => 'under10'])['ids'];

        $this->assertContains($cheap->id, $ids);
        $this->assertNotContains($dear->id, $ids);
    }

    /**
     * 🚨 The count is the TOTAL, not the size of the page — it is what tells a
     * supporter whether there is more to look at, and what decides whether
     * "Load more" is offered at all.
     */
    public function test_counts_report_the_total_not_the_page(): void
    {
        $creator = $this->creator();
        foreach (range(1, 30) as $i) {
            $this->wish($creator, 5 + $i);
        }

        $service = app(DiscoveryService::class);

        $this->assertSame(30, $service->getSearchCounts([])['wishes']);
        $this->assertCount(24, $service->getSearchWishes([], 24));
    }

    /**
     * 🚨 Page two used to be page one. Bills, memberships, tasks and shops ran
     * their query with a limit and NO offset, so "Load more" appended the rows
     * the visitor was already looking at.
     */
    public function test_a_second_page_returns_different_rows(): void
    {
        $creator = $this->creator();
        foreach (range(1, 30) as $i) {
            $this->wish($creator, 5 + $i);
        }

        $service = app(DiscoveryService::class);
        $first = $service->getSearchWishes(['page' => 1], 24)->pluck('id')->all();
        $second = $service->getSearchWishes(['page' => 2], 24)->pluck('id')->all();

        $this->assertCount(6, $second);
        $this->assertEmpty(array_intersect($first, $second));
    }

    /**
     * ⚠️ `route('discover.suggestions')` has been called from the search box
     * forever against a route that did not exist — and ziggy THROWS for a name
     * it does not carry, so every keystroke past the second raised an error.
     */
    public function test_the_suggestions_endpoint_answers(): void
    {
        $this->creator(['username' => 'findme', 'name' => 'Find Me']);

        $this->getJson('/discover/suggestions?q=Find')
            ->assertOk()
            ->assertJsonPath('creators.0.search_term', 'findme');
    }

    /**
     * 🚨 A bare /discover put `type=trending` into the filters, which pushed the
     * page into its search branch — so the featured rails were built and never
     * rendered, and the landing was a bare grid.
     */
    public function test_the_landing_page_renders_its_rails(): void
    {
        $creator = $this->creator();
        $this->wish($creator, 7.5);

        $this->get('/discover')
            ->assertOk()
            ->assertInertia(fn (AssertableInertia $page) => $page
                ->component('discover/Discover')
                // Empty, not 'trending' — the landing branch is what makes the
                // rails reachable at all.
                ->missing('filters.type')
                ->has('counts')
                ->has('priceBands', 4)
                ->has('unlockTypes', 3)
                ->has('boardCreators')
            );
    }

    /**
     * 🚨 THE BUYER IS NEVER IN THE FEED. Not a name, not an id, not an amount.
     * A purchase is between the supporter and the creator; the only public facts
     * are the creator and what was bought.
     */
    public function test_the_live_feed_names_the_creator_and_the_item_but_never_the_buyer(): void
    {
        $creator = $this->creator(['username' => 'livecreator']);
        $buyer = User::factory()->create(['role' => 0, 'name' => 'Nosy Buyer']);
        $wish = $this->wish($creator, 15);

        $this->deliverable($creator, $wish->id, 5, $buyer);

        $feed = app(DiscoveryService::class)->recentUnlocks(5);

        $this->assertCount(1, $feed);
        $this->assertSame('livecreator', $feed[0]['username']);
        $this->assertSame($wish->wishname, $feed[0]['title']);

        // ⚠️ Asserted on the KEYS, not on a substring search: a buyer id like
        // "2" appears inside any timestamp, so a string assertion would pass
        // for the wrong reason. These four keys are the whole contract.
        $this->assertSame(['title', 'username', 'unlock', 'at'], array_keys($feed[0]));
        $this->assertStringNotContainsString('Nosy Buyer', json_encode($feed));
    }

    /**
     * ⚠️ A ticker must never advertise a profile the visitor cannot open, and an
     * empty feed renders NOTHING rather than being padded with old activity.
     */
    public function test_the_live_feed_skips_a_suspended_creator_and_can_be_empty(): void
    {
        $creator = $this->creator(['username' => 'gonecreator', 'suspended_account' => 1]);
        $wish = $this->wish($creator, 15);

        $this->deliverable($creator, $wish->id, 60);

        $this->assertSame([], app(DiscoveryService::class)->recentUnlocks(5));

        $this->getJson('/discover/live')->assertOk()->assertJsonPath('unlocks', []);
    }

    /**
     * ⚠️ The same item bought three times in a row is ONE line. Three identical
     * rows read as a bug, not as popularity — and the live data that prompted
     * this had exactly that shape.
     */
    public function test_the_live_feed_collapses_a_repeated_item(): void
    {
        $creator = $this->creator(['username' => 'repeatcreator']);
        $wish = $this->wish($creator, 9);

        foreach ([3, 4, 5] as $minutes) {
            $this->deliverable($creator, $wish->id, $minutes);
        }

        $this->assertCount(1, app(DiscoveryService::class)->recentUnlocks(10));
    }

    /**
     * 🚨 A person searching a name is not browsing. Putting the trending
     * creator above the account they typed is the fastest way to look broken.
     */
    public function test_a_named_search_ranks_the_exact_handle_first(): void
    {
        $exact = $this->creator(['username' => 'lumen', 'name' => 'Lumen']);
        $this->wish($exact, 12);

        $prefix = $this->creator(['username' => 'lumenopolis', 'name' => 'Lumenopolis']);
        $this->wish($prefix, 8);

        $bioOnly = $this->creator(['username' => 'someoneelse', 'name' => 'Someone Else', 'bio' => 'I love lumen lighting']);
        $this->wish($bioOnly, 5);

        $ids = app(DiscoveryService::class)->rankedCreatorIds(['search' => 'lumen'])['ids'];

        $this->assertSame($exact->id, $ids[0]);
        $this->assertSame($prefix->id, $ids[1]);
        $this->assertContains($bioOnly->id, $ids);
    }

    /**
     * ⚠️ The interest facet is the EXISTING profile-badge taxonomy, and the
     * column has held both labels and slugs — a creator who picked their badges
     * before the slug migration must still be findable.
     */
    public function test_the_interest_filter_reads_both_stored_shapes(): void
    {
        $slugStyle = $this->creator(['username' => 'slugstyle', 'creator_category' => json_encode(['artist'])]);
        $this->wish($slugStyle, 10);

        $labelStyle = $this->creator(['username' => 'labelstyle', 'creator_category' => json_encode(['Artist'])]);
        $this->wish($labelStyle, 10);

        $other = $this->creator(['username' => 'notanartist', 'creator_category' => json_encode(['developer'])]);
        $this->wish($other, 10);

        $ids = app(DiscoveryService::class)->rankedCreatorIds(['interest' => 'artist'])['ids'];

        $this->assertContains($slugStyle->id, $ids);
        $this->assertContains($labelStyle->id, $ids);
        $this->assertNotContains($other->id, $ids);
    }

    /** An interest page is a real page; an invented slug is a 404, not an empty grid. */
    public function test_an_interest_page_renders_and_an_unknown_slug_404s(): void
    {
        $creator = $this->creator(['creator_category' => json_encode(['artist'])]);
        $this->wish($creator, 10);

        $this->get('/discover/c/artist')->assertOk();
        $this->get('/discover/c/not-a-real-badge')->assertNotFound();
    }

    /**
     * 🚨 Quick view SHOWS the shelf; it must not become a second place that
     * prices a purchase. Every row carries the listed price and a link to the
     * existing checkout — no totals, no fees, no discounts.
     */
    public function test_quick_view_lists_items_cheapest_first_with_a_real_checkout_link(): void
    {
        $creator = $this->creator(['username' => 'shelfowner']);
        $this->wish($creator, 40);
        $cheap = $this->wish($creator, 6);

        $preview = app(DiscoveryService::class)->creatorPreview('shelfowner');

        $this->assertSame($cheap->wishname, $preview['items'][0]['title']);
        $this->assertSame(6.0, $preview['items'][0]['price']);
        $this->assertStringContainsString('/shelfowner/wishes?item='.$cheap->uuid, $preview['items'][0]['href']);
        $this->assertArrayNotHasKey('total', $preview['items'][0]);
    }

    /** A private or suspended creator has no quick view at all. */
    public function test_quick_view_refuses_a_non_public_creator(): void
    {
        $hidden = $this->creator(['username' => 'hiddenone', 'profile_status_lock' => 0]);
        $this->wish($hidden, 10);

        $this->assertSame([], app(DiscoveryService::class)->creatorPreview('hiddenone'));
    }

    /**
     * 🚨 "Top earners" ranked NOTHING before: it took the first N creators with
     * `limit()` applied before any ordering and never read a payment.
     */
    public function test_top_earners_is_ordered_by_the_ledger(): void
    {
        $small = $this->creator(['username' => 'smallearner', 'stripe_details_submitted' => 1]);
        $big = $this->creator(['username' => 'bigearner', 'stripe_details_submitted' => 1]);

        foreach ([[$small, 10], [$big, 900]] as [$creator, $amount]) {
            DB::table('financial_transactions')->insert([
                'uuid' => (string) Str::uuid(),
                'user_id' => $creator->id,
                'type' => 'income',
                'status' => 'completed',
                'gross_amount' => $amount,
                'net_amount' => $amount,
                'gbp_amount' => $amount,
                'currency' => 'GBP',
                'transaction_date' => now()->subDay(),
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }

        $earners = collect(app(DiscoveryService::class)->getTopEarners('', 5)['data']);

        $this->assertSame('bigearner', $earners->first()['username']);
        // ⚠️ Order is public; the amount is not.
        $this->assertSame(0, $earners->first()['total_amount']);
    }

    /**
     * 🚨 Personal rows must never reach another visitor. They are built outside
     * the shared page cache — this asserts the page a guest gets carries none.
     */
    public function test_a_guest_page_carries_no_personal_rows(): void
    {
        $creator = $this->creator();
        $this->wish($creator, 10);

        $this->get('/discover')
            ->assertOk()
            ->assertInertia(fn (AssertableInertia $page) => $page
                ->where('followedCreators', [])
                ->where('supportedCreators', [])
                ->etc()
            );
    }

    /** A supporter's own follows come back on their own request. */
    public function test_a_signed_in_supporter_gets_their_followed_creators(): void
    {
        $creator = $this->creator(['username' => 'followedone']);
        $this->wish($creator, 10);

        $supporter = User::factory()->create(['role' => 0]);
        DB::table('follows')->insert([
            'follower_id' => $supporter->id,
            'followed_id' => $creator->id,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $rows = app(DiscoveryService::class)->followedCreators($supporter->id);

        $this->assertCount(1, $rows);
        $this->assertSame('followedone', $rows[0]['username']);
    }

    /** ⚠️ A follow survives the creator being suspended; the rail must not. */
    public function test_a_followed_creator_who_went_private_drops_out(): void
    {
        $creator = $this->creator(['username' => 'wentprivate', 'profile_status_lock' => 0]);
        $supporter = User::factory()->create(['role' => 0]);

        DB::table('follows')->insert([
            'follower_id' => $supporter->id,
            'followed_id' => $creator->id,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $this->assertCount(0, app(DiscoveryService::class)->followedCreators($supporter->id));
    }

    /**
     * ⚠️ The collection rows existed since Phase 5 and Discover rendered them ONLY
     * on a failed search — the one moment the visitor is already annoyed.
     */
    public function test_the_landing_page_carries_collections_and_a_search_does_not(): void
    {
        $creator = $this->creator();
        $this->wish($creator, 10);

        $this->get('/discover')
            ->assertOk()
            ->assertInertia(fn (AssertableInertia $page) => $page->has('landingCollections')->etc());

        $this->get('/discover?search=nothingmatchesthis')
            ->assertOk()
            ->assertInertia(fn (AssertableInertia $page) => $page->where('landingCollections', [])->etc());
    }

    /**
     * An interest page has to describe itself: it is the only indexable Discover URL
     * beyond the root. 🚨 The JSON-LD names the COLLECTION, never its creators — an
     * ItemList of real people is a machine-readable record of who was on the page
     * that day, which a creator who leaves cannot take back.
     */
    public function test_an_interest_page_describes_itself_without_naming_creators(): void
    {
        $creator = $this->creator(['username' => 'seocreator', 'creator_category' => json_encode(['artist'])]);
        $this->wish($creator, 10);

        $response = $this->get('/discover/c/artist')->assertOk();
        $html = $response->getContent();

        $this->assertStringContainsString('CollectionPage', $html);
        $this->assertStringContainsString('Artist creators to support', $html);
        $this->assertStringNotContainsString('"ItemList"', $html);

        $response->assertInertia(fn (AssertableInertia $page) => $page->where('interestLabel', 'Artist')->etc());
    }

    /**
     * ⚠️ The item half of the suggestions endpoint was written and left COMMENTED
     * OUT, so a shop front's search box could only ever answer "which creator".
     * An item suggestion goes straight to that item's own checkout.
     */
    public function test_suggestions_return_items_as_well_as_creators(): void
    {
        $creator = $this->creator(['username' => 'itemowner', 'name' => 'Item Owner']);
        $wish = WishItem::factory()->create([
            'user_id' => $creator->id,
            'wishname' => 'Studio lighting rig',
            'price' => 20,
            'currency' => 'GBP',
            'is_approved' => 1,
            'is_suspended' => 0,
        ]);

        $this->getJson('/discover/suggestions?q=Studio')
            ->assertOk()
            ->assertJsonPath('items.0.text', 'Studio lighting rig')
            ->assertJsonPath('items.0.subtext', '@itemowner')
            ->assertJsonPath('items.0.href', '/itemowner/wishes?item='.$wish->uuid);
    }

    /** A private creator's items are not suggested to the public. */
    public function test_suggestions_skip_a_non_public_creators_items(): void
    {
        $hidden = $this->creator(['username' => 'hiddenshop', 'profile_status_lock' => 0]);
        WishItem::factory()->create([
            'user_id' => $hidden->id,
            'wishname' => 'Secret lighting rig',
            'price' => 20,
            'currency' => 'GBP',
            'is_approved' => 1,
            'is_suspended' => 0,
        ]);

        $this->getJson('/discover/suggestions?q=Secret')
            ->assertOk()
            ->assertJsonPath('items', []);
    }

    /**
     * 🚨 DISCOVER WAS A DIRECTORY OF PEOPLE. A supporter does not buy a creator,
     * they buy something a creator made — so the board is one feed of listings
     * across every module, and each row carries the mode its own card expects.
     */
    public function test_the_board_is_a_mixed_feed_of_listings(): void
    {
        $creator = $this->creator(['username' => 'mixedowner']);
        $this->wish($creator, 12);

        Shop::factory()->create([
            'user_id' => $creator->id,
            'name' => 'Poster print',
            'price' => 15,
            'currency' => 'GBP',
            // ⚠️ No 'status': the column exists on deployed databases only, and
            // the service now guards on Schema::hasColumn for that reason.
            'approved' => 1,
        ]);

        $rows = app(DiscoveryService::class)->mixedFeed([], 5);
        $modes = $rows->pluck('mode')->unique()->values()->all();

        $this->assertContains('wish', $modes);
        $this->assertContains('shop', $modes);
        $this->assertNotContains('creator', $modes);
        $this->assertArrayHasKey('item', $rows->first());
    }

    /**
     * ⚠️ "Cheapest first" that only sorts within a type is a lie — the feed sorts
     * price globally, in GBP, across modules.
     */
    public function test_a_price_sort_orders_the_mixed_feed_globally(): void
    {
        $creator = $this->creator(['username' => 'pricemix']);
        $this->wish($creator, 40);

        Shop::factory()->create([
            'user_id' => $creator->id,
            'name' => 'Cheap sticker',
            'price' => 6,
            'currency' => 'GBP',
            'approved' => 1,
        ]);

        $rows = app(DiscoveryService::class)->mixedFeed(['sortBy' => 'Price: Low to High'], 5);

        $this->assertSame('shop', $rows->first()['mode']);
    }
}
