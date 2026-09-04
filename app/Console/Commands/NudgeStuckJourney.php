<?php

namespace App\Console\Commands;

use App\Mail\FinishYourSetup;
use App\Models\User;
use App\Services\CreatorJourneyService;
use App\Services\NotificationDispatcher;
use App\Support\MarketingConsent;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

/**
 * "You have not finished setting up" — the reminder for a creator whose journey stalled.
 *
 * 🚨 TWO MESSAGES PER STEP, THEN SILENCE. Day 2 and day 7 after they ENTERED the step
 * (`users.journey_step_at`), and never again for that step. A creator who ignored the
 * second reminder will ignore the fifth, and a platform that keeps asking teaches them to
 * filter everything we send — the receipt and the payout notice included. Finishing a step
 * moves them on and restarts the clock, so somebody genuinely progressing hears from us
 * about each new thing, once or twice, and no more.
 *
 * ⚠️ `first_listing` is NOT handled here. It has its own two-stage nudge
 * (`creators:nudge-first-listing`) with its own mailable and its own ledger — see
 * `CreatorJourneyService::nudgeableSteps()`.
 *
 * ⚠️ Needs `queue:work`. The fan-out is queued through NotificationDispatcher, so without
 * a worker the ledger row says sent and nothing is delivered.
 */
class NudgeStuckJourney extends Command
{
    protected $signature = 'creators:nudge-journey
        {--max=100 : Maximum creators to NUDGE in this run}
        {--include-dormant : Also reach creators who signed up longer ago than the fresh window}
        {--dry-run : Report what would be sent without sending or claiming}';

    protected $description = 'Remind creators who are stuck part-way through setting up their page';

    /** The dedup ledger type. One row per (creator, step, stage), forever. */
    public const TYPE = 'journey_nudge';

    public function handle(CreatorJourneyService $journey): int
    {
        $dryRun = (bool) $this->option('dry-run');
        $max = max(1, (int) $this->option('max'));
        $includeDormant = (bool) $this->option('include-dormant');

        $sent = 0;
        $skipped = 0;
        $examined = 0;

        // ⚠️ `--max` caps creators NUDGED, not creators looked at — the same reasoning as
        // NudgeFirstListing. Capping the query instead means a run whose first N candidates
        // are all too recent sends nothing while creators past day 7 sit beyond the cap and
        // are never reached on any run.
        foreach ($journey->nudgeCandidateQuery($includeDormant)->orderBy('journey_step_at')->cursor() as $user) {
            if ($sent >= $max) {
                break;
            }

            $examined++;
            $stage = $journey->nudgeStageFor($user);

            if ($stage === null) {
                $skipped++;

                continue;
            }

            /*
             * 🚨 A dormant creator is being RE-ENGAGED, and re-engagement is marketing by
             * the client's own brief (23 Aug 2026). `marketing_suppressions` is keyed on
             * the EMAIL and survives account deletion and re-signup, which is the whole
             * case it exists to close. Fresh signups inside the window are transactional
             * account-setup guidance and are not gated on it — the same split the admin
             * drip uses.
             */
            if ($this->isDormant($user) && MarketingConsent::isSuppressed($user->email)) {
                $skipped++;

                continue;
            }

            // Never two "finish setting up" messages in one day. The admin app's drip
            // writes a `creator_onboarding` row into the shared notifications table, and
            // the two commands cannot see each other any other way.
            if ($this->drippedToday($user->id)) {
                $skipped++;

                continue;
            }

            if ($dryRun) {
                $sent++;
                $this->info(sprintf(
                    '[dry-run] Creator #%d (%s) stuck on "%s" — would send stage %d reminder.',
                    $user->id,
                    $user->email,
                    $user->journey_step,
                    $stage
                ));

                continue;
            }

            // The claim IS the insert, so two workers racing cannot both send.
            if (! NotificationDispatcher::claim($user->id, self::TYPE, "{$user->journey_step}:{$stage}")) {
                $skipped++;

                continue;
            }

            try {
                NotificationDispatcher::queue(
                    $user,
                    self::TYPE,
                    $this->payloadFor($user, $stage, $journey),
                    $this->channelsFor($user),
                    // Operational: this is the state of the creator's own account, so it is
                    // not routed through the marketing consent gate. The email channel is
                    // still dropped by channelsFor() when they have opted out of creator
                    // updates — see the note there.
                    false
                );

                $sent++;
                $this->info(sprintf(
                    'Reminded creator #%d (%s) about "%s" at stage %d.',
                    $user->id,
                    $user->email,
                    $user->journey_step,
                    $stage
                ));
            } catch (\Throwable $e) {
                Log::error('creators:nudge-journey — failed to send notification', [
                    'user_id' => $user->id,
                    'step' => $user->journey_step,
                    'stage' => $stage,
                    'error' => $e->getMessage(),
                ]);
                $skipped++;
            }
        }

        $this->info(sprintf(
            '%sProcessed %d creators · reminded %d · skipped %d',
            $dryRun ? '[dry-run] ' : '',
            $examined,
            $sent,
            $skipped
        ));

        return self::SUCCESS;
    }

    /**
     * The bell/push/email payload. Built here so all three channels say the same thing,
     * and the wording itself comes from the mailable — never retyped.
     *
     * @return array<string, mixed>
     */
    public function payloadFor(User $user, int $stage, ?CreatorJourneyService $journey = null): array
    {
        $step = (string) $user->journey_step;
        $journey ??= app(CreatorJourneyService::class);

        return [
            'title' => FinishYourSetup::subjectFor($step, $stage),
            // ⚠️ A step the creator half-finished gets the wording that acknowledges it —
            // the first-run copy ("a quick passport check") reads as though the ten
            // minutes they already spent never happened.
            'body' => $journey->isUnfinished($user, $step)
                ? CreatorJourneyService::UNFINISHED_COPY[$step]['body']
                : (CreatorJourneyService::STEPS[$step]['body'] ?? FinishYourSetup::contextFor($step)),
            'url' => route('dashboard'),
            'module' => 'journey',
            'mailable' => FinishYourSetup::class,
            'mailable_args' => [
                'userId' => $user->id,
                'creatorName' => $user->name ?: ($user->username ?? 'Creator'),
                'step' => $step,
                'stage' => $stage,
            ],
        ];
    }

    /**
     * ⚠️ `$marketing = false` bypasses the consent gate entirely, so the preference has to
     * be honoured here or the unsubscribe link in the email is decorative — the creator
     * clicks it, the flag flips, and the next run emails them anyway.
     *
     * Bell and push are kept regardless: this is operational information about their own
     * account, and it is the same split the first-listing nudge uses.
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

    private function isDormant(User $user): bool
    {
        return $user->created_at
            && $user->created_at->lt(now()->subDays(CreatorJourneyService::NUDGE_FRESH_WINDOW_DAYS));
    }

    /**
     * Did the admin app's onboarding drip already message this creator today?
     *
     * Read straight off the shared table rather than through a model: the row is written by
     * the OTHER app, and the two share a database, not code.
     */
    private function drippedToday(int $userId): bool
    {
        try {
            return DB::table('notifications')
                ->where('user_id', $userId)
                ->where('notifiable_type', 'creator_onboarding')
                ->whereDate('sent_at', today())
                ->exists();
        } catch (\Throwable $e) {
            // A missing column or table must not stop the reminder — worst case the creator
            // gets both messages on one day, which is better than getting neither.
            Log::warning('creators:nudge-journey — drip check failed', ['error' => $e->getMessage()]);

            return false;
        }
    }
}
