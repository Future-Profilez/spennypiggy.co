<?php

namespace App\Services\Risk;

use App\Models\AuditLog;
use App\Models\Payment;
use App\Models\RiskIdentity;
use Carbon\Carbon;
use Illuminate\Support\Facades\Log;

class RiskEngineService
{
    protected $identityService;
    protected $rollupService;
    protected $limitsService;

    public function __construct(
        RiskIdentityService $identityService,
        IdentityRollupService $rollupService,
        EffectiveLimitsService $limitsService
    ) {
        $this->identityService = $identityService;
        $this->rollupService = $rollupService;
        $this->limitsService = $limitsService;
    }

    /**
     * Evaluate risk for a payment attempt.
     * 
     * @param array $context [email, ip, device_id, card_fingerprint, amount, currency, creator_id]
     * @return array [decision, reason_codes, limits, ui]
     */
    public function evaluate(array $context): array
    {
        // --- KILL SWITCH CHECK ---
        // If RISK_ENGINE_ENABLED is false in .env, bypass all checks and ALLOW.
        if (config('services.risk_engine.enabled', true) === false) {
            Log::info("Risk Engine Bypassed (Kill Switch Active)");
            return $this->formatResponse(
                'ALLOW', 
                ['RISK_ENGINE_DISABLED'], 
                $this->limitsService->getEffectiveLimits(new RiskIdentity()), // Default limits
                []
            );
        }

        // 1. Resolve Identity
        $identity = $this->identityService->resolveIdentity($context);
        
        // 2. Refresh Rollups (to have latest counters)
        $rollup = $this->rollupService->refreshRollups($identity);

        // 3. Get Effective Limits
        $limits = $this->limitsService->getEffectiveLimits($identity);
        
        $amount = $context['amount'] ?? 0;
        $creatorId = $context['creator_id'] ?? null;
        
        $decision = 'ALLOW';
        $reasons = [];
        $ui = [];

        // --- RULE 0: COOLDOWN CHECK ---
        if ($identity->cooldown_until && Carbon::now()->lessThan($identity->cooldown_until)) {
            $decision = 'COOLDOWN';
            $reasons[] = 'COOLDOWN_ACTIVE';
            $ui = [
                'key' => 'COOLDOWN_ACTIVE',
                'title' => 'Please Wait',
                'body' => 'You are paying too fast. Please wait ' . $limits['cooldown_minutes'] . ' minutes and try again.',
            ];
            
            $this->logDecision($identity, $context, $decision, $reasons);
            return $this->formatResponse($decision, $reasons, $limits, $ui);
        }

        // --- RULE 1: GUEST BLOCK (THROTTLE/FREEZE) ---
        if (!$limits['guest_allowed'] && $identity->is_guest) {
            $decision = 'BLOCK';
            $reasons[] = 'GUEST_BLOCKED_IN_STATE';
             $ui = [
                'key' => 'THROTTLE_LIMITS_ACTIVE',
                'title' => 'Safety Limits Active',
                'body' => 'Guest payments are temporarily disabled. Please log in.',
            ];
            $this->logDecision($identity, $context, $decision, $reasons);
            return $this->formatResponse($decision, $reasons, $limits, $ui);
        }

        // --- RULE 2: SPEND LIMITS (1H, 24H, 7D) ---
        // Check 1 Hour Limit
        if (($rollup->spend_1h + $amount) > $limits['max_spend_1h']) {
            $decision = 'BLOCK';
            $reasons[] = 'LIMIT_EXCEEDED_1H';
            $ui = [
                'key' => 'LIMIT_EXCEEDED',
                'title' => 'Hourly Limit Reached',
                'body' => 'You have reached your hourly spending limit. Please try again later.',
            ];
            $this->logDecision($identity, $context, $decision, $reasons);
            return $this->formatResponse($decision, $reasons, $limits, $ui);
        }

        // Check 24 Hour Limit
        if (($rollup->spend_24h + $amount) > $limits['max_spend_24h']) {
            $decision = 'BLOCK';
            $reasons[] = 'LIMIT_EXCEEDED_24H';
            $ui = [
                'key' => 'LIMIT_EXCEEDED',
                'title' => 'Daily Limit Reached',
                'body' => 'You have reached your daily spending limit. Please try again tomorrow.',
            ];
            $this->logDecision($identity, $context, $decision, $reasons);
            return $this->formatResponse($decision, $reasons, $limits, $ui);
        }

        // Check 7 Day Limit
        if (($rollup->spend_7d + $amount) > $limits['max_spend_7d']) {
            $decision = 'BLOCK';
            $reasons[] = 'LIMIT_EXCEEDED_7D';
            $ui = [
                'key' => 'LIMIT_EXCEEDED',
                'title' => 'Weekly Limit Reached',
                'body' => 'You have reached your weekly spending limit.',
            ];
            $this->logDecision($identity, $context, $decision, $reasons);
            return $this->formatResponse($decision, $reasons, $limits, $ui);
        }

        // --- RULE 3: SINGLE TRANSACTION LIMIT (> $200 -> STEP_UP) ---
        if ($amount > 20000) { // $200.00
            if ($decision !== 'BLOCK' && $decision !== 'COOLDOWN') {
                $decision = 'STEP_UP';
                $reasons[] = 'HIGH_VALUE_TX';
                $reasons[] = 'FORCE_3DS';
                $ui = [
                    'key' => 'STEP_UP_REQUIRED',
                    'title' => 'Confirm Your Payment',
                    'body' => 'For your security, please confirm this payment.',
                ];
            }
        }

        // --- RULE 4: NEW CREATOR ACCOUNT PROTECTION (< 30 Days Old -> Max $500/day) ---
        if ($creatorId) {
            $creator = \App\Models\User::where('uuid', $creatorId)->first();
            if ($creator && $creator->created_at->diffInDays(now()) < 30) {
                 // Calculate creator's total volume today (all payers)
                 // This query might be heavy if not indexed on creator_id + created_at
                 $dailyVolume = Payment::where('creator_id', $creatorId)
                     ->where('created_at', '>=', now()->subDay())
                     ->whereIn('status', ['succeeded', 'step_up', 'review_hold'])
                     ->sum('amount');
                 
                 if (($dailyVolume + $amount) > 50000) { // $500.00
                     $decision = 'BLOCK';
                     $reasons[] = 'NEW_CREATOR_VOLUME_LIMIT';
                     $ui = [
                        'key' => 'CREATOR_LIMIT_REACHED',
                        'title' => 'Creator Limit Reached',
                        'body' => 'This creator has reached their daily processing limit. Please try again tomorrow.',
                    ];
                    $this->logDecision($identity, $context, $decision, $reasons);
                    return $this->formatResponse($decision, $reasons, $limits, $ui);
                 }
            }
        }
        
        // --- RULE 6: 3 PAYMENTS IN 10 MIN -> STEP_UP ---
        // --- RULE 7: 5 PAYMENTS IN 10 MIN -> COOLDOWN ---
        if ($rollup->payment_count_10m >= 5) {
            $decision = 'COOLDOWN';
            $reasons[] = 'VELOCITY_5_IN_10M';
            $ui = [
                'key' => 'COOLDOWN_ACTIVE',
                'title' => 'Please Wait',
                'body' => 'You are paying too fast. Please wait ' . $limits['cooldown_minutes'] . ' minutes and try again.',
            ];
            $this->logDecision($identity, $context, $decision, $reasons);
            // Trigger cooldown on identity
            $identity->update(['cooldown_until' => Carbon::now()->addMinutes($limits['cooldown_minutes'])]);
            return $this->formatResponse($decision, $reasons, $limits, $ui);
        }

        if ($rollup->payment_count_10m >= 3) {
            $decision = 'STEP_UP';
            $reasons[] = 'ACCELERATION_3_IN_10M';
            $ui = [
                'key' => 'STEP_UP_REQUIRED',
                'title' => 'Confirm Your Payment',
                'body' => 'For your security, please confirm this payment.',
            ];
            // Step-up doesn't block immediately, but requires action.
            // We return decision. Controller handles logic.
        }

        // --- RULE 7: CONTINUED RAPID PAYMENTS AFTER STEP_UP -> COOLDOWN ---
        // If already stepped up recently (check confirmation logs or payment status?)
        // Spec: "If identity triggered STEP_UP within last 15 minutes AND continues to attempt new payments rapidly."
        // Or "if payment_count_10m continues above threshold after step-up".
        // Simplified: If count > 5 (really fast) -> COOLDOWN.
        if ($rollup->payment_count_10m > 5) { // Threshold for cooldown
             $decision = 'COOLDOWN';
             $reasons[] = 'COOLDOWN_AFTER_STEP_UP';
             
             // Set Cooldown
             $identity->update(['cooldown_until' => Carbon::now()->addMinutes($limits['cooldown_minutes'])]);
             
             $ui = [
                'key' => 'COOLDOWN_ACTIVE',
                'title' => 'Please Wait',
                'body' => 'You are paying too fast. Please wait ' . $limits['cooldown_minutes'] . ' minutes.',
            ];
            
            $this->logDecision($identity, $context, $decision, $reasons);
            return $this->formatResponse($decision, $reasons, $limits, $ui);
        }

        // --- RULE 9: NEW CREATOR LIMIT (1/DAY) ---
        // Check if creator is new
        $isNewCreator = $this->isNewCreator($identity, $creatorId);
        
        if ($isNewCreator) {
             // Check if we already paid 1 new creator in 24h
             // rollup->new_creators_24h tracks distinct new creators paid.
             if ($rollup->new_creators_24h >= $limits['max_new_creators_24h']) {
                 $decision = 'BLOCK';
                 $reasons[] = 'NEW_CREATOR_LIMIT';
                 $ui = [
                    'key' => 'NEW_CREATOR_LIMIT',
                    'title' => 'Limit Reached',
                    'body' => 'You can support ' . $limits['max_new_creators_24h'] . ' new creator per day for safety.',
                ];
                $this->logDecision($identity, $context, $decision, $reasons);
                return $this->formatResponse($decision, $reasons, $limits, $ui);
             }
        }
        
        // --- RULE 10: CROSS-CREATOR SPEND > 5K IN 48H -> RESTRICT NEW ---
        // If spend_48h > 500000 AND creators_paid_48h >= 2
        if ($rollup->spend_48h > 500000 && $rollup->creators_paid_48h >= 2) {
            // Trigger restriction if not already set
            if (!$identity->new_creator_restrict_until || Carbon::now()->greaterThan($identity->new_creator_restrict_until)) {
                 $identity->update(['new_creator_restrict_until' => Carbon::now()->addHours(24)]); // Default 24h
                 // Log trigger
                 AuditLog::create([
                     'actor' => 'system',
                     'action_type' => 'RESTRICT_NEW_CREATORS',
                     'reference_id' => $identity->id,
                     'metadata_json' => ['reason' => 'CROSS_CREATOR_SPEND_LIMIT'],
                 ]);
            }
        }
        
        // Enforce Restriction
        if ($identity->new_creator_restrict_until && Carbon::now()->lessThan($identity->new_creator_restrict_until)) {
            if ($isNewCreator) {
                $decision = 'BLOCK';
                $reasons[] = 'NEW_CREATOR_RESTRICTED';
                $ui = [
                    'key' => 'NEW_CREATOR_RESTRICTED',
                    'title' => 'Safety Limit',
                    'body' => 'New creator payments are temporarily limited. You can still pay creators you already supported.',
                ];
                $this->logDecision($identity, $context, $decision, $reasons);
                return $this->formatResponse($decision, $reasons, $limits, $ui);
            }
        }

        // --- RULE 8: HIGH VELOCITY SPEND (2H > 7500) ---
        if ($rollup->spend_2h >= 750000) {
            // Force 3DS + STEP UP
            if ($decision !== 'BLOCK' && $decision !== 'COOLDOWN') {
                $decision = 'STEP_UP';
                $reasons[] = 'HIGH_VALUE_VELOCITY_2H';
                
                // If repeated, mark for REVIEW_HOLD but still require STEP_UP first
                if ($rollup->spend_2h > 1500000) { // Double threshold
                    $reasons[] = 'MARK_REVIEW_HOLD';
                }
                
                // Add 3DS requirement flag
                $reasons[] = 'FORCE_3DS';
                
                $ui = [
                    'key' => 'STEP_UP_REQUIRED',
                    'title' => 'Confirm Your Payment',
                    'body' => 'For your security, please confirm this payment.',
                ];
            }
        }

        // Log final decision
        $this->logDecision($identity, $context, $decision, $reasons);

        return $this->formatResponse($decision, $reasons, $limits, $ui);
    }

    private function isNewCreator(RiskIdentity $identity, $creatorId)
    {
        // Check if any *succeeded* payment exists for this creator prior to today?
        // Or just ever.
        // "New" usually means "never paid before".
        return !Payment::where('risk_identity_id', $identity->id)
            ->where('creator_id', $creatorId)
            ->where('status', 'succeeded')
            ->exists();
    }

    private function logDecision($identity, $context, $decision, $reasons)
    {
        AuditLog::create([
            'actor' => 'system',
            'action_type' => 'RISK_DECISION',
            'reference_id' => $identity->id,
            'metadata_json' => [
                'decision' => $decision,
                'reasons' => $reasons,
                'amount' => $context['amount'] ?? 0,
                'creator_id' => $context['creator_id'] ?? null,
            ]
        ]);
    }
    
    private function formatResponse($decision, $reasons, $limits, $ui)
    {
        return [
            'decision' => $decision,
            'reason_codes' => $reasons,
            'limits' => $limits,
            'ui' => $ui,
        ];
    }
}
