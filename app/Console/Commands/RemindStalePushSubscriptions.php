<?php

namespace App\Console\Commands;

use App\Mail\PushAlertsNeedChecking;
use App\Models\NotificationLog;
use App\Models\User;
use App\Services\NotificationDispatcher;
use App\Support\PushReachability;
use Illuminate\Console\Command;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Schema;

/**
 * Emails creators whose web-push subscription we can no longer confirm.
 *
 * A sweep, not an observer: the signal is TIME PASSING without a heartbeat, and
 * no row is written when that happens — nothing to hook.
 *
 * 🚨 IT ONLY FIRES WHEN THERE WAS SOMETHING TO MISS. A creator with a stale
 * heartbeat and no push attempted in the window has lost nothing, and telling
 * them so is the kind of message that teaches people to ignore the next one.
 * That check is what keeps this from being a blind 14-day timer.
 */
class RemindStalePushSubscriptions extends Command
{
    protected $signature = 'push:remind-stale
        {--dry-run : Report who would be emailed and send nothing}
        {--max= : Cap how many creators are EMAILED (not examined)}
        {--user= : Only this user id}';

    protected $description = 'Ask creators to check their phone alerts when we cannot confirm their push subscription.';

    public function handle(): int
    {
        // The migration may not have landed yet on an environment this is
        // scheduled on. A daily throw into Sentry for a condition that is not a
        // fault is worse than doing nothing.
        if (! Schema::hasColumn('users', 'push_verified_at')) {
            $this->warn('users.push_verified_at is missing — run migrations. Nothing to do.');

            return self::SUCCESS;
        }

        $dryRun = (bool) $this->option('dry-run');
        $max = $this->option('max') !== null ? max(1, (int) $this->option('max')) : null;

        $query = PushReachability::staleCreatorQuery();

        if ($this->option('user')) {
            $query->whereKey((int) $this->option('user'));
        }

        $sent = 0;
        $skippedNothingMissed = 0;
        $examined = 0;

        // ⚠️ A cursor with the claim taken per creator, so --max caps SENDS and
        // everyone past the cap is simply left unclaimed for the next run. Capping
        // the QUERY instead means a run whose first N candidates all had nothing
        // to miss reaches nobody, forever, and the gap grows with the table.
        foreach ($query->orderBy('id')->cursor() as $creator) {
            if ($max !== null && $sent >= $max) {
                break;
            }

            $examined++;

            if (! $this->missedSomething($creator)) {
                $skippedNothingMissed++;

                continue;
            }

            if ($dryRun) {
                $this->line("  DRY-RUN: would remind creator {$creator->id} ({$creator->email})"
                    .' — last confirmed '.($creator->push_verified_at ? $creator->push_verified_at : 'never'));
                $sent++;

                continue;
            }

            // Capture BEFORE claiming, so a failed send can put back what was there
            // rather than nulling a legitimate earlier reminder.
            $previous = $creator->push_reminded_at;

            if (! PushReachability::claimReminder($creator)) {
                continue; // another worker won it, or they were reminded recently
            }

            try {
                $this->remind($creator);
                $sent++;
            } catch (\Throwable $e) {
                PushReachability::releaseReminder($creator, $previous);

                Log::error('push:remind-stale failed to queue reminder', [
                    'user_id' => $creator->id,
                    'error' => $e->getMessage(),
                ]);

                $this->error("  Failed for creator {$creator->id}: {$e->getMessage()}");
            }
        }

        $this->info("Examined {$examined} · reminded {$sent} · skipped {$skippedNothingMissed} with nothing missed"
            .($dryRun ? ' (dry-run — nothing sent)' : ''));

        return self::SUCCESS;
    }

    /**
     * Did we actually try to push to this creator while we could not confirm them?
     *
     * Reads the delivery log, which records one row per push attempt per recipient
     * — so this is the real "they would have been buzzed N times" figure rather
     * than a guess from their activity.
     *
     * ⚠️ Answers TRUE when the log is unreadable or has no history yet. "We cannot
     * tell" is not "nothing happened", and silently dropping every candidate would
     * make the whole command look like it works while reaching nobody.
     */
    private function missedSomething(User $creator): bool
    {
        try {
            if (! Schema::hasTable('notification_logs')) {
                return true;
            }

            $since = $creator->push_verified_at
                ? Carbon::parse($creator->push_verified_at)
                : now()->subDays(PushReachability::STALE_DAYS);

            return NotificationLog::query()
                ->where('channel', NotificationLog::CHANNEL_PUSH)
                ->where('recipient_user_id', $creator->id)
                ->where('status', NotificationLog::STATUS_SENT)
                ->where('created_at', '>=', $since)
                ->exists();
        } catch (\Throwable $e) {
            Log::warning('push:remind-stale could not read the delivery log', ['error' => $e->getMessage()]);

            return true;
        }
    }

    /**
     * Email only — deliberately.
     *
     * Push is the thing we cannot confirm, so sending this by push is circular.
     * The bell is only read by someone already in the app, and being in the app is
     * the exact act that refreshes the heartbeat and makes this unnecessary.
     */
    private function remind(User $creator): void
    {
        NotificationDispatcher::queue(
            $creator,
            'push_subscription_stale',
            [
                'title' => PushAlertsNeedChecking::subjectLine(),
                'body' => 'We have not been able to confirm your phone alerts recently. Open the app to check.',
                'module' => 'push_subscription',
                'mailable' => PushAlertsNeedChecking::class,
                'mailable_args' => [
                    'userId' => $creator->id,
                    'creatorName' => $creator->name ?: 'there',
                    'dashboardUrl' => route('dashboard'),
                ],
            ],
            [NotificationDispatcher::CHANNEL_EMAIL],
            // Operational, not marketing: this is the creator's own account state
            // and the thing standing between them and knowing they made a sale.
            // The audience is already filtered on push_notifications_enabled by
            // staleCreatorQuery(), so an opted-out creator never reaches here.
            marketing: false,
        );
    }
}
