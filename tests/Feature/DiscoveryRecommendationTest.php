<?php

namespace Tests\Feature;

use App\Models\User;
use App\Models\UserCategory;
use App\Models\WishItem;
use App\Services\Discovery\CreatorRecommendationService;
use App\Support\DiscoverySources;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Cache;
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
    public function test_a_supporter_profile_gets_no_row(): void
    {
        $this->eligibleCreator();
        $fan = User::factory()->create(['role' => 0]);

        $this->assertSame([], $this->service()->forProfile($fan));
    }
}
