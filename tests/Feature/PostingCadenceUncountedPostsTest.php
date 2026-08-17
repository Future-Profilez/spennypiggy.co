<?php

namespace Tests\Feature;

use App\Models\Post;
use App\Models\User;
use App\Services\PostingCadenceService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Schema;
use Tests\TestCase;

/**
 * Why a creator who HAS posted still reads 0 / 3.
 *
 * ⚠️ Two rules silently exclude a post the creator can see on their own profile: it is
 * not approved yet, and it went to the wrong audience. Both produce the same number,
 * and the number on its own is indistinguishable from having posted nothing — which is
 * what creators raise tickets about. These assert the counts that explain it.
 *
 * The counts must NEVER be folded into `member_posts`: that number is the rule that
 * pauses real subscription income, and a meter reading 3 / 3 while collection stops is
 * worse than the confusion it would be fixing.
 */
class PostingCadenceUncountedPostsTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        // `posts.type` / `for_module` / `approved` are declared by no migration on a
        // database built from migrations alone — the same schema gap documented for
        // `users.role`. Patch them in so this can run at all.
        Schema::table('posts', function ($table) {
            foreach (['type' => 'string', 'for_module' => 'string'] as $column => $type) {
                if (! Schema::hasColumn('posts', $column)) {
                    $table->{$type}($column)->nullable();
                }
            }
            if (! Schema::hasColumn('posts', 'approved')) {
                $table->boolean('approved')->default(0);
            }
        });
    }

    private function creator(): User
    {
        return User::factory()->create(['role' => 1, 'suspended_account' => 0]);
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

    public function test_an_unapproved_member_post_is_reported_as_waiting_not_as_counting(): void
    {
        $creator = $this->creator();
        $this->makePost($creator, ['approved' => 0]);
        $this->makePost($creator, ['approved' => 0]);

        $status = app(PostingCadenceService::class)->statusFor($creator);

        // The rule is unchanged — this is the number that pauses income.
        $this->assertSame(0, $status['member_posts']);
        // ...and the creator is told where their work went.
        $this->assertSame(2, $status['pending_review']);
    }

    public function test_an_approved_member_post_is_not_double_counted_as_waiting(): void
    {
        $creator = $this->creator();
        $this->makePost($creator);

        $status = app(PostingCadenceService::class)->statusFor($creator);

        $this->assertSame(1, $status['member_posts']);
        $this->assertSame(0, $status['pending_review']);
    }

    public function test_a_public_post_is_reported_as_the_wrong_audience(): void
    {
        $creator = $this->creator();
        $this->makePost($creator, ['for_module' => 'public']);
        $this->makePost($creator, ['for_module' => null]);

        $status = app(PostingCadenceService::class)->statusFor($creator);

        $this->assertSame(0, $status['member_posts']);
        $this->assertSame(2, $status['non_member_posts']);
    }

    public function test_a_platform_written_thank_you_post_counts_as_nothing_at_all(): void
    {
        $creator = $this->creator();
        $this->makePost($creator, ['for_module' => 'public', 'type' => 'support_thanks']);

        $status = app(PostingCadenceService::class)->statusFor($creator);

        // It is not the creator's work, so it must not appear as a near-miss they can fix.
        $this->assertSame(0, $status['member_posts']);
        $this->assertSame(0, $status['non_member_posts']);
        $this->assertSame(0, $status['pending_review']);
    }

    public function test_a_post_outside_the_window_is_not_reported_as_waiting(): void
    {
        $creator = $this->creator();
        $old = $this->makePost($creator, ['approved' => 0]);
        $old->forceFill([
            'created_at' => now()->subDays(PostingCadenceService::WINDOW_DAYS + 1),
        ])->saveQuietly();

        $status = app(PostingCadenceService::class)->statusFor($creator);

        // Approving it would not help — its created_at is already outside the window,
        // so promising the creator it will count would be a lie.
        $this->assertSame(0, $status['pending_review']);
    }

    public function test_a_creator_who_already_meets_the_threshold_is_not_told_about_public_posts(): void
    {
        $creator = $this->creator();
        for ($i = 0; $i < PostingCadenceService::MIN_POSTS; $i++) {
            $this->makePost($creator);
        }
        $this->makePost($creator, ['for_module' => 'public']);

        $status = app(PostingCadenceService::class)->statusFor($creator);

        $this->assertSame(PostingCadenceService::MIN_POSTS, $status['member_posts']);
        // Nothing is wrong, so there is nothing to explain — a creator who is fine does
        // not need to be told their public posts are public.
        $this->assertSame(0, $status['non_member_posts']);
    }

    public function test_the_checklist_leads_with_the_posts_waiting_for_approval(): void
    {
        $creator = $this->creator();
        $this->makePost($creator, ['approved' => 0]);

        $keys = collect(app(PostingCadenceService::class)->statusFor($creator)['checklist'])
            ->pluck('key')
            ->all();

        // Telling this creator to write another post first is both wrong and the reason
        // the number looked broken to them.
        $this->assertSame('awaiting_review', $keys[0]);
    }

    public function test_the_checklist_says_nothing_about_approval_when_nothing_is_waiting(): void
    {
        $creator = $this->creator();

        $keys = collect(app(PostingCadenceService::class)->statusFor($creator)['checklist'])
            ->pluck('key')
            ->all();

        $this->assertNotContains('awaiting_review', $keys);
        $this->assertNotContains('wrong_audience', $keys);
    }
}
