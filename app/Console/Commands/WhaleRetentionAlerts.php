<?php

namespace App\Console\Commands;

use App\Helpers;
use App\Models\EngagementNotification;
use App\Models\FinancialTransaction;
use App\Models\User;
use App\Services\NotificationDispatcher;
use App\Services\SupporterLapseService;
use Carbon\Carbon;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Log;

/**
 * Flags high-value supporters who have gone quiet, so the team can intervene
 * before the money is gone. Losing one whale costs more than losing dozens of
 * small supporters, so this is an INTERNAL alert (admin + optionally the
 * creator) — the supporter is never messaged by this command.
 *
 * Uses the same lapse definition as the reactivation engine and the admin
 * SupporterIntelligence dashboard.
 */
class WhaleRetentionAlerts extends Command
{
    protected $signature = 'whale:retention-alerts
        {--days=30 : Days since last purchase before a high-value supporter is "at risk"}
        {--min-spend=2500 : Minimum GBP-equivalent spend in the lookback window to count as high value}
        {--lookback=90 : Spend lookback window in days}
        {--dry-run}';

    protected $description = 'Alert admins about high-value supporters who have stopped purchasing.';

    public function handle(): int
    {
        $dryRun = (bool) $this->option('dry-run');
        $days = max(1, (int) $this->option('days'));
        $minSpend = (float) $this->option('min-spend');
        $lookback = max(1, (int) $this->option('lookback'));

        // Spend per supporter over the lookback window, excluding refunded/disputed.
        $spend = FinancialTransaction::query()
            ->selectRaw('supporter_id, SUM(gross_amount) as total_spend, MAX(transaction_date) as last_purchase')
            ->where('type', 'income')
            ->whereNotNull('supporter_id')
            ->whereNotIn('status', SupporterLapseService::EXCLUDED_STATUSES)
            ->where('transaction_date', '>=', now()->subDays($lookback))
            ->groupBy('supporter_id')
            // CAST the bound value: a PHP float binds as TEXT, and SQLite orders
            // every numeric below every text, so an uncast comparison silently
            // matches nothing on the test database.
            ->havingRaw('SUM(gross_amount) >= CAST(? AS DECIMAL(12,2))', [$minSpend])
            ->get();

        // Parse explicitly — last_purchase comes back as a raw SQL string, and
        // comparing that against a Carbon instance does not do what it looks like.
        $cutoff = now()->subDays($days);
        $atRisk = $spend->filter(
            fn ($row) => $row->last_purchase && Carbon::parse($row->last_purchase)->lte($cutoff)
        );

        $this->line("High-value supporters in window: {$spend->count()} · at risk: {$atRisk->count()}");

        if ($atRisk->isEmpty()) {
            return self::SUCCESS;
        }

        $adminEmail = config('services.dispute_notifications.admin_email');
        $sent = 0;

        foreach ($atRisk as $row) {
            $user = User::find($row->supporter_id);

            if (! $user) {
                continue;
            }

            // One alert per risk episode: keyed to the last purchase, so the same
            // quiet whale isn't re-alerted daily, but a later lapse re-triggers.
            $dedupKey = substr((string) $row->last_purchase, 0, 10);

            if ($dryRun) {
                $this->line("  DRY-RUN: at-risk supporter {$user->id} ({$user->email}) — spend {$row->total_spend}, last {$dedupKey}");

                continue;
            }

            if (! NotificationDispatcher::claim($user->id, EngagementNotification::TYPE_WHALE_RISK, $dedupKey)) {
                continue;
            }

            $title = '⚠️ High-value supporter at risk';
            $body = ($user->username ? '@'.$user->username : 'Supporter #'.$user->id)
                .' has not purchased since '.$dedupKey
                .'. Spend in the last '.$lookback.' days: '.number_format((float) $row->total_spend, 2).'.';

            if ($adminEmail) {
                try {
                    Helpers::sendNotification($title, $body, $adminEmail);
                } catch (\Throwable $e) {
                    Log::error('Whale retention alert failed', ['user_id' => $user->id, 'error' => $e->getMessage()]);
                }
            }

            $sent++;
        }

        $this->info("Whale retention alerts sent: {$sent}".($dryRun ? ' (dry-run)' : ''));

        return self::SUCCESS;
    }
}
