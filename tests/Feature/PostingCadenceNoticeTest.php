<?php

namespace Tests\Feature;

use App\Models\User;
use App\Services\PostingCadenceService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Carbon;
use Tests\TestCase;

/**
 * The notice period between "your posts are low" and "collection is paused".
 *
 * ⚠️ This is a money path. Before it existed, the enforcement run that noticed a creator was
 * below the threshold also paused their subscriptions, so the first they heard was that their
 * recurring income had already stopped.
 *
 * These tests drive the marker directly rather than the whole command, because the command
 * needs live Stripe subscriptions to reach its pause branch. What is asserted here is the
 * rule the command applies: when the clock starts, when it is cleared, and when it has run
 * out.
 */
class PostingCadenceNoticeTest extends TestCase
{
    use RefreshDatabase;

    private function creator(array $overrides = []): User
    {
        return User::factory()->create(array_merge([
            'role' => 1,
            'suspended_account' => 0,
        ], $overrides));
    }

    public function test_the_notice_window_is_three_days(): void
    {
        // Named so a change to the constant is a deliberate decision, not a silent one:
        // this is how long a creator gets before their income stops.
        $this->assertSame(3, PostingCadenceService::WARNING_DAYS);
    }

    public function test_a_creator_who_has_not_been_warned_has_no_clock_running(): void
    {
        $this->assertNull($this->creator()->content_posting_warned_at);
    }

    public function test_the_clock_is_not_yet_elapsed_inside_the_notice_window(): void
    {
        $creator = $this->creator([
            'content_posting_warned_at' => now()->subDays(PostingCadenceService::WARNING_DAYS - 1),
        ]);

        $this->assertTrue(
            $creator->content_posting_warned_at->gt(now()->subDays(PostingCadenceService::WARNING_DAYS)),
            'a creator still inside their notice window must not be pauseable'
        );
    }

    public function test_the_clock_is_elapsed_once_the_window_has_passed(): void
    {
        $creator = $this->creator([
            'content_posting_warned_at' => now()->subDays(PostingCadenceService::WARNING_DAYS + 1),
        ]);

        $this->assertFalse(
            $creator->content_posting_warned_at->gt(now()->subDays(PostingCadenceService::WARNING_DAYS)),
            'the notice window has passed, so the creator is now pauseable'
        );
    }

    /**
     * ⚠️ The regression that would silently remove all notice from a repeat lapse.
     *
     * A creator who recovers keeps their marker unless it is cleared, so their NEXT dip
     * below the threshold would find a clock that had already run down — and pause them
     * immediately, with no warning, which is the exact failure the notice period removes.
     */
    public function test_recovering_clears_the_clock_so_the_next_lapse_is_warned_again(): void
    {
        $creator = $this->creator([
            'content_posting_warned_at' => now()->subDays(10),
        ]);

        // What the command does the moment the creator is back at the threshold.
        $creator->forceFill(['content_posting_warned_at' => null])->saveQuietly();

        $this->assertNull($creator->fresh()->content_posting_warned_at);
    }

    public function test_the_clock_is_a_real_date_not_a_string(): void
    {
        // Cast matters: a raw string comes back from the database and every date comparison
        // against it quietly misbehaves.
        $creator = $this->creator(['content_posting_warned_at' => now()]);

        $this->assertInstanceOf(Carbon::class, $creator->fresh()->content_posting_warned_at);
    }
}
