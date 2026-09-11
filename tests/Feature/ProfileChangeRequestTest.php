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
 * 1. AN ORDINARY EDIT NEVER DEMOTES A LIVE PROFILE. `profile_status_lock = 2 → 1` was
 *    not "under review", it was a punishment: the verified badge, Discover, search,
 *    trending, top-earners — DELISTING EVERY ITEM THE CREATOR SELLS — and Stripe
 *    onboarding. The value 1 no longer exists at all (migration `2026_09_11_100000`).
 *
 * 2. 🚨 REWRITTEN 11 Sep 2026. An edit to a live asset APPLIES IMMEDIATELY. It used to
 *    become a pending change request with the published value held for an admin to
 *    decide between; profiles approve themselves now, so the checks run in the
 *    validator, the edit lands, and a CLOSED request records that the machine allowed
 *    it — `decided_by_admin_id` null is what the daily report counts.
 *
 * ⚠️ MOST OF THIS FILE IS UNCHANGED, and that is the point: what counts as an EDIT is
 * the same hard-won set of rules. A save that changes nothing must write nothing, or
 * the daily report fills with edits nobody made — the same fault as the old queue
 * filling with reviews nobody asked for.
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

    // ------------------------------------------------------------------ no demotion

    public function test_changing_only_the_country_leaves_the_review_state_untouched(): void
    {
        $user = $this->approvedCreator();

        $this->save($user, ['country' => 'United Kingdom']);
        $user->refresh();

        $this->assertSame('United Kingdom', $user->country, 'The edit itself must still apply.');
        $this->assertSame(2, (int) $user->profile_status_lock);
        $this->assertSame(1, (int) $user->bio_approved, 'An unrelated edit must not re-open the bio.');
        $this->assertSame(self::LIVE_BIO, $user->bio);
        $this->assertSame(0, ProfileChangeRequest::count(), 'Nothing changed, so nothing is recorded.');
    }

    public function test_saving_social_handles_never_demotes_the_profile(): void
    {
        $user = $this->approvedCreator();

        SocialLinks::create([
            'user_id' => $user->id,
            'uuid' => '33333333-3333-4333-8333-333333333333',
            'instagram' => 'oldhandle',
            'status' => SocialLinks::STATUS_REJECTED,
            'reason' => 'That handle points nowhere.',
        ]);

        $this->actingAs($user)->post(route('save_social_links'), ['instagram' => 'newhandle']);

        $user->refresh();
        $links = SocialLinks::where('user_id', $user->id)->firstOrFail();

        $this->assertSame(2, (int) $user->profile_status_lock);
        $this->assertSame('newhandle', $links->instagram);

        // 🚨 Approved on save (11 Sep 2026). The checks ran in the controller and
        // passed; it used to land at 0 and wait for a person who no longer exists.
        $this->assertSame(SocialLinks::STATUS_APPROVED, (int) $links->status);

        // `reason` was missing from the model's `$fillable`, so a stale rejection
        // survived the re-save and rendered beside a pending status.
        $this->assertNull($links->reason);

        // The row's public identifier must not change because a handle was edited.
        $this->assertSame('33333333-3333-4333-8333-333333333333', $links->uuid);
    }

    // -------------------------------------------------------- live edits apply at once

    /** 🚨 The published text is REPLACED, not held. There is no reviewer to hold it for. */
    public function test_editing_a_live_bio_applies_at_once_and_is_recorded(): void
    {
        $user = $this->approvedCreator();

        $this->save($user, ['bio' => 'Now I make short films about mountains.']);
        $user->refresh();

        $this->assertSame('Now I make short films about mountains.', $user->bio);
        $this->assertSame(1, (int) $user->bio_approved);
        $this->assertSame(2, (int) $user->profile_status_lock);

        $record = ProfileChangeRequest::where('user_id', $user->id)->firstOrFail();
        $this->assertSame(ProfileChangeRequest::STATUS_APPROVED, $record->status);
        $this->assertNull($record->decided_by_admin_id, 'No admin decided it — that is what the report counts.');
        $this->assertSame(self::LIVE_BIO, $record->previous['bio']);
    }

    /**
     * 🚨 The new photo goes up at once (client direction: no delay). The scan runs
     * behind it and is what can pull it back down.
     */
    public function test_uploading_over_a_live_avatar_publishes_it_at_once(): void
    {
        Queue::fake();
        $user = $this->approvedCreator();
        $new = '44444444-4444-4444-8444-444444444444';

        $this->save($user, ['avatar' => ['uuid' => $new, 'cdnUrlModifiers' => null]]);
        $user->refresh();

        $this->assertSame($new, $user->avatar);
        $this->assertSame(1, (int) $user->avatar_approved);
        $this->assertSame(2, (int) $user->profile_status_lock);

        // The retraction is the scan's job, so it must actually be dispatched.
        Queue::assertPushed(CheckMediaModeration::class);
    }

    /** A crop is what the public sees, so changing it is an edit. */
    public function test_recropping_the_same_photo_is_a_change(): void
    {
        Queue::fake();
        $user = $this->approvedCreator();

        $this->save($user, ['avatar' => ['uuid' => self::LIVE_AVATAR, 'cdnUrlModifiers' => '-/crop/16:9/center/']]);

        $this->assertSame('-/crop/16:9/center/', $user->refresh()->avatar_cdn_modifier);
        $this->assertSame(1, ProfileChangeRequest::where('asset', 'avatar')->count());
    }

    public function test_resubmitting_the_identical_photo_is_not_a_change(): void
    {
        Queue::fake();
        $user = $this->approvedCreator();

        $this->save($user, ['avatar' => ['uuid' => self::LIVE_AVATAR, 'cdnUrlModifiers' => '-/crop/1:1/center/']]);

        $this->assertSame(0, ProfileChangeRequest::count());
        Queue::assertNotPushed(CheckMediaModeration::class);
    }

    public function test_editing_live_social_handles_applies_at_once(): void
    {
        $user = $this->approvedCreator();

        SocialLinks::create([
            'user_id' => $user->id,
            'uuid' => '55555555-5555-4555-8555-555555555555',
            'instagram' => 'coastalfilms',
            'twitter' => 'coastal_x',
            'status' => SocialLinks::STATUS_APPROVED,
        ]);

        $this->actingAs($user)->post(route('save_social_links'), [
            'instagram' => 'mountainfilms',
            'twitter' => 'coastal_x',
        ]);

        $links = SocialLinks::where('user_id', $user->id)->firstOrFail();

        $this->assertSame('mountainfilms', $links->instagram);
        $this->assertSame(SocialLinks::STATUS_APPROVED, (int) $links->status);
        $this->assertSame(2, (int) $user->fresh()->profile_status_lock);

        $record = ProfileChangeRequest::where('asset', 'socials')->firstOrFail();
        $this->assertNull($record->decided_by_admin_id);
        $this->assertSame('coastalfilms', $record->previous['instagram']);
    }

    /**
     * 🚨 `ConvertEmptyStringsToNull` is global, so a box the creator deliberately
     * emptied and a field the form never sent arrive IDENTICAL. Only the second is
     * not an edit.
     */
    public function test_a_handle_the_payload_does_not_carry_is_not_a_deletion(): void
    {
        $user = $this->approvedCreator();

        SocialLinks::create([
            'user_id' => $user->id,
            'uuid' => '66666666-6666-4666-8666-666666666666',
            'instagram' => 'coastalfilms',
            'twitter' => 'coastal_x',
            'status' => SocialLinks::STATUS_APPROVED,
        ]);

        $this->actingAs($user)->post(route('save_social_links'), ['instagram' => 'mountainfilms']);

        $links = SocialLinks::where('user_id', $user->id)->firstOrFail();
        $this->assertSame('mountainfilms', $links->instagram);
        $this->assertSame('coastal_x', $links->twitter, 'A field the form did not send is not a deletion.');
    }

    public function test_re_saving_identical_handles_is_not_an_edit(): void
    {
        $user = $this->approvedCreator();

        SocialLinks::create([
            'user_id' => $user->id,
            'uuid' => '99999999-9999-4999-8999-999999999999',
            'instagram' => 'coastalfilms',
            'status' => SocialLinks::STATUS_APPROVED,
        ]);

        $this->actingAs($user)->post(route('save_social_links'), ['instagram' => 'coastalfilms']);

        $this->assertSame(0, ProfileChangeRequest::count(), 'A save that changes nothing records nothing.');
    }

    public function test_a_real_handle_edit_is_still_a_change(): void
    {
        $user = $this->approvedCreator();

        SocialLinks::create([
            'user_id' => $user->id,
            'uuid' => '77777777-7777-4777-8777-777777777777',
            'instagram' => 'coastalfilms',
            'status' => SocialLinks::STATUS_APPROVED,
        ]);

        $this->actingAs($user)->post(route('save_social_links'), ['instagram' => 'somethingelse']);

        $this->assertSame('somethingelse', SocialLinks::where('user_id', $user->id)->value('instagram'));
        $this->assertSame(1, ProfileChangeRequest::where('asset', 'socials')->count());
    }

    /**
     * ⚠️ A REJECTED row is deliberately let through unchanged. `status = 2` means an
     * admin asked for something, and refusing an unchanged re-submit would leave the
     * creator holding a rejection they cannot clear.
     */
    public function test_a_rejected_row_may_be_resubmitted_unchanged(): void
    {
        $user = $this->approvedCreator();

        SocialLinks::create([
            'user_id' => $user->id,
            'uuid' => 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
            'instagram' => 'coastalfilms',
            'status' => SocialLinks::STATUS_REJECTED,
            'reason' => 'Please use the account you post on.',
        ]);

        $this->actingAs($user)->post(route('save_social_links'), ['instagram' => 'coastalfilms']);

        $links = SocialLinks::where('user_id', $user->id)->firstOrFail();
        $this->assertSame(SocialLinks::STATUS_APPROVED, (int) $links->status);
        $this->assertNull($links->reason);
    }

    /**
     * A creator who is not live yet is not editing anything the public saw, so nothing
     * is recorded — the report is about changes to a live page.
     */
    public function test_a_creator_who_is_not_live_records_nothing(): void
    {
        $user = $this->approvedCreator(['profile_status_lock' => 0, 'bio_approved' => 0]);

        $this->save($user, ['bio' => 'A first attempt at a bio.']);

        $this->assertSame('A first attempt at a bio.', $user->fresh()->bio);
        $this->assertSame(1, (int) $user->fresh()->bio_approved);
        $this->assertSame(0, ProfileChangeRequest::count());
    }

    /** One asset changing must not record or touch the others. */
    public function test_an_edit_is_per_asset_not_per_profile(): void
    {
        $user = $this->approvedCreator();

        $this->save($user, ['bio' => 'Only the bio moved in this save.']);

        $this->assertSame(1, ProfileChangeRequest::where('asset', 'bio')->count());
        $this->assertSame(0, ProfileChangeRequest::where('asset', 'avatar')->count());
        $this->assertSame(self::LIVE_AVATAR, $user->fresh()->avatar);
    }

    public function test_a_curated_cover_goes_live_immediately(): void
    {
        Queue::fake();
        $user = $this->approvedCreator();
        $preset = array_key_first(PresetCovers::COVERS);

        $this->save($user, ['cover' => ['uuid' => $preset, 'cdnUrlModifiers' => null]]);
        $user->refresh();

        $this->assertSame($preset, $user->cover);
        $this->assertSame(1, (int) $user->cover_approved, 'A curated cover is pre-approved.');

        // ⚠️ Never re-scanned: a false positive would pull the same banner off every
        // profile using it.
        Queue::assertNotPushed(CheckMediaModeration::class);
    }

    /**
     * 🚨 A NEW image gets a FRESH verdict. The scan only ever WRITES
     * `users.moderation_reason` — a clean result writes nothing — so a reason left by
     * the previous photo would outlive it and be read as a verdict on its replacement.
     */
    public function test_a_new_photo_clears_the_previous_scan_reason(): void
    {
        Queue::fake();
        $user = $this->approvedCreator([
            'moderation_asset' => 'avatar',
            'moderation_reason' => 'Held by our automated check on your profile photo.',
        ]);

        $this->save($user, ['avatar' => ['uuid' => '88888888-8888-4888-8888-888888888888', 'cdnUrlModifiers' => null]]);

        $user->refresh();
        $this->assertNull($user->moderation_reason);
        $this->assertNull($user->moderation_asset);
        Queue::assertPushed(CheckMediaModeration::class);
    }

    // ------------------------------------------------------- the bio must really change

    /**
     * 🚨 A creator opened the profile editor, generated a social banner and saved.
     * Their bio went into the review queue proposing to DELETE itself, because
     * `ConvertEmptyStringsToNull` turns an absent `bio` into null and
     * `null !== 'their live bio'` is true. A field the request did not carry is
     * not an edit — the same rule `creator_category` and `pride_badges` already
     * follow in that controller.
     */
    public function test_a_payload_that_does_not_carry_the_bio_is_not_a_bio_edit(): void
    {
        $user = $this->approvedCreator();

        $payload = $this->editProfilePayload($user);
        unset($payload['bio']);

        $this->actingAs($user)->post(route('edit-profile'), $payload);

        $this->assertSame(0, ProfileChangeRequest::count(), 'An absent field is not a request to clear it.');
        $this->assertSame(self::LIVE_BIO, $user->refresh()->bio);
        $this->assertSame(1, (int) $user->bio_approved);
    }

    /**
     * The admin panel decides "is this actually different?" with
     * `CreatorReviewService::normaliseText`, so a bio differing only by a trailing
     * newline opened a request the review screen then drew as MATCH — a reviewer
     * looking at two identical paragraphs, asked to approve one of them.
     */
    public function test_whitespace_alone_is_not_a_bio_edit(): void
    {
        $user = $this->approvedCreator();

        // An internal line break, not just outer padding: `TrimStrings` already
        // removes the latter, so padding alone would pass against the bug.
        $this->save($user, ['bio' => "  I make short films\r\nabout  coastal towns.\n"]);

        $this->assertSame(0, ProfileChangeRequest::count());
        $this->assertSame(self::LIVE_BIO, $user->refresh()->bio);
    }

    /**
     * Reported from production: the creator had not touched their bio, and the admin
     * queue showed the SAME text on both sides of the comparison. Three differences
     * do that - none of them visible to anybody, and `\s` matches none of the first.
     *
     * @dataProvider invisibleBioDifferences
     */
    public function test_an_invisible_difference_is_not_a_bio_edit(string $posted): void
    {
        $user = $this->approvedCreator();

        $this->save($user, ['bio' => $posted]);

        $this->assertSame(0, ProfileChangeRequest::count());
        $this->assertSame(self::LIVE_BIO, $user->refresh()->bio);
    }

    /**
     * Both of these sit MID-STRING, and that is the whole point. Laravel's own
     * `TrimStrings` strips `\s`, U+FEFF, U+200B and U+200E from the ENDS of every
     * input, so a leading or trailing invisible never reaches the comparison and a
     * fixture built from one passes against the bug it was written to catch.
     * `\s` matches none of these in the middle, under `/u` or otherwise.
     */
    public static function invisibleBioDifferences(): array
    {
        return [
            // U+200B, pasted in from a web page or a word processor.
            'a zero-width space' => ["I make short films\u{200B} about coastal towns."],
            // U+FEFF, carried in from a text file saved on Windows.
            'a byte-order mark' => ["I make short films about\u{FEFF} coastal towns."],
        ];
    }

    /** The same letter, composed and decomposed - identical on screen, different bytes. */
    public function test_a_decomposed_accent_is_not_a_bio_edit(): void
    {
        $user = $this->approvedCreator(['bio' => "I film in caf\u{00E9}s."]);

        $this->save($user, ['bio' => "I film in cafe\u{0301}s."]);

        $this->assertSame(0, ProfileChangeRequest::count());
    }

    /** The control for the invisible-character cases above. */
    public function test_a_real_bio_edit_is_still_a_change(): void
    {
        $user = $this->approvedCreator();

        $this->save($user, ['bio' => self::LIVE_BIO.' And the people in them.']);

        $this->assertSame(1, ProfileChangeRequest::where('asset', 'bio')->count());
        $this->assertStringContainsString('And the people in them.', $user->fresh()->bio);
    }

    /**
     * 🚨 Two edits are two records, and the LIVE value is the later one. Under the old
     * queue the second save SUPERSEDED the first and only one row survived; each is now
     * a thing that happened, and the report shows both.
     */
    public function test_editing_twice_records_both_and_keeps_the_later_value(): void
    {
        $user = $this->approvedCreator();

        $this->save($user, ['bio' => 'First rewrite of the bio text.']);
        $this->save($user->fresh(), ['bio' => 'Second rewrite of the bio text.']);

        $this->assertSame('Second rewrite of the bio text.', $user->fresh()->bio);
        $this->assertSame(2, ProfileChangeRequest::where('asset', 'bio')->count());
        $this->assertSame(0, ProfileChangeRequest::pending()->count(), 'Nothing waits on anybody.');
    }

    /**
     * 🚨 A SAVE THAT CHANGES NOTHING WRITES NOTHING — the invariant that survived the
     * rewrite intact. Re-saving the same text must not fill the report with edits
     * nobody made.
     */
    public function test_re_saving_the_same_bio_records_nothing(): void
    {
        $user = $this->approvedCreator();

        $this->save($user, ['bio' => 'A genuinely new bio about mountains.']);
        $this->assertSame(1, ProfileChangeRequest::where('asset', 'bio')->count());

        $this->save($user->fresh(), ['bio' => 'A genuinely new bio about mountains.']);
        $this->assertSame(1, ProfileChangeRequest::where('asset', 'bio')->count(), 'The second save changed nothing.');
    }
}
