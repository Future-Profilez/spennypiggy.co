<?php

namespace Tests\Feature;

use App\Models\AbandonedCheckout;
use App\Models\ItemViewStat;
use App\Models\Shop;
use App\Models\ShopPayment;
use App\Models\Task;
use App\Models\User;
use App\Services\CreatorOpportunityService;
use App\Services\ItemFunnelService;
use App\Services\ItemViewTracker;
use App\Services\VisitTracker;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;
use Tests\TestCase;

/**
 * Per-listing analytics: the counting, and the honesty of the numbers.
 */
class ItemFunnelTest extends TestCase
{
    use RefreshDatabase;

    /** ⚠️ Pre-existing `shops` schema drift — see StockWaitlistTest for the full note. */
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
            if (! Schema::hasColumn('shops', 'status')) {
                $table->integer('status')->nullable();
            }
        });
    }

    private function creator(): User
    {
        return User::factory()->create(['role' => 1, 'account_id' => 'acct_test']);
    }

    private function shop(User $creator): Shop
    {
        return Shop::create([
            'uuid' => (string) Str::uuid(),
            'user_id' => $creator->id,
            'type' => 'digital',
            'name' => 'Studio Setup',
            'description' => 'Behind the scenes',
            'price' => 19.99,
            'currency' => 'gbp',
            'approved' => 1,
        ]);
    }

    private function viewRow(Shop $shop, int $views = 1, int $unique = 1, ?string $date = null): void
    {
        ItemViewStat::create([
            'item_type' => 'shop',
            'item_id' => $shop->id,
            'date' => $date ?? now()->toDateString(),
            'source' => 'direct',
            'views' => $views,
            'unique_views' => $unique,
        ]);
    }

    public function test_a_creators_own_view_is_never_counted(): void
    {
        $creator = $this->creator();
        $shop = $this->shop($creator);

        $this->actingAs($creator);

        $recorded = app(ItemViewTracker::class)->record(request(), 'shop', $shop->id, $creator->id);

        // A creator opens their own listing many times a day. Counting that turns the
        // number into a lie — and it is the number they are meant to act on.
        $this->assertFalse($recorded);
        $this->assertSame(0, ItemViewStat::count());
    }

    public function test_a_bot_is_never_counted(): void
    {
        $shop = $this->shop($this->creator());

        $request = request();
        $request->headers->set('User-Agent', 'Mozilla/5.0 (compatible; Googlebot/2.1)');

        $this->assertFalse(app(ItemViewTracker::class)->record($request, 'shop', $shop->id, null));
        $this->assertSame(0, ItemViewStat::count());
    }

    public function test_a_view_is_counted_once_per_person_per_day_but_visits_still_add_up(): void
    {
        $shop = $this->shop($this->creator());
        $tracker = app(ItemViewTracker::class);

        $request = request();
        $request->cookies->set(VisitTracker::VISITOR_COOKIE, 'visitor-token-1');

        $tracker->record($request, 'shop', $shop->id, null);
        $tracker->record($request, 'shop', $shop->id, null);
        $tracker->record($request, 'shop', $shop->id, null);

        // The write is deferred with afterResponse() so it never sits between the
        // visitor and the page. In a test there is no response cycle, so the
        // terminating callbacks have to be run by hand.
        $this->app->terminate();

        $row = ItemViewStat::first();

        $this->assertSame(3, $row->views, 'Every page view counts.');
        $this->assertSame(1, $row->unique_views, 'The same person on the same day is one viewer.');
    }

    public function test_an_unsupported_type_is_ignored(): void
    {
        $this->assertFalse(app(ItemViewTracker::class)->record(request(), 'membership', 1, null));
        $this->assertSame(0, ItemViewStat::count());
    }

    public function test_the_funnel_counts_seen_started_and_sold(): void
    {
        $creator = $this->creator();
        $shop = $this->shop($creator);

        $this->viewRow($shop, views: 40, unique: 25);

        // Two people reached the payment screen. `abandoned_checkouts` records EVERY
        // checkout, not only the abandoned ones, so it is the honest "got as far as
        // paying" count.
        foreach (['cs_a', 'cs_b'] as $session) {
            AbandonedCheckout::create([
                'session_id' => $session,
                'checkout_url' => 'https://checkout.stripe.com/c/pay/'.$session,
                'product_type' => 'shop',
                'item_id' => (string) $shop->id,
                'creator_id' => $creator->id,
            ]);
        }

        ShopPayment::create([
            'session_id' => 'cs_a',
            'shop_id' => $shop->id,
            'amount' => 19.99,
            'currency' => 'gbp',
            'payment_status' => 'paid',
        ]);

        $funnel = app(ItemFunnelService::class)->forItems('shop', [$shop->id])[$shop->id];

        $this->assertSame(40, $funnel['views']);
        $this->assertSame(25, $funnel['viewers']);
        $this->assertSame(2, $funnel['started']);
        $this->assertSame(1, $funnel['sold']);
        $this->assertSame(8.0, $funnel['view_to_checkout']);
        $this->assertSame(50.0, $funnel['checkout_to_sale']);
        $this->assertSame(4.0, $funnel['view_to_sale']);
    }

    public function test_an_unpaid_checkout_is_not_counted_as_a_sale(): void
    {
        $creator = $this->creator();
        $shop = $this->shop($creator);

        ShopPayment::create([
            'session_id' => 'cs_unpaid',
            'shop_id' => $shop->id,
            'amount' => 19.99,
            'currency' => 'gbp',
            'payment_status' => 'unpaid',
        ]);

        $funnel = app(ItemFunnelService::class)->forItems('shop', [$shop->id])[$shop->id];

        $this->assertSame(0, $funnel['sold']);
    }

    public function test_rates_are_null_not_zero_when_nobody_looked(): void
    {
        $shop = $this->shop($this->creator());

        $funnel = app(ItemFunnelService::class)->forItems('shop', [$shop->id])[$shop->id];

        // "Nobody looked" and "everyone who looked left" are different findings.
        // Reporting both as 0% hides the one worth acting on.
        $this->assertNull($funnel['view_to_checkout']);
        $this->assertNull($funnel['view_to_sale']);
        $this->assertFalse($funnel['has_view_data']);
    }

    public function test_zero_views_reads_as_unknown_before_tracking_covered_the_window(): void
    {
        $shop = $this->shop($this->creator());

        // Nothing has ever been recorded, so there is no basis for saying nobody looked.
        $funnel = app(ItemFunnelService::class)->forItems('shop', [$shop->id])[$shop->id];

        $this->assertSame('unknown', $funnel['view_state']);
    }

    public function test_zero_views_reads_as_nobody_looked_once_tracking_covers_the_window(): void
    {
        $creator = $this->creator();
        $seen = $this->shop($creator);
        $ignored = $this->shop($creator);

        // Tracking has been running since before the window opened — proven by another
        // listing having been viewed back then.
        $this->viewRow($seen, date: now()->subDays(60)->toDateString());

        $funnel = app(ItemFunnelService::class)->forItems('shop', [$ignored->id], 30)[$ignored->id];

        // THIS is the finding the whole feature exists for: the listing is not being
        // found at all. Collapsing it into "no data" hides a distribution problem.
        $this->assertSame('none', $funnel['view_state']);
    }

    public function test_a_viewed_listing_reads_as_ok(): void
    {
        $creator = $this->creator();
        $shop = $this->shop($creator);

        $this->viewRow($shop, views: 9, unique: 6, date: now()->subDays(60)->toDateString());
        $this->viewRow($shop, views: 4, unique: 3);

        $funnel = app(ItemFunnelService::class)->forItems('shop', [$shop->id], 30)[$shop->id];

        $this->assertSame('ok', $funnel['view_state']);
        $this->assertSame(3, $funnel['viewers'], 'Only the window counts, not all history.');
    }

    public function test_the_window_excludes_older_activity(): void
    {
        $creator = $this->creator();
        $shop = $this->shop($creator);

        $this->viewRow($shop, views: 5, unique: 5, date: now()->subDays(90)->toDateString());
        $this->viewRow($shop, views: 2, unique: 2);

        $funnel = app(ItemFunnelService::class)->forItems('shop', [$shop->id], 30)[$shop->id];

        $this->assertSame(2, $funnel['views'], 'Only the reporting window counts.');
    }

    public function test_an_unapproved_task_gets_no_funnel_at_all(): void
    {
        $creator = $this->creator();

        $live = Task::create([
            'uuid' => (string) Str::uuid(),
            'creator_id' => $creator->id,
            'title' => 'Live task',
            'description' => 'Public',
            'price' => 25,
            'currency' => 'gbp',
            'category' => 'audio',
            'type' => 'instant',
            'status' => 'active',
            'is_approved' => true,
        ]);

        $pending = Task::create([
            'uuid' => (string) Str::uuid(),
            'creator_id' => $creator->id,
            'title' => 'Pending task',
            'description' => 'Not public yet',
            'price' => 25,
            'currency' => 'gbp',
            'category' => 'audio',
            'type' => 'instant',
            'status' => 'active',
            'is_approved' => false,
        ]);

        // An unapproved task's page 404s for the public, so it has no views by
        // definition. Telling the creator "nobody found this, share the link" would be
        // advice they cannot act on.
        $response = $this->actingAs($creator)->get(route('task.dashboard'))->assertOk();
        $payload = $response->viewData('page')['props']['tasks'];

        $byId = collect($payload)->keyBy('id');

        $this->assertNull($byId[$pending->id]['funnel']);
        $this->assertNotNull($byId[$live->id]['funnel']);
    }

    public function test_the_funnel_reports_where_the_viewers_came_from(): void
    {
        $shop = $this->shop($this->creator());

        // Tracking has to have covered the window, or sources are deliberately not
        // computed — there is nothing trustworthy to attribute.
        $this->viewRow($shop, views: 1, unique: 1, date: now()->subDays(60)->toDateString());

        ItemViewStat::create(['item_type' => 'shop', 'item_id' => $shop->id, 'date' => now()->toDateString(), 'source' => 'creator_share', 'views' => 9, 'unique_views' => 6]);
        ItemViewStat::create(['item_type' => 'shop', 'item_id' => $shop->id, 'date' => now()->toDateString(), 'source' => 'direct', 'views' => 3, 'unique_views' => 2]);

        $funnel = app(ItemFunnelService::class)->forItems('shop', [$shop->id])[$shop->id];

        // Without this the creator cannot tell whether the link they shared did
        // anything — the question the share tagging exists to answer.
        $this->assertSame('creator_share', $funnel['sources'][0]['source']);
        $this->assertSame(6, $funnel['sources'][0]['viewers']);
        $this->assertSame('direct', $funnel['sources'][1]['source']);
    }

    public function test_pruning_clears_the_tracking_start_cache(): void
    {
        $shop = $this->shop($this->creator());
        $tracker = app(ItemViewTracker::class);

        $this->viewRow($shop, date: now()->subDays(500)->toDateString());
        $this->viewRow($shop, date: now()->subDays(5)->toDateString());

        // Warm the cache with the old date.
        $this->assertSame(now()->subDays(500)->toDateString(), $tracker->trackingSince());

        $tracker->prune();

        // A stale value here would answer "were we counting yet?" wrongly, and a zero
        // would read as "nobody looked" when tracking simply had not started.
        $this->assertSame(now()->subDays(5)->toDateString(), $tracker->trackingSince());
    }

    public function test_prune_removes_only_rows_past_retention(): void
    {
        $shop = $this->shop($this->creator());

        $this->viewRow($shop, date: now()->subDays(500)->toDateString());
        $this->viewRow($shop, date: now()->subDays(10)->toDateString());

        $this->assertSame(1, app(ItemViewTracker::class)->prune());
        $this->assertSame(1, ItemViewStat::count());
    }

    public function test_prune_dry_run_counts_without_deleting(): void
    {
        $shop = $this->shop($this->creator());
        $this->viewRow($shop, date: now()->subDays(500)->toDateString());

        $this->artisan('item-views:prune --dry-run')->assertSuccessful();

        $this->assertSame(1, ItemViewStat::count());
    }

    public function test_rejected_task_is_hidden_from_public_and_cannot_be_purchased(): void
    {
        $creator = $this->creator();
        $buyer = User::factory()->create();

        $rejectedTask = Task::create([
            'uuid' => (string) Str::uuid(),
            'creator_id' => $creator->id,
            'title' => 'Rejected task',
            'description' => 'Unacceptable task',
            'price' => 25,
            'currency' => 'gbp',
            'category' => 'audio',
            'type' => 'instant',
            'status' => 'active',
            'is_approved' => 2, // 2 = Rejected
        ]);

        // Non-creator gets 404 on show
        $this->actingAs($buyer)->get(route('task.show', $rejectedTask->uuid))->assertStatus(404);

        // Non-creator gets 404 on purchase attempt
        $this->actingAs($buyer)->post(route('task.purchase', $rejectedTask->uuid))->assertStatus(404);

        // Creator can view their own rejected task
        $this->actingAs($creator)->get(route('task.show', $rejectedTask->uuid))->assertStatus(200);
    }

    public function test_opportunities_listing_performance_excludes_unapproved_deactivated_or_suspended_items(): void
    {
        $creator = $this->creator();

        // 1. Unapproved shop
        Shop::create([
            'uuid' => (string) Str::uuid(),
            'user_id' => $creator->id,
            'type' => 'digital',
            'name' => 'Unapproved Shop',
            'description' => 'Not approved',
            'price' => 19.99,
            'currency' => 'gbp',
            'approved' => 0, // Not approved
        ]);

        // 2. Deactivated shop (status = 0)
        Shop::create([
            'uuid' => (string) Str::uuid(),
            'user_id' => $creator->id,
            'type' => 'digital',
            'name' => 'Deactivated Shop',
            'description' => 'Not active',
            'price' => 19.99,
            'currency' => 'gbp',
            'approved' => 1,
            'status' => 0, // Deactivated
        ]);

        // 3. Suspended shop
        Shop::create([
            'uuid' => (string) Str::uuid(),
            'user_id' => $creator->id,
            'type' => 'digital',
            'name' => 'Suspended Shop',
            'description' => 'Suspended',
            'price' => 19.99,
            'currency' => 'gbp',
            'approved' => 1,
            'status' => 1,
            'is_suspended' => 1, // Suspended
        ]);

        // 4. Approved, active shop (should be included)
        $approvedShop = Shop::create([
            'uuid' => (string) Str::uuid(),
            'user_id' => $creator->id,
            'type' => 'digital',
            'name' => 'Approved Active Shop',
            'description' => 'Perfect',
            'price' => 19.99,
            'currency' => 'gbp',
            'approved' => 1,
            'status' => 1,
            'is_suspended' => 0,
        ]);

        // 5. Rejected task
        Task::create([
            'uuid' => (string) Str::uuid(),
            'creator_id' => $creator->id,
            'title' => 'Rejected task',
            'description' => 'Unacceptable task',
            'price' => 25,
            'currency' => 'gbp',
            'category' => 'audio',
            'type' => 'instant',
            'status' => 'active',
            'is_approved' => 2, // Rejected
        ]);

        // 6. Approved, active task (should be included)
        $approvedTask = Task::create([
            'uuid' => (string) Str::uuid(),
            'creator_id' => $creator->id,
            'title' => 'Approved Task',
            'description' => 'Perfect task',
            'price' => 25,
            'currency' => 'gbp',
            'category' => 'audio',
            'type' => 'instant',
            'status' => 'active',
            'is_approved' => 1,
            'is_suspended' => 0,
        ]);

        // We record a view for the approved shop to make sure viewState is not unknown,
        // and we have some view rows so that viewState is evaluated.
        $this->viewRow($approvedShop, views: 1, unique: 1);
        $this->viewRow($approvedShop, date: now()->subDays(40)->toDateString()); // to cover window

        $opps = app(CreatorOpportunityService::class)->listingPerformance($creator);

        // Stuck listings list should contain the approved task and approved shop, but NOT the others.
        $stuckTitles = collect($opps['stuck'])->pluck('title')->all();

        $this->assertContains('Approved Active Shop', $stuckTitles);
        $this->assertContains('Approved Task', $stuckTitles);
        $this->assertNotContains('Unapproved Shop', $stuckTitles);
        $this->assertNotContains('Deactivated Shop', $stuckTitles);
        $this->assertNotContains('Suspended Shop', $stuckTitles);
        $this->assertNotContains('Rejected task', $stuckTitles);
    }
}
