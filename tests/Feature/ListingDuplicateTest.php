<?php

namespace Tests\Feature;

use App\Models\Membership;
use App\Models\PiggyPot;
use App\Models\Shop;
use App\Models\Task;
use App\Models\User;
use App\Models\WishItem;
use App\Services\ListingDuplicator;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;
use Tests\TestCase;

/**
 * Duplicate a listing.
 *
 * 🚨 The property the whole feature turns on: a duplicate is a RE-SUBMISSION through the
 * module's own create path, never a row copy. A row copy would carry
 * `stripe_product_id`/`price_id` over and the new listing would charge the ORIGINAL's
 * price forever.
 */
class ListingDuplicateTest extends TestCase
{
    use RefreshDatabase;

    /** ⚠️ Undeclared columns on `shops` and `memberships` — see CatalogueTest. */
    protected function setUp(): void
    {
        parent::setUp();

        Schema::table('shops', function (Blueprint $table) {
            foreach (['type', 'currency', 'image'] as $column) {
                if (! Schema::hasColumn('shops', $column)) {
                    $table->string($column)->nullable();
                }
            }
            if (! Schema::hasColumn('shops', 'price')) {
                $table->double('price')->nullable();
            }
            if (! Schema::hasColumn('shops', 'slot_limitation')) {
                $table->integer('slot_limitation')->nullable();
            }
            if (! Schema::hasColumn('shops', 'quantity_allow')) {
                $table->boolean('quantity_allow')->default(0);
            }
            if (! Schema::hasColumn('shops', 'status')) {
                $table->integer('status')->nullable();
            }
        });

        // ⚠️ `wish_items.reward` and `.ai_generated` are written by addWishItem and
        // declared by no migration, so on a database built from migrations alone a wish
        // cannot be created at all.
        Schema::table('wish_items', function (Blueprint $table) {
            foreach (['reward', 'ai_generated'] as $column) {
                if (! Schema::hasColumn('wish_items', $column)) {
                    $table->string($column)->nullable();
                }
            }
        });

        Schema::table('memberships', function (Blueprint $table) {
            foreach (['level', 'currency'] as $column) {
                if (! Schema::hasColumn('memberships', $column)) {
                    $table->string($column)->nullable();
                }
            }
            if (! Schema::hasColumn('memberships', 'price')) {
                $table->double('price')->nullable();
            }
            if (! Schema::hasColumn('memberships', 'status')) {
                $table->integer('status')->nullable();
            }
            if (! Schema::hasColumn('memberships', 'rewards')) {
                $table->text('rewards')->nullable();
            }
        });

        // ⚠️ `shop_shipping_infos` is created by no migration at all, so a physical
        // product's shipping rows do not exist on a migration-built database.
        if (! Schema::hasTable('shop_shipping_infos')) {
            Schema::create('shop_shipping_infos', function (Blueprint $table) {
                $table->id();
                $table->string('uuid')->nullable();
                $table->unsignedBigInteger('shop_id');
                $table->string('country')->nullable();
                $table->double('shipping_price')->nullable();
                $table->timestamps();
                // ShopShippingInfo soft-deletes.
                $table->softDeletes();
            });
        }
    }

    private function creator(): User
    {
        return User::factory()->create([
            'role' => 1,
            // Every store method refuses without a payment destination — a listing
            // cannot exist without somewhere for its money to go.
            'account_id' => 'acct_test',
            'default_currency' => 'gbp',
        ]);
    }

    private function duplicate(User $creator, string $type, int $id): array
    {
        $this->actingAs($creator);

        return app(ListingDuplicator::class)->duplicate($creator, $type, $id);
    }

    private function wish(User $creator, array $attributes = []): WishItem
    {
        return WishItem::create(array_merge([
            'user_id' => $creator->id,
            'wishname' => 'Photo set',
            'price' => 9.99,
            'currency' => 'gbp',
            'is_approved' => 1,
            'subscription' => 0,
            'stripe_product_id' => 'prod_ORIGINAL',
            'price_id' => 'price_ORIGINAL',
            'reward_title' => 'The full set',
            'reward_type' => 'message',
            'reward_body' => 'Here is your set.',
            'thumbnail' => '11111111-1111-1111-1111-111111111111',
        ], $attributes));
    }

    private function payload(User $creator, string $type, $source): array
    {
        $this->actingAs($creator);

        return app(ListingDuplicator::class)->payloadFor($type, $source);
    }

    public function test_a_duplicate_never_carries_the_originals_stripe_product(): void
    {
        $creator = $this->creator();
        $source = $this->wish($creator);

        $payload = $this->payload($creator, 'wish', $source);

        // 🚨 The bug this whole feature is shaped around. A row copy would carry these,
        // and the copy would charge the ORIGINAL's price for the rest of its life —
        // silently, and only visible in a payout. They are not in the payload at all, so
        // the module's own store() mints fresh ones.
        $this->assertArrayNotHasKey('stripe_product_id', $payload);
        $this->assertArrayNotHasKey('price_id', $payload);
        $this->assertArrayNotHasKey('uuid', $payload);
    }

    public function test_no_approval_state_or_history_is_carried_over(): void
    {
        $creator = $this->creator();
        $source = $this->wish($creator, [
            'is_approved' => 1,
            'moderation_reason' => 'An old refusal.',
            'supporter_count' => 42,
        ]);

        $payload = $this->payload($creator, 'wish', $source);

        // The copy is new content nobody has judged. Its approval, the reason an admin
        // once gave, and the original's audience all belong to the original.
        foreach (['is_approved', 'moderation_reason', 'moderation_asset', 'supporter_count', 'rising_score', 'engagement_level'] as $key) {
            $this->assertArrayNotHasKey($key, $payload);
        }
    }

    public function test_the_reward_and_the_price_are_carried_over(): void
    {
        $creator = $this->creator();
        $source = $this->wish($creator);

        $payload = $this->payload($creator, 'wish', $source);

        $this->assertSame(9.99, (float) $payload['price']);
        $this->assertSame('11111111-1111-1111-1111-111111111111', $payload['thumbnail']);
        $this->assertSame('Here is your set.', $payload['reward_body']);

        // The listing title is marked so the creator can tell the two apart...
        $this->assertStringContainsString('(copy)', $payload['wishname']);
        // ...but the reward headline is NOT. That is what the SUPPORTER reads on the
        // card, at checkout and on the receipt.
        $this->assertSame('The full set', $payload['reward_title']);
    }

    public function test_a_task_carries_its_media_as_an_array_not_a_url(): void
    {
        $creator = $this->creator();

        $source = Task::create([
            'uuid' => (string) Str::uuid(),
            'creator_id' => $creator->id,
            'title' => 'Custom voice note',
            'description' => 'A personal recording',
            'price' => 25,
            'category' => 'audio',
            'type' => 'instant',
            'status' => 'active',
            'is_approved' => 1,
            'deliverable_note' => 'Delivered instantly.',
            'deliverable_content' => 'https://ucarecdn.com/55555555-5555-5555-5555-555555555555/',
            'deliverable_content_type' => 'audio/mpeg',
            'media_url' => 'https://ucarecdn.com/33333333-3333-3333-3333-333333333333/',
            'reward_title' => 'A note from me',
        ]);

        $payload = $this->payload($creator, 'task', $source);

        // ⚠️ TaskController::store reads `$request->media_file['url']`. Passing the bare
        // url instead of the uploader's array shape drops the image in silence and the
        // copy publishes with no picture.
        $this->assertIsArray($payload['media_file']);
        $this->assertSame($source->media_url, $payload['media_file']['url']);
        $this->assertSame('audio/mpeg', $payload['deliverable_file']['mimeType']);
    }

    public function test_a_duplicated_pot_never_inherits_a_past_deadline_or_the_featured_slot(): void
    {
        $creator = $this->creator();

        $source = PiggyPot::create([
            'uuid' => (string) Str::uuid(),
            'user_id' => $creator->id,
            'title' => 'Behind the scenes bundle',
            'description' => 'A new photo set',
            'target_amount' => 100,
            'currency' => 'gbp',
            'status' => 'active',
            'deadline' => now()->subDays(30),
            'is_pinned' => true,
            'content_file' => '44444444-4444-4444-4444-444444444444',
            'reward_title' => 'The bundle',
        ]);

        $payload = $this->payload($creator, 'piggy_pot', $source);

        // A copy that inherits a past deadline is expired the moment it is created —
        // invisible on the profile, with nothing saying why.
        $this->assertNull($payload['deadline']);
        // And a pot nobody can see yet must not take the profile's featured slot.
        $this->assertFalse($payload['is_pinned']);
    }

    public function test_a_membership_uses_month_price_and_a_distinct_level_name(): void
    {
        $creator = $this->creator();

        $source = new Membership;
        $source->forceFill([
            'uuid' => (string) Str::uuid(),
            'user_id' => $creator->id,
            'name' => 'Gold',
            'level' => 'Gold',
            'price' => 15,
            'currency' => 'gbp',
            'approved' => 1,
            'rewards' => json_encode(['monthly_content_bundle']),
            'reward_title' => 'Gold perks',
        ])->save();

        $payload = $this->payload($creator, 'membership', $source);

        // ⚠️ `month_price`, not `price` — the one module whose form field does not match
        // its own column. Sending `price` fails validation with "required".
        $this->assertSame(15.0, (float) $payload['month_price']);
        $this->assertArrayNotHasKey('price', $payload);

        // ⚠️ `level` is unique per creator — membershipLevelSave refuses a repeat, so the
        // suffix is what makes a duplicate possible at all.
        $this->assertNotSame('Gold', $payload['level']);

        // The perks list is decoded back into an array; the form posts it as one.
        $this->assertSame(['monthly_content_bundle'], $payload['rewards']);
    }

    public function test_a_physical_shop_item_rebuilds_its_shipping_rows(): void
    {
        $creator = $this->creator();

        $source = Shop::create([
            'uuid' => (string) Str::uuid(),
            'user_id' => $creator->id,
            'type' => 'physical',
            'name' => 'Signed poster',
            'description' => 'A3, signed',
            'price' => 25,
            'currency' => 'gbp',
            'image' => '22222222-2222-2222-2222-222222222222',
            'approved' => 1,
            'quantity_allow' => 0,
        ]);

        $source->shop_shipping_info()->create([
            'uuid' => (string) Str::uuid(),
            'country' => 'GB',
            'shipping_price' => 4.5,
        ]);

        $payload = $this->payload($creator, 'shop', $source);

        // `shipping` is `required` for a physical product, and addShopItems rebuilds the
        // shop_shipping_info rows from this JSON — without it the copy would publish
        // with no shipping at all.
        $this->assertSame([['country' => 'GB', 'price' => 4.5]], json_decode($payload['shipping'], true));
    }

    public function test_the_copy_suffix_is_never_doubled(): void
    {
        $creator = $this->creator();
        $source = $this->wish($creator, ['wishname' => 'Photo set (copy)']);

        $payload = $this->payload($creator, 'wish', $source);

        $this->assertSame(1, substr_count($payload['wishname'], '(copy)'));
    }

    public function test_another_creators_listing_cannot_be_duplicated(): void
    {
        $mine = $this->creator();
        $theirs = $this->creator();

        $source = $this->wish($theirs, ['wishname' => 'Not mine']);

        $result = $this->duplicate($mine, 'wish', $source->id);

        // Ownership is resolved from the owner column, not from the id — otherwise a
        // guessed id mints someone else's listing onto your own account.
        $this->assertFalse($result['ok']);
        $this->assertSame(1, WishItem::count());
    }

    public function test_an_unknown_type_is_refused_rather_than_silently_doing_nothing(): void
    {
        $creator = $this->creator();

        $result = $this->duplicate($creator, 'not-a-type', 1);

        $this->assertFalse($result['ok']);
    }

    public function test_a_creator_with_no_stripe_account_is_told_why(): void
    {
        $creator = User::factory()->create(['role' => 1, 'account_id' => null, 'default_currency' => 'gbp']);
        $source = $this->wish($creator);

        $result = $this->duplicate($creator, 'wish', $source->id);

        // The module's own guard refuses, and its message is surfaced rather than a
        // generic failure — this is fixable by the creator.
        $this->assertFalse($result['ok']);
        $this->assertSame(1, WishItem::count());
    }

    public function test_a_fan_cannot_reach_the_endpoint(): void
    {
        $fan = User::factory()->create(['role' => 0]);

        $this->actingAs($fan)
            ->post(route('catalogue.duplicate', ['type' => 'wish', 'id' => 1]))
            ->assertRedirect();
    }
}
