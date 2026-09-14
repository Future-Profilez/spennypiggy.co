<?php

namespace Tests\Feature;

use App\Mail\ProfileApprovalStatusMail;
use App\Models\ProfileChangeRequest;
use App\Models\SocialLinks;
use App\Models\User;
use App\Services\CreatorJourneyService;
use App\Support\ProfileAutoApproval;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Str;
use Tests\TestCase;

/**
 * A creator's profile approves itself. Nobody waits on an admin to build or publish.
 *
 * 🚨 THE GUARD THAT MATTERS MOST IS `test_nothing_submits_a_profile_for_review`. The
 * whole change is the ABSENCE of a step, and an absence is what quietly comes back — a
 * new route, a re-added journey entry, a button on the steps page. Each of those has its
 * own assertion here for that reason.
 */
class ProfileAutoApprovalTest extends TestCase
{
    use RefreshDatabase;

    private function creator(array $overrides = []): User
    {
        return User::factory()->create(array_merge([
            'role' => 1,
            'suspended_account' => 0,
            'profile_status_lock' => 0,
            'avatar' => null,
            'bio' => null,
            'avatar_approved' => 0,
            'bio_approved' => 0,
        ], $overrides));
    }

    private function handles(User $user, array $values = ['instagram' => 'realjane'], int $status = SocialLinks::STATUS_APPROVED): SocialLinks
    {
        return SocialLinks::create(array_merge([
            'uuid' => (string) Str::uuid(),
            'user_id' => $user->id,
            'status' => $status,
        ], $values));
    }

    /* ---------------- judging ---------------- */

    public function test_a_clean_bio_passes_and_banned_wording_does_not(): void
    {
        $this->assertNull(ProfileAutoApproval::judgeBio('I make weekly photo sets and a monthly zine.'));
        $this->assertNotNull(ProfileAutoApproval::judgeBio('Send me a tribute and buy me a coffee'));
    }

    public function test_contact_details_and_links_are_refused(): void
    {
        // 🚨 Refused at save, not flagged for a reviewer (client decision). With the
        // profile auto-approving, an advisory would put "pay me on PayPal, DM me at …"
        // live the instant it was typed.
        $this->assertNotNull(ProfileAutoApproval::judgeBio('reach me at jane@example.com'));
        $this->assertNotNull(ProfileAutoApproval::judgeBio('call +44 7700 900123 any time'));
        $this->assertNotNull(ProfileAutoApproval::judgeBio('everything is on https://elsewhere.example'));
    }

    public function test_a_bare_handle_in_a_bio_is_not_an_email(): void
    {
        // Creators write "follow @me" constantly; refusing it sends them to remove the
        // one line that is fine.
        $this->assertNull(ProfileAutoApproval::judgeBio('follow @jane for behind the scenes'));
    }

    public function test_shortened_and_insecure_handles_are_refused(): void
    {
        $this->assertNotNull(ProfileAutoApproval::judgeSocials(['instagram' => 'bit.ly/xyz']));
        $this->assertNotNull(ProfileAutoApproval::judgeSocials(['instagram' => 'http://instagram.com/jane']));
        $this->assertNull(ProfileAutoApproval::judgeSocials(['instagram' => 'jane']));
    }

    public function test_a_handle_already_on_another_creator_is_refused(): void
    {
        // 🚨 The one impersonation signal a machine can see at signup. The first
        // claimant keeps it; the second is told and can take it to support.
        $first = $this->creator();
        $this->handles($first, ['instagram' => 'realjane']);

        $second = $this->creator();

        $this->assertNotNull(ProfileAutoApproval::judgeSocials(['instagram' => '@realjane'], $second->id));
        // Normalised both sides, so "@realjane" and "realjane" collide.
        $this->assertNull(ProfileAutoApproval::judgeSocials(['instagram' => 'realjane'], $first->id));
    }

    /* ---------------- activation ---------------- */

    public function test_three_clean_assets_take_the_profile_live_with_no_admin(): void
    {
        Mail::fake();

        $creator = $this->creator([
            'avatar' => 'uuid-1', 'avatar_approved' => 1,
            'bio' => 'Weekly photo sets.', 'bio_approved' => 1,
        ]);
        $this->handles($creator);

        $this->assertTrue(ProfileAutoApproval::activateIfComplete($creator->fresh()));
        $this->assertSame(2, (int) $creator->fresh()->profile_status_lock);
        Mail::assertQueued(ProfileApprovalStatusMail::class, function ($mail) {
            return $mail->status === true;
        });
    }

    public function test_a_held_photo_keeps_the_profile_off(): void
    {
        $creator = $this->creator([
            'avatar' => 'uuid-1', 'avatar_approved' => 0,
            'bio' => 'Weekly photo sets.', 'bio_approved' => 1,
        ]);
        $this->handles($creator);

        $this->assertFalse(ProfileAutoApproval::activateIfComplete($creator->fresh()));
        $this->assertNotSame(2, (int) $creator->fresh()->profile_status_lock);
        $this->assertSame(['avatar'], ProfileAutoApproval::holding($creator->fresh()));
    }

    public function test_a_suspended_creator_is_never_activated(): void
    {
        $creator = $this->creator([
            'avatar' => 'uuid-1', 'avatar_approved' => 1,
            'bio' => 'Weekly photo sets.', 'bio_approved' => 1,
            'suspended_account' => 1,
        ]);
        $this->handles($creator);

        $this->assertFalse(ProfileAutoApproval::activateIfComplete($creator->fresh()));
    }

    public function test_activation_does_not_re_date_the_profile(): void
    {
        // 🚨 `users.updated_at` orders the admin review queue and keys the public
        // profile cache. An automated approval seconds after upload must not reshuffle
        // a reviewer's list — same rule as StripeChargesFlag::sync().
        $creator = $this->creator([
            'avatar' => 'uuid-1', 'avatar_approved' => 1,
            'bio' => 'Weekly photo sets.', 'bio_approved' => 1,
        ]);
        $this->handles($creator);

        $before = $creator->fresh()->updated_at;
        ProfileAutoApproval::activateIfComplete($creator->fresh());

        $this->assertEquals($before, $creator->fresh()->updated_at);
    }

    /* ---------------- the absence ---------------- */

    public function test_nothing_submits_a_profile_for_review(): void
    {
        // 🚨 THE POINT OF THE WHOLE CHANGE. A re-added submit route puts a human back
        // in the onboarding path, which is the friction this removed.
        $this->assertFalse(
            app('router')->has('update.profile.lock.status'),
            'A submit-for-review route is back. Profiles approve themselves.'
        );

        $jsx = file_get_contents(resource_path('js/Pages/Profile/CreatorVerification.jsx'));
        $this->assertStringNotContainsString('update.profile.lock.status', $jsx);
    }

    public function test_the_journey_has_no_review_or_identity_step(): void
    {
        foreach (['review', 'identity'] as $gone) {
            $this->assertArrayNotHasKey($gone, CreatorJourneyService::STEPS);
            $this->assertNotContains($gone, CreatorJourneyService::SETUP_STEPS);
        }
    }

    public function test_the_card_is_the_last_setup_step(): void
    {
        // Connect first, card last (client direction). The website's deleted
        // `subscriptionGate()` is what made the old order enforceable; with the card
        // last, a gate on Connect would deadlock.
        $this->assertSame(
            ['profile', 'social', 'stripe', 'subscription'],
            CreatorJourneyService::SETUP_STEPS
        );

        $stripe = file_get_contents(app_path('Http/Controllers/Auth/StripeController.php'));
        $this->assertStringNotContainsString('$this->subscriptionGate(', $stripe);
    }

    public function test_a_step_is_done_only_when_the_asset_is_approved(): void
    {
        // 🚨 With no review step, a held photo has to keep the PROFILE step open — or a
        // creator whose avatar the scan pulled reads "done" on a page that is not live.
        $creator = $this->creator([
            'avatar' => 'uuid-1', 'avatar_approved' => 0,
            'bio' => 'Weekly photo sets.', 'bio_approved' => 1,
        ]);
        $this->handles($creator);

        $journey = app(CreatorJourneyService::class);
        $this->assertSame('profile', $journey->nextStep($creator->fresh())['key']);
    }

    /* ---------------- change requests ---------------- */

    public function test_an_edit_to_a_live_profile_applies_itself(): void
    {
        // Q4: auto-apply, and the daily report highlights it. `decided_by_admin_id`
        // null on an approved request is what marks it as a machine decision.
        $creator = $this->creator([
            'profile_status_lock' => 2,
            'avatar' => 'uuid-1', 'avatar_approved' => 1,
            'bio' => 'Old bio.', 'bio_approved' => 1,
        ]);
        $this->handles($creator);

        $change = ProfileChangeRequest::open(
            $creator,
            ProfileChangeRequest::ASSET_BIO,
            ['bio' => 'A new bio about my photo sets.'],
            ['bio' => 'Old bio.'],
        );

        $this->assertTrue(ProfileAutoApproval::applyChange($change));

        $change->refresh();
        $this->assertSame(ProfileChangeRequest::STATUS_APPROVED, $change->status);
        $this->assertNull($change->decided_by_admin_id, 'An automated approval must record no admin.');
        $this->assertSame('A new bio about my photo sets.', $creator->fresh()->bio);
    }

    public function test_a_change_already_decided_is_left_alone(): void
    {
        // The scan is asynchronous: an admin may have decided, or the creator may have
        // superseded it, in the window.
        $creator = $this->creator(['profile_status_lock' => 2, 'bio' => 'Old bio.']);

        $change = ProfileChangeRequest::open($creator, ProfileChangeRequest::ASSET_BIO, ['bio' => 'New.'], ['bio' => 'Old bio.']);
        $change->close(ProfileChangeRequest::STATUS_REJECTED, 'no', 1);

        $this->assertFalse(ProfileAutoApproval::applyChange($change->fresh()));
        $this->assertSame('Old bio.', $creator->fresh()->bio);
    }
}
