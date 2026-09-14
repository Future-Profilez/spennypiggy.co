<?php

namespace Tests\Feature;

use App\Jobs\ScanIntroPoster;
use App\Models\User;
use App\Models\UserIntro;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Queue;
use Tests\TestCase;

/**
 * A gifter's intro video is never reviewed (client direction, 6 Sep 2026).
 *
 * 🚨 THE ROUTE ALREADY REFUSES ONE, and that is the load-bearing half: intro
 * videos became a creator-only surface on 21 Aug 2026, so no NEW gifter row can
 * be created. What is left is the rows uploaded before that check existed —
 * they sit at `approved = 0`, which the admin console reads as "waiting for a
 * person". `intros:approve-gifter-backlog` settles them.
 *
 * ⚠️ The admin app's `UserIntro::scopeAwaitingReview()` is the other half: it
 * excludes role 0 outright, so even a gifter row that somehow appears is never
 * counted as work. Both are needed — this closes the rows that exist, that
 * closes the ones nobody has thought of.
 */
class GifterIntroAutoApprovalTest extends TestCase
{
    use RefreshDatabase;

    public function test_a_gifter_cannot_upload_an_intro_at_all(): void
    {
        $gifter = User::factory()->create(['role' => 0]);

        $this->actingAs($gifter)
            ->postJson('/intro/save', ['media' => ['uuid' => 'intro-uuid']])
            ->assertStatus(403);

        $this->assertSame(0, UserIntro::where('user_id', $gifter->id)->count());
    }

    /**
     * 🚨 REWRITTEN, NOT DELETED — IT PINNED THE OPPOSITE RULE. This asserted
     * `approved = 0`: an intro waited for a person. Intros auto-publish now
     * (12 Sep 2026) — the row is created at `approved = 1` and `ScanIntroPoster`
     * retracts it if the poster frame fails. Same publish-then-check trade the
     * profile photo and every listing took the same week.
     *
     * ⚠️ The original reasoning survives in the re-upload test below: the
     * question "can a creator swap an approved video for anything" is still
     * live, and the answer is now the scan rather than a queue.
     */
    public function test_a_creator_intro_publishes_on_save_and_is_queued_for_the_scan(): void
    {
        Queue::fake();

        $creator = User::factory()->create(['role' => 1]);

        $this->actingAs($creator)
            ->postJson('/intro/save', ['media' => ['uuid' => 'intro-uuid']])
            ->assertOk();

        $this->assertSame(1, (int) UserIntro::where('user_id', $creator->id)->value('approved'));

        /*
         * 🚨 THE SCAN IS THE WHOLE OF THE GATE NOW. Without it this is not
         * publish-then-check, it is publish — so the dispatch is asserted, not
         * merely the flag. ⚠️ Needs `queue:work` in production; without a worker
         * nothing ever retracts.
         */
        Queue::assertPushed(ScanIntroPoster::class);
    }

    /**
     * 🚨 THE FAULT THIS GUARDS IS UNCHANGED; ONLY THE REMEDY MOVED. Measured
     * 17 Aug 2026: **10 of 12 approved intros had been changed after approval** —
     * a creator could swap a cleared video for anything and it stayed cleared.
     * The answer used to be "back to pending"; since intros auto-publish
     * (12 Sep 2026) it is "re-scanned", so what has to be pinned is that the
     * swap is JUDGED AGAIN rather than inheriting the old verdict.
     *
     * ⚠️ `moderation_reason` is cleared with it — a reason left over from the
     * previous video is a sentence about a file that is no longer there, which
     * is the exact fault `CheckMediaModeration` caused on avatars (31 Aug 2026).
     */
    public function test_a_creator_re_upload_is_judged_again_rather_than_inheriting_the_verdict(): void
    {
        Queue::fake();

        $creator = User::factory()->create(['role' => 1]);

        $this->actingAs($creator)
            ->postJson('/intro/save', ['media' => ['uuid' => 'first']])
            ->assertOk();

        // The scan retracted the first video — the state a swap must not inherit.
        UserIntro::where('user_id', $creator->id)->update([
            'approved' => 0,
            'moderation_reason' => 'Something in this video needs another look.',
        ]);

        $this->actingAs($creator)
            ->postJson('/intro/save', ['media' => ['uuid' => 'second']])
            ->assertOk();

        $row = UserIntro::where('user_id', $creator->id)->first();

        $this->assertSame(1, (int) $row->approved, 'A replacement video must publish on its own merits.');
        $this->assertNull($row->moderation_reason, 'The previous video\'s reason must not describe the new one.');

        Queue::assertPushed(ScanIntroPoster::class);
    }

    public function test_the_backlog_command_approves_only_pending_gifter_rows(): void
    {
        $gifterPending = UserIntro::create([
            'uuid' => 'g-pending',
            'user_id' => User::factory()->create(['role' => 0])->id,
            'approved' => 0,
        ]);

        // 🚨 An admin said no to this one. A backfill must never overturn a
        // decision a person took.
        $gifterRejected = UserIntro::create([
            'uuid' => 'g-rejected',
            'user_id' => User::factory()->create(['role' => 0])->id,
            'approved' => 2,
        ]);

        $creatorPending = UserIntro::create([
            'uuid' => 'c-pending',
            'user_id' => User::factory()->create(['role' => 1])->id,
            'approved' => 0,
        ]);

        // Dry run by default: it reports and writes nothing.
        $this->artisan('intros:approve-gifter-backlog')->assertExitCode(0);
        $this->assertSame(0, (int) $gifterPending->fresh()->approved);

        $this->artisan('intros:approve-gifter-backlog --apply')->assertExitCode(0);

        $this->assertSame(1, (int) $gifterPending->fresh()->approved);
        $this->assertSame(2, (int) $gifterRejected->fresh()->approved);
        $this->assertSame(0, (int) $creatorPending->fresh()->approved);
    }
}
