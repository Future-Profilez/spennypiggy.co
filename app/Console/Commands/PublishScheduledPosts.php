<?php

namespace App\Console\Commands;

use App\Models\Post;
use App\Services\NotificationDispatcher;
use App\Services\UserProfileService;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Log;

/**
 * Releases posts whose scheduled publish time has arrived.
 *
 * ⚠️ **This command does not decide whether a post is visible — time does.** The
 * global `published` scope on the Post model compares `scheduled_at` to the clock
 * on every query, so a post goes live at its appointed minute whether or not this
 * command ever runs. That is deliberate: a queue worker being down must not mean
 * a creator's whole content calendar silently fails to publish.
 *
 * What this DOES own is everything that has to happen once, at the moment of
 * release: stamping the release, clearing the guest profile cache so the post is
 * actually seen, and telling the creator. `schedule_released_at` is the claim, so
 * two runners cannot both announce the same post.
 */
class PublishScheduledPosts extends Command
{
    protected $signature = 'posts:publish-scheduled
        {--max=200 : Maximum posts to release in one run}
        {--dry-run : Report only, change nothing}';

    protected $description = 'Release posts whose scheduled publish time has arrived';

    public function handle(): int
    {
        $dryRun = (bool) $this->option('dry-run');
        $max = max(1, (int) $this->option('max'));

        $due = Post::withScheduled()
            ->whereNotNull('scheduled_at')
            ->where('scheduled_at', '<=', now())
            ->whereNull('schedule_released_at')
            ->with('user')
            ->orderBy('scheduled_at')
            ->limit($max)
            ->get();

        if ($due->isEmpty()) {
            $this->info('No scheduled posts are due.');

            return self::SUCCESS;
        }

        $released = 0;
        $waiting = 0;

        foreach ($due as $post) {
            // Approval is still the gate it always was. A post that reached its
            // publish time without being reviewed is not made live here — it goes
            // live the moment an admin approves it, exactly like any other post.
            if ((int) $post->approved !== 1) {
                $waiting++;
                $this->warnCreatorOfDelay($post, $dryRun);

                continue;
            }

            $this->line(sprintf(
                '%s "%s" (due %s)',
                $dryRun ? 'Would release' : 'Releasing',
                $post->title ?: 'Untitled post',
                optional($post->scheduled_at)->format('Y-m-d H:i')
            ));

            if ($dryRun) {
                $released++;

                continue;
            }

            // The claim IS the update, so a second runner loses the race rather
            // than sending a duplicate announcement.
            $claimed = Post::withScheduled()
                ->where('id', $post->id)
                ->whereNull('schedule_released_at')
                ->update(['schedule_released_at' => now()]);

            if ($claimed === 0) {
                continue;
            }

            $released++;
            $this->afterRelease($post);
        }

        $this->info(($dryRun ? 'Would release ' : 'Released ').$released.' post(s).');

        if ($waiting > 0) {
            $this->warn($waiting.' scheduled post(s) are past their time and still waiting for review.');
        }

        return self::SUCCESS;
    }

    /**
     * Clear the caches that decide what a logged-out visitor sees, and tell the
     * creator their post went out. Never throws — the post is already live, and
     * a failure here must not leave the claim unstamped and the announcement
     * repeating on every run.
     */
    private function afterRelease(Post $post): void
    {
        try {
            $creator = $post->user;

            if (! $creator) {
                return;
            }

            app(UserProfileService::class)->clearUserCaches($creator->username, $creator->id);

            NotificationDispatcher::queue(
                $creator,
                'scheduled_post_published',
                [
                    'title' => 'Your scheduled post is live',
                    'body' => '"'.($post->title ?: 'Your post').'" published as planned.',
                    'module' => 'post',
                ],
                [NotificationDispatcher::CHANNEL_BELL],
                false
            );
        } catch (\Throwable $e) {
            Log::warning('PublishScheduledPosts: post-release work failed', [
                'post_id' => $post->id,
                'error' => $e->getMessage(),
            ]);
        }
    }

    /**
     * A scheduled post that missed its slot because nobody reviewed it.
     *
     * ⚠️ The creator has to be told. Scheduling is a promise the platform made on
     * their behalf, and the failure is invisible from their side — the post
     * simply is not there. Claimed through `engagement_notifications` so a post
     * stuck in review for a week produces one message, not one every five minutes.
     */
    private function warnCreatorOfDelay(Post $post, bool $dryRun): void
    {
        if ($dryRun) {
            return;
        }

        try {
            $creator = $post->user;

            if (! $creator) {
                return;
            }

            if (! NotificationDispatcher::claim($creator->id, 'scheduled_post_delayed', 'post:'.$post->id)) {
                return;
            }

            NotificationDispatcher::queue(
                $creator,
                'scheduled_post_delayed',
                [
                    'title' => 'Your scheduled post is waiting for review',
                    'body' => '"'.($post->title ?: 'Your post').'" was due to publish and is still being checked. It goes live as soon as it is approved — you do not need to post it again.',
                    'module' => 'post',
                ],
                [NotificationDispatcher::CHANNEL_BELL, NotificationDispatcher::CHANNEL_PUSH],
                false
            );
        } catch (\Throwable $e) {
            Log::warning('PublishScheduledPosts: delay notice failed', [
                'post_id' => $post->id,
                'error' => $e->getMessage(),
            ]);
        }
    }
}
