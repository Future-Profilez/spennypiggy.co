<?php

namespace Tests\Feature;

use App\Console\Commands\NudgeBlockedReviewSubmissions;
use App\Mail\FinishYourReviewSubmission;
use App\Models\EngagementNotification;
use App\Models\MonthlyCharge;
use App\Models\SocialLinks;
use App\Models\User;
use App\Services\SubscriptionActivationService;
use App\Support\ReviewSubmission;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Queue;
use Illuminate\Support\Str;
use Tests\TestCase;

/**
 * A creator who pressed Submit while something was missing.
 *
 * 🚨 The bug these were written for: `profile_status_lock = 1` was read as "with
 * the review team" everywhere, while the admin queue ALSO requires a photo, bio,
 * handle and card — so 22 creators were told "our team is checking it now, there
 * is nothing else to do" while sitting in no queue at all.
 */
class BlockedReviewSubmissionTest extends TestCase
{
    use RefreshDatabase;

    private function creator(array $attributes = [], ?string $cardStatus = 'paid'): User
    {
        $user = User::factory()->create(array_merge([
            'role' => 1,
            'avatar' => 'https://ucarecdn.com/avatar/',
            'bio' => 'I am a musician',
            'profile_status_lock' => 1,
            'email_verified_at' => now(),
        ], $attributes));

        SocialLinks::create([
            'uuid' => (string) Str::uuid(),
            'user_id' => $user->id,
            'status' => 0,
            'instagram' => 'ben_lewis',
        ]);

        /*
         * `subscription_status` is an ACCESSOR over MonthlyCharge, not a column —
         * "card on file" means a LIVE subscription period, which is exactly what
         * the admin queue and the journey card both read.
         */
        if ($cardStatus !== null) {
            MonthlyCharge::create([
                'user_id' => $user->id,
                'status' => $cardStatus,
                'current_start_subscription_date' => now()->subDay(),
                'current_end_subscription_date' => now()->addMonth(),
            ]);
        }

        return $user->fresh();
    }

    public function test_a_submission_with_nothing_missing_is_with_the_review_team(): void
    {
        $user = $this->creator();

        $this->assertTrue(ReviewSubmission::isWithReviewTeam($user));
        $this->assertFalse(ReviewSubmission::isBlocked($user));
        $this->assertSame(
            ReviewSubmission::STATE_WITH_TEAM,
            ReviewSubmission::payload($user)['state']
        );
    }

    /**
     * 🚨 The whole fault. Lock 1 with no card is invisible to the admin queue, so
     * calling it "with the review team" is a wait that can never end.
     */
    public function test_a_submission_missing_a_card_is_blocked_not_with_the_team(): void
    {
        $user = $this->creator(cardStatus: null);

        $this->assertFalse(ReviewSubmission::isWithReviewTeam($user));
        $this->assertTrue(ReviewSubmission::isBlocked($user));

        $payload = ReviewSubmission::payload($user);

        $this->assertSame(ReviewSubmission::STATE_BLOCKED, $payload['state']);
        $this->assertSame(['a payment card'], $payload['missing']);
    }

    /**
     * ⚠️ Not a one-off backlog. `past_due` is not a live subscription period, so a
     * creator whose card is declined mid-review drops out of the queue silently.
     */
    public function test_a_declined_card_blocks_a_submission_that_was_already_in_the_queue(): void
    {
        $user = $this->creator(cardStatus: 'past_due');

        $this->assertTrue(ReviewSubmission::isBlocked($user));
        $this->assertContains('a payment card', ReviewSubmission::missing($user));
    }

    /**
     * 🚨 THE QUEUE GATE IS NOT THE SUBMIT GATE, and this is the case that separates
     * them (found in review, 6 Sep 2026).
     *
     * `whereProfileComplete()` on the admin side checks the handle's PRESENCE and
     * never its approval status, so a creator holding a rejected handle and a card
     * IS in the review queue. Reading the submit gate here told 17 live creators
     * "we cannot start the review until you add a social handle" — one that exists,
     * was reviewed, and was turned down — while an admin was looking at them.
     */
    public function test_a_rejected_handle_does_not_hold_a_carded_creator_out_of_the_queue(): void
    {
        $user = $this->creator();

        SocialLinks::where('user_id', $user->id)
            ->update(['status' => SocialLinks::STATUS_REJECTED]);

        $user = $user->fresh();

        // The submit gate still refuses it — that is correct and unchanged.
        $this->assertContains('a social handle', ReviewSubmission::missing($user));

        // The queue gate does not, because the admin queue does not.
        $this->assertSame([], ReviewSubmission::queueBlockers($user));
        $this->assertTrue(ReviewSubmission::isWithReviewTeam($user));
    }

    /**
     * ⚠️ The card test mirrors the admin queue's SECOND clause too —
     * `orWhere('users.is_subscribed', 1)` — which `subscription_status` knows
     * nothing about. A creator carrying that flag and no `monthly_charges` row is
     * in the queue, so telling them to add a card names the wrong problem.
     *
     * 🚨 A behavioural test, not a source scan: the two apps are in two
     * repositories and only a rendered verdict can show they agree.
     */
    public function test_the_queue_accepts_the_subscribed_flag_as_a_card(): void
    {
        $user = $this->creator(cardStatus: null);

        $user->forceFill(['is_subscribed' => 1])->save();
        $user = $user->fresh();

        // The submit gate reads the live subscription period and finds none.
        $this->assertContains('a payment card', ReviewSubmission::missing($user));

        // The queue accepts the flag, so the creator is genuinely visible to an admin.
        $this->assertSame([], ReviewSubmission::queueBlockers($user));
        $this->assertTrue(ReviewSubmission::isWithReviewTeam($user));
    }

    public function test_an_unsubmitted_creator_gets_no_payload_at_all(): void
    {
        $user = $this->creator(['profile_status_lock' => 0]);

        // 🚨 Null, never an object with a falsy state — the banner renders on the
        // prop's PRESENCE, and an always-sent object is one truthiness slip away
        // from telling every creator their submission is blocked.
        $this->assertNull(ReviewSubmission::payload($user));
    }

    public function test_an_approved_creator_reads_as_approved(): void
    {
        $user = $this->creator(['profile_status_lock' => 2]);

        $this->assertSame(
            ReviewSubmission::STATE_APPROVED,
            ReviewSubmission::payload($user)['state']
        );
    }

    /**
     * The whole point of leaving the lock at 1: adding the missing thing puts the
     * creator in the queue on their own, with nothing to submit again.
     */
    public function test_adding_the_card_moves_them_to_the_review_team_with_no_resubmission(): void
    {
        $user = $this->creator(cardStatus: null);

        $this->assertTrue(ReviewSubmission::isBlocked($user));

        MonthlyCharge::create([
            'user_id' => $user->id,
            'status' => 'trialing',
            'current_start_trial_date' => now()->subDay(),
            'current_end_trial_date' => now()->addYear(),
        ]);

        $user = $user->fresh();

        $this->assertTrue(ReviewSubmission::isWithReviewTeam($user));
        $this->assertSame(1, (int) $user->profile_status_lock);
    }

    public function test_the_shared_payload_carries_the_state_for_the_creators_own_screen(): void
    {
        $user = $this->creator(cardStatus: null);

        $this->actingAs($user)
            ->get('/account')
            ->assertInertia(fn ($page) => $page->where(
                'auth.user.review_submission.state',
                ReviewSubmission::STATE_BLOCKED
            ));
    }

    /**
     * 🚨 A TWO-LANGUAGE PIN. The prop and the component that reads it are in
     * different languages, and neither the build nor any scanner can see that
     * they agree — renaming one side leaves the banner permanently reading the
     * bare lock again, which is indistinguishable from the bug it replaced.
     *
     * ⚠️ Comments are blanked first: the note at the call site explains the fault
     * by quoting the old expression, so a raw scan finds the very string it is
     * checking has gone.
     */
    public function test_the_creators_screen_still_reads_the_review_submission_prop(): void
    {
        $source = file_get_contents(
            resource_path('js/Pages/Profile/CreatorVerification.jsx')
        );

        $code = preg_replace(['#/\*.*?\*/#s', '#//[^\n]*#'], '', $source);

        $this->assertStringContainsString('review_submission', $code);
        $this->assertStringContainsString('with_team', $code);
        $this->assertStringContainsString('blocked', $code);
    }

    public function test_the_command_reminds_a_blocked_creator(): void
    {
        Queue::fake();

        $user = $this->creator(cardStatus: null);

        $this->artisan('review:nudge-blocked')->assertSuccessful();

        $this->assertDatabaseHas('engagement_notifications', [
            'user_id' => $user->id,
            'type' => NudgeBlockedReviewSubmissions::TYPE,
            'dedup_key' => '1',
        ]);
    }

    public function test_a_creator_who_is_genuinely_with_the_team_is_never_reminded(): void
    {
        Queue::fake();

        $user = $this->creator();

        $this->artisan('review:nudge-blocked')->assertSuccessful();

        $this->assertDatabaseMissing('engagement_notifications', [
            'user_id' => $user->id,
            'type' => NudgeBlockedReviewSubmissions::TYPE,
        ]);
    }

    public function test_a_suspended_creator_is_never_reminded(): void
    {
        Queue::fake();

        $user = $this->creator(['suspended_account' => 1], cardStatus: null);

        $this->artisan('review:nudge-blocked')->assertSuccessful();

        $this->assertDatabaseMissing('engagement_notifications', [
            'user_id' => $user->id,
            'type' => NudgeBlockedReviewSubmissions::TYPE,
        ]);
    }

    /**
     * 🚨 The ladder. Inside the wait, a second run must send nothing — otherwise
     * a weekly schedule is a weekly reminder whatever the config says.
     */
    public function test_a_second_run_inside_the_wait_window_sends_nothing(): void
    {
        Queue::fake();

        $user = $this->creator(cardStatus: null);

        $this->artisan('review:nudge-blocked')->assertSuccessful();
        $this->artisan('review:nudge-blocked')->assertSuccessful();

        $this->assertSame(1, EngagementNotification::where('user_id', $user->id)
            ->where('type', NudgeBlockedReviewSubmissions::TYPE)
            ->count());
    }

    public function test_a_run_after_the_wait_has_elapsed_sends_the_next_reminder(): void
    {
        Queue::fake();

        $user = $this->creator(cardStatus: null);

        $this->artisan('review:nudge-blocked')->assertSuccessful();

        EngagementNotification::where('user_id', $user->id)
            ->where('type', NudgeBlockedReviewSubmissions::TYPE)
            ->update(['sent_at' => now()->subDays(15)]);

        $this->artisan('review:nudge-blocked')->assertSuccessful();

        $this->assertSame(2, EngagementNotification::where('user_id', $user->id)
            ->where('type', NudgeBlockedReviewSubmissions::TYPE)
            ->count());
    }

    /**
     * ⚠️ The rule, not the numbers. A test asserting "14" would pass just as
     * happily against a ladder that never slows down, which is the fault the
     * ladder exists to prevent.
     */
    public function test_the_ladder_slows_down_and_never_stops(): void
    {
        $command = app(NudgeBlockedReviewSubmissions::class);

        $early = $command->waitDaysAfter(1);
        $middle = $command->waitDaysAfter(4);
        $late = $command->waitDaysAfter(20);

        $this->assertLessThan($middle, $early);
        $this->assertLessThan($late, $middle);
        $this->assertGreaterThan(0, $late);
    }

    public function test_a_dry_run_sends_nothing_and_claims_nothing(): void
    {
        Queue::fake();

        $user = $this->creator(cardStatus: null);

        $this->artisan('review:nudge-blocked', ['--dry-run' => true])->assertSuccessful();

        $this->assertDatabaseMissing('engagement_notifications', [
            'user_id' => $user->id,
            'type' => NudgeBlockedReviewSubmissions::TYPE,
        ]);
    }

    /**
     * The mail must name what is missing. "Your profile is incomplete" sends the
     * creator looking, which is the state this whole feature exists to end.
     */
    public function test_the_mail_names_the_missing_thing_and_offers_the_route(): void
    {
        $user = $this->creator(cardStatus: null);

        $html = (new FinishYourReviewSubmission(
            $user->id,
            'Ben',
            ['a payment card'],
        ))->render();

        $this->assertStringContainsString('a payment card', $html);
        $this->assertStringContainsString('/activate-subscription', $html);
    }

    /**
     * 🚨 A creator who has already sold is billed the moment they subscribe, so
     * the free-until-first-sale promise must not appear in their copy.
     */
    public function test_the_free_period_promise_is_absent_for_a_creator_who_has_sold(): void
    {
        $user = $this->creator(cardStatus: null);

        $this->mock(SubscriptionActivationService::class, function ($mock) {
            $mock->shouldReceive('hasEverMadeSale')->andReturn(true);
        });

        $html = (new FinishYourReviewSubmission(
            $user->id,
            'Ben',
            ['a payment card'],
        ))->render();

        $this->assertStringNotContainsString('until you make your first sale', $html);
    }
}
