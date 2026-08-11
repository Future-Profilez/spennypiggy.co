<?php

namespace Tests\Feature;

use App\Models\ProfileChangeRequest;
use App\Models\SocialLinks;
use App\Models\User;
use App\Support\ProfileAssetVisibility;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Str;
use Tests\TestCase;

/**
 * A creator may now verify against Twitter, Instagram or TikTok only
 * (client decision, 11 Aug 2026).
 *
 * 🚨 What this replaces: the form accepted THIRTEEN platforms — including
 * Facebook and YouTube, both of which the published rule explicitly excludes —
 * and offered no TikTok field at all, despite naming it as one of the three. A
 * creator who read the rule and came to comply with it literally could not.
 *
 * ⚠️ The retired columns are NOT deleted, and the tests below pin that down: a
 * creator verified on YouTube or Facebook before the narrowing keeps their
 * approved handle, keeps it rendered, and must not lose it the first time they
 * edit their Instagram.
 */
class AcceptedSocialPlatformsTest extends TestCase
{
    use RefreshDatabase;

    private function creator(): User
    {
        return User::factory()->create(['role' => 1]);
    }

    public function test_exactly_three_platforms_are_accepted(): void
    {
        $this->assertSame(['twitter', 'instagram', 'tiktok'], SocialLinks::ACCEPTED_PLATFORMS);
    }

    public function test_tiktok_is_storable(): void
    {
        // It was named in the rule for months with no column to put it in.
        $creator = $this->creator();

        SocialLinks::create([
            // ⚠️ `social_links.uuid` is NOT NULL and the model has no creating
            // hook to fill it — the controller supplies it. A direct create
            // therefore has to as well.
            'uuid' => (string) Str::uuid(),
            'user_id' => $creator->id,
            'tiktok' => '@someone',
        ]);

        $this->assertSame('@someone', SocialLinks::where('user_id', $creator->id)->value('tiktok'));
    }

    public function test_a_creator_can_verify_with_tiktok_alone(): void
    {
        $creator = $this->creator();
        $this->actingAs($creator);

        $response = $this->postJson(route('save_social_links'), ['tiktok' => '@someone']);

        $response->assertOk();
        $this->assertDatabaseHas('social_links', [
            'user_id' => $creator->id,
            'tiktok' => '@someone',
        ]);
    }

    public function test_a_submission_with_only_a_retired_platform_is_refused(): void
    {
        // Facebook alone no longer satisfies the requirement — that is the whole
        // change. The refusal is the generic "add at least one", because the
        // form does not offer the field in the first place.
        $creator = $this->creator();
        $this->actingAs($creator);

        $response = $this->postJson(route('save_social_links'), ['facebook' => 'someone']);

        $response->assertStatus(422);
        $this->assertDatabaseMissing('social_links', ['user_id' => $creator->id]);
    }

    /**
     * 🚨 The one that would have cost real creators their verification.
     *
     * The controller used to write EVERY platform column from the request. With
     * the retired fields gone from the form, `$request->facebook` is always
     * null — so the first time an existing creator edited their Instagram, the
     * save would have quietly wiped the Facebook handle they were approved on.
     */
    public function test_editing_an_accepted_handle_does_not_wipe_a_retired_one(): void
    {
        $creator = $this->creator();
        $this->actingAs($creator);

        SocialLinks::create([
            'uuid' => (string) Str::uuid(),
            'user_id' => $creator->id,
            'facebook' => 'legacy.page',
            'youtube' => 'https://youtube.com/@legacy',
            'instagram' => '@old',
            'status' => 1,
        ]);

        $this->postJson(route('save_social_links'), ['instagram' => '@new'])->assertOk();

        $links = SocialLinks::where('user_id', $creator->id)->first();

        $this->assertSame('legacy.page', $links->facebook, 'an approved retired handle must survive an edit');
        $this->assertSame('https://youtube.com/@legacy', $links->youtube);
    }

    public function test_a_retired_handle_still_counts_as_the_creator_having_one(): void
    {
        // Read by the change-request layer to tell "never submitted" from "has a
        // published set". A creator verified on YouTube has a published set.
        $links = new SocialLinks(['youtube' => 'https://youtube.com/@legacy']);

        $this->assertTrue(ProfileAssetVisibility::hasAnyHandle($links));
    }

    public function test_tiktok_is_carried_through_the_change_request_snapshot(): void
    {
        // A field absent from SOCIAL_FIELDS is a field an approval silently
        // drops: the creator's edit is reviewed and then not applied.
        $this->assertContains('tiktok', ProfileChangeRequest::SOCIAL_FIELDS);
    }

    public function test_every_accepted_platform_is_in_the_change_request_snapshot(): void
    {
        foreach (SocialLinks::ACCEPTED_PLATFORMS as $platform) {
            $this->assertContains($platform, ProfileChangeRequest::SOCIAL_FIELDS);
            $this->assertContains($platform, ProfileAssetVisibility::HANDLE_COLUMNS);
        }
    }
}
