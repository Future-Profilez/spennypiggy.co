<?php

namespace Tests\Feature;

use App\Jobs\SendEngagementNotification;
use App\Models\Bills;
use App\Models\Membership;
use App\Models\MonthlyCharge;
use App\Models\PiggyPot;
use App\Models\Shop;
use App\Models\SocialLinks;
use App\Models\Task;
use App\Models\User;
use App\Models\WishItem;
use App\Services\CreatorSetupService;
use App\Services\NotificationDispatcher;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Queue;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;
use Tests\TestCase;

class FirstListingNudgeTest extends TestCase
{
    use RefreshDatabase;

    /** ⚠️ Compensate for pre-existing shops schema drift in SQLite tests. */
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

        Schema::table('memberships', function (Blueprint $table) {
            if (! Schema::hasColumn('memberships', 'level')) {
                $table->string('level')->nullable();
            }
            if (! Schema::hasColumn('memberships', 'price')) {
                $table->double('price')->nullable();
            }
        });
    }

    private function creator(array $overrides = []): User
    {
        return User::factory()->create(array_merge([
            'role' => 1,
            'stripe_details_submitted' => 1,
            'suspended_account' => 0,
            'email_verified_at' => now(),
            // Identity is a hard precondition for listing anything, so it is part of the
            // baseline "eligible creator" rather than something each test sets.
            'identity_status' => 1,
        ], $overrides));
    }

    public function test_creator_without_stripe_connected_does_not_need_first_listing(): void
    {
        $creator = $this->creator(['stripe_details_submitted' => 0]);
        $service = app(CreatorSetupService::class);

        $this->assertFalse($service->needsFirstListing($creator));
    }

    public function test_creator_without_identity_does_not_need_first_listing(): void
    {
        // They are blocked from listing by `mustCompletedStripeIdentity`, so asking them
        // to publish sends them to a wall. `creators:nudge-journey` chases the identity
        // check itself instead.
        $creator = $this->creator(['identity_status' => 0]);
        $service = app(CreatorSetupService::class);

        $this->assertFalse($service->needsFirstListing($creator));
    }

    public function test_suspended_creator_does_not_need_first_listing(): void
    {
        $creator = $this->creator(['suspended_account' => 1]);
        $service = app(CreatorSetupService::class);

        $this->assertFalse($service->needsFirstListing($creator));
    }

    public static function listingTypeProvider(): array
    {
        return [
            'WishItem' => [
                'model' => WishItem::class,
                'fieldsCallback' => fn ($creator) => [
                    'user_id' => $creator->id,
                    'wishname' => 'My Wish',
                    'price' => 10,
                    'is_approved' => 1,
                    'subscription' => 0,
                ],
            ],
            'Shop' => [
                'model' => Shop::class,
                'fieldsCallback' => fn ($creator) => [
                    'user_id' => $creator->id,
                    'uuid' => (string) Str::uuid(),
                    'name' => 'My Shop Product',
                    'price' => 10,
                    'approved' => 1,
                ],
            ],
            'Task' => [
                'model' => Task::class,
                'fieldsCallback' => fn ($creator) => [
                    'creator_id' => $creator->id,
                    'uuid' => (string) Str::uuid(),
                    'title' => 'My Task',
                    'price' => 10,
                    'is_approved' => 1,
                    'category' => 'audio',
                    'type' => 'instant',
                ],
            ],
            'PiggyPot' => [
                'model' => PiggyPot::class,
                'fieldsCallback' => fn ($creator) => [
                    'user_id' => $creator->id,
                    'uuid' => (string) Str::uuid(),
                    'title' => 'My Pot',
                    'target_amount' => 100,
                ],
            ],
            'Bills' => [
                'model' => Bills::class,
                'fieldsCallback' => fn ($creator) => [
                    'user_id' => $creator->id,
                    'uuid' => (string) Str::uuid(),
                    'name' => 'My Bill',
                    'price' => 10,
                ],
            ],
            'Membership' => [
                'model' => Membership::class,
                'fieldsCallback' => fn ($creator) => [
                    'user_id' => $creator->id,
                    'level' => 'Gold Level',
                    'name' => 'Gold Level',
                    'price' => 10,
                    'approved' => 1,
                ],
            ],
        ];
    }

    /**
     * @dataProvider listingTypeProvider
     */
    public function test_each_listing_type_stops_the_nudge(string $model, \Closure $fieldsCallback): void
    {
        $creator = $this->creator();
        $service = app(CreatorSetupService::class);

        // Initially needs a first listing
        $this->assertTrue($service->needsFirstListing($creator));

        // Create the listing
        $fields = $fieldsCallback($creator);
        $instance = new $model;
        foreach ($fields as $key => $val) {
            $instance->{$key} = $val;
        }
        $instance->save();

        // Nudge should now stop
        $this->assertFalse($service->needsFirstListing($creator));
    }

    public function test_unapproved_listing_still_counts_as_published(): void
    {
        $creator = $this->creator();
        $service = app(CreatorSetupService::class);

        // Unapproved task (is_approved = 0)
        Task::create([
            'creator_id' => $creator->id,
            'uuid' => (string) Str::uuid(),
            'title' => 'Unapproved Task',
            'price' => 10,
            'is_approved' => 0, // Unapproved
            'category' => 'audio',
            'type' => 'instant',
        ]);

        $this->assertFalse($service->needsFirstListing($creator));
    }

    public function test_deleting_only_listing_brings_the_nudge_back(): void
    {
        $creator = $this->creator();
        $service = app(CreatorSetupService::class);

        $task = Task::create([
            'creator_id' => $creator->id,
            'uuid' => (string) Str::uuid(),
            'title' => 'Temporary Task',
            'price' => 10,
            'is_approved' => 1,
            'category' => 'audio',
            'type' => 'instant',
        ]);

        // Published, nudge is gone
        $this->assertFalse($service->needsFirstListing($creator));

        // Soft delete the listing
        $task->delete();

        // Nudge should return
        $this->assertTrue($service->needsFirstListing($creator));
    }

    /**
     * The shared prop is `auth.journey` — `auth.needs_first_listing` was retired once the
     * journey answered the same question and more, and it cost its own query on every
     * Inertia navigation to say less.
     */
    public function test_the_shared_journey_prop_reflects_the_first_listing_step(): void
    {
        // ⚠️ The journey gates on MORE than the retired prop did: it checks an approved
        // profile and a verified identity before it ever reaches the listing step. A creator
        // who has only connected Stripe sits on `profile`, not `first_listing`.
        $creator = $this->creator([
            'avatar' => 'uuid',
            'avatar_approved' => 1,
            'bio' => 'Hello',
            'bio_approved' => 1,
            // Approved and live — the `review` step (31 Aug 2026) reads the lock.
            'profile_status_lock' => 2,
            'identity_status' => 1,
        ]);

        // A social handle is its own step now (31 Aug 2026).
        SocialLinks::create(['user_id' => $creator->id, 'uuid' => (string) Str::uuid(), 'instagram' => 'spenny']);

        // A card on file is its own step and sits before Connect (4 Aug 2026).
        MonthlyCharge::create([
            'user_id' => $creator->id,
            'uuid' => (string) Str::uuid(),
            'status' => 'trialing',
            'amount' => 8.99,
            'currency' => 'GBP',
        ]);

        $this->actingAs($creator->fresh())
            ->followingRedirects()
            ->get(route('dashboard'))
            ->assertOk()
            ->assertInertia(fn ($page) => $page->where('auth.journey.key', 'first_listing'));

        WishItem::create([
            'user_id' => $creator->id,
            'wishname' => 'Wish list',
            'price' => 50,
            'is_approved' => 1,
            'subscription' => 0,
        ]);

        // Publishing moves them off the step; the card and the bar follow the same payload.
        $this->actingAs($creator)
            ->followingRedirects()
            ->get(route('dashboard'))
            ->assertOk()
            ->assertInertia(fn ($page) => $page->where('auth.journey.key', 'first_post'));
    }

    public function test_console_command_nudge_progression_at_day_3_and_10(): void
    {
        // 1. Day 2 connected — does not send
        $creator2 = $this->creator(['stripe_connected_at' => now()->subDays(2)->toDateTimeString()]);

        // 2. Day 3 connected — sends stage 3
        $creator3 = $this->creator(['stripe_connected_at' => now()->subDays(3)->toDateTimeString()]);

        // 3. Day 5 connected — sends stage 3
        $creator5 = $this->creator(['stripe_connected_at' => now()->subDays(5)->toDateTimeString()]);

        // 4. Day 10 connected — sends stage 10
        $creator10 = $this->creator(['stripe_connected_at' => now()->subDays(10)->toDateTimeString()]);

        $this->artisan('creators:nudge-first-listing')
            ->expectsOutputToContain('Processed 4 creators · nudged 3 · skipped 1')
            ->assertSuccessful();

        // Running again should skip all (since claims exist)
        $this->artisan('creators:nudge-first-listing')
            ->expectsOutputToContain('Processed 4 creators · nudged 0 · skipped 4')
            ->assertSuccessful();
    }

    public function test_dry_run_does_not_claim_or_send(): void
    {
        $creator = $this->creator(['stripe_connected_at' => now()->subDays(3)->toDateTimeString()]);

        // Dry-run should report but not send
        $this->artisan('creators:nudge-first-listing --dry-run')
            ->expectsOutputToContain('Processed 1 creators · nudged 1 · skipped 0')
            ->assertSuccessful();

        // Since it was a dry-run, a second dry-run (or normal run) still nudges because no claim was stored
        $this->artisan('creators:nudge-first-listing')
            ->expectsOutputToContain('Processed 1 creators · nudged 1 · skipped 0')
            ->assertSuccessful();
    }

    public function test_backfill_sends_exactly_one_email_for_very_old_creator(): void
    {
        // Creator set up 90 days ago
        $oldCreator = $this->creator(['stripe_connected_at' => now()->subDays(90)->toDateTimeString()]);

        // First run sends stage 10 nudge
        $this->artisan('creators:nudge-first-listing')
            ->expectsOutputToContain('Nudged creator #'.$oldCreator->id.' ('.$oldCreator->email.') at stage 10.')
            ->assertSuccessful();

        // Second run sends nothing because nudge:10 claim already exists (nudge:3 is not sent to very old creators)
        $this->artisan('creators:nudge-first-listing')
            ->expectsOutputToContain('Processed 1 creators · nudged 0 · skipped 1')
            ->assertSuccessful();
    }

    /**
     * ⚠️ Every other test in this file asserts the command's console output. That proves the
     * counters moved, not that anything was delivered — a dispatcher call that silently did
     * nothing would still print "nudged 1".
     */
    public function test_a_nudge_claims_the_key_and_queues_a_delivery(): void
    {
        Queue::fake();

        $creator = $this->creator(['stripe_connected_at' => now()->subDays(3)->toDateTimeString()]);

        $this->artisan('creators:nudge-first-listing')->assertSuccessful();

        $this->assertDatabaseHas('engagement_notifications', [
            'user_id' => $creator->id,
            'type' => 'first_listing',
            'dedup_key' => 'nudge:3',
        ]);

        Queue::assertPushed(
            SendEngagementNotification::class,
            fn ($job) => $job->userId === $creator->id
                && $job->type === 'first_listing'
                && $job->marketing === false
                && in_array(NotificationDispatcher::CHANNEL_EMAIL, $job->channels, true)
        );
    }

    public function test_dry_run_writes_no_claim_and_queues_nothing(): void
    {
        Queue::fake();

        $this->creator(['stripe_connected_at' => now()->subDays(3)->toDateTimeString()]);

        $this->artisan('creators:nudge-first-listing --dry-run')->assertSuccessful();

        $this->assertDatabaseCount('engagement_notifications', 0);
        Queue::assertNothingPushed();
    }

    /**
     * The existing progression test uses four separate creators, so it never proved that ONE
     * creator receives both nudges — which is the whole cadence.
     */
    public function test_the_same_creator_receives_stage_3_then_stage_10(): void
    {
        $creator = $this->creator(['stripe_connected_at' => now()->subDays(3)->toDateTimeString()]);

        $this->artisan('creators:nudge-first-listing')->assertSuccessful();

        // Day 4: still stage 3, already claimed — nothing goes out.
        $this->travel(1)->days();
        $this->artisan('creators:nudge-first-listing')
            ->expectsOutputToContain('nudged 0 · skipped 1')
            ->assertSuccessful();

        // Day 10: the second nudge is due.
        $this->travel(6)->days();
        $this->artisan('creators:nudge-first-listing')
            ->expectsOutputToContain('at stage 10')
            ->assertSuccessful();

        $this->assertDatabaseHas('engagement_notifications', [
            'user_id' => $creator->id, 'type' => 'first_listing', 'dedup_key' => 'nudge:3',
        ]);
        $this->assertDatabaseHas('engagement_notifications', [
            'user_id' => $creator->id, 'type' => 'first_listing', 'dedup_key' => 'nudge:10',
        ]);

        // And then it stops. Two is a nudge; more is nagging.
        $this->travel(30)->days();
        $this->artisan('creators:nudge-first-listing')
            ->expectsOutputToContain('nudged 0 · skipped 1')
            ->assertSuccessful();
    }

    /**
     * ⚠️ `$marketing = false` bypasses the consent gate, so the preference has to be honoured
     * by the command or the unsubscribe link in the email is decorative.
     */
    public function test_opting_out_of_creator_updates_drops_only_the_email_channel(): void
    {
        Queue::fake();

        $creator = $this->creator([
            'stripe_connected_at' => now()->subDays(3)->toDateTimeString(),
            'creator_updates_enabled' => false,
        ]);

        $this->artisan('creators:nudge-first-listing')->assertSuccessful();

        Queue::assertPushed(
            SendEngagementNotification::class,
            fn ($job) => $job->userId === $creator->id
                && ! in_array(NotificationDispatcher::CHANNEL_EMAIL, $job->channels, true)
                && in_array(NotificationDispatcher::CHANNEL_BELL, $job->channels, true)
                && in_array(NotificationDispatcher::CHANNEL_PUSH, $job->channels, true)
        );
    }

    /** A future connection date must not read as "connected long ago" and fire immediately. */
    public function test_a_future_stripe_connected_at_is_never_nudged(): void
    {
        $this->creator(['stripe_connected_at' => now()->addDays(30)->toDateTimeString()]);

        $this->artisan('creators:nudge-first-listing')
            ->expectsOutputToContain('nudged 0 · skipped 1')
            ->assertSuccessful();

        $this->assertDatabaseCount('engagement_notifications', 0);
    }

    /** `--max` caps creators NUDGED, not creators looked at. */
    public function test_max_caps_nudges_rather_than_rows_examined(): void
    {
        foreach ([5, 6, 7] as $days) {
            $this->creator(['stripe_connected_at' => now()->subDays($days)->toDateTimeString()]);
        }

        $this->artisan('creators:nudge-first-listing --max=2')
            ->expectsOutputToContain('nudged 2')
            ->assertSuccessful();

        $this->assertDatabaseCount('engagement_notifications', 2);

        // The one that was left over is still reachable on the next run.
        $this->artisan('creators:nudge-first-listing --max=2')
            ->expectsOutputToContain('nudged 1')
            ->assertSuccessful();

        $this->assertDatabaseCount('engagement_notifications', 3);
    }
}
