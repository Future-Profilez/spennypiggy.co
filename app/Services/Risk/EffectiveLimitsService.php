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
        // We now rely purely on state_limits as configured in the Admin UI.
        $stateLimits = RiskSetting::get('state_limits', []);

        $defaults = [
            'max_spend_1h' => 100000,
            'max_spend_24h' => 500000,
            'max_spend_7d' => 1000000,
            'max_new_creators_24h' => 1,
            'guest_allowed' => true,
            'cooldown_minutes' => 15,
            'step_up_threshold' => 150000,
            'review_hold_threshold' => 250000,
        ];

        $currentLimits = $stateLimits[$state] ?? ($stateLimits['NORMAL'] ?? []);

        $currentLimits = array_merge($defaults, $currentLimits);

        return $currentLimits;
    }
}
