<?php

namespace Tests\Feature;

use App\Jobs\SendEngagementNotification;
use App\Models\EngagementNotification;
use App\Models\MonthlyCharge;
use App\Models\ProfileChangeRequest;
use App\Models\SocialLinks;
use App\Models\User;
use App\Support\ProfileSelfCheck;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Queue;
use Illuminate\Support\Str;
use Tests\TestCase;

/**
 * The creator hears what the review console's advisor would say, BEFORE a
 * reviewer says it — and the two read the same lists, so they cannot disagree.
 *
 * 🚨 The failure this pins: a creator wrote "gifting" into their bio, the form
 * accepted it (the bio had no content rule at all), the admin console flagged
 * it to the reviewer within seconds — and the creator found out days later as
 * a rejection naming a word they could have changed in ten seconds.
 */
class ProfileSelfCheckTest extends TestCase
{
    use RefreshDatabase;

    private function creator(array $overrides = []): User
    {
        return User::factory()->create(array_merge([
            'role' => 1,
            'profile_status_lock' => 1,
            'bio_approved' => 0,
        ], $overrides))->refresh();
    }

    public function test_banned_wording_in_a_pending_bio_is_a_blocking_finding(): void
    {
        $user = $this->creator(['bio' => 'I love generous pigs who enjoy spoiling, gifting and proving their devotion.']);

        $findings = ProfileSelfCheck::for($user);

        $this->assertCount(1, $findings);
        $this->assertSame('bio', $findings[0]['asset']);
        $this->assertSame(ProfileSelfCheck::BLOCKING, $findings[0]['severity']);
        $this->assertStringContainsString('"gifting"', $findings[0]['message']);
    }

    public function test_a_clean_pending_bio_raises_nothing(): void
    {
        $user = $this->creator(['bio' => 'Weekly behind-the-scenes photo sets and a members-only vlog.']);

        $this->assertSame([], ProfileSelfCheck::for($user));
    }

    /** An approved bio is settled — warning about it asks the creator to fix what a person already cleared. */
    public function test_an_approved_bio_is_never_flagged(): void
    {
        $user = $this->creator([
            'bio' => 'Gifting content every week.',
            'bio_approved' => 1,
        ]);

        $this->assertSame([], ProfileSelfCheck::for($user));
    }

    /** ⚠️ Judge what is BEING SUBMITTED: a pending edit's text, not the published column. */
    public function test_a_pending_bio_edit_is_judged_on_the_proposed_text(): void
    {
        $user = $this->creator([
            'bio' => 'Weekly behind-the-scenes photo sets for members.',
            'bio_approved' => 1,
        ]);

        ProfileChangeRequest::open($user, ProfileChangeRequest::ASSET_BIO,
            ['bio' => 'Spoil me with donations please'],
            ['bio' => $user->bio],
        );

        $findings = ProfileSelfCheck::for($user);

        $this->assertCount(1, $findings);
        $this->assertSame('bio', $findings[0]['asset']);
        $this->assertSame(ProfileSelfCheck::BLOCKING, $findings[0]['severity']);
    }

    public function test_contact_details_are_attention_not_blocking(): void
    {
        $user = $this->creator(['bio' => 'Message me any time on jane@example.com for anything.']);

        $findings = ProfileSelfCheck::for($user);

        $this->assertCount(1, $findings);
        $this->assertSame(ProfileSelfCheck::ATTENTION, $findings[0]['severity']);
        $this->assertStringContainsString('email address', $findings[0]['message']);
    }

    /**
     * 🚨 The scan's soft category wording, NEVER the raw Rekognition label —
     * the same rule every held-listing card follows.
     */
    public function test_a_scan_flagged_avatar_surfaces_the_stored_soft_reason(): void
    {
        $user = $this->creator([
            'bio' => 'Weekly behind-the-scenes photo sets for members.',
            'moderation_asset' => 'avatar',
            'moderation_reason' => 'This image looks like it may not meet our content guidelines.',
        ]);

        $findings = ProfileSelfCheck::for($user);

        $this->assertCount(1, $findings);
        $this->assertSame('avatar', $findings[0]['asset']);
        $this->assertStringContainsString('may not meet our content guidelines', $findings[0]['message']);
    }

    /** A shortened social link hides its destination — flagged like the advisor does. */
    public function test_a_shortened_social_link_is_flagged(): void
    {
        $user = $this->creator(['bio' => 'Weekly behind-the-scenes photo sets for members.']);

        $links = new SocialLinks([
            'instagram' => 'https://bit.ly/xyz',
        ]);
        $links->status = 0;

        $findings = ProfileSelfCheck::for($user, $links);

        $this->assertCount(1, $findings);
        $this->assertSame('socials', $findings[0]['asset']);
        $this->assertStringContainsString('shortened', $findings[0]['message']);
    }

    /** A gifter's profile_status_lock means something else entirely. */
    public function test_a_gifter_gets_no_findings(): void
    {
        $user = $this->creator(['role' => 0, 'bio' => 'gifting donations tip me']);

        $this->assertSame([], ProfileSelfCheck::for($user));
    }

    /** Nothing written yet is a checklist step, not a fault. */
    public function test_an_empty_bio_raises_nothing(): void
    {
        $user = $this->creator(['bio' => null]);

        $this->assertSame([], ProfileSelfCheck::for($user));
    }

    /* --------------------------------------------- the submit-time gate -- */

    /**
     * 🚨 The round trip this whole feature closes: banned wording is now refused
     * at the form, as a FIELD error — not swallowed by the generic catch, and
     * not accepted into a queue where only an admin would ever see it.
     */
    public function test_the_profile_form_refuses_banned_bio_wording_as_a_field_error(): void
    {
        $user = User::factory()->create([
            'role' => 1,
            'profile_status_lock' => 2,
            'country' => 'India',
            'identity_status' => 1,
        ])->refresh();

        $response = $this->actingAs($user)
            ->from(route('edit-profile'))
            ->post(route('edit-profile'), [
                'name' => $user->name,
                'username' => $user->username,
                'email' => $user->email,
                'bio' => 'Spoil me and send donations',
                'gender' => 'they',
                'country' => $user->country,
                'social_handle' => '',
            ]);

        $response->assertSessionHasErrors('bio');
        $response->assertSessionMissing('error');

        $this->assertNotSame('Spoil me and send donations', $user->fresh()->bio);
    }

    /**
     * 🚨 A NEW image gets a FRESH verdict. The scan only writes on a violation —
     * a clean result writes nothing — so without this clear, the reason left by
     * a rejected photo would be shown (here AND on the admin advisor) as a
     * verdict on the photo that replaced it.
     */
    public function test_uploading_a_new_avatar_clears_the_previous_scan_flag(): void
    {
        Queue::fake();

        $user = User::factory()->create([
            'role' => 1,
            'profile_status_lock' => 1,
            'country' => 'India',
            'avatar' => '11111111-1111-4111-8111-111111111111',
            'moderation_asset' => 'avatar',
            'moderation_reason' => 'This image looks like it may not meet our content guidelines.',
        ])->refresh();

        $this->actingAs($user)
            ->post(route('edit-profile'), [
                'name' => $user->name,
                'username' => $user->username,
                'email' => $user->email,
                'bio' => 'Weekly behind-the-scenes photo sets for members.',
                'gender' => 'they',
                'country' => $user->country,
                'social_handle' => '',
                'avatar' => ['uuid' => '22222222-2222-4222-8222-222222222222', 'cdnUrlModifiers' => null],
            ]);

        $user->refresh();

        $this->assertNull($user->moderation_asset);
        $this->assertNull($user->moderation_reason);
        $this->assertSame([], ProfileSelfCheck::for($user));
    }

    /* ------------------------------------------- the submit-time nudge -- */

    /**
     * A creator who passes `missingForReview` — photo, bio, a handle and a live
     * subscription period (`subscription_status` is an accessor over
     * `monthly_charges`, not a column, so the row is what makes it 1).
     */
    private function submitReady(array $overrides = []): User
    {
        $user = User::factory()->create(array_merge([
            'role' => 1,
            'profile_status_lock' => 0,
            'country' => 'India',
            'avatar' => '11111111-1111-4111-8111-111111111111',
            'bio' => 'Message me any time on jane@example.com for anything.',
            'bio_approved' => 0,
            'is_subscribed' => 1,
        ], $overrides))->refresh();

        MonthlyCharge::create([
            'user_id' => $user->id,
            'email' => $user->email,
            'currency' => 'GBP',
            'amount' => 8.99,
            'tax' => 1.80,
            'status' => 'trialing',
            'current_start_trial_date' => now()->subDay(),
            'current_end_trial_date' => now()->addDays(30),
        ]);

        SocialLinks::create([
            'uuid' => (string) Str::uuid(),
            'user_id' => $user->id,
            'instagram' => 'https://instagram.com/x',
            'status' => 0,
        ]);

        return $user->refresh();
    }

    /**
     * 🚨 THE TIMING IS THE FEATURE. The console has flagged these to reviewers
     * all along; the creator heard about it days later as a rejection.
     */
    public function test_submitting_with_a_finding_queues_a_bell_and_push_nudge(): void
    {
        Queue::fake();

        $user = $this->submitReady();

        $this->actingAs($user)->get(route('update.profile.lock.status'));

        $this->assertSame(1, (int) $user->fresh()->profile_status_lock);

        Queue::assertPushed(SendEngagementNotification::class, function ($job) {
            $channels = (new \ReflectionProperty($job, 'channels'))->getValue($job);

            // Bell and push only — a decision has its own email, and two
            // messages about one submission read as two problems.
            return $channels === ['bell', 'push'];
        });
    }

    /** Keyed on WHAT IS WRONG: resubmitting unchanged says the same thing twice otherwise. */
    public function test_resubmitting_the_same_problem_does_not_nudge_again(): void
    {
        Queue::fake();

        $user = $this->submitReady();

        $this->actingAs($user)->get(route('update.profile.lock.status'));
        $this->actingAs($user)->get(route('update.profile.lock.status'));

        Queue::assertPushed(SendEngagementNotification::class, 1);

        $this->assertSame(
            1,
            EngagementNotification::where('user_id', $user->id)
                ->where('type', 'profile_self_check')
                ->count()
        );
    }

    /** A clean profile is submitted in silence — nothing to fix, nothing to say. */
    public function test_a_clean_profile_is_submitted_without_a_nudge(): void
    {
        Queue::fake();

        $user = $this->submitReady(['bio' => 'Weekly behind-the-scenes photo sets and a members-only vlog.']);

        $this->actingAs($user)->get(route('update.profile.lock.status'));

        $this->assertSame(1, (int) $user->fresh()->profile_status_lock);
        Queue::assertNothingPushed();
    }
}
