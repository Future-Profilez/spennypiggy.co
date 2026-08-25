<?php

namespace Tests\Feature;

use App\Models\SavedItem;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * Save-for-later shipped complete — model, controller, routes, button, and the
 * "Saved" tab in `gifter/PurchasesHub` — and `saved_items` sat at 0 rows.
 *
 * The reason was not in any of them. `SaveButton` read its state from
 * `initialSaved={item.is_saved}`, and `is_saved` was set NOWHERE in the backend —
 * zero occurrences across `app/`. So a supporter saved an item, the row was
 * written, and the heart was empty again on the next render. It looked broken, so
 * nobody used it twice.
 *
 * The frontend now hydrates from `mine()` instead, which was written for exactly
 * that ("lets browse surfaces mark their save buttons as active in one request")
 * and had never been called. **These tests pin the response SHAPE**, because the
 * failure mode is silent: change the grouping and every heart goes dark again with
 * nothing erroring anywhere.
 */
class SavedItemsEndpointTest extends TestCase
{
    use RefreshDatabase;

    public function test_toggle_saves_then_unsaves(): void
    {
        $user = User::factory()->create();

        $this->actingAs($user)
            ->postJson('/saved/toggle', ['product_type' => 'wish', 'item_id' => 42])
            ->assertOk()
            ->assertJson(['saved' => true]);

        $this->assertDatabaseHas('saved_items', [
            'user_id' => $user->id,
            'product_type' => 'wish',
            'item_id' => 42,
        ]);

        $this->actingAs($user)
            ->postJson('/saved/toggle', ['product_type' => 'wish', 'item_id' => 42])
            ->assertOk()
            ->assertJson(['saved' => false]);

        $this->assertDatabaseMissing('saved_items', [
            'user_id' => $user->id,
            'product_type' => 'wish',
            'item_id' => 42,
        ]);
    }

    /**
     * The contract the buttons hydrate from: ids grouped BY PRODUCT TYPE. A flat
     * list, or a list of full rows, would leave every heart unlit.
     */
    public function test_mine_returns_ids_grouped_by_product_type(): void
    {
        $user = User::factory()->create();

        SavedItem::create(['user_id' => $user->id, 'product_type' => 'wish', 'item_id' => 1]);
        SavedItem::create(['user_id' => $user->id, 'product_type' => 'wish', 'item_id' => 2]);
        SavedItem::create(['user_id' => $user->id, 'product_type' => 'shop', 'item_id' => 7]);

        $saved = $this->actingAs($user)->getJson('/saved/mine')
            ->assertOk()
            ->json('saved');

        $this->assertEqualsCanonicalizing([1, 2], $saved['wish']);
        $this->assertSame([7], $saved['shop']);
        $this->assertArrayNotHasKey('task', $saved, 'A type with nothing saved must be absent, not empty.');
    }

    /** One supporter's saves must never appear in another's map. */
    public function test_mine_is_scoped_to_the_caller(): void
    {
        $mine = User::factory()->create();
        $theirs = User::factory()->create();

        SavedItem::create(['user_id' => $theirs->id, 'product_type' => 'wish', 'item_id' => 99]);

        $this->assertSame([], $this->actingAs($mine)->getJson('/saved/mine')->assertOk()->json('saved'));
    }

    /**
     * Both routes sit inside the auth group. The button renders nothing for a
     * guest precisely because of this — a signed-out click was a 401 and a heart
     * that flicked on and straight back off.
     */
    public function test_a_guest_cannot_reach_either_route(): void
    {
        $this->postJson('/saved/toggle', ['product_type' => 'wish', 'item_id' => 1])->assertUnauthorized();
        $this->getJson('/saved/mine')->assertUnauthorized();
    }

    /** Every type the button can be mounted with must be accepted. */
    public function test_all_six_product_types_are_accepted(): void
    {
        $user = User::factory()->create();

        foreach (SavedItem::TYPES as $i => $type) {
            $this->actingAs($user)
                ->postJson('/saved/toggle', ['product_type' => $type, 'item_id' => $i + 1])
                ->assertOk()
                ->assertJson(['saved' => true]);
        }

        $this->assertCount(count(SavedItem::TYPES), SavedItem::where('user_id', $user->id)->get());
    }

    public function test_an_unknown_product_type_is_rejected(): void
    {
        $this->actingAs(User::factory()->create())
            ->postJson('/saved/toggle', ['product_type' => 'creator', 'item_id' => 1])
            ->assertStatus(422);
    }
}
