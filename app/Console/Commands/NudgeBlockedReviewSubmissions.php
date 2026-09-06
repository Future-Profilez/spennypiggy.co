<?php

namespace App\Console\Commands;

use App\Mail\FinishYourReviewSubmission;
use App\Models\EngagementNotification;
use App\Models\User;
use App\Services\NotificationDispatcher;
use App\Support\ReviewSubmission;
use Illuminate\Console\Command;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Log;

/**
 * "You submitted, and one thing is still missing" — the reminder nobody else can send.
 *
 * 🚨 THESE CREATORS ARE INVISIBLE TO THE ADMIN CONSOLE, WHICH IS WHY THIS EXISTS.
 * `CreatorReviewService::whereProfileComplete()` requires a photo, a bio, a handle and a
 * card, so a creator carrying `profile_status_lock = 1` without one of those is in no
 * queue at all — nobody was ever going to notice them by hand, and their own screen used
 * to tell them there was nothing left to do. Measured on the live database 6 Sep 2026:
 * ALL 22 creators at lock 1 were in exactly that state, one of them for 36 days.
 *
 * 🚨 NOT A ONE-OFF BACKLOG. `User::$subscription_status` reads a LIVE subscription period
 * and `past_due` is not one, so a creator whose card is declined mid-review drops out of
 * the admin queue silently and lands here. That is why this is scheduled rather than run
 * once by hand.
 *
 * ⚠️ Needs `queue:work`. The fan-out goes through NotificationDispatcher, so with no
 * worker the claim says sent and nothing is delivered.
 */
class NudgeBlockedReviewSubmissions extends Command
{
    protected $signature = 'review:nudge-blocked
        {--max= : Maximum creators to remind in this run (default: config)}
        {--dry-run : Report what would be sent without sending or claiming}';

    protected $description = 'Remind creators whose profile is submitted but held out of the review queue';

    /** The dedup ledger type. One row per (creator, attempt number), forever. */
    public const TYPE = 'review_blocked';

    public function handle(): int
    {
        $dryRun = (bool) $this->option('dry-run');
        $enabled = (bool) config('review_nudge.enabled', true);
        $max = max(1, (int) ($this->option('max') ?: config('review_nudge.max_per_run', 100)));
        $stagger = max(0, (int) config('review_nudge.dispatch_stagger_seconds', 2));

        if (! $enabled && ! $dryRun) {
            $this->warn('review_nudge.enabled is false — reporting only, nothing will be sent or claimed.');
        }

        $sent = 0;
        $skipped = 0;
        $examined = 0;

        /*
         * ⚠️ `--max` caps creators REMINDED, not creators looked at. Capping the query
         * instead means a run whose first N candidates are all inside their wait window
         * sends nothing, while somebody genuinely due sits beyond the cap and is never
         * reached on any run.
         */
        foreach (ReviewSubmission::submittedQuery()->orderBy('id')->cursor() as $user) {
            if ($sent >= $max) {
                break;
            }

            $examined++;

            if (! $this->reachable($user)) {
                $skipped++;

                continue;
            }

            /*
             * 🚨 THE QUEUE GATE, NOT THE SUBMIT GATE. `missing()` also refuses a
             * REJECTED asset, and a rejected handle does NOT keep a creator out of the
             * admin queue — chasing them for it names the wrong problem and would have
             * told 17 live creators to add a handle they already have. See
             * ReviewSubmission::queueBlockers().
             */
            $missing = ReviewSubmission::queueBlockers($user);

            // Not blocked at all — genuinely with the review team, nothing to say.
            if (! $missing) {
                $skipped++;

                continue;
            }

            $attempts = $this->attemptsFor($user->id);

            if (! $this->isDue($user->id, $attempts)) {
                $skipped++;

                continue;
            }

            if ($dryRun || ! $enabled) {
                $sent++;
                $this->info(sprintf(
                    '[report] Creator #%d (%s) blocked on: %s — would send reminder %d.',
                    $user->id,
                    $user->email,
                    implode(', ', $missing),
                    $attempts + 1
                ));

                continue;
            }

            // The claim IS the insert (unique on user+type+key), so two workers racing
            // cannot both send, and the row is what the ladder counts next time.
            if (! NotificationDispatcher::claim($user->id, self::TYPE, (string) ($attempts + 1))) {
                $skipped++;

                continue;
            }

            try {
                NotificationDispatcher::queue(
                    $user,
                    self::TYPE,
                    $this->payloadFor($user, $missing),
                    $this->channelsFor($user),
                    /*
                     * Operational: it is the state of the creator's own account and a step
                     * they started, so it does not go through the marketing consent gate.
                     * `channelsFor()` still honours a creator-updates opt-out on the email
                     * channel, or the unsubscribe link in that mail is decorative.
                     */
                    false
                );

                $sent++;
                $this->info(sprintf(
                    'Reminded creator #%d (%s) — missing: %s (reminder %d).',
                    $user->id,
                    $user->email,
                    implode(', ', $missing),
                    $attempts + 1
                ));

                if ($stagger > 0) {
                    sleep($stagger);
                }
            } catch (\Throwable $e) {
                /*
                 * One creator's failure must never end the run — the next row may be the
                 * one waiting 36 days. The claim is deliberately NOT released: the ladder
                 * is measured in weeks, so losing one reminder costs a fortnight, where a
                 * released claim on a persistently failing address means retrying it on
                 * every run for ever.
                 */
                Log::error('review:nudge-blocked — failed to queue reminder', [
                    'user_id' => $user->id,
                    'error' => $e->getMessage(),
                ]);
                $skipped++;
            }
        }

        $this->info(sprintf(
            '%sExamined %d submitted profiles · reminded %d · skipped %d',
            $dryRun || ! $enabled ? '[report] ' : '',
            $examined,
            $sent,
            $skipped
        ));

        return self::SUCCESS;
    }

    /**
     * Can we message this account at all?
     *
     * ⚠️ A SUSPENDED account is excluded: they are already being told something specific
     * about their account state, and a second, cheerier message about finishing a review
     * contradicts it.
     */
    private function reachable(User $user): bool
    {
        return $user->email
            && $user->email_verified_at
            && (int) ($user->suspended_account ?? 0) !== 1
            && (int) ($user->notification_send ?? 1) !== 0;
    }

    /** How many reminders this creator has already been sent, ever. */
    private function attemptsFor(int $userId): int
    {
        return EngagementNotification::where('user_id', $userId)
            ->where('type', self::TYPE)
            ->count();
    }

    /**
     * Has the wait for the next rung of the ladder elapsed?
     *
     * 🚨 The ladder SLOWS DOWN and never stops — a fortnight ×3, then monthly ×3, then
     * once a year. Somebody who ignored the sixth reminder will ignore the seventh, but
     * the account is still one field away from selling, so going silent for ever throws
     * the creator away rather than the reminder.
     */
    private function isDue(int $userId, int $attempts): bool
    {
        if ($attempts === 0) {
            return true;
        }

        $lastSentAt = EngagementNotification::where('user_id', $userId)
            ->where('type', self::TYPE)
            ->max('sent_at');

        // A claim with no timestamp cannot be aged. Waiting for ever on an unreadable
        // row is the worse failure, so treat it as due.
        if (! $lastSentAt) {
            return true;
        }

        return Carbon::parse($lastSentAt)
            ->lte(now()->subDays($this->waitDaysAfter($attempts)));
    }

    /**
     * The gap before the next reminder, given how many have gone.
     *
     * ⚠️ First match wins and the list is ordered ascending, so the entry with a null
     * `after_sends` is the one that runs for ever. A malformed config falls back to a
     * year — the quietest option, which is the safe direction for a reminder.
     */
    public function waitDaysAfter(int $attempts): int
    {
        foreach ((array) config('review_nudge.ladder', []) as $rung) {
            $ceiling = $rung['after_sends'] ?? null;

            if ($ceiling === null || $attempts < (int) $ceiling) {
                return max(1, (int) ($rung['wait_days'] ?? 365));
            }
        }

        return 365;
    }

    /**
     * The bell/push/email payload. Built here so all three channels say the same thing,
     * and the subject line comes from the mailable rather than being retyped.
     *
     * @param  array<int, string>  $missing
     * @return array<string, mixed>
     */
    public function payloadFor(User $user, array $missing): array
    {
        $needsCard = in_array('a payment card', $missing, true);

        return [
            'title' => FinishYourReviewSubmission::subjectLine(),
            'body' => 'Your profile is submitted. We cannot start the review until you add '
                .ReviewSubmission::readableList($missing)
                .'. Add it and it goes to the team on its own.',
            'url' => $needsCard ? '/activate-subscription' : '/'.($user->username ?? ''),
            'module' => 'profile',
            'mailable' => FinishYourReviewSubmission::class,
            'mailable_args' => [
                'userId' => $user->id,
                'creatorName' => $user->name ?: ($user->username ?? 'Creator'),
                'missing' => $missing,
                'cardPreviouslyAdded' => $needsCard && ReviewSubmission::cardPreviouslyAdded($user),
            ],
        ];
    }

    /**
     * ⚠️ `$marketing = false` bypasses the consent gate, so a creator-updates opt-out has
     * to be honoured here or the unsubscribe link in the mail does nothing: they click it,
     * the flag flips, and the next run emails them anyway.
     *
     * Bell and push always go — this is operational information about their own account,
     * and it is the same split the journey nudge uses.
     *
     * @return array<int, string>
     */
    private function channelsFor(User $user): array
    {
        $channels = [NotificationDispatcher::CHANNEL_BELL, NotificationDispatcher::CHANNEL_PUSH];

        // Missing or null always means opted IN, as everywhere else on the platform.
        if ($user->creator_updates_enabled ?? true) {
            $channels[] = NotificationDispatcher::CHANNEL_EMAIL;
        }

        return $channels;
    }
}
