<?php

namespace Tests\Feature;

use App\Models\FinancialTransaction;
use App\Models\MonthlyCharge;
use App\Models\Post;
use App\Models\SocialLinks;
use App\Models\Task;
use App\Models\User;
use App\Services\CreatorJourneyService;
use App\Services\CreatorSetupService;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;
use Tests\TestCase;

class CreatorJourneyTest extends TestCase
{
    use RefreshDatabase;

    private CreatorJourneyService $journey;

    protected function setUp(): void
    {
        parent::setUp();

        // ⚠️ Pre-existing schema drift, same class as the `shops` one already tracked in
        // TASKS: a freshly migrated `posts` table has no `type` column, though every live
        // database does and the application reads it throughout.
        Schema::table('posts', function (Blueprint $table) {
            if (! Schema::hasColumn('posts', 'type')) {
                $table->string('type')->nullable();
            }
            if (! Schema::hasColumn('posts', 'for_module')) {
                $table->string('for_module')->nullable();
            }
        });

        $this->journey = app(CreatorJourneyService::class);
    }

    /** A creator with nothing done at all. */
    private function creator(array $overrides = []): User
    {
        return User::factory()->create(array_merge([
            'role' => 1,
            'suspended_account' => 0,
            'avatar' => null,
            'avatar_approved' => 0,
            'bio' => null,
            'bio_approved' => 0,
            'identity_status' => 0,
            'stripe_details_submitted' => 0,
        ], $overrides));
    }

    /** Everything before `$step` is done, so `$step` is the one that surfaces. */
    private function creatorAt(string $step): User
    {
        $done = [];
        foreach (array_keys(CreatorJourneyService::STEPS) as $key) {
            if ($key === $step) {
                break;
            }
            $done[] = $key;
        }

        // 🚨 APPROVAL IS WHAT FINISHES `profile` NOW (11 Sep 2026). There is no
        // `review` step to finish it — the assets are judged as they are saved and the
        // profile goes live on its own, so a done `profile` means both halves are
        // present AND approved, and `profile_status_lock = 2` follows from that rather
        // than from a person.
        $profileDone = in_array('profile', $done, true);
        $socialDone = in_array('social', $done, true);

        $creator = $this->creator([
            'avatar' => $profileDone ? 'uuid' : null,
            'bio' => $profileDone ? 'Hello' : null,
            'avatar_approved' => $profileDone ? 1 : 0,
            'bio_approved' => $profileDone ? 1 : 0,
            'profile_status_lock' => ($profileDone && $socialDone) ? 2 : 0,
            'stripe_details_submitted' => in_array('stripe', $done, true) ? 1 : 0,
        ]);

        if (in_array('social', $done, true)) {
            $this->handle($creator);
        }

        if (in_array('subscription', $done, true)) {
            $this->cardOnFile($creator);
        }

        if (in_array('first_listing', $done, true)) {
            $this->publishTask($creator);
        }

        if (in_array('first_post', $done, true)) {
            $this->writePost($creator);
        }

        if (in_array('first_sale', $done, true)) {
            $this->sale($creator, 'completed');
        }

        return $creator->fresh();
    }

    /**
     * A card on file, in the shape `computeSubscriptionStatus()` reads as the free
     * period (status 2) — `trialing` with no trial end date. Status 1 and 2 are the
     * same allow-list the checkout gates use.
     */
    private function cardOnFile(User $creator): MonthlyCharge
    {
        return MonthlyCharge::create([
            'user_id' => $creator->id,
            'uuid' => (string) Str::uuid(),
            'status' => 'trialing',
            'amount' => 8.99,
            'currency' => 'GBP',
        ]);
    }

    private function handle(User $creator): SocialLinks
    {
        // ⚠️ APPROVED. The social step is done on approval now, not on presence —
        // a handle a check pulled has to keep its own step open.
        return SocialLinks::create([
            'user_id' => $creator->id,
            'uuid' => (string) Str::uuid(),
            'instagram' => 'spenny',
            'status' => SocialLinks::STATUS_APPROVED,
        ]);
    }

    private function publishTask(User $creator, int $approved = 1): Task
    {
        return Task::create([
            'creator_id' => $creator->id,
            'uuid' => (string) Str::uuid(),
            'title' => 'A task',
            'price' => 10,
            'is_approved' => $approved,
            'category' => 'audio',
            'type' => 'instant',
        ]);
    }

    private function writePost(User $creator, string $type = 'post', int $approved = 1): Post
    {
        return Post::create([
            'user_id' => $creator->id,
            'title' => 'A post',
            'content' => 'Body text.',
            'type' => $type,
            'approved' => $approved,
        ]);
    }

    private function sale(User $creator, string $status): FinancialTransaction
    {
        return FinancialTransaction::create([
            'user_id' => $creator->id,
            'type' => 'income',
            'status' => $status,
            'gross_amount' => 10,
            'net_amount' => 8,
            'currency' => 'gbp',
            'transaction_date' => now(),
        ]);
    }

    public function test_the_first_unfinished_step_is_the_current_one(): void
    {
        foreach (array_keys(CreatorJourneyService::STEPS) as $step) {
            $this->assertSame(
                $step,
                $this->journey->currentStep($this->creatorAt($step)),
                "expected to surface [$step]"
            );
        }
    }

    public function test_a_creator_who_has_done_everything_is_done(): void
    {
        $creator = $this->creatorAt(CreatorJourneyService::STEP_DONE);

        $this->assertSame(CreatorJourneyService::STEP_DONE, $this->journey->currentStep($creator));
        $this->assertNull($this->journey->nextStep($creator), 'a finished journey must go quiet');
    }

    /** The social handle is a hard gate on submitting, so it is a step, not a surprise. */
    public function test_a_missing_social_handle_is_its_own_step(): void
    {
        // ⚠️ APPROVED, not merely present: the profile step is done on approval now.
        $creator = $this->creator([
            'avatar' => 'uuid', 'avatar_approved' => 1,
            'bio' => 'Hello', 'bio_approved' => 1,
        ]);

        $this->assertSame('social', $this->journey->currentStep($creator));

        $this->handle($creator);

        $this->assertNotSame('social', $this->journey->currentStep($creator->fresh()));
    }

    public function test_a_half_finished_profile_is_still_the_creators_job(): void
    {
        // Photo uploaded, no bio written — they still have work to do.
        $creator = $this->creator(['avatar' => 'uuid', 'bio' => null]);

        $next = $this->journey->nextStep($creator);

        $this->assertSame('profile', $next['key']);
        $this->assertFalse($next['awaiting_review']);
        $this->assertSame(['bio'], $this->journey->missingProfileParts($creator));
    }

    /**
     * 🚨 IDENTITY IS NOT A JOURNEY STEP (10 Sep 2026, client direction).
     *
     * Four tests stood here and are gone with it — an opened-but-unsubmitted check, a
     * null session status, a check genuinely with Stripe, and a flagged one. Each
     * asserted that the journey told the creator the right thing about a step they can
     * no longer be on. The three states themselves are real and still tested, in
     * `PayoutIdentityGateTest`, which is where the creator now reads them.
     *
     * This guard is what stops identity quietly coming back: a step re-added here
     * would put an ID check in front of a creator trying to publish, which is the
     * friction the whole change removed.
     */
    public function test_identity_is_not_a_journey_step(): void
    {
        $this->assertArrayNotHasKey('identity', CreatorJourneyService::STEPS);
        $this->assertNotContains('identity', CreatorJourneyService::SETUP_STEPS);
        $this->assertNotContains('identity', CreatorJourneyService::nudgeableSteps());
    }

    /**
     * A creator who has never touched an ID check still finishes setup and is
     * celebrated — the one thing that used to hold `setupComplete()` open was the
     * identity step.
     */
    public function test_setup_completes_without_any_identity_check(): void
    {
        $creator = $this->creatorAt('first_listing');
        $creator->update(['identity_status' => 0, 'identity_admin_status' => 0]);

        $this->assertTrue($this->journey->setupComplete($creator->fresh()));
    }

    /**
     * 🚨 A PROFILE GOES LIVE WITH NOBODY LOOKING (11 Sep 2026). Five tests stood here
     * and described the old middle of the journey — an uploaded-but-unsubmitted
     * profile, a submitted one waiting on the team, the submit endpoint, a rejected
     * submission, and payouts being withheld until an admin approved. None of those
     * states exists: the assets are judged as they are saved and the lock follows.
     */
    public function test_a_complete_profile_needs_no_person(): void
    {
        $creator = $this->creatorAt('stripe');

        $this->assertSame(2, (int) $creator->profile_status_lock);
        $this->assertSame('stripe', $this->journey->currentStep($creator));
    }

    /** An asset a check pulled keeps its own step open — there is nowhere else to say it. */
    public function test_a_held_asset_reopens_its_own_step(): void
    {
        $creator = $this->creatorAt('stripe');
        // ⚠️ `update()` silently drops `avatar_approved` — it is not fillable, which is
        // deliberate (an approval is not something a posted form may set).
        $creator->forceFill(['avatar_approved' => 0])->save();

        $this->assertSame('profile', $this->journey->currentStep($creator->fresh()));
    }

    /** A reviewer's written reason is rendered on the asset's own step. */
    public function test_a_rejection_reason_is_shown_on_the_profile_step(): void
    {
        $creator = $this->creatorAt('stripe');
        $creator->forceFill([
            'avatar_approved' => 0,
            'profile_status_lock' => 0,
            'profile_reject_reason' => 'Bio mentions a brand name.',
        ])->save();

        $next = $this->journey->nextStep($creator->fresh());

        $this->assertSame('profile', $next['key']);
        $this->assertSame('Bio mentions a brand name.', $next['body']);
    }

    /** ⚠️ Money that came back out is not a first sale. */
    public function test_a_refunded_sale_does_not_count(): void
    {
        $creator = $this->creatorAt('first_sale');
        $this->sale($creator, 'refunded');

        $this->assertFalse($this->journey->isDone($creator->fresh(), 'first_sale'));

        $this->sale($creator, 'completed');
        $this->assertTrue($this->journey->isDone($creator->fresh(), 'first_sale'));
    }

    /** ⚠️ The platform writes thank-you posts; the creator did not. */
    public function test_a_system_thank_you_post_does_not_count_as_posting(): void
    {
        $creator = $this->creatorAt('first_post');
        $this->writePost($creator, 'support_thanks');

        $this->assertFalse($this->journey->isDone($creator->fresh(), 'first_post'));

        $this->writePost($creator);
        $this->assertTrue($this->journey->isDone($creator->fresh(), 'first_post'));
    }

    /** Approval is not in the creator's hands, so unapproved work still counts as done. */
    public function test_unapproved_work_still_advances_the_creator(): void
    {
        $creator = $this->creatorAt('first_listing');
        $this->publishTask($creator, approved: 0);

        $this->assertTrue($this->journey->isDone($creator->fresh(), 'first_listing'));

        $unapprovedPost = $this->writePost($creator, 'post', 0);
        $this->assertTrue($this->journey->isDone($creator->fresh(), 'first_post'));
        $this->assertNotNull($unapprovedPost->id);
    }

    public function test_fans_and_suspended_creators_have_no_journey(): void
    {
        $this->assertNull($this->journey->nextStep($this->creator(['role' => 0])));
        $this->assertNull($this->journey->nextStep($this->creator(['suspended_account' => 1])));
    }

    /** The one-query form and the six-query form must never disagree. */
    public function test_the_fast_listing_check_matches_the_plain_one(): void
    {
        $setup = app(CreatorSetupService::class);
        $creator = $this->creator();

        $this->assertSame($setup->hasAnyListing($creator), $setup->hasAnyListingFast($creator));

        $this->publishTask($creator);
        $creator = $creator->fresh();

        $this->assertTrue($setup->hasAnyListingFast($creator));
        $this->assertSame($setup->hasAnyListing($creator), $setup->hasAnyListingFast($creator));
    }

    public function test_sync_stores_the_step_and_is_idempotent(): void
    {
        $creator = $this->creatorAt('stripe');

        $this->assertTrue($this->journey->syncStep($creator));
        $this->assertSame('stripe', $creator->fresh()->journey_step);
        $this->assertNotNull($creator->fresh()->journey_step_at);

        // Nothing changed, so nothing is written — the entered-at timestamp must not move.
        $this->assertFalse($this->journey->syncStep($creator->fresh()));
    }

    /** ⚠️ Finishing once is a historical fact, not a current state. */
    public function test_completion_is_recorded_once_and_survives_a_regression(): void
    {
        $creator = $this->creatorAt(CreatorJourneyService::STEP_DONE);
        $this->journey->syncStep($creator);

        $completedAt = $creator->fresh()->journey_completed_at;
        $this->assertNotNull($completedAt);

        // They delete their only listing and fall back down the journey.
        Task::where('creator_id', $creator->id)->forceDelete();
        $this->journey->syncStep($creator->fresh());

        $after = $creator->fresh();
        $this->assertSame('first_listing', $after->journey_step);
        $this->assertNotNull($after->journey_completed_at, 'completion must not be erased');
    }

    /**
     * 🚨 THE CTA HAS TO OPEN THE FORM, NOT THE PAGE THE FORM IS BURIED IN.
     *
     * "Finish your profile" used to send the creator to `route('account')` and stop —
     * Account Settings, where the photo/bio form is a collapsed row partway down a page
     * of two dozen, behind a label that said "Manage your earnings and payouts".
     * Measured on live data, 25 Aug 2026: of the 33 creators who signed up in the
     * previous 90 days, 2 uploaded a photo and 0 wrote a bio.
     */
    public function test_the_profile_step_deep_links_into_the_editor(): void
    {
        $creator = $this->creator(['avatar_approved' => 0, 'bio_approved' => 0]);

        $next = app(CreatorJourneyService::class)->nextStep($creator);

        $this->assertSame('profile', $next['key']);
        $this->assertSame('account', $next['route']);
        $this->assertSame(['edit' => 'profile'], $next['params']);
    }

    /**
     * ⚠️ The param is worth nothing on its own — the PAGE has to read it.
     *
     * Both halves live in different languages and neither build nor scanner can see
     * that they agree, so this asserts the JSX still reads the key the server sends.
     * Without it, renaming one side leaves a CTA that navigates and does nothing —
     * which is indistinguishable from the bug this whole change exists to fix.
     */
    public function test_the_account_page_still_reads_the_deep_link(): void
    {
        $page = file_get_contents(resource_path('js/Pages/accountsetting/Accountsetting.jsx'));

        $this->assertStringContainsString('edit=profile', $page);
        $this->assertStringContainsString('autoOpen={openProfileEditor}', $page);
    }

    public function test_the_sync_command_reports_and_respects_dry_run(): void
    {
        $this->creatorAt('stripe');

        $this->artisan('journey:sync --dry-run')
            ->expectsOutputToContain('[dry-run]')
            ->assertSuccessful();

        $this->assertNull(User::where('role', 1)->first()->journey_step);

        $this->artisan('journey:sync')->assertSuccessful();
        $this->assertSame('stripe', User::where('role', 1)->first()->journey_step);
    }
}
