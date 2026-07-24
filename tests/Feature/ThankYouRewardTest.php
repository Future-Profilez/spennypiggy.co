<?php

namespace Tests\Feature;

use App\Models\PiggyPot;
use App\Models\StripePaymentDetail;
use App\Models\User;
use App\Models\WishItem;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Inertia\Testing\AssertableInertia;
use Tests\TestCase;

/**
 * The thank-you page hands over the paid content, so the only questions that
 * matter are who sees it and when. The reward used to travel in the query
 * string, which answered neither.
 */
class ThankYouRewardTest extends TestCase
{
    use RefreshDatabase;

    private function creatorWithWish(): array
    {
        $creator = User::factory()->create(['username' => 'creator-'.uniqid()]);

        $wish = WishItem::create([
            'user_id' => $creator->id,
            'wishname' => 'Studio session',
            'price' => 20,
            'currency' => 'GBP',
            'subscription' => 0,
            'reward_title' => 'Behind the scenes cut',
            'reward_type' => 'message',
            'reward_body' => 'SECRET-CONTENT-BODY',
        ]);

        return [$creator, $wish];
    }

    private function url(User $creator, WishItem $wish, ?int $sourceId): string
    {
        return route('thank-you', array_filter([
            'username' => $creator->username,
            'type' => 'wish',
            // Cast: the model boot assigns a Ramsey UUID object, and
            // http_build_query would serialise the object rather than its value.
            'item_id' => (string) $wish->uuid,
            'source' => 'stripe_payment_details',
            'source_id' => $sourceId,
        ]));
    }

    public function test_the_buyer_sees_the_reward_content_once_the_payment_is_paid(): void
    {
        [$creator, $wish] = $this->creatorWithWish();
        $buyer = User::factory()->create();

        $payment = StripePaymentDetail::create([
            'user_id' => $buyer->id,
            'payment_status' => 'paid',
        ]);

        $response = $this->actingAs($buyer)->get($this->url($creator, $wish, $payment->id));

        $response->assertOk();
        $response->assertInertia(fn (AssertableInertia $page) => $page
            ->where('reward_locked', false)
            ->where('reward.text', 'SECRET-CONTENT-BODY'));
    }

    public function test_a_stranger_never_receives_the_content_even_with_a_valid_row_id(): void
    {
        [$creator, $wish] = $this->creatorWithWish();
        $buyer = User::factory()->create();
        $stranger = User::factory()->create();

        $payment = StripePaymentDetail::create([
            'user_id' => $buyer->id,
            'payment_status' => 'paid',
        ]);

        // Row ids are sequential and guessable — entitlement is decided by the
        // buyer column on the payment row, never by knowing the id.
        $response = $this->actingAs($stranger)->get($this->url($creator, $wish, $payment->id));

        $response->assertOk();
        $response->assertInertia(fn (AssertableInertia $page) => $page
            ->where('reward_locked', true)
            ->where('reward.text', null)
            // The headline still describes what was bought.
            ->where('reward.title', 'Behind the scenes cut'));
    }

    public function test_bank_payments_still_settling_show_the_headline_but_withhold_the_content(): void
    {
        [$creator, $wish] = $this->creatorWithWish();
        $buyer = User::factory()->create();

        // SEPA and ACH clear a day or two later; content must never be handed
        // over on money that has not arrived.
        $payment = StripePaymentDetail::create([
            'user_id' => $buyer->id,
            'payment_status' => 'processing',
        ]);

        $response = $this->actingAs($buyer)->get($this->url($creator, $wish, $payment->id));

        $response->assertOk();
        $response->assertInertia(fn (AssertableInertia $page) => $page
            ->where('reward_locked', true)
            ->where('awaiting_settlement', true)
            ->where('reward.text', null)
            ->where('reward.title', 'Behind the scenes cut'));
    }

    public function test_a_tampered_source_table_is_ignored(): void
    {
        [$creator, $wish] = $this->creatorWithWish();
        $buyer = User::factory()->create();

        $response = $this->actingAs($buyer)->get(route('thank-you', [
            'username' => $creator->username,
            'type' => 'wish',
            'item_id' => (string) $wish->uuid,
            'source' => 'users',
            'source_id' => $buyer->id,
        ]));

        $response->assertOk();
        $response->assertInertia(fn (AssertableInertia $page) => $page
            ->where('reward_locked', true)
            ->where('reward.text', null));
    }

    public function test_the_item_is_resolved_from_the_payment_row_not_the_url(): void
    {
        // Piggy Pot's redirect passes no item_id at all, and other handlers pass
        // a numeric id where this one passes a uuid. Trusting the URL meant the
        // reward silently failed to render on most flows.
        $creator = User::factory()->create();
        $buyer = User::factory()->create();

        $pot = PiggyPot::create([
            'user_id' => $creator->id,
            'title' => 'Studio pot',
            'target_amount' => 100,
            'currency' => 'GBP',
            'reward_title' => 'Rehearsal footage',
            'reward_type' => 'message',
            'reward_body' => 'POT-SECRET-BODY',
            'status' => 'active',
        ]);

        $contributionId = DB::table('piggy_pot_contributions')->insertGetId([
            'uuid' => (string) Str::uuid(),
            'piggy_pot_id' => $pot->id,
            'creator_id' => $creator->id,
            'user_id' => $buyer->id,
            'amount' => 10,
            'currency' => 'GBP',
            'status' => 'paid',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $response = $this->actingAs($buyer)->get(route('thank-you', [
            'username' => $creator->username,
            'type' => 'piggy_pot',
            'source' => 'piggy_pot_contributions',
            'source_id' => $contributionId,
        ]));

        $response->assertOk();
        $response->assertInertia(fn (AssertableInertia $page) => $page
            ->where('reward_locked', false)
            ->where('reward.title', 'Rehearsal footage')
            ->where('reward.text', 'POT-SECRET-BODY'));
    }

    public function test_a_payment_row_never_surfaces_someone_elses_item(): void
    {
        // The item comes from the payment row's own foreign key, so an item_id
        // pointing at another creator's listing cannot override it.
        $creator = User::factory()->create();
        $buyer = User::factory()->create();
        [$otherCreator, $otherWish] = $this->creatorWithWish();

        $pot = PiggyPot::create([
            'user_id' => $creator->id,
            'title' => 'Studio pot',
            'target_amount' => 100,
            'currency' => 'GBP',
            'reward_title' => 'Rehearsal footage',
            'status' => 'active',
        ]);

        $contributionId = DB::table('piggy_pot_contributions')->insertGetId([
            'uuid' => (string) Str::uuid(),
            'piggy_pot_id' => $pot->id,
            'creator_id' => $creator->id,
            'user_id' => $buyer->id,
            'amount' => 10,
            'currency' => 'GBP',
            'status' => 'paid',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $response = $this->actingAs($buyer)->get(route('thank-you', [
            'username' => $creator->username,
            'type' => 'piggy_pot',
            'item_id' => (string) $otherWish->uuid,
            'source' => 'piggy_pot_contributions',
            'source_id' => $contributionId,
        ]));

        $response->assertOk();
        $response->assertInertia(fn (AssertableInertia $page) => $page
            ->where('reward.title', 'Rehearsal footage'));
    }
}
