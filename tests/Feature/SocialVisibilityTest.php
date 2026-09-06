<?php

namespace Tests\Feature;

use App\Models\SocialLinks;
use App\Models\User;
use App\Support\SocialVisibility;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Ramsey\Uuid\Uuid;
use Tests\TestCase;

/**
 * A social handle is collected to VERIFY a person, not to publish them.
 *
 * 🚨 Every test here guards the same direction: an absent, empty or unrecognised
 * value means HIDDEN. The failure that matters is the one where a handle the creator
 * did not choose to show ends up on their public page, so the positive cases are
 * deliberately outnumbered.
 */
class SocialVisibilityTest extends TestCase
{
    use RefreshDatabase;

    private function creator(array $links = []): User
    {
        $user = User::factory()->create(['role' => 1]);

        SocialLinks::create(array_merge([
            'user_id' => $user->id,
            'uuid' => (string) Uuid::uuid4(),
            'status' => SocialLinks::STATUS_APPROVED,
        ], $links));

        return $user->fresh();
    }

    private function linksFor(User $user): ?SocialLinks
    {
        return SocialLinks::where('user_id', $user->id)->first();
    }

    /**
     * 🚨 The whole point of the feature: every row that existed before the column did
     * carries NULL, and must read as hidden with no backfill and nothing for the
     * creator to do.
     */
    public function test_a_row_with_no_choice_shows_nothing(): void
    {
        $user = $this->creator(['instagram' => 'https://instagram.com/jane']);

        $this->assertFalse(SocialVisibility::hasAnyPublic($this->linksFor($user)));
        $this->assertNull(SocialVisibility::forVisitor($this->linksFor($user)));
    }

    public function test_a_chosen_and_approved_handle_is_public(): void
    {
        $user = $this->creator([
            'instagram' => 'https://instagram.com/jane',
            'public_platforms' => ['instagram'],
        ]);

        $payload = SocialVisibility::forVisitor($this->linksFor($user));

        $this->assertSame('https://instagram.com/jane', $payload['instagram']);
        $this->assertSame(['instagram'], $payload['public_platforms']);
    }

    /**
     * 🚨 A platform the creator did NOT choose must not ride along in the payload —
     * `CoverIdentity` renders any key it finds.
     */
    public function test_an_unchosen_handle_is_absent_from_the_visitor_payload(): void
    {
        $user = $this->creator([
            'instagram' => 'https://instagram.com/jane',
            'tiktok' => 'jane',
            'public_platforms' => ['instagram'],
        ]);

        $payload = SocialVisibility::forVisitor($this->linksFor($user));

        $this->assertArrayHasKey('instagram', $payload);
        $this->assertArrayNotHasKey('tiktok', $payload);
    }

    /**
     * 🚨 Turning a platform on is a DISPLAY choice and never a re-submission, so a
     * creator can tick a handle that is still pending — and a pending handle is one
     * nobody has checked. Publishing it would put an unreviewed link on a public page.
     */
    public function test_a_pending_handle_is_never_public_even_when_chosen(): void
    {
        $user = $this->creator([
            'instagram' => 'https://instagram.com/jane',
            'public_platforms' => ['instagram'],
            'status' => SocialLinks::STATUS_PENDING,
        ]);

        $this->assertFalse(SocialVisibility::isPublic($this->linksFor($user), 'instagram'));
        $this->assertNull(SocialVisibility::forVisitor($this->linksFor($user)));
    }

    public function test_a_rejected_row_is_never_public(): void
    {
        $user = $this->creator([
            'instagram' => 'https://instagram.com/jane',
            'public_platforms' => ['instagram'],
            'status' => SocialLinks::STATUS_REJECTED,
        ]);

        $this->assertNull(SocialVisibility::forVisitor($this->linksFor($user)));
    }

    /**
     * ⚠️ A choice with no handle behind it is not something to show. This is how a
     * creator who cleared a handle stops publishing it.
     */
    public function test_a_chosen_platform_with_no_handle_shows_nothing(): void
    {
        $user = $this->creator(['public_platforms' => ['instagram']]);

        $this->assertNull(SocialVisibility::forVisitor($this->linksFor($user)));
    }

    /**
     * ⚠️ A retired platform still renders on a profile, so it has to be hideable too.
     */
    public function test_a_retired_platform_can_be_shown_and_hidden(): void
    {
        $user = $this->creator([
            'facebook' => 'https://facebook.com/jane',
            'public_platforms' => ['facebook'],
        ]);

        $this->assertTrue(SocialVisibility::isPublic($this->linksFor($user), 'facebook'));
    }

    public function test_an_unknown_platform_key_is_dropped_rather_than_refused(): void
    {
        $this->assertSame(
            ['instagram'],
            SocialVisibility::sanitise(['instagram', 'myspace', 42, ['nested']]),
        );
    }

    /**
     * ⚠️ Judged against the handles the SAVE proposes, not the stored row — a creator
     * types a handle and shows it in the same submit.
     */
    public function test_storage_keeps_only_platforms_the_save_carries(): void
    {
        $this->assertSame(
            ['instagram'],
            SocialVisibility::forStorage(
                ['instagram', 'tiktok'],
                ['instagram' => 'https://instagram.com/jane', 'tiktok' => null],
            ),
        );
    }

    /**
     * 🚨 The OWNER sees everything — they cannot edit a handle the page will not send
     * them, and this is also the review state they read.
     */
    public function test_the_owner_receives_the_whole_row(): void
    {
        $user = $this->creator([
            'instagram' => 'https://instagram.com/jane',
            'tiktok' => 'jane',
        ]);

        $this->actingAs($user)
            ->get('/'.$user->username)
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->where('slinks.instagram', 'https://instagram.com/jane')
                ->where('slinks.tiktok', 'jane'));
    }

    /**
     * 🚨 The reported fault, end to end: an approved handle appeared on the public
     * profile with no way to take it off.
     */
    public function test_a_visitor_receives_nothing_until_the_creator_chooses(): void
    {
        $user = $this->creator(['instagram' => 'https://instagram.com/jane']);

        $this->get('/'.$user->username)
            ->assertOk()
            ->assertInertia(fn ($page) => $page->where('slinks', null));

        $this->linksFor($user)->forceFill(['public_platforms' => ['instagram']])->save();

        $this->get('/'.$user->username)
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->where('slinks.instagram', 'https://instagram.com/jane'));
    }

    /**
     * 🚨 Visibility is NOT reviewable content: hiding a handle must not re-open the
     * row for review, zero its status or supersede a request already pending.
     */
    public function test_changing_visibility_alone_does_not_re_open_the_review(): void
    {
        $user = $this->creator([
            'instagram' => 'https://instagram.com/jane',
            'public_platforms' => ['instagram'],
        ]);

        $this->actingAs($user)
            ->postJson(route('save_social_links'), [
                'instagram' => 'https://instagram.com/jane',
                'public_platforms' => [],
            ])
            ->assertOk();

        $links = $this->linksFor($user);

        $this->assertSame([], $links->public_platforms);
        $this->assertSame(SocialLinks::STATUS_APPROVED, (int) $links->status);
    }
}
