<?php

namespace App\Console\Commands;

use App\EmailService;
use App\Mail\BirthdayReminder;
use App\Models\EngagementNotification;
use App\Models\User;
use App\Services\Discovery\BirthdayDiscoveryService;
use App\Services\NotificationDispatcher;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Log;

/**
 * Discovery Phase 4 — the three supporter birthday reminders.
 *
 * Runs daily and, for every opted-in creator in good standing whose birthday is
 * 7 days away, 1 day away, or TODAY, e-mails that creator's EXISTING supporters.
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * 🚨 SENDING SHIPS SWITCHED OFF.
 * ═══════════════════════════════════════════════════════════════════════════
 * `config/discovery.php` → `birthday.birthday_reminders`, env
 * `DISCOVERY_BIRTHDAY_REMINDERS`, default **false**. With the flag off this
 * command runs, reports what it WOULD have sent, and sends nothing. The whole
 * feature is built and shippable; turning it on is a config change with no
 * deploy, which is what the Master Plan asks for.
 *
 * ⚠️ `--dry-run` works with the flag either way and never sends, never claims a
 * dedup row. It is the staging rehearsal.
 *
 * ⚠️ QUEUE + SCHEDULER: scheduled at 09:30 daily, so it only runs where
 * `schedule:work` (or the Vapor scheduler) is up. `EmailService` sends
 * synchronously from inside this command, so it needs no `queue:work` of its
 * own — but the command itself never runs without a scheduler.
 */
class SendBirthdayReminders extends Command
{
    protected $signature = 'birthday:remind
        {--dry-run : Report what would be sent and send nothing}
        {--stage= : Only run one stage (7, 1 or 0)}';

    protected $description = 'Email a creator\'s supporters 7 days before, 1 day before and on their birthday (Discovery Phase 4).';

    /**
     * 🚨 THE CATEGORY COLUMN.
     *
     * `creator_updates_enabled` — this e-mail is news about a creator the
     * recipient ALREADY SUPPORTS, which is precisely what that preference
     * means. It is routed through `EmailService::sendCategoryEmail()`, never
     * `Mail::to()`: that bypasses consent and exists for receipts, password
     * resets and other transactional mail only.
     */
    private const CATEGORY = 'creator_updates_enabled';

    public function handle(BirthdayDiscoveryService $birthdays): int
    {
        $dryRun = (bool) $this->option('dry-run');
        $sendingEnabled = BirthdayDiscoveryService::remindersEnabled();

        $stages = BirthdayDiscoveryService::STAGES;

        if ($this->option('stage') !== null) {
            $only = (int) $this->option('stage');

            if (! in_array($only, $stages, true)) {
                $this->error('Invalid --stage. Use 7, 1 or 0.');

                return self::FAILURE;
            }

            $stages = [$only];
        }

        if (! $sendingEnabled && ! $dryRun) {
            // Not a failure, and deliberately loud: a scheduled command that
            // silently does nothing is indistinguishable from one that is
            // broken, and this one is expected to do nothing for weeks.
            $this->warn('Birthday reminders are switched OFF (discovery.birthday.birthday_reminders). Reporting only.');
        }

        $today = now()->startOfDay();
        $year = (int) $today->year;

        $totalCreators = 0;
        $totalSent = 0;
        $totalWouldSend = 0;

        foreach ($stages as $stage) {
            // Stage 0 is the birthday itself; stage 7 is seven days ahead.
            $target = $today->copy()->addDays($stage);
            $creators = $birthdays->creatorsWithBirthdayOn($target);

            $this->line(sprintf(
                'Stage %dd (%s): %d eligible creator(s).',
                $stage,
                $target->format('d M'),
                count($creators)
            ));

            foreach ($creators as $creatorId => $card) {
                $totalCreators++;

                $supporterIds = $birthdays->supporterIdsFor($creatorId);

                if ($supporterIds === []) {
                    continue;
                }

                /*
                 * One row per supporter, per creator, per stage, per YEAR.
                 *
                 * The year is in the key so the same reminder can legitimately
                 * fire again in twelve months, and the stage is in it so the
                 * 7-day and 1-day notes are separate sends rather than one
                 * suppressing the other.
                 */
                $dedupKey = $creatorId.'|'.$stage.'|'.$year;

                foreach ($supporterIds as $supporterId) {
                    $supporter = User::find($supporterId);

                    if (! $supporter || empty($supporter->email)) {
                        continue;
                    }

                    // A creator never gets a reminder about their own birthday.
                    if ((int) $supporter->id === (int) $creatorId) {
                        continue;
                    }

                    if ($dryRun || ! $sendingEnabled) {
                        $totalWouldSend++;

                        if ($this->getOutput()->isVerbose()) {
                            $this->line("  would email supporter {$supporter->id} about creator {$creatorId} (stage {$stage}d)");
                        }

                        continue;
                    }

                    /*
                     * ⚠️ CLAIM BEFORE SENDING. The claim is a unique-index
                     * insert, so a re-run — or two overlapping runs — can never
                     * produce a second e-mail. Claiming after the send would
                     * leave a window in which a crash re-sends.
                     */
                    if (! NotificationDispatcher::claim($supporter->id, EngagementNotification::TYPE_BIRTHDAY_REMINDER, $dedupKey)) {
                        continue;
                    }

                    try {
                        /*
                         * 🚨 Consent-checked. `sendCategoryEmail` returns
                         * without sending when the supporter has turned off
                         * creator updates — that is the opt-out the e-mail's own
                         * footer link writes.
                         */
                        EmailService::sendCategoryEmail(
                            $supporter,
                            new BirthdayReminder($supporter->id, $stage, $card),
                            self::CATEGORY
                        );

                        $totalSent++;
                    } catch (\Throwable $e) {
                        // One bad address must not take down the sweep for every
                        // other supporter of every other creator.
                        Log::warning('birthday:remind — send failed', [
                            'supporter_id' => $supporter->id,
                            'creator_id' => $creatorId,
                            'stage' => $stage,
                            'error' => $e->getMessage(),
                        ]);
                    }
                }
            }
        }

        if ($dryRun || ! $sendingEnabled) {
            $this->info(sprintf(
                'Birthday reminders: %d creator-stage(s) matched, %d email(s) WOULD be sent. Nothing sent.',
                $totalCreators,
                $totalWouldSend
            ));

            return self::SUCCESS;
        }

        $this->info(sprintf(
            'Birthday reminders: %d creator-stage(s) matched, %d email(s) sent.',
            $totalCreators,
            $totalSent
        ));

        return self::SUCCESS;
    }
}
