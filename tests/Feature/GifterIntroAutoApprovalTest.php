<?php

namespace Tests\Feature;

use App\Models\User;
use App\Models\UserIntro;
use Illuminate\Foundation\Testing\RefreshDatabase;
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

    public function test_a_creator_intro_is_saved_pending(): void
    {
        $creator = User::factory()->create(['role' => 1]);

        $this->actingAs($creator)
            ->postJson('/intro/save', ['media' => ['uuid' => 'intro-uuid']])
            ->assertOk();

        $this->assertSame(0, (int) UserIntro::where('user_id', $creator->id)->value('approved'));
    }

    /**
     * 🚨 A creator swapping their video goes BACK to pending — the rule that
     * closed "10 of 12 approved intros had been changed after approval".
     */
    public function test_a_creator_re_upload_goes_back_to_pending(): void
    {
        $creator = User::factory()->create(['role' => 1]);

        $this->actingAs($creator)
            ->postJson('/intro/save', ['media' => ['uuid' => 'first']])
            ->assertOk();

        UserIntro::where('user_id', $creator->id)->update(['approved' => 1]);

        $this->actingAs($creator)
            ->postJson('/intro/save', ['media' => ['uuid' => 'second']])
            ->assertOk();

        $this->assertSame(0, (int) UserIntro::where('user_id', $creator->id)->value('approved'));
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
