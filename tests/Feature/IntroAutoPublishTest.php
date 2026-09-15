<?php

namespace Tests\Feature;

use App\Jobs\ScanIntroPoster;
use App\Models\User;
use App\Models\UserIntro;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Queue;
use Tests\TestCase;

/**
 * An intro video publishes on save and a scan pulls it back.
 *
 * 🚨 THE TRADE, STATED. Until 13 Sep 2026 the intro was the last creator asset a
 * PERSON approved, and that was load-bearing: `CheckMediaModeration` returns
 * without judging a video, and its own comment says why that was safe — *"These
 * items are still created unapproved and reviewed by a human, so passing here
 * does not put them live unseen."* Auto-publishing removed the human, so
 * `ScanIntroPoster` had to replace it or the intro would be the one thing on the
 * platform checked by nobody at all.
 *
 * ⚠️ ONE FRAME IS NOT THE VIDEO. The scan reads the poster — the opening frame —
 * because Rekognition's moderation add-on reads images. It catches an explicit
 * opening and will miss something thirty seconds in. The admin screen stays for
 * exactly that reason.
 */
class IntroAutoPublishTest extends TestCase
{
    use RefreshDatabase;

    private function creator(): User
    {
        return User::factory()->create(['role' => 1, 'suspended_account' => 0]);
    }

    public function test_a_new_intro_is_live_immediately_and_is_queued_for_a_scan(): void
    {
        Queue::fake();
        $creator = $this->creator();

        $this->actingAs($creator)
            ->post('/update/intro/video', // ⚠️ `media` is the Uploadcare OBJECT, not a string — the endpoint reads
                // `media.uuid`, falling back to parsing `media.url`.
                ['media' => ['uuid' => '901c0a0e-e5de-4d7a-8ac3-de11a4632542']]);

        $intro = UserIntro::where('user_id', $creator->id)->first();

        $this->assertNotNull($intro, 'The upload must reach the database.');
        $this->assertSame(1, (int) $intro->approved, 'An intro publishes on save — nobody is coming to approve it.');

        Queue::assertPushed(ScanIntroPoster::class);
    }

    /**
     * 🚨 A REPLACEMENT IS JUDGED ON ITS OWN TERMS. Before today a re-upload
     * dropped back to 0 so an admin looked again — measured 17 Aug 2026, 10 of
     * 12 approved intros had been swapped after approval. It is live now, but it
     * must never simply INHERIT the previous verdict: the new video is re-queued
     * and any reason recorded about the old one is cleared.
     */
    public function test_a_replacement_is_live_and_rescanned_not_inherited(): void
    {
        Queue::fake();
        $creator = $this->creator();

        $intro = UserIntro::create([
            'uuid' => 'aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa',
            'user_id' => $creator->id,
            'height' => 720,
            'width' => 1280,
            'approved' => 0,
        ]);

        $intro->forceFill(['moderation_reason' => 'An old verdict about a video since replaced.'])->save();

        $this->actingAs($creator)
            ->post('/update/intro/video', ['media' => ['uuid' => 'bbbbbbbb-bbbb-4bbb-bbbb-bbbbbbbbbbbb']]);

        $fresh = $intro->fresh();

        $this->assertSame(1, (int) $fresh->approved);
        $this->assertNull($fresh->moderation_reason, 'A reason about the old video is not a verdict on the new one.');
        Queue::assertPushed(ScanIntroPoster::class);
    }

    /**
     * ⚠️ NO POSTER MEANS RE-QUEUE, NEVER HOLD. Uploadcare converts the video
     * asynchronously, so the frame appears after the save. Holding the video
     * while we wait would refuse a creator for our own pipeline's queue.
     */
    public function test_the_scan_never_holds_a_video_while_the_poster_is_being_made(): void
    {
        $creator = $this->creator();

        $intro = UserIntro::create([
            'uuid' => 'cccccccc-cccc-4ccc-cccc-cccccccccccc',
            'user_id' => $creator->id,
            'height' => 720,
            'width' => 1280,
            'approved' => 1,
        ]);

        // No `poster` set — the conversion has not finished.
        (new ScanIntroPoster($intro->id))->handle();

        $this->assertSame(1, (int) $intro->fresh()->approved);
    }

    /** A video already pulled back is not re-judged by a late scan. */
    public function test_a_retracted_intro_is_left_alone(): void
    {
        $creator = $this->creator();

        $intro = UserIntro::create([
            'uuid' => 'dddddddd-dddd-4ddd-dddd-dddddddddddd',
            'user_id' => $creator->id,
            'height' => 720,
            'width' => 1280,
            'approved' => 2,
        ]);

        (new ScanIntroPoster($intro->id))->handle();

        $this->assertSame(2, (int) $intro->fresh()->approved, 'A decision a person took is not overturned by a scan.');
    }
}
