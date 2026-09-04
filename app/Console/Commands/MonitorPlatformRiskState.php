<?php

namespace App\Console\Commands;

use App\Helpers;
use App\Mail\PlatformRiskAlert;
use App\Models\AuditLog;
use App\Models\CreatorMetric;
use App\Models\EarlyFraudWarning;
use App\Models\Payment;
use App\Models\PlatformRiskState;
use App\Models\RiskSetting;
use App\Models\SecurityEvent;
use App\Models\User;
use App\Support\AlertRouter;
use App\Support\PlatformGmvTrigger;
use App\Support\SecurityEventLog;
use App\Support\UserFlagger;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;

class MonitorPlatformRiskState extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'risk:monitor-platform {--dry-run : Evaluate every trigger and report, but never change the platform state}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Monitor platform metrics and automatically update risk state (NORMAL/CAUTION/THROTTLE/FREEZE)';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $this->info('Checking platform risk metrics...');

        $triggers = RiskSetting::get('platform_state_triggers', []);
        $freezeDisputeRate = (float) ($triggers['platform_dispute_rate_freeze'] ?? 0.007);
        $dailyGmvCautionMultiplier = (float) ($triggers['daily_gmv_caution_multiplier'] ?? 1.5);
        $dailyGmvThrottleMultiplier = (float) ($triggers['daily_gmv_throttle_multiplier'] ?? PlatformGmvTrigger::DEFAULT_DAILY_THROTTLE_MULTIPLIER);
        // ⚠️ Raised 1.3 → 2.0 (15 Aug 2026). At 1.3 the platform THROTTLED itself
        // for 30% week-on-week growth, which is a healthy ramp rather than an
        // incident — and is exactly what the live ad campaigns are bought to
        // produce. Do not lower it without a floor rise to match.
        $weeklyGmvSpikeMultiplier = (float) ($triggers['weekly_gmv_spike_multiplier'] ?? PlatformGmvTrigger::DEFAULT_WEEKLY_MULTIPLIER);
        $creatorDisputeRateTrigger = (float) ($triggers['creator_dispute_rate_trigger'] ?? 0.008);
        $creatorsOverTriggerCount = (int) ($triggers['creators_over_trigger_count'] ?? 5);

        // ⚠️ The GMV floors and the fire/suppress rule live in
        // `App\Support\PlatformGmvTrigger`. This command's metrics are raw MySQL
        // (`NOW() - INTERVAL 30 DAY`), which no sqlite test can execute, so the
        // RULE is kept where it can be tested and only the queries stay here.
        // A ratio trigger must clear an absolute size as well as its multiplier.
        $dailyCautionFloor = (int) ($triggers['daily_gmv_caution_floor_minor'] ?? PlatformGmvTrigger::DEFAULT_DAILY_CAUTION_FLOOR);
        $dailyThrottleFloor = (int) ($triggers['daily_gmv_throttle_floor_minor'] ?? PlatformGmvTrigger::DEFAULT_DAILY_THROTTLE_FLOOR);
        $weeklyFloor = (int) ($triggers['weekly_gmv_spike_floor_minor'] ?? PlatformGmvTrigger::DEFAULT_WEEKLY_FLOOR);

        // 🚨 Security Checklist §3 — "unusual refund volume". Run FIRST, before
        // any trigger below, because every one of them `return`s on firing: put
        // this at the bottom and a frozen platform would stop reporting its own
        // refund rate at exactly the moment somebody wants to know it.
        $this->checkRefundVolume();

        // 1. Calculate Dispute Rate (30d)
        // Spec: If dispute_rate_pct >= 0.7% -> FREEZE

        $disputeStats = DB::selectOne("
            WITH tx AS (
                SELECT COUNT(*) AS total_tx
                FROM payments
                WHERE status IN ('succeeded','review_hold','refunded','disputed')
                AND created_at >= NOW() - INTERVAL 30 DAY
            ),
            dp AS (
                SELECT COUNT(*) AS total_disputes
                FROM disputes
                WHERE created_at >= NOW() - INTERVAL 30 DAY
            )
            SELECT 
                tx.total_tx, 
                dp.total_disputes,
                (CAST(dp.total_disputes AS DECIMAL(10,4)) / NULLIF(tx.total_tx, 0)) * 100 AS dispute_rate_pct
            FROM tx, dp
        ");

        $disputeRate = $disputeStats->dispute_rate_pct ?? 0;
        $this->info("Current Dispute Rate (30d): {$disputeRate}%");

        if ($disputeRate >= ($freezeDisputeRate * 100)) {
            $this->transitionState('FREEZE', ['PLATFORM_DISPUTE_FREEZE'], [
                'dispute_rate' => $disputeRate,
                'total_tx' => $disputeStats->total_tx,
                'total_disputes' => $disputeStats->total_disputes,
            ]);

            return;
        }

        // 2. Daily GMV Spike (24h vs 7d avg)

        $gmvStats = DB::selectOne("
            WITH last_24h AS (
                SELECT COALESCE(SUM(amount),0) AS gmv_24h
                FROM payments
                WHERE status='succeeded'
                AND created_at >= NOW() - INTERVAL 24 HOUR
            ),
            avg_7d AS (
                SELECT COALESCE(SUM(amount),0)/7 AS avg_daily_7d
                FROM payments
                WHERE status='succeeded'
                AND created_at >= NOW() - INTERVAL 7 DAY
            )
            SELECT 
                last_24h.gmv_24h, 
                avg_7d.avg_daily_7d,
                CASE WHEN avg_7d.avg_daily_7d = 0 THEN 0 
                ELSE CAST(last_24h.gmv_24h AS DECIMAL(10,4)) / avg_7d.avg_daily_7d END AS ratio
            FROM last_24h, avg_7d
        ");

        $gmvRatio = $gmvStats->ratio ?? 0;
        $gmv24h = (int) ($gmvStats->gmv_24h ?? 0);
        $this->info("GMV Spike Ratio: {$gmvRatio} (24h GMV minor: {$gmv24h})");

        if (PlatformGmvTrigger::fires($gmvRatio, $dailyGmvThrottleMultiplier, $gmv24h, $dailyThrottleFloor)) {
            $this->transitionState('THROTTLE', ['GMV_SPIKE_THROTTLE'], [
                'gmv_ratio' => $gmvRatio,
                'gmv_24h' => $gmvStats->gmv_24h,
                'avg_daily_7d' => $gmvStats->avg_daily_7d,
                'floor_minor' => $dailyThrottleFloor,
            ]);

            return;
        }

        // A ratio that cleared its multiplier and not its floor is the case this
        // floor exists for. Report it — the whole point is to be able to tell
        // "the trigger never fired" from "the trigger was suppressed", and
        // without this line the two are indistinguishable in the log.
        $this->reportSuppressed('GMV_SPIKE_THROTTLE', PlatformGmvTrigger::suppressed($gmvRatio, $dailyGmvThrottleMultiplier, $gmv24h, $dailyThrottleFloor), $gmv24h, $dailyThrottleFloor, [
            'gmv_ratio' => $gmvRatio,
            'avg_daily_7d' => $gmvStats->avg_daily_7d,
        ]);

        if (PlatformGmvTrigger::suppressed($gmvRatio, $dailyGmvCautionMultiplier, $gmv24h, $dailyCautionFloor)) {
            $this->reportSuppressed('GMV_SPIKE_CAUTION', true, $gmv24h, $dailyCautionFloor, [
                'gmv_ratio' => $gmvRatio,
                'avg_daily_7d' => $gmvStats->avg_daily_7d,
            ]);
        }

        if (PlatformGmvTrigger::fires($gmvRatio, $dailyGmvCautionMultiplier, $gmv24h, $dailyCautionFloor)) {
            $this->transitionState('CAUTION', ['GMV_SPIKE_CAUTION'], [
                'gmv_ratio' => $gmvRatio,
                'gmv_24h' => $gmvStats->gmv_24h,
                'avg_daily_7d' => $gmvStats->avg_daily_7d,
            ]);

            return;
        }

        // 3. Weekly GMV Spike

        $weeklyStats = DB::selectOne("
            WITH this_week AS (
                SELECT COALESCE(SUM(amount),0) AS gmv
                FROM payments
                WHERE status='succeeded'
                AND created_at >= NOW() - INTERVAL 7 DAY
            ),
            prev_week AS (
                SELECT COALESCE(SUM(amount),0) AS gmv
                FROM payments
                WHERE status='succeeded'
                AND created_at >= NOW() - INTERVAL 14 DAY
                AND created_at < NOW() - INTERVAL 7 DAY
            )
            SELECT 
                this_week.gmv AS gmv_this_week, 
                prev_week.gmv AS gmv_prev_week,
                CASE WHEN prev_week.gmv = 0 THEN 0 
                ELSE CAST(this_week.gmv AS DECIMAL(10,4)) / prev_week.gmv END AS ratio
            FROM this_week, prev_week
        ");

        $weeklyRatio = $weeklyStats->ratio ?? 0;
        $gmvThisWeek = (int) ($weeklyStats->gmv_this_week ?? 0);
        $this->info("Weekly GMV Ratio: {$weeklyRatio} (7d GMV minor: {$gmvThisWeek})");

        if (PlatformGmvTrigger::fires($weeklyRatio, $weeklyGmvSpikeMultiplier, $gmvThisWeek, $weeklyFloor)) {
            $this->transitionState('THROTTLE', ['WEEKLY_GMV_SPIKE'], [
                'weekly_ratio' => $weeklyRatio,
                'gmv_this_week' => $weeklyStats->gmv_this_week,
                'gmv_prev_week' => $weeklyStats->gmv_prev_week,
                'floor_minor' => $weeklyFloor,
            ]);

            return;
        }

        $this->reportSuppressed('WEEKLY_GMV_SPIKE', PlatformGmvTrigger::suppressed($weeklyRatio, $weeklyGmvSpikeMultiplier, $gmvThisWeek, $weeklyFloor), $gmvThisWeek, $weeklyFloor, [
            'weekly_ratio' => $weeklyRatio,
            'gmv_prev_week' => $weeklyStats->gmv_prev_week,
        ]);

        // 4. Creator Clusters (High Disputes)

        $badCreators = DB::selectOne("
            WITH creator_tx AS (
                SELECT creator_id, COUNT(*) AS tx
                FROM payments
                WHERE created_at >= NOW() - INTERVAL 7 DAY
                AND status IN ('succeeded','review_hold','refunded','disputed')
                GROUP BY creator_id
            ),
            creator_dp AS (
                SELECT creator_id, COUNT(*) AS disputes
                FROM disputes
                WHERE created_at >= NOW() - INTERVAL 7 DAY
                GROUP BY creator_id
            ),
            rates AS (
                SELECT 
                    t.creator_id,
                    (CAST(COALESCE(d.disputes,0) AS DECIMAL(10,4)) / NULLIF(t.tx,0)) * 100 AS dispute_rate_pct
                FROM creator_tx t
                LEFT JOIN creator_dp d ON d.creator_id = t.creator_id
            )
            SELECT COUNT(*) AS creators_over_threshold
            FROM rates
            WHERE dispute_rate_pct >= ?
        ", [($creatorDisputeRateTrigger * 100)]);

        $badCreatorCount = $badCreators->creators_over_threshold ?? 0;
        $this->info("Creators with High Disputes: {$badCreatorCount}");

        if ($badCreatorCount >= $creatorsOverTriggerCount) {
            $this->transitionState('THROTTLE', ['CREATOR_CLUSTER_RISK'], [
                'bad_creator_count' => $badCreatorCount,
            ]);

            return;
        }

        // 5. EFW Spike Trigger
        $efwSpikeThreshold = (int) ($triggers['efw_spike_threshold'] ?? 10);
        $efwCount24h = EarlyFraudWarning::where('created_at', '>=', now()->subHours(24))->count();
        $this->info("EFW Count (24h): {$efwCount24h}");

        if ($efwCount24h >= $efwSpikeThreshold * 2) {
            $this->transitionState('THROTTLE', ['EFW_SPIKE_THROTTLE'], [
                'efw_count_24h' => $efwCount24h,
            ]);

            return;
        } elseif ($efwCount24h >= $efwSpikeThreshold) {
            $this->transitionState('CAUTION', ['EFW_SPIKE_CAUTION'], [
                'efw_count_24h' => $efwCount24h,
            ]);

            return;
        }

        // If all checks pass, consider recovering to NORMAL
        // We should check if we are currently in a high risk state set by SYSTEM
        // and if metrics have cooled down.
        // For simplicity, if no triggers fire, we can suggest NORMAL, but we should be careful not to flap.
        // Let's only Auto-Recover if current state is NOT NORMAL and set by SYSTEM.

        $currentState = PlatformRiskState::latest('started_at')->first();
        if ($currentState && $currentState->state !== 'NORMAL' && $currentState->set_by === 'system') {
            // Stabilization window: require the elevated state to have held for at least
            // RECOVERY_STABILIZATION_HOURS (with no triggers firing this run) before
            // auto-recovering. Without it, a metric oscillating around a threshold flaps
            // NORMAL <-> elevated on every scheduler tick.
            $stabilizationHours = 2;
            if ($currentState->started_at && $currentState->started_at->gt(now()->subHours($stabilizationHours))) {
                Log::info("Risk state auto-recovery deferred: elevated state not yet stable for {$stabilizationHours}h", [
                    'state' => $currentState->state,
                    'started_at' => (string) $currentState->started_at,
                ]);

                return;
            }
            $this->transitionState('NORMAL', ['METRICS_STABILIZED'], []);
        }
    }

    /**
     * Record a ratio trigger that fired and was held back by its absolute floor.
     *
     * ⚠️ This is not decoration. The floors were picked against one snapshot of
     * live GMV, and the only way to know whether they are set right is to read
     * back how often a real trigger was suppressed and by how much. A silent
     * suppression is indistinguishable from a trigger that never fired.
     */
    private function reportSuppressed(string $reason, bool $wasSuppressed, int $observedMinor, int $floorMinor, array $context = []): void
    {
        if (! $wasSuppressed) {
            return;
        }

        $line = sprintf(
            'SUPPRESSED %s — ratio cleared but GMV %s is under the £%s floor.',
            $reason,
            number_format($observedMinor / 100, 2),
            number_format($floorMinor / 100, 2),
        );

        $this->warn($line);

        Log::info('Platform risk trigger suppressed by GMV floor', array_merge([
            'reason' => $reason,
            'observed_minor' => $observedMinor,
            'floor_minor' => $floorMinor,
        ], $context));
    }

    private function transitionState($newState, $reasons, $metrics)
    {
        // A dry run evaluates every trigger and reports what it WOULD do. It must
        // never write a PlatformRiskState row: that row is what the next run diffs
        // against and what gates creator registration, so a "safe" inspection that
        // froze the platform would be the worst possible outcome of a --dry-run.
        if ($this->option('dry-run')) {
            $current = PlatformRiskState::latest('started_at')->first();
            $currentState = $current ? $current->state : 'NORMAL';

            if ($currentState === $newState) {
                $this->line("DRY RUN: already {$newState}, no change.");

                return;
            }

            $this->warn("DRY RUN: would transition {$currentState} -> {$newState} (".implode(', ', $reasons).')');

            return;
        }

        $current = PlatformRiskState::latest('started_at')->first();
        $currentState = $current ? $current->state : 'NORMAL';

        // Don't insert if state hasn't changed (unless we want to refresh heartbeat)
        // But logging every minute is spammy.
        if ($currentState === $newState) {
            return;
        }

        // Priority check: Don't downgrade from FREEZE automatically?
        // Spec says: "FREEZE blocks new creator activation until admin unfreezes."
        // So if current is FREEZE, we should NOT auto-recover to NORMAL/THROTTLE unless explicitly allowed.
        // But if triggers say FREEZE, we must upgrade.

        if ($currentState === 'FREEZE' && $newState !== 'FREEZE') {
            $this->info("System recommends {$newState}, but current state is FREEZE (requires admin unlock). Skipping.");

            return;
        }

        $this->warn("Transitioning Platform State: {$currentState} -> {$newState}");

        PlatformRiskState::create([
            'state' => $newState,
            'reason_codes' => $reasons,
            'set_by' => 'system',
            'metrics_snapshot' => $metrics,
            'started_at' => now(),
        ]);

        // Audit Log
        AuditLog::create([
            'actor' => 'system',
            'action_type' => 'PLATFORM_STATE_CHANGE',
            'metadata_json' => [
                'from' => $currentState,
                'to' => $newState,
                'reasons' => $reasons,
                'metrics' => $metrics,
            ],
        ]);

        $this->notifyAdmins($newState, $reasons, $metrics);
    }

    /**
     * Mail every admin about a platform-level risk event.
     *
     * Extracted from `transitionState` so the refund-volume watch can reuse the
     * SAME path rather than inventing a second admin notification system — the
     * recipient list, the environment behaviour and the template are all
     * already right here, and two of them would drift.
     *
     * @param  string|null  $headline  a subject line for an alert that is not a
     *                                 state transition; null keeps the original
     *                                 "State changed to X" subject exactly.
     */
    private function notifyAdmins($state, $reasons, $metrics, ?string $headline = null): void
    {
        try {

            /*
             * 🚨 This built its own recipient list and had three faults in it: a
             * personal address hardcoded into the class, `noreply@spennypiggy.co`
             * plus `mail.from.address` (the platform mailing ITSELF at an inbox
             * nobody reads), and every row of `admins` regardless of role or
             * whether the account was disabled — so a read-only auditor and a
             * blocked admin were both paged about the platform's risk state.
             *
             * Routed now: System -> Alert Routing in the admin panel. Role
             * expansion excludes disabled and deleted accounts.
             */
            $allRecipients = AlertRouter::recipients('platform_risk_state');

            if (empty($allRecipients)) {
                Log::info('Platform risk alert not sent: the channel has no recipients.', [
                    'state' => $state,
                ]);

                return;
            }

            foreach ($allRecipients as $email) {
                Mail::to($email)->send(new PlatformRiskAlert($state, $reasons, $metrics, $headline));
                Helpers::sendNotification(
                    "Platform Risk Alert: {$state}",
                    $headline ?? "System state changed to {$state}. Reasons: ".implode(', ', $reasons),
                    $email
                );
            }

            $this->info('Platform risk notifications sent.');
        } catch (\Exception $e) {
            // 🚨 The state transition above has already been written. Alerting
            // must never be able to undo or block the thing it observes.
            Log::error('Failed to send Platform Risk Alert email: '.$e->getMessage());
        }
    }

    /**
     * "Unusual refund volume" — Security Checklist §3.
     *
     * The audit found this measured and never reported: `RiskService` has
     * computed `refund_rate_30d` against `high_refund_rate` (0.05) for a long
     * time, and does something about it — but only to the CREATOR, by raising
     * their reserve. `MonitorPlatformRiskState` alerted admins on dispute rate
     * and EFW spikes and on nothing to do with refunds, so a platform-wide
     * refund problem was visible in the database and in nobody's inbox.
     *
     * 🚨 IT DOES NOT CHANGE THE PLATFORM STATE. Refund rate is not one of the
     * spec'd state triggers, and wiring it into `transitionState` would mean a
     * bad refund week could FREEZE the platform — a consequence nobody asked
     * for. This reports; the state machine above is untouched.
     *
     * THRESHOLDS, and why each one is where it is:
     *  - The RATE is not defined here. It is read from the risk engine's own
     *    `risk_thresholds.high_refund_rate`, so the number an admin is alerted
     *    on and the number a creator is scored on cannot drift apart.
     *  - A FLOOR of 50 transactions, because a 100% refund rate over three
     *    payments is a creator having a bad week, not a platform incident, and
     *    alerting on it teaches the reader to ignore the mail.
     *  - OR five creators individually over the threshold, mirroring the
     *    existing `creators_over_trigger_count` — a cluster is a signal even
     *    when the platform average is fine.
     *  - A 24-HOUR COOLDOWN. The metric is a 30-day rolling window, so it moves
     *    by fractions of a percent between scheduler ticks; mailing on every run
     *    would send the same number dozens of times a day.
     *
     * 🚨 NEVER THROWS. This runs ahead of the state machine and must not be able
     * to stop it.
     */
    private function checkRefundVolume(): void
    {
        try {
            // ⚠️ The SAME setting `RiskService::evaluateRisk` reads, with the
            // same defaults. Two copies of "what counts as a high refund rate"
            // is how the admin alert and the creator's reserve end up disagreeing.
            $thresholds = RiskSetting::get('risk_thresholds') ?: [
                'high_refund_rate' => 0.05,
                'min_tx_count' => 1,
            ];

            $refundRateTrigger = (float) ($thresholds['high_refund_rate'] ?? 0.05);
            $minTxPerCreator = (int) ($thresholds['min_tx_count'] ?? 1);

            $since = now()->subDays(30);
            $countedStatuses = ['succeeded', 'review_hold', 'refunded', 'disputed'];

            $totalTx = (int) Payment::whereIn('status', $countedStatuses)->where('created_at', '>=', $since)->count();
            $refunds = (int) Payment::where('status', 'refunded')->where('created_at', '>=', $since)->count();

            $refundRate = $totalTx > 0 ? $refunds / $totalTx : 0.0;

            // Read straight off the metrics the risk engine already maintains —
            // recomputing per creator here would be a second implementation of
            // a number that already exists, and the two would disagree.
            $creatorsOverRows = CreatorMetric::where('refund_rate_30d', '>', $refundRateTrigger)
                ->where('tx_30d', '>=', $minTxPerCreator)
                ->get(['creator_id', 'refund_rate_30d', 'refunds_30d', 'tx_30d']);

            $creatorsOver = $creatorsOverRows->count();

            /*
             * The platform alert says "N creators are over the line" and stops
             * there — it never says WHICH, so an admin reading it has nowhere to
             * go next. A flag on each of those creators is the same fact, on the
             * row an admin actually works from.
             *
             * ⚠️ Raised per creator regardless of whether the platform-wide
             * trigger fires below. The cluster floor exists to decide whether the
             * PLATFORM is in trouble; a creator refunding a third of their sales
             * is worth looking at whether or not four others are doing the same.
             *
             * ⚠️ Repeats absorb into one open flag, so this running daily does
             * not produce a daily row — it moves `occurrences` and `last_seen_at`
             * on the existing one.
             */
            foreach ($creatorsOverRows as $row) {
                $rate = round(((float) $row->refund_rate_30d) * 100, 2);

                UserFlagger::raise(
                    // ⚠️ creator_metrics.creator_id is the user's UUID, not its key.
                    user: (int) (User::where('uuid', $row->creator_id)->value('id') ?? 0) ?: null,
                    flagType: 'refund_volume',
                    reason: "Refund rate over the last 30 days is {$rate}% ({$row->refunds_30d} of {$row->tx_30d} transactions), above the platform threshold.",
                    context: [
                        'refund_rate_30d' => (float) $row->refund_rate_30d,
                        'refunds_30d' => (int) $row->refunds_30d,
                        'tx_30d' => (int) $row->tx_30d,
                    ],
                    source: 'risk',
                );
            }

            $minTx = (int) config('security_alerts.refund_volume.min_transactions', 50);
            $creatorFloor = (int) config('security_alerts.refund_volume.creators_over_threshold', 5);

            $platformOver = $refundRate > $refundRateTrigger && $totalTx >= $minTx;
            $clusterOver = $creatorsOver >= $creatorFloor;

            $this->info(sprintf(
                'Refund rate (30d): %.2f%% over %d transactions · %d creator(s) over %.2f%%',
                $refundRate * 100,
                $totalTx,
                $creatorsOver,
                $refundRateTrigger * 100
            ));

            if (! $platformOver && ! $clusterOver) {
                // Report a suppressed trigger for the same reason the GMV floors
                // do: "the trigger never fired" and "the trigger was held back
                // by its floor" must be tellable apart in the log.
                if ($refundRate > $refundRateTrigger && $totalTx < $minTx) {
                    $this->warn("SUPPRESSED REFUND_VOLUME — rate cleared but only {$totalTx} transactions (floor {$minTx}).");
                    Log::info('Refund volume trigger suppressed by transaction floor', [
                        'refund_rate' => $refundRate,
                        'total_tx' => $totalTx,
                        'floor' => $minTx,
                    ]);
                }

                return;
            }

            $reasons = array_values(array_filter([
                $platformOver ? 'PLATFORM_REFUND_RATE' : null,
                $clusterOver ? 'CREATOR_REFUND_CLUSTER' : null,
            ]));

            $metrics = [
                'refund_rate' => round($refundRate * 100, 3).'%',
                'threshold' => round($refundRateTrigger * 100, 3).'%',
                'refunds_30d' => $refunds,
                'transactions_30d' => $totalTx,
                'creators_over_threshold' => $creatorsOver,
                'transaction_floor' => $minTx,
            ];

            $event = SecurityEventLog::record(SecurityEvent::REFUND_VOLUME, [
                'severity' => 'warning',
                'description' => sprintf(
                    'Refund rate %.2f%% over %d transactions in 30 days; %d creator(s) individually over %.2f%%.',
                    $refundRate * 100,
                    $totalTx,
                    $creatorsOver,
                    $refundRateTrigger * 100
                ),
                'context' => $metrics + ['reasons' => $reasons],
            ]);

            if ($this->option('dry-run')) {
                $this->warn('DRY RUN: would raise a refund-volume alert ('.implode(', ', $reasons).')');

                return;
            }

            $cooldown = (int) config('security_alerts.refund_volume.cooldown_minutes', 1440);

            // Cache::add, not has()+put() — two schedulers overlapping would
            // otherwise both pass the check and both send.
            if ($cooldown > 0 && ! Cache::add('security_alert:refund_volume', true, now()->addMinutes($cooldown))) {
                $this->line('Refund-volume alert suppressed by cooldown.');

                return;
            }

            $this->notifyAdmins(
                'REFUND VOLUME',
                $reasons,
                $metrics,
                sprintf('⚠️ Platform Risk Alert: refund volume %.2f%% (30d)', $refundRate * 100)
            );

            SecurityEventLog::markAlerted($event);
        } catch (\Throwable $e) {
            Log::warning('Refund volume check failed', ['error' => $e->getMessage()]);
        }
    }
}
