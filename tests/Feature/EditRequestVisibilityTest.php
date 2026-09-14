<?php

namespace Tests\Feature;

use App\Models\Post;
use App\Models\User;
use App\Services\UserProfileService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Tests\TestCase;

/**
 * What a reviewer asked a creator to change is the CREATOR's to read.
 *
 * 🚨 An edit request deliberately leaves the item PUBLISHED — that is the whole
 * point of it, against a takedown — so the row a visitor loads is the same row
 * that carries the request. Two payloads shipped it to everybody before this was
 * caught: the public shop select had the column added to it by mistake, and the
 * post select is not branched by viewer at all.
 *
 * The rule is the one `CreatorAvailabilityMessageService` already follows: a
 * stranger is never told the specifics of a decision about somebody else's
 * account.
 */
class EditRequestVisibilityTest extends TestCase
{
    use RefreshDatabase;

    private function creatorWithPost(): array
    {
        $creator = User::factory()->create(['role' => 1, 'suspended_account' => 0]);

        $post = Post::create([
            'uuid' => (string) Str::uuid(),
            'user_id' => $creator->id,
            'title' => 'Behind the scenes',
            'content' => 'A note for supporters.',
            'approved' => 1,
        ]);

        DB::table('posts')->where('id', $post->id)->update([
            'edit_requested_reason' => 'Please remove the phone number.',
            'moderation_reason' => 'A check flagged the image.',
        ]);

        return [$creator, $post];
    }

    /**
     * ⚠️ Reflection because `getOptimizedPosts` is private — and it should stay
     * private. Widening a method's visibility so a test can reach it makes the
     * test the reason the method is callable from anywhere.
     */
    private function posts(int $creatorId, bool $isOwner): array
    {
        $method = new \ReflectionMethod(UserProfileService::class, 'getOptimizedPosts');
        $method->setAccessible(true);

        return $method->invoke(app(UserProfileService::class), $creatorId, $isOwner, 10);
    }

    public function test_a_visitor_never_reads_the_request(): void
    {
        [$creator] = $this->creatorWithPost();

        $posts = $this->posts($creator->id, false);

        $this->assertNotEmpty($posts, 'The post itself is public — only the reasons are not.');
        $this->assertNull($posts[0]['edit_requested_reason'] ?? null);
        $this->assertNull($posts[0]['moderation_reason'] ?? null);
    }

    public function test_the_creator_reads_their_own_request(): void
    {
        [$creator] = $this->creatorWithPost();

        $this->actingAs($creator);

        $posts = $this->posts($creator->id, true);

        $this->assertSame('Please remove the phone number.', $posts[0]['edit_requested_reason'] ?? null);
    }

    /**
     * 🚨 THE PUBLIC SHOP SELECT IS A COLUMN ALLOWLIST, AND THE COLUMN WAS ADDED
     * TO IT BY MISTAKE. The owner branch takes no `select()` at all and already
     * has every column, so putting it in the public list gained the creator
     * nothing and shipped the request to every visitor.
     */
    public function test_the_public_shop_payload_does_not_list_the_request(): void
    {
        $source = file_get_contents(app_path('Services/UserProfileService.php'));

        $publicSelect = substr(
            $source,
            strpos($source, "} else {\n            \$query->select(["),
            1800
        );

        $this->assertStringNotContainsString(
            "'edit_requested_reason',",
            $publicSelect,
            'The public shop select must not carry what a reviewer privately asked the creator.'
        );
    }
}
