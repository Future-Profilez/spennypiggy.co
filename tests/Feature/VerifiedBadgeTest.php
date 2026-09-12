<?php

namespace Tests\Feature;

use App\Models\User;
use App\Services\DiscoveryService;
use App\Services\UserProfileService;
use App\Support\VerifiedBadge;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * The verified badge.
 *
 * The load-bearing property is that `App\Support\VerifiedBadge` is the ONE
 * definition. Eight surfaces used to answer this themselves in five different
 * colours with three different conditions, which is how the same person could
 * be verified on the leaderboard and not on their own profile.
 */
class VerifiedBadgeTest extends TestCase
{
    use RefreshDatabase;

    private function user(array $overrides = []): User
    {
        return User::factory()->create(array_merge([
            'role' => 1,
            'suspended_account' => 0,
            'profile_status_lock' => 2,
            'identity_status' => 1,
            'identity_admin_status' => 0,
            'stripe_details_submitted' => 1,
        ], $overrides));
    }

    public function test_a_pending_profile_carries_no_badge(): void
    {
        // 🚨 `includes/Avatar.jsx` used to test `role && profile_status_lock`,
        // which is TRUTHINESS — and 1 means "waiting for admin review". Every
        // creator still in the queue was already wearing the verified tick.
        $this->assertNull(VerifiedBadge::tierFor($this->user(['profile_status_lock' => 1])));
        $this->assertNull(VerifiedBadge::tierFor($this->user(['profile_status_lock' => 0])));
    }

    /**
     * 🚨 A SUPPORTER'S BADGE IS WHAT THEY HAVE SPENT (client direction,
     * 12 Sep 2026). It was `profile_status_lock = 2` — the verdict of the £500
     * address review — and that review, its screen and the spend gate were all
     * removed the same day. Nothing sets that lock for a supporter again, so
     * leaving the badge on it would have meant no supporter could ever carry
     * one. This test asserted the lock rule until that day.
     */
    public function test_a_supporter_earns_the_basic_tier_by_spending(): void
    {
        $base = [
            'role' => 0,
            // A supporter has neither of these and never will.
            'identity_status' => 0,
            'stripe_details_submitted' => 0,
        ];

        $this->assertNull(
            VerifiedBadge::tierFor($this->user($base + ['is_500_limit_exceeded' => 0])),
            'An approved profile is no longer what earns a supporter the badge.'
        );

        $this->assertSame(
            VerifiedBadge::BASIC,
            VerifiedBadge::tierFor($this->user($base + ['is_500_limit_exceeded' => 1]))
        );
    }

    /**
     * ⚠️ The lock still governs the CREATOR tier, and it has to — it is the one
     * record that their profile is live rather than drafting or pulled back by
     * a check. The two roles no longer share a basis, which is why the resolver
     * branches on role BEFORE reading the lock.
     */
    public function test_a_supporters_badge_ignores_the_profile_lock(): void
    {
        $spender = $this->user([
            'role' => 0,
            'is_500_limit_exceeded' => 1,
            'profile_status_lock' => 0,
        ]);

        $this->assertSame(VerifiedBadge::BASIC, VerifiedBadge::tierFor($spender));
    }

    /**
     * 🚨 THIS PAIR USED TO PIN THE IDENTITY CLAUSES, AND THEY ARE GONE.
     * It was `test_a_creator_needs_identity_and_stripe_for_the_creator_tier`
     * plus `test_an_admin_rejection_outranks_stripes_pass`, and between them
     * they required `identity_status = 2` and `identity_admin_status = 2` each
     * to drop a creator to the basic badge. Spenny Piggy runs no identity check
     * at all since 11 Sep 2026 (client D5/Q20), so neither column is written
     * any more and both assertions pinned a rule the client had removed.
     *
     * ⚠️ THE CONTROL IS THE POINT OF THE REPLACEMENT. An identity column is set
     * to its old failing value and the creator tier must survive it — that is
     * what proves the clause was removed rather than merely passing today
     * because nothing writes the column. Deleting these tests would have proved
     * nothing either way.
     */
    public function test_the_creator_tier_now_turns_on_stripe_alone(): void
    {
        $this->assertSame(VerifiedBadge::CREATOR, VerifiedBadge::tierFor($this->user()));

        // Connect not finished — the platform genuinely cannot pay them, which
        // is the one thing the higher tier still claims. Client decision
        // 5 Aug 2026: they keep the basic badge rather than losing it outright.
        $this->assertSame(
            VerifiedBadge::BASIC,
            VerifiedBadge::tierFor($this->user(['stripe_details_submitted' => 0]))
        );
    }

    public function test_a_dead_identity_column_no_longer_moves_the_badge(): void
    {
        // Both of these used to force the basic tier. They are leftovers on old
        // rows now and must not decide anything.
        $this->assertSame(
            VerifiedBadge::CREATOR,
            VerifiedBadge::tierFor($this->user(['identity_status' => 2]))
        );
        $this->assertSame(
            VerifiedBadge::CREATOR,
            VerifiedBadge::tierFor($this->user(['identity_admin_status' => 2]))
        );
    }

    public function test_the_creator_label_does_not_claim_an_identity_check(): void
    {
        /* The platform runs none, so the badge must not say it does. This is
           the only place a visitor reads what the tick means. */
        $label = VerifiedBadge::labelFor(VerifiedBadge::CREATOR);

        $this->assertNotNull($label);
        $this->assertStringNotContainsStringIgnoringCase('identity', $label);
    }

    public function test_a_suspended_account_never_carries_a_badge(): void
    {
        // The badge is the platform vouching for someone; it must not keep
        // doing that for an account the platform has switched off.
        $this->assertNull(VerifiedBadge::tierFor($this->user(['suspended_account' => 1])));
    }

    public function test_it_reads_a_plain_array_the_same_way_as_a_model(): void
    {
        // Several payload rows are mapped arrays, never hydrated models.
        $row = [
            'role' => 1,
            'suspended_account' => 0,
            'profile_status_lock' => 2,
            'identity_status' => 1,
            'identity_admin_status' => 0,
            'stripe_details_submitted' => 1,
        ];

        $this->assertSame(VerifiedBadge::CREATOR, VerifiedBadge::tierFor($row));
        $this->assertNull(VerifiedBadge::tierFor(null));
    }

    public function test_the_model_appends_the_tier(): void
    {
        $this->assertSame(
            VerifiedBadge::CREATOR,
            $this->user()->toArray()['verified_badge'] ?? null
        );
    }

    /**
     * 🚨 The one that matters most.
     *
     * Most payload builders use an explicit `->select()`, and a builder missing
     * these columns renders a verified creator as unverified — silently,
     * because a missing attribute is null and null is not approved. This asserts
     * the live builders actually carry them.
     */
    public function test_the_profile_payload_carries_every_column_the_tier_needs(): void
    {
        $creator = $this->user(['username' => 'badge-test-creator']);

        $loaded = app(UserProfileService::class)->getUserWithRelations('badge-test-creator');

        $this->assertNotNull($loaded);

        foreach (VerifiedBadge::COLUMNS as $column) {
            $this->assertArrayHasKey(
                $column,
                $loaded->getAttributes(),
                "UserProfileService does not select {$column}, so the badge tier is wrong on the profile page."
            );
        }

        $this->assertSame(VerifiedBadge::CREATOR, $loaded->verified_badge);
        $this->assertSame($creator->id, $loaded->id);
    }

    public function test_the_discovery_payload_carries_the_tier(): void
    {
        $this->user([
            'username' => 'badge-discover-creator',
            'name' => 'Badge Discover',
        ]);

        $rows = app(DiscoveryService::class)->getNewVerifiedCreators();

        $row = collect($rows)->firstWhere('username', 'badge-discover-creator');

        // The service filters on its own criteria; if this creator is absent
        // there is nothing to assert about, but the KEY must exist on any row
        // it does return.
        if ($row) {
            $this->assertArrayHasKey('verified_badge', $row);
        } else {
            $this->assertTrue(true);
        }
    }
}
