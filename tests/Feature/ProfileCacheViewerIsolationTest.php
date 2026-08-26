<?php

namespace Tests\Feature;

use App\Models\Post;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Tests\TestCase;

/**
 * 🚨 A PROFILE PAGE CACHE THAT IS NOT KEYED BY VIEWER SERVES PAID CONTENT TO
 * STRANGERS.
 *
 * `getCachedPageSpecificData()` caches what `getPageSpecificData()` builds, and
 * every part of that is viewer-dependent: `executePostsQuery()` reads `Auth::id()`
 * itself and decides `is_lock` from THAT person's subscriptions, memberships,
 * bills and tips, stripping media only for a viewer it judges unentitled. The
 * owner branches (`Auth::id() === $userId`) are evaluated inside the closure too,
 * so a creator's own view of unapproved, suspended and moderation-held listings —
 * with the internal rejection reasons — is baked in as well.
 *
 * Until 25 Aug 2026 `$isOwner` set the TTL and NOT the key, so:
 *   • a paying member's unlocked payload was served to every anonymous visitor
 *     for the next 600 seconds, and
 *   • the creator's own held listings were served to the public for 30.
 *
 * On Vapor the cache is the shared Redis, so this crossed containers.
 */
class ProfileCacheViewerIsolationTest extends TestCase
{
    use RefreshDatabase;

    private function creatorWithLockedPost(): array
    {
        $creator = User::factory()->create([
            'role' => 1,
            'username' => 'creator'.Str::random(6),
            'suspended_account' => 0,
            'profile_status_lock' => 2,
        ]);

        /*
         * ⚠️ `slug` and `approved` are required and were missing from the first
         * version of this fixture, which 500'd the profile route — a failure that
         * looks exactly like the bug under test until you read the exception.
         */
        $post = Post::create([
            'uuid' => (string) Str::uuid(),
            'user_id' => $creator->id,
            'title' => 'Members only',
            'slug' => 'members-only-'.Str::random(6),
            'content' => 'THE-PAID-BODY-NOBODY-ELSE-MAY-SEE',
            'for_module' => 'membership',
            'type' => 'image',
            'status' => 1,
            'approved' => 1,
        ]);

        return [$creator, $post];
    }

    /**
     * 🚨 THE LEAK, IN ONE TEST: the owner loads their own profile first and fills
     * the cache, then a stranger asks for the same page. The stranger must not be
     * handed the owner's unlocked view.
     */
    public function test_an_owners_cached_page_is_not_served_to_a_visitor(): void
    {
        [$creator, $post] = $this->creatorWithLockedPost();

        Cache::flush();

        // Owner primes the cache — for them the post is never locked.
        $this->actingAs($creator)->get('/'.$creator->username)->assertOk();

        // A stranger asks for the same URL.
        $stranger = User::factory()->create(['role' => 0]);

        $html = $this->actingAs($stranger)
            ->get('/'.$creator->username)
            ->assertOk()
            ->getContent();

        $this->assertStringNotContainsString(
            'THE-PAID-BODY-NOBODY-ELSE-MAY-SEE',
            $html,
            'A stranger was served the body of a members-only post out of the owner\'s cache entry.'
        );
    }

    /** ⚠️ And the same in the other direction — a guest must not get it either. */
    public function test_a_guest_is_not_served_the_owners_cached_page(): void
    {
        [$creator] = $this->creatorWithLockedPost();

        Cache::flush();

        $this->actingAs($creator)->get('/'.$creator->username)->assertOk();

        /*
         * ⚠️ `actingAs()` STICKS FOR THE REST OF THE TEST. Without this the second
         * request is still the creator, the body is legitimately present, and the
         * test fails while reporting a leak that is not there — which is exactly
         * what the first version of it did.
         */
        auth()->logout();
        $this->flushSession();

        $html = $this->get('/'.$creator->username)->assertOk()->getContent();

        $this->assertStringNotContainsString('THE-PAID-BODY-NOBODY-ELSE-MAY-SEE', $html);
    }

    /**
     * ⚠️ AND THE CACHE MUST STILL WORK. A "fix" that simply stopped caching would
     * pass both tests above while quietly costing every profile view its query
     * savings, so this asserts the guest render is actually served from cache the
     * second time.
     */
    public function test_a_repeat_guest_view_is_served_from_cache(): void
    {
        [$creator] = $this->creatorWithLockedPost();

        Cache::flush();

        $this->get('/'.$creator->username)->assertOk();

        // Second identical request: if nothing was cached, this would re-run the
        // profile queries. Assert by counting queries rather than by guessing the
        // cache key, whose version token is not fixed.
        $queries = 0;
        DB::listen(function () use (&$queries) {
            $queries++;
        });

        $this->get('/'.$creator->username)->assertOk();

        $this->assertLessThan(
            40,
            $queries,
            'The second guest view ran as many queries as the first — the page cache is not being used.'
        );
    }
}
