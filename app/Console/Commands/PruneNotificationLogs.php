<?php

namespace App\Console\Commands;

use App\Models\NotificationLog;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Schema;

/**
 * Keeps `notification_logs` bounded, and settles rows that never got a send
 * confirmation.
 *
 * The table gains a row for every email, push and bell entry the platform
 * produces — several per purchase, plus every campaign recipient — so it grows
 * faster than any payment table and nothing else would ever remove a row.
 */
class PruneNotificationLogs extends Command
{
    protected $signature = 'notification-logs:prune
        {--days= : Override the retention window for transactional rows}
        {--chunk=1000 : Rows deleted per statement}
        {--dry-run : Report what would happen and change nothing}';

    protected $description = 'Delete expired notification delivery logs and settle rows that never confirmed';

    public function handle(): int
    {
        // Same reason as the audit command: this is scheduled, and a database
        // that has not had the migration yet is not a fault to report daily.
        if (! Schema::hasTable('notification_logs')) {
            $this->warn('Delivery logging is not set up on this database yet — nothing to prune.');

            return self::SUCCESS;
        }

        $dryRun = (bool) $this->option('dry-run');
        $chunk = max(100, (int) $this->option('chunk'));

        $this->settleStaleRows($dryRun);

        $days = (int) ($this->option('days') ?: config('notification_logs.retention_days', 180));
        $campaignDays = (int) config('notification_logs.campaign_retention_days', 60);

        // Never let a bad --days delete rows the creator/gifter surfaces still
        // read; a week is the shortest window any of them looks back over.
        $days = max(7, $days);
        $campaignDays = max(7, min($campaignDays, $days));

        $deleted = $this->prune(
            NotificationLog::whereNull('campaign_id')->where('created_at', '<', now()->subDays($days)),
            $chunk,
            $dryRun,
        );

        $deletedCampaign = $this->prune(
            NotificationLog::whereNotNull('campaign_id')->where('created_at', '<', now()->subDays($campaignDays)),
            $chunk,
            $dryRun,
        );

        $this->info(sprintf(
            '%s %d transactional row(s) older than %d days and %d campaign row(s) older than %d days.',
            $dryRun ? 'Would delete' : 'Deleted',
            $deleted,
            $days,
            $deletedCampaign,
            $campaignDays,
        ));

        return self::SUCCESS;
    }

    /**
     * A row is written before the transport is called and flipped to `sent`
     * when it accepts the message. One still `queued` long afterwards never got
     * that confirmation — the send threw, or the process died mid-flight.
     * Leaving it `queued` reads as "still on its way", which it is not.
     */
    private function settleStaleRows(bool $dryRun): void
    {
        $cutoff = now()->subMinutes(max(5, (int) config('notification_logs.stale_after_minutes', 60)));

        $query = NotificationLog::where('status', NotificationLog::STATUS_QUEUED)
            ->where('created_at', '<', $cutoff);

        $count = (clone $query)->count();

        if ($count === 0) {
            return;
        }

        if ($dryRun) {
            $this->line("Would settle {$count} unconfirmed row(s) as failed.");

            return;
        }

        $query->update([
            'status' => NotificationLog::STATUS_FAILED,
            'reason' => 'No send confirmation was received from the mail transport',
            'updated_at' => now(),
        ]);

        $this->line("Settled {$count} unconfirmed row(s) as failed.");
    }

    private function prune($query, int $chunk, bool $dryRun): int
    {
        if ($dryRun) {
            return (clone $query)->count();
        }

        $total = 0;

        // Batched so a large backlog cannot hold a lock over the whole table.
        do {
            $deleted = (clone $query)->limit($chunk)->delete();
            $total += $deleted;
        } while ($deleted > 0);

        return $total;
    }
}
