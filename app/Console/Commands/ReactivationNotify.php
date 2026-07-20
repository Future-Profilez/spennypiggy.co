<?php

namespace App\Console\Commands;

use App\Models\EngagementNotification;
use App\Models\User;
use App\Services\NotificationDispatcher;
use App\Services\SupporterLapseService;
use Illuminate\Console\Command;

/**
 * Nudges supporters who have stopped buying, at 7 / 14 / 30 days.
 *
 * Runs daily and matches on the EXACT day a supporter crosses each stage, so
 * each stage fires once. A purchase resets the clock: the dedup key contains
 * the last-purchase date, so buying again produces a new key and the cycle can
 * legitimately run again later.
 *
 * Copy is content-first (no gift/tip/donation/fundraise wording).
 */
class ReactivationNotify extends Command
{
    protected $signature = 'reactivation:notify {--dry-run} {--stage= : Only run one stage (7, 14 or 30)}';

    protected $description = 'Remind supporters who stopped purchasing at 7, 14 and 30 days since their last purchase.';

    /** Stage → copy. Tone escalates gently; all of it stays content-first. */
    private const STAGES = [
        7 => [
            'title' => 'New content is waiting for you',
            'body' => 'Your creators have posted since your last visit — see what is new.',
        ],
        14 => [
            'title' => 'You have unlocked content waiting',
            'body' => 'It has been a couple of weeks. Catch up on what your creators have released.',
        ],
        30 => [
            'title' => 'We saved your spot',
            'body' => 'It has been a month. Here is what your creators have published since you were last here.',
        ],
    ];

    public function handle(SupporterLapseService $lapse): int
    {
        $dryRun = (bool) $this->option('dry-run');
        $only = $this->option('stage') ? (int) $this->option('stage') : null;

        $stages = $only ? array_intersect_key(self::STAGES, [$only => true]) : self::STAGES;

        if (empty($stages)) {
            $this->error('Invalid --stage. Use 7, 14 or 30.');

            return self::FAILURE;
        }

        $totalSent = 0;

        foreach ($stages as $days => $copy) {
            $rows = $lapse->lapsedExactlyDaysAgo($days);
            $this->line("Stage {$days}d: {$rows->count()} supporter(s) matched.");

            foreach ($rows as $row) {
                $user = User::find($row->supporter_id);

                if (! $user || empty($user->email)) {
                    continue;
                }

                // Key ties the send to this specific lapse cycle — a new purchase
                // changes last_purchase and therefore allows a future reminder.
                $dedupKey = substr((string) $row->last_purchase, 0, 10).'|'.$days;

                if ($dryRun) {
                    $this->line("  DRY-RUN: would remind user {$user->id} ({$user->email}) — key {$dedupKey}");

                    continue;
                }

                if (! NotificationDispatcher::claim($user->id, EngagementNotification::TYPE_REACTIVATION, $dedupKey)) {
                    continue; // already reminded for this stage of this lapse
                }

                NotificationDispatcher::queue(
                    $user,
                    EngagementNotification::TYPE_REACTIVATION,
                    [
                        'title' => $copy['title'],
                        'body' => $copy['body'],
                        'module' => 'reactivation',
                    ],
                    [NotificationDispatcher::CHANNEL_BELL, NotificationDispatcher::CHANNEL_PUSH],
                );

                $totalSent++;
            }
        }

        $this->info("Reactivation reminders queued: {$totalSent}".($dryRun ? ' (dry-run — nothing sent)' : ''));

        return self::SUCCESS;
    }
}
