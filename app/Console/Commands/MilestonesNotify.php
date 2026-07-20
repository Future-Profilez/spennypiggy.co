<?php

namespace App\Console\Commands;

use App\Models\EngagementNotification;
use App\Models\User;
use App\Services\NotificationDispatcher;
use Illuminate\Console\Command;

/**
 * Birthday and supporter-anniversary messages.
 *
 * Birthday needs `users.date_of_birth`, which is optional — users who never
 * fill it in simply don't get one. Anniversary uses `created_at`, so it works
 * for everyone without extra input.
 *
 * Deliberately warm and content-first: no gift/tip/donation wording.
 */
class MilestonesNotify extends Command
{
    protected $signature = 'milestones:notify {--dry-run}';

    protected $description = 'Send birthday and supporter-anniversary messages for today.';

    public function handle(): int
    {
        $dryRun = (bool) $this->option('dry-run');
        $today = now();

        $birthdays = $this->birthdayUsers($today);
        $anniversaries = $this->anniversaryUsers($today);

        $this->line("Birthdays today: {$birthdays->count()} · Anniversaries today: {$anniversaries->count()}");

        $sent = 0;

        foreach ($birthdays as $user) {
            $key = 'birthday|'.$today->year;

            if ($dryRun) {
                $this->line("  DRY-RUN birthday: user {$user->id}");

                continue;
            }

            if (! NotificationDispatcher::claim($user->id, EngagementNotification::TYPE_MILESTONE, $key)) {
                continue;
            }

            NotificationDispatcher::queue($user, EngagementNotification::TYPE_MILESTONE, [
                'title' => '🎂 Happy birthday'.($user->name ? ', '.$user->name : '').'!',
                'body' => 'Thanks for being part of Spenny Piggy. Have a great one.',
                'module' => 'milestone',
            ], [NotificationDispatcher::CHANNEL_BELL, NotificationDispatcher::CHANNEL_PUSH]);

            $sent++;
        }

        foreach ($anniversaries as $user) {
            $years = max(1, $today->year - $user->created_at->year);
            $key = 'anniversary|'.$today->year;

            if ($dryRun) {
                $this->line("  DRY-RUN anniversary: user {$user->id} ({$years}y)");

                continue;
            }

            if (! NotificationDispatcher::claim($user->id, EngagementNotification::TYPE_MILESTONE, $key)) {
                continue;
            }

            NotificationDispatcher::queue($user, EngagementNotification::TYPE_MILESTONE, [
                'title' => '🎉 '.$years.($years === 1 ? ' year' : ' years').' with Spenny Piggy',
                'body' => 'Thanks for supporting creators here. See what they have published lately.',
                'module' => 'milestone',
            ], [NotificationDispatcher::CHANNEL_BELL, NotificationDispatcher::CHANNEL_PUSH]);

            $sent++;
        }

        $this->info("Milestone messages queued: {$sent}".($dryRun ? ' (dry-run)' : ''));

        return self::SUCCESS;
    }

    /**
     * Birthdays for today. Leap-year birthdays (29 Feb) are greeted on 28 Feb in
     * non-leap years so they aren't skipped for three years at a time.
     */
    private function birthdayUsers($today)
    {
        $query = User::query()
            ->whereNotNull('date_of_birth')
            ->whereMonth('date_of_birth', $today->month)
            ->whereDay('date_of_birth', $today->day);

        if ($today->month === 2 && $today->day === 28 && ! $today->isLeapYear()) {
            $query->orWhere(function ($q) {
                $q->whereNotNull('date_of_birth')
                    ->whereMonth('date_of_birth', 2)
                    ->whereDay('date_of_birth', 29);
            });
        }

        return $query->get();
    }

    /** Joined on this day in a previous year. */
    private function anniversaryUsers($today)
    {
        return User::query()
            ->whereMonth('created_at', $today->month)
            ->whereDay('created_at', $today->day)
            ->whereYear('created_at', '<', $today->year)
            ->get();
    }
}
