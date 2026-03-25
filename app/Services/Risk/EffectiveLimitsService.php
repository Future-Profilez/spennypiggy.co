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
        // Prefer per-state limits; fall back to global_limits for NORMAL if needed.
        $stateLimits = RiskSetting::get('state_limits', []);
        $globalLimits = RiskSetting::get('global_limits', []);

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

        $normalFromGlobal = [
            'max_spend_1h' => $globalLimits['max_spend_1h'] ?? $defaults['max_spend_1h'],
            'max_spend_24h' => $globalLimits['max_spend_24h'] ?? $defaults['max_spend_24h'],
            'max_spend_7d' => $globalLimits['max_spend_7d'] ?? $defaults['max_spend_7d'],
            'max_new_creators_24h' => $globalLimits['max_creators_per_day'] ?? $defaults['max_new_creators_24h'],
            'guest_allowed' => $globalLimits['guest_allowed'] ?? $defaults['guest_allowed'],
            'cooldown_minutes' => $defaults['cooldown_minutes'],
            'step_up_threshold' => $defaults['step_up_threshold'],
            'review_hold_threshold' => $defaults['review_hold_threshold'],
        ];

        $currentLimits = $stateLimits[$state] ?? ($stateLimits['NORMAL'] ?? $normalFromGlobal);

        $currentLimits = array_merge($defaults, $currentLimits);
        if (!isset($currentLimits['max_new_creators_24h']) && isset($currentLimits['max_creators_per_day'])) {
            $currentLimits['max_new_creators_24h'] = $currentLimits['max_creators_per_day'];
        }

        $globalCaps = [
            'max_spend_1h' => $globalLimits['max_spend_1h'] ?? null,
            'max_spend_24h' => $globalLimits['max_spend_24h'] ?? null,
            'max_spend_7d' => $globalLimits['max_spend_7d'] ?? null,
            'max_new_creators_24h' => $globalLimits['max_creators_per_day'] ?? null,
            'guest_allowed' => $globalLimits['guest_allowed'] ?? null,
        ];

        foreach (['max_spend_1h', 'max_spend_24h', 'max_spend_7d', 'max_new_creators_24h'] as $k) {
            if (is_numeric($globalCaps[$k])) {
                $currentLimits[$k] = min((int) $currentLimits[$k], (int) $globalCaps[$k]);
            }
        }

        if (is_bool($globalCaps['guest_allowed']) && $globalCaps['guest_allowed'] === false) {
            $currentLimits['guest_allowed'] = false;
        }

        return $currentLimits;
    }
}
