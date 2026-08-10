<?php

namespace Tests\Feature;

use App\Models\PiggyPot;
use App\Models\Shop;
use App\Models\Task;
use App\Models\User;
use App\Services\CatalogueService;
use App\Services\CreatorActivityService;
use App\Services\CreatorSetupService;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;
use Tests\TestCase;

/**
 * Scheduled publishing.
 *
 * 🚨 The property everything else rests on: a listing with a future `publish_at` is
 * invisible to the public — including to checkout. The failure this prevents is somebody
 * buying a product that is not on sale yet, which is money moving for a launch the
 * creator has not made.
 */
class ScheduledListingTest extends TestCase
{
    use RefreshDatabase;

    /** ⚠️ Undeclared `shops` columns — see CatalogueTest. */
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
    }

    private function creator(): User
    {
        return User::factory()->create(['role' => 1, 'account_id' => 'acct_test']);
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

    public function test_a_scheduled_listing_is_invisible_to_the_public(): void
    {
        $creator = $this->creator();
        $this->shop($creator, ['name' => 'Live one']);
        $this->shop($creator, ['name' => 'Not yet', 'publish_at' => now()->addDays(3)]);

        // 🚨 The default query — the one every public surface and every checkout uses.
        $this->assertSame(1, Shop::count());
        $this->assertSame('Live one', Shop::first()->name);
    }

    public function test_checkout_cannot_find_a_scheduled_listing(): void
    {
        $creator = $this->creator();
        $scheduled = $this->shop($creator, ['publish_at' => now()->addDay()]);

        // Every buy path resolves the item by uuid first. The scope means it simply is
        // not there, which is why no checkout needed changing.
        $this->assertNull(Shop::where('uuid', $scheduled->uuid)->first());
    }

    public function test_a_listing_goes_live_on_time_without_the_publisher_running(): void
    {
        $creator = $this->creator();
        $this->shop($creator, ['name' => 'Drop', 'publish_at' => now()->addMinutes(30)]);

        $this->assertSame(0, Shop::count());

        // ⚠️ Visibility is decided by TIME, not by the command. A dead queue worker must
        // not mean a creator's launch silently fails.
        $this->travel(31)->minutes();

        $this->assertSame(1, Shop::count());
    }

    public function test_the_owner_still_sees_their_own_scheduled_listing(): void
    {
        $creator = $this->creator();
        $this->shop($creator, ['name' => 'Not yet', 'publish_at' => now()->addDays(2)]);

        $payload = app(CatalogueService::class)->for($creator);
        $row = $payload['listings']['data'][0];

        // The global scope is for the public; it must never hide a creator's work from
        // themselves — they cannot launch what they cannot see.
        $this->assertSame(1, $payload['counts']['all']);
        $this->assertSame('scheduled', $row['status']);
        $this->assertNotNull($row['publish_at']);
    }

    public function test_a_past_publish_time_is_simply_live(): void
    {
        $creator = $this->creator();
        $this->shop($creator, ['publish_at' => now()->subDay()]);

        $this->assertSame(1, Shop::count());
    }

    public function test_scheduled_never_outranks_a_real_problem(): void
    {
        $creator = $this->creator();
        $this->shop($creator, [
            'publish_at' => now()->addDay(),
            'approved' => 0,
            'moderation_reason' => 'Please re-upload the image.',
        ]);

        $row = app(CatalogueService::class)->for($creator)['listings']['data'][0];

        // A scheduled listing that is also refused is a REFUSED listing. Telling its
        // creator it goes live on Friday would be false — it goes live never, until
        // they fix it.
        $this->assertSame('rejected', $row['status']);
    }

    public function test_a_creator_can_schedule_and_unschedule_from_the_catalogue(): void
    {
        $creator = $this->creator();
        $shop = $this->shop($creator);

        $this->actingAs($creator)
            ->post(route('catalogue.schedule', ['type' => 'shop', 'id' => $shop->id]), [
                'publish_at' => now()->addDays(2)->toIso8601String(),
            ])
            ->assertRedirect();

        $this->assertSame(0, Shop::count());

        $this->actingAs($creator)
            ->post(route('catalogue.schedule', ['type' => 'shop', 'id' => $shop->id]), ['publish_at' => null])
            ->assertRedirect();

        $this->assertSame(1, Shop::count());
    }

    public function test_a_schedule_beyond_the_cap_is_refused(): void
    {
        $creator = $this->creator();
        $shop = $this->shop($creator);

        $this->actingAs($creator)
            ->postJson(route('catalogue.schedule', ['type' => 'shop', 'id' => $shop->id]), [
                'publish_at' => now()->addDays(400)->toIso8601String(),
            ])
            ->assertStatus(422);

        $this->assertSame(1, Shop::count());
    }

    public function test_another_creator_cannot_schedule_someone_elses_listing(): void
    {
        $mine = $this->creator();
        $theirs = $this->creator();
        $shop = $this->shop($theirs);

        $this->actingAs($mine)
            ->post(route('catalogue.schedule', ['type' => 'shop', 'id' => $shop->id]), [
                'publish_at' => now()->addDay()->toIso8601String(),
            ]);

        $this->assertNull($shop->fresh()->publish_at);
    }

    public function test_the_publisher_claims_each_listing_once(): void
    {
        $creator = $this->creator();
        $shop = $this->shop($creator, ['publish_at' => now()->subMinutes(5)]);

        $this->artisan('listings:publish-scheduled')->assertSuccessful();

        $this->assertNotNull($shop->fresh()->schedule_released_at);

        $releasedAt = $shop->fresh()->schedule_released_at;

        // The claim IS the update, so a second run announces nothing again.
        $this->artisan('listings:publish-scheduled')->assertSuccessful();

        $this->assertEquals($releasedAt, $shop->fresh()->schedule_released_at);
    }

    public function test_the_publisher_does_not_announce_a_listing_still_in_review(): void
    {
        $creator = $this->creator();
        $shop = $this->shop($creator, ['publish_at' => now()->subMinutes(5), 'approved' => 0]);

        $this->artisan('listings:publish-scheduled')->assertSuccessful();

        // Approval is still the gate. It is announced when an admin clears it, exactly
        // like any other listing.
        $this->assertNull($shop->fresh()->schedule_released_at);
    }

    public function test_a_dry_run_changes_nothing(): void
    {
        $creator = $this->creator();
        $shop = $this->shop($creator, ['publish_at' => now()->subMinutes(5)]);

        $this->artisan('listings:publish-scheduled --dry-run')->assertSuccessful();

        $this->assertNull($shop->fresh()->schedule_released_at);
    }

    public function test_a_scheduled_listing_still_counts_as_having_listed(): void
    {
        $creator = User::factory()->create([
            'role' => 1,
            'account_id' => 'acct_test',
            'stripe_details_submitted' => 1,
            'suspended_account' => 0,
        ]);

        $this->shop($creator, ['publish_at' => now()->addDays(2)]);

        $setup = app(CreatorSetupService::class);

        // 🚨 `candidateQuery()` closes its subqueries with toBase(), so EVERY global
        // scope applies — deliberate for soft-deletes, wrong for scheduling. Without the
        // opt-out a creator who prepared a launch is told to "publish your first item",
        // emailed the first-listing nudge, and left stuck on that step of their own
        // journey. Being asked for work you have already done is how a creator learns to
        // ignore the next message.
        $this->assertTrue($setup->hasAnyListing($creator));
        $this->assertTrue($setup->hasAnyListingFast($creator));
        $this->assertFalse($setup->needsFirstListingFast($creator));
    }

    public function test_the_content_gate_counts_a_listing_from_when_it_went_live(): void
    {
        $creator = $this->creator();

        // Drafted 25 days ago, scheduled to go live today. The 28-day content gate is
        // about whether a creator is actively putting content out — and this listing
        // becomes available to supporters NOW.
        $shop = $this->shop($creator, ['publish_at' => now()->subMinutes(5)]);
        $shop->forceFill(['created_at' => now()->subDays(25)])->saveQuietly();

        $breakdown = app(CreatorActivityService::class)->getContentBreakdown($creator);

        $this->assertSame(1, $breakdown['shops']);

        // 🚨 And the point of scheduling at all: windowed on `created_at` this listing
        // would have burned 25 of its 28 days sitting unpublished, so a creator who
        // planned a launch would be credited for three days instead of a month — the
        // gate would punish them for planning.
        $stale = $this->shop($creator, ['name' => 'Old one']);
        $stale->forceFill(['created_at' => now()->subDays(40)])->saveQuietly();

        $this->assertSame(
            1,
            app(CreatorActivityService::class)->getContentBreakdown($creator->fresh())['shops'],
            'A listing genuinely outside the window must still not count.'
        );
    }

    public function test_a_not_yet_live_listing_does_not_count_toward_the_content_gate(): void
    {
        $creator = $this->creator();
        $this->shop($creator, ['publish_at' => now()->addDays(5)]);

        // The gate exists so a supporter paying gets an actively-selling creator. A
        // listing nobody can buy yet is not that.
        $this->assertSame(
            0,
            app(CreatorActivityService::class)->getContentBreakdown($creator)['shops']
        );
    }

    public function test_every_type_carries_the_scope(): void
    {
        $creator = $this->creator();

        $task = Task::create([
            'uuid' => (string) Str::uuid(),
            'creator_id' => $creator->id,
            'title' => 'Voice note',
            'description' => 'A recording',
            'price' => 25,
            'type' => 'instant',
            'status' => 'active',
            'is_approved' => 1,
            'publish_at' => now()->addDay(),
        ]);

        $pot = PiggyPot::create([
            'uuid' => (string) Str::uuid(),
            'user_id' => $creator->id,
            'title' => 'Bundle',
            'target_amount' => 100,
            'currency' => 'gbp',
            'status' => 'active',
            'publish_at' => now()->addDay(),
        ]);

        $this->assertSame(0, Task::count());
        $this->assertSame(0, PiggyPot::count());

        // …and the owner-facing form still finds both.
        $this->assertNotNull(Task::withScheduled()->find($task->id));
        $this->assertNotNull(PiggyPot::withScheduled()->find($pot->id));
    }
}
