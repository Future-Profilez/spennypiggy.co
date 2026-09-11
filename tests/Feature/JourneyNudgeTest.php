<?php

namespace Tests\Feature;

use App\Console\Commands\NudgeStuckJourney;
use App\Jobs\SendEngagementNotification;
use App\Mail\FinishYourSetup;
use App\Models\User;
use App\Services\CreatorJourneyService;
use App\Services\NotificationDispatcher;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Queue;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;
use Tests\TestCase;

/**
 * `creators:nudge-journey` — two reminders per journey step, then silence.
 */
class JourneyNudgeTest extends TestCase
{
    use RefreshDatabase;

    /**
     * ⚠️ `notifications.sent_at` / `onboarding_day` ship in the ADMIN app's migration —
     * the two apps share a database, not migrations, so the website's test schema has no
     * copy of them. The drip-collision check reads them in production; here they have to
     * be declared or the test asserts against a column that cannot exist.
     */
    protected function setUp(): void
    {
        parent::setUp();

        Schema::table('notifications', function (Blueprint $table) {
            if (! Schema::hasColumn('notifications', 'sent_at')) {
                $table->timestamp('sent_at')->nullable();
            }
            if (! Schema::hasColumn('notifications', 'onboarding_day')) {
                $table->integer('onboarding_day')->nullable();
            }
        });
    }

    private function stuckCreator(string $step = 'stripe', int $daysAgo = 2, array $overrides = []): User
    {
        return User::factory()->create(array_merge([
            'role' => 1,
            'suspended_account' => 0,
            'profile_status_lock' => 2,
            'email_verified_at' => now(),
            'notification_send' => 1,
            'journey_step' => $step,
            'journey_step_at' => now()->subDays($daysAgo),
            'created_at' => now()->subDays($daysAgo),
        ], $overrides));
    }

    public function test_a_creator_three_days_into_a_step_is_due_the_first_reminder(): void
    {
        $creator = $this->stuckCreator('first_post', 3);

        $this->assertSame(3, app(CreatorJourneyService::class)->nudgeStageFor($creator));
    }

    public function test_a_creator_two_days_in_is_not_due_anything_yet(): void
    {
        $creator = $this->stuckCreator('stripe', 2);

        $this->assertNull(app(CreatorJourneyService::class)->nudgeStageFor($creator));
    }

    public function test_a_creator_past_the_last_stage_gets_the_last_reminder_not_the_first(): void
    {
        // Newest threshold first. Somebody already weeks past every stage when this shipped
        // must receive exactly ONE message, not a backlog of three.
        $creator = $this->stuckCreator('stripe', 30);

        $this->assertSame(23, app(CreatorJourneyService::class)->nudgeStageFor($creator));
    }

    public function test_first_listing_is_never_nudged_by_this_command(): void
    {
        // It has its own two-stage nudge; handling it here would mail the same creator
        // twice for one task from two commands that cannot see each other.
        $creator = $this->stuckCreator('first_listing', 10);

        $this->assertNull(app(CreatorJourneyService::class)->nudgeStageFor($creator));
        $this->assertNotContains('first_listing', CreatorJourneyService::nudgeableSteps());
    }

    public function test_a_finished_creator_is_never_nudged(): void
    {
        $creator = $this->stuckCreator(CreatorJourneyService::STEP_DONE, 30);

        $this->assertNull(app(CreatorJourneyService::class)->nudgeStageFor($creator));
    }

    public function test_a_creator_the_sync_has_not_stamped_is_not_nudged(): void
    {
        // NULL is "unknown", never "stuck since forever".
        $creator = $this->stuckCreator('stripe', 5, ['journey_step_at' => null]);

        $this->assertNull(app(CreatorJourneyService::class)->nudgeStageFor($creator));
    }

    public function test_a_future_timestamp_does_not_fire_the_final_reminder(): void
    {
        // diffInDays() is absolute — clock skew would otherwise read as "stuck 90 days".
        $creator = $this->stuckCreator('stripe', 0, ['journey_step_at' => now()->addDays(5)]);

        $this->assertNull(app(CreatorJourneyService::class)->nudgeStageFor($creator));
    }

    public function test_the_command_queues_one_reminder_and_never_repeats_it(): void
    {
        Queue::fake();
        $creator = $this->stuckCreator('stripe', 3);

        $this->artisan('creators:nudge-journey')->assertSuccessful();
        Queue::assertPushed(SendEngagementNotification::class, 1);

        // Second run, same step, same stage: the ledger claim refuses it.
        $this->artisan('creators:nudge-journey')->assertSuccessful();
        Queue::assertPushed(SendEngagementNotification::class, 1);

        $this->assertDatabaseHas('engagement_notifications', [
            'user_id' => $creator->id,
            'type' => 'journey_nudge',
            'dedup_key' => 'stripe:3',
        ]);
    }

    public function test_moving_to_a_new_step_earns_a_fresh_reminder(): void
    {
        Queue::fake();
        $creator = $this->stuckCreator('stripe', 3);

        $this->artisan('creators:nudge-journey')->assertSuccessful();

        $creator->forceFill([
            // ⚠️ Not `first_listing` — it is excluded from `nudgeableSteps()`
            // (the dedicated first-listing nudge owns it), so the command would
            // correctly send nothing and the test would fail for the wrong reason.
            'journey_step' => 'first_post',
            'journey_step_at' => now()->subDays(3),
        ])->saveQuietly();

        $this->artisan('creators:nudge-journey')->assertSuccessful();

        Queue::assertPushed(SendEngagementNotification::class, 2);
    }

    public function test_a_dry_run_sends_nothing_and_claims_nothing(): void
    {
        Queue::fake();
        $creator = $this->stuckCreator('stripe', 3);

        $this->artisan('creators:nudge-journey', ['--dry-run' => true])->assertSuccessful();

        Queue::assertNothingPushed();
        $this->assertDatabaseMissing('engagement_notifications', ['user_id' => $creator->id]);
    }

    /**
     * 🚨 DORMANCY IS COUNTED FROM THE LAST MOVEMENT, NOT FROM SIGNUP (client decision,
     * 7 Sep 2026). 25 live creators had signed up months ago and moved a step this
     * week — the old `created_at` window wrote them off as dormant while they were
     * actively coming back. Verified red against the `created_at` window.
     */
    public function test_an_old_signup_who_just_moved_a_step_is_not_dormant(): void
    {
        Queue::fake();
        $this->stuckCreator('stripe', 3, ['created_at' => now()->subDays(200)]);

        $this->artisan('creators:nudge-journey')->assertSuccessful();

        Queue::assertPushed(SendEngagementNotification::class, 1);
    }

    public function test_a_dormant_creator_is_left_alone_unless_asked_for(): void
    {
        // Mailing a long tail of abandoned signups in one run is how a sending domain
        // earns a spam reputation.
        Queue::fake();
        $this->stuckCreator('stripe', 200, ['created_at' => now()->subDays(200)]);

        $this->artisan('creators:nudge-journey')->assertSuccessful();
        Queue::assertNothingPushed();

        $this->artisan('creators:nudge-journey', ['--include-dormant' => true])->assertSuccessful();
        Queue::assertPushed(SendEngagementNotification::class, 1);
    }

    /*
     * 🚨 `test_a_flagged_identity_is_never_nudged` WAS HERE AND IS GONE (10 Sep 2026).
     *
     * It asserted that a creator whose identity Stripe had flagged was not sent a
     * reminder to retry a check that would answer the same way. That is still true and
     * still matters — it simply is not this command's job any more: identity left the
     * journey for the payout gate, so `nudgeStageFor()` has no identity step to reach.
     * The equivalent guarantee now lives in `PayoutIdentityGateTest`, where a flagged
     * creator is shown a support conversation and no retry button.
     */

    public function test_a_punished_creator_is_never_coached_to_publish(): void
    {
        // profile_status_lock = 1 is "submitted, with the review team" — and for an
        // already-approved creator, a demotion that delists everything they sell.
        Queue::fake();
        $this->stuckCreator('stripe', 5, ['profile_status_lock' => 1]);

        $this->artisan('creators:nudge-journey')->assertSuccessful();
        Queue::assertNothingPushed();
    }

    public function test_an_unverified_address_is_never_mailed(): void
    {
        Queue::fake();
        $this->stuckCreator('stripe', 5, ['email_verified_at' => null]);

        $this->artisan('creators:nudge-journey')->assertSuccessful();
        Queue::assertNothingPushed();
    }

    public function test_the_drip_and_this_command_never_message_on_the_same_day(): void
    {
        Queue::fake();
        $creator = $this->stuckCreator('stripe', 5);

        DB::table('notifications')->insert([
            'uuid' => (string) Str::uuid(),
            'user_id' => $creator->id,
            'notifiable_id' => 1,
            'notifiable_type' => 'creator_onboarding',
            'notification' => 'drip',
            'onboarding_day' => 3,
            'sent_at' => now(),
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $this->artisan('creators:nudge-journey')->assertSuccessful();
        Queue::assertNothingPushed();
    }

    public function test_email_is_dropped_for_a_creator_who_opted_out_but_bell_and_push_are_not(): void
    {
        // $marketing = false bypasses the consent gate, so the preference has to be
        // honoured here or the unsubscribe link in the email is decorative.
        $creator = $this->stuckCreator('stripe', 3, ['creator_updates_enabled' => false]);

        $channels = (new \ReflectionClass(NudgeStuckJourney::class))
            ->getMethod('channelsFor');
        $channels->setAccessible(true);

        $result = $channels->invoke(app(NudgeStuckJourney::class), $creator);

        $this->assertContains(NotificationDispatcher::CHANNEL_BELL, $result);
        $this->assertContains(NotificationDispatcher::CHANNEL_PUSH, $result);
        $this->assertNotContains(NotificationDispatcher::CHANNEL_EMAIL, $result);
    }

    public function test_the_email_copy_comes_from_the_journey_steps_never_a_second_copy(): void
    {
        // If these drift, the email tells a creator something the dashboard does not.
        $creator = $this->stuckCreator('stripe', 3);

        $payload = app(NudgeStuckJourney::class)->payloadFor($creator, 3);

        $this->assertSame(FinishYourSetup::subjectFor('stripe', 3), $payload['title']);
        $this->assertSame(CreatorJourneyService::STEPS['stripe']['body'], $payload['body']);
        $this->assertSame(FinishYourSetup::class, $payload['mailable']);
    }

    public function test_every_nudgeable_step_has_a_subject_and_a_reason(): void
    {
        // A step added to the journey with no copy here would mail the default line, which
        // says nothing about what the creator is supposed to do.
        foreach (CreatorJourneyService::nudgeableSteps() as $step) {
            $this->assertNotSame('Finish setting up your Spenny Piggy page', FinishYourSetup::subjectFor($step, 3), $step);
            $this->assertNotSame('You are part-way through setting up your page.', FinishYourSetup::contextFor($step), $step);
        }
    }
}
