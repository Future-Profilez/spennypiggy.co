<?php

namespace Tests\Feature;

use App\Models\MonthlyCharge;
use App\Models\SocialLinks;
use App\Models\Task;
use App\Models\User;
use App\Services\CreatorJourneyService;
use App\Services\CreatorSetupService;
use App\Support\SetupCelebrationPayload;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Str;
use Tests\TestCase;

/**
 * The one-time "your setup is done" celebration.
 *
 * The rules worth pinning are the ones nothing else can see: that it fires on the SIX setup
 * steps rather than on the journey finishing, that it is spent exactly once, that an admin
 * emulating a creator cannot spend it, and that a creator who regresses is not congratulated
 * a second time.
 */
class SetupCelebrationTest extends TestCase
{
    use RefreshDatabase;

    private function creator(array $overrides = []): User
    {
        return User::factory()->create(array_merge([
            'role' => 1,
            'suspended_account' => 0,
            'avatar' => 'uuid',
            'bio' => 'Hello',
            'avatar_approved' => 1,
            'bio_approved' => 1,
            'profile_status_lock' => 2,
            'stripe_details_submitted' => 1,
            'identity_status' => 1,
            'setup_celebrated_at' => null,
        ], $overrides));
    }

    /** Every setup step done, nothing listed, posted or sold. */
    private function setUpCreator(array $overrides = []): User
    {
        $creator = $this->creator($overrides);

        SocialLinks::create([
            'user_id' => $creator->id,
            'uuid' => (string) Str::uuid(),
            'instagram' => 'spenny',
        ]);

        MonthlyCharge::create([
            'user_id' => $creator->id,
            'uuid' => (string) Str::uuid(),
            'status' => 'trialing',
            'amount' => 8.99,
            'currency' => 'GBP',
        ]);

        return $creator->fresh();
    }

    private function listing(User $creator): Task
    {
        return Task::create([
            'creator_id' => $creator->id,
            'uuid' => (string) Str::uuid(),
            'title' => 'A task',
            'price' => 10,
            'is_approved' => 1,
            'category' => 'audio',
            'type' => 'instant',
        ]);
    }

    /**
     * 🚨 THE WHOLE POINT OF THE FEATURE. `STEP_DONE` needs `first_sale`, which depends on a
     * supporter — so reading it for this moment would congratulate a creator only after
     * somebody had already bought something. The celebration fires six steps earlier.
     */
    public function test_setup_is_complete_before_the_journey_is(): void
    {
        $creator = $this->setUpCreator();
        $journey = app(CreatorJourneyService::class);

        $this->assertTrue($journey->setupComplete($creator));
        $this->assertNotSame(CreatorJourneyService::STEP_DONE, $journey->currentStep($creator));
    }

    public function test_a_creator_mid_setup_is_not_celebrated(): void
    {
        // Identity outstanding — the last setup step, and the one that gates listing.
        $creator = $this->setUpCreator(['identity_status' => 0]);

        $this->assertFalse(app(CreatorJourneyService::class)->setupComplete($creator));
        $this->assertNull(SetupCelebrationPayload::for($creator));
    }

    public function test_a_suspended_creator_is_never_celebrated(): void
    {
        $creator = $this->setUpCreator(['suspended_account' => 1]);

        $this->assertNull(SetupCelebrationPayload::for($creator));
    }

    public function test_a_fan_is_never_celebrated(): void
    {
        $fan = $this->setUpCreator(['role' => 0]);

        $this->assertNull(SetupCelebrationPayload::for($fan));
    }

    public function test_a_ready_creator_is_celebrated_and_told_the_target(): void
    {
        $creator = $this->setUpCreator();

        $payload = SetupCelebrationPayload::for($creator);

        $this->assertTrue($payload['celebrate']);
        $this->assertTrue($payload['show_progress']);
        $this->assertSame(0, $payload['listings']);
        $this->assertSame(config('creator_setup.listings_target'), $payload['target']);
        $this->assertSame($payload['target'], $payload['remaining']);
    }

    /**
     * 🚨 An admin opening a creator's page must not spend the one celebration that creator
     * is ever going to get — there is no way to give it back.
     */
    public function test_an_emulating_admin_does_not_spend_the_celebration(): void
    {
        $creator = $this->setUpCreator();

        $payload = SetupCelebrationPayload::for($creator, true);

        $this->assertFalse($payload['celebrate']);
        // The progress strip still reads, because it writes nothing.
        $this->assertTrue($payload['show_progress']);
    }

    public function test_the_endpoint_records_it_once_and_is_idempotent(): void
    {
        $creator = $this->setUpCreator();

        $this->actingAs($creator)
            ->postJson(route('creator.setup-celebration.seen'))
            ->assertOk()
            ->assertJson(['ok' => true]);

        $first = $creator->fresh()->setup_celebrated_at;
        $this->assertNotNull($first);

        // A second tab, or a double tap. Not an error, and NOT re-dated.
        $this->actingAs($creator)
            ->postJson(route('creator.setup-celebration.seen'))
            ->assertOk()
            ->assertJson(['ok' => true]);

        $this->assertEquals($first, $creator->fresh()->setup_celebrated_at);
    }

    /**
     * ⚠️ `updated_at` keys the public profile cache and ORDERS the admin creator-review
     * queue. A creator opening a popup must not expire their own cache or jump that queue —
     * which is exactly what `save()` and `saveQuietly()` would both have done.
     */
    public function test_recording_it_does_not_re_date_the_profile(): void
    {
        $creator = $this->setUpCreator();
        $before = $creator->fresh()->updated_at;

        $this->travel(2)->minutes();

        $this->actingAs($creator)->postJson(route('creator.setup-celebration.seen'))->assertOk();

        $this->assertEquals($before, $creator->fresh()->updated_at);
    }

    /**
     * 🚨 The state is re-checked server-side. Without it any signed-in creator could
     * permanently silence a message they have not been shown yet with a bare POST.
     */
    public function test_a_creator_mid_setup_cannot_spend_their_own_celebration(): void
    {
        $creator = $this->setUpCreator(['identity_status' => 0]);

        $this->actingAs($creator)
            ->postJson(route('creator.setup-celebration.seen'))
            ->assertOk()
            ->assertJson(['ok' => false]);

        $this->assertNull($creator->fresh()->setup_celebrated_at);
    }

    public function test_once_seen_it_never_fires_again(): void
    {
        $creator = $this->setUpCreator(['setup_celebrated_at' => now()]);

        $payload = SetupCelebrationPayload::for($creator);

        $this->assertFalse($payload['celebrate']);
    }

    /**
     * ⚠️ Write-once, like `journey_completed_at` beside it. A creator who finishes, is told,
     * and then regresses has still been told; re-running the confetti reads as the platform
     * having forgotten.
     */
    public function test_a_creator_who_regresses_is_not_celebrated_twice(): void
    {
        $creator = $this->setUpCreator();

        $this->actingAs($creator)->postJson(route('creator.setup-celebration.seen'))->assertOk();

        // Profile demoted back to review, then approved again.
        $creator->forceFill(['profile_status_lock' => 1])->saveQuietly();
        $creator->forceFill(['profile_status_lock' => 2])->saveQuietly();

        $this->assertFalse(SetupCelebrationPayload::for($creator->fresh())['celebrate']);
    }

    public function test_the_progress_strip_counts_listings_and_stops_at_the_target(): void
    {
        $creator = $this->setUpCreator(['setup_celebrated_at' => now()]);
        $target = (int) config('creator_setup.listings_target');

        $this->listing($creator);
        $payload = SetupCelebrationPayload::for($creator->fresh());
        $this->assertSame(1, $payload['listings']);
        $this->assertTrue($payload['show_progress']);
        $this->assertSame($target - 1, $payload['remaining']);

        for ($i = 1; $i < $target; $i++) {
            $this->listing($creator);
        }

        // Target met and the celebration already spent: there is nothing left to draw.
        $this->assertNull(SetupCelebrationPayload::for($creator->fresh()));
    }

    /** The count spans every listing table, not just the one the fixture happens to use. */
    public function test_the_listing_count_matches_the_has_any_check(): void
    {
        $creator = $this->setUpCreator();
        $setup = app(CreatorSetupService::class);

        $this->assertSame(0, $setup->listingCount($creator));
        $this->assertFalse($setup->hasAnyListingFast($creator));

        $this->listing($creator);

        $this->assertSame(1, $setup->listingCount($creator->fresh()));
        $this->assertTrue($setup->hasAnyListingFast($creator->fresh()));
    }

    /**
     * The backfill leaves the cohort this feature exists for — set up, selling nothing —
     * unstamped, and silences only the creators who have plainly worked it out already.
     */
    public function test_the_backfill_spares_creators_with_nothing_listed(): void
    {
        $empty = $this->setUpCreator();
        $established = $this->setUpCreator();

        for ($i = 0; $i < (int) config('creator_setup.listings_target'); $i++) {
            $this->listing($established);
        }

        $this->artisan('setup:backfill-celebrated', ['--apply' => true])->assertSuccessful();

        $this->assertNull($empty->fresh()->setup_celebrated_at);
        $this->assertNotNull($established->fresh()->setup_celebrated_at);
    }

    public function test_the_backfill_writes_nothing_without_apply(): void
    {
        $established = $this->setUpCreator();

        for ($i = 0; $i < (int) config('creator_setup.listings_target'); $i++) {
            $this->listing($established);
        }

        $this->artisan('setup:backfill-celebrated')->assertSuccessful();

        $this->assertNull($established->fresh()->setup_celebrated_at);
    }
}
