<?php

namespace Tests\Feature;

use App\Mail\FinishYourSetup;
use App\Models\MonthlyCharge;
use App\Models\SocialLinks;
use App\Models\User;
use App\Services\CreatorJourneyService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Str;
use Tests\TestCase;

/**
 * The gate on "Submit for review".
 *
 * 🚨 The first test is the bug this file was written for: the check read
 * `$user->socialLinks`, which is not a relation, so it resolved to NULL and
 * EVERY creator was refused for a missing social handle while their handle
 * rendered on the page behind the error. A guard that cannot fail on its own
 * case certifies what it missed.
 */
class SubmitProfileForReviewTest extends TestCase
{
    use RefreshDatabase;

    private function creator(array $attributes = [], bool $withCard = true): User
    {
        $user = User::factory()->create(array_merge([
            'role' => 1,
            'avatar' => 'https://ucarecdn.com/avatar/',
            'bio' => 'I am a musician',
            'profile_status_lock' => 0,
        ], $attributes));

        // `subscription_status` is an ACCESSOR over MonthlyCharge, not a column —
        // "card added" is a live subscription period, which is what the journey
        // card reads too.
        if ($withCard) {
            MonthlyCharge::create([
                'user_id' => $user->id,
                'status' => 'paid',
                'current_start_subscription_date' => now()->subDay(),
                'current_end_subscription_date' => now()->addMonth(),
            ]);
        }

        return $user->fresh();
    }

    private function handles(User $user, array $columns): void
    {
        SocialLinks::create(array_merge([
            'uuid' => (string) Str::uuid(),
            'user_id' => $user->id,
            'status' => 0,
        ], $columns));
    }

    public function test_a_complete_creator_can_submit_for_review(): void
    {
        $user = $this->creator();

        $this->handles($user, ['instagram' => 'ben_lewis']);

        $this->actingAs($user)
            ->post('/update-profile-lock-status')
            ->assertSessionHas('success');

        $this->assertSame(1, (int) $user->fresh()->profile_status_lock);
    }

    /**
     * A handle on a platform that is no longer accepted for NEW submissions is
     * still a handle — the creator was verified on it and it is on their profile.
     */
    public function test_a_legacy_platform_handle_counts_as_a_social_handle(): void
    {
        $user = $this->creator();

        $this->handles($user, ['facebook' => 'ben.lewis']);

        $this->actingAs($user)
            ->post('/update-profile-lock-status')
            ->assertSessionHas('success');
    }

    public function test_a_creator_with_no_handle_at_all_is_refused(): void
    {
        $user = $this->creator();

        $this->handles($user, []);

        $this->actingAs($user)->post('/update-profile-lock-status');

        $this->assertSame(0, (int) $user->fresh()->profile_status_lock);
        $this->assertStringContainsString('a social handle', session('error'));
    }

    public function test_the_other_two_requirements_still_block(): void
    {
        $user = $this->creator(['avatar' => null, 'bio' => null], withCard: false);

        $this->handles($user, ['instagram' => 'ben_lewis']);

        $this->actingAs($user)->post('/update-profile-lock-status');

        $error = session('error');
        $this->assertStringContainsString('a profile photo', $error);
        $this->assertStringContainsString('a bio', $error);
        $this->assertStringNotContainsString('a payment card', $error);
        $this->assertStringNotContainsString('a social handle', $error);
    }

    /**
     * 🚨 THE CARD COMES AFTER APPROVAL (client decision, 7 Sep 2026). A creator with
     * no card on file submits like anyone else — the card is asked once a person has
     * approved the profile, before payouts. Verified red against the old gate.
     */
    public function test_a_creator_with_no_card_can_submit_for_review(): void
    {
        $user = $this->creator(withCard: false);

        $this->handles($user, ['instagram' => 'ben_lewis']);

        $this->actingAs($user)->post('/update-profile-lock-status');

        $this->assertSame(1, (int) $user->fresh()->profile_status_lock);
    }

    /**
     * The Creator Studio path, end to end.
     *
     * 🚨 This is the flow the fix has to keep working: a creator who adds nothing
     * at signup and types their handle inside the app afterwards. It saves the
     * CANONICAL URL (the form's own output), where the signup form saves a bare
     * handle — one column, two shapes — so a check that only understood one of
     * them would refuse exactly one of the two ways a handle can arrive.
     */
    public function test_a_handle_added_inside_creator_studio_unlocks_submit(): void
    {
        $user = $this->creator();

        $this->actingAs($user)
            ->postJson('/save_social_links', [
                'instagram' => 'https://instagram.com/ben_lewis',
                'twitter' => null,
                'tiktok' => null,
            ])
            ->assertOk();

        // Saved as a normal submission, waiting for review — not auto-approved.
        $this->assertDatabaseHas('social_links', [
            'user_id' => $user->id,
            'instagram' => 'https://instagram.com/ben_lewis',
            'status' => 0,
        ]);

        $this->actingAs($user)
            ->post('/update-profile-lock-status')
            ->assertSessionHas('success');

        $this->assertSame(1, (int) $user->fresh()->profile_status_lock);
    }

    /**
     * ⚠️ An UNAPPROVED handle still unlocks submit — that is the point of the
     * step. Requiring approval first would deadlock the creator: nobody reviews
     * a profile that was never submitted.
     */
    public function test_submit_does_not_wait_for_the_handle_to_be_approved(): void
    {
        $user = $this->creator();
        $this->handles($user, ['tiktok' => 'ben_lewis']);

        $this->actingAs($user)
            ->post('/update-profile-lock-status')
            ->assertSessionHas('success');
    }

    public function test_rejected_bio_blocks_submit_until_creator_edits_it(): void
    {
        $user = $this->creator(['bio_approved' => 2, 'edit_bio_reason' => 'Too short.']);
        $this->handles($user, ['instagram' => 'ben_lewis']);

        // Attempting to submit without fixing the bio must be refused
        $this->actingAs($user)
            ->post('/update-profile-lock-status');

        $this->assertSame(0, (int) $user->fresh()->profile_status_lock);
        $this->assertStringContainsString('a bio', (string) session('error'));

        // Once the creator updates their bio, edit_bio_reason is cleared and submit succeeds
        $this->actingAs($user)
            ->post('/edit-profile', [
                'name' => $user->name,
                'username' => $user->username,
                'email' => $user->email,
                'bio' => 'Updated bio with more detail about music.',
            ])
            ->assertSessionHasNoErrors();

        $fresh = $user->fresh();
        $this->assertNull($fresh->edit_bio_reason);
        $this->assertSame(0, (int) $fresh->bio_approved);

        $this->actingAs($user)
            ->post('/update-profile-lock-status')
            ->assertSessionHas('success');

        $this->assertSame(1, (int) $user->fresh()->profile_status_lock);
    }

    public function test_rejected_social_handle_blocks_submit_until_updated(): void
    {
        $user = $this->creator();
        $this->handles($user, ['instagram' => 'ben_lewis']);
        $user->social_links()->update(['status' => SocialLinks::STATUS_REJECTED]);

        $this->actingAs($user)
            ->post('/update-profile-lock-status');

        $this->assertSame(0, (int) $user->fresh()->profile_status_lock);
        $this->assertStringContainsString('a social handle', (string) session('error'));
    }

    /**
     * 🚨 THE VERB IS THE FIX (7 Sep 2026).
     *
     * This route was a GET, so anything that merely FETCHES a URL submitted a
     * creator's profile for them — a browser link-preload, a hover prerender, an
     * extension link scanner, an inbox scanning the reminder email's own button.
     * Measured live: krystal555 went into the review queue at 12:36:34 from an admin
     * emulation session that clicked nothing, with `"method": "GET"` on the audit row.
     *
     * ⚠️ The assertion is about the METHOD, not about a message: a GET that answers
     * anything other than 405 is a GET that could be prefetched, whatever it returns.
     */
    public function test_the_route_refuses_a_get(): void
    {
        $user = $this->creator();
        $this->handles($user, ['instagram' => 'ben_lewis']);

        // ⚠️ 404, not 405: `web.php`'s `/{username}/{page?}` catch-all is declared after
        // `auth.php`, so the bare GET is read as a username and answered with the profile
        // 404. What matters is that it is not a success and NOTHING was written — a GET
        // that mutates is the fault, whatever status it renders.
        $response = $this->actingAs($user)->get('/update-profile-lock-status');

        $this->assertContains($response->getStatusCode(), [404, 405]);
        $this->assertSame(0, (int) $user->fresh()->profile_status_lock);
    }

    /**
     * 🚨 AN EMULATING ADMIN MAY NOT SUBMIT SOMEBODY ELSE'S PROFILE.
     *
     * Emulation has no write guard of its own — `EnforceEmulationTimeBox` only expires
     * the session — so an admin on a creator's steps page holds full write access as
     * that creator. Submitting is the creator's own declaration that they are ready,
     * and a reviewer cannot tell a submission the owner never made from one they did.
     */
    public function test_an_emulating_admin_cannot_submit_for_the_creator(): void
    {
        $user = $this->creator();
        $this->handles($user, ['instagram' => 'ben_lewis']);

        $this->actingAs($user)
            ->withSession(['emulated_by_admin' => true, 'emulation_admin_id' => 1])
            ->post('/update-profile-lock-status')
            ->assertSessionHas('error');

        $this->assertSame(0, (int) $user->fresh()->profile_status_lock);
    }

    /**
     * The control for the two guards above: a real creator, pressing the real button,
     * still submits. A verb change that quietly breaks the feature is not a fix.
     */
    public function test_the_creator_can_still_submit_after_the_verb_change(): void
    {
        $user = $this->creator(['profile_reject_reason' => 'Social handle: not a creator']);
        $this->handles($user, ['instagram' => 'ben_lewis']);

        $this->actingAs($user)
            ->post(route('update.profile.lock.status'))
            ->assertSessionHas('success');

        $fresh = $user->fresh();
        $this->assertSame(1, (int) $fresh->profile_status_lock);
        $this->assertNull($fresh->profile_reject_reason);
    }

    /**
     * 🚨 THE THREE CTAs AND THE ROUTE CANNOT DRIFT.
     *
     * `CreatorVerification`'s Submit link, `CreatorJourneyCard`'s button and
     * `OnboardingNudge`'s bar all render this step, and each one had to learn the new
     * verb. They read it from the payload rather than hardcoding it, so this asserts
     * the payload — the halves are in different languages and neither the build nor
     * any scanner can see that they agree.
     */
    public function test_the_journey_payload_carries_the_post_verb(): void
    {
        $user = $this->creator();
        $this->handles($user, ['instagram' => 'ben_lewis']);

        $step = app(CreatorJourneyService::class)->nextStep($user->fresh());

        $this->assertSame('review', $step['key']);
        $this->assertSame('update.profile.lock.status', $step['route']);
        $this->assertSame('post', $step['method']);

        // A GET step is untouched — the verb is read off the route, not listed.
        $this->assertSame('get', CreatorJourneyService::methodFor('dashboard'));
    }

    /**
     * 🚨 THE REMINDER EMAIL MUST NOT LINK AT THE ACTION.
     *
     * While the route was a GET this mail's button submitted the profile — including
     * when an inbox fetched the link on the recipient's behalf (Outlook Safe Links, a
     * spam filter, a link preview). So the mail asking somebody to submit could submit
     * for them. A POST-only step is sent to the page that carries the button instead.
     */
    public function test_the_reminder_email_does_not_link_at_the_submit_action(): void
    {
        $user = $this->creator();
        $this->handles($user, ['instagram' => 'ben_lewis']);

        $fresh = $user->fresh();
        $rendered = (new FinishYourSetup($fresh->id, (string) $fresh->name, 'review'))->render();

        $this->assertStringNotContainsString('update-profile-lock-status', $rendered);
        $this->assertStringContainsString($user->username, $rendered);
    }
}
