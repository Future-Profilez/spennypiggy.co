<?php

namespace Tests\Feature;

use App\Models\Post;
use App\Models\User;
use App\Services\PostingCadenceService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * Scheduled posts.
 *
 * The load-bearing property is that visibility is decided by TIME, through a
 * global scope on the model, not by a command — so a stopped queue worker cannot
 * silently swallow a creator's whole content calendar. The command owns only what
 * has to happen once: the release stamp, the cache clear, the notification.
 */
class ScheduledPostTest extends TestCase
{
    use RefreshDatabase;

    private function creator(): User
    {
        return User::factory()->create(['role' => 1]);
    }

    private function makePost(User $creator, array $attributes = []): Post
    {
        return Post::create(array_merge([
            'user_id' => $creator->id,
            'type' => 'image',
            'for_module' => 'membership',
            'title' => 'Studio update',
            'image' => 'abc',
            'approved' => 1,
        ], $attributes));
    }

    public function test_a_future_post_is_invisible_and_a_due_one_is_not(): void
    {
        $creator = $this->creator();
        $future = $this->makePost($creator, ['scheduled_at' => now()->addDay()]);
        $due = $this->makePost($creator, ['scheduled_at' => now()->subMinute()]);
        $plain = $this->makePost($creator);

        $visible = Post::pluck('id')->all();

        $this->assertNotContains($future->id, $visible);
        $this->assertContains($due->id, $visible);
        $this->assertContains($plain->id, $visible);
    }

    /** The owner has to be able to reach their own queue to change or cancel it. */
    public function test_with_scheduled_lifts_the_scope(): void
    {
        $creator = $this->creator();
        $future = $this->makePost($creator, ['scheduled_at' => now()->addDay()]);

        $this->assertNull(Post::find($future->id));
        $this->assertNotNull(Post::withScheduled()->find($future->id));
        $this->assertSame([$future->id], Post::onlyScheduled()->pluck('id')->all());
    }

    /**
     * ⚠️ A post nobody can read must not hold a creator's subscription income
     * open. This is why the scope is not viewer-aware.
     */
    public function test_a_queued_post_does_not_count_towards_the_posting_window(): void
    {
        $creator = $this->creator();
        $this->makePost($creator, ['scheduled_at' => now()->addDay()]);

        $this->assertSame(0, app(PostingCadenceService::class)->recentPostCount($creator));
    }

    public function test_the_creator_can_schedule_a_post(): void
    {
        $creator = $this->creator();
        $when = now()->addDays(2);

        $response = $this->actingAs($creator)->postJson('/post/save', [
            'type' => 'image',
            'for_module' => 'membership',
            'image' => 'uuid-1',
            'title' => 'Later',
            'scheduled_at' => $when->toIso8601String(),
        ]);

        $response->assertOk()->assertJson(['status' => true]);

        $post = Post::withScheduled()->where('title', 'Later')->first();

        $this->assertNotNull($post->scheduled_at);
        // created_at IS the publish time — every feed orders by it, so a post
        // keeping its drafting date would go live already buried.
        $this->assertSame(
            $post->scheduled_at->format('Y-m-d H:i'),
            $post->created_at->format('Y-m-d H:i')
        );
    }

    public function test_a_past_publish_time_is_refused(): void
    {
        $creator = $this->creator();

        $this->actingAs($creator)->postJson('/post/save', [
            'type' => 'image',
            'for_module' => 'membership',
            'image' => 'uuid-1',
            'scheduled_at' => now()->subDay()->toIso8601String(),
        ])->assertStatus(422);
    }

    public function test_scheduling_beyond_the_limit_is_refused(): void
    {
        $creator = $this->creator();

        $this->actingAs($creator)->postJson('/post/save', [
            'type' => 'image',
            'for_module' => 'membership',
            'image' => 'uuid-1',
            'scheduled_at' => now()->addDays(120)->toIso8601String(),
        ])->assertStatus(422);
    }

    /** Cancelling the schedule publishes it (subject to review) rather than stranding it. */
    public function test_clearing_the_schedule_brings_the_post_back(): void
    {
        $creator = $this->creator();
        $post = $this->makePost($creator, ['scheduled_at' => now()->addWeek()]);

        $this->actingAs($creator)->postJson('/post/edit/'.$post->uuid, [
            'type' => 'image',
            'for_module' => 'membership',
            'image' => 'uuid-1',
            'title' => 'Studio update',
            'scheduled_at' => null,
        ])->assertOk();

        $fresh = Post::withScheduled()->find($post->id);
        $this->assertNull($fresh->scheduled_at);
    }

    /**
     * ⚠️ An edit that carries no schedule field must not silently publish a
     * queued post — several callers post a partial payload, and "absent" is not
     * "the creator cleared it".
     */
    public function test_an_edit_without_the_field_leaves_the_schedule_alone(): void
    {
        $creator = $this->creator();
        $post = $this->makePost($creator, ['scheduled_at' => now()->addWeek()]);

        $this->actingAs($creator)->postJson('/post/edit/'.$post->uuid, [
            'type' => 'image',
            'for_module' => 'membership',
            'image' => 'uuid-1',
            'title' => 'Studio update',
        ])->assertOk();

        $this->assertNotNull(Post::withScheduled()->find($post->id)->scheduled_at);
    }

    public function test_the_publisher_releases_a_due_post_exactly_once(): void
    {
        $creator = $this->creator();
        $post = $this->makePost($creator, ['scheduled_at' => now()->subMinute()]);

        $this->artisan('posts:publish-scheduled')->assertSuccessful();
        $released = Post::withScheduled()->find($post->id)->schedule_released_at;
        $this->assertNotNull($released);

        // A second run must find nothing — the claim is the update.
        $this->artisan('posts:publish-scheduled')
            ->expectsOutputToContain('No scheduled posts are due.')
            ->assertSuccessful();
    }

    /** Approval is still the gate it always was. */
    public function test_an_unapproved_due_post_is_not_released(): void
    {
        $creator = $this->creator();
        $post = $this->makePost($creator, ['approved' => 0, 'scheduled_at' => now()->subMinute()]);

        $this->artisan('posts:publish-scheduled')->assertSuccessful();

        $this->assertNull(Post::withScheduled()->find($post->id)->schedule_released_at);
    }

    public function test_dry_run_releases_nothing(): void
    {
        $creator = $this->creator();
        $post = $this->makePost($creator, ['scheduled_at' => now()->subMinute()]);

        $this->artisan('posts:publish-scheduled --dry-run')->assertSuccessful();

        $this->assertNull(Post::withScheduled()->find($post->id)->schedule_released_at);
    }
}
