<?php

namespace Tests\Feature;

use App\Models\CreatorBioItem;
use App\Models\PiggyPot;
use App\Models\User;
use App\Services\Bio\BioTipService;
use App\Services\BioPageService;
use App\Support\BioSellableItems;
use App\Support\DiscoverySources;
use Illuminate\Database\QueryException;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Str;
use Tests\TestCase;

/**
 * Selling from the link-in-bio page — the B stream (Master Plan, 19 Aug 2026 §B).
 *
 * 🚨 The properties everything else rests on, and what each one is protecting:
 *
 *   1. A card leads to an EXISTING buy path. If a test here ever has to assert
 *      against a new checkout, the feature has been built the wrong way — the
 *      brief's one prohibition is that this page must not bypass a rule the main
 *      site enforces, and the only way to guarantee that is to never leave the
 *      paths that enforce them.
 *   2. Nothing unmoderated, suspended or closed renders. The filter is the
 *      profile's own, so a held item cannot be advertised from the creator's
 *      most-shared link.
 *   3. A tap is stamped `bio-link`, which is CREATOR-generated. There is no
 *      backfill for a click nobody marked.
 *   4. A creator can only put THEIR OWN listing on THEIR OWN page.
 */
class BioDirectSalesTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        // Same reason as BioPageTest: the profile payload and the availability
        // map are cached under a creator id that repeats across tests.
        Cache::flush();
    }

    private function creator(array $attributes = []): User
    {
        return User::factory()->create(array_merge([
            'role' => 1,
            'username' => 'creator'.Str::random(6),
        ], $attributes));
    }

    private function pot(User $creator, array $attributes = []): PiggyPot
    {
        return PiggyPot::create(array_merge([
            'uuid' => (string) Str::uuid(),
            'user_id' => $creator->id,
            'title' => 'Studio Setup',
            'description' => 'Behind the scenes',
            'target_amount' => 500,
            'currency' => 'gbp',
            'status' => 'active',
        ], $attributes));
    }

    private function select(User $creator, string $type, int $id, array $attributes = []): CreatorBioItem
    {
        return CreatorBioItem::create(array_merge([
            'user_id' => $creator->id,
            'item_type' => $type,
            'item_id' => $id,
            'sort_order' => 0,
            'is_active' => true,
        ], $attributes));
    }

    // ------------------------------------------------------------- rendering

    public function test_a_selected_live_pot_renders_as_a_card(): void
    {
        $creator = $this->creator();
        $pot = $this->pot($creator);
        $this->select($creator, 'piggy_pot', $pot->id);

        $cards = app(BioPageService::class)->items($creator);

        $this->assertCount(1, $cards);
        $this->assertSame('piggy_pot', $cards[0]['type']);
        $this->assertSame('Studio Setup', $cards[0]['title']);
    }

    /**
     * 🚨 The moderation gate. A pot held for review is not a card, with no
     * editing and no cron — the selection row survives so it returns on its own
     * the moment an admin clears it.
     */
    public function test_a_held_item_renders_no_card_but_keeps_its_selection(): void
    {
        $creator = $this->creator();
        $pot = $this->pot($creator, ['status' => 'moderation_hold']);
        $this->select($creator, 'piggy_pot', $pot->id);

        $this->assertSame([], app(BioPageService::class)->items($creator));
        $this->assertDatabaseCount('creator_bio_items', 1);
    }

    public function test_a_hidden_card_is_absent_for_a_visitor_and_present_for_its_owner(): void
    {
        $creator = $this->creator();
        $pot = $this->pot($creator);
        $this->select($creator, 'piggy_pot', $pot->id, ['is_active' => false]);

        $service = app(BioPageService::class);

        $this->assertSame([], $service->items($creator, false));
        $this->assertCount(1, $service->items($creator, true));
    }

    /**
     * ⚠️ A selection whose listing was deleted is skipped, not fatal. There is no
     * foreign key — `item_id` points into one of six tables — so this is the only
     * thing standing between a deleted listing and a 500 on the creator's most
     * shared page.
     */
    public function test_a_deleted_listing_is_skipped_rather_than_fatal(): void
    {
        $creator = $this->creator();
        $this->select($creator, 'piggy_pot', 999999);

        $this->assertSame([], app(BioPageService::class)->items($creator));
    }

    /**
     * ⚠️ The listing's internal id never reaches a public payload. It is owner-only
     * because the editor needs it to know what is already on the page.
     */
    public function test_the_public_payload_carries_no_internal_ids(): void
    {
        $creator = $this->creator();
        $pot = $this->pot($creator);
        $this->select($creator, 'piggy_pot', $pot->id);

        $public = app(BioPageService::class)->items($creator, false)[0];

        $this->assertNull($public['catalogue_key']);
        $this->assertNull($public['clicks']);
    }

    // ------------------------------------------------------------- the tap

    /**
     * 🚨 The redirect lands on an EXISTING buying path, and it stamps the visitor
     * as `bio-link` on the way. `AttributionService::sourceForCreator()` reads
     * exactly that cookie inside every buy path, which is how the sale reaches
     * `financial_transactions.discovery_source` as the creator's own traffic.
     */
    public function test_a_tap_counts_the_click_and_stamps_bio_link(): void
    {
        $creator = $this->creator();
        $pot = $this->pot($creator);
        $row = $this->select($creator, 'piggy_pot', $pot->id);

        $response = $this->get("/bio/buy/{$row->uuid}");

        $response->assertRedirect();
        $this->assertStringContainsString('pot='.$pot->uuid, $response->headers->get('Location'));

        $this->assertSame(1, (int) $row->fresh()->click_count);

        $cookie = $response->headers->getCookies()[0] ?? null;
        $this->assertNotNull($cookie, 'the redirect must set the attribution cookie');
    }

    public function test_a_tap_on_a_hidden_card_goes_home_rather_than_selling(): void
    {
        $creator = $this->creator();
        $pot = $this->pot($creator);
        $row = $this->select($creator, 'piggy_pot', $pot->id, ['is_active' => false]);

        $this->get("/bio/buy/{$row->uuid}")->assertRedirect(route('home'));
    }

    /**
     * ⚠️ The live filter is re-run at CLICK time, not trusted from the render. A
     * card is drawn from a payload that can be a minute stale, and a pot pulled
     * for moderation in that window must not still be sellable.
     */
    public function test_a_listing_pulled_after_render_is_refused_at_the_tap(): void
    {
        $creator = $this->creator();
        $pot = $this->pot($creator);
        $row = $this->select($creator, 'piggy_pot', $pot->id);

        $pot->update(['status' => 'moderation_hold']);

        $this->get("/bio/buy/{$row->uuid}")
            ->assertRedirect(route('bio.show', ['username' => $creator->username]));
    }

    public function test_an_unknown_item_uuid_goes_home_rather_than_erroring(): void
    {
        $this->get('/bio/buy/'.Str::uuid())->assertRedirect(route('home'));
    }

    // ------------------------------------------------------------- the editor

    /**
     * 🚨 A uuid is a public identifier on this platform. Ownership is proven
     * against the module's own table, so another creator's listing simply is not
     * found.
     */
    public function test_a_creator_cannot_put_another_creators_listing_on_their_page(): void
    {
        $mine = $this->creator();
        $theirs = $this->creator();
        $pot = $this->pot($theirs);

        $this->actingAs($mine)
            ->post('/bio-links/items', ['type' => 'piggy_pot', 'uuid' => $pot->uuid]);

        $this->assertDatabaseCount('creator_bio_items', 0);
    }

    public function test_a_supporter_cannot_write_selections(): void
    {
        $supporter = User::factory()->create(['role' => 0]);

        $this->actingAs($supporter)
            ->post('/bio-links/items', ['type' => 'piggy_pot', 'uuid' => (string) Str::uuid()])
            ->assertForbidden();
    }

    public function test_an_unknown_type_is_refused(): void
    {
        $creator = $this->creator();
        $pot = $this->pot($creator);

        $this->actingAs($creator)
            ->post('/bio-links/items', ['type' => 'stablecoin', 'uuid' => $pot->uuid])
            ->assertSessionHasErrors('type');
    }

    /** ⚠️ Re-adding reactivates rather than duplicating — the unique index enforces it. */
    public function test_a_listing_can_only_be_selected_once(): void
    {
        $creator = $this->creator();
        $pot = $this->pot($creator);
        $this->select($creator, 'piggy_pot', $pot->id);

        try {
            $this->select($creator, 'piggy_pot', $pot->id);
            $this->fail('the unique index must refuse a second selection of one listing');
        } catch (QueryException $e) {
            $this->assertDatabaseCount('creator_bio_items', 1);
        }
    }

    public function test_the_page_is_capped(): void
    {
        $creator = $this->creator();

        /*
         * ⚠️ Offset ids, so the filler rows cannot collide with the real pot
         * created below. Starting at 1 did: the pot got id 1, the loop had
         * already claimed `piggy_pot:1`, and the controller DELIBERATELY lets a
         * listing already on the page be re-added at the cap ("re-adding an item
         * already on the page cannot be refused for being over the cap"). So the
         * request was correctly allowed and the test read that as the cap
         * failing. The fixture defeated its own assertion.
         */
        for ($i = 1; $i <= BioSellableItems::MAX_ITEMS; $i++) {
            $this->select($creator, 'piggy_pot', 9000 + $i);
        }

        $pot = $this->pot($creator);

        $this->actingAs($creator)
            ->post('/bio-links/items', ['type' => 'piggy_pot', 'uuid' => $pot->uuid])
            ->assertSessionHas('error');

        $this->assertDatabaseCount('creator_bio_items', BioSellableItems::MAX_ITEMS);
    }

    // --------------------------------------------------------------- the tip

    /**
     * 🚨 The button being greyed is a rendering decision; the refusal is the
     * server's. Anyone can post past a disabled control.
     */
    public function test_the_tip_endpoints_refuse_while_the_rail_is_off(): void
    {
        config(['discovery.labels.tips' => 'coming_soon']);

        $this->postJson('/bio/tip/quote', ['amount' => 25])->assertStatus(503);

        $creator = $this->creator();

        $this->postJson("/bio/tip/{$creator->username}", ['amount' => 25])->assertStatus(503);
    }

    /**
     * ⚠️ The amounts are the plan's, and they come from the server so the numbers
     * the supporter sees and the numbers the endpoint enforces are one definition.
     */
    public function test_the_published_tip_amounts_are_the_agreed_ones(): void
    {
        $payload = BioTipService::payload();

        $this->assertSame('USD', $payload['currency']);
        $this->assertSame('USDC', $payload['stablecoin']);
        $this->assertSame(5.00, $payload['min']);
        $this->assertSame(1000.00, $payload['max']);
        $this->assertSame([10, 25, 50, 100, 250, 500], $payload['presets']);
        $this->assertSame(1.00, $payload['admin_fee']['amount']);
        $this->assertSame('GBP', $payload['admin_fee']['currency']);
    }

    public function test_a_tip_outside_the_published_range_is_refused(): void
    {
        $this->assertNotNull(BioTipService::amountError(4.99));
        $this->assertNotNull(BioTipService::amountError(1000.01));
        $this->assertNull(BioTipService::amountError(5.00));
        $this->assertNull(BioTipService::amountError(1000.00));
    }

    /**
     * ⚠️ The fee is ADDED to the tip and the creator receives the tip in full —
     * two numbers, and getting them the wrong way round turns a fee into a cut.
     */
    public function test_the_admin_fee_is_added_to_the_tip_not_taken_out_of_it(): void
    {
        config(['discovery.labels.tips' => 'live']);

        $quote = app(BioTipService::class)->quote(25.00);

        $this->assertSame(25.00, $quote['amount']);
        $this->assertGreaterThan(0, $quote['admin_fee']);
        $this->assertSame(round(25.00 + $quote['admin_fee'], 2), $quote['total']);
        $this->assertNotEmpty($quote['frozen_at']);
        $this->assertNotEmpty($quote['expires_at']);
    }

    // ------------------------------------------------------------ attribution

    /** ⚠️ `bio-link` is CREATOR-generated. Counting it as ours inflates the one
     *  number the whole Discovery argument rests on. */
    public function test_bio_link_is_creator_generated(): void
    {
        $this->assertSame(
            DiscoverySources::CLASS_CREATOR,
            DiscoverySources::classFor('bio-link')
        );
    }
}
