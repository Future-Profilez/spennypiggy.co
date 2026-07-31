<?php

namespace App\Console\Commands;

use App\Mail\PostingCadenceWarning;
use App\Models\User;
use App\Services\NotificationDispatcher;
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

        $this->info('Creators with active subscribers: '.$creatorIds->count().($dryRun ? ' [DRY RUN]' : ''));

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

            // Back at the threshold: forget the notice period. Without this a creator who
            // recovered would keep a stale marker, and their NEXT lapse would pause them
            // immediately with the clock already run down — no notice at all, which is the
            // failure this whole branch exists to remove.
            if ($meets && $creator->content_posting_warned_at && ! $dryRun) {
                $creator->forceFill(['content_posting_warned_at' => null])->saveQuietly();
            }

            // Grace period: don't pause a brand-new creator/subscription before they've
            // had a full window to post.
            if (! $meets && ! $isPaused && ! $service->isPastGracePeriod($creator)) {
                $this->line("GRACE  creator {$creatorId} (posts={$count}, within first 30 days)");

                // Informational only — the notice clock deliberately does NOT start here.
                // Starting it during grace would let it run down before the creator is even
                // pauseable, so grace would end and collection would stop on the same day.
                if (! $dryRun) {
                    $this->warnAtRisk($creator, $count);
                }

                continue;
            }

            if (! $meets && ! $isPaused) {
                // ⚠️ Past grace and below the threshold. This used to pause on the spot, in
                // the same run that noticed — so the first a creator heard was that their
                // recurring income had already stopped. They now get WARNING_DAYS of notice,
                // and the clock only starts once they have actually been told.
                $warnedAt = $creator->content_posting_warned_at;

                if (! $warnedAt) {
                    $this->line("WARN   creator {$creatorId} (posts={$count}, ".PostingCadenceService::WARNING_DAYS.' day notice starts)');

                    if (! $dryRun) {
                        $this->warnAtRisk($creator, $count, startClock: true);
                    }

                    continue;
                }

                if ($warnedAt->gt(now()->subDays(PostingCadenceService::WARNING_DAYS))) {
                    $this->line("NOTICE creator {$creatorId} (posts={$count}, warned {$warnedAt->diffForHumans()})");

                    continue;
                }

                $this->line("PAUSE  creator {$creatorId} (posts={$count}, notice period elapsed)");
                if ($dryRun) {
                    $paused++;

                    continue;
                }
                // Notify / count only when Stripe actually paused something. pauseCreator now
                // no-ops the flag on a total Stripe failure, so an unconditional notify would
                // tell the creator "you're paused" while every subscription is still billing.
                $n = $service->pauseCreator($creator);
                $this->line("  paused {$n} subscription(s)");
                if ($n > 0) {
                    $this->notify($creator, 'paused', $count);
                    $paused++;
                } else {
                    $this->warn("  pause did not take effect for creator {$creatorId} — will retry next run");
                }
            } elseif ($meets && $isPaused) {
                $this->line("RESUME creator {$creatorId} (posts={$count})");
                if ($dryRun) {
                    $resumed++;

                    continue;
                }
                $n = $service->resumeCreator($creator);
                $this->line("  resumed {$n} subscription(s)");
                // resumeCreator keeps the paused flag if any Stripe resume failed; only
                // report success once the creator is genuinely un-paused.
                if (empty($creator->fresh()->content_posting_paused_at)) {
                    $this->notify($creator, 'resumed', $count);
                    $resumed++;
                } else {
                    $this->warn("  resume did not fully take effect for creator {$creatorId} — will retry next run");
                }
            }
        }

        $this->info("Done. Paused: {$paused}, Resumed: {$resumed}");

        return self::SUCCESS;
    }

    /**
     * ⚠️ Goes through NotificationDispatcher, NOT NotificationSave.
     *
     * `NotificationSave` writes the in-app bell row and nothing else — no push, no email —
     * so a creator only discovered their recurring income had stopped if they happened to
     * open the site. This is the platform telling them money is no longer being collected;
     * it has to reach them where they are.
     *
     * `$marketing = false`: it is operational information about their own account, and there
     * is no version of "your income is paused" a creator may opt out of.
     */
    private function notify(User $creator, string $state, int $count): void
    {
        try {
            $required = PostingCadenceService::MIN_POSTS;

            $title = $state === 'paused'
                ? 'Your memberships are paused'
                : 'Your memberships are active again';

            $body = $state === 'paused'
                ? "You have posted {$count} of {$required} subscriber posts in the last 30 days, so no new charges are being taken. Post again to restart them."
                : 'Thanks for posting — collection has restarted and nothing was cancelled.';

            NotificationDispatcher::queue(
                $creator,
                'posting_cadence',
                [
                    'title' => $title,
                    'body' => $body,
                    'url' => route('dashboard', ['add' => 'post']),
                    'module' => 'membership',
                ],
                [
                    NotificationDispatcher::CHANNEL_BELL,
                    NotificationDispatcher::CHANNEL_PUSH,
                ],
                false
            );
        } catch (\Throwable $e) {
            // Notification failure must not abort enforcement.
        }
    }

    /**
     * Tell a creator their posts are running low, before anything is paused.
     *
     * Claimed at most once per ISO week: this command runs daily and a creator can sit below
     * the threshold for their whole grace period, so an unclaimed warning would arrive every
     * morning and be muted long before it mattered.
     */
    private function warnAtRisk(User $creator, int $count, bool $startClock = false): void
    {
        try {
            $required = PostingCadenceService::MIN_POSTS;

            // ⚠️ The clock is started BEFORE the send and outside the weekly claim.
            //
            // If it were set only on a successful send, a creator whose warning failed (or
            // was suppressed by the claim) would never start their notice period and could
            // never be paused — enforcement would silently stop for them. Marking first
            // fails in the safe direction: worst case they get the full notice window
            // without the message, rather than a pause without one.
            if ($startClock && ! $creator->content_posting_warned_at) {
                $creator->forceFill(['content_posting_warned_at' => now()])->saveQuietly();
            }

            if (! NotificationDispatcher::claim($creator->id, 'posting_cadence_warning', 'week:'.now()->format('o-W'))) {
                return;
            }

            NotificationDispatcher::queue(
                $creator,
                'posting_cadence_warning',
                [
                    'title' => 'Your subscriber posts are running low',
                    'body' => "You have posted {$count} of {$required} in the last 30 days. Keep it up or collection pauses.",
                    'url' => route('dashboard', ['add' => 'post']),
                    'module' => 'membership',
                    'mailable' => PostingCadenceWarning::class,
                    'mailable_args' => [
                        'userId' => $creator->id,
                        'creatorName' => $creator->name ?: ($creator->username ?? 'there'),
                        'posts' => $count,
                        'required' => $required,
                    ],
                ],
                NotificationDispatcher::ALL_CHANNELS,
                false
            );

            $this->line("  warned creator {$creator->id} (posts={$count}/{$required})");
        } catch (\Throwable $e) {
            // A warning that fails must never stop enforcement running.
        }
    }
}
