<?php

namespace Tests\Feature;

use App\Http\Controllers\StockWaitlistController;
use App\Mail\StockBackInStock;
use App\Models\Shop;
use App\Models\StockWaitlist;
use App\Models\User;
use App\Services\StockWaitlistService;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;
use Tests\TestCase;

class StockWaitlistTest extends TestCase
{
    use RefreshDatabase;

    /**
     * ⚠️ Compensates for a PRE-EXISTING schema drift, not for anything this feature did.
     *
     * A freshly migrated `shops` table is missing most of the columns the shop module
     * actually uses — `type`, `price`, `currency`, `slot_limitation`, `status` and more
     * exist on the deployed database but have no migration. `migrate:fresh` therefore
     * produces a schema the shop module cannot run against at all, which is also why
     * `ShopFactory` (which sets `type`) is unusable and no existing test creates a Shop.
     *
     * These are added here for the test database only. Fixing the real drift needs the
     * production schema as the source of truth and is its own piece of work.
     */
    protected function setUp(): void
    {
        parent::setUp();

        Schema::table('shops', function (Blueprint $table) {
            if (! Schema::hasColumn('shops', 'type')) {
                $table->string('type')->nullable();
            }
            if (! Schema::hasColumn('shops', 'price')) {
                $table->double('price')->nullable();
            }
            if (! Schema::hasColumn('shops', 'currency')) {
                $table->string('currency')->nullable();
            }
            if (! Schema::hasColumn('shops', 'slot_limitation')) {
                $table->integer('slot_limitation')->nullable();
            }
        });
    }

    private function creator(): User
    {
        return User::factory()->create(['role' => 1, 'account_id' => 'acct_test']);
    }

    private function shop(User $creator, ?int $stock = 0, array $overrides = []): Shop
    {
        return Shop::create(array_merge([
            'uuid' => (string) Str::uuid(),
            'user_id' => $creator->id,
            'type' => 'digital',
            'name' => 'Studio Setup',
            'description' => 'Behind the scenes',
            'price' => 19.99,
            'currency' => 'gbp',
            'slot_limitation' => $stock,
            'approved' => 1,
            'is_suspended' => 0,
        ], $overrides));
    }

    private function service(): StockWaitlistService
    {
        return app(StockWaitlistService::class);
    }

    public function test_a_guest_can_join_a_sold_out_items_waitlist(): void
    {
        $shop = $this->shop($this->creator());

        $result = $this->service()->join($shop, null, 'guest@example.com');

        $this->assertTrue($result['ok']);
        $this->assertDatabaseHas('stock_waitlists', [
            'shop_id' => $shop->id,
            'email' => 'guest@example.com',
            'user_id' => null,
        ]);
    }

    public function test_joining_twice_does_not_create_a_second_entry(): void
    {
        $shop = $this->shop($this->creator());

        $this->service()->join($shop, null, 'guest@example.com');
        $second = $this->service()->join($shop, null, 'guest@example.com');

        $this->assertTrue($second['ok']);
        $this->assertSame(1, StockWaitlist::where('shop_id', $shop->id)->count());
    }

    public function test_an_item_that_is_in_stock_cannot_be_waitlisted(): void
    {
        $shop = $this->shop($this->creator(), 5);

        $result = $this->service()->join($shop, null, 'guest@example.com');

        $this->assertFalse($result['ok']);
        $this->assertSame(0, StockWaitlist::count());
    }

    public function test_an_item_with_no_stock_limit_cannot_be_waitlisted(): void
    {
        // A null limit means unlimited — it can never sell out, so there is nothing
        // to wait for.
        $shop = $this->shop($this->creator(), null);

        $result = $this->service()->join($shop, null, 'guest@example.com');

        $this->assertFalse($result['ok']);
    }

    public function test_a_creator_cannot_join_their_own_waitlist(): void
    {
        $creator = $this->creator();
        $shop = $this->shop($creator);

        $this->assertFalse($this->service()->join($shop, $creator)['ok']);
        // …and not by typing their own address as a guest either.
        $this->assertFalse($this->service()->join($shop, null, $creator->email)['ok']);
        $this->assertSame(0, StockWaitlist::count());
    }

    public function test_a_restock_notifies_everyone_waiting_exactly_once(): void
    {
        Mail::fake();

        $creator = $this->creator();
        $shop = $this->shop($creator);

        $this->service()->join($shop, null, 'a@example.com');
        $this->service()->join($shop, null, 'b@example.com');

        // The creator puts stock back.
        $shop->update(['slot_limitation' => 3]);

        $this->assertSame(2, $this->service()->notifyRestock($shop->fresh()));
        Mail::assertQueued(StockBackInStock::class, 2);

        // A second sweep must not tell them again.
        $this->assertSame(0, $this->service()->notifyRestock($shop->fresh()));
        Mail::assertQueued(StockBackInStock::class, 2);
    }

    public function test_the_sweep_is_what_actually_finds_a_restock(): void
    {
        Mail::fake();

        $shop = $this->shop($this->creator());
        $this->service()->join($shop, null, 'a@example.com');

        // Deliberately a query-builder update — exactly how the refund handler and the
        // creator edit put stock back. It fires NO model events, which is why this
        // feature is swept rather than observed.
        Shop::where('id', $shop->id)->increment('slot_limitation', 2);

        $this->artisan('waitlist:notify-restock')->assertSuccessful();

        Mail::assertQueued(StockBackInStock::class, 1);
        $this->assertNotNull(StockWaitlist::first()->notified_at);
    }

    public function test_stock_returning_on_an_unapproved_item_notifies_nobody(): void
    {
        Mail::fake();

        $shop = $this->shop($this->creator(), 0, ['approved' => 0]);
        $this->service()->join($shop, null, 'a@example.com');

        $shop->update(['slot_limitation' => 5]);

        $this->artisan('waitlist:notify-restock')->assertSuccessful();

        // Sending people to a listing that refuses them is worse than saying nothing.
        Mail::assertNothingQueued();
        Mail::assertNothingSent();
        $this->assertNull(StockWaitlist::first()->notified_at);
    }

    public function test_a_suspended_listing_notifies_nobody(): void
    {
        Mail::fake();

        $shop = $this->shop($this->creator());
        $this->service()->join($shop, null, 'a@example.com');

        // forceFill: `is_suspended` is not mass-assignable, so passing it to create()
        // is silently dropped and the listing would look perfectly sellable.
        $shop->forceFill(['is_suspended' => 1, 'slot_limitation' => 5])->save();

        $this->artisan('waitlist:notify-restock')->assertSuccessful();

        Mail::assertNothingQueued();
        Mail::assertNothingSent();
    }

    public function test_an_item_still_sold_out_notifies_nobody(): void
    {
        Mail::fake();

        $shop = $this->shop($this->creator());
        $this->service()->join($shop, null, 'a@example.com');

        $this->artisan('waitlist:notify-restock')->assertSuccessful();

        Mail::assertNothingQueued();
        Mail::assertNothingSent();
    }

    public function test_a_notified_person_can_rejoin_when_it_sells_out_again(): void
    {
        Mail::fake();

        $shop = $this->shop($this->creator());
        $this->service()->join($shop, null, 'a@example.com');

        $shop->update(['slot_limitation' => 1]);
        $this->service()->notifyRestock($shop->fresh());

        // It sells out again and they still want it — the same row re-opens rather
        // than the join being refused.
        $shop->update(['slot_limitation' => 0]);
        $result = $this->service()->join($shop->fresh(), null, 'a@example.com');

        $this->assertTrue($result['ok']);
        $this->assertSame(1, StockWaitlist::count());
        $this->assertNull(StockWaitlist::first()->notified_at);
    }

    public function test_dry_run_notifies_nobody_and_claims_nothing(): void
    {
        Mail::fake();

        $shop = $this->shop($this->creator());
        $this->service()->join($shop, null, 'a@example.com');
        $shop->update(['slot_limitation' => 2]);

        $this->artisan('waitlist:notify-restock --dry-run')->assertSuccessful();

        Mail::assertNothingQueued();
        Mail::assertNothingSent();
        $this->assertNull(StockWaitlist::first()->notified_at);
    }

    public function test_waiting_counts_are_returned_in_one_batch(): void
    {
        $creator = $this->creator();
        $a = $this->shop($creator);
        $b = $this->shop($creator);

        $this->service()->join($a, null, 'one@example.com');
        $this->service()->join($a, null, 'two@example.com');
        $this->service()->join($b, null, 'one@example.com');

        $counts = $this->service()->waitingCounts([$a->id, $b->id]);

        $this->assertSame(2, (int) $counts[$a->id]);
        $this->assertSame(1, (int) $counts[$b->id]);
    }

    public function test_the_join_endpoint_is_public_and_refuses_an_unknown_item(): void
    {
        $this->postJson(route('waitlist.join'), [
            'shop_uuid' => (string) Str::uuid(),
            'email' => 'guest@example.com',
        ])->assertStatus(404);
    }

    public function test_the_join_endpoint_reports_a_refusal_rather_than_failing_silently(): void
    {
        $shop = $this->shop($this->creator(), 5); // in stock

        $this->postJson(route('waitlist.join'), [
            'shop_uuid' => $shop->uuid,
            'email' => 'guest@example.com',
        ])->assertStatus(422)->assertJson(['status' => false]);
    }

    public function test_a_guest_can_leave_via_the_signed_link_in_their_email(): void
    {
        $shop = $this->shop($this->creator());
        $this->service()->join($shop, null, 'guest@example.com');

        $entry = StockWaitlist::first();
        $url = StockWaitlistController::generateLeaveLink($entry->id);

        $this->get($url)->assertRedirect('/');

        $this->assertSame(0, StockWaitlist::count());
    }

    public function test_an_unsigned_leave_link_changes_nothing(): void
    {
        $shop = $this->shop($this->creator());
        $this->service()->join($shop, null, 'guest@example.com');

        $entry = StockWaitlist::first();

        $this->get(route('waitlist.leave-link', ['waitlist' => $entry->id]))->assertRedirect('/');

        $this->assertSame(1, StockWaitlist::count());
    }

    public function test_the_creator_is_told_on_the_first_joiner_but_not_on_every_join(): void
    {
        $creator = $this->creator();
        $shop = $this->shop($creator);

        // First joiner: demand now exists, and that is worth knowing.
        $this->service()->join($shop, null, 'one@example.com');
        $this->assertDatabaseHas('engagement_notifications', [
            'user_id' => $creator->id,
            'type' => 'waitlist_demand',
            'dedup_key' => "shop:{$shop->id}:1",
        ]);

        // Second, third, fourth: silence. Fifty joins must not be fifty pushes, or the
        // creator mutes the feature long before the number worth acting on arrives.
        $this->service()->join($shop, null, 'two@example.com');
        $this->service()->join($shop, null, 'three@example.com');
        $this->service()->join($shop, null, 'four@example.com');

        $this->assertSame(1, DB::table('engagement_notifications')
            ->where('type', 'waitlist_demand')->count());

        // Fifth: the next milestone.
        $this->service()->join($shop, null, 'five@example.com');
        $this->assertDatabaseHas('engagement_notifications', [
            'dedup_key' => "shop:{$shop->id}:5",
        ]);
    }

    public function test_a_milestone_can_never_notify_the_creator_twice(): void
    {
        $creator = $this->creator();
        $shop = $this->shop($creator);

        $this->service()->join($shop, null, 'one@example.com');

        // Someone leaves and rejoins, putting the count back on the same milestone.
        $this->service()->leave($shop, null, 'one@example.com');
        $this->service()->join($shop, null, 'one@example.com');

        $this->assertSame(1, DB::table('engagement_notifications')
            ->where('type', 'waitlist_demand')->count());
    }

    public function test_a_guest_cannot_remove_someone_else_from_a_waitlist(): void
    {
        $shop = $this->shop($this->creator());
        $this->service()->join($shop, null, 'victim@example.com');

        // `join` is public because the worst a stranger can do is add an address that
        // gets one unsubscribable notice. Leaving is the opposite — accepting an email
        // here would let anyone remove anyone by guessing it.
        $this->postJson(route('waitlist.leave'), [
            'shop_uuid' => $shop->uuid,
            'email' => 'victim@example.com',
        ])->assertStatus(401);

        $this->assertSame(1, StockWaitlist::count());
    }

    public function test_a_signed_in_buyer_can_leave_their_own_waitlist(): void
    {
        $buyer = User::factory()->create();
        $shop = $this->shop($this->creator());

        $this->service()->join($shop, $buyer);

        $this->actingAs($buyer)
            ->postJson(route('waitlist.leave'), ['shop_uuid' => $shop->uuid])
            ->assertOk();

        $this->assertSame(0, StockWaitlist::count());
    }

    public function test_the_notice_links_straight_to_the_item(): void
    {
        $shop = $this->shop($this->creator());

        $html = (new StockBackInStock(
            shopUuid: $shop->uuid,
            itemName: 'Studio Setup',
            creatorName: 'Test Creator',
            creatorUsername: 'testcreator',
            stock: 3,
        ))->render();

        // Landing on the creator's shop tab makes them hunt for a listing we just told
        // them is nearly gone.
        $this->assertStringContainsString('/shop/item/studio-setup/'.$shop->uuid, $html);
        $this->assertStringContainsString('3 available', $html);
        $this->assertStringNotContainsString('commat', $html);
    }

    public function test_an_account_holder_who_turned_the_emails_off_still_gets_the_bell(): void
    {
        Mail::fake();

        $buyer = User::factory()->create(['restock_emails_enabled' => false]);
        $shop = $this->shop($this->creator());

        $this->service()->join($shop, $buyer);
        $shop->update(['slot_limitation' => 1]);

        $this->assertSame(1, $this->service()->notifyRestock($shop->fresh()));

        // They asked to be told, so the entry is still consumed — the email half is
        // simply skipped. (Delivery itself is queued, so no mail is sent inline.)
        $this->assertNotNull(StockWaitlist::first()->notified_at);
    }
}
