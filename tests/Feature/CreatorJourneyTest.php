<?php

namespace Tests\Feature;

use App\Models\FinancialTransaction;
use App\Models\MonthlyCharge;
use App\Models\Post;
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

        $creator = $this->creator([
            'avatar' => in_array('profile', $done, true) ? 'uuid' : null,
            'avatar_approved' => in_array('profile', $done, true) ? 1 : 0,
            'bio' => in_array('profile', $done, true) ? 'Hello' : null,
            'bio_approved' => in_array('profile', $done, true) ? 1 : 0,
            'identity_status' => in_array('identity', $done, true) ? 1 : 0,
            'stripe_details_submitted' => in_array('stripe', $done, true) ? 1 : 0,
        ]);

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

    /**
     * ⚠️ The whole point of the feature: never ask for work already done.
     */
    public function test_a_submitted_but_unapproved_profile_is_awaiting_review_not_a_task(): void
    {
        $creator = $this->creator(['avatar' => 'uuid', 'bio' => 'Hello', 'avatar_approved' => 0, 'bio_approved' => 0]);

        $next = $this->journey->nextStep($creator);

        $this->assertSame('profile', $next['key']);
        $this->assertTrue($next['awaiting_review']);
        $this->assertSame(CreatorJourneyService::REVIEW_COPY['profile']['title'], $next['title']);
        $this->assertNull($next['cta'], 'there is nothing for them to click');
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

    public function test_identity_submitted_to_stripe_is_awaiting_review(): void
    {
        // 2 = submitted, waiting on Stripe's answer.
        $creator = $this->creatorAt('identity');
        $creator->update(['identity_status' => 2]);

        $next = $this->journey->nextStep($creator->fresh());

        $this->assertSame('identity', $next['key']);
        $this->assertTrue($next['awaiting_review']);
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
