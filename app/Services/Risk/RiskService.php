<?php

namespace App\Services\Risk;

use App\Models\CreatorMetric;
use App\Models\Payment;
use App\Models\User;
use App\Models\RiskSetting;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use App\Helpers; // Assuming we use Helpers::sendNotification
use App\Mail\RiskLevelChanged;

class RiskService
{
    /**
     * Recalculate metrics for a creator based on last 30 days of activity.
     * Then evaluate risk rules.
     *
     * @param User|string $creatorOrId
     * @return CreatorMetric
     */
    public function recalculateMetrics($creatorOrId)
    {
        $creatorId = ($creatorOrId instanceof User) ? $creatorOrId->uuid : $creatorOrId;
        
        // Find or create metric record
        $metric = CreatorMetric::firstOrCreate(['creator_id' => $creatorId]);
        
        // Calculate counts for last 30 days
        $thirtyDaysAgo = now()->subDays(30);
        
        $txCount = Payment::where('creator_id', $creatorId)
            ->where('created_at', '>=', $thirtyDaysAgo)
            ->count();
            
        $disputeCount = Payment::where('creator_id', $creatorId)
            ->where('status', 'disputed') // Status is 'disputed'
            ->where('created_at', '>=', $thirtyDaysAgo)
            ->count();
            
        $refundCount = Payment::where('creator_id', $creatorId)
            ->where('status', 'refunded')
            ->where('created_at', '>=', $thirtyDaysAgo)
            ->count();
            
        // Calculate rates
        $disputeRate = ($txCount > 0) ? ($disputeCount / $txCount) : 0;
        $refundRate = ($txCount > 0) ? ($refundCount / $txCount) : 0;
        
        // Update metric
        $metric->tx_30d = $txCount;
        $metric->disputes_30d = $disputeCount;
        $metric->refunds_30d = $refundCount;
        $metric->dispute_rate_30d = $disputeRate; // stored as decimal (e.g. 0.015)
        $metric->refund_rate_30d = $refundRate;
        $metric->save();
        
        // Evaluate Risk Rules
        $this->evaluateRisk($metric);
        
        return $metric;
    }

    /**
     * Evaluate risk rules based on current metrics.
     * Updates risk_level, reserve_percent, payout_delay_days.
     *
     * @param CreatorMetric $metric
     */
    public function evaluateRisk(CreatorMetric $metric)
    {
        $oldRiskLevel = $metric->risk_level;
        
        // Fetch Settings (with defaults)
        $thresholds = RiskSetting::get('risk_thresholds');
        if (!$thresholds) {
            $thresholds = [
                'high_dispute_rate' => 0.01,
                'medium_dispute_rate' => 0.005,
                'high_refund_rate' => 0.05,
                'min_tx_count' => 10
            ];
        }

        $consequences = RiskSetting::get('risk_consequences');
        if (!$consequences) {
            $consequences = [
                'high_reserve_percent' => 25,
                'high_payout_delay' => 14,
                'medium_reserve_percent' => 10,
                'medium_payout_delay' => 7,
                'low_reserve_percent' => 0,
                'low_payout_delay' => 7
            ];
        }

        $newRiskLevel = 'low';
        $newReservePercent = $consequences['low_reserve_percent'];
        $newPayoutDelay = $consequences['low_payout_delay'];
        
        // --- RULE 1: High Dispute Rate ---
        if ($metric->dispute_rate_30d > $thresholds['high_dispute_rate'] && $metric->tx_30d >= $thresholds['min_tx_count']) {
            $newRiskLevel = 'high';
            $newReservePercent = $consequences['high_reserve_percent'];
            $newPayoutDelay = $consequences['high_payout_delay'];
        }
        // --- RULE 2: High Refund Rate ---
        elseif ($metric->refund_rate_30d > $thresholds['high_refund_rate'] && $metric->tx_30d >= $thresholds['min_tx_count']) {
            $newRiskLevel = 'medium';
            $newReservePercent = $consequences['medium_reserve_percent'];
            $newPayoutDelay = $consequences['medium_payout_delay'];
        }
        // --- RULE 3: Medium Dispute Rate ---
        elseif ($metric->dispute_rate_30d > $thresholds['medium_dispute_rate'] && $metric->tx_30d >= $thresholds['min_tx_count']) {
            $newRiskLevel = 'medium';
            $newReservePercent = $consequences['medium_reserve_percent'];
            $newPayoutDelay = $consequences['medium_payout_delay'];
        }
        
        // Check if status changed
        if ($newRiskLevel !== $oldRiskLevel) {
            Log::info("Risk Level Changed for Creator {$metric->creator_id}: {$oldRiskLevel} -> {$newRiskLevel}");
            
            $metric->risk_level = $newRiskLevel;
            $metric->reserve_percent = $newReservePercent;
            $metric->payout_delay_days = $newPayoutDelay;
            $metric->save();
            
            // Notify Creator
            $this->notifyCreatorOfRiskChange($metric->creator_id, $newRiskLevel, $newReservePercent);
        } else {
            // Even if level didn't change, values might need updating if config changed
            $metric->reserve_percent = $newReservePercent;
            $metric->payout_delay_days = $newPayoutDelay;
            $metric->save();
        }
    }
    
    /**
     * Notify the creator about the risk level change.
     */
    protected function notifyCreatorOfRiskChange($creatorId, $level, $reserve)
    {
        try {
            $user = User::where('uuid', $creatorId)->first();
            if (!$user) return;
            
            $title = "Account Status Update ⚠️";
            $message = "";
            
            if ($level === 'high') {
                $message = "Due to recent activity (high dispute rate), your account is now under High Risk monitoring. A {$reserve}% rolling reserve has been applied to new payments.";
            } elseif ($level === 'medium') {
                $message = "Your account risk level has been updated to Medium. A {$reserve}% rolling reserve has been applied.";
            } else {
                $title = "Account Status Update ✅";
                $message = "Great news! Your account risk level has returned to Low. Standard payout schedules apply.";
            }
            
            // Send Push/In-App
            Helpers::sendNotification($title, $message, $user->email);
            
            // Send Email
            try {
                // We need to pass the metric to the Mailable.
                // Since we are inside notifyCreatorOfRiskChange, we don't have $metric directly,
                // but we can fetch it or pass it. Let's modify the signature or fetch it.
                // Fetching it is safer as it's just one query.
                $metric = CreatorMetric::where('creator_id', $creatorId)->first();
                if ($metric) {
                    Mail::to($user->email)->send(new RiskLevelChanged($metric, $user, $message));
                    Log::info("Risk Change Email sent to {$user->email}");
                }
            } catch (\Exception $e) {
                Log::error("Failed to send Risk Change Email: " . $e->getMessage());
            }
            
        } catch (\Exception $e) {
            Log::error("Failed to notify creator of risk change: " . $e->getMessage());
        }
    }
}
