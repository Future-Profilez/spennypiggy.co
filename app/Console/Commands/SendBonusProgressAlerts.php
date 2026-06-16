<?php

namespace App\Console\Commands;

use App\Helpers;
use App\Models\FastStartBonusPayout;
use App\Models\FounderBonus;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Log;

class SendBonusProgressAlerts extends Command
{
    protected $signature = 'bonus:send-progress-alerts {--dry-run}';

    protected $description = 'Send push notifications for Fast Start and Founder Bonus window countdowns and earnings milestones';

    public function handle(): int
    {
        $dryRun = (bool) $this->option('dry-run');

        $this->sendFastStartCountdowns($dryRun);
        $this->sendFastStartMilestones($dryRun);
        $this->sendFounderCountdowns($dryRun);
        $this->sendFounderThresholdProximity($dryRun);

        return self::SUCCESS;
    }

    // ---------- Fast Start: window-end countdown ----------

    private function sendFastStartCountdowns(bool $dryRun): void
    {
        $remindDays = config('fast_start_bonus.notifications.window_end_remind_days', [7, 3]);
        $windowDays = (int) config('fast_start_bonus.bonus.window_days', 30);

        foreach ($remindDays as $daysLeft) {
            // Window ends exactly $daysLeft days from now (±6h tolerance)
            $targetWindowEnd = now()->addDays($daysLeft);
            $windowStartLow = now()->subDays($windowDays)->subHours(6);
            $windowStartHigh = now()->subDays($windowDays - $daysLeft)->addHours(6);

            $creators = User::query()
                ->whereNotNull('stripe_connected_at')
                ->where('stripe_details_submitted', 1)
                ->whereBetween('stripe_connected_at', [
                    $targetWindowEnd->copy()->subDays($windowDays)->subHours(6),
                    $targetWindowEnd->copy()->subDays($windowDays)->addHours(6),
                ])
                ->get(['uuid', 'email', 'name', 'stripe_connected_at', 'default_currency']);

            foreach ($creators as $creator) {
                // Skip if already paid out / no-bonus
                $row = FastStartBonusPayout::where('creator_uuid', $creator->uuid)
                    ->whereIn('status', ['paid', 'no_bonus'])
                    ->first();
                if ($row) {
                    continue;
                }

                $this->info("[fast-start-countdown] {$creator->uuid} — {$daysLeft} days left");

                if ($dryRun) {
                    continue;
                }

                try {
                    Helpers::sendNotification(
                        "⏰ {$daysLeft} days left in your Fast Start window!",
                        "Keep earning in the next {$daysLeft} days to maximise your Fast Start Bonus.",
                        $creator->email
                    );
                } catch (\Throwable $e) {
                    Log::warning('FastStart countdown push failed', ['uuid' => $creator->uuid, 'error' => $e->getMessage()]);
                }
            }
        }
    }

    // ---------- Fast Start: earnings milestone (50%, 80%) ----------

    private function sendFastStartMilestones(bool $dryRun): void
    {
        $milestones = config('fast_start_bonus.notifications.earnings_milestone_pcts', [50, 80]);

        // Only active windows (status = pending_settlement, last recalculated today)
        $rows = FastStartBonusPayout::where('status', 'pending_settlement')
            ->whereNotNull('last_calculated_at')
            ->whereDate('last_calculated_at', today())
            ->get();

        foreach ($rows as $row) {
            $creator = $row->creator;
            if (! $creator) {
                continue;
            }

            $earningsMinor = (int) ($row->earnings_minor ?? 0);
            if ($earningsMinor <= 0) {
                continue;
            }

            // Use a rough reference: 5% flat rate threshold crossing is not meaningful here,
            // so we alert on time-proportional expected earnings milestone.
            // Simple approach: if window is 30 days, 50% milestone = earnings at day 15.
            $windowDays = (int) config('fast_start_bonus.bonus.window_days', 30);
            $elapsed = now()->diffInDays(Carbon::parse($row->window_start));
            $pctElapsed = $windowDays > 0 ? min(100, ($elapsed / $windowDays) * 100) : 100;

            // Alert when earnings_minor is at or just crossed a milestone % of what they would need
            // for a "great" finish — we use their current run rate projected to 30 days.
            // We only fire once per milestone per row using a simple heuristic:
            // If current_earnings_pct_of_projected_total crosses milestone, and window is still ≥3 days open.
            $daysRemaining = now()->diffInDays(Carbon::parse($row->window_end), false);
            if ($daysRemaining < 3) {
                continue;
            }

            if ($elapsed <= 0) {
                continue;
            }

            // Project total earnings at current run rate
            $projectedMinor = (int) (($earningsMinor / $elapsed) * $windowDays);
            if ($projectedMinor <= 0) {
                continue;
            }

            $progressPct = (int) min(100, ($earningsMinor / $projectedMinor) * 100);

            foreach ($milestones as $milestone) {
                if ($progressPct >= $milestone && $progressPct < $milestone + 15) {
                    $currencySymbol = strtoupper($row->currency ?? 'GBP');
                    $earned = number_format($earningsMinor / 100, 2);
                    $bonusRate = FastStartBonusPayout::resolveRate($earningsMinor);
                    $bonusSoFar = number_format(($earningsMinor * $bonusRate) / 100, 2);

                    $this->info("[fast-start-milestone] {$creator->uuid} — {$milestone}% milestone. Earned: {$earned}");

                    if ($dryRun) {
                        break;
                    }

                    try {
                        Helpers::sendNotification(
                            "📈 You're at {$milestone}% of your Fast Start target!",
                            "You've earned {$currencySymbol} {$earned} so far — bonus so far: {$currencySymbol} {$bonusSoFar}. Keep going!",
                            $creator->email
                        );
                    } catch (\Throwable $e) {
                        Log::warning('FastStart milestone push failed', ['uuid' => $creator->uuid, 'error' => $e->getMessage()]);
                    }

                    break; // one milestone per run
                }
            }
        }
    }

    // ---------- Founder: 30-day window countdown ----------

    private function sendFounderCountdowns(bool $dryRun): void
    {
        $remindDays = [7, 3];
        $qualPeriod = (int) config('founder_bonus.qualification.qualification_period_days', 30);
        $minEarnings = (float) config('founder_bonus.qualification.min_first_30d_earnings', 2500);

        foreach ($remindDays as $daysLeft) {
            $creators = User::query()
                ->whereNotNull('stripe_connected_at')
                ->where('stripe_details_submitted', 1)
                ->whereNull('founder_missed_at')
                ->whereDoesntHave('founderBonus')
                ->whereBetween('stripe_connected_at', [
                    now()->subDays($qualPeriod - $daysLeft)->subHours(6),
                    now()->subDays($qualPeriod - $daysLeft)->addHours(6),
                ])
                ->get(['uuid', 'email', 'name', 'stripe_connected_at', 'id', 'default_currency']);

            foreach ($creators as $creator) {
                $windowStart = Carbon::parse($creator->stripe_connected_at);
                $windowEnd = $windowStart->copy()->addDays($qualPeriod);
                $earnings = FounderBonus::calculateCompletedNetEarnings($creator, $windowStart, now());
                $currencySymbol = config('founder_bonus.display.currency_symbol', '£');
                $earned = number_format($earnings, 2);
                $gap = number_format(max(0, $minEarnings - $earnings), 2);

                $this->info("[founder-countdown] {$creator->uuid} — {$daysLeft} days left. Earned: {$earned}");

                if ($dryRun) {
                    continue;
                }

                try {
                    $pushBody = $earnings >= $minEarnings
                        ? "You've already qualified! {$daysLeft} days left to keep earning and lock in your Founder status."
                        : "You need {$currencySymbol}{$gap} more in {$daysLeft} days to qualify for the Founder Bonus!";

                    Helpers::sendNotification(
                        "⏰ {$daysLeft} days left in your Founder window!",
                        $pushBody,
                        $creator->email
                    );
                } catch (\Throwable $e) {
                    Log::warning('Founder countdown push failed', ['uuid' => $creator->uuid, 'error' => $e->getMessage()]);
                }
            }
        }
    }

    // ---------- Founder: 80% threshold proximity alert ----------

    private function sendFounderThresholdProximity(bool $dryRun): void
    {
        $minEarnings = (float) config('founder_bonus.qualification.min_first_30d_earnings', 2500);
        $qualPeriod = (int) config('founder_bonus.qualification.qualification_period_days', 30);
        $proximityPct = 0.80;
        $threshold = $minEarnings * $proximityPct;
        $currencySymbol = config('founder_bonus.display.currency_symbol', '£');

        // Active-window creators: stripe_connected_at within last $qualPeriod days
        $creators = User::query()
            ->whereNotNull('stripe_connected_at')
            ->where('stripe_details_submitted', 1)
            ->whereNull('founder_missed_at')
            ->whereDoesntHave('founderBonus')
            ->where('stripe_connected_at', '>=', now()->subDays($qualPeriod))
            ->get(['uuid', 'email', 'name', 'stripe_connected_at', 'id', 'default_currency']);

        foreach ($creators as $creator) {
            $windowStart = Carbon::parse($creator->stripe_connected_at);
            $windowEnd = $windowStart->copy()->addDays($qualPeriod);
            $daysRemaining = (int) now()->diffInDays($windowEnd, false);

            if ($daysRemaining < 1 || $daysRemaining > 14) {
                continue; // only alert in last 2 weeks with days still remaining
            }

            $earnings = FounderBonus::calculateCompletedNetEarnings($creator, $windowStart, now());

            // Alert: earnings crossed 80% threshold but not yet at 100%
            if ($earnings >= $threshold && $earnings < $minEarnings) {
                $earned = number_format($earnings, 2);
                $gap = number_format($minEarnings - $earnings, 2);

                $this->info("[founder-proximity] {$creator->uuid} — earnings {$earned} (80%+ threshold). Gap: {$gap}");

                if ($dryRun) {
                    continue;
                }

                try {
                    Helpers::sendNotification(
                        "🔥 You're so close to Founder status!",
                        "Just {$currencySymbol}{$gap} more needed in {$daysRemaining} days to qualify for the Founder Bonus!",
                        $creator->email
                    );
                } catch (\Throwable $e) {
                    Log::warning('Founder proximity push failed', ['uuid' => $creator->uuid, 'error' => $e->getMessage()]);
                }
            }
        }
    }
}
