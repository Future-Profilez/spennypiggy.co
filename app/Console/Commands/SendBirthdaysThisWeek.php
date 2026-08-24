<?php

namespace App\Console\Commands;

use App\EmailService;
use App\Mail\BirthdaysThisWeek;
use App\Models\EngagementNotification;
use App\Models\User;
use App\Services\Discovery\BirthdayDiscoveryService;
use App\Services\NotificationDispatcher;
use Illuminate\Console\Command;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Log;

/**
 * Discovery Phase 4 — the Monday "Birthdays This Week" campaign.
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * 🚨 ONE COPY PER PERSON — NOT ONE PER CREATOR THEY FOLLOW.
 * ═══════════════════════════════════════════════════════════════════════════
 * This is the requirement most likely to be got wrong, because the obvious
 * shape ("for each creator, mail their supporters") produces eight e-mails for
 * somebody who supports eight of that week's creators. So the loop is inverted:
 * the week's ten creators are resolved ONCE, and then the command walks
 * RECIPIENTS, not creators. Each recipient claims exactly one row in
 * `engagement_notifications` keyed on the ISO week and nothing else —
 *
 *     dedup_key = "2026-W36"        (no creator id anywhere in it)
 *
 * — and the table's unique index on (user_id, type, dedup_key) is what actually
 * enforces it, so a re-run, a retry, or two overlapping schedulers still send
 * one e-mail. The claim happens BEFORE the send, so a crash cannot re-send.
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * 🚨 SENDING SHIPS SWITCHED OFF.
 * ═══════════════════════════════════════════════════════════════════════════
 * `config/discovery.php` → `birthday.birthdays_this_week`, env
 * `DISCOVERY_BIRTHDAYS_THIS_WEEK`, default **false**.
 *
 * ⚠️ QUEUE + SCHEDULER: scheduled DAILY at 09:45, so it only runs where
 * `schedule:work` (or the Vapor scheduler) is up. Sending is synchronous inside
 * the command, so no `queue:work` is required for this path.
 *
 * 🚨 IT IS SCHEDULED DAILY RATHER THAN ONLY ON MONDAY, AND THAT IS DELIBERATE.
 * One run is capped at `discovery.birthday.weekly_batch` recipients so a single
 * invocation cannot sit in a Lambda for an hour mailing the entire user table.
 * Because the claim key is the ISO WEEK, every later run in the same week
 * CONTINUES the same send — it skips everyone already claimed and picks up who
 * is left, and it can never mail anybody twice. A Monday-only schedule with a
 * batch cap would silently drop everyone past the cap for that week, which is
 * the failure mode that looks like nothing happening. Tuesday's run also catches
 * accounts created after Monday's pass.
 */
class SendBirthdaysThisWeek extends Command
{
    /**
     * 🚨 The EXTRA consent column, on top of `marketing_emails_enabled`.
     *
     * The dedicated birthday switch, so somebody can stop this campaign without
     * silencing every promotion Spenny Piggy sends. Passed to
     * `EmailService::sendMarketingEmail` as an additional gate — never as a
     * replacement for marketing consent.
     */
    public const CATEGORY = 'birthday_emails_enabled';

    protected $signature = 'birthday:weekly
        {--dry-run : Report what would be sent and send nothing}
        {--week= : ISO date inside the target week (defaults to today)}';

    protected $description = 'Send the Monday "Birthdays This Week" campaign, one copy per person (Discovery Phase 4).';

    /**
     * Recipients per run.
     *
     * This mails EVERY account, so it is the largest fan-out on the platform.
     * The cap is a bound on ONE RUN, not a quota for the week: the claim table
     * means the next daily run picks up exactly where this one stopped, without
     * re-mailing anyone. See the class note.
     */
    private function batchSize(): int
    {
        return max(1, (int) config('discovery.birthday.weekly_batch', 5000));
    }

    public function handle(BirthdayDiscoveryService $birthdays): int
    {
        $dryRun = (bool) $this->option('dry-run');
        $sendingEnabled = BirthdayDiscoveryService::weeklyCampaignEnabled();

        $anchor = $this->option('week')
            ? Carbon::parse($this->option('week'))
            : now();

        $weekStart = BirthdayDiscoveryService::weekStart($anchor);
        $weekEnd = $weekStart->copy()->addDays(6);

        if (! $sendingEnabled && ! $dryRun) {
            $this->warn('The "Birthdays This Week" campaign is switched OFF (discovery.birthday.birthdays_this_week). Reporting only.');
        }

        // 🚨 Resolved ONCE, for everybody. Up to ten creators, chosen by seeded
        // rotation — never by earnings; see BirthdayDiscoveryService.
        $creators = $birthdays->featuredForWeek($weekStart);

        $this->line(sprintf(
            'Week of %s: %d featured creator(s).',
            $weekStart->format('d M'),
            count($creators)
        ));

        /*
         * 🚨 THE SAME MINIMUM THE COLLECTION PAGE USES.
         *
         * The e-mail's final CTA is "Discover more birthdays" → the collection
         * page, and that page shows its greyed "Coming soon" state below
         * `collection_min_creators`. Sending a round-up of two creators whose
         * own call to action lands on a page saying the feature is not ready yet
         * is worse than not sending — so both surfaces read one number, and the
         * campaign simply waits for the same week the page is willing to show.
         *
         * Nothing to say is a reason not to send, not a reason to send an empty
         * round-up.
         */
        $minimum = $birthdays->collectionMinCreators();

        if (count($creators) < $minimum) {
            $this->info(sprintf(
                'Only %d eligible birthday(s) this week (minimum %d) — nothing to send.',
                count($creators),
                $minimum
            ));

            return self::SUCCESS;
        }

        // 🚨 Day and month only. `d M` on both ends, never a year.
        $weekLabel = $weekStart->format('j M').' – '.$weekEnd->format('j M');

        // The claim key. NO creator id — that is the whole guarantee.
        $dedupKey = $weekStart->format('o-\WW');

        $sent = 0;
        $wouldSend = 0;
        $scanned = 0;
        $batch = $this->batchSize();

        /*
         * Supporters AND creators, per the brief — which is every account with
         * an e-mail address. Chunked by primary key so a row created mid-run
         * cannot shift the pagination and cause a skip.
         *
         * ⚠️ Consent is NOT filtered in SQL. `EmailService::sendMarketingEmail`
         * is the ONE place that decides, and a null column means opted IN — a
         * `where(marketing_emails_enabled, 1)` here would wrongly exclude every
         * row that predates the column. The same is true of the birthday
         * column passed to it below.
         */
        User::query()
            ->whereNotNull('email')
            ->where('email', '!=', '')
            /*
             * 🚨 A SUSPENDED ACCOUNT IS NOT MAILED. This is the largest fan-out
             * on the platform — every account with an address — and without this
             * clause a suspended account received a promotional round-up.
             * `AnnounceSubscriptionPolicy`, the only comparable platform-wide
             * send, excludes them in both its send query and its
             * remaining-count query; nothing errors when this one does not, so
             * it is asserted by `BirthdayDiscoveryTest` rather than remembered.
             */
            ->where('suspended_account', 0)
            ->orderBy('id')
            ->chunkById(200, function ($users) use (
                &$sent, &$wouldSend, &$scanned, $creators, $weekLabel, $dedupKey, $dryRun, $sendingEnabled, $batch
            ) {
                foreach ($users as $user) {
                    if ($sent >= $batch || $wouldSend >= $batch) {
                        return false; // stop chunking; the next daily run continues this week
                    }

                    $scanned++;

                    if ($dryRun || ! $sendingEnabled) {
                        $wouldSend++;

                        continue;
                    }

                    // 🚨 ONE COPY PER PERSON — see the class note.
                    if (! NotificationDispatcher::claim($user->id, EngagementNotification::TYPE_BIRTHDAYS_THIS_WEEK, $dedupKey)) {
                        continue;
                    }

                    try {
                        /*
                         * 🚨 Marketing-class AND birthday-class: a promotional
                         * round-up of creators the recipient may never have met,
                         * so it needs `marketing_emails_enabled` — plus
                         * `birthday_emails_enabled`, which is what this e-mail's
                         * own unsubscribe link turns off. Both must be on. The
                         * birthday column is passed as the extra gate rather
                         * than replacing marketing consent: a new, defaulted-on
                         * column must never overturn an opt-out already made.
                         */
                        EmailService::sendMarketingEmail(
                            $user,
                            new BirthdaysThisWeek($user->id, array_values($creators), $weekLabel),
                            self::CATEGORY
                        );

                        $sent++;
                    } catch (\Throwable $e) {
                        Log::warning('birthday:weekly — send failed', [
                            'user_id' => $user->id,
                            'week' => $dedupKey,
                            'error' => $e->getMessage(),
                        ]);
                    }
                }

                return true;
            });

        if ($dryRun || ! $sendingEnabled) {
            $this->info(sprintf(
                'Birthdays This Week (%s): %d recipient(s) scanned, %d email(s) WOULD be sent — one per person. Nothing sent.',
                $dedupKey,
                $scanned,
                $wouldSend
            ));

            return self::SUCCESS;
        }

        $this->info(sprintf(
            'Birthdays This Week (%s): %d email(s) sent — one per person.',
            $dedupKey,
            $sent
        ));

        return self::SUCCESS;
    }
}
