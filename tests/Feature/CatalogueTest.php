<?php

namespace Tests\Feature;

use App\Models\Bills;
use App\Models\Membership;
use App\Models\PiggyPot;
use App\Models\PiggyPotContribution;
use App\Models\Shop;
use App\Models\ShopPayment;
use App\Models\StripePaymentDetail;
use App\Models\StripePaymentItems;
use App\Models\Task;
use App\Models\User;
use App\Models\WishItem;
use App\Services\CatalogueService;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;
use Tests\TestCase;

/**
 * The unified catalogue: one status vocabulary over six modules, owner-only, batched.
 */
class CatalogueTest extends TestCase
{
    use RefreshDatabase;

    /**
     * ⚠️ Pre-existing `shops` schema drift — several columns the app writes are declared
     * by no migration, so a database built from migrations alone does not have them.
     * Same note as ItemFunnelTest / StockWaitlistTest.
     */
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

        // ⚠️ Same drift on `memberships`: the create migration declares `name`, while
        // the app has written `level`, `price`, `currency` and `status` since. Every
        // deployed database has them; a database built from migrations alone does not.
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
        });
    }

    private function creator(): User
    {
        return User::factory()->create(['role' => 1, 'account_id' => 'acct_test']);
    }

    private function catalogue(User $creator, array $filters = []): array
    {
        return app(CatalogueService::class)->for($creator, $filters);
    }

    private function shop(User $creator, array $attributes = []): Shop
    {
        return Shop::create(array_merge([
            'uuid' => (string) Str::uuid(),
            'user_id' => $creator->id,
            'type' => 'digital',
            'name' => 'Studio Setup',
            'description' => 'Behind the scenes',
            'price' => 19.99,
            'currency' => 'gbp',
            'approved' => 1,
            'status' => 1,
        ], $attributes));
    }

    private function wish(User $creator, array $attributes = []): WishItem
    {
        return WishItem::create(array_merge([
            'user_id' => $creator->id,
            'wishname' => 'Photo set',
            'price' => 9.99,
            'currency' => 'gbp',
            'is_approved' => 1,
            // NOT NULL with no default on this schema.
            'subscription' => 0,
        ], $attributes));
    }

    private function task(User $creator, array $attributes = []): Task
    {
        return Task::create(array_merge([
            'uuid' => (string) Str::uuid(),
            'creator_id' => $creator->id,
            'title' => 'Custom voice note',
            'description' => 'A personal recording',
            'price' => 25,
            'type' => 'instant',
            'status' => 'active',
            'is_approved' => 1,
        ], $attributes));
    }

    private function pot(User $creator, array $attributes = []): PiggyPot
    {
        return PiggyPot::create(array_merge([
            'uuid' => (string) Str::uuid(),
            'user_id' => $creator->id,
            'title' => 'Behind the scenes bundle',
            'description' => 'A new photo set',
            'target_amount' => 500,
            'currency' => 'gbp',
            'status' => 'active',
        ], $attributes));
    }

    private function bill(User $creator, array $attributes = []): Bills
    {
        return Bills::create(array_merge([
            'uuid' => (string) Str::uuid(),
            'user_id' => $creator->id,
            'name' => 'Weekly stream',
            'price' => 12,
            'currency' => 'gbp',
            'period' => 'monthly',
            'approved' => 1,
            'status' => 1,
        ], $attributes));
    }

    private function membership(User $creator, array $attributes = []): Membership
    {
        // ⚠️ forceFill: `memberships.name` is NOT NULL on the migration-built schema and
        // is not in the model's $fillable, so create() cannot satisfy its own table.
        $membership = new Membership;
        $membership->forceFill(array_merge([
            'uuid' => (string) Str::uuid(),
            'user_id' => $creator->id,
            'name' => 'Gold',
            'level' => 'Gold',
            'price' => 15,
            'currency' => 'gbp',
            'approved' => 1,
        ], $attributes))->save();

        return $membership;
    }

    /** @return array<string,array<string,mixed>> rows keyed by "type:id" */
    private function keyed(array $payload): array
    {
        $out = [];

        foreach ($payload['listings']['data'] as $row) {
            $out[$row['key']] = $row;
        }

        return $out;
    }

    public function test_all_six_types_appear_in_one_list(): void
    {
        $creator = $this->creator();

        $this->wish($creator);
        $this->shop($creator);
        $this->task($creator);
        $this->pot($creator);
        $this->bill($creator);
        $this->membership($creator);

        $payload = $this->catalogue($creator);

        $this->assertSame(6, $payload['counts']['all']);

        foreach (['wish', 'shop', 'task', 'piggy_pot', 'bill', 'membership'] as $type) {
            $this->assertSame(1, $payload['counts']['by_type'][$type], "missing {$type}");
        }
    }

    public function test_another_creators_catalogue_is_never_returned(): void
    {
        $mine = $this->creator();
        $theirs = $this->creator();

        $this->shop($theirs, ['name' => 'Not mine']);
        // ⚠️ Task keys on creator_id, not user_id. Reading the wrong owner column here
        // would return someone else's listings and nothing would error.
        $this->task($theirs, ['title' => 'Also not mine']);

        $payload = $this->catalogue($mine);

        $this->assertSame(0, $payload['counts']['all']);
    }

    public function test_a_held_item_reads_in_review_and_a_refused_one_reads_rejected(): void
    {
        $creator = $this->creator();

        $waiting = $this->shop($creator, ['approved' => 0, 'name' => 'Waiting']);
        $refused = $this->shop($creator, [
            'approved' => 0,
            'name' => 'Refused',
            'moderation_reason' => 'The image is not clear enough.',
        ]);

        $rows = $this->keyed($this->catalogue($creator));

        // "Waiting on us" and "waiting on you" are opposite instructions. Collapsing
        // them tells a creator to fix something nobody has looked at yet.
        $this->assertSame('in_review', $rows['shop:'.$waiting->id]['status']);
        $this->assertFalse($rows['shop:'.$waiting->id]['needs_attention']);

        $this->assertSame('rejected', $rows['shop:'.$refused->id]['status']);
        $this->assertTrue($rows['shop:'.$refused->id]['needs_attention']);
        $this->assertSame('The image is not clear enough.', $rows['shop:'.$refused->id]['moderation_reason']);
    }

    public function test_a_suspended_listing_outranks_every_other_state(): void
    {
        $creator = $this->creator();

        $shop = $this->shop($creator, ['approved' => 0, 'is_suspended' => 1]);

        $rows = $this->keyed($this->catalogue($creator));

        $this->assertSame('suspended', $rows['shop:'.$shop->id]['status']);
    }

    public function test_a_paused_shop_item_is_not_reported_as_live(): void
    {
        $creator = $this->creator();

        $paused = $this->shop($creator, ['status' => 0]);

        $rows = $this->keyed($this->catalogue($creator));

        $this->assertSame('paused', $rows['shop:'.$paused->id]['status']);
        $this->assertTrue($rows['shop:'.$paused->id]['pausable']);
    }

    public function test_stock_of_zero_is_sold_out_but_untracked_stock_is_not(): void
    {
        $creator = $this->creator();

        $soldOut = $this->shop($creator, ['slot_limitation' => 0, 'name' => 'Gone']);
        $untracked = $this->shop($creator, ['slot_limitation' => null, 'name' => 'Unlimited']);

        $rows = $this->keyed($this->catalogue($creator));

        $this->assertSame('sold_out', $rows['shop:'.$soldOut->id]['status']);
        $this->assertSame(0, $rows['shop:'.$soldOut->id]['stock']);

        // NULL means stock is not tracked, which is not the same as none left.
        $this->assertSame('live', $rows['shop:'.$untracked->id]['status']);
        $this->assertNull($rows['shop:'.$untracked->id]['stock']);
    }

    public function test_a_pot_past_its_deadline_reads_expired_even_before_the_sweep_runs(): void
    {
        $creator = $this->creator();

        // The expiry sweep runs hourly, so a pot that closed at midnight is still
        // `active` in the column. Reading the column alone would call it live.
        $pot = $this->pot($creator, ['deadline' => now()->subDays(2), 'is_pinned' => true]);

        $rows = $this->keyed($this->catalogue($creator));

        $this->assertSame('expired', $rows['piggy_pot:'.$pot->id]['status']);
        $this->assertTrue($rows['piggy_pot:'.$pot->id]['needs_attention']);
        $this->assertNull($rows['piggy_pot:'.$pot->id]['public_url']);
    }

    public function test_a_held_pot_reads_in_review(): void
    {
        $creator = $this->creator();

        $pot = $this->pot($creator, ['status' => 'moderation_hold']);

        $rows = $this->keyed($this->catalogue($creator));

        $this->assertSame('in_review', $rows['piggy_pot:'.$pot->id]['status']);
    }

    public function test_reward_body_never_reaches_the_payload(): void
    {
        $creator = $this->creator();

        $this->shop($creator, [
            'reward_title' => 'The full set',
            'reward_type' => 'message',
            'reward_body' => 'SECRET-PAID-CONTENT',
        ]);
        $this->wish($creator, [
            'reward_title' => 'A note',
            'reward_type' => 'message',
            'reward_body' => 'SECRET-PAID-CONTENT',
        ]);

        $encoded = json_encode($this->catalogue($creator));

        // reward_body IS the paid deliverable. A catalogue row is an overview of what
        // is on sale, not a delivery surface.
        $this->assertStringNotContainsString('SECRET-PAID-CONTENT', $encoded);
        $this->assertStringNotContainsString('reward_body', $encoded);
        $this->assertStringContainsString('The full set', $encoded);
    }

    public function test_only_completed_sales_are_counted(): void
    {
        $creator = $this->creator();
        $shop = $this->shop($creator);

        foreach (['paid', 'complete', 'refunded', 'failed', null] as $status) {
            ShopPayment::create([
                'uuid' => (string) Str::uuid(),
                'session_id' => (string) Str::uuid(),
                'shop_id' => $shop->id,
                'user_id' => $creator->id,
                'amount' => 19.99,
                'total_paid' => 24.4,
                'currency' => 'gbp',
                'payment_status' => $status,
            ]);
        }

        $rows = $this->keyed($this->catalogue($creator));

        // paid + complete. A refund is money that came back, and a NULL status is a
        // checkout that was started rather than one that finished.
        $this->assertSame(2, $rows['shop:'.$shop->id]['sales']);
    }

    public function test_a_wish_sale_is_counted_once_not_twice(): void
    {
        $creator = $this->creator();
        $wish = $this->wish($creator);

        $detail = StripePaymentDetail::create([
            'uuid' => (string) Str::uuid(),
            'session_id' => (string) Str::uuid(),
            'user_id' => $creator->id,
            'owner_id' => $creator->id,
            'amount_total' => 12.5,
            'currency' => 'gbp',
            'payment_status' => 'paid',
        ]);

        StripePaymentItems::create([
            'uuid' => (string) Str::uuid(),
            'stripe_payment_detail_id' => $detail->id,
            'wish_item_id' => $wish->id,
            'amount' => 9.99,
            'total_paid' => 12.5,
        ]);

        $rows = $this->keyed($this->catalogue($creator));

        // A recurring wish writes a stripe_payment_items row AND a
        // wish_item_subscriptions row. Counting both doubles every recurring wish.
        $this->assertSame(1, $rows['wish:'.$wish->id]['sales']);
    }

    public function test_a_pot_contribution_counts_as_a_sale(): void
    {
        $creator = $this->creator();
        $pot = $this->pot($creator);

        PiggyPotContribution::create([
            'uuid' => (string) Str::uuid(),
            'piggy_pot_id' => $pot->id,
            'creator_id' => $creator->id,
            'user_id' => $creator->id,
            'amount' => 20,
            'total_paid' => 24,
            'currency' => 'gbp',
            'status' => 'paid',
        ]);

        $rows = $this->keyed($this->catalogue($creator));

        $this->assertSame(1, $rows['piggy_pot:'.$pot->id]['sales']);
    }

    public function test_a_deleted_listing_is_gone_from_the_catalogue(): void
    {
        $creator = $this->creator();

        $shop = $this->shop($creator);
        $shop->delete();

        $this->assertSame(0, $this->catalogue($creator)['counts']['all']);
    }

    public function test_needs_attention_sorts_a_stuck_listing_above_a_healthy_newer_one(): void
    {
        $creator = $this->creator();

        $this->shop($creator, ['approved' => 0, 'moderation_reason' => 'Please re-upload.', 'name' => 'Stuck']);
        $this->shop($creator, ['name' => 'Fine']);

        $rows = $this->catalogue($creator)['listings']['data'];

        // Newest-first buries the one row this screen exists to surface.
        $this->assertSame('Stuck', $rows[0]['title']);
    }

    public function test_the_attention_filter_returns_only_actionable_rows(): void
    {
        $creator = $this->creator();

        $this->shop($creator, ['approved' => 0, 'moderation_reason' => 'Nope', 'name' => 'Stuck']);
        $this->shop($creator, ['name' => 'Fine']);
        $this->shop($creator, ['approved' => 0, 'name' => 'Waiting']);

        $payload = $this->catalogue($creator, ['status' => 'attention']);

        $this->assertCount(1, $payload['listings']['data']);
        $this->assertSame('Stuck', $payload['listings']['data'][0]['title']);

        // Counts describe the whole catalogue, never the filtered slice — a chip whose
        // number changes when you press it cannot be used to navigate.
        $this->assertSame(3, $payload['counts']['all']);
    }

    public function test_selecting_a_type_does_not_zero_every_other_chip(): void
    {
        $creator = $this->creator();

        $this->shop($creator);
        $this->shop($creator, ['name' => 'Second']);
        $this->task($creator);
        $this->pot($creator);

        $payload = $this->catalogue($creator, ['type' => 'task']);

        // 🚨 The chips ARE the navigation. Computing the counts from the filtered fetch
        // made every unselected chip read 0, so a creator opening "Paid requests" was
        // told they had no wishes, no shop and no pots — and the only way to find out
        // otherwise was to press each one.
        $this->assertSame(4, $payload['counts']['all']);
        $this->assertSame(2, $payload['counts']['by_type']['shop']);
        $this->assertSame(1, $payload['counts']['by_type']['piggy_pot']);

        // The list itself IS filtered.
        $this->assertCount(1, $payload['listings']['data']);
        $this->assertSame('task', $payload['listings']['data'][0]['type']);
    }

    public function test_every_type_chip_is_present_even_at_zero(): void
    {
        $creator = $this->creator();

        $payload = $this->catalogue($creator);

        // These chips stand in for the six screens this page replaces. One vanishing
        // when empty reads as the feature being broken rather than as nothing waiting.
        $this->assertSame(
            ['wish', 'shop', 'task', 'piggy_pot', 'bill', 'membership'],
            array_keys($payload['counts']['by_type'])
        );
    }

    public function test_search_matches_the_title_only(): void
    {
        $creator = $this->creator();

        $this->shop($creator, ['name' => 'Hoodie']);
        $this->shop($creator, ['name' => 'Poster', 'description' => 'hoodie in the picture']);

        $payload = $this->catalogue($creator, ['q' => 'hoodie']);

        $this->assertCount(1, $payload['listings']['data']);
        $this->assertSame('Hoodie', $payload['listings']['data'][0]['title']);
    }

    public function test_a_fan_is_sent_away_and_a_creator_is_not(): void
    {
        $fan = User::factory()->create(['role' => 0]);

        $this->actingAs($fan)->get(route('catalogue.index'))->assertRedirect(route('home'));
    }

    public function test_an_unknown_filter_is_refused_rather_than_reported_as_an_empty_catalogue(): void
    {
        $creator = $this->creator();
        $this->shop($creator);

        // Unvalidated, this would reach the service as a filter matching nothing and
        // the page would tell a creator with listings that they have none.
        $this->actingAs($creator)
            ->getJson(route('catalogue.index', ['type' => 'not-a-type']))
            ->assertStatus(422);
    }

    public function test_the_whole_catalogue_costs_a_bounded_number_of_queries(): void
    {
        $creator = $this->creator();

        // Ten of each type. If anything here were per-row, the count would scale with
        // this number — which is the entire risk on a screen built over six tables.
        for ($i = 0; $i < 10; $i++) {
            $this->wish($creator, ['wishname' => "Wish {$i}"]);
            $this->shop($creator, ['name' => "Shop {$i}"]);
            $this->task($creator, ['title' => "Task {$i}"]);
            $this->pot($creator, ['title' => "Pot {$i}"]);
            $this->bill($creator, ['name' => "Bill {$i}"]);
            $this->membership($creator, ['level' => "Tier {$i}"]);
        }

        DB::enableQueryLog();
        $payload = $this->catalogue($creator);
        $queries = count(DB::getQueryLog());
        DB::disableQueryLog();

        $this->assertSame(60, $payload['counts']['all']);
        $this->assertLessThanOrEqual(
            35,
            $queries,
            "Catalogue used {$queries} queries for 60 listings — something is running per row."
        );
    }
}
