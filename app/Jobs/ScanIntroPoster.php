<?php

namespace App\Jobs;

use App\Models\User;
use App\Models\UserIntro;
use App\Services\RekognitionModeration;
use App\Support\ModerationNotice;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Schema;

/**
 * Check an intro video's first frame, and pull the video back if it fails.
 *
 * 🚨 WHY THIS EXISTS AT ALL. Intro videos auto-publish from 13 Sep 2026 (client
 * direction). Until that day they were the one creator asset a PERSON reviewed,
 * and that was load-bearing: `CheckMediaModeration` returns without judging a
 * video (`if ($isImage === false) return;`) and its own comment says why that
 * was safe — *"These items are still created unapproved and reviewed by a human,
 * so passing here does not put them live unseen."* The moment the human step
 * went, that sentence stopped being true and an intro would have been the only
 * thing on the platform published with no check of any kind.
 *
 * 🚨 ONE FRAME IS NOT THE VIDEO, AND NOTHING HERE MAY PRETEND OTHERWISE.
 * Rekognition's moderation add-on reads images; Uploadcare's poster is the
 * video's first frame, and that is what is judged. It catches an explicit
 * opening and it will miss something thirty seconds in. It is a floor, not a
 * guarantee — the admin screen stays precisely so a person can still pull one
 * down, and a report from a viewer remains the other half.
 *
 * ⚠️ THE POSTER IS MADE ASYNCHRONOUSLY. Uploadcare converts the video and the
 * group uuid appears later, so this job re-queues itself a few times rather than
 * failing — and gives up quietly rather than holding a video for ever on a
 * conversion that never finished.
 */
class ScanIntroPoster implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    /** Uploadcare's conversion is usually seconds; this is the outer bound. */
    public $tries = 6;

    public function __construct(public int $introId) {}

    public function handle(): void
    {
        $intro = UserIntro::find($this->introId);

        if (! $intro || (int) $intro->approved !== 1) {
            // Already pulled back, already refused, or the row is gone.
            return;
        }

        $poster = $this->posterUuid($intro);

        if ($poster === null) {
            /*
             * ⚠️ RE-QUEUED, NOT FAILED, AND NEVER HELD. The conversion may still
             * be running. Holding the video while we wait would punish a creator
             * for Uploadcare's queue; letting it run and checking when the frame
             * exists is the publish-then-check trade this platform already makes
             * on avatars.
             */
            if ($this->attempts() < $this->tries) {
                $this->release(60);

                return;
            }

            Log::warning('Intro poster never appeared — the video is live unscanned', [
                'intro_id' => $intro->id,
            ]);

            return;
        }

        $labels = RekognitionModeration::labels($poster, 20);

        /*
         * 🚨 NO VERDICT MEANS NO ACTION, DELIBERATELY — the opposite of the
         * media scan's fail-closed rule, and for a reason that only applies
         * here: this judges a POSTER, not the thing that was uploaded. Holding a
         * creator's video because a derived thumbnail could not be read would
         * refuse them for our own conversion pipeline's failure.
         */
        if ($labels === null) {
            Log::warning('Intro poster scan returned no verdict', ['intro_id' => $intro->id]);

            return;
        }

        $label = RekognitionModeration::restrictedLabel($labels);

        if ($label === null) {
            return;
        }

        $this->retract($intro);
    }

    /**
     * ⚠️ The stored group uuid only — this never triggers the synchronous
     * conversion call. `getPosterUrlAttribute` makes a blocking HTTP request of
     * up to three seconds, and a queue worker looping over it is how a scan
     * becomes the slowest thing on the platform.
     */
    private function posterUuid(UserIntro $intro): ?string
    {
        $poster = trim((string) ($intro->poster ?? ''));

        return $poster !== '' ? $poster.'/nth/0/' : null;
    }

    private function retract(UserIntro $intro): void
    {
        $reason = 'The opening frame of your video did not pass our content check. Upload a different video and it goes live again straight away.';

        $write = ['approved' => 0];

        if (Schema::hasColumn('user_intros', 'moderation_reason')) {
            $write['moderation_reason'] = $reason;
        }

        $intro->forceFill($write)->save();

        Log::info('Intro video retracted by the poster scan', ['intro_id' => $intro->id]);

        /*
         * 🚨 THE CREATOR IS TOLD. A video that disappears from their own profile
         * with no message is the dead end every other module's hold work exists
         * to prevent — and they are the only person who can replace it.
         */
        try {
            ModerationNotice::send(User::find($intro->user_id), 'intro video', '', $reason);
        } catch (\Throwable $e) {
            Log::warning('Intro retraction notice failed: '.$e->getMessage());
        }
    }
}
