<?php

namespace App\Console\Commands;

use App\Models\User;
use App\Services\PostingCadenceService;
use Illuminate\Console\Command;

/**
 * Stripe compliance: enforce the min-3-posts-per-30-days content cadence for creators
 * who sell Bills / Memberships. Below threshold -> pause their subscriptions (no new
 * charges). Back at/above threshold -> resume. Reversible Stripe pause_collection.
 */
class EnforcePostingCadence extends Command
{
    protected $signature = 'app:enforce-posting-cadence {--dry-run : Report actions without touching Stripe or the DB}';

    protected $description = 'Pause/resume Bill & Membership subscriptions based on the creator posting cadence (min 3 posts / 30 days).';

    public function handle(PostingCadenceService $service): int
    {
        $dryRun = (bool) $this->option('dry-run');
        $creatorIds = $service->creatorsWithActiveSubscribers();

        $this->info('Creators with active subscribers: ' . $creatorIds->count() . ($dryRun ? ' [DRY RUN]' : ''));

        $paused = 0;
        $resumed = 0;

        foreach ($creatorIds as $creatorId) {
            $creator = User::find($creatorId);
            if (! $creator) {
                continue;
            }

            $count = $service->recentPostCount($creator);
            $meets = $count >= PostingCadenceService::MIN_POSTS;
            $isPaused = ! empty($creator->content_posting_paused_at);

            // Grace period: don't pause a brand-new creator/subscription before they've
            // had a full window to post.
            if (! $meets && ! $isPaused && ! $service->isPastGracePeriod($creator)) {
                $this->line("GRACE  creator {$creatorId} (posts={$count}, within first 30 days)");
                continue;
            }

            if (! $meets && ! $isPaused) {
                $this->line("PAUSE  creator {$creatorId} (posts={$count})");
                if (! $dryRun) {
                    $n = $service->pauseCreator($creator);
                    $this->notify($creator, 'paused', $count);
                    $this->line("  paused {$n} subscription(s)");
                }
                $paused++;
            } elseif ($meets && $isPaused) {
                $this->line("RESUME creator {$creatorId} (posts={$count})");
                if (! $dryRun) {
                    $n = $service->resumeCreator($creator);
                    $this->notify($creator, 'resumed', $count);
                    $this->line("  resumed {$n} subscription(s)");
                }
                $resumed++;
            }
        }

        $this->info("Done. Paused: {$paused}, Resumed: {$resumed}");

        return self::SUCCESS;
    }

    private function notify(User $creator, string $state, int $count): void
    {
        try {
            $message = $state === 'paused'
                ? "Your content memberships are paused: you've posted {$count}/" . PostingCadenceService::MIN_POSTS . " member posts in the last 30 days. Post more to resume payments."
                : "Your content memberships are active again — thanks for posting. Payments have resumed.";

            \App\Jobs\NotificationSave::dispatch($message, $creator, $creator, 'membership');
        } catch (\Throwable $e) {
            // Notification failure must not abort enforcement.
        }
    }
}
