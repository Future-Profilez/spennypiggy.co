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
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Queue;
use Illuminate\Support\Str;
use Tests\TestCase;

/**
 * A creator who pressed Submit while something was missing.
 *
 * 🚨 The bug these were written for: `profile_status_lock = 1` was read as "with
 * the review team" everywhere, while the admin queue ALSO requires a photo, bio,
 * handle (and, until 7 Sep 2026, a card) — so 22 creators were told "our team is checking it now, there
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
     * 🚨 The whole fault. Lock 1 with something the queue requires missing is
     * invisible to the admin queue, so calling it "with the review team" is a wait
     * that can never end. (When found, the missing thing was a card on all 22; the
     * card left the queue on 7 Sep 2026 and the photo stands in for it here.)
     */
    public function test_a_submission_missing_a_photo_is_blocked_not_with_the_team(): void
    {
        $user = $this->creator(['avatar' => null]);

        $this->assertFalse(ReviewSubmission::isWithReviewTeam($user));
        $this->assertTrue(ReviewSubmission::isBlocked($user));

        $payload = ReviewSubmission::payload($user);

        $this->assertSame(ReviewSubmission::STATE_BLOCKED, $payload['state']);
        $this->assertSame(['a profile photo'], $payload['missing']);
    }

    /**
     * 🚨 THE CARD IS NOT A QUEUE REQUIREMENT ANY MORE (client decision, 7 Sep 2026).
     * It is asked after approval, before payouts. A creator with no card, or with a
     * declined one, is genuinely with the review team — mirrors the admin's
     * `whereProfileComplete()`, which dropped its card clause in the same commit.
     * Verified red against the old gate.
     */
    public function test_a_card_no_longer_decides_whether_they_are_with_the_team(): void
    {
        $noCard = $this->creator(cardStatus: null);
        $declined = $this->creator(cardStatus: 'past_due');

        foreach ([$noCard, $declined] as $user) {
            $this->assertTrue(ReviewSubmission::isWithReviewTeam($user));
            $this->assertSame([], ReviewSubmission::queueBlockers($user));
            $this->assertNotContains('a payment card', ReviewSubmission::missing($user));
        }
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
     * The submit gate and the queue gate name the SAME three things now (photo,
     * bio, handle) — the difference between them is only the rejected-asset
     * clause the submit gate carries. Pinned so a card clause cannot creep back
     * into either one on its own.
     */
    public function test_neither_gate_names_a_card(): void
    {
        $user = $this->creator(['avatar' => null, 'bio' => null], cardStatus: null);

        $this->assertSame(['a profile photo', 'a bio'], ReviewSubmission::missing($user));
        $this->assertSame(['a profile photo', 'a bio'], ReviewSubmission::queueBlockers($user));
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
    public function test_adding_the_photo_moves_them_to_the_review_team_with_no_resubmission(): void
    {
        $user = $this->creator(['avatar' => null]);

        $this->assertTrue(ReviewSubmission::isBlocked($user));

        // DB::table, not save() — `updated_at` orders the admin queue.
        DB::table('users')->where('id', $user->id)->update(['avatar' => 'https://ucarecdn.com/avatar/']);

        $user = $user->fresh();

        $this->assertTrue(ReviewSubmission::isWithReviewTeam($user));
        $this->assertSame(1, (int) $user->profile_status_lock);
    }

    public function test_the_shared_payload_carries_the_state_for_the_creators_own_screen(): void
    {
        $user = $this->creator(['avatar' => null]);

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

        $user = $this->creator(['avatar' => null]);

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

        $user = $this->creator(['suspended_account' => 1, 'avatar' => null]);

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

        $user = $this->creator(['avatar' => null]);

        $this->artisan('review:nudge-blocked')->assertSuccessful();
        $this->artisan('review:nudge-blocked')->assertSuccessful();

        $this->assertSame(1, EngagementNotification::where('user_id', $user->id)
            ->where('type', NudgeBlockedReviewSubmissions::TYPE)
            ->count());
    }

    public function test_a_run_after_the_wait_has_elapsed_sends_the_next_reminder(): void
    {
        Queue::fake();

        $user = $this->creator(['avatar' => null]);

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

        $user = $this->creator(['avatar' => null]);

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
        $user = $this->creator(['avatar' => null]);

        $html = (new FinishYourReviewSubmission(
            $user->id,
            'Ben',
            ['a profile photo'],
        ))->render();

        $this->assertStringContainsString('a profile photo', $html);
        $this->assertStringContainsString('/'.$user->username, $html);
    }

    /**
     * 🚨 THE MAIL NAMES WHY THE PROFILE WAS TURNED DOWN LAST TIME, when it was
     * (client decision, 7 Sep 2026). "Something is missing" to somebody who was
     * rejected for a reason sends them to fix the wrong thing.
     */
    public function test_the_mail_carries_the_last_rejection_reason_when_there_is_one(): void
    {
        $user = $this->creator(['avatar' => null]);

        $html = (new FinishYourReviewSubmission(
            $user->id,
            'Ben',
            ['a profile photo'],
            'Your photo did not show your face clearly.',
        ))->render();

        $this->assertStringContainsString('Your photo did not show your face clearly.', $html);

        $plain = (new FinishYourReviewSubmission($user->id, 'Ben', ['a profile photo']))->render();

        $this->assertStringNotContainsString('turned down', $plain);
    }

    /**
     * 🚨 A creator who has already sold is billed the moment they subscribe, so
     * the free-until-first-sale promise must not appear in their copy.
     */
    public function test_the_free_period_promise_is_absent_for_a_creator_who_has_sold(): void
    {
        $user = $this->creator(['avatar' => null]);

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
