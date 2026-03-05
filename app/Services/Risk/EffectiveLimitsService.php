<?php

namespace App\Services\Risk;

use App\Models\PlatformRiskState;
use App\Models\RiskIdentity;

class EffectiveLimitsService
{
    /**
     * Get effective limits based on current platform state and identity profile.
     * This is the single source of truth for all limits.
     */
    public function getEffectiveLimits(RiskIdentity $identity): array
    {
        // 1. Get Platform State
        $stateRecord = PlatformRiskState::latest('started_at')->first();
        $state = $stateRecord ? $stateRecord->state : 'NORMAL';

        // 2. Define Limits per State
        // These could be in config or DB, but for now hardcoded as per spec logic.
        
        $limits = [
            'NORMAL' => [
                'max_spend_1h' => 200000, // pence
                'max_spend_24h' => 500000,
                'max_spend_7d' => 1000000,
                'max_new_creators_24h' => 1,
                'step_up_threshold' => 150000,
                'cooldown_minutes' => 15,
                'review_hold_threshold' => 250000,
                'guest_allowed' => true,
            ],
            'CAUTION' => [
                'max_spend_1h' => 100000,
                'max_spend_24h' => 250000,
                'max_spend_7d' => 500000,
                'max_new_creators_24h' => 1,
                'step_up_threshold' => 50000,
                'cooldown_minutes' => 15,
                'review_hold_threshold' => 150000,
                'guest_allowed' => true,
            ],
            'THROTTLE' => [
                'max_spend_1h' => 75000,
                'max_spend_24h' => 150000,
                'max_spend_7d' => 300000,
                'max_new_creators_24h' => 1,
                'step_up_threshold' => 25000,
                'cooldown_minutes' => 30,
                'review_hold_threshold' => 100000,
                'guest_allowed' => false,
            ],
            'FREEZE' => [
                'max_spend_1h' => 50000,
                'max_spend_24h' => 100000,
                'max_spend_7d' => 200000,
                'max_new_creators_24h' => 1, // Usually strictly blocked or very limited
                'step_up_threshold' => 25000,
                'cooldown_minutes' => 30,
                'review_hold_threshold' => 75000,
                'guest_allowed' => false,
            ],
        ];

        $currentLimits = $limits[$state] ?? $limits['NORMAL'];

        // 3. Apply Trust Tier Multipliers (Optional)
        // If identity has higher trust tier, maybe relax limits?
        if ($identity->trust_tier > 0) {
            // Example: Tier 1 gets 2x limits
            $multiplier = $identity->trust_tier == 1 ? 1.5 : ($identity->trust_tier == 2 ? 2.0 : 1.0);
            
            $currentLimits['max_spend_1h'] = (int)($currentLimits['max_spend_1h'] * $multiplier);
            $currentLimits['max_spend_24h'] = (int)($currentLimits['max_spend_24h'] * $multiplier);
            $currentLimits['max_spend_7d'] = (int)($currentLimits['max_spend_7d'] * $multiplier);
            // Review hold threshold might stay same or increase? Usually stays same for safety.
        }

        return $currentLimits;
    }
}
