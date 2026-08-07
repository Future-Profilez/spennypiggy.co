<?php

namespace Tests\Feature;

use App\Jobs\CheckMediaModeration;
use App\Models\ProfileChangeRequest;
use App\Models\SocialLinks;
use App\Models\User;
use App\Support\PresetCovers;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Queue;
use Tests\TestCase;

/**
 * `POST /edit-profile` and `POST /save_social_links` had no test of any kind.
 *
 * They could not have one: `ProfileController::__construct` builds an Uploadcare
 * client from keys absent from `.env.testing`, and both Uploadcare constructors are
 * typed `string`, so every route on the controller died with a TypeError before
 * reaching any of its own error handling.
 *
 * Two rules are pinned here.
 *
 * 1. `profile_status_lock = 2 → 1` is not "under review", it is a punishment: the
 *    verified badge, Discover, search, trending, top-earners — DELISTING EVERY ITEM
 *    THE CREATOR SELLS — and Stripe onboarding. Nothing on the website sets it back.
 *
 * 2. An edit to an asset that is already live becomes a change request. The live
 *    column is never touched, so the public keeps seeing the approved version and a
 *    rejection costs nothing. A creator who is not live yet keeps the old path.
 */
class ProfileChangeRequestTest extends TestCase
{
    use RefreshDatabase;

    private const LIVE_AVATAR = '11111111-1111-4111-8111-111111111111';

    private const LIVE_COVER = '22222222-2222-4222-8222-222222222222';

    private const LIVE_BIO = 'I make short films about coastal towns.';

    /** An approved creator, with every reviewable asset already live. */
    private function approvedCreator(array $overrides = []): User
    {
        return User::factory()->create(array_merge([
            'role' => 1,
            'profile_status_lock' => 2,
            'avatar' => self::LIVE_AVATAR,
            'avatar_approved' => 1,
            'avatar_cdn_modifier' => '-/crop/1:1/center/',
            'cover' => self::LIVE_COVER,
            'cover_approved' => 1,
            'bio' => self::LIVE_BIO,
            'bio_approved' => 1,
            'country' => 'India',
            // Keeps `CheckStripeIdentityVerification` from intercepting the POST.
            'identity_status' => 1,
        ], $overrides))->refresh();
    }

    /**
     * Inertia posts the whole `useForm` object on every save, so a payload that
     * omits fields is not reproducing what the browser does.
     */
    private function editProfilePayload(User $user, array $overrides = []): array
    {
        return array_merge([
            'name' => $user->name,
            'username' => $user->username,
            'email' => $user->email,
            'bio' => $user->bio,
            'gender' => 'they',
            'country' => $user->country,
            // The form always sends this. `social_handle` is not a column, and
            // `ConvertEmptyStringsToNull` (Kernel.php:72) turns it into null before
            // the controller sees it.
            'social_handle' => '',
        ], $overrides);
    }

    private function save(User $user, array $overrides = []): void
    {
        $this->actingAs($user)->post(route('edit-profile'), $this->editProfilePayload($user, $overrides));
    }

    // ---------------------------------------------------------------- the demotion

    public function test_changing_only_the_country_leaves_the_review_state_untouched(): void
    {
        $user = $this->approvedCreator();

        $this->save($user, ['country' => 'United Kingdom']);
        $user->refresh();

        $this->assertSame('United Kingdom', $user->country, 'The edit itself must still apply.');
        $this->assertSame(2, (int) $user->profile_status_lock);
        $this->assertSame(1, (int) $user->bio_approved, 'An unrelated edit must not re-open the bio.');
        $this->assertSame(self::LIVE_BIO, $user->bio);
        $this->assertSame(0, ProfileChangeRequest::count(), 'Nothing changed, so nothing is waiting on review.');
    }

    public function test_saving_social_handles_never_demotes_the_profile(): void
    {
        $user = $this->approvedCreator();

        SocialLinks::create([
            'user_id' => $user->id,
            'uuid' => '33333333-3333-4333-8333-333333333333',
            'instagram' => 'oldhandle',
            'status' => 2,
            'reason' => 'That handle points nowhere.',
        ]);

        $this->actingAs($user)->post(route('save_social_links'), ['instagram' => 'newhandle']);

        $user->refresh();
        $links = SocialLinks::where('user_id', $user->id)->firstOrFail();

        $this->assertSame(2, (int) $user->profile_status_lock);

        // These handles were REJECTED, not live, so the save writes straight through.
        $this->assertSame('newhandle', $links->instagram);
        $this->assertSame(0, (int) $links->status);

        // `reason` was missing from the website model's `$fillable`, so a stale
        // rejection survived the re-save and rendered beside a pending status.
        $this->assertNull($links->reason);

        // The row's public identifier must not change because a handle was edited.
        $this->assertSame('33333333-3333-4333-8333-333333333333', $links->uuid);
    }

    // ------------------------------------------------------------ live assets defer

    public function test_editing_a_live_bio_leaves_the_published_text_in_place(): void
    {
        $user = $this->approvedCreator();

        $this->save($user, ['bio' => 'I make short films about harbour towns.']);
        $user->refresh();

        $this->assertSame(self::LIVE_BIO, $user->bio, 'The approved bio stays public until an admin decides.');
        $this->assertSame(1, (int) $user->bio_approved);
        $this->assertSame(2, (int) $user->profile_status_lock);

        $change = ProfileChangeRequest::openFor($user->id, ProfileChangeRequest::ASSET_BIO);
        $this->assertNotNull($change);
        $this->assertSame('I make short films about harbour towns.', $change->proposed['bio']);
        $this->assertSame(self::LIVE_BIO, $change->previous['bio'], 'The diff needs the value it was edited from.');
    }

    public function test_uploading_over_a_live_avatar_does_not_destroy_it(): void
    {
        $user = $this->approvedCreator();
        $new = '55555555-5555-4555-8555-555555555555';

        $this->save($user, ['avatar' => ['uuid' => $new, 'cdnUrlModifiers' => '-/crop/1:1/center/']]);
        $user->refresh();

        // The whole point: the approved uuid used to be overwritten and lost, and the
        // public then saw the generic placeholder because the flag had dropped to 0.
        $this->assertSame(self::LIVE_AVATAR, $user->avatar);
        $this->assertSame(1, (int) $user->avatar_approved);

        $change = ProfileChangeRequest::openFor($user->id, ProfileChangeRequest::ASSET_AVATAR);
        $this->assertSame($new, $change->proposed['uuid']);
        $this->assertSame(self::LIVE_AVATAR, $change->previous['uuid']);
    }

    public function test_recropping_the_same_photo_is_a_change(): void
    {
        $user = $this->approvedCreator();

        $this->save($user, [
            'avatar' => ['uuid' => self::LIVE_AVATAR, 'cdnUrlModifiers' => '-/crop/16:9/center/'],
        ]);

        $change = ProfileChangeRequest::openFor($user->id, ProfileChangeRequest::ASSET_AVATAR);

        $this->assertNotNull($change, 'A re-crop changes what the public sees even though the uuid does not.');
        $this->assertSame('-/crop/16:9/center/', $change->proposed['cdn_modifier']);
    }

    public function test_resubmitting_the_identical_photo_is_not_a_change(): void
    {
        $user = $this->approvedCreator();

        $this->save($user, [
            'avatar' => ['uuid' => self::LIVE_AVATAR, 'cdnUrlModifiers' => '-/crop/1:1/center/'],
        ]);

        $this->assertSame(0, ProfileChangeRequest::count());
        $this->assertSame(1, (int) $user->refresh()->avatar_approved, 'Re-saving must not re-open a cleared photo.');
    }

    public function test_editing_live_social_handles_leaves_the_published_ones_in_place(): void
    {
        $user = $this->approvedCreator();

        SocialLinks::create([
            'user_id' => $user->id,
            'uuid' => '33333333-3333-4333-8333-333333333333',
            'instagram' => 'livehandle',
            'twitter' => 'livetwitter',
            'status' => 1,
        ]);

        $this->actingAs($user)->post(route('save_social_links'), ['instagram' => 'newhandle']);

        $links = SocialLinks::where('user_id', $user->id)->firstOrFail();

        $this->assertSame('livehandle', $links->instagram, 'The approved handles stay public.');
        $this->assertSame(1, (int) $links->status);

        $change = ProfileChangeRequest::openFor($user->id, ProfileChangeRequest::ASSET_SOCIALS);
        $this->assertSame('newhandle', $change->proposed['instagram']);

        // 🚨 A removed platform is a change carried by an explicit null. Filtering
        // nulls out of the proposed map would silently drop every deletion.
        $this->assertArrayHasKey('twitter', $change->proposed);
        $this->assertNull($change->proposed['twitter']);
    }

    // ------------------------------------------------------- not-live keeps old path

    public function test_a_creator_whose_bio_was_never_approved_writes_straight_through(): void
    {
        $user = $this->approvedCreator(['bio_approved' => 0]);

        $this->save($user, ['bio' => 'First attempt at a bio.']);
        $user->refresh();

        $this->assertSame('First attempt at a bio.', $user->bio);
        $this->assertSame(0, (int) $user->bio_approved);
        $this->assertSame(0, ProfileChangeRequest::count(), 'There is nothing public to protect.');
    }

    public function test_the_gate_is_per_asset_not_per_profile(): void
    {
        // An approved profile whose cover was never cleared. Gating on
        // `profile_status_lock` would have parked this in review for no reason.
        $user = $this->approvedCreator(['cover_approved' => 0]);

        $this->save($user, [
            'cover' => ['uuid' => '66666666-6666-4666-8666-666666666666', 'cdnUrlModifiers' => null],
        ]);

        $this->assertSame('66666666-6666-4666-8666-666666666666', $user->refresh()->cover);
        $this->assertSame(0, ProfileChangeRequest::count());
    }

    public function test_a_curated_cover_goes_live_immediately(): void
    {
        $user = $this->approvedCreator();
        $preset = array_key_first(PresetCovers::COVERS);

        $this->save($user, ['cover' => ['uuid' => $preset, 'cdnUrlModifiers' => null]]);
        $user->refresh();

        $this->assertSame($preset, $user->cover);
        $this->assertSame(1, (int) $user->cover_approved, 'A curated cover is pre-approved.');
        $this->assertSame(0, ProfileChangeRequest::count(), 'Holding it would queue work nobody needs to do.');
    }

    // ------------------------------------------------------------------- supersession

    public function test_editing_twice_leaves_one_open_request_carrying_the_later_value(): void
    {
        $user = $this->approvedCreator();

        $this->save($user, ['bio' => 'Second thoughts.']);
        $this->save($user, ['bio' => 'Third thoughts.']);

        $open = ProfileChangeRequest::where('user_id', $user->id)
            ->where('status', ProfileChangeRequest::STATUS_PENDING)
            ->get();

        $this->assertCount(1, $open);
        $this->assertSame('Third thoughts.', $open->first()->proposed['bio']);

        $superseded = ProfileChangeRequest::where('user_id', $user->id)
            ->where('status', ProfileChangeRequest::STATUS_SUPERSEDED)
            ->first();

        $this->assertNotNull($superseded);
        $this->assertNull($superseded->active_key, 'A closed row must free the key or the asset locks forever.');
    }

    public function test_a_pending_photo_is_scanned_against_its_own_row_not_the_live_one(): void
    {
        Queue::fake();

        $user = $this->approvedCreator();
        $new = '88888888-8888-4888-8888-888888888888';

        $this->save($user, ['avatar' => ['uuid' => $new, 'cdnUrlModifiers' => null]]);

        $change = ProfileChangeRequest::openFor($user->id, ProfileChangeRequest::ASSET_AVATAR);

        Queue::assertPushed(CheckMediaModeration::class, function ($job) use ($change, $new) {
            // 🚨 Scanning against `users` would write the verdict to
            // `users.moderation_reason`, which describes the LIVE photo — and
            // CreatorReviewAdvisor reads that column, so the console would recommend
            // rejecting the photo the admin already approved.
            return $this->jobProperty($job, 'modelClass') === ProfileChangeRequest::class
                && (int) $this->jobProperty($job, 'modelId') === (int) $change->id
                && $this->jobProperty($job, 'mediaUuid') === $new;
        });
    }

    /** The job's constructor arguments are protected; read them for the assertion. */
    private function jobProperty(object $job, string $name): mixed
    {
        $property = new \ReflectionProperty($job, $name);
        $property->setAccessible(true);

        return $property->getValue($job);
    }

    public function test_the_public_payload_does_not_move_while_a_change_is_pending(): void
    {
        $user = $this->approvedCreator();

        $before = [$user->avatar_url, $user->cover_url, $user->bio];

        $this->save($user, [
            'bio' => 'Rewritten.',
            'avatar' => ['uuid' => '77777777-7777-4777-8777-777777777777', 'cdnUrlModifiers' => null],
        ]);

        // A fresh instance, so no in-memory state carries over.
        $public = User::findOrFail($user->id);

        $this->assertSame($before, [$public->avatar_url, $public->cover_url, $public->bio]);
    }
}
