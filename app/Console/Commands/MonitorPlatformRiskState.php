<?php

namespace App\Console\Commands;

use App\Models\PlatformRiskState;
use App\Models\Admin;
use App\Models\RiskSetting;
use App\Mail\PlatformRiskAlert;
use Illuminate\Console\Command;
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
    protected $signature = 'risk:monitor-platform';

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
        $freezeDisputeRate = (float)($triggers['platform_dispute_rate_freeze'] ?? 0.007);
        $dailyGmvCautionMultiplier = (float)($triggers['daily_gmv_caution_multiplier'] ?? 1.5);
        $dailyGmvThrottleMultiplier = (float)($triggers['daily_gmv_throttle_multiplier'] ?? 2.0);
        $weeklyGmvSpikeMultiplier = (float)($triggers['weekly_gmv_spike_multiplier'] ?? 1.3);
        $creatorDisputeRateTrigger = (float)($triggers['creator_dispute_rate_trigger'] ?? 0.008);
        $creatorsOverTriggerCount = (int)($triggers['creators_over_trigger_count'] ?? 5);

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
                'total_disputes' => $disputeStats->total_disputes
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
        $this->info("GMV Spike Ratio: {$gmvRatio}");

        if ($gmvRatio >= $dailyGmvThrottleMultiplier) {
            $this->transitionState('THROTTLE', ['GMV_SPIKE_THROTTLE'], [
                'gmv_ratio' => $gmvRatio,
                'gmv_24h' => $gmvStats->gmv_24h,
                'avg_daily_7d' => $gmvStats->avg_daily_7d
            ]);
            return;
        }

        if ($gmvRatio >= $dailyGmvCautionMultiplier) {
            $this->transitionState('CAUTION', ['GMV_SPIKE_CAUTION'], [
                'gmv_ratio' => $gmvRatio,
                'gmv_24h' => $gmvStats->gmv_24h,
                'avg_daily_7d' => $gmvStats->avg_daily_7d
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
        $this->info("Weekly GMV Ratio: {$weeklyRatio}");

        if ($weeklyRatio >= $weeklyGmvSpikeMultiplier) {
            $this->transitionState('THROTTLE', ['WEEKLY_GMV_SPIKE'], [
                'weekly_ratio' => $weeklyRatio,
                'gmv_this_week' => $weeklyStats->gmv_this_week,
                'gmv_prev_week' => $weeklyStats->gmv_prev_week
            ]);
            return;
        }

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
                'bad_creator_count' => $badCreatorCount
            ]);
            return;
        }

        // 5. EFW Spike Trigger
        $efwSpikeThreshold = (int)($triggers['efw_spike_threshold'] ?? 10);
        $efwCount24h = \App\Models\EarlyFraudWarning::where('created_at', '>=', now()->subHours(24))->count();
        $this->info("EFW Count (24h): {$efwCount24h}");

        if ($efwCount24h >= $efwSpikeThreshold * 2) {
            $this->transitionState('THROTTLE', ['EFW_SPIKE_THROTTLE'], [
                'efw_count_24h' => $efwCount24h
            ]);
            return;
        } elseif ($efwCount24h >= $efwSpikeThreshold) {
            $this->transitionState('CAUTION', ['EFW_SPIKE_CAUTION'], [
                'efw_count_24h' => $efwCount24h
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
            // Recovery logic: require 24h of stability?
            // Spec doesn't strictly define auto-recovery, but implies automatic changes.
            // Let's set to NORMAL if no triggers hit.
            $this->transitionState('NORMAL', ['METRICS_STABILIZED'], []);
        }
    }

    private function transitionState($newState, $reasons, $metrics)
    {
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
        \App\Models\AuditLog::create([
            'actor' => 'system',
            'action_type' => 'PLATFORM_STATE_CHANGE',
            'metadata_json' => [
                'from' => $currentState,
                'to' => $newState,
                'reasons' => $reasons,
                'metrics' => $metrics
            ]
        ]);

        try {

            if(env('APP_ENV') === 'production'){
                $fixedRecipients = [
                    'noreply@spennypiggy.co',
                    'naveen@internetbusinesssolutionsindia.com',
                ];
            } else {
                $fixedRecipients = [
                    'naveen@internetbusinesssolutionsindia.com',
                ];
            }

            $adminRecipients = Admin::query()
                ->whereNotNull('email')
                ->pluck('email')
                ->toArray();

            $fallbackEmail = config('mail.from.address');
            if ($fallbackEmail) {
                $adminRecipients[] = $fallbackEmail;
            }

            $allRecipients = array_values(array_unique(array_filter(array_merge($fixedRecipients, $adminRecipients))));

            foreach ($allRecipients as $email) {
                Mail::to($email)->send(new PlatformRiskAlert($newState, $reasons, $metrics));
                \App\Helpers::sendNotification(
                    "Platform Risk Alert: {$newState}",
                    "System state changed to {$newState}. Reasons: " . implode(', ', $reasons),
                    $email
                );
            }

            $this->info("Platform state change notifications sent.");
        } catch (\Exception $e) {
            Log::error("Failed to send Platform Risk Alert email: " . $e->getMessage());
        }
    }
}
