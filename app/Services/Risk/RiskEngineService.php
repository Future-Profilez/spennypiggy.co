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
        
        // --- RULE 6: 3 PAYMENTS IN 10 MIN -> STEP_UP ---
        // payment_count_10m includes current attempt? No, rollups are past.
        // If current count is >= 2, this 3rd one triggers.
        // Spec: "If payment_count_10m >= 3 -> trigger STEP_UP".
        // If rollup says 2, and we are attempting 3rd... usually logic is "if (count + 1) >= limit".
        // Let's use strict spec: if payment_count_10m >= 3.
        // Wait, if rollup is *past* payments, and we are attempting now.
        // If user made 3 payments already, next one is 4th.
        // If limit is "3 payments in 10m -> STEP_UP", it usually means "velocity check".
        // Let's assume if count >= 3, we step up.
        if ($rollup->payment_count_10m >= 3) {
            $decision = 'STEP_UP';
            $reasons[] = 'ACCELERATION_3_IN_10M';
             $ui = [
                'key' => 'STEP_UP_REQUIRED',
                'title' => 'Confirm Your Payment',
                'body' => 'For your security, please confirm this payment.',
            ];
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
                $decision = 'STEP_UP'; // Or REVIEW_HOLD if very high?
                $reasons[] = 'HIGH_VALUE_VELOCITY_2H';
                
                // If repeated, maybe REVIEW_HOLD
                if ($rollup->spend_2h > 1500000) { // Double threshold
                    $decision = 'REVIEW_HOLD'; // But requires STEP_UP first?
                    // Usually REVIEW_HOLD is a status applied to a SUCCESSFUL payment.
                    // Here we are deciding "ALLOW" vs "BLOCK".
                    // If we return "REVIEW_HOLD", the payment proceeds but is marked for review.
                    // But we likely still want STEP_UP verification for high value.
                    // So we can return "STEP_UP" and add a flag "mark_review_hold" in reasons/metadata.
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
