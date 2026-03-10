<?php

namespace App\Services\Risk;

use App\Models\CreatorMetric;
use App\Models\Payment;
use App\Models\Dispute;
use App\Models\User;
use App\Models\RiskSetting;
use App\Models\TaskPurchase;
use App\Models\MembershipPayment;
use App\Models\BillPayment;
use App\Models\ShopPayment;
use App\Models\TipGoalsPayment;
use App\Models\RiskIdentity;
use App\Models\IdentityRollup;
use App\Models\PlatformRiskState;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\DB;
use App\Helpers;
use App\Mail\RiskLevelChanged;

class RiskService
{
    protected $identityService;
    protected $limitsService;

    public function __construct(RiskIdentityService $identityService, EffectiveLimitsService $limitsService)
    {
        $this->identityService = $identityService;
        $this->limitsService = $limitsService;
    }

    /**
     * Evaluate a transaction request against risk rules.
     * MUST be called BEFORE creating a PaymentIntent.
     *
     * @param User $creator
     * @param int $amount (in cents)
     * @param string $ip
     * @param string $userAgent
     * @param string|null $email
     * @param string|null $cardFingerprint
     * @param string $paymentType (optional)
     * @param array $metadata (optional)
     * @return array ['decision' => 'ALLOW'|'STEP_UP'|'BLOCK'|'REVIEW', 'reason' => string, 'risk_identity_id' => string]
     */
    public function evaluate(User $creator, int $amount, string $ip, string $userAgent, ?string $email = null, ?string $cardFingerprint = null, string $paymentType = 'unknown', array $metadata = []): array
    {
        // 1. Resolve Identity
        $identity = $this->identityService->resolveIdentity([
            'ip' => $ip,
            'user_agent' => $userAgent, // Note: RiskIdentityService doesn't use UA yet but we pass it for future
            'email' => $email,
            'card_fingerprint' => $cardFingerprint,
            'is_guest' => auth()->guest()
        ]);

        // Helper to log and return
        $decide = function($decision, $reason) use ($identity, $creator, $amount, $ip, $userAgent, $email, $paymentType, $metadata) {
            if ($decision === 'BLOCK' || $decision === 'STEP_UP') {
                try {
                     \App\Models\BlockedPayment::logBlockedPayment([
                        'creator_id' => $creator->id,
                        'payer_id' => auth()->id(), 
                        'amount' => $amount / 100, // Convert cents to decimal
                        'currency' => $metadata['currency'] ?? 'USD',
                        'payment_type' => $paymentType,
                        'payment_method' => 'stripe',
                        'blocked_reason' => $reason,
                        'activity_data' => ['decision' => $decision, 'risk_identity_id' => $identity->id],
                        'payer_info' => ['email' => $email, 'ip' => $ip, 'ua' => $userAgent],
                        'payment_metadata' => $metadata,
                        'ip_address' => $ip,
                        'user_agent' => $userAgent
                     ]);
                } catch (\Exception $e) {
                     Log::error("Failed to log blocked payment: " . $e->getMessage());
                }
            }
            return ['decision' => $decision, 'reason' => $reason, 'risk_identity_id' => $identity->id];
        };

        // 2. Get Effective Limits
        $limits = $this->limitsService->getEffectiveLimits($identity);

        // 3. Check Platform State (Global Freeze)
        $platformState = PlatformRiskState::latest('started_at')->first();
        if ($platformState && $platformState->state === 'FREEZE') {
            return $decide('BLOCK', 'PLATFORM_FREEZE');
        }

        // 4. Check Identity Block
        if ($identity->is_blocked) {
            return $decide('BLOCK', 'IDENTITY_BLOCKED');
        }

        // 5. Check Velocity (Rule: > 3 payments in 10 mins -> STEP_UP)
        // We need to check the rollup.
        $rollup = $identity->rollup;
        if (!$rollup) {
            // Should exist as resolveIdentity creates it, but safety check
            $rollup = $identity->rollup()->create([]);
        }

        if ($rollup->payment_count_10m >= 3) {
            // 3 payments in 10m is the trigger for Step-Up (3DS)
            return $decide('STEP_UP', 'VELOCITY_HIGH');
        }

        // 6. Check Spend Limits (Global & Tiered)
        if ($rollup->spend_24h + $amount > $limits['max_spend_24h']) {
            return $decide('BLOCK', 'DAILY_LIMIT_EXCEEDED');
        }
        
        if ($rollup->spend_1h + $amount > $limits['max_spend_1h']) {
             return $decide('BLOCK', 'HOURLY_LIMIT_EXCEEDED');
        }

        // 7. Check Value (Rule: > $200 -> STEP_UP)
        if ($amount > 20000) { // $200.00
            return $decide('STEP_UP', 'HIGH_VALUE_TX');
        }

        // 8. New Creator Limits (Rule: < 30 days old -> $500/day cap)
        // This limit is on the CREATOR, not the buyer.
        if ($creator->created_at->diffInDays(now()) < 30) {
            // Check creator's total volume today
            $dailyVolume = Payment::where('creator_id', $creator->uuid) // Assuming UUID
                ->where('created_at', '>=', now()->subDay())
                ->whereIn('status', ['succeeded', 'step_up', 'review_hold'])
                ->sum('amount');
            
            if (($dailyVolume + $amount) > 50000) { // $500.00
                return $decide('BLOCK', 'NEW_CREATOR_LIMIT');
            }
        }

        // 9. Cooldown Check
        if ($identity->cooldown_until && $identity->cooldown_until->isFuture()) {
             return $decide('BLOCK', 'COOLDOWN_ACTIVE');
        }

        return $decide('ALLOW', 'OK');
    }

    /**
     * Log a payment attempt and update risk counters.
     * MUST be called AFTER PaymentIntent creation/confirmation.
     * 
     * @param string $paymentId (UUID from our payments table)
     * @param string $status (succeeded, failed, blocked, step_up)
     */
    public function logPayment(string $paymentId, string $status)
    {
        $payment = Payment::find($paymentId);
        if (!$payment) return;

        $identity = $payment->riskIdentity;
        if (!$identity) return;
        
        $rollup = $identity->rollup;

        // Update Payment Status if changed
        if ($payment->status !== $status) {
            $payment->status = $status;
            $payment->save();
        }

        // Update Rollups
        // We increment counters regardless of success? 
        // Spec says: "Velocity checks count attempts (initiated)?" 
        // Usually, velocity counts attempts to stop brute force.
        // Spend counts successful amounts.
        
        if ($status === 'initiated') {
            $rollup->increment('payment_count_10m');
        }
        
        if (in_array($status, ['succeeded', 'step_up', 'review_hold'])) {
            $rollup->increment('spend_10m', $payment->amount);
            $rollup->increment('spend_1h', $payment->amount);
            $rollup->increment('spend_2h', $payment->amount);
            $rollup->increment('spend_24h', $payment->amount);
            $rollup->increment('spend_48h', $payment->amount);
            $rollup->increment('spend_7d', $payment->amount);
            
            // Check unique creators paid
            // This is expensive to calculate every time, maybe do it async or simple query
            // $creatorsPaid24h = Payment::where('risk_identity_id', $identity->id)...
            // For now, let's keep it simple.
        }
    }

    /**
     * Recalculate metrics for a creator based on last 30 days of activity.
     * Then evaluate risk rules.
     *
     * @param User|string $creatorOrId
     * @return CreatorMetric
     */
    public function recalculateMetrics($creatorOrId)
    {
        // 1. Resolve Creator UUID and User Object
        $creatorId = ($creatorOrId instanceof User) ? $creatorOrId->uuid : $creatorOrId;
        $user = null;

        if (is_numeric($creatorId)) {
            $user = User::find($creatorId);
            if ($user) {
                $creatorId = $user->uuid;
            }
        } else {
            $user = User::where('uuid', $creatorId)->first();
        }

        // 2. Find or Create Metric Record (UUID)
        $metric = CreatorMetric::firstOrCreate(['creator_id' => $creatorId]);
        
        // 3. Prepare Query Scopes
        $thirtyDaysAgo = now()->subDays(30);
        $creatorIds = [$creatorId];
        if ($user) {
            $creatorIds[] = (string)$user->id;
        }

        // 4. Calculate Risk Engine Transactions (Check both UUID and ID)
        $txCount = Payment::whereIn('creator_id', $creatorIds)
            ->where('created_at', '>=', $thirtyDaysAgo)
            ->count();

        // 5. Calculate Legacy Transactions (if user exists)
        $legacyCount = 0;
        if ($user) {
            $taskCount = TaskPurchase::where('creator_id', $user->id)
                ->where('created_at', '>=', $thirtyDaysAgo)->count();
                
            $membershipCount = MembershipPayment::whereHas('membership', function($q) use ($user) {
                    $q->where('user_id', $user->id);
                })->where('created_at', '>=', $thirtyDaysAgo)->count();
                
            $billCount = BillPayment::whereHas('bill', function($q) use ($user) {
                    $q->where('user_id', $user->id);
                })->where('created_at', '>=', $thirtyDaysAgo)->count();
                
            $shopCount = ShopPayment::whereHas('shop', function($q) use ($user) {
                    $q->where('user_id', $user->id);
                })->where('created_at', '>=', $thirtyDaysAgo)->count();
                
            $tipCount = TipGoalsPayment::whereHas('tipGoal', function($q) use ($user) {
                    $q->where('user_id', $user->id);
                })->where('created_at', '>=', $thirtyDaysAgo)->count();
            
            $legacyCount = $taskCount + $membershipCount + $billCount + $shopCount + $tipCount;
        }

        // 6. Merge Transaction Counts (Use MAX to ensure coverage)
        if ($txCount < 5) {
             $txCount = max($txCount, $legacyCount); 
        }
        
        // 7. Calculate Disputes
        $disputeCount = 0;
        if ($user) {
            $disputeCount = Dispute::where('creator_id', $user->id)
                ->where('created_at', '>=', $thirtyDaysAgo)
                ->count();
        } else {
             $disputeCount = Payment::whereIn('creator_id', $creatorIds)
                ->where('status', 'disputed')
                ->where('created_at', '>=', $thirtyDaysAgo)
                ->count();
        }

        // 8. Calculate Refunds
        $refundCount = Payment::whereIn('creator_id', $creatorIds)
            ->where('status', 'refunded')
            ->where('created_at', '>=', $thirtyDaysAgo)
            ->count();

        // 9. Update Metric Stats
        $disputeRate = ($txCount > 0) ? ($disputeCount / $txCount) : 0;
        $refundRate = ($txCount > 0) ? ($refundCount / $txCount) : 0;
        
        $metric->tx_30d = $txCount;
        $metric->disputes_30d = $disputeCount;
        $metric->refunds_30d = $refundCount;
        $metric->dispute_rate_30d = $disputeRate;
        $metric->refund_rate_30d = $refundRate;
        $metric->save();

        // 10. Evaluate Risk (Updates risk level and saves)
        $this->evaluateRisk($metric);

        // 11. SYNC: If integer record exists (legacy), update it too
        if ($user && $user->id) {
             $intMetric = CreatorMetric::where('creator_id', (string)$user->id)->first();
             if ($intMetric && $intMetric->id !== $metric->id) {
                 $intMetric->fill([
                    'tx_30d' => $metric->tx_30d,
                    'disputes_30d' => $metric->disputes_30d,
                    'refunds_30d' => $metric->refunds_30d,
                    'dispute_rate_30d' => $metric->dispute_rate_30d,
                    'refund_rate_30d' => $metric->refund_rate_30d,
                    'reserve_percent' => $metric->reserve_percent,
                    'payout_delay_days' => $metric->payout_delay_days,
                    'risk_level' => $metric->risk_level,
                 ]);
                 $intMetric->save();
                 Log::info("Synced Integer Metric Record", ['id' => $user->id]);
             }
        }
        
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
        // Skip evaluation if manually overridden by admin
        if ($metric->is_overridden) {
            return;
        }

        $oldRiskLevel = $metric->risk_level;
        
        // Fetch Settings (with defaults)
        $thresholds = RiskSetting::get('risk_thresholds');
        if (!$thresholds) {
            $thresholds = [
                'high_dispute_rate' => 0.01,
                'medium_dispute_rate' => 0.005,
                'high_refund_rate' => 0.05,
                'min_tx_count' => 1 // Lowered from 10 to ensure immediate risk profiling
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
