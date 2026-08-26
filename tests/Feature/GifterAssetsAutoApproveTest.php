<?php

namespace Tests\Feature;

use App\Models\ProfileChangeRequest;
use App\Models\User;
use App\Support\ProfileAssetVisibility;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * A gifter's own assets are approved as they save them.
 *
 * 🚨 The second save is the case that broke. A gifter's FIRST bio auto-approved,
 * which made it "live" — and `isLive()` is what decides whether the next edit
 * opens a change request, so every edit after the first silently went into a
 * queue nobody works. The value they typed would never have appeared.
 *
 * A change request exists to protect a PUBLISHED value while an admin looks at
 * the replacement. Nothing about a gifter is reviewed, so there is nothing to
 * protect and nobody to wait for.
 */
class GifterAssetsAutoApproveTest extends TestCase
{
    use RefreshDatabase;

    public static function assets(): array
    {
        return [
            'bio' => [ProfileChangeRequest::ASSET_BIO],
            'avatar' => [ProfileChangeRequest::ASSET_AVATAR],
            'cover' => [ProfileChangeRequest::ASSET_COVER],
            'socials' => [ProfileChangeRequest::ASSET_SOCIALS],
        ];
    }

    /** @dataProvider assets */
    public function test_an_already_live_gifter_asset_still_never_opens_a_change_request(string $asset): void
    {
        $gifter = User::factory()->create([
            'role' => 0,
            'avatar' => 'live-avatar-uuid',
            'avatar_approved' => 1,
            'cover' => 'live-cover-uuid',
            'cover_approved' => 1,
            'bio' => 'I support people I like.',
            'bio_approved' => 1,
        ]);

        $this->assertFalse(
            ProfileAssetVisibility::isLive($gifter, $asset),
            'A gifter must never take the review branch, however approved the value already is.'
        );
    }

    /** @dataProvider assets */
    public function test_a_creator_with_the_same_data_does_open_one(string $asset): void
    {
        // ⚠️ The other half, asserted deliberately: the guard must be about the
        // ROLE, not about something that quietly stopped change requests working
        // for everybody.
        $creator = User::factory()->create([
            'role' => 1,
            'avatar' => 'live-avatar-uuid',
            'avatar_approved' => 1,
            'cover' => 'live-cover-uuid',
            'cover_approved' => 1,
            'bio' => 'I make handmade ceramics in Bristol.',
            'bio_approved' => 1,
        ]);

        // Socials live on their own row, which this fixture does not create — the
        // other three carry the property on the user.
        if ($asset === ProfileChangeRequest::ASSET_SOCIALS) {
            $this->assertFalse(ProfileAssetVisibility::isLive($creator, $asset));

            return;
        }

        $this->assertTrue(ProfileAssetVisibility::isLive($creator, $asset));
    }
}
