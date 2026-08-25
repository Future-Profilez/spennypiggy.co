<?php

namespace Tests\Feature;

use App\Models\ShippingProfile;
use App\Models\ShippingProfileZone;
use App\Models\Shop;
use App\Models\ShopShippingInfo;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Str;
use Tests\TestCase;

/**
 * Reusable shipping rates.
 *
 * The whole feature shipped and `shipping_profiles` sat at **0 rows**: two models, three
 * routes with ownership checks, and `ShopsController::shippingPrice()` already preferring
 * a profile's zones over the per-item `ShopShippingInfo` fallback. What stopped it was one
 * literal — `AddItem.jsx` sent `shipping_profile_id: null` on every save, so the id could
 * never leave the form and every physical item carried its own retyped copy of the same
 * two rates.
 *
 * These pin the contract `Components/shop/ShippingProfileField` depends on, and the two
 * behaviours that are silent when they go wrong: the zone key name, and what a deleted
 * profile does to the postage an item charges.
 */
class ShippingProfileTest extends TestCase
{
    use RefreshDatabase;

    private function creator(): User
    {
        return User::factory()->create(['role' => 1, 'country' => 'GB']);
    }

    private function physicalShop(User $creator, ?int $profileId = null): Shop
    {
        return Shop::create([
            'uuid' => (string) Str::uuid(),
            'user_id' => $creator->id,
            'type' => 'physical',
            'name' => 'Signed print',
            'description' => 'A3, numbered',
            'price' => 25.00,
            'currency' => 'gbp',
            'approved' => 1,
            'shipping_profile_id' => $profileId,
        ]);
    }

    private function profileWith(User $creator, array $zones, string $name = 'Small parcel'): ShippingProfile
    {
        $profile = ShippingProfile::create(['user_id' => $creator->id, 'name' => $name]);

        foreach ($zones as $country => $price) {
            ShippingProfileZone::create([
                'shipping_profile_id' => $profile->id,
                'country' => $country,
                'shipping_price' => $price,
            ]);
        }

        return $profile;
    }

    /** The shape the picker reads: profiles, each with its zones nested. */
    public function test_the_list_endpoint_returns_profiles_with_their_zones(): void
    {
        $creator = $this->creator();
        $this->profileWith($creator, ['GB' => 3.50, 'all' => 9.00]);

        $this->actingAs($creator)
            ->getJson(route('shop.shipping-profiles'))
            ->assertOk()
            ->assertJsonStructure([
                'status',
                'profiles' => [['id', 'name', 'zones' => [['id', 'country', 'shipping_price']]]],
            ]);
    }

    /**
     * 🚨 THE ZONE PRICE KEY IS `shipping_price`, NOT `price`.
     * The per-item payload `AddItem` builds uses `{country, price}`, and sending that
     * shape here fails validation with a message naming a field the creator never saw.
     */
    public function test_a_zone_price_must_be_sent_as_shipping_price(): void
    {
        $creator = $this->creator();

        $this->actingAs($creator)
            ->postJson(route('shop.shipping-profile.save'), [
                'name' => 'Small parcel',
                'zones' => [['country' => 'GB', 'price' => 3.50]],
            ])
            ->assertStatus(422);

        $this->actingAs($creator)
            ->postJson(route('shop.shipping-profile.save'), [
                'name' => 'Small parcel',
                'zones' => [['country' => 'GB', 'shipping_price' => 3.50]],
            ])
            ->assertOk()
            ->assertJson(['status' => true]);
    }

    public function test_saving_again_replaces_the_zones_rather_than_adding_to_them(): void
    {
        $creator = $this->creator();
        $profile = $this->profileWith($creator, ['GB' => 3.50, 'all' => 9.00]);

        $this->actingAs($creator)
            ->postJson(route('shop.shipping-profile.save'), [
                'id' => $profile->id,
                'name' => 'Small parcel',
                'zones' => [['country' => 'GB', 'shipping_price' => 4.00]],
            ])
            ->assertOk();

        $this->assertSame(1, ShippingProfileZone::where('shipping_profile_id', $profile->id)->count());
    }

    /** Another creator's id must be refused, never fall through to an insert. */
    public function test_a_profile_belonging_to_someone_else_cannot_be_written(): void
    {
        $theirs = $this->profileWith($this->creator(), ['GB' => 3.50]);

        $this->actingAs($this->creator())
            ->postJson(route('shop.shipping-profile.save'), [
                'id' => $theirs->id,
                'name' => 'Mine now',
                'zones' => [['country' => 'GB', 'shipping_price' => 1.00]],
            ])
            ->assertNotFound();

        $this->assertSame('Small parcel', $theirs->fresh()->name);
    }

    public function test_a_profile_belonging_to_someone_else_cannot_be_deleted(): void
    {
        $theirs = $this->profileWith($this->creator(), ['GB' => 3.50]);

        $this->actingAs($this->creator())
            ->deleteJson(route('shop.shipping-profile.delete', ['id' => $theirs->id]))
            ->assertNotFound();

        $this->assertDatabaseHas('shipping_profiles', ['id' => $theirs->id]);
    }

    /**
     * The reason the whole feature is worth reaching: a profile's zones win over the
     * per-item rows, so one saved rate prices every item that points at it.
     */
    public function test_a_profile_is_preferred_over_the_per_item_rows(): void
    {
        $creator = $this->creator();
        $profile = $this->profileWith($creator, ['GB' => 3.50, 'all' => 9.00]);
        $shop = $this->physicalShop($creator, $profile->id);

        ShopShippingInfo::create([
            'uuid' => (string) Str::uuid(),
            'shop_id' => $shop->id,
            'country' => 'GB',
            'shipping_price' => 99.00,
        ]);

        $this->getJson(route('shop.shipping-price', ['shop_id' => $shop->uuid]).'?country=GB')
            ->assertOk()
            ->assertJson(['shipping_price' => 3.5]);
    }

    /** No zone for the buyer's country falls back to the profile's worldwide rate. */
    public function test_an_unlisted_country_falls_back_to_the_worldwide_zone(): void
    {
        $creator = $this->creator();
        $profile = $this->profileWith($creator, ['GB' => 3.50, 'all' => 9.00]);
        $shop = $this->physicalShop($creator, $profile->id);

        $this->getJson(route('shop.shipping-price', ['shop_id' => $shop->uuid]).'?country=DE')
            ->assertOk()
            ->assertJson(['shipping_price' => 9.0]);
    }

    /**
     * 🚨 A DELETED PROFILE MAKES ITS ITEMS SHIP FREE, SILENTLY.
     * `shippingPrice()` finds no zones and answers 0 — no error, no warning, and the
     * creator posts the parcel out of their own pocket. This is why
     * `ShippingProfileField` deselects the item BEFORE calling delete, and why the
     * picker never offers a profile it has not just re-read from the server.
     */
    public function test_deleting_a_profile_an_item_still_points_at_charges_no_postage(): void
    {
        $creator = $this->creator();
        $profile = $this->profileWith($creator, ['GB' => 3.50, 'all' => 9.00]);
        $shop = $this->physicalShop($creator, $profile->id);

        $this->actingAs($creator)
            ->deleteJson(route('shop.shipping-profile.delete', ['id' => $profile->id]))
            ->assertOk();

        $this->getJson(route('shop.shipping-price', ['shop_id' => $shop->uuid]).'?country=GB')
            ->assertOk()
            ->assertJson(['shipping_price' => 0]);
    }

    public function test_a_guest_cannot_reach_the_profile_routes(): void
    {
        $this->getJson(route('shop.shipping-profiles'))->assertUnauthorized();
        $this->postJson(route('shop.shipping-profile.save'), [])->assertUnauthorized();
    }
}
