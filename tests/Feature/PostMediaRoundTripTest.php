<?php

namespace Tests\Feature;

use App\Http\Controllers\Auth\PostsController;
use ReflectionMethod;
use Tests\TestCase;

/**
 * 🚨 THE COMPOSER ROUND-TRIPS, SO THE WRITE PATH HAS TO WHITELIST.
 *
 * `AddPost.jsx` opens an edit with the post's own stored `media` array
 * (`mediaFromItem`) and submits it back verbatim (`media: mediaList`), and
 * `dedupeMedia` is the ONE write path for both store and update. So any key a
 * read-time accessor appends to an entry is persisted again on the next edit —
 * for ever.
 *
 * That is the `piggy_pots.cover_media` trap, and it is what has blocked signing
 * a members-only post's multi-image media: a signed URL carries an EXPIRY, and
 * an expired URL saved into the column is a permanently broken link that nothing
 * can tell apart from a real one. With this guard in place, an accessor can add
 * `signed_url` safely, because the write path drops it again.
 */
class PostMediaRoundTripTest extends TestCase
{
    private function dedupe(array $media)
    {
        $method = new ReflectionMethod(PostsController::class, 'dedupeMedia');
        $method->setAccessible(true);

        return $method->invoke(app(PostsController::class), $media);
    }

    /** The uploader's own shape survives untouched — this must not cost a creator a file. */
    public function test_the_uploaders_own_keys_are_all_kept(): void
    {
        $entry = [
            'uuid' => 'bf58abcf-3269-4b15-90a7-3ea45f80e0a7',
            'url' => 'https://ucarecdn.com/bf58abcf-3269-4b15-90a7-3ea45f80e0a7/',
            'name' => 'photo.png',
            'size' => 2137427,
            'mimeType' => 'image',
            'mimeSubtype' => 'png',
            'isImage' => true,
            'isVideo' => false,
            'isAudio' => false,
        ];

        $this->assertSame([$entry], $this->dedupe([$entry]));
    }

    /**
     * 🚨 THE ONE THAT MATTERS: a server-derived, EXPIRING value handed back by
     * the edit form is not stored.
     */
    public function test_a_signed_url_handed_back_by_the_edit_form_is_not_persisted(): void
    {
        $stored = $this->dedupe([[
            'uuid' => 'bf58abcf-3269-4b15-90a7-3ea45f80e0a7',
            'signed_url' => 'https://ucarecdn.com/bf58abcf-.../?token=exp=1755900000~hmac=deadbeef',
            'watermarked_url' => 'https://ucarecdn.com/bf58abcf-.../-/overlay/x/',
        ]]);

        $this->assertSame([['uuid' => 'bf58abcf-3269-4b15-90a7-3ea45f80e0a7']], $stored);
        $this->assertArrayNotHasKey('signed_url', $stored[0]);
        $this->assertArrayNotHasKey('watermarked_url', $stored[0]);
    }

    /** ⚠️ Deduping still works after the filter — the two run in one pass. */
    public function test_a_duplicate_uuid_is_still_collapsed(): void
    {
        $stored = $this->dedupe([
            ['uuid' => 'a', 'signed_url' => 'x'],
            ['uuid' => 'a'],
            ['uuid' => 'b'],
        ]);

        $this->assertSame([['uuid' => 'a'], ['uuid' => 'b']], $stored);
    }

    /**
     * ⚠️ A non-array entry is passed through rather than guessed at. Dropping a
     * file the creator watched upload is worse than storing a shape we did not
     * expect.
     */
    public function test_a_non_array_entry_is_left_alone(): void
    {
        $this->assertSame(['just-a-uuid'], $this->dedupe(['just-a-uuid']));
    }
}
