<?php

namespace Tests\Feature;

use App\Models\Post;
use App\Models\PostSlugHistory;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Schema;
use Tests\TestCase;

/**
 * `posts.slug` carries a UNIQUE index, so anything that hides a row from the
 * uniqueness check is a 500 on the creator's own post button.
 *
 * 🚨 This is a production regression: an untitled post fell back to the literal slug
 * `post`, the row already holding it was SOFT-DELETED and therefore invisible to the
 * check, and the insert died with
 * `Duplicate entry 'post' for key 'posts.posts_slug_unique'`.
 */
class PostSlugUniquenessTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        // Columns declared by no migration — the documented schema gap.
        Schema::table('posts', function ($table) {
            foreach (['type', 'for_module'] as $column) {
                if (! Schema::hasColumn('posts', $column)) {
                    $table->string($column)->nullable();
                }
            }
            if (! Schema::hasColumn('posts', 'approved')) {
                $table->boolean('approved')->default(0);
            }
        });
    }

    private function creator(array $overrides = []): User
    {
        return User::factory()->create(array_merge([
            'role' => 1,
            'suspended_account' => 0,
        ], $overrides));
    }

    private function makePost(User $creator, array $attributes = []): Post
    {
        return Post::factory()->create(array_merge([
            'user_id' => $creator->id,
            'for_module' => 'membership',
            'approved' => 1,
            'type' => 'image',
        ], $attributes));
    }

    public function test_a_trashed_post_still_owns_its_slug(): void
    {
        $creator = $this->creator();
        $this->makePost($creator, ['title' => 'My doggo'])->delete();

        // Before the fix this returned "my-doggo" and the insert hit the unique index.
        $slug = Post::generateUniqueSlug('My doggo', null, $creator->id);

        $this->assertNotSame('my-doggo', $slug);
    }

    public function test_a_scheduled_post_still_owns_its_slug(): void
    {
        $creator = $this->creator();
        $this->makePost($creator, [
            'title' => 'Out and about',
            'scheduled_at' => now()->addDays(2),
        ]);

        $this->assertNotSame('out-and-about', Post::generateUniqueSlug('Out and about', null, $creator->id));
    }

    public function test_a_retired_slug_is_not_handed_to_a_new_post(): void
    {
        $creator = $this->creator();
        $post = $this->makePost($creator, ['title' => 'Renamed later']);
        PostSlugHistory::create(['slug' => 'the-old-name', 'post_id' => $post->id]);

        // Taking it would collide on that table's own unique index AND shadow the 301
        // that sends an already-shared link to the post which used to own it.
        $this->assertNotSame('the-old-name', Post::generateUniqueSlug('The old name', null, $creator->id));
    }

    public function test_the_collision_fallback_is_the_creators_username(): void
    {
        $creator = $this->creator(['username' => 'justjack99']);
        $this->makePost($creator, ['title' => 'My doggo']);

        $this->assertSame('my-doggo-justjack99', Post::generateUniqueSlug('My doggo', null, $creator->id));
    }

    public function test_a_free_slug_is_used_as_is(): void
    {
        $creator = $this->creator(['username' => 'justjack99']);

        // The username is a fallback, never a decoration on every URL.
        $this->assertSame('my-doggo', Post::generateUniqueSlug('My doggo', null, $creator->id));
    }

    public function test_the_same_creator_posting_the_same_title_twice_still_gets_a_slug(): void
    {
        $creator = $this->creator(['username' => 'justjack99']);
        $this->makePost($creator, ['title' => 'My doggo']);
        $this->makePost($creator, ['title' => 'My doggo', 'slug' => 'my-doggo-justjack99']);

        $slug = Post::generateUniqueSlug('My doggo', null, $creator->id);

        $this->assertNotSame('my-doggo', $slug);
        $this->assertNotSame('my-doggo-justjack99', $slug);
    }

    public function test_editing_a_post_may_keep_its_own_slug(): void
    {
        $creator = $this->creator();
        $post = $this->makePost($creator, ['title' => 'My doggo']);

        // Without the ignore, a retitle back to the same words would walk the ladder
        // and rename the post's own URL for no reason.
        $this->assertSame('my-doggo', Post::generateUniqueSlug('My doggo', $post->id, $creator->id));
    }

    public function test_every_generated_slug_actually_inserts(): void
    {
        $creator = $this->creator(['username' => 'justjack99']);
        $this->makePost($creator, ['title' => 'My doggo'])->delete();

        // The real assertion is that this does not throw a unique-constraint violation.
        $second = $this->makePost($creator, ['title' => 'My doggo', 'slug' => null]);
        $third = $this->makePost($creator, ['title' => 'My doggo', 'slug' => null]);

        $this->assertNotSame($second->slug, $third->slug);
        $this->assertNotEmpty($second->slug);
        $this->assertNotEmpty($third->slug);
    }
}
