<?php

namespace App\Services\Risk;

use App\Models\CreatorMetric;
use App\Models\RiskSetting;
use App\Models\User;
use Carbon\Carbon;

class ReservePolicy
{
    public function getOnboardingAgeDays(): int
    {
        $creatorRules = RiskSetting::get('creator_rules', []);

        return (int) ($creatorRules['new_creator_age_days'] ?? 30);
    }

    /**
     * The anchor for the new-creator onboarding window is when the creator CONNECTED STRIPE
     * (i.e. became able to earn) — not when their account was created. Falls back to created_at
     * only for legacy creators who connected before stripe_connected_at was tracked.
     */
    public function getOnboardingAnchor(User $creator): ?Carbon
    {
        $anchor = $creator->stripe_connected_at ?: $creator->created_at;

        return $anchor ? Carbon::parse($anchor) : null;
    }

    public function getOnboardingReservePercent(User $creator, ?Carbon $at = null): int
    {
        $at = $at ?: Carbon::now();
        $ageDays = $this->getOnboardingAgeDays();
        $anchor = $this->getOnboardingAnchor($creator);
        if (! $anchor) {
            return 0;
        }

        $daysSinceConnected = (int) $anchor->copy()->startOfDay()->diffInDays($at->copy()->startOfDay());

        return $daysSinceConnected <= $ageDays ? 10 : 0;
    }

    public function getEffectiveReservePercent(User $creator, ?CreatorMetric $metric = null, ?Carbon $at = null): int
    {
        $metricPercent = (int) ($metric?->reserve_percent ?? 0);
        $onboardingPercent = $this->getOnboardingReservePercent($creator, $at);

        return max(0, min(100, max($metricPercent, $onboardingPercent)));
    }

    public function getReservePolicySummary(User $creator, ?CreatorMetric $metric = null, ?Carbon $at = null): array
    {
        $at = $at ?: Carbon::now();
        $ageDays = $this->getOnboardingAgeDays();
        $onboardingPercent = $this->getOnboardingReservePercent($creator, $at);
        $metricPercent = (int) ($metric?->reserve_percent ?? 0);
        $effectivePercent = $this->getEffectiveReservePercent($creator, $metric, $at);

        $onboardingEndsAt = null;
        $onboardingDaysRemaining = 0;
        $anchor = $this->getOnboardingAnchor($creator);
        if ($anchor) {
            $end = $anchor->copy()->addDays($ageDays)->startOfDay();
            $onboardingEndsAt = $end->toDateString();
            $onboardingDaysRemaining = max(0, $at->copy()->startOfDay()->diffInDays($end, false));
        }

        return [
            'onboarding_age_days' => $ageDays,
            'onboarding_percent' => $onboardingPercent,
            'risk_percent' => $metricPercent,
            'effective_percent' => $effectivePercent,
            'onboarding_ends_at' => $onboardingEndsAt,
            'onboarding_days_remaining' => $onboardingDaysRemaining,
            'risk_level' => $metric?->risk_level,
        ];
    }
}
