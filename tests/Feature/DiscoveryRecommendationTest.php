<?php

namespace Tests\Feature;

use App\Models\FinancialTransaction;
use App\Models\User;
use App\Models\UserCategory;
use App\Models\WishItem;
use App\Services\Discovery\CreatorRecommendationService;
use App\Support\DiscoverySources;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Queue;
use Illuminate\Support\Str;
use Tests\TestCase;

/**
 * Discovery Phase 3 — "More creators to support".
 *
 * The invariants here are the ones that cannot be caught by looking at a page:
 * the row never names the profile it sits on, never names a creator an admin
 * switched off, never names a creator with nothing to sell, and never carries a
 * number. Each of those is silent when it breaks — a wrong card looks exactly
 * like a right one.
 */
class DiscoveryRecommendationTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        // Both caches are platform-wide; a selection left over from the previous
        // test would make every assertion below meaningless.
        Cache::flush();
    }

    private function service(): CreatorRecommendationService
    {
        Cache::flush();

        return app(CreatorRecommendationService::class);
    }

    /**
     * A creator who satisfies every eligibility rule: approved, public, photo
     * reviewed, and one thing live to buy.
     */
    private function eligibleCreator(array $force = []): User
    {
        $user = User::factory()->create(['role' => 1]);

        /*
         * ⚠️ `array_merge`, NOT `[...] + $force`. PHP's `+` union keeps the LEFT
         * operand's value for a duplicate key, so `['suspended_account' => 0] +
         * ['suspended_account' => 1]` is 0 — every override this helper exists to
         * apply was silently discarded, and the ineligibility tests were building
         * perfectly eligible creators and then asserting they were excluded.
         */
        $user->forceFill(array_merge([
            'suspended_account' => 0,
            'profile_status_lock' => 2,
            'avatar' => (string) Str::uuid(),
            'avatar_approved' => 1,
        ], $force))->save();

        WishItem::factory()->create([
            'user_id' => $user->id,
            'is_approved' => 1,
        ]);

        return $user->refresh();
    }

    public function test_more_creators_is_a_live_reserved_source(): void
    {
        $this->assertArrayHasKey('more-creators', DiscoverySources::KEYS);
        $this->assertContains('more-creators', DiscoverySources::LIVE_KEYS);
        $this->assertTrue(DiscoverySources::isSpGenerated('more-creators'));
    }

    public function test_it_never_recommends_the_profile_being_viewed(): void
    {
        $viewed = $this->eligibleCreator();
        $others = collect(range(1, 5))->map(fn () => $this->eligibleCreator());

        $cards = $this->service()->forProfile($viewed);

        $this->assertNotEmpty($cards);
        $this->assertNotContains($viewed->username, array_column($cards, 'username'));

        foreach ($cards as $card) {
            $this->assertContains($card['username'], $others->pluck('username')->all());
        }
    }

    public function test_it_fills_four_distinct_slots_when_the_pool_allows(): void
    {
        $viewed = $this->eligibleCreator();
        collect(range(1, 8))->each(fn () => $this->eligibleCreator());

        $cards = $this->service()->forProfile($viewed);

        $this->assertCount(4, $cards);
        $this->assertSame(
            CreatorRecommendationService::SLOTS,
            array_column($cards, 'slot'),
        );

        // One creator, one card — a slot is never filled with a repeat.
        $usernames = array_column($cards, 'username');
        $this->assertSame($usernames, array_values(array_unique($usernames)));
    }

    /**
     * 🚨 The brief's hard rule: render fewer, never pad with an ineligible one.
     */
    public function test_a_small_pool_renders_fewer_cards_rather_than_padding(): void
    {
        $viewed = $this->eligibleCreator();
        $this->eligibleCreator();
        $this->eligibleCreator();

        $cards = $this->service()->forProfile($viewed);

        $this->assertCount(2, $cards);
        $this->assertNotContains($viewed->username, array_column($cards, 'username'));
    }

    public function test_an_empty_pool_renders_no_row_at_all(): void
    {
        $viewed = $this->eligibleCreator();

        $this->assertSame([], $this->service()->forProfile($viewed));
    }

    public function test_the_admin_exclude_flag_removes_a_creator(): void
    {
        $viewed = $this->eligibleCreator();
        $excluded = $this->eligibleCreator();
        $excluded->forceFill(['exclude_from_discovery' => true])->save();

        $this->assertSame([], $this->service()->forProfile($viewed));

        $excluded->forceFill(['exclude_from_discovery' => false])->save();

        $this->assertCount(1, $this->service()->forProfile($viewed));
    }

    /**
     * "At least one thing live to buy or join" is a hard gate — a card that lands
     * a supporter on an empty profile is the dead end this row exists to remove.
     */
    public function test_a_creator_with_nothing_live_is_not_recommended(): void
    {
        $viewed = $this->eligibleCreator();

        $empty = User::factory()->create(['role' => 1]);
        $empty->forceFill([
            'suspended_account' => 0,
            'profile_status_lock' => 2,
            'avatar' => (string) Str::uuid(),
            'avatar_approved' => 1,
        ])->save();

        $this->assertSame([], $this->service()->forProfile($viewed));

        // The only difference is one approved listing.
        WishItem::factory()->create(['user_id' => $empty->id, 'is_approved' => 1]);

        $this->assertCount(1, $this->service()->forProfile($viewed));
    }

    public function test_a_suspended_or_unapproved_creator_is_not_recommended(): void
    {
        $viewed = $this->eligibleCreator();

        $this->eligibleCreator(['suspended_account' => 1]);
        $this->eligibleCreator(['profile_status_lock' => 1]);
        $this->eligibleCreator(['avatar_approved' => 0]);

        $this->assertSame([], $this->service()->forProfile($viewed));
    }

    /**
     * 🚨 CREATOR EARNINGS ARE NEVER SHOWN PUBLICLY. The payload is a whitelist,
     * so this asserts the exact key set rather than the absence of a few names —
     * a new internal signal must not be able to reach a card by being added to
     * the pool.
     */
    public function test_a_card_carries_only_the_five_public_fields(): void
    {
        $viewed = $this->eligibleCreator();
        $this->eligibleCreator();

        $cards = $this->service()->forProfile($viewed);

        $this->assertCount(1, $cards);
        $this->assertSame(
            ['slot', 'name', 'username', 'avatar_url', 'cover_url', 'line'],
            array_keys($cards[0]),
        );
    }

    /**
     * The Similar slot is the one that has to read categories; everything else
     * would still work if this were a no-op, which is why it is asserted.
     */
    public function test_the_similar_slot_prefers_a_shared_category(): void
    {
        $viewed = $this->eligibleCreator();
        UserCategory::create(['user_id' => $viewed->id, 'category' => 'Photography']);

        $match = $this->eligibleCreator();
        UserCategory::create(['user_id' => $match->id, 'category' => 'Photography']);

        $other = $this->eligibleCreator();
        UserCategory::create(['user_id' => $other->id, 'category' => 'Cooking']);

        $cards = $this->service()->forProfile($viewed);

        $similar = collect($cards)->firstWhere('slot', CreatorRecommendationService::SLOT_SIMILAR);

        $this->assertNotNull($similar);
        $this->assertSame($match->username, $similar['username']);
    }

    /** A supporter profile is not a creator profile; the brief scopes the row to creators. */
    /**
     * ⚠️ RENAMED 12 Sep 2026 — it used to be `test_a_supporter_profile_gets_no_row`,
     * and that name is now a lie about the product: a supporter profile DOES get a
     * row, through `forSupporter()`. What this pins is narrower and still true —
     * `forProfile()` is the creator-profile entry point and answers nothing for a
     * fan, so the two paths cannot be reached through one another.
     */
    public function test_the_creator_entry_point_answers_nothing_for_a_supporter(): void
    {
        $this->eligibleCreator();
        $fan = User::factory()->create(['role' => 0]);

        $this->assertSame([], $this->service()->forProfile($fan));
    }

    // ── The supporter's own row ──────────────────────────────────────────
    //
    // 🚨 THE FAULT THESE PIN: `more_creators` was gated `role == 1` and
    // `ProfileRightRail` returns null for anything but a creator, so a fan's own
    // profile carried NO link onward to anywhere — a default cover, an empty
    // About tab and an empty Feed, with nothing on the page to click.

    /** A supporter, and a creator they have actually bought from. */
    private function supporter(array $force = []): User
    {
        return User::factory()->create(array_merge(['role' => 0], $force));
    }

    /**
     * ⚠️ `Queue::fake()` is not optional. The suite runs the queue SYNC and
     * `FinancialTransaction::created` dispatches the Growth Bonus evaluator, so an
     * unfaked ledger row runs a whole unrelated engine inside every fixture here.
     */
    private function bought(User $supporter, User $creator): void
    {
        Queue::fake();

        FinancialTransaction::create([
            'user_id' => $creator->id,
            'supporter_id' => $supporter->id,
            'source_type' => 'App\Models\ShopPayment',
            'source_id' => random_int(100000, 999999),
            'type' => 'income',
            'gross_amount' => 10.0,
            'platform_fee' => 0,
            'stripe_fee' => 0,
            'vat_amount' => 0,
            'net_amount' => 10.0,
            'currency' => 'GBP',
            'status' => 'completed',
            'description' => 'test sale',
            'transaction_date' => now(),
        ]);
    }

    public function test_a_supporter_profile_now_gets_a_row(): void
    {
        $this->eligibleCreator();
        $fan = $this->supporter();

        $cards = $this->service()->forSupporter($fan);

        $this->assertNotSame([], $cards, 'A supporter profile must carry a way off the page.');
    }

    /**
     * 🚨 "Find someone new" is the whole point. A row that recommends the person
     * whose page they bought from last week has discovered nobody — and the
     * exclusion has to happen before a slot is filled, not as a filter afterwards,
     * or a small pool quietly puts them back.
     */
    public function test_a_creator_the_supporter_already_backs_is_never_a_card(): void
    {
        $backed = $this->eligibleCreator();
        $stranger = $this->eligibleCreator();
        $fan = $this->supporter();
        $this->bought($fan, $backed);

        $usernames = array_column($this->service()->forSupporter($fan, true), 'username');

        $this->assertNotContains($backed->username, $usernames);
        $this->assertContains($stranger->username, $usernames);
    }

    /**
     * 🚨 THE PRIVACY GUARD. `for_you` is derived from who this supporter buys
     * from, and its LABEL says so out loud — collecting that onto a page a
     * stranger can read is the exposure `getGifterCreators()` refuses in its own
     * docblock.
     */
    public function test_a_visitor_never_sees_the_personalised_slot(): void
    {
        $backed = $this->eligibleCreator();
        UserCategory::create(['user_id' => $backed->id, 'category' => 'Art']);
        $this->eligibleCreator();
        $fan = $this->supporter();
        $this->bought($fan, $backed);

        $slots = array_column($this->service()->forSupporter($fan, false), 'slot');

        $this->assertNotContains(CreatorRecommendationService::SLOT_FOR_YOU, $slots);
    }

    public function test_the_owner_does_see_the_personalised_slot(): void
    {
        $backed = $this->eligibleCreator();
        UserCategory::create(['user_id' => $backed->id, 'category' => 'Art']);
        $this->eligibleCreator();
        $fan = $this->supporter();
        $this->bought($fan, $backed);

        $slots = array_column($this->service()->forSupporter($fan, true), 'slot');

        $this->assertContains(CreatorRecommendationService::SLOT_FOR_YOU, $slots);
    }

    /**
     * ⚠️ A card labelled "Near you" showing somebody on another continent is
     * worse than one card fewer, which is why `pickNearby()` returns null rather
     * than falling back the way `pickSimilar()` does.
     */
    public function test_the_nearby_slot_only_ever_names_someone_in_the_same_country(): void
    {
        $local = $this->eligibleCreator(['country' => 'GB']);
        $this->eligibleCreator(['country' => 'US']);
        $fan = $this->supporter(['country' => 'GB']);

        $cards = $this->service()->forSupporter($fan, true);
        $nearby = collect($cards)->firstWhere('slot', CreatorRecommendationService::SLOT_NEARBY);

        $this->assertNotNull($nearby);
        $this->assertSame($local->username, $nearby['username']);
    }

    public function test_a_supporter_with_no_country_simply_gets_no_nearby_card(): void
    {
        $this->eligibleCreator(['country' => 'GB']);
        $fan = $this->supporter(['country' => null]);

        $slots = array_column($this->service()->forSupporter($fan, true), 'slot');

        $this->assertNotContains(CreatorRecommendationService::SLOT_NEARBY, $slots);
    }

    /**
     * The same whitelist `test_a_card_carries_only_the_five_public_fields` pins
     * for the creator row. `country` and every signal behind the ordering are
     * INTERNAL — `card()` copies six keys by name and must never spread the pool.
     */
    public function test_a_supporter_card_leaks_no_internal_signal(): void
    {
        $this->eligibleCreator(['country' => 'GB']);
        $fan = $this->supporter(['country' => 'GB']);

        foreach ($this->service()->forSupporter($fan, true) as $card) {
            $this->assertSame(
                ['slot', 'name', 'username', 'avatar_url', 'cover_url', 'line'],
                array_keys($card),
            );
        }
    }

    public function test_the_supporter_entry_point_answers_nothing_for_a_creator(): void
    {
        $this->eligibleCreator();

        $this->assertSame([], $this->service()->forSupporter($this->eligibleCreator(), true));
    }
}
