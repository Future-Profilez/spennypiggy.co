<?php

namespace Tests\Feature;

use App\Models\Membership;
use App\Models\MembershipPayment;
use App\Models\User;
use App\Services\MembershipUpsellService;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;
use Tests\TestCase;

/**
 * Who gets offered a membership after buying something one-off, and who is left alone.
 *
 * Every "stay quiet" case matters more than the "show it" case: an offer shown to the wrong
 * person is what teaches buyers to ignore every future prompt.
 */
class MembershipUpsellTest extends TestCase
{
    use RefreshDatabase;

    private MembershipUpsellService $upsell;

    protected function setUp(): void
    {
        parent::setUp();

        // Pre-existing schema drift, same class as the `shops` one tracked in TASKS.
        Schema::table('memberships', function (Blueprint $table) {
            foreach (['level', 'currency'] as $c) {
                if (! Schema::hasColumn('memberships', $c)) {
                    $table->string($c)->nullable();
                }
            }
            if (! Schema::hasColumn('memberships', 'price')) {
                $table->double('price')->nullable();
            }
        });

        $this->upsell = app(MembershipUpsellService::class);
    }

    private function creator(): User
    {
        return User::factory()->create(['role' => 1, 'suspended_account' => 0]);
    }

    private function membership(User $creator, array $overrides = []): Membership
    {
        $m = new Membership;

        foreach (array_merge([
            'uuid' => (string) Str::uuid(),
            'user_id' => $creator->id,
            'name' => 'Bronze membership',
            'level' => 'bronze',
            'price' => 10,
            'currency' => 'GBP',
            'approved' => 1,
        ], $overrides) as $k => $v) {
            $m->{$k} = $v;
        }

        $m->save();

        return $m;
    }

    public function test_a_creator_with_a_published_membership_gets_an_offer(): void
    {
        $creator = $this->creator();
        $this->membership($creator);

        $offer = $this->upsell->for($creator);

        $this->assertNotNull($offer);
        $this->assertSame('bronze', $offer['level']);
        $this->assertStringContainsString('membership/checkout', $offer['checkout_url']);
    }

    public function test_a_creator_with_no_membership_gets_nothing(): void
    {
        $this->assertNull($this->upsell->for($this->creator()));
    }

    /** Memberships are created unapproved; advertising one sends the buyer to a dead page. */
    public function test_an_unapproved_membership_is_never_offered(): void
    {
        $creator = $this->creator();
        $this->membership($creator, ['approved' => 0]);

        $this->assertNull($this->upsell->for($creator));
    }

    public function test_a_suspended_membership_is_never_offered(): void
    {
        $creator = $this->creator();
        $this->membership($creator, ['is_suspended' => 1]);

        $this->assertNull($this->upsell->for($creator));
    }

    /**
     * The cheapest tier, deliberately — this is a first step for someone who has bought once,
     * not a pitch for the top tier.
     */
    public function test_the_cheapest_tier_is_the_one_offered(): void
    {
        $creator = $this->creator();
        $this->membership($creator, ['level' => 'gold', 'price' => 50]);
        $this->membership($creator, ['level' => 'bronze', 'price' => 5]);
        $this->membership($creator, ['level' => 'silver', 'price' => 20]);

        $this->assertSame('bronze', $this->upsell->for($creator)['level']);
    }

    /** ⚠️ Never sell someone what they already own. */
    public function test_an_existing_member_is_left_alone(): void
    {
        $creator = $this->creator();
        $membership = $this->membership($creator);
        $buyer = User::factory()->create(['role' => 0]);

        MembershipPayment::create([
            'uuid' => (string) Str::uuid(),
            'membership_id' => $membership->id,
            'user_id' => $buyer->id,
            'status' => 'paid',
            'recurring_for' => 'continue',
            'amount' => 10,
        ]);

        $this->assertNull($this->upsell->for($creator, $buyer));

        // Somebody else's subscription must not silence the offer for this buyer.
        $other = User::factory()->create(['role' => 0]);
        $this->assertNotNull($this->upsell->for($creator, $other));
    }

    /** A lapsed membership is not a current one — they are a candidate again. */
    public function test_an_ended_membership_does_not_silence_the_offer(): void
    {
        $creator = $this->creator();
        $membership = $this->membership($creator);
        $buyer = User::factory()->create(['role' => 0]);

        MembershipPayment::create([
            'uuid' => (string) Str::uuid(),
            'membership_id' => $membership->id,
            'user_id' => $buyer->id,
            'status' => 'paid',
            'recurring_for' => 'continue',
            'amount' => 10,
            'end' => now()->subDay(),
        ]);

        $this->assertNotNull($this->upsell->for($creator, $buyer));
    }

    /** A guest has no identity to check against, and a public listing is safe to show. */
    public function test_a_guest_still_sees_the_offer(): void
    {
        $creator = $this->creator();
        $this->membership($creator);

        $this->assertNotNull($this->upsell->for($creator, null));
    }

    /**
     * ⚠️ This runs on the thank-you page and inside a receipt. It must never be the reason a
     * buyer cannot see confirmation that their money arrived.
     */
    public function test_a_missing_creator_is_silent_rather_than_fatal(): void
    {
        $this->assertNull($this->upsell->for(null));
    }

    public function test_a_free_tier_is_not_offered_as_a_paid_membership(): void
    {
        $creator = $this->creator();
        $this->membership($creator, ['price' => 0]);

        $this->assertNull($this->upsell->for($creator));
    }

    /** ⚠️ Asking again after a refusal is how a prompt stops being read at all. */
    public function test_a_refusal_silences_the_offer_for_that_creator_only(): void
    {
        $creator = $this->creator();
        $this->membership($creator);

        $other = $this->creator();
        $this->membership($other);

        $buyer = User::factory()->create(['role' => 0]);

        $this->assertNotNull($this->upsell->for($creator, $buyer));

        $this->upsell->dismiss($creator, $buyer);

        $this->assertNull($this->upsell->for($creator, $buyer), 'refused creator must go quiet');
        $this->assertNotNull(
            $this->upsell->for($other, $buyer),
            'refusing one creator says nothing about another'
        );
    }

    /** A guest is identified by email, so their refusal has to be recordable that way. */
    public function test_a_refusal_recorded_by_email_is_honoured(): void
    {
        $creator = $this->creator();
        $this->membership($creator);

        $this->assertNotNull($this->upsell->for($creator, null, 'guest@example.com'));

        $this->upsell->dismiss($creator, null, 'guest@example.com');

        $this->assertNull($this->upsell->for($creator, null, 'guest@example.com'));
        $this->assertNotNull($this->upsell->for($creator, null, 'someone-else@example.com'));
    }

    public function test_dismissing_twice_is_not_an_error(): void
    {
        $creator = $this->creator();
        $this->membership($creator);
        $buyer = User::factory()->create(['role' => 0]);

        $this->upsell->dismiss($creator, $buyer);
        $this->upsell->dismiss($creator, $buyer);

        $this->assertDatabaseCount('membership_offer_dismissals', 1);
    }

    /** Identity comes from the session; an unauthenticated caller must change nothing. */
    public function test_the_dismiss_endpoint_ignores_a_guest(): void
    {
        $creator = $this->creator();

        $this->postJson(route('membership-offer.dismiss'), [
            'creator_username' => $creator->username,
        ])->assertOk();

        $this->assertDatabaseCount('membership_offer_dismissals', 0);
    }

    public function test_the_dismiss_endpoint_records_for_the_signed_in_buyer(): void
    {
        $creator = $this->creator();
        $buyer = User::factory()->create(['role' => 0]);

        $this->actingAs($buyer)
            ->postJson(route('membership-offer.dismiss'), ['creator_username' => $creator->username])
            ->assertOk();

        $this->assertDatabaseHas('membership_offer_dismissals', [
            'user_id' => $buyer->id,
            'creator_id' => $creator->id,
        ]);
    }

    /**
     * ⚠️ "Not now" is not "never". A creator may have published a great deal more three months
     * later, and a permanent silence would make the first no the last word.
     */
    public function test_a_refusal_expires_so_the_offer_can_return(): void
    {
        $creator = $this->creator();
        $this->membership($creator);
        $buyer = User::factory()->create(['role' => 0]);

        $this->upsell->dismiss($creator, $buyer);
        $this->assertNull($this->upsell->for($creator, $buyer));

        // One day short of the window: still silent.
        $this->travel(MembershipUpsellService::DISMISSAL_DAYS - 1)->days();
        $this->assertNull($this->upsell->for($creator, $buyer));

        // Past it: they are a candidate again.
        $this->travel(2)->days();
        $this->assertNotNull($this->upsell->for($creator, $buyer));
    }
}
