<?php

namespace App\Services\Risk;

use App\Models\PlatformRiskState;
use App\Models\RiskIdentity;
use App\Models\RiskSetting;

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

        // 2. Fetch Limits from Database Settings
        // Fallback to hardcoded defaults if DB settings missing
        $dbLimits = RiskSetting::get('global_limits');
        
        // Define Limits per State
        // Logic: NORMAL uses DB settings. Other states are reductions of NORMAL.
        
        $normalLimits = [
            'max_spend_1h' => $dbLimits['max_spend_1h'] ?? 100000,   // £1000.00
            'max_spend_24h' => $dbLimits['max_spend_24h'] ?? 500000, // £5000.00
            'max_spend_7d' => $dbLimits['max_spend_7d'] ?? 1000000,  // £10000.00
            'max_new_creators_24h' => $dbLimits['max_creators_per_day'] ?? 1,
            'step_up_threshold' => 50000, // £500
            'cooldown_minutes' => 15,
            'review_hold_threshold' => 100000, // £1000
            'guest_allowed' => $dbLimits['guest_allowed'] ?? true,
        ];

        $limits = [
            'NORMAL' => $normalLimits,
            'CAUTION' => [
                'max_spend_1h' => 50000, // £500
                'max_spend_24h' => 250000, // £2,500
                'max_spend_7d' => 500000,
                'max_new_creators_24h' => 1,
                'step_up_threshold' => 25000, // Lower threshold for Step-Up
                'cooldown_minutes' => 15,
                'review_hold_threshold' => 150000,
                'guest_allowed' => true,
            ],
            'THROTTLE' => [
                'max_spend_1h' => 25000,
                'max_spend_24h' => 150000, // £1,500
                'max_spend_7d' => 300000,
                'max_new_creators_24h' => 0,
                'step_up_threshold' => 0, // Always step up
                'cooldown_minutes' => 60,
                'review_hold_threshold' => 50000,
                'guest_allowed' => false,
            ],
            'FREEZE' => [
                'max_spend_1h' => 0,
                'max_spend_24h' => 0,
                'max_spend_7d' => 0,
                'max_new_creators_24h' => 0,
                'step_up_threshold' => 0,
                'cooldown_minutes' => 1440, // 24 hours
                'review_hold_threshold' => 0,
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
