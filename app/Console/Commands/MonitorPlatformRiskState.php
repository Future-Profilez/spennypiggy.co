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
                AND created_at >= NOW() - INTERVAL '30 days'
            ),
            dp AS (
                SELECT COUNT(*) AS total_disputes
                FROM disputes
                WHERE created_at >= NOW() - INTERVAL '30 days'
            )
            SELECT 
                tx.total_tx, 
                dp.total_disputes,
                (dp.total_disputes::decimal / NULLIF(tx.total_tx, 0)) * 100 AS dispute_rate_pct
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
                AND created_at >= NOW() - INTERVAL '24 hours'
            ),
            avg_7d AS (
                SELECT COALESCE(SUM(amount),0)/7 AS avg_daily_7d
                FROM payments
                WHERE status='succeeded'
                AND created_at >= NOW() - INTERVAL '7 days'
            )
            SELECT 
                last_24h.gmv_24h, 
                avg_7d.avg_daily_7d,
                CASE WHEN avg_7d.avg_daily_7d = 0 THEN 0 
                ELSE last_24h.gmv_24h::decimal / avg_7d.avg_daily_7d END AS ratio
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
                AND created_at >= NOW() - INTERVAL '7 days'
            ),
            prev_week AS (
                SELECT COALESCE(SUM(amount),0) AS gmv
                FROM payments
                WHERE status='succeeded'
                AND created_at >= NOW() - INTERVAL '14 days'
                AND created_at < NOW() - INTERVAL '7 days'
            )
            SELECT 
                this_week.gmv AS gmv_this_week, 
                prev_week.gmv AS gmv_prev_week,
                CASE WHEN prev_week.gmv = 0 THEN 0 
                ELSE this_week.gmv::decimal / prev_week.gmv END AS ratio
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
                WHERE created_at >= NOW() - INTERVAL '7 days'
                AND status IN ('succeeded','review_hold','refunded','disputed')
                GROUP BY creator_id
            ),
            creator_dp AS (
                SELECT creator_id, COUNT(*) AS disputes
                FROM disputes
                WHERE created_at >= NOW() - INTERVAL '7 days'
                GROUP BY creator_id
            ),
            rates AS (
                SELECT 
                    t.creator_id,
                    (COALESCE(d.disputes,0)::decimal / NULLIF(t.tx,0)) * 100 AS dispute_rate_pct
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

        // Notify Admins
        if ($newState === 'FREEZE' || $newState === 'THROTTLE') {
            try {
                $admins = Admin::all(); // Assuming Admin model exists and has email
                if ($admins->isEmpty()) {
                    // Fallback to config email or hardcoded if no admins in DB
                    $fallbackEmail = config('mail.from.address');
                    if ($fallbackEmail) {
                        Mail::to($fallbackEmail)->send(new PlatformRiskAlert($newState, $reasons, $metrics));
                        \App\Helpers::sendNotification(
                            "Platform Risk Alert: {$newState}", 
                            "System state changed to {$newState}. Reasons: " . implode(', ', $reasons), 
                            $fallbackEmail
                        );
                    }
                } else {
                    foreach ($admins as $admin) {
                        if ($admin->email) {
                            Mail::to($admin->email)->send(new PlatformRiskAlert($newState, $reasons, $metrics));
                            \App\Helpers::sendNotification(
                                "Platform Risk Alert: {$newState}", 
                                "System state changed to {$newState}. Reasons: " . implode(', ', $reasons), 
                                $admin->email
                            );
                        }
                    }
                }
                $this->info("Admin notifications sent.");
            } catch (\Exception $e) {
                Log::error("Failed to send Platform Risk Alert email: " . $e->getMessage());
            }
        }
    }
}
